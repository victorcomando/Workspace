import { useEffect, useState } from 'react';

type SalarySummary = {
  totalDailyEarnings: number;
  totalFixedEarnings: number;
  totalMonthlyEarnings: number;
  details?: {
    unmatchedJobs?: string[];
  };
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'salary' | 'coming'>('salary');

  const fetchSalarySummary = async (targetMonth: number, targetYear: number) => {
    setLoading(true);
    setError(null);
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
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSalarySummary(month, year);
  }, [month, year]);

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
            aria-selected={activeTab === 'coming'}
            className={`reports-tab ${activeTab === 'coming' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('coming')}
          >
            Em construção
          </button>
        </div>
      </header>

      {activeTab === 'salary' && (
        <>
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

          {error && <p className="modal-error reports-error">Erro: {error}</p>}

          <article className="reports-card">
            <h3>Resumo Mensal</h3>
            {loading && <p className="notes-state">Carregando resumo...</p>}

            {salarySummary && !loading && (
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

            {salarySummary?.details?.unmatchedJobs &&
              salarySummary.details.unmatchedJobs.length > 0 && (
                <p className="notes-state">
                  Trabalhos sem configuração: {salarySummary.details.unmatchedJobs.join(', ')}
                </p>
              )}

            <p className="notes-state">Configurações de salário disponíveis na página Configurações.</p>
          </article>
        </>
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
