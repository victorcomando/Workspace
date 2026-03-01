import { useEffect, useMemo, useState } from 'react';

type SalarySummary = {
  totalDailyEarnings: number;
  totalFixedEarnings: number;
  totalMonthlyEarnings: number;
  details?: {
    unmatchedJobs?: string[];
  };
};

type Workday = {
  id: number;
  date: string;
  jobName: string;
  worked: boolean;
};

type WorkdaysResponse = {
  data: Workday[];
};

type SalaryConfig = {
  id: number;
  local: string;
  tipo: 'diaria' | 'fixo';
  valor: number;
};

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => numberFormatter.format(value);
const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

export const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salarySummary, setSalarySummary] = useState<SalarySummary | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'salary' | 'work' | 'coming'>('salary');

  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [workLoading, setWorkLoading] = useState(false);
  const [workError, setWorkError] = useState<string | null>(null);
  const [includeValues, setIncludeValues] = useState(false);
  const [selectedJob, setSelectedJob] = useState('all');
  const [workMessage, setWorkMessage] = useState('');

  const fetchSalarySummary = async (targetMonth: number, targetYear: number) => {
    setSalaryLoading(true);
    setSalaryError(null);
    try {
      const response = await fetch(
        `/api/v1/salary/summary?month=${targetMonth}&year=${targetYear}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalarySummary = await response.json();
      setSalarySummary(data);
    } catch (e) {
      setSalaryError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalaryLoading(false);
    }
  };

  const fetchWorkdays = async (targetMonth: number, targetYear: number) => {
    const start = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString();

    setWorkLoading(true);
    setWorkError(null);
    try {
      const response = await fetch(
        `/api/v1/workdays?page=1&limit=500&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const payload: WorkdaysResponse = await response.json();
      setWorkdays(payload.data ?? []);
    } catch (e) {
      setWorkdays([]);
      setWorkError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setWorkLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/v1/salary/configs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalaryConfig[] = await response.json();
      setConfigs(data ?? []);
    } catch {
      setConfigs([]);
    }
  };

  useEffect(() => {
    void fetchSalarySummary(month, year);
    void fetchWorkdays(month, year);
  }, [month, year]);

  useEffect(() => {
    if (activeTab === 'work') {
      void fetchConfigs();
    }
  }, [activeTab]);

  const availableJobs = useMemo(() => {
    const uniqueJobs = Array.from(
      new Set(workdays.map((item) => item.jobName.trim()).filter((name) => name.length > 0)),
    );
    return uniqueJobs.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [workdays]);

  useEffect(() => {
    if (selectedJob === 'all') {
      return;
    }
    const stillExists = availableJobs.some((job) => job === selectedJob);
    if (!stillExists) {
      setSelectedJob('all');
    }
  }, [availableJobs, selectedJob]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prevYear) => prevYear - 1);
    } else {
      setMonth((prevMonth) => prevMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prevYear) => prevYear + 1);
    } else {
      setMonth((prevMonth) => prevMonth + 1);
    }
  };

  const generateWorkMessage = () => {
    const configMap = new Map(configs.map((item) => [item.local.trim().toLowerCase(), item]));
    const selectedJobName = selectedJob === 'all' ? null : selectedJob;
    const sorted = [...workdays]
      .filter((item) => (selectedJobName ? item.jobName === selectedJobName : true))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) {
      setWorkMessage(
        selectedJobName
          ? `Relatório de trabalhos - ${monthNames[month - 1]}/${year}\n\nNenhum trabalho registrado para ${selectedJobName}.`
          : `Relatório de trabalhos - ${monthNames[month - 1]}/${year}\n\nNenhum trabalho registrado neste mês.`,
      );
      return;
    }

    const lines = sorted.map((item) => {
      const mark = item.worked ? 'x' : ' ';
      const base = `( ${mark} ) ${formatDate(item.date)}`;
      const suffixJob = selectedJobName ? '' : ` - ${item.jobName}`;
      if (selectedJobName) {
        return `${base}${suffixJob}`;
      }
      if (!includeValues) {
        return `${base}${suffixJob}`;
      }

      const config = configMap.get(item.jobName.trim().toLowerCase());
      if (!item.worked) {
        return `${base}${suffixJob}`;
      }
      if (!config) {
        return `${base}${suffixJob} - sem valor`;
      }
      if (config.tipo === 'fixo') {
        return `${base}${suffixJob} - fixo mensal`;
      }
      return `${base}${suffixJob} - R$ ${formatMoney(config.valor)}`;
    });

    if (selectedJobName) {
      const selectedConfig = configMap.get(selectedJobName.trim().toLowerCase());
      const workedCount = sorted.filter((item) => item.worked).length;
      const totalCount = sorted.length;
      const totalToReceive =
        selectedConfig?.tipo === 'diaria'
          ? workedCount * selectedConfig.valor
          : selectedConfig?.tipo === 'fixo' && workedCount > 0
            ? selectedConfig.valor
            : 0;

      const headerWithValue =
        includeValues && selectedConfig
          ? `${selectedJobName} (R$ ${formatMoney(selectedConfig.valor)})`
          : selectedJobName;

      const totalsLine = `Total de trabalhos: ${totalCount} | Dias trabalhados: ${workedCount} | Total a receber: R$ ${formatMoney(totalToReceive)}`;

      setWorkMessage(`${headerWithValue}\n${lines.join('\n')}\n\n${totalsLine}`);
      return;
    }

    const jobs = Array.from(new Set(sorted.map((item) => item.jobName)));
    const groupedSections: string[] = [];
    let grandTotalToReceive = 0;

    for (const jobName of jobs) {
      const jobItems = sorted.filter((item) => item.jobName === jobName);
      const workedCount = jobItems.filter((item) => item.worked).length;
      const totalCount = jobItems.length;
      const config = configMap.get(jobName.trim().toLowerCase());
      const totalToReceive =
        config?.tipo === 'diaria'
          ? workedCount * config.valor
          : config?.tipo === 'fixo' && workedCount > 0
            ? config.valor
            : 0;

      grandTotalToReceive += totalToReceive;

      const header =
        includeValues && config ? `${jobName} (R$ ${formatMoney(config.valor)})` : jobName;
      const jobLines = jobItems
        .map((item) => {
          const mark = item.worked ? 'x' : ' ';
          return `( ${mark} ) ${formatDate(item.date)}`;
        })
        .join('\n');

      groupedSections.push(
        `${header}\n${jobLines}\n\nTotal de trabalhos: ${totalCount} | Dias trabalhados: ${workedCount} | Total a receber: R$ ${formatMoney(totalToReceive)}`,
      );
    }

    setWorkMessage(
      `Relatório de trabalhos - ${monthNames[month - 1]}/${year}\n\n${groupedSections.join('\n\n')}\n\nSoma total a receber: R$ ${formatMoney(grandTotalToReceive)}`,
    );
  };

  const copyWorkMessage = async () => {
    if (!workMessage.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(workMessage);
    } catch {
      /* noop */
    }
  };

  const monthNames = [
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

  return (
    <section className="page-shell reports-page">
      <header className="reports-header">
        <h1>Relatórios</h1>
        <div className="reports-tabs" role="tablist" aria-label="Abas de relatórios">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'salary'}
            className={`reports-tab ${activeTab === 'salary' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            Salários
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'work'}
            className={`reports-tab ${activeTab === 'work' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            Trabalhos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coming'}
            className={`reports-tab ${activeTab === 'coming' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('coming')}
          >
            Em construção
          </button>
        </div>
      </header>

      {(activeTab === 'salary' || activeTab === 'work') && (
        <div className="reports-month-nav">
          <button type="button" className="pager-btn" onClick={handlePreviousMonth}>
            Mês Anterior
          </button>
          <strong>
            {monthNames[month - 1]} de {year}
          </strong>
          <button type="button" className="pager-btn" onClick={handleNextMonth}>
            Próximo Mês
          </button>
        </div>
      )}

      {activeTab === 'salary' && (
        <>
          {salaryError && <p className="modal-error reports-error">Erro: {salaryError}</p>}

          <article className="reports-card">
            <h3>Resumo Mensal</h3>
            {salaryLoading && <p className="notes-state">Carregando resumo...</p>}

            {salarySummary && !salaryLoading && (
              <div className="summary-kpis">
                <div className="summary-kpi">
                  <span className="label">Ganhos Diários</span>
                  <span className="value">R$ {formatMoney(salarySummary.totalDailyEarnings)}</span>
                </div>
                <div className="summary-kpi">
                  <span className="label">Ganhos Fixos</span>
                  <span className="value">R$ {formatMoney(salarySummary.totalFixedEarnings)}</span>
                </div>
                <div className="summary-kpi summary-kpi--total">
                  <span className="label">Total Mensal</span>
                  <span className="value">R$ {formatMoney(salarySummary.totalMonthlyEarnings)}</span>
                </div>
              </div>
            )}

          </article>
        </>
      )}

      {activeTab === 'work' && (
        <article className="reports-card">
          <h3>Exportar Trabalhos</h3>
          <div className="reports-work-controls">
            <label className="reports-check">
              <span>Emprego</span>
              <select
                className="reports-job-select"
                value={selectedJob}
                onChange={(event) => setSelectedJob(event.target.value)}
              >
                <option value="all">Todos</option>
                {availableJobs.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </label>
            <label className="reports-check">
              <input
                type="checkbox"
                checked={includeValues}
                onChange={(event) => setIncludeValues(event.target.checked)}
              />
              <span>Exportar com valores</span>
            </label>
            <button type="button" className="pager-btn btn-brand" onClick={generateWorkMessage}>
              Gerar mensagem
            </button>
            <button type="button" className="pager-btn" onClick={() => void copyWorkMessage()}>
              Copiar
            </button>
          </div>

          {workLoading && <p className="notes-state">Carregando trabalhos...</p>}
          {workError && <p className="modal-error reports-error">Erro: {workError}</p>}

          {!workLoading && (
            <div className="reports-export-box">
              <textarea
                className="reports-export-textarea"
                value={workMessage}
                onChange={(event) => setWorkMessage(event.target.value)}
                placeholder="Clique em 'Gerar mensagem' para montar o relatório do mês."
              />
            </div>
          )}
        </article>
      )}

      {activeTab === 'coming' && (
        <article className="reports-card">
          <h3>Aba em construção</h3>
          <p className="notes-state">Esta seção será implementada em breve.</p>
        </article>
      )}
    </section>
  );
};
