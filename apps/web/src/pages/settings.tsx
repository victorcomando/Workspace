import { useEffect, useState } from 'react';
import {
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import { useAppToast } from '../hooks/use-app-toast.tsx';

type SalaryConfig = {
  id: number;
  local: string;
  tipo: string;
  valor: number;
};

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => numberFormatter.format(value);

export const SettingsPage = () => {
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [knownLocals, setKnownLocals] = useState<string[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'salary' | 'coming'>('salary');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [local, setLocal] = useState('');
  const [selectedLocal, setSelectedLocal] = useState('');
  const [customLocal, setCustomLocal] = useState(false);
  const [tipo, setTipo] = useState<'diaria' | 'fixo'>('diaria');
  const [valor, setValor] = useState('');
  const { showToast, toaster } = useAppToast();

  const fetchConfigs = async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/v1/salary/configs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SalaryConfig[] = await response.json();
      setConfigs(data);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro desconhecido', {
        title: 'Configurações',
        color: 'danger',
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchKnownLocals = async () => {
    try {
      const response = await fetch('/api/v1/salary/locals');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: string[] = await response.json();
      setKnownLocals(data);
      if (!customLocal && !selectedLocal && data.length > 0) {
        setSelectedLocal(data[0]);
      }
    } catch {
      setKnownLocals([]);
    }
  };

  useEffect(() => {
    void fetchConfigs();
    void fetchKnownLocals();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setLocal('');
    setCustomLocal(false);
    setSelectedLocal(knownLocals[0] ?? '');
    setTipo('diaria');
    setValor('');
  };

  const saveConfig = async () => {
    const localFromSelection = customLocal ? local : selectedLocal;
    const trimmedLocal = localFromSelection.trim();
    const numericValor = Number(valor);

    if (!trimmedLocal) {
      showToast('Informe o local/trabalho.', {
        title: 'Configurações',
        color: 'warning',
      });
      return;
    }

    if (!Number.isFinite(numericValor) || numericValor < 0) {
      showToast('Informe um valor válido.', {
        title: 'Configurações',
        color: 'warning',
      });
      return;
    }

    setConfigLoading(true);
    try {
      const response = await fetch(
        editingId ? `/api/v1/salary/configs/${editingId}` : '/api/v1/salary/configs',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            local: trimmedLocal,
            tipo,
            valor: numericValor,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;
        throw new Error(message || 'Falha ao salvar configuração');
      }

      await fetchConfigs();
      await fetchKnownLocals();
      setModalVisible(false);
      resetForm();
      showToast('Configuração salva com sucesso.', {
        title: 'Configurações',
        color: 'success',
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro desconhecido', {
        title: 'Configurações',
        color: 'danger',
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const removeConfig = async (id: number) => {
    setConfigLoading(true);
    try {
      const response = await fetch(`/api/v1/salary/configs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchConfigs();
      await fetchKnownLocals();
      if (editingId === id) {
        resetForm();
      }
      showToast('Configuração removida com sucesso.', {
        title: 'Configurações',
        color: 'success',
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro desconhecido', {
        title: 'Configurações',
        color: 'danger',
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const startEdit = (config: SalaryConfig) => {
    setEditingId(config.id);
    const existsInList = knownLocals.some(
      (name) => name.toLowerCase() === config.local.toLowerCase(),
    );
    if (existsInList) {
      setCustomLocal(false);
      setSelectedLocal(config.local);
      setLocal('');
    } else {
      setCustomLocal(true);
      setSelectedLocal('');
      setLocal(config.local);
    }
    setTipo(config.tipo === 'fixo' ? 'fixo' : 'diaria');
    setValor(String(config.valor));
    setModalVisible(true);
  };

  const startCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <section className="page-shell reports-page">
      <header className="reports-header">
        <h1>Configurações</h1>
        <div className="reports-tabs" role="tablist" aria-label="Abas de configurações">
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
        <article className="reports-card reports-card--configs">
          <div className="reports-configs-header">
            <h3>Configurações de Salário</h3>
            <button type="button" className="pager-btn btn-brand" onClick={startCreate}>
              Nova configuração
            </button>
          </div>

          {configLoading && <p className="notes-state">Carregando configurações...</p>}

          {!configLoading && configs.length === 0 && (
            <p className="notes-state">Nenhuma configuração cadastrada.</p>
          )}

          {!configLoading && configs.length > 0 && (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Local</th>
                    <th>Tipo</th>
                    <th className="is-right">Valor</th>
                    <th className="is-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td>{config.local}</td>
                      <td>{config.tipo}</td>
                      <td className="is-right">R$ {formatMoney(config.valor)}</td>
                      <td className="is-right">
                        <button type="button" className="pager-btn" onClick={() => startEdit(config)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="pager-btn btn-danger-outline"
                          onClick={() => removeConfig(config.id)}
                        >
                          Excluir
                        </button>
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

      <CModal
        className="calendar-modal"
        alignment="center"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>
            {editingId ? 'Editar configuração de salário' : 'Nova configuração de salário'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="modal-field">
            <label htmlFor="salary-local-select">Local/Trabalho</label>
            <CFormSelect
              id="salary-local-select"
              value={customLocal ? '__custom__' : selectedLocal}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '__custom__') {
                  setCustomLocal(true);
                  setSelectedLocal('');
                } else {
                  setCustomLocal(false);
                  setSelectedLocal(value);
                }
              }}
              options={[
                { value: '', label: 'Selecione local/trabalho' },
                ...knownLocals.map((name) => ({ value: name, label: name })),
                { value: '__custom__', label: 'Outro (digitar manualmente)' },
              ]}
            />
          </div>

          {customLocal && (
            <div className="modal-field">
              <label htmlFor="salary-local-custom">Local/Trabalho (manual)</label>
              <CFormInput
                id="salary-local-custom"
                value={local}
                onChange={(event) => setLocal(event.target.value)}
                placeholder="Ex: Complexo Atitude"
              />
            </div>
          )}

          <div className="modal-field">
            <label htmlFor="salary-tipo">Tipo</label>
            <CFormSelect
              id="salary-tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as 'diaria' | 'fixo')}
              options={[
                { value: 'diaria', label: 'Diária' },
                { value: 'fixo', label: 'Fixo' },
              ]}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="salary-valor">Valor</label>
            <CFormInput
              id="salary-valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="0,00"
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <button type="button" className="pager-btn" onClick={() => setModalVisible(false)}>
            Cancelar
          </button>
          <button type="button" className="pager-btn btn-brand" onClick={saveConfig} disabled={configLoading}>
            {editingId ? 'Salvar edição' : 'Adicionar'}
          </button>
        </CModalFooter>
      </CModal>
      {toaster}
    </section>
  );
};
