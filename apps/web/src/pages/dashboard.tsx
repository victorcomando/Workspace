import { useEffect, useMemo, useState } from "react";

type Workday = {
  id: number;
  date: string;
  jobName: string;
  worked: boolean;
};

type WorkdaysResponse = {
  data: Workday[];
};

type NotesResponse = {
  data: Array<{ id: number }>;
};

type SalarySummary = {
  totalMonthlyEarnings: number;
  details?: {
    unmatchedJobs?: string[];
  };
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const DashboardPage = () => {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [unmatchedJobs, setUnmatchedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { month: now.getMonth() + 1, year: now.getFullYear(), start, end };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [workdaysRes, notesRes, summaryRes] = await Promise.all([
          fetch(
            `/api/v1/workdays?page=1&limit=500&start=${encodeURIComponent(monthRange.start.toISOString())}&end=${encodeURIComponent(monthRange.end.toISOString())}`,
          ),
          fetch("/api/v1/notes?page=1&limit=1"),
          fetch(
            `/api/v1/salary/summary?month=${monthRange.month}&year=${monthRange.year}`,
          ),
        ]);

        if (workdaysRes.ok) {
          const payload = (await workdaysRes.json()) as WorkdaysResponse;
          setWorkdays(payload.data ?? []);
        } else {
          setWorkdays([]);
        }

        if (notesRes.ok) {
          const payload = (await notesRes.json()) as NotesResponse & {
            pagination?: { total?: number };
          };
          setNotesCount(payload.pagination?.total ?? payload.data?.length ?? 0);
        } else {
          setNotesCount(0);
        }

        if (summaryRes.ok) {
          const payload = (await summaryRes.json()) as SalarySummary;
          setMonthlyTotal(payload.totalMonthlyEarnings ?? 0);
          setUnmatchedJobs(payload.details?.unmatchedJobs ?? []);
        } else {
          setMonthlyTotal(0);
          setUnmatchedJobs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [monthRange]);

  const workedCount = workdays.filter((item) => item.worked).length;
  const pendingCount = workdays.length - workedCount;
  const upcomingJobs = workdays
    .filter((item) => !item.worked)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <section className="dashboard-grid">
      <article className="dashboard-card dashboard-kpi-card">
        <span className="label">Trabalhos no mês</span>
        <strong className="value">{loading ? "..." : workdays.length}</strong>
      </article>
      <article className="dashboard-card dashboard-kpi-card">
        <span className="label">Dias trabalhados</span>
        <strong className="value">{loading ? "..." : workedCount}</strong>
      </article>
      <article className="dashboard-card dashboard-kpi-card">
        <span className="label">Pendências</span>
        <strong className="value">{loading ? "..." : pendingCount}</strong>
      </article>
      <article className="dashboard-card dashboard-kpi-card">
        <span className="label">Total do mês</span>
        <strong className="value">
          R$ {loading ? "..." : numberFormatter.format(monthlyTotal)}
        </strong>
      </article>

      <article className="dashboard-card dashboard-main-card">
        <h2 className="dashboard-card__title">Próximos trabalhos</h2>
        {loading && <p className="notes-state">Carregando informações...</p>}
        {!loading && upcomingJobs.length === 0 && (
          <p className="notes-state">Sem pendências para este mês.</p>
        )}
        {!loading && upcomingJobs.length > 0 && (
          <ul className="dashboard-list">
            {upcomingJobs.map((item) => (
              <li key={item.id}>
                <span>{item.jobName}</span>
                <small>{new Date(item.date).toLocaleDateString("pt-BR")}</small>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="dashboard-card dashboard-side-card">
        <h2 className="dashboard-card__title">Visão rápida</h2>
        <div className="dashboard-quick">
          <p>
            <strong>Notas cadastradas:</strong> {loading ? "..." : notesCount}
          </p>
          <p>
            <strong>Sem configuração de salário:</strong>{" "}
            {loading ? "..." : unmatchedJobs.length}
          </p>
        </div>
        {!loading && unmatchedJobs.length > 0 && (
          <p className="notes-state">
            {unmatchedJobs.slice(0, 3).join(", ")}
            {unmatchedJobs.length > 3 ? "..." : ""}
          </p>
        )}
        <div className="dashboard-actions">
          <a className="pager-btn btn-brand" href="/calendar">
            Ir para Calendário
          </a>
          <a className="pager-btn" href="/config">
            Ajustar salários
          </a>
        </div>
      </article>
    </section>
  );
};
