import { useEffect, useMemo, useState } from 'react';
import { CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';
import { AppModal } from '../components/app-modal.tsx';
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
  generatedAt: string;
  exportType: 'message' | 'pdf' | 'spreadsheet';
  filters: {
    month: number;
    year: number;
    job: string;
    includeValues: boolean;
    workedOnly: boolean;
  };
  summary: {
    totalCount: number;
    workedCount: number;
    totalReceivable: number;
  };
  items: Array<{
    id: number;
    date: string;
    jobName: string;
    worked: boolean;
    status: 'Trabalhado' | 'Pendente';
    paymentType: 'diaria' | 'fixo' | null;
    baseAmount: number | null;
    receivableAmount: number;
  }>;
};

type ExportType = 'message' | 'pdf' | 'spreadsheet';

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => numberFormatter.format(value);
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export const ReportsPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salarySummary, setSalarySummary] = useState<SalarySummary | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'salary' | 'work' | 'coming'>('salary');

  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [workLoading, setWorkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('message');
  const [includeValues, setIncludeValues] = useState(false);
  const [workedOnly, setWorkedOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState('all');
  const [exportModalVisible, setExportModalVisible] = useState(false);
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

  const filteredWorkdays = useMemo(() => {
    const selectedJobName = selectedJob === 'all' ? null : selectedJob;
    return [...workdays]
      .filter((item) => (selectedJobName ? item.jobName === selectedJobName : true))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [workdays, selectedJob]);

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

  const downloadBasePdf = async (text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      showToast('Nada para exportar em PDF.', {
        title: 'Relatórios',
        color: 'warning',
      });
      return;
    }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    const title = 'Relatorio de Trabalhos';
    const subtitle = `Periodo: ${monthNames[month - 1]} de ${year}`;
    const jobLabel = selectedJob === 'all' ? 'Todos' : selectedJob;
    const filters = `Emprego: ${jobLabel} | Somente trabalhados: ${
      workedOnly ? 'Sim' : 'Nao'
    } | Com valores: ${includeValues ? 'Sim' : 'Nao'}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 40, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitle, 40, 70);
    doc.text(filters, 40, 85);

    doc.setDrawColor(210, 210, 210);
    doc.line(40, 94, 555, 94);

    doc.setFontSize(11);
    const wrappedLines = doc.splitTextToSize(normalizedText, 515);
    doc.text(wrappedLines, 40, 114);

    const monthPadded = month < 10 ? `0${month}` : String(month);
    doc.save(`relatorio-${year}-${monthPadded}.pdf`);
    showToast('PDF base gerado.', { title: 'Relatórios', color: 'success' });
  };

  const copyToClipboard = async (text: string) => {
    if (!text.trim()) {
      showToast('Nada para copiar.', {
        title: 'Relatórios',
        color: 'warning',
      });
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast('Exportação copiada.', { title: 'Relatórios', color: 'success' });
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
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

      showToast('Exportação copiada.', { title: 'Relatórios', color: 'success' });
    } catch {
      showToast('Falha ao copiar exportação.', {
        title: 'Relatórios',
        color: 'danger',
      });
    }
  };

  const downloadSpreadsheet = async (payload: WorkExportResponse) => {
    const headers = includeValues
      ? [
          'Data',
          'Trabalho',
          'Status',
          'Tipo',
          'Valor Base (R$)',
          'Recebimento (R$)',
        ]
      : ['Data', 'Trabalho', 'Status'];

    const rows = payload.items.map((item) => {
      const baseRow = [new Date(item.date), item.jobName, item.status];

      if (!includeValues) {
        return baseRow;
      }

      const paymentTypeLabel =
        item.paymentType === 'diaria'
          ? 'Diária'
          : item.paymentType === 'fixo'
            ? 'Fixo'
            : '-';

      return [
        ...baseRow,
        paymentTypeLabel,
        `R$ ${formatMoney(item.baseAmount ?? 0)}`,
        `R$ ${formatMoney(item.receivableAmount)}`,
      ];
    });

    const displayRows = payload.items.map((item) => {
      const baseDisplay = [formatDate(item.date), item.jobName, item.status];
      if (!includeValues) {
        return baseDisplay;
      }
      const paymentTypeLabel =
        item.paymentType === 'diaria'
          ? 'Diária'
          : item.paymentType === 'fixo'
            ? 'Fixo'
            : '-';
      return [
        ...baseDisplay,
        paymentTypeLabel,
        `R$ ${formatMoney(item.baseAmount ?? 0)}`,
        `R$ ${formatMoney(item.receivableAmount)}`,
      ];
    });

    if (rows.length === 0) {
      showToast('Nenhum dado para exportar na planilha.', {
        title: 'Relatórios',
        color: 'warning',
      });
      return;
    }

    const { utils, writeFile } = await import('xlsx');
    const workbook = utils.book_new();
    const dataSheet = utils.aoa_to_sheet([headers, ...rows], {
      cellDates: true,
    });

    const headerRowIndex = 0;
    const firstDataRowIndex = 1;
    const lastDataRowIndex = rows.length;
    const lastColIndex = headers.length - 1;
    const rangeRef = `A1:${utils.encode_col(lastColIndex)}1`;

    const autoWidths = headers.map((header, colIndex) => {
      const contentMax = displayRows.reduce((max, row) => {
        const cellValue = row[colIndex] ?? '';
        return Math.max(max, String(cellValue).length);
      }, 0);
      return { wch: Math.min(48, Math.max(10, Math.max(header.length, contentMax) + 2)) };
    });

    dataSheet['!autofilter'] = { ref: rangeRef };
    dataSheet['!cols'] = autoWidths;
    dataSheet['!freeze'] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activePane: 'bottomLeft',
      state: 'frozen',
    };

    for (let row = firstDataRowIndex; row <= lastDataRowIndex; row += 1) {
      const dateCellRef = utils.encode_cell({ c: 0, r: row });
      const dateCell = dataSheet[dateCellRef];
      if (dateCell) {
        dateCell.z = 'dd/mm/yyyy';
      }
    }

    if (includeValues) {
      const totalRowIndex = lastDataRowIndex + 1;
      const totalCellRef = utils.encode_cell({ c: 5, r: totalRowIndex });
      dataSheet[totalCellRef] = {
        t: 's',
        v: `R$ ${formatMoney(payload.summary.totalReceivable)}`,
      };

      const currentRef = dataSheet['!ref'];
      if (currentRef) {
        const range = utils.decode_range(currentRef);
        if (range.e.r < totalRowIndex) {
          range.e.r = totalRowIndex;
          dataSheet['!ref'] = utils.encode_range(range);
        }
      }
    }
    utils.book_append_sheet(workbook, dataSheet, 'Relatorio');

    const metadataSheet = utils.aoa_to_sheet([
      ['Campo', 'Valor'],
      ['Gerado em', new Date(payload.generatedAt).toLocaleString('pt-BR')],
      ['Período', `${monthNames[month - 1]} de ${year}`],
      ['Emprego', selectedJob === 'all' ? 'Todos' : selectedJob],
      ['Somente trabalhados', workedOnly ? 'Sim' : 'Não'],
      ['Com valores', includeValues ? 'Sim' : 'Não'],
      ['Total de registros', payload.summary.totalCount],
      ['Dias trabalhados', payload.summary.workedCount],
      ['Total a receber (R$)', payload.summary.totalReceivable],
    ]);
    metadataSheet['!cols'] = [{ wch: 24 }, { wch: 28 }];
    const metaTotalCell = metadataSheet['B9'];
    if (metaTotalCell) {
      metaTotalCell.t = 's';
      metaTotalCell.v = `R$ ${formatMoney(payload.summary.totalReceivable)}`;
    }
    utils.book_append_sheet(workbook, metadataSheet, 'Metadados');

    const monthPadded = month < 10 ? `0${month}` : String(month);
    const now = new Date();
    const dayValue = now.getDate();
    const hourValue = now.getHours();
    const minuteValue = now.getMinutes();
    const secondValue = now.getSeconds();
    const day = dayValue < 10 ? `0${dayValue}` : String(dayValue);
    const hour = hourValue < 10 ? `0${hourValue}` : String(hourValue);
    const minute = minuteValue < 10 ? `0${minuteValue}` : String(minuteValue);
    const second = secondValue < 10 ? `0${secondValue}` : String(secondValue);
    writeFile(
      workbook,
      `relatorio-${year}-${monthPadded}-${day}-${hour}${minute}${second}.xlsx`,
    );
    showToast('Planilha gerada.', { title: 'Relatórios', color: 'success' });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const backendExportType = 'message';
      const response = await fetch(
        `/api/v1/reports/work-export?month=${month}&year=${year}&job=${encodeURIComponent(selectedJob)}&exportType=${backendExportType}&includeValues=${includeValues ? 'true' : 'false'}&workedOnly=${workedOnly ? 'true' : 'false'}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const payload: WorkExportResponse = await response.json();
      const message = payload.message ?? '';
      if (exportType === 'pdf') {
        await downloadBasePdf(message);
      } else if (exportType === 'spreadsheet') {
        await downloadSpreadsheet(payload);
      } else {
        await copyToClipboard(message);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro desconhecido', {
        title: 'Relatórios',
        color: 'danger',
      });
    } finally {
      setExportLoading(false);
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
        <article className="reports-card reports-card--configs">
          <div className="reports-work-controls">
            <label className="reports-check">
              <select
                className="reports-job-select"
                value={selectedJob}
                onChange={(event) => setSelectedJob(event.target.value)}
                aria-label="Filtrar por emprego"
              >
                <option value="all">Todos</option>
                {availableJobs.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="pager-btn btn-brand"
              onClick={() => setExportModalVisible(true)}
              disabled={workLoading}
            >
              Exportar
            </button>
          </div>

          {workLoading && <p className="notes-state">Carregando trabalhos...</p>}

          {!workLoading && filteredWorkdays.length === 0 && (
            <p className="notes-state">Nenhum trabalho encontrado para o filtro selecionado.</p>
          )}

          {!workLoading && filteredWorkdays.length > 0 && (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Trabalho</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkdays.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.jobName}</td>
                      <td>
                        <span
                          className={`reports-status-chip ${
                            item.worked ? 'is-worked' : 'is-pending'
                          }`}
                        >
                          {item.worked ? 'Trabalhado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <AppModal
        alignment="center"
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Configurações de exportação</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="reports-export-options">
            <label className="reports-field">
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
            <label className="reports-field">
              <span>Tipo de exportação</span>
              <select
                className="reports-job-select"
                value={exportType}
                onChange={(event) => setExportType(event.target.value as ExportType)}
              >
                <option value="message">Mensagem</option>
                <option value="pdf">PDF</option>
                <option value="spreadsheet">Planilha (Excel)</option>
              </select>
            </label>
            <label className="reports-check reports-check--modal">
              <input
                type="checkbox"
                checked={workedOnly}
                onChange={(event) => setWorkedOnly(event.target.checked)}
              />
              <span>Somente dias trabalhados</span>
            </label>
            <label className="reports-check reports-check--modal">
              <input
                type="checkbox"
                checked={includeValues}
                onChange={(event) => setIncludeValues(event.target.checked)}
              />
              <span>Com valores</span>
            </label>
          </div>
          {exportLoading && <p className="notes-state">Gerando exportação...</p>}
        </CModalBody>
        <CModalFooter>
          <button type="button" className="pager-btn" onClick={() => setExportModalVisible(false)}>
            Fechar
          </button>
          <button
            type="button"
            className="pager-btn btn-brand"
            onClick={() => void handleExport()}
            disabled={exportLoading}
          >
            Exportar
          </button>
        </CModalFooter>
      </AppModal>
      {toaster}
    </section>
  );
};
