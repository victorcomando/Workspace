import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  private readonly moneyFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
  });

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizeTipo(tipo: string) {
    const normalized = this.normalizeText(tipo);
    if (normalized === 'diaria' || normalized === 'fixo') {
      return normalized;
    }
    throw new BadRequestException("tipo deve ser 'diaria' ou 'fixo'");
  }

  private parseIncludeValues(raw?: string) {
    if (!raw) {
      return false;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  private parseWorkedOnly(raw?: string) {
    if (!raw) {
      return false;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  private validateExportType(raw?: string) {
    const exportType = raw?.trim().toLowerCase() || 'message';
    if (exportType !== 'message') {
      throw new BadRequestException("exportType deve ser 'message'");
    }
    return exportType;
  }

  private formatMoney(value: number) {
    return this.moneyFormatter.format(value);
  }

  private formatDate(value: Date) {
    return this.dateFormatter.format(value);
  }

  async getWorkExport(
    userId: number,
    params: {
      month: number;
      year: number;
      job?: string;
      exportType?: string;
      includeValues?: string;
      workedOnly?: string;
    },
  ) {
    const { month, year } = params;
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('mes invalido');
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new BadRequestException('ano invalido');
    }

    const normalizedJob = params.job?.trim() || 'all';
    const selectedJobName = normalizedJob === 'all' ? null : normalizedJob;
    this.validateExportType(params.exportType);
    const includeValues = this.parseIncludeValues(params.includeValues);
    const workedOnly = this.parseWorkedOnly(params.workedOnly);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [workdays, configs] = await Promise.all([
      this.prisma.workDay.findMany({
        where: {
          ownerId: userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(workedOnly ? { worked: true } : {}),
          ...(selectedJobName ? { jobName: selectedJobName } : {}),
        },
        select: {
          id: true,
          date: true,
          jobName: true,
          worked: true,
        },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.salaryConfig.findMany({
        where: { ownerId: userId },
        select: {
          local: true,
          tipo: true,
          valor: true,
        },
      }),
    ]);

    if (workdays.length === 0) {
      const emptyReason = workedOnly
        ? 'Nenhum dia trabalhado encontrado para este filtro.'
        : selectedJobName
          ? `Nenhum trabalho registrado para ${selectedJobName}.`
          : 'Nenhum trabalho registrado neste mês.';
      return {
        message: `Relatório de trabalhos - ${this.monthNames[month - 1]}/${year}\n\n${emptyReason}`,
      };
    }

    const configMap = new Map<
      string,
      {
        local: string;
        tipo: string;
        valor: number;
      }
    >();

    for (const config of configs) {
      const key = this.normalizeText(config.local);
      if (!configMap.has(key)) {
        configMap.set(key, config);
      }
    }

    const lines = workdays.map((item) => {
      const mark = item.worked ? 'x' : ' ';
      const base = `( ${mark} ) ${this.formatDate(item.date)}`;
      const suffixJob = selectedJobName ? '' : ` - ${item.jobName}`;

      if (selectedJobName || !includeValues || !item.worked) {
        return `${base}${suffixJob}`;
      }

      const config = configMap.get(this.normalizeText(item.jobName));
      if (!config) {
        return `${base}${suffixJob} - sem valor`;
      }

      const tipo = this.normalizeTipo(config.tipo);
      if (tipo === 'fixo') {
        return `${base}${suffixJob} - fixo mensal`;
      }

      return `${base}${suffixJob} - R$ ${this.formatMoney(config.valor)}`;
    });

    if (selectedJobName) {
      const selectedConfig = configMap.get(this.normalizeText(selectedJobName));
      const workedCount = workdays.filter((item) => item.worked).length;
      const totalCount = workdays.length;
      const selectedValor = selectedConfig?.valor ?? 0;
      const selectedTipo = selectedConfig
        ? this.normalizeTipo(selectedConfig.tipo)
        : null;
      const totalToReceive =
        selectedTipo === 'diaria'
          ? workedCount * selectedValor
          : selectedTipo === 'fixo' && workedCount > 0
            ? selectedValor
            : 0;

      const headerWithValue =
        includeValues && selectedConfig
          ? `${selectedJobName} (R$ ${this.formatMoney(selectedValor)})`
          : selectedJobName;
      const totalsLine = workedOnly
        ? `Dias trabalhados: ${workedCount} | Total a receber: R$ ${this.formatMoney(totalToReceive)}`
        : `Total de trabalhos: ${totalCount} | Dias trabalhados: ${workedCount} | Total a receber: R$ ${this.formatMoney(totalToReceive)}`;

      return {
        message: `${headerWithValue}\n${lines.join('\n')}\n\n${totalsLine}`,
      };
    }

    const jobs = Array.from(new Set(workdays.map((item) => item.jobName)));
    const groupedSections: string[] = [];
    let grandTotalToReceive = 0;

    for (const jobName of jobs) {
      const jobItems = workdays.filter((item) => item.jobName === jobName);
      const workedCount = jobItems.filter((item) => item.worked).length;
      const totalCount = jobItems.length;
      const config = configMap.get(this.normalizeText(jobName));
      const configValor = config?.valor ?? 0;
      const tipo = config ? this.normalizeTipo(config.tipo) : null;
      const totalToReceive =
        tipo === 'diaria'
          ? workedCount * configValor
          : tipo === 'fixo' && workedCount > 0
            ? configValor
            : 0;

      grandTotalToReceive += totalToReceive;

      const header =
        includeValues && config
          ? `${jobName} (R$ ${this.formatMoney(configValor)})`
          : jobName;
      const jobLines = jobItems
        .map((item) => {
          const mark = item.worked ? 'x' : ' ';
          return `( ${mark} ) ${this.formatDate(item.date)}`;
        })
        .join('\n');

      groupedSections.push(
        workedOnly
          ? `${header}\n${jobLines}\n\nDias trabalhados: ${workedCount} | Total a receber: R$ ${this.formatMoney(totalToReceive)}`
          : `${header}\n${jobLines}\n\nTotal de trabalhos: ${totalCount} | Dias trabalhados: ${workedCount} | Total a receber: R$ ${this.formatMoney(totalToReceive)}`,
      );
    }

    return {
      message: `Relatório de trabalhos - ${this.monthNames[month - 1]}/${year}\n\n${groupedSections.join('\n\n')}\n\nSoma total a receber: R$ ${this.formatMoney(grandTotalToReceive)}`,
    };
  }
}
