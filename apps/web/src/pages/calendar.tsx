import { useEffect, useMemo, useState } from "react";
import {
  CButton,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type Workday = {
  id: number;
  date: string;
  jobName: string;
  worked: boolean;
  obs: string | null;
};

type WorkdaysResponse = {
  data: Workday[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const WEEKDAY_LABELS = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
];

const SIX_ROWS_SLOTS = 42;

export const CalendarPage = () => {
  const [items, setItems] = useState<Workday[]>([]);
  const [visibleDate, setVisibleDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("new");
  const [jobName, setJobName] = useState("");
  const [obs, setObs] = useState("");
  const [worked, setWorked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const toMonthAnchor = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1);

  useEffect(() => {
    const load = async () => {
      const monthStart = startOfMonth(visibleDate).toISOString();
      const monthEnd = endOfMonth(visibleDate).toISOString();
      const response = await fetch(
        `/api/v1/workdays?page=1&limit=500&start=${encodeURIComponent(monthStart)}&end=${encodeURIComponent(monthEnd)}`,
      );
      if (!response.ok) {
        throw new Error("Falha ao carregar workdays");
      }
      const payload: WorkdaysResponse = await response.json();
      setItems(payload.data);
    };

    load().catch(() => {
      setItems([]);
    });
  }, [visibleDate, reloadTick]);

  const workdaysByDate = useMemo(() => {
    const map = new Map<string, Workday[]>();
    for (const item of items) {
      const key = item.date.slice(0, 10);
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    }
    return map;
  }, [items]);

  const monthSlots = useMemo(() => {
    const firstDayOfMonth = startOfMonth(visibleDate);
    const monthEndDay = endOfMonth(visibleDate).getDate();
    const startsOn = (firstDayOfMonth.getDay() + 6) % 7;

    return Array.from({ length: SIX_ROWS_SLOTS }, (_, index) => {
      const dayNumber = index - startsOn + 1;
      if (dayNumber < 1 || dayNumber > monthEndDay) {
        return null;
      }
      const date = new Date(
        visibleDate.getFullYear(),
        visibleDate.getMonth(),
        dayNumber,
      );
      return {
        date,
        key: format(date, "yyyy-MM-dd"),
        label: format(date, "dd"),
      };
    });
  }, [visibleDate]);

  const openDayModal = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const jobs = workdaysByDate.get(key) ?? [];

    setSelectedDate(key);
    setErrorMessage("");

    if (jobs.length > 0) {
      const firstJob = jobs[0];
      setSelectedJobId(String(firstJob.id));
      setJobName(firstJob.jobName);
      setObs(firstJob.obs ?? "");
      setWorked(firstJob.worked);
    } else {
      setSelectedJobId("new");
      setJobName("");
      setObs("");
      setWorked(true);
    }

    setModalVisible(true);
  };

  const onSelectedJobChange = (value: string) => {
    setSelectedJobId(value);
    if (value === "new") {
      setJobName("");
      setObs("");
      setWorked(true);
      return;
    }

    const jobs = workdaysByDate.get(selectedDate) ?? [];
    const target = jobs.find((job) => String(job.id) === value);
    if (target) {
      setJobName(target.jobName);
      setObs(target.obs ?? "");
      setWorked(target.worked);
    }
  };

  const saveWorkday = async () => {
    if (!selectedDate) {
      return;
    }
    if (!jobName.trim()) {
      setErrorMessage("Informe o nome do trabalho.");
      return;
    }

    const isEditing = selectedJobId !== "new";
    const url = isEditing
      ? `/api/v1/workdays/${selectedJobId}`
      : "/api/v1/workdays";
    const method = isEditing ? "PATCH" : "POST";

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          jobName: jobName.trim(),
          obs: obs.trim() || null,
          worked,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload?.message[0]
          : payload?.message;
        throw new Error(message || "Falha ao salvar trabalho");
      }

      setModalVisible(false);
      setReloadTick((value) => value + 1);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao salvar trabalho",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedDateJobs = workdaysByDate.get(selectedDate) ?? [];
  
  const deleteWorkday = async () => {
    if (!selectedJobId || selectedJobId === "new") return;
    setSaving(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/v1/workdays/${selectedJobId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao remover trabalho");
      setModalVisible(false);
      setReloadTick((v) => v + 1);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha ao remover trabalho");
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = format(visibleDate, "MMMM yyyy", { locale: ptBR });

  return (
    <section className="calendar-page">
      <div className="calendar-shell calendar-shell--modern">
        <div className="calendar-topbar">
          <div />
          <div className="calendar-month-title">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          </div>
          <div className="calendar-nav">
            <button
              type="button"
              className="pager-btn"
              onClick={() => setVisibleDate(toMonthAnchor(new Date()))}
            >
              Hoje
            </button>
            <button
              type="button"
              className="pager-btn"
              onClick={() =>
                setVisibleDate((current) => toMonthAnchor(addMonths(current, -1)))
              }
            >
              Anterior
            </button>
            <button
              type="button"
              className="pager-btn"
              onClick={() =>
                setVisibleDate((current) => toMonthAnchor(addMonths(current, 1)))
              }
            >
              Próximo
            </button>
          </div>
        </div>

        <div className="calendar-grid" role="grid" aria-label={monthLabel}>
          {WEEKDAY_LABELS.map((weekday) => (
            <div key={weekday} className="calendar-grid__weekday">
              {weekday}
            </div>
          ))}

          {monthSlots.map((slot, index) => {
            if (!slot) {
              return (
                <div
                  key={`empty-slot-${index}`}
                  className="calendar-slot calendar-slot--empty"
                  aria-hidden="true"
                />
              );
            }

            const jobs = workdaysByDate.get(slot.key) ?? [];
            const workedCount = jobs.filter((job) => job.worked).length;
            const pendingCount = jobs.filter((job) => !job.worked).length;

            return (
              <button
                key={slot.key}
                type="button"
                className="calendar-slot"
                onClick={() => openDayModal(slot.date)}
              >
                <span className="calendar-slot__day">{slot.label}</span>
                {(workedCount > 0 || pendingCount > 0) && (
                  <span className="day-observation">
                    {workedCount > 0 && (
                      <span className="day-obs day-obs--worked">{workedCount}</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="day-obs day-obs--pending">{pendingCount}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <CModal
        className="calendar-modal"
        alignment="center"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>
            {selectedDateJobs.length > 0
              ? "Editar trabalhos do dia"
              : "Novo trabalho do dia"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="modal-field">
            <label htmlFor="workday-date">Data</label>
            <CFormInput
              id="workday-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          {selectedDateJobs.length > 0 && (
            <div className="modal-field">
              <label htmlFor="workday-select">Trabalho do dia</label>
              <CFormSelect
                id="workday-select"
                value={selectedJobId}
                onChange={(event) => onSelectedJobChange(event.target.value)}
                options={[
                  ...selectedDateJobs.map((job) => ({
                    value: String(job.id),
                    label: `${job.jobName} (${job.worked ? "Trabalhado" : "Pendente"})`,
                  })),
                  { value: "new", label: "+ Adicionar novo trabalho" },
                ]}
              />
            </div>
          )}

          <div className="modal-field">
            <label htmlFor="workday-job-name">Nome do trabalho</label>
            <CFormInput
              id="workday-job-name"
              value={jobName}
              onChange={(event) => setJobName(event.target.value)}
              placeholder="Ex: Projeto X"
            />
          </div>

          <div className="modal-field">
            <label htmlFor="workday-obs">Observação (opcional)</label>
            <CFormTextarea
              id="workday-obs"
              value={obs}
              onChange={(event) => setObs(event.target.value)}
              placeholder="Detalhes sobre o trabalho do dia"
              rows={3}
            />
          </div>

          <CFormCheck
            id="workday-worked"
            label="Dia trabalhado"
            checked={worked}
            onChange={(event) => setWorked(event.target.checked)}
          />

          {errorMessage && <p className="modal-error">{errorMessage}</p>}
        </CModalBody>
        <CModalFooter>
          {selectedJobId !== "new" && (
            <CButton
              color="danger"
              variant="outline"
              onClick={() => setConfirmVisible(true)}
              disabled={saving}
            >
              Excluir trabalho
            </CButton>
          )}
          <CButton color="primary" onClick={saveWorkday} disabled={saving}>
            {saving ? "Salvando..." : selectedJobId === "new" ? "Adicionar" : "Salvar"}
          </CButton>
        </CModalFooter>

        <CModal className="calendar-modal" alignment="center" visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
          <CModalHeader>
            <CModalTitle>Confirmar exclusão</CModalTitle>
          </CModalHeader>
          <CModalBody>Deseja realmente remover este trabalho?</CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setConfirmVisible(false)}>Cancelar</CButton>
            <CButton color="danger" onClick={() => { setConfirmVisible(false); deleteWorkday(); }} disabled={saving}>Excluir</CButton>
          </CModalFooter>
        </CModal>
      </CModal>
    </section>
  );
};
