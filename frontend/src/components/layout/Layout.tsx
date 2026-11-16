import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Network,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useHealth } from "../../hooks/queries";
const navigation = [
  { to: "/dashboard", label: "Vista general", icon: LayoutDashboard },
  { to: "/students", label: "Estudiantes", icon: Users },
  { to: "/predictions", label: "Predicciones", icon: ChartNoAxesCombined },
  { to: "/clusters", label: "Perfiles académicos", icon: Network },
  { to: "/models", label: "Modelos de ML", icon: Boxes },
];
export function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const health = useHealth();
  useEffect(() => {
    setOpen(false);
    document.title = `${navigation.find((n) => pathname.startsWith(n.to))?.label || "SmartCampus"} · SmartCampus`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink className="brand" to="/dashboard">
          <span className="brand-icon">
            <GraduationCap size={25} />
          </span>
          <span>
            Smart<span className="brand-light">Campus</span>
            <small>ANALÍTICA ACADÉMICA</small>
          </span>
        </NavLink>
        <button
          className="mobile-close icon-button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <X />
        </button>
        <div className="sidebar-caption">ESPACIO DE ANÁLISIS</div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={19} />
              <span>{label}</span>
              <ChevronRight className="nav-arrow" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-dataset">
          <BookOpen size={19} />
          <strong>Datos abiertos, conocimiento útil.</strong>
          <p>Explora trayectorias académicas a partir del dataset UCI 697.</p>
          <a
            href="https://archive.ics.uci.edu/dataset/697/predict"
            target="_blank"
            rel="noreferrer"
          >
            Conocer el dataset <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <span className="demo-dot" /> Entorno local de investigación
          <small>Sin autenticación · uso demostrativo</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="mobile-menu icon-button"
              aria-label="Abrir menú"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span className="muted">SmartCampus</span>
            <ChevronRight size={14} />
            <strong>
              {navigation.find((n) => pathname.startsWith(n.to))?.label ||
                "Exploración"}
            </strong>
          </div>
          <div className="topbar-status">
            <span
              className={`connection ${health.isError ? "offline" : health.data?.status === "UP" ? "online" : ""}`}
            >
              <Activity size={14} />
              {health.isError
                ? "API sin conexión"
                : health.data?.status === "UP"
                  ? "API conectada"
                  : "Conectando…"}
            </span>
            <span className="top-divider" />
            <span className="avatar">
              <FlaskConical size={18} />
            </span>
            <span className="topbar-role">
              Explorador<small>Demo académica</small>
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer>
          SmartCampus · Analítica para la exploración académica
          <span>UCI Portugal · Resultados experimentales</span>
        </footer>
      </div>
    </div>
  );
}
