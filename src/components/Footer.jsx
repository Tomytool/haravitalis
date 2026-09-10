import { LogoIcon } from "./Navbar";

export default function Footer({ setVistaActual }) {
  const handleFooterLink = (viewName) => {
    if (setVistaActual) {
      setVistaActual(viewName);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="footer-redesign">
      <div className="footer-content-wrapper">
        {/* Top Row: Brand Info & Navigation */}
        <div className="footer-top-row">
          <div className="footer-brand-block">
            <div className="footer-brand-logo">
              <div className="footer-icon-badge">
                <LogoIcon size={32} />
              </div>
              <span className="footer-brand-title">Hara Vitalis</span>
            </div>
            <p className="footer-tagline">
              Renacer Pilates. Estudio especializado en movimiento consciente y
              bienestar integral.
            </p>
          </div>

          <nav
            className="footer-links-nav"
            aria-label="Navegación pie de página"
          >
            <button
              type="button"
              className="footer-nav-item"
              onClick={() => handleFooterLink("privacidad")}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Política de Privacidad
            </button>
            <button
              type="button"
              className="footer-nav-item"
              onClick={() => handleFooterLink("terminos")}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Términos de Servicio
            </button>
            <button
              type="button"
              className="footer-nav-item"
              onClick={() => handleFooterLink("contacto")}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Contacto
            </button>
            <button
              type="button"
              className="footer-nav-item"
              onClick={() => handleFooterLink("faq")}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Preguntas Frecuentes
            </button>
          </nav>
        </div>

        {/* Bottom Row: Copyright & Social Icons */}
        <div className="footer-bottom-row">
          <div className="footer-copyright-text">
            © 2026 Hara Vitalis. Todos los derechos reservados. Diseñada por
            Tomytool
          </div>

          <div className="footer-social-icons">
            {/* Instagram Icon */}
            <a
              href="https://www.instagram.com/haravitalis/?hl=es-la"
              aria-label="Instagram"
              className="social-icon-btn"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* Map Pin / Location Icon */}
            <a
              href="https://maps.app.goo.gl/RKtHuTkkLQcCLaCu8"
              aria-label="Ubicación"
              className="social-icon-btn"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
