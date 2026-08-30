import { LogoIcon } from './Navbar';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="brand-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <LogoIcon size={22} color="#FFFFFF" />
        </div>
        <span className="footer-brand-name">Hara Vitalis</span>
      </div>

      <nav className="footer-nav" aria-label="Navegación del pie de página">
        <a href="#terminos" className="footer-link">Términos y Condiciones</a>
        <a href="#privacidad" className="footer-link">Política de Privacidad</a>
        <a href="#contacto" className="footer-link">Contacto</a>
      </nav>

      <div className="footer-copyright">
        © {new Date().getFullYear()} Hara Vitalis. Todos los derechos reservados.
      </div>
    </footer>
  );
}
