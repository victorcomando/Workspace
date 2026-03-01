import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SalaryTipo = 'diaria' | 'fixo';

type SalaryConfigInput = {
  local: string;
  tipo: string;
  valor: number;
};

@Injectable()
export class SalaryService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizeTipo(tipo: string): SalaryTipo {
    const normalized = this.normalizeText(tipo);
    if (normalized === 'diaria' || normalized === 'fixo') {
      return normalized;
    }
    throw new BadRequestException("tipo deve ser 'diaria' ou 'fixo'");
  }

  private getPrismaErrorCode(error: unknown) {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return undefined;
    }
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }

  private async findConfigByJobName(userId: number, jobName: string) {
    const normalizedJob = this.normalizeText(jobName);
    const configs = await this.prisma.salaryConfig.findMany({
      where: { ownerId: userId },
    });

    return (
      configs.find(
        (config) => this.normalizeText(config.local) === normalizedJob,
      ) ?? null
    );
  }

  async findConfigs(userId: number) {
    return this.prisma.salaryConfig.findMany({
      where: { ownerId: userId },
      orderBy: [{ local: 'asc' }, { id: 'asc' }],
    });
  }

  async findKnownLocals(userId: number) {
    const [configs, workdays] = await Promise.all([
      this.prisma.salaryConfig.findMany({
        where: { ownerId: userId },
        select: { local: true },
        distinct: ['local'],
      }),
      this.prisma.workDay.findMany({
        where: { ownerId: userId },
        select: { jobName: true },
        distinct: ['jobName'],
      }),
    ]);

    const deduped = new Map<string, string>();
    for (const entry of [
      ...configs.map((c) => c.local),
      ...workdays.map((w) => w.jobName),
    ]) {
      const value = entry.trim();
      if (!value) {
        continue;
      }
      const key = this.normalizeText(value);
      if (!deduped.has(key)) {
        deduped.set(key, value);
      }
    }

    return Array.from(deduped.values()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  async createConfig(userId: number, input: SalaryConfigInput) {
    const local = input.local?.trim();
    if (!local) {
      throw new BadRequestException('local e obrigatorio');
    }

    const tipo = this.normalizeTipo(input.tipo);
    const valor = Number(input.valor);
    if (!Number.isFinite(valor) || valor < 0) {
      throw new BadRequestException('valor invalido');
    }

    return this.prisma.salaryConfig.create({
      data: {
        local,
        tipo,
        valor,
        ownerId: userId,
      },
    });
  }

  async updateConfig(
    userId: number,
    id: number,
    input: Partial<SalaryConfigInput>,
  ) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.salaryConfig.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('configuracao de salario nao encontrada');
    }

    const data: {
      local?: string;
      tipo?: SalaryTipo;
      valor?: number;
    } = {};

    if (typeof input.local === 'string') {
      const local = input.local.trim();
      if (!local) {
        throw new BadRequestException('local e obrigatorio');
      }
      data.local = local;
    }

    if (typeof input.tipo === 'string') {
      data.tipo = this.normalizeTipo(input.tipo);
    }

    if (typeof input.valor !== 'undefined') {
      const valor = Number(input.valor);
      if (!Number.isFinite(valor) || valor < 0) {
        throw new BadRequestException('valor invalido');
      }
      data.valor = valor;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('nenhum campo para atualizar');
    }

    try {
      return await this.prisma.salaryConfig.update({
        where: { id },
        data,
      });
    } catch (err: unknown) {
      const code = this.getPrismaErrorCode(err);
      if (code === 'P2025') {
        throw new NotFoundException('configuracao de salario nao encontrada');
      }
      throw err;
    }
  }

  async removeConfig(userId: number, id: number) {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('id invalido');
    }

    const exists = await this.prisma.salaryConfig.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('configuracao de salario nao encontrada');
    }

    await this.prisma.salaryConfig.delete({ where: { id } });
    return { success: true };
  }

  async getMonthlySummary(userId: number, month: number, year: number) {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('mes invalido');
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestException('ano invalido');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const workedDays = await this.prisma.workDay.findMany({
      where: {
        ownerId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        worked: true,
      },
      include: {
        salaryConfig: true,
      },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    });

    let totalDailyEarnings = 0;
    const fixedByLocal = new Map<string, number>();
    const unmatchedJobs = new Set<string>();

    const dailyWorkdays: Array<{
      id: number;
      date: Date;
      jobName: string;
      local: string;
      valor: number;
    }> = [];

    for (const workday of workedDays) {
      const config =
        workday.salaryConfig ??
        (await this.findConfigByJobName(userId, workday.jobName));

      if (!config) {
        unmatchedJobs.add(workday.jobName);
        continue;
      }

      const tipo = this.normalizeTipo(config.tipo);

      if (tipo === 'diaria') {
        totalDailyEarnings += config.valor;
        dailyWorkdays.push({
          id: workday.id,
          date: workday.date,
          jobName: workday.jobName,
          local: config.local,
          valor: config.valor,
        });
      } else {
        const key = this.normalizeText(config.local);
        if (!fixedByLocal.has(key)) {
          fixedByLocal.set(key, config.valor);
        }
      }
    }

    const fixedSalaryConfigs = Array.from(fixedByLocal.entries()).map(
      ([key, valor]) => ({ key, valor }),
    );

    const totalFixedEarnings = fixedSalaryConfigs.reduce(
      (sum, item) => sum + item.valor,
      0,
    );

    return {
      totalDailyEarnings,
      totalFixedEarnings,
      totalMonthlyEarnings: totalDailyEarnings + totalFixedEarnings,
      details: {
        dailyWorkdays,
        fixedSalaryConfigs,
        unmatchedJobs: Array.from(unmatchedJobs),
      },
    };
  }
}
