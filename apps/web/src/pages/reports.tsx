import { useEffect, useMemo, useState } from 'react';
import { useAppToast } from '../hooks/use-app-toast.tsx';

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

type WorkExportResponse = {
  message: string;
};

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => numberFormatter.format(value);

export const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salarySummary, setSalarySummary] = useState<SalarySummary | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'salary' | 'work' | 'coming'>('salary');

  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [workLoading, setWorkLoading] = useState(false);
  const [includeValues, setIncludeValues] = useState(false);
  const [selectedJob, setSelectedJob] = useState('all');
  const [workMessage, setWorkMessage] = useState('');
  const { showToast, toaster } = useAppToast();

  const fetchSalarySummary = async (targetMonth: number, targetYear: number) => {
    setSalaryLoading(true);
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
      showToast(e instanceof Error ? e.message : 'Erro desconhecido', {
        title: 'Relatórios',
        color: 'danger',
      });
    } finally {
      setSalaryLoading(false);
    }
  };

  const fetchWorkdays = async (targetMonth: number, targetYear: number) => {
    const start = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString();

    setWorkLoading(true);
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
      showToast(e instanceof Error ? e.message : 'Erro desconhecido', {
        title: 'Relatórios',
        color: 'danger',
      });
    } finally {
      setWorkLoading(false);
    }
  };

  useEffect(() => {
    void fetchSalarySummary(month, year);
    void fetchWorkdays(month, year);
  }, [month, year]);

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

  const generateWorkMessage = async () => {
    setWorkLoading(true);

    try {
      const response = await fetch(
        `/api/v1/reports/work-export?month=${month}&year=${year}&job=${encodeURIComponent(selectedJob)}&includeValues=${includeValues ? 'true' : 'false'}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const payload: WorkExportResponse = await response.json();
      setWorkMessage(payload.message ?? '');
    } catch (error) {
      setWorkMessage('');
      showToast(error instanceof Error ? error.message : 'Erro desconhecido', {
        title: 'Relatórios',
        color: 'danger',
      });
    } finally {
      setWorkLoading(false);
    }
  };

  const copyWorkMessage = async () => {
    if (!workMessage.trim()) {
      showToast('Nada para copiar.', {
        title: 'Relatórios',
        color: 'warning',
      });
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(workMessage);
        showToast('Mensagem copiada.', { title: 'Relatórios', color: 'success' });
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = workMessage;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (!copied) {
        throw new Error('Falha ao copiar');
      }

      showToast('Mensagem copiada.', { title: 'Relatórios', color: 'success' });
    } catch {
      showToast('Falha ao copiar. Copie manualmente a caixa de texto.', {
        title: 'Relatórios',
        color: 'danger',
      });
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
            <button
              type="button"
              className="pager-btn btn-brand"
              onClick={() => void generateWorkMessage()}
            >
              Gerar mensagem
            </button>
            <button type="button" className="pager-btn" onClick={() => void copyWorkMessage()}>
              Copiar
            </button>
          </div>

          {workLoading && <p className="notes-state">Carregando trabalhos...</p>}
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
      {toaster}
    </section>
  );
};
