"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var client_1 = require("react-dom/client");
var icons_react_1 = __importDefault(require("@coreui/icons-react"));
require("@coreui/coreui/dist/css/coreui.min.css");
var icons_1 = require("@coreui/icons");
require("./style.css");
var dashboard_1 = require("./pages/dashboard");
var calendar_1 = require("./pages/calendar");
var reports_1 = require("./pages/reports");
var settings_1 = require("./pages/settings");
var not_found_1 = require("./pages/not-found");
var notes_1 = require("./pages/notes");
var App = function () {
    var _a = (0, react_1.useState)("light"), theme = _a[0], setTheme = _a[1];
    var _b = (0, react_1.useState)(false), sidebarOpen = _b[0], setSidebarOpen = _b[1];
    var pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    (0, react_1.useEffect)(function () {
        var savedTheme = localStorage.getItem("theme");
        var initialTheme = savedTheme === "dark" ? "dark" : "light";
        setTheme(initialTheme);
    }, []);
    (0, react_1.useEffect)(function () {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-coreui-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "layout", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "sidebar ".concat(sidebarOpen ? "is-open" : ""), children: [(0, jsx_runtime_1.jsx)("div", { className: "sidebar__brand", children: "Workspace" }), (0, jsx_runtime_1.jsxs)("nav", { className: "sidebar__nav", children: [(0, jsx_runtime_1.jsxs)("a", { href: "/", onClick: function () { return setSidebarOpen(false); }, children: [(0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilSpeedometer, className: "sidebar__icon" }), "Dashboard"] }), (0, jsx_runtime_1.jsxs)("a", { href: "/reports", onClick: function () { return setSidebarOpen(false); }, children: [(0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilDescription, className: "sidebar__icon" }), "Relatorios"] }), (0, jsx_runtime_1.jsxs)("a", { href: "/calendar", onClick: function () { return setSidebarOpen(false); }, children: [(0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilCalendar, className: "sidebar__icon" }), "Calendario"] }), (0, jsx_runtime_1.jsxs)("a", { href: "/notes", onClick: function () { return setSidebarOpen(false); }, children: [(0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilNotes, className: "sidebar__icon" }), "Bloco de notas"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "sidebar__footer", children: (0, jsx_runtime_1.jsxs)("a", { href: "/settings", onClick: function () { return setSidebarOpen(false); }, children: [(0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilSettings, className: "sidebar__icon" }), "Configuracoes"] }) })] }), sidebarOpen && ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "sidebar-overlay", "aria-label": "Fechar menu lateral", onClick: function () { return setSidebarOpen(false); } })), (0, jsx_runtime_1.jsxs)("header", { className: "header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header__left", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "menu-toggle", "aria-label": "Abrir menu lateral", style: { display: 'grid' }, onClick: function () { return setSidebarOpen(!sidebarOpen); }, children: (0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: icons_1.cilMenu }) }), (0, jsx_runtime_1.jsx)("div", { className: "header__title", children: "Painel Web" })] }), (0, jsx_runtime_1.jsx)("button", { className: "theme-toggle", type: "button", onClick: function () { return setTheme(theme === "light" ? "dark" : "light"); }, "aria-label": "Alternar tema", title: "Alternar tema", children: (0, jsx_runtime_1.jsx)(icons_react_1.default, { icon: theme === "light" ? icons_1.cilMoon : icons_1.cilSun }) })] }), (0, jsx_runtime_1.jsxs)("main", { className: "content", children: [pathname === "/" && (0, jsx_runtime_1.jsx)(dashboard_1.DashboardPage, {}), pathname === "/calendar" && (0, jsx_runtime_1.jsx)(calendar_1.CalendarPage, {}), pathname === "/reports" && (0, jsx_runtime_1.jsx)(reports_1.ReportsPage, {}), pathname === "/settings" && (0, jsx_runtime_1.jsx)(settings_1.SettingsPage, {}), pathname === "/notes" && (0, jsx_runtime_1.jsx)(notes_1.NotesPage, {}), pathname !== "/" &&
                        pathname !== "/calendar" &&
                        pathname !== "/reports" &&
                        pathname !== "/settings" &&
                        pathname !== "/notes" && ((0, jsx_runtime_1.jsx)(not_found_1.NotFoundPage, {}))] })] }));
};
(0, client_1.createRoot)(document.getElementById("app")).render((0, jsx_runtime_1.jsx)(App, {}));
