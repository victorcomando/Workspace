import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkdaysService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private async resolveSalaryConfigId(userId: number, jobName: string) {
    const normalizedJobName = this.normalizeText(jobName);
    const configs = await this.prisma.salaryConfig.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        local: true,
      },
    });

    const match = configs.find(
      (config) => this.normalizeText(config.local) === normalizedJobName,
    );

    return match?.id ?? null;
  }

  async findAll(
    userId: number,
    page = 1,
    limit = 30,
    start?: string,
    end?: string,
  ) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 30;
    const skip = (safePage - 1) * safeLimit;
    const where: Prisma.WorkDayWhereInput = { ownerId: userId };

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    if (
      startDate &&
      endDate &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime())
    ) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.workDay.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { date: 'asc' },
      }),
      this.prisma.workDay.count({ where }),
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
      date: string;
      jobName: string;
      worked?: boolean;
      obs?: string | null;
    },
  ) {
    const name = input.jobName?.trim();
    if (!name) {
      throw new BadRequestException('jobName e obrigatorio');
    }
    if (!input.date) {
      throw new BadRequestException('date e obrigatoria');
    }

    const parsed = new Date(`${input.date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('date invalida');
    }
    if (
      typeof input.obs !== 'undefined' &&
      input.obs !== null &&
      typeof input.obs !== 'string'
    ) {
      throw new BadRequestException('obs invalida');
    }

    const normalizedObs = input.obs?.trim() || null;
    const salaryConfigId = await this.resolveSalaryConfigId(userId, name);

    const data: Prisma.WorkDayUncheckedCreateInput = {
      date: parsed,
      jobName: name,
      worked: Boolean(input.worked),
      obs: normalizedObs,
      ownerId: userId,
      salaryConfigId: salaryConfigId ?? null,
    };

    return this.prisma.workDay.create({ data });
  }

  async update(
    userId: number,
    id: number,
    input: {
      date?: string;
      jobName?: string;
      worked?: boolean;
      obs?: string | null;
    },
  ) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.workDay.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('workday nao encontrado');
    }

    const data: Prisma.WorkDayUncheckedUpdateInput = {};

    if (typeof input.jobName === 'string') {
      const name = input.jobName.trim();
      if (!name) {
        throw new BadRequestException('jobName e obrigatorio');
      }
      data.jobName = name;

      const salaryConfigId = await this.resolveSalaryConfigId(userId, name);
      data.salaryConfigId = salaryConfigId ?? null;
    }

    if (typeof input.worked === 'boolean') {
      data.worked = input.worked;
    }

    if (typeof input.date === 'string') {
      const parsed = new Date(`${input.date}T12:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('date invalida');
      }
      data.date = parsed;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'obs')) {
      if (
        typeof input.obs !== 'undefined' &&
        input.obs !== null &&
        typeof input.obs !== 'string'
      ) {
        throw new BadRequestException('obs invalida');
      }
      data.obs = input.obs?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('nenhum campo para atualizar');
    }

    return this.prisma.workDay.update({
      where: { id },
      data,
    });
  }

  async delete(userId: number, id: number) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.workDay.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('workday nao encontrado');
    }

    return this.prisma.workDay.delete({ where: { id } });
  }
}
