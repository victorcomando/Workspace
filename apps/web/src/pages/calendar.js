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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarPage = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_2 = require("@coreui/react");
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var WEEKDAY_LABELS = [
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
    "domingo",
];
var SIX_ROWS_SLOTS = 42;
var CalendarPage = function () {
    var _a;
    var _b = (0, react_1.useState)([]), items = _b[0], setItems = _b[1];
    var _c = (0, react_1.useState)(function () {
        var now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }), visibleDate = _c[0], setVisibleDate = _c[1];
    var _d = (0, react_1.useState)(false), modalVisible = _d[0], setModalVisible = _d[1];
    var _e = (0, react_1.useState)(""), selectedDate = _e[0], setSelectedDate = _e[1];
    var _f = (0, react_1.useState)("new"), selectedJobId = _f[0], setSelectedJobId = _f[1];
    var _g = (0, react_1.useState)(""), jobName = _g[0], setJobName = _g[1];
    var _h = (0, react_1.useState)(""), obs = _h[0], setObs = _h[1];
    var _j = (0, react_1.useState)(true), worked = _j[0], setWorked = _j[1];
    var _k = (0, react_1.useState)(false), saving = _k[0], setSaving = _k[1];
    var _l = (0, react_1.useState)(""), errorMessage = _l[0], setErrorMessage = _l[1];
    var _m = (0, react_1.useState)(0), reloadTick = _m[0], setReloadTick = _m[1];
    var toMonthAnchor = function (date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };
    (0, react_1.useEffect)(function () {
        var load = function () { return __awaiter(void 0, void 0, void 0, function () {
            var monthStart, monthEnd, response, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        monthStart = (0, date_fns_1.startOfMonth)(visibleDate).toISOString();
                        monthEnd = (0, date_fns_1.endOfMonth)(visibleDate).toISOString();
                        return [4 /*yield*/, fetch("http://localhost:5000/api/v1/workdays?page=1&limit=500&start=".concat(encodeURIComponent(monthStart), "&end=").concat(encodeURIComponent(monthEnd)))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Falha ao carregar workdays");
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        payload = _a.sent();
                        setItems(payload.data);
                        return [2 /*return*/];
                }
            });
        }); };
        load().catch(function () {
            setItems([]);
        });
    }, [visibleDate, reloadTick]);
    var workdaysByDate = (0, react_1.useMemo)(function () {
        var _a;
        var map = new Map();
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var key = item.date.slice(0, 10);
            var current = (_a = map.get(key)) !== null && _a !== void 0 ? _a : [];
            current.push(item);
            map.set(key, current);
        }
        return map;
    }, [items]);
    var monthSlots = (0, react_1.useMemo)(function () {
        var firstDayOfMonth = (0, date_fns_1.startOfMonth)(visibleDate);
        var monthEndDay = (0, date_fns_1.endOfMonth)(visibleDate).getDate();
        var startsOn = (firstDayOfMonth.getDay() + 6) % 7;
        return Array.from({ length: SIX_ROWS_SLOTS }, function (_, index) {
            var dayNumber = index - startsOn + 1;
            if (dayNumber < 1 || dayNumber > monthEndDay) {
                return null;
            }
            var date = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), dayNumber);
            return {
                date: date,
                key: (0, date_fns_1.format)(date, "yyyy-MM-dd"),
                label: (0, date_fns_1.format)(date, "dd"),
            };
        });
    }, [visibleDate]);
    var openDayModal = function (date) {
        var _a, _b;
        var key = (0, date_fns_1.format)(date, "yyyy-MM-dd");
        var jobs = (_a = workdaysByDate.get(key)) !== null && _a !== void 0 ? _a : [];
        setSelectedDate(key);
        setErrorMessage("");
        if (jobs.length > 0) {
            var firstJob = jobs[0];
            setSelectedJobId(String(firstJob.id));
            setJobName(firstJob.jobName);
            setObs((_b = firstJob.obs) !== null && _b !== void 0 ? _b : "");
            setWorked(firstJob.worked);
        }
        else {
            setSelectedJobId("new");
            setJobName("");
            setObs("");
            setWorked(true);
        }
        setModalVisible(true);
    };
    var onSelectedJobChange = function (value) {
        var _a, _b;
        setSelectedJobId(value);
        if (value === "new") {
            setJobName("");
            setObs("");
            setWorked(true);
            return;
        }
        var jobs = (_a = workdaysByDate.get(selectedDate)) !== null && _a !== void 0 ? _a : [];
        var target = jobs.find(function (job) { return String(job.id) === value; });
        if (target) {
            setJobName(target.jobName);
            setObs((_b = target.obs) !== null && _b !== void 0 ? _b : "");
            setWorked(target.worked);
        }
    };
    var saveWorkday = function () { return __awaiter(void 0, void 0, void 0, function () {
        var isEditing, url, method, response, payload, message, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedDate) {
                        return [2 /*return*/];
                    }
                    if (!jobName.trim()) {
                        setErrorMessage("Informe o nome do trabalho.");
                        return [2 /*return*/];
                    }
                    isEditing = selectedJobId !== "new";
                    url = isEditing
                        ? "http://localhost:5000/api/v1/workdays/".concat(selectedJobId)
                        : "http://localhost:5000/api/v1/workdays";
                    method = isEditing ? "PATCH" : "POST";
                    setSaving(true);
                    setErrorMessage("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch(url, {
                            method: method,
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                date: selectedDate,
                                jobName: jobName.trim(),
                                obs: obs.trim() || null,
                                worked: worked,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json().catch(function () { return null; })];
                case 3:
                    payload = (_a.sent());
                    message = Array.isArray(payload === null || payload === void 0 ? void 0 : payload.message)
                        ? payload === null || payload === void 0 ? void 0 : payload.message[0]
                        : payload === null || payload === void 0 ? void 0 : payload.message;
                    throw new Error(message || "Falha ao salvar trabalho");
                case 4:
                    setModalVisible(false);
                    setReloadTick(function (value) { return value + 1; });
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    setErrorMessage(error_1 instanceof Error ? error_1.message : "Falha ao salvar trabalho");
                    return [3 /*break*/, 7];
                case 6:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var selectedDateJobs = (_a = workdaysByDate.get(selectedDate)) !== null && _a !== void 0 ? _a : [];
    var monthLabel = (0, date_fns_1.format)(visibleDate, "MMMM yyyy", { locale: locale_1.ptBR });
    return ((0, jsx_runtime_1.jsxs)("section", { className: "calendar-page", children: [(0, jsx_runtime_1.jsxs)("div", { className: "calendar-shell calendar-shell--modern", children: [(0, jsx_runtime_1.jsxs)("div", { className: "calendar-topbar", children: [(0, jsx_runtime_1.jsx)("div", {}), (0, jsx_runtime_1.jsx)("div", { className: "calendar-month-title", children: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) }), (0, jsx_runtime_1.jsxs)("div", { className: "calendar-nav", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: function () { return setVisibleDate(toMonthAnchor(new Date())); }, children: "Hoje" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: function () {
                                            return setVisibleDate(function (current) { return toMonthAnchor((0, date_fns_1.addMonths)(current, -1)); });
                                        }, children: "Anterior" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "pager-btn", onClick: function () {
                                            return setVisibleDate(function (current) { return toMonthAnchor((0, date_fns_1.addMonths)(current, 1)); });
                                        }, children: "Pr\u00F3ximo" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "calendar-grid", role: "grid", "aria-label": monthLabel, children: [WEEKDAY_LABELS.map(function (weekday) { return ((0, jsx_runtime_1.jsx)("div", { className: "calendar-grid__weekday", children: weekday }, weekday)); }), monthSlots.map(function (slot, index) {
                                var _a;
                                if (!slot) {
                                    return ((0, jsx_runtime_1.jsx)("div", { className: "calendar-slot calendar-slot--empty", "aria-hidden": "true" }, "empty-slot-".concat(index)));
                                }
                                var jobs = (_a = workdaysByDate.get(slot.key)) !== null && _a !== void 0 ? _a : [];
                                var workedCount = jobs.filter(function (job) { return job.worked; }).length;
                                var pendingCount = jobs.filter(function (job) { return !job.worked; }).length;
                                return ((0, jsx_runtime_1.jsxs)("button", { type: "button", className: "calendar-slot", onClick: function () { return openDayModal(slot.date); }, children: [(0, jsx_runtime_1.jsx)("span", { className: "calendar-slot__day", children: slot.label }), (workedCount > 0 || pendingCount > 0) && ((0, jsx_runtime_1.jsxs)("span", { className: "day-observation", children: [workedCount > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "day-obs day-obs--worked", children: workedCount })), pendingCount > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "day-obs day-obs--pending", children: pendingCount }))] }))] }, slot.key));
                            })] })] }), (0, jsx_runtime_1.jsxs)(react_2.CModal, { className: "calendar-modal", alignment: "center", visible: modalVisible, onClose: function () { return setModalVisible(false); }, children: [(0, jsx_runtime_1.jsx)(react_2.CModalHeader, { children: (0, jsx_runtime_1.jsx)(react_2.CModalTitle, { children: selectedDateJobs.length > 0
                                ? "Editar trabalhos do dia"
                                : "Novo trabalho do dia" }) }), (0, jsx_runtime_1.jsxs)(react_2.CModalBody, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "workday-date", children: "Data" }), (0, jsx_runtime_1.jsx)(react_2.CFormInput, { id: "workday-date", type: "date", value: selectedDate, onChange: function (event) { return setSelectedDate(event.target.value); } })] }), selectedDateJobs.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "modal-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "workday-select", children: "Trabalho do dia" }), (0, jsx_runtime_1.jsx)(react_2.CFormSelect, { id: "workday-select", value: selectedJobId, onChange: function (event) { return onSelectedJobChange(event.target.value); }, options: __spreadArray(__spreadArray([], selectedDateJobs.map(function (job) { return ({
                                            value: String(job.id),
                                            label: "".concat(job.jobName, " (").concat(job.worked ? "Trabalhado" : "Pendente", ")"),
                                        }); }), true), [
                                            { value: "new", label: "+ Adicionar novo trabalho" },
                                        ], false) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "modal-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "workday-job-name", children: "Nome do trabalho" }), (0, jsx_runtime_1.jsx)(react_2.CFormInput, { id: "workday-job-name", value: jobName, onChange: function (event) { return setJobName(event.target.value); }, placeholder: "Ex: Projeto X" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "workday-obs", children: "Observacao (opcional)" }), (0, jsx_runtime_1.jsx)(react_2.CFormTextarea, { id: "workday-obs", value: obs, onChange: function (event) { return setObs(event.target.value); }, placeholder: "Detalhes sobre o trabalho do dia", rows: 3 })] }), (0, jsx_runtime_1.jsx)(react_2.CFormCheck, { id: "workday-worked", label: "Dia trabalhado", checked: worked, onChange: function (event) { return setWorked(event.target.checked); } }), errorMessage && (0, jsx_runtime_1.jsx)("p", { className: "modal-error", children: errorMessage })] }), (0, jsx_runtime_1.jsxs)(react_2.CModalFooter, { children: [(0, jsx_runtime_1.jsx)(react_2.CButton, { color: "secondary", variant: "outline", onClick: function () { return setModalVisible(false); }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(react_2.CButton, { color: "primary", onClick: saveWorkday, disabled: saving, children: saving ? "Salvando..." : selectedJobId === "new" ? "Adicionar" : "Salvar" })] })] })] }));
};
exports.CalendarPage = CalendarPage;
