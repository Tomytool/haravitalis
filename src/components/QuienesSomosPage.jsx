import imagenStudio from '/pilates-studio.jpg';

export default function QuienesSomosPage({ onNavigateToAuth, onNavigateToBooking, currentUser }) {
  const handleCtaClick = () => {
    if (currentUser) {
      onNavigateToBooking();
    } else {
      onNavigateToAuth(true); // Redirige a la página individual de registro
    }
  };

  return (
    <div className="page-wrapper page-quienes-somos">
      <section className="page-hero">
        <div className="page-hero-content">
          <span className="badge-pill-subtle">Sobre Nosotros</span>
          <h1 className="page-title">¿Quiénes somos en Hara Vitalis?</h1>
          <p className="page-lead">
            Somos un estudio especializado en movimiento consciente, corrección biomecánica y bienestar integral a través del sistema Pilates Reformer.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="grid-2-cols align-center">
          <div className="text-block">
            <h2>Nuestra Filosofía</h2>
            <p>
              En <strong>Hara Vitalis</strong> creemos que el movimiento no solo tonifica el cuerpo, sino que restaura el equilibrio entre la mente y el espíritu. Nuestro nombre combina "Hara" (el centro de energía vital del cuerpo en la filosofía oriental) y "Vitalis" (la fuerza de la vida y el bienestar renovado).
            </p>
            <p>
              A través del Pilates Reformer guiamos a nuestros alumnos en secuencias precisas, biomecánicamente seguras y adaptadas a la anatomía de cada individuo, garantizando resultados sostenibles sin estrés articular.
            </p>
          </div>
          <div className="image-block">
            <img src={imagenStudio} alt="Estudio Hara Vitalis" className="rounded-image shadow-lg" />
          </div>
        </div>

        <section className="values-section margin-top-xl">
          <h2 className="text-center margin-bottom-lg">Nuestros Pilares Fundamentales</h2>
          <div className="grid-3-cols">
            <div className="info-card">
              <div className="card-icon-badge">🎯</div>
              <h3>Precisión Biomédica</h3>
              <p>Clases estructuradas bajo principios biomecánicos para corregir la postura, prevenir lesiones y optimizar el rendimiento corporal.</p>
            </div>
            <div className="info-card">
              <div className="card-icon-badge">🌿</div>
              <h3>Bienestar Integral</h3>
              <p>Un espacio cálido y sereno diseñado para desconectar del estrés diario y reconectar con la respiración y el control consciente.</p>
            </div>
            <div className="info-card">
              <div className="card-icon-badge">🤝</div>
              <h3>Atención Personalizada</h3>
              <p>Grupos reducidos e instructores certificados que adaptan la intensidad de la resistencia para cada nivel físico.</p>
            </div>
          </div>
        </section>

        {/* Ubicación del Estudio */}
        <section className="location-section margin-top-xl">
          <div className="section-header-center" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="badge-pill-subtle" style={{ marginBottom: "0.75rem", display: "inline-block" }}>
              NUESTRA UBICACIÓN
            </span>
            <h2 style={{ fontSize: "1.85rem", fontWeight: "700", color: "#111827", marginBottom: "0.5rem" }}>
              Encuéntranos en Villa Alemana
            </h2>
            <p style={{ fontSize: "1rem", color: "#475569", maxWidth: "600px", margin: "0 auto" }}>
              Av. Valparaíso 2650, Villa Alemana, Valparaíso. Te esperamos en un espacio sereno y equipado para tu bienestar integral.
            </p>
          </div>

          <div
            className="map-container-card shadow-lg"
            style={{
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 30px rgba(37, 59, 89, 0.1)",
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d703.073790433582!2d-71.39701117746387!3d-33.04589723728041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689d832e56c464b%3A0x951c911d21fbc7ad!2sAv.%20Valpara%C3%ADso%202650%2C%206500000%20Villa%20Alemana%2C%20Valpara%C3%ADso!5e0!3m2!1ses-419!2scl!4v1788736013382!5m2!1ses-419!2scl"
              width="100%"
              height="450"
              style={{ border: 0, display: "block" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Ubicación Hara Vitalis Pilates - Av. Valparaíso 2650"
              sandbox="allow-scripts allow-same-origin allow-popups"
            ></iframe>
          </div>
        </section>

        <div className="cta-box margin-top-xl">
          <h2>¿Listo para vivir la experiencia Reformer?</h2>
          <p>Únete a nuestra comunidad y reserva tu primera clase de evaluación hoy mismo.</p>
          <button onClick={handleCtaClick} className="btn-primary-large">
            {currentUser ? "Reservar mi Clase" : "Registrarme y Reservar"}
          </button>
        </div>
      </div>
    </div>
  );
}
