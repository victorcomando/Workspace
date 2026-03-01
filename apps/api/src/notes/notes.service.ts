import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, page = 1, limit = 50, query?: string) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 50;
    const skip = (safePage - 1) * safeLimit;

    const normalizedQuery = query?.trim();
    const where: Prisma.NoteWhereInput = {
      ownerId: userId,
      ...(normalizedQuery
        ? {
            OR: [
              { title: { contains: normalizedQuery } },
              { content: { contains: normalizedQuery } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async create(
    userId: number,
    input: {
      title: string;
      content?: string | null;
      pinned?: boolean;
    },
  ) {
    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('title e obrigatorio');
    }
    if (
      typeof input.content !== 'undefined' &&
      input.content !== null &&
      typeof input.content !== 'string'
    ) {
      throw new BadRequestException('content invalido');
    }

    return this.prisma.note.create({
      data: {
        title,
        content: input.content?.trim() || null,
        pinned: Boolean(input.pinned),
        ownerId: userId,
      },
    });
  }

  async update(
    userId: number,
    id: number,
    input: {
      title?: string;
      content?: string | null;
      pinned?: boolean;
    },
  ) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.note.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('nota nao encontrada');
    }

    const data: Prisma.NoteUpdateInput = {};

    if (typeof input.title === 'string') {
      const title = input.title.trim();
      if (!title) {
        throw new BadRequestException('title e obrigatorio');
      }
      data.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'content')) {
      if (
        typeof input.content !== 'undefined' &&
        input.content !== null &&
        typeof input.content !== 'string'
      ) {
        throw new BadRequestException('content invalido');
      }
      data.content = input.content?.trim() || null;
    }

    if (typeof input.pinned === 'boolean') {
      data.pinned = input.pinned;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('nenhum campo para atualizar');
    }

    return this.prisma.note.update({
      where: { id },
      data,
    });
  }

  async remove(userId: number, id: number) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.note.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('nota nao encontrada');
    }

    await this.prisma.note.delete({
      where: { id },
    });

    return { success: true };
  }
}
