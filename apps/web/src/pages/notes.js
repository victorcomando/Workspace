"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesPage = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_quill_1 = __importDefault(require("react-quill"));
require("react-quill/dist/quill.snow.css");
var BASE_URL = "http://localhost:5000/api/v1/notes";
var QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
    ],
};
var QUILL_FORMATS = ["header", "bold", "italic", "underline", "list", "bullet"];
var NotesPage = function () {
    var _a = (0, react_1.useState)([]), items = _a[0], setItems = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(false), saving = _c[0], setSaving = _c[1];
    var _d = (0, react_1.useState)(""), errorMessage = _d[0], setErrorMessage = _d[1];
    var _e = (0, react_1.useState)(null), selectedId = _e[0], setSelectedId = _e[1];
    var _f = (0, react_1.useState)(""), title = _f[0], setTitle = _f[1];
    var _g = (0, react_1.useState)(""), content = _g[0], setContent = _g[1];
    var _h = (0, react_1.useState)(false), pinned = _h[0], setPinned = _h[1];
    var _j = (0, react_1.useState)(""), searchTerm = _j[0], setSearchTerm = _j[1];
    var _k = (0, react_1.useState)(0), reloadTick = _k[0], setReloadTick = _k[1];
    var toPlainText = function (value) {
        return (value !== null && value !== void 0 ? value : "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };
    var normalizeContent = function (value) {
        var plain = value.replace(/<[^>]*>/g, "").trim();
        return plain ? value : "";
    };
    var loadNotes = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, payload, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setErrorMessage("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("".concat(BASE_URL, "?page=1&limit=200"))];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Falha ao carregar notas");
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    payload = _a.sent();
                    setItems(payload.data);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    setItems([]);
                    setErrorMessage(error_1 instanceof Error ? error_1.message : "Falha ao carregar notas");
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        loadNotes().catch(function () { return undefined; });
    }, [reloadTick]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (selectedId === null) {
            return;
        }
        var current = items.find(function (note) { return note.id === selectedId; });
        if (!current) {
            setSelectedId(null);
            setTitle("");
            setContent("");
            setPinned(false);
            return;
        }
        setTitle(current.title);
        setContent((_a = current.content) !== null && _a !== void 0 ? _a : "");
        setPinned(current.pinned);
    }, [items, selectedId]);
    var visibleItems = (0, react_1.useMemo)(function () {
        var query = searchTerm.trim().toLowerCase();
        if (!query) {
            return items;
        }
        return items.filter(function (item) {
            var _a;
            var titleMatch = item.title.toLowerCase().includes(query);
            var contentMatch = ((_a = item.content) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(query);
            return titleMatch || contentMatch;
        });
    }, [items, searchTerm]);
    var startNewNote = function () {
        setSelectedId(null);
        setTitle("");
        setContent("");
        setPinned(false);
        setErrorMessage("");
    };
    var selectNote = function (note) {
        var _a;
        setSelectedId(note.id);
        setTitle(note.title);
        setContent((_a = note.content) !== null && _a !== void 0 ? _a : "");
        setPinned(note.pinned);
        setErrorMessage("");
    };
    var saveNote = function () { return __awaiter(void 0, void 0, void 0, function () {
        var isEditing, url, method, response, payload, message, saved, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!title.trim()) {
                        setErrorMessage("Informe um titulo para a nota.");
                        return [2 /*return*/];
                    }
                    setSaving(true);
                    setErrorMessage("");
                    isEditing = selectedId !== null;
                    url = isEditing ? "".concat(BASE_URL, "/").concat(selectedId) : BASE_URL;
                    method = isEditing ? "PATCH" : "POST";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch(url, {
                            method: method,
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                title: title.trim(),
                                content: normalizeContent(content) || null,
                                pinned: pinned,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return null; })];
                case 3:
                    payload = (_a.sent());
                    message = Array.isArray(payload === null || payload === void 0 ? void 0 : payload.message)
                        ? payload.message[0]
                        : payload === null || payload === void 0 ? void 0 : payload.message;
                    throw new Error(message || "Falha ao salvar nota");
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    saved = (_a.sent());
                    setSelectedId(saved.id);
                    setReloadTick(function (value) { return value + 1; });
                    return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    setErrorMessage(error_2 instanceof Error ? error_2.message : "Falha ao salvar nota");
                    return [3 /*break*/, 8];
                case 7:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var deleteNote = function () { return __awaiter(void 0, void 0, void 0, function () {
        var confirmed, response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedId === null) {
                        return [2 /*return*/];
                    }
                    confirmed = window.confirm("Deseja remover esta nota?");
                    if (!confirmed) {
                        return [2 /*return*/];
                    }
                    setSaving(true);
                    setErrorMessage("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("".concat(BASE_URL, "/").concat(selectedId), {
                            method: "DELETE",
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Falha ao remover nota");
                    }
                    startNewNote();
                    setReloadTick(function (value) { return value + 1; });
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    setErrorMessage(error_3 instanceof Error ? error_3.message : "Falha ao remover nota");
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)("section", { className: "notes-page", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "notes-list", children: [(0, jsx_runtime_1.jsxs)("div", { className: "notes-list__top", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: startNewNote, children: "Nova nota" }), (0, jsx_runtime_1.jsx)("input", { className: "notes-search", type: "search", placeholder: "Buscar notas", value: searchTerm, onChange: function (event) { return setSearchTerm(event.target.value); } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "notes-list__items", role: "list", children: [loading && (0, jsx_runtime_1.jsx)("p", { className: "notes-state", children: "Carregando notas..." }), !loading && visibleItems.length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: "notes-state", children: "Nenhuma nota encontrada." })), !loading &&
                                visibleItems.map(function (item) { return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: "note-item ".concat(selectedId === item.id ? "is-active" : ""), onClick: function () { return selectNote(item); }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "note-item__title-row", children: [(0, jsx_runtime_1.jsx)("strong", { className: "note-item__title", children: item.title }), item.pinned && (0, jsx_runtime_1.jsx)("span", { className: "note-item__pin", children: "fixada" })] }), (0, jsx_runtime_1.jsx)("p", { className: "note-item__content", children: toPlainText(item.content) || "Sem conteudo" })] }, item.id)); })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "notes-editor", children: [(0, jsx_runtime_1.jsxs)("div", { className: "notes-editor__header", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Bloco de notas" }), (0, jsx_runtime_1.jsxs)("div", { className: "notes-editor__actions", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: saveNote, disabled: saving, children: saving ? "Salvando..." : "Salvar" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: deleteNote, disabled: saving || selectedId === null, children: "Excluir" })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "notes-field", children: [(0, jsx_runtime_1.jsx)("span", { children: "Titulo" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: title, onChange: function (event) { return setTitle(event.target.value); }, placeholder: "Digite um titulo" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "notes-field", children: [(0, jsx_runtime_1.jsx)("span", { children: "Conteudo" }), (0, jsx_runtime_1.jsx)("div", { className: "notes-quill", children: (0, jsx_runtime_1.jsx)(react_quill_1.default, { theme: "snow", value: content, onChange: setContent, modules: QUILL_MODULES, formats: QUILL_FORMATS, placeholder: "Escreva sua nota" }) })] }), (0, jsx_runtime_1.jsxs)("label", { className: "notes-check", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: pinned, onChange: function (event) { return setPinned(event.target.checked); } }), (0, jsx_runtime_1.jsx)("span", { children: "Fixar no topo" })] }), errorMessage && (0, jsx_runtime_1.jsx)("p", { className: "modal-error", children: errorMessage })] })] }));
};
exports.NotesPage = NotesPage;
