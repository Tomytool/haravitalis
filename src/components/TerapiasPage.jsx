import imagenStudio from "/terapias_holisticas.png";
import qrTerapias from "/qr_terapia.svg";

export default function TerapiasPage({
  onNavigateToAuth,
  onNavigateToBooking,
  currentUser,
}) {
  const handleReservaClick = (nombreServicio) => {
    if (currentUser) {
      onNavigateToBooking(nombreServicio);
    } else {
      onNavigateToAuth(true);
    }
  };

  const servicios = [
    {
      id: 1,
      badge: "Terapia Principal",
      duracion: "50 min",
      titulo: "Acupuntura Bioenergética",
      descripcion:
        "Inserción indolora de agujas estériles en puntos clave de los meridianos para restablecer el flujo de Qi, reducir inflamación articular y liberar endorfinas analgésicas.",
      bullets: [
        "Alivio inmediato de dolor cervical y lumbar",
        "Equilibrio emocional y disminución de ansiedad",
      ],
      precio: "$25.000",
      destacado: false,
    },
    {
      id: 2,
      badge: "Descompresión Miofascial",
      duracion: "40 min",
      titulo: "Ventosaterapia (Cupping)",
      descripcion:
        "Aplicación de ventosas de cristal mediante succión suave para oxigenar los tejidos profundos, estimular la circulación linfática y disolver adherencias musculares.",
      bullets: [
        "Drenaje de toxinas y mejora de vascularización",
        "Relajación instantánea de trapecios y dorsales",
      ],
      precio: "$25.000",
      destacado: false,
    },
    {
      id: 3,
      badge: "Terapia Manual Tradicional",
      duracion: "60 min",
      titulo: "Masaje Tui Na",
      descripcion:
        "Masaje terapéutico tradicional chino que utiliza presiones, tracciones y manipulaciones articulares clínicas para corregir desequilibrios biomecánicos.",
      bullets: [
        "Ideal antes o después de sesiones intensas",
        "Movilización ligamentosa y articular",
      ],
      precio: "$25.000",
      destacado: false,
    },
  ];

  return (
    <div className="page-wrapper page-terapias">
      {/* =========================================================================
          HERO SECTION
         ========================================================================= */}
      <section className="terapias-hero-section">
        <div className="terapias-hero-container">
          {/* Left Column Text */}
          <div className="terapias-hero-content">
            <span className="badge-pill-subtle hero-terapias-badge">
              BIENESTAR HOLÍSTICO COMPLEMENTARIO
            </span>

            <h1 className="terapias-hero-title">
              Medicina Tradicional China y Terapias Integrativas
            </h1>

            <p className="terapias-hero-description">
              Potencia tu práctica de Pilates Reformer con terapias milenarias
              diseñadas para desbloquear la energía vital (Qi), acelerar la
              regeneración muscular y restaurar el equilibrio físico y mental
              profundo.
            </p>

            <div className="terapias-hero-actions">
              <a href="#catalogo" className="btn-terapias-primary">
                Explorar Terapias <span className="arrow-icon">→</span>
              </a>
              <a href="#diagnostico" className="btn-terapias-secondary">
                Agendar Diagnóstico Energético
              </a>
            </div>

            {/* Stats Row */}
            <div className="terapias-hero-stats">
              <div className="stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">Tratamientos Personalizados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">Sinergia</span>
                <span className="stat-label">
                  Pilates + Electromoxibustión/Qi
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">Terapeutas</span>
                <span className="stat-label">Certificados en MTC</span>
              </div>
            </div>
          </div>

          {/* Right Column Image with Floating Card */}
          <div className="terapias-hero-media">
            <div className="hero-media-wrapper shadow-lg">
              <img
                src={imagenStudio}
                alt="Santuario de Calma y Alivio en Hara Vitalis"
                className="terapias-hero-img"
              />
              <div className="floating-sanctuary-card glass-card">
                <div className="sanctuary-icon-badge">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#253B59"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="sanctuary-text">
                  <h4 className="sanctuary-title">
                    Santuario de Calma & Alivio
                  </h4>
                  <p className="sanctuary-desc">
                    Sesiones individuales en un entorno acústico y aromático
                    sereno.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: LA SINERGIA PERFECTA PARA TU CUERPO
         ========================================================================= */}
      <section className="terapias-sinergia-section">
        <div className="terapias-section-container">
          <div className="section-header-center">
            <h2 className="section-title-h2">
              La Sinergia Perfecta para tu Cuerpo
            </h2>
            <p className="section-subtitle">
              Mientras el Pilates Reformer fortalece el núcleo postural, la
              flexibilidad y la alineación articular, la Medicina Tradicional
              China restablece la circulación energética, calma el sistema
              nervioso y disuelve contracturas crónicas.
            </p>
          </div>

          <div className="sinergia-cards-grid">
            <div className="sinergia-card glass-card">
              <div className="sinergia-card-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#253B59"
                  strokeWidth="2"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="sinergia-card-title">
                Recuperación Miofascial Acelerada
              </h3>
              <p className="sinergia-card-text">
                Combinamos ventosaterapia y acupuntura para drenar el ácido
                láctico, relajar fascias sobrecargadas y ampliar rangos de
                movimiento más amplios en cada sesión de reformer.
              </p>
            </div>

            <div className="sinergia-card glass-card">
              <div className="sinergia-card-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#253B59"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="sinergia-card-title">
                Regulación del Estrés y Sistema Nervioso
              </h3>
              <p className="sinergia-card-text">
                El estímulo en meridianos específicos promueve la respuesta
                parasimpática, combatiendo el cortisol, el insomnio y la tensión
                muscular involuntaria.
              </p>
            </div>

            <div className="sinergia-card glass-card">
              <div className="sinergia-card-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#253B59"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="sinergia-card-title">
                Prevención & Tratamiento del Dolor
              </h3>
              <p className="sinergia-card-text">
                Ideal para tratar lumbalgias, cervicalgias, ciática y
                desequilibrios posturales recurrentes desde su origen
                neuromuscular y bioenergético.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CATÁLOGO DE SERVICIOS
         ========================================================================= */}
      <section id="catalogo" className="terapias-catalogo-section">
        <div className="terapias-section-container">
          <div className="catalogo-header-flex">
            <div className="catalogo-header-text">
              <span className="badge-pill-subtle">CATÁLOGO DE SERVICIOS</span>
              <h2 className="section-title-h2">
                Terapias Integrativas Disponibles
              </h2>
              <p className="section-subtitle-left">
                Cada tratamiento es llevado a cabo por especialistas acreditados
                en Medicina Tradicional China, con protocolos adaptados a tu
                estado físico y tus objetivos de bienestar.
              </p>
            </div>
          </div>

          {/* Cards Grid 3x2 */}
          <div className="catalogo-cards-grid">
            {servicios.map((servicio) => (
              <div
                key={servicio.id}
                className={`servicio-card ${
                  servicio.destacado ? "servicio-card-featured" : "glass-card"
                }`}
              >
                <div className="card-top-bar">
                  <div className="card-badges">
                    <span className="badge-tag">{servicio.badge}</span>
                    {servicio.badgeSecondary && (
                      <span className="badge-tag-secondary">
                        {servicio.badgeSecondary}
                      </span>
                    )}
                  </div>
                  <span className="card-duration">{servicio.duracion}</span>
                </div>

                <h3 className="servicio-card-title">{servicio.titulo}</h3>
                <p className="servicio-card-desc">{servicio.descripcion}</p>

                <ul className="servicio-bullets-list">
                  {servicio.bullets.map((bullet, idx) => (
                    <li key={`${servicio.id}-${idx}`}>
                      <span className="check-icon">✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="servicio-card-footer">
                  <div className="price-block">
                    <span className="price-label">
                      {servicio.destacado
                        ? "Sesión Doble"
                        : "Precio por sesión"}
                    </span>
                    <div className="price-values">
                      <span className="price-amount">{servicio.precio}</span>
                      {servicio.precioOriginal && (
                        <span className="price-original">
                          antes {servicio.precioOriginal}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleReservaClick(servicio.titulo)}
                    className={
                      servicio.destacado
                        ? "btn-servicio-featured"
                        : "btn-servicio-action"
                    }
                  >
                    {servicio.destacado ? "Adquirir Pack" : "Reservar Sesión"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PROTOCOLO DE ATENCIÓN PERSONALIZADA / FORMULARIO
         ========================================================================= */}
      <section id="diagnostico" className="terapias-diagnostico-section">
        <div className="terapias-section-container">
          <div className="diagnostico-grid">
            {/* Left Box: Info & Steps */}
            <div className="diagnostico-info-box">
              <span className="badge-pill-subtle">
                PROTOCOLO DE ATENCIÓN PERSONALIZADA
              </span>
              <h2 className="section-title-h2">
                ¿No estás seguro de cuál terapia es ideal para ti?
              </h2>
              <p className="body-text margin-bottom-lg">
                En tu primera visita realizamos una valoración de pulso, lengua
                y palpación de meridianos de acuerdo a la Medicina Tradicional
                China para diseñar un plan adaptado a tu morfología y nivel de
                entrenamiento en Pilates.
              </p>

              <div className="diagnostico-steps-list">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4 className="step-title">Anamnesis Integral</h4>
                    <p className="step-desc">
                      Evaluación de hábitos, dolencias posturales y niveles de
                      estrés corporal.
                    </p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4 className="step-title">Plan Sinérgico</h4>
                    <p className="step-desc">
                      Coordinación continua con tus instructores de Pilates
                      Reformer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: QR Card */}
            <div
              className="diagnostico-form-card shadow-lg"
              style={{ textAlign: "center" }}
            >
              <h3 className="form-card-title">
                Escanea para Solicitar Asesoramiento
              </h3>
              <p className="form-card-subtitle">
                Escanea este código QR desde tu teléfono para enviar tu
                solicitud directamente a nuestro equipo.
              </p>

              <div
                className="qr-container"
                style={{ margin: "1.5rem auto", maxWidth: "260px" }}
              >
                <img
                  src={qrTerapias}
                  alt="Código QR para solicitar asesoramiento"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "12px",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#64748B",
                  marginTop: "1rem",
                }}
              >
                Un terapeuta colegiado responderá a tu consulta a la brevedad.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
