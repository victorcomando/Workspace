import { useEffect, useState } from 'react';
import {
  CFormCheck,
  CFormInput,
  CFormSelect,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppToast } from '../hooks/use-app-toast.tsx';
import { AppModal } from '../components/app-modal.tsx';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<SalaryConfig[]>([]);
  const [configsReady, setConfigsReady] = useState(false);
  const [knownLocals, setKnownLocals] = useState<string[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'salary'>('salary');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deepLinkJob, setDeepLinkJob] = useState<string | null>(null);
  const [local, setLocal] = useState('');
  const [tipo, setTipo] = useState<'diaria' | 'fixo'>('diaria');
  const [valor, setValor] = useState('');
  const { showToast, toaster } = useAppToast();

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

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
      setConfigsReady(true);
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
    } catch {
      setKnownLocals([]);
    }
  };

  useEffect(() => {
    void fetchConfigs();
    void fetchKnownLocals();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const hasDeepLinkParams = query.has('job') || query.has('from');
    if (!hasDeepLinkParams) {
      return;
    }

    const job = query.get('job')?.trim() ?? '';
    setDeepLinkJob(job || null);

    query.delete('job');
    query.delete('from');
    const cleanSearch = query.toString();
    navigate(
      {
        pathname: location.pathname,
        search: cleanSearch ? `?${cleanSearch}` : '',
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  const resetForm = () => {
    setEditingId(null);
    setLocal(knownLocals[0] ?? '');
    setTipo('diaria');
    setValor('');
  };

  const saveConfig = async () => {
    const trimmedLocal = local.trim();
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
    setLocal(config.local);
    setTipo(config.tipo === 'fixo' ? 'fixo' : 'diaria');
    setValor(String(config.valor));
    setModalVisible(true);
  };

  const startCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  useEffect(() => {
    if (!deepLinkJob) {
      return;
    }
    if (!configsReady) {
      return;
    }

    const existing = configs.find(
      (config) => normalizeText(config.local) === normalizeText(deepLinkJob),
    );

    if (existing) {
      setEditingId(existing.id);
      setLocal(existing.local);
      setTipo(existing.tipo === 'fixo' ? 'fixo' : 'diaria');
      setValor(String(existing.valor));
      setModalVisible(true);
    } else {
      setEditingId(null);
      setLocal(deepLinkJob);
      setTipo('diaria');
      setValor('');
      setModalVisible(true);
    }

    setDeepLinkJob(null);
  }, [deepLinkJob, configs, configsReady]);

  const localOptions = local && !knownLocals.some((name) => name === local)
    ? [local, ...knownLocals]
    : knownLocals;

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
        </div>
      </header>
      {activeTab === 'salary' && (
        <article className="reports-card reports-card--configs">
          <div className="reports-configs-header">
            <h3>Configurações de Salário</h3>
            <div className="reports-configs-actions">
              <button type="button" className="pager-btn btn-brand" onClick={startCreate}>
                Nova configuração
              </button>
            </div>
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

      <AppModal
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
              value={local}
              onChange={(event) => setLocal(event.target.value)}
              options={[
                { value: '', label: 'Selecione local/trabalho' },
                ...localOptions.map((name) => ({ value: name, label: name })),
              ]}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="salary-tipo">Tipo</label>
            <div className="salary-type-checks" id="salary-tipo">
              <CFormCheck
                id="salary-tipo-diaria"
                label="Diária"
                checked={tipo === 'diaria'}
                onChange={() => setTipo('diaria')}
              />
              <CFormCheck
                id="salary-tipo-fixo"
                label="Fixo"
                checked={tipo === 'fixo'}
                onChange={() => setTipo('fixo')}
              />
            </div>
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
      </AppModal>
      {toaster}
    </section>
  );
};
