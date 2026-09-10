import { useState, useEffect } from "react";
import ChangePasswordModal from "./ChangePasswordModal";
import logoOficial from "../assets/Logo.png";

export const LogoIcon = ({ size = 32, className = "" }) => (
  <img
    src={logoOficial}
    alt="Hara Vitalis Logo Oficial"
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      display: "block",
    }}
    className={`official-brand-logo ${className}`}
  />
);

export default function Navbar({
  currentUser,
  onLogout,
  vistaActual,
  setVistaActual,
  onNavigateToAuth,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const nombreMostrar =
    currentUser?.nombre || currentUser?.email?.split("@")[0] || "Usuario";
  const esAdmin = currentUser?.rol === "admin";

  // Bloqueo de scroll en el body al abrir menú móvil
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavView = (viewName) => {
    setMobileMenuOpen(false);
    setVistaActual(viewName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReservaClaseClick = () => {
    setMobileMenuOpen(false);
    if (currentUser) {
      setVistaActual("reserva");
    } else {
      onNavigateToAuth(true); // Redirige a registro
    }
  };

  return (
    <header className="navbar">
      {/* Brand Logo */}
      <button
        type="button"
        className="brand-logo"
        aria-label="Hara Vitalis - Ir a página de inicio"
        onClick={() => handleNavView("home")}
      >
        <div className="brand-icon">
          <LogoIcon size={38} />
        </div>
        <span className="brand-name">Hara Vitalis</span>
      </button>

      {/* Backdrop Overlay interactivo al abrir menú móvil */}
      {mobileMenuOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Links (Middle / Mobile Drawer) */}
      <nav
        id="navbar-menu"
        className={`navbar-links ${mobileMenuOpen ? "mobile-active" : ""}`}
        aria-label="Navegación principal"
      >
        <div className="navbar-links-group">
          <button
            type="button"
            className={`nav-link ${vistaActual === "home" ? "active" : ""}`}
            aria-current={vistaActual === "home" ? "page" : undefined}
            onClick={() => handleNavView("home")}
          >
            Inicio
          </button>
          <button
            type="button"
            className={`nav-link ${vistaActual === "quienes-somos" ? "active" : ""}`}
            aria-current={vistaActual === "quienes-somos" ? "page" : undefined}
            onClick={() => handleNavView("quienes-somos")}
          >
            ¿Quiénes somos?
          </button>
          <button
            type="button"
            className={`nav-link ${vistaActual === "horarios" ? "active" : ""}`}
            aria-current={vistaActual === "horarios" ? "page" : undefined}
            onClick={() => handleNavView("horarios")}
          >
            Horarios
          </button>
          <button
            type="button"
            className={`nav-link ${vistaActual === "terapia" ? "active" : ""}`}
            aria-current={vistaActual === "terapia" ? "page" : undefined}
            onClick={() => handleNavView("terapia")}
          >
            Terapias Integrativas
          </button>

          {/* Dynamic User Views for Admin / Logged-in Users */}
          {currentUser && (
            <>
              <button
                type="button"
                className={`nav-link ${vistaActual === "reserva" ? "active" : ""}`}
                aria-current={vistaActual === "reserva" ? "page" : undefined}
                onClick={() => handleNavView("reserva")}
              >
                📅 Clases
              </button>
              {esAdmin && (
                <button
                  type="button"
                  className={`nav-link ${vistaActual === "admin" ? "active" : ""}`}
                  aria-current={vistaActual === "admin" ? "page" : undefined}
                  onClick={() => handleNavView("admin")}
                >
                  ⚙️ Panel Admin
                </button>
              )}
            </>
          )}
        </div>

        {/* Sección de acciones en el drawer móvil */}
        <div className="mobile-drawer-actions">
          <div className="mobile-drawer-divider" />
          {!currentUser ? (
            <div className="mobile-auth-buttons">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToAuth(false);
                }}
                className="btn-navbar-login btn-mobile-full"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={handleReservaClaseClick}
                className="btn-navbar-reserva btn-mobile-full"
                aria-label="Reservar Clase de Pilates"
              >
                Reserva Clase
              </button>
            </div>
          ) : (
            <div className="mobile-user-actions">
              <div className="user-badge mobile-user-badge">
                <span className="user-avatar-icon" aria-hidden="true">👤</span>
                <span className="user-name-text">
                  {nombreMostrar}
                  {esAdmin && <span className="admin-badge-pill">Admin</span>}
                </span>
              </div>

              <div className="mobile-user-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="btn-change-password btn-mobile-full"
                  title="Cambiar Contraseña"
                  aria-label="Cambiar Contraseña de usuario"
                >
                  🔑 Cambiar Clave
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="btn-logout btn-mobile-full"
                  aria-label="Cerrar sesión de usuario"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Action CTA Button & User Profile (Desktop ONLY) */}
      <div className="navbar-actions desktop-only-actions">
        {!currentUser ? (
          <div className="navbar-auth-buttons">
            <button
              type="button"
              onClick={() => onNavigateToAuth(false)}
              className="btn-navbar-login"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={handleReservaClaseClick}
              className="btn-navbar-reserva"
              aria-label="Reservar Clase de Pilates"
            >
              Reserva Clase
            </button>
          </div>
        ) : (
          <div className="navbar-user-actions">
            <div className="user-badge">
              <span className="user-avatar-icon" aria-hidden="true">👤</span>
              <span className="user-name-text">
                {nombreMostrar}
                {esAdmin && <span className="admin-badge-pill">Admin</span>}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="btn-change-password"
              title="Cambiar Contraseña"
              aria-label="Cambiar Contraseña de usuario"
            >
              🔑 Cambiar Clave
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="btn-logout"
              aria-label="Cerrar sesión de usuario"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Mobile Hamburger Toggle */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-controls="navbar-menu"
        aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#253B59"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>
    </header>
  );
}
