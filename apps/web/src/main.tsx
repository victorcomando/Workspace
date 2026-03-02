import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import CIcon from "@coreui/icons-react";
import "@coreui/coreui/dist/css/coreui.min.css";
import {
  CButton,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import {
  cilCalendar,
  cilMoon,
  cilDescription,
  cilMenu,
  cilNotes,
  cilSettings,
  cilSpeedometer,
  cilSun,
  cilAccountLogout,
} from "@coreui/icons";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./style.css";
import { DashboardPage } from "./pages/dashboard.tsx";
import { CalendarPage } from "./pages/calendar.tsx";
import { ReportsPage } from "./pages/reports.tsx";
import { SettingsPage } from "./pages/settings.tsx";
import { NotFoundPage } from "./pages/not-found.tsx";
import { NotesPage } from "./pages/notes.tsx";
import { useAppToast } from "./hooks/use-app-toast.tsx";
import { AppModal } from "./components/app-modal.tsx";

type AuthUser = {
  id: number;
  email: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type MetaVersionResponse = {
  version?: string;
  source?: string;
  latestVersion?: string | null;
  hasUpdate?: boolean;
  releaseUrl?: string | null;
};

type AuthPageProps = {
  authMode: "login" | "register";
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  showSessionInvalidatedNotice: boolean;
  onModeChange: (mode: "login" | "register") => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDismissSessionNotice: () => void;
  onSubmit: () => Promise<void>;
};

type AppLayoutProps = {
  authUser: AuthUser;
  appVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  releaseUrl: string | null;
  theme: "light" | "dark";
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  onToggleTheme: () => void;
  onLogout: () => Promise<void>;
};

const getSafeRedirectPath = (rawRedirect: string | null) => {
  if (!rawRedirect) {
    return "/";
  }

  if (
    !rawRedirect.startsWith("/") ||
    rawRedirect.startsWith("//") ||
    rawRedirect.startsWith("/auth")
  ) {
    return "/";
  }

  return rawRedirect;
};

const SESSION_REVALIDATE_INTERVAL_MS = 15_000;

const getRequestPath = (requestUrl: string) => {
  try {
    return new URL(requestUrl, window.location.origin).pathname;
  } catch {
    return requestUrl;
  }
};

const getAuthRedirectForCurrentPath = (reason?: "session-invalidated") => {
  const currentPathWithQuery = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const query = new URLSearchParams();
  if (currentPathWithQuery !== "/") {
    query.set("redirect", currentPathWithQuery);
  }
  if (reason) {
    query.set("reason", reason);
  }
  const serializedQuery = query.toString();
  return serializedQuery ? `/auth?${serializedQuery}` : "/auth";
};

const AuthPage = ({
  authMode,
  authEmail,
  authPassword,
  authLoading,
  showSessionInvalidatedNotice,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onDismissSessionNotice,
  onSubmit,
}: AuthPageProps) => {
  const canSubmit = !authLoading;

  return (
    <div className="auth-screen">
      <AppModal
        alignment="center"
        backdrop="static"
        visible={showSessionInvalidatedNotice}
        onClose={onDismissSessionNotice}
      >
        <CModalHeader>
          <CModalTitle>Sessão encerrada</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Seu acesso foi invalidado porque houve login em outro dispositivo.
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={onDismissSessionNotice}>
            Entendi
          </CButton>
        </CModalFooter>
      </AppModal>
      <div className="auth-card">
        <h1>Workspace</h1>
        <p>Entre ou registre-se para continuar.</p>

        <div className="auth-mode-toggle">
          <button
            type="button"
            className={`pager-btn ${authMode === "login" ? "is-active" : ""}`}
            onClick={() => onModeChange("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`pager-btn ${authMode === "register" ? "is-active" : ""}`}
            onClick={() => onModeChange("register")}
          >
            Registro
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) {
              void onSubmit();
            }
          }}
        >
          <label className="auth-label">
            E-mail
            <input
              className="notes-search"
              type="email"
              value={authEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            Senha
            <input
              className="notes-search"
              type="password"
              value={authPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
            />
          </label>

          <button
            type="submit"
            className="pager-btn auth-submit-btn"
            disabled={!canSubmit}
            onClick={(event) => {
              event.preventDefault();
              if (canSubmit) {
                void onSubmit();
              }
            }}
          >
            {authLoading ? "Aguarde..." : authMode === "login" ? "Entrar" : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

const AppLayout = ({
  authUser,
  appVersion,
  latestVersion,
  hasUpdate,
  releaseUrl,
  theme,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  onToggleTheme,
  onLogout,
}: AppLayoutProps) => {
  const location = useLocation();
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await onLogout();
    } finally {
      setLogoutLoading(false);
      setConfirmLogoutVisible(false);
    }
  };

  return (
    <div className="layout">
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="app-sidebar__brand">Workspace</div>
        <nav className="app-sidebar__nav">
          <NavLink to="/">
            <CIcon icon={cilSpeedometer} className="app-sidebar__icon" />
            Dashboard
          </NavLink>
          <NavLink to="/reports">
            <CIcon icon={cilDescription} className="app-sidebar__icon" />
            Relatórios
          </NavLink>
          <NavLink to="/calendar">
            <CIcon icon={cilCalendar} className="app-sidebar__icon" />
            Calendário
          </NavLink>
          <NavLink to="/notes">
            <CIcon icon={cilNotes} className="app-sidebar__icon" />
            Bloco de Notas
          </NavLink>
        </nav>
        <div className="app-sidebar__footer">
          <NavLink to="/config">
            <CIcon icon={cilSettings} className="app-sidebar__icon" />
            Configurações
          </NavLink>
          <div className="app-sidebar__version">v{appVersion}</div>
          {hasUpdate && latestVersion && releaseUrl && (
            <a
              className="app-sidebar__update-link"
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
            >
              Nova versão disponível: v{latestVersion}
            </a>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="header">
        <div className="header__left">
          {isMobile && (
            <button
              type="button"
              className="menu-toggle"
              aria-label="Abrir menu lateral"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <CIcon icon={cilMenu} />
            </button>
          )}
          <div className="header__title">Painel Web</div>
          <div className="header__meta">{authUser.email}</div>
        </div>

        <div className="header__left">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setConfirmLogoutVisible(true)}
            aria-label="Sair"
            title="Sair"
          >
            <CIcon icon={cilAccountLogout} />
          </button>
          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            title="Alternar tema"
          >
            <CIcon icon={theme === "light" ? cilMoon : cilSun} />
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <AppModal
        alignment="center"
        visible={confirmLogoutVisible}
        onClose={() => setConfirmLogoutVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Confirmar saída</CModalTitle>
        </CModalHeader>
        <CModalBody>Tem certeza que deseja sair?</CModalBody>
        <CModalFooter>
          <button
            type="button"
            className="pager-btn"
            onClick={() => setConfirmLogoutVisible(false)}
            disabled={logoutLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="pager-btn btn-danger-outline"
            onClick={() => void handleConfirmLogout()}
            disabled={logoutLoading}
          >
            {logoutLoading ? "Saindo..." : "Sair"}
          </button>
        </CModalFooter>
      </AppModal>
    </div>
  );
};

const AppRouter = ({
  authReady,
  authUser,
  appVersion,
  latestVersion,
  hasUpdate,
  releaseUrl,
  authMode,
  authEmail,
  authPassword,
  authLoading,
  setAuthMode,
  setAuthEmail,
  setAuthPassword,
  submitAuth,
  theme,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  toggleTheme,
  logout,
}: {
  authReady: boolean;
  authUser: AuthUser | null;
  appVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  releaseUrl: string | null;
  authMode: "login" | "register";
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  setAuthMode: (mode: "login" | "register") => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  submitAuth: () => Promise<void>;
  theme: "light" | "dark";
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  toggleTheme: () => void;
  logout: () => Promise<void>;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthRoute = location.pathname === "/auth";
  const authSearchParams = new URLSearchParams(location.search);
  const redirectFromQuery = getSafeRedirectPath(authSearchParams.get("redirect"));
  const showSessionInvalidatedNotice =
    isAuthRoute && authSearchParams.get("reason") === "session-invalidated";
  const currentPathWithQuery = `${location.pathname}${location.search}${location.hash}`;
  const authTarget =
    currentPathWithQuery === "/"
      ? "/auth"
      : `/auth?redirect=${encodeURIComponent(currentPathWithQuery)}`;

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!authUser && !isAuthRoute) {
      navigate(authTarget, { replace: true });
    }

    if (authUser && isAuthRoute) {
      navigate(redirectFromQuery, { replace: true });
    }
  }, [authReady, authTarget, authUser, isAuthRoute, navigate, redirectFromQuery]);

  if (!authReady) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Workspace</h1>
          <p>Carregando sessao...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          authUser ? (
            <Navigate to={redirectFromQuery} replace />
          ) : (
            <AuthPage
              authMode={authMode}
              authEmail={authEmail}
              authPassword={authPassword}
              authLoading={authLoading}
              showSessionInvalidatedNotice={showSessionInvalidatedNotice}
              onModeChange={(mode) => {
                setAuthMode(mode);
              }}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onDismissSessionNotice={() => {
                const nextQuery = new URLSearchParams(location.search);
                nextQuery.delete("reason");
                const nextSearch = nextQuery.toString();
                navigate(
                  {
                    pathname: "/auth",
                    search: nextSearch ? `?${nextSearch}` : "",
                  },
                  { replace: true },
                );
              }}
              onSubmit={submitAuth}
            />
          )
        }
      />

      <Route
        element={
          authUser ? (
            <AppLayout
              authUser={authUser}
              appVersion={appVersion}
              latestVersion={latestVersion}
              hasUpdate={hasUpdate}
              releaseUrl={releaseUrl}
              theme={theme}
              isMobile={isMobile}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onToggleTheme={toggleTheme}
              onLogout={logout}
            />
          ) : (
            <Navigate to={authTarget} replace />
          )
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/config" element={<SettingsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  });

  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [appVersion, setAppVersion] = useState("dev");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const isForcingLogoutRef = useRef(false);
  const { showToast, toaster } = useAppToast();

  const clearAuthState = useCallback(() => {
    setAuthToken(null);
    setAuthUser(null);
    setAuthEmail("");
    setAuthPassword("");
    setAuthMode("login");
    setAuthReady(true);
  }, []);

  const forceLogout = useCallback(
    (redirectToAuth: boolean) => {
      if (isForcingLogoutRef.current) {
        return;
      }

      isForcingLogoutRef.current = true;
      clearAuthState();

      if (redirectToAuth && typeof window !== "undefined" && window.location.pathname !== "/auth") {
        window.location.replace(getAuthRedirectForCurrentPath("session-invalidated"));
      }

      isForcingLogoutRef.current = false;
    },
    [clearAuthState],
  );

  const revalidateSession = useCallback(async () => {
    if (!authToken) {
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/me", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Sessao invalida");
      }
      const payload = (await response.json()) as { user: AuthUser };
      setAuthUser(payload.user);
    } catch {
      forceLogout(true);
    }
  }, [authToken, forceLogout]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);
    (window as typeof window & { fetch: typeof window.fetch }).fetch = (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const requestPath = getRequestPath(requestUrl);
      const isApiRequest = requestPath.startsWith("/api/");
      const hasAuthToken = Boolean(authToken);
      const headers = new Headers(init?.headers);

      if (hasAuthToken && isApiRequest && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${authToken}`);
      }

      return originalFetch(input, {
        ...init,
        headers,
      }).then((response) => {
        if (isApiRequest && response.status === 401 && hasAuthToken) {
          forceLogout(true);
        }
        return response;
      });
    };

    return () => {
      (window as typeof window & { fetch: typeof window.fetch }).fetch = originalFetch;
    };
  }, [authToken, forceLogout]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem("auth_token", authToken);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [authToken]);

  useEffect(() => {
    const loadMe = async () => {
      if (!authToken) {
        setAuthUser(null);
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      await revalidateSession();
      setAuthReady(true);
    };

    void loadMe();
  }, [authToken, revalidateSession]);

  useEffect(() => {
    if (typeof window === "undefined" || !authToken) {
      return;
    }

    const onFocus = () => {
      void revalidateSession();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revalidateSession();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const intervalId = window.setInterval(() => {
      void revalidateSession();
    }, SESSION_REVALIDATE_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [authToken, revalidateSession]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;

    const loadVersion = async (attempt: number) => {
      try {
        const response = await fetch("/api/v1/meta/version", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("version_endpoint_unavailable");
        }
        const payload = (await response.json()) as MetaVersionResponse;
        const version = payload.version?.trim();
        if (version) {
          setAppVersion(version);
        }
        setLatestVersion(payload.latestVersion?.trim() || null);
        setHasUpdate(Boolean(payload.hasUpdate));
        setReleaseUrl(payload.releaseUrl?.trim() || null);
        return;
      } catch {
        if (cancelled) {
          return;
        }

        if (attempt < 10) {
          retryTimer = window.setTimeout(() => {
            void loadVersion(attempt + 1);
          }, 1500);
        }
      }
    };

    void loadVersion(0);

    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1024px)");
    const handler = (ev: MediaQueryListEvent) => setIsMobile(ev.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    setIsMobile(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-coreui-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const submitAuth = async () => {
    const email = authEmail.trim().toLowerCase();

    if (!email || authPassword.length < 6) {
      showToast("Informe e-mail válido e senha com no mínimo 6 caracteres", {
        title: "Autenticação",
        color: "warning",
      });
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(
        authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password: authPassword,
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
        throw new Error(message || "Falha de autenticação");
      }

      const data = (await response.json()) as AuthResponse;
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthEmail("");
      setAuthPassword("");
      setAuthMode("login");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro desconhecido", {
        title: "Autenticação",
        color: "danger",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      clearAuthState();
    }
  };

  return (
    <BrowserRouter>
      <AppRouter
        authReady={authReady}
        authUser={authUser}
        appVersion={appVersion}
        latestVersion={latestVersion}
        hasUpdate={hasUpdate}
        releaseUrl={releaseUrl}
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        authLoading={authLoading}
        setAuthMode={setAuthMode}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        submitAuth={submitAuth}
        theme={theme}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
        logout={logout}
      />
      {toaster}
    </BrowserRouter>
  );
};

createRoot(document.getElementById("app")!).render(<App />);
