import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAppToast } from "../hooks/use-app-toast.tsx";

type Note = {
  id: number;
  title: string;
  content: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

type NotesResponse = {
  data: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const BASE_URL = "/api/v1/notes";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const QUILL_FORMATS = ["header", "bold", "italic", "underline", "list", "bullet"];

export const NotesPage = () => {
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const { showToast, toaster } = useAppToast();

  const toPlainText = (value: string | null) =>
    (value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeContent = (value: string) => {
    const plain = value.replace(/<[^>]*>/g, "").trim();
    return plain ? value : "";
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}?page=1&limit=200`);
      if (!response.ok) {
        throw new Error("Falha ao carregar notas");
      }
      const payload: NotesResponse = await response.json();
      setItems(payload.data);
    } catch (error) {
      setItems([]);
      showToast(
        error instanceof Error ? error.message : "Falha ao carregar notas",
        { title: "Notas", color: "danger" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes().catch(() => undefined);
  }, [reloadTick]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    const current = items.find((note) => note.id === selectedId);
    if (!current) {
      setSelectedId(null);
      setTitle("");
      setContent("");
      setPinned(false);
      return;
    }

    setTitle(current.title);
    setContent(current.content ?? "");
    setPinned(current.pinned);
  }, [items, selectedId]);

  const visibleItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = (item.content ?? "").toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [items, searchTerm]);

  const startNewNote = () => {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setPinned(false);
  };

  const selectNote = (note: Note) => {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content ?? "");
    setPinned(note.pinned);
  };

  const saveNote = async () => {
    if (!title.trim()) {
      showToast("Informe um título para a nota.", {
        title: "Notas",
        color: "warning",
      });
      return;
    }

    setSaving(true);

    const isEditing = selectedId !== null;
    const url = isEditing ? `${BASE_URL}/${selectedId}` : BASE_URL;
    const method = isEditing ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: normalizeContent(content) || null,
          pinned,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;
        throw new Error(message || "Falha ao salvar nota");
      }

      const saved = (await response.json()) as Note;
      setSelectedId(saved.id);
      setReloadTick((value) => value + 1);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Falha ao salvar nota",
        { title: "Notas", color: "danger" },
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (selectedId === null) {
      return;
    }

    const confirmed = window.confirm("Deseja remover esta nota?");
    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${BASE_URL}/${selectedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao remover nota");
      }

      startNewNote();
      setReloadTick((value) => value + 1);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Falha ao remover nota",
        { title: "Notas", color: "danger" },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="notes-page">
      <aside className="notes-list">
        <div className="notes-list__top">
          <button type="button" className="pager-btn btn-brand" onClick={startNewNote}>
            Nova nota
          </button>
          <input
            className="notes-search"
            type="search"
            placeholder="Buscar notas"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="notes-list__items" role="list">
          {loading && <p className="notes-state">Carregando notas...</p>}
          {!loading && visibleItems.length === 0 && (
            <p className="notes-state">Nenhuma nota encontrada.</p>
          )}
          {!loading &&
            visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`note-item ${selectedId === item.id ? "is-active" : ""}`}
                onClick={() => selectNote(item)}
              >
                <div className="note-item__title-row">
                  <strong className="note-item__title">{item.title}</strong>
                  {item.pinned && <span className="note-item__pin">fixada</span>}
                </div>
                <p className="note-item__content">
                  {toPlainText(item.content) || "Sem conteúdo"}
                </p>
              </button>
            ))}
        </div>
      </aside>

      <div className="notes-editor">
        <div className="notes-editor__header">
          <h1>Bloco de notas</h1>
          <div className="notes-editor__actions">
            <button
              type="button"
              className="pager-btn btn-brand"
              onClick={saveNote}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              className="pager-btn"
              onClick={deleteNote}
              disabled={saving || selectedId === null}
            >
              Excluir
            </button>
          </div>
        </div>

        <label className="notes-field">
          <span>Título</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Digite um título"
          />
        </label>

        <div className="notes-field">
          <span>Conteúdo</span>
          <div className="notes-quill">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="Escreva sua nota"
            />
          </div>
        </div>

        <label className="notes-check">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
          />
          <span>Fixar no topo</span>
        </label>
      </div>
      {toaster}
    </section>
  );
};
