import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth-user.type';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');

    if (candidate.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(candidate, expected);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private validateCredentials(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('email invalido');
    }

    if (!password || password.length < 6) {
      throw new BadRequestException('senha deve ter ao menos 6 caracteres');
    }

    return normalizedEmail;
  }

  private async createSession(
    userId: number,
    email: string,
  ): Promise<AuthResponse> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    // Single-session mode with transaction to avoid race conditions on concurrent logins.
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({
        where: { userId },
      });

      await tx.authSession.create({
        data: {
          tokenHash,
          userId,
          expiresAt,
        },
      });
    });

    return {
      token: rawToken,
      user: {
        id: userId,
        email,
      },
    };
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = this.validateCredentials(email, password);

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('email ja cadastrado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: this.hashPassword(password),
      },
      select: {
        id: true,
        email: true,
      },
    });

    return this.createSession(user.id, user.email);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = this.validateCredentials(email, password);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('credenciais invalidas');
    }

    return this.createSession(user.id, user.email);
  }

  async validateToken(rawToken: string): Promise<AuthUser> {
    const token = rawToken.trim();
    if (!token) {
      throw new UnauthorizedException('token invalido');
    }

    const tokenHash = this.hashToken(token);

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('sessao invalida ou expirada');
    }

    const latestSession = await this.prisma.authSession.findFirst({
      where: { userId: session.userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });

    if (!latestSession || latestSession.id !== session.id) {
      throw new UnauthorizedException('sessao invalida ou expirada');
    }

    return {
      id: session.user.id,
      email: session.user.email,
    };
  }

  async logout(rawToken: string) {
    const token = rawToken.trim();
    if (!token) {
      return { success: true };
    }

    await this.prisma.authSession.deleteMany({
      where: { tokenHash: this.hashToken(token) },
    });

    return { success: true };
  }
}
