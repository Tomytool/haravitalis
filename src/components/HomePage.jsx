import { useState } from "react";
import imagenStudio from "/pilates-studio.jpg";

export default function HomePage({
  onNavigateToAuth,
  onNavigateToBooking,
  onNavigateToHorarios,
  currentUser,
}) {
  const [categoriaPlanes, setCategoriaPlanes] = useState("todos");

  const handleBookingClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      onNavigateToBooking();
    } else {
      // Navega directamente a la página individual de registro
      onNavigateToAuth(true);
    }
  };

  const handleVerHorarios = (e) => {
    e.preventDefault();
    onNavigateToHorarios();
  };

  const planes = [
    {
      id: "p1",
      categoria: "planes",
      titulo: "1 Clase Individual",
      frecuencia: "Clase individual",
      precio: "$10.000",
      descripcion:
        "Ideal para conocer la técnica Reformer o tomar una sesión puntual.",
      caracteristicas: [
        "1 Clase de Pilates Reformer",
        "Atención personalizada",
        "Equipamiento completo incluido",
      ],
      popular: false,
    },
    {
      id: "p2",
      categoria: "planes",
      titulo: "1 Clase Semanal",
      frecuencia: "4 clases x mes",
      precio: "$40.000",
      descripcion: "Para mantener constancia y movilidad semanal.",
      caracteristicas: [
        "4 Clases mensuales de Reformer",
        "Horario fijo a tu elección",
        "Seguimiento postural continuo",
      ],
      popular: false,
    },
    {
      id: "p3",
      categoria: "planes",
      titulo: "2 Clases Semanales",
      frecuencia: "8 clases x mes",
      precio: "$58.000",
      descripcion:
        "El plan recomendado para transformar tu postura y tono muscular.",
      caracteristicas: [
        "8 Clases mensuales de Reformer",
        "Flexibilidad de reprogramación",
        "Avance biomecánico continuo",
      ],
      popular: true,
      badge: "MÁS POPULAR",
    },
    {
      id: "p4",
      categoria: "planes",
      titulo: "3 Clases Semanales",
      frecuencia: "12 clases x mes",
      precio: "$75.000",
      descripcion: "Acondicionamiento físico intensivo y hábito saludable.",
      caracteristicas: [
        "12 Clases mensuales de Reformer",
        "Prioridad de reserva de horario",
        "Desarrollo máximo de fuerza e higiene postural",
      ],
      popular: false,
    },
    {
      id: "sp1",
      categoria: "superplanes",
      titulo: "Super Plan 4",
      frecuencia: "4 clases + 2 terapias",
      precio: "$57.000",
      descripcion: "Combinación ideal de movimiento y relajación muscular.",
      caracteristicas: [
        "4 Clases mensuales de Reformer",
        "2 Sesiones de Terapia Integrativa (MTC/Acupuntura/Cupping)",
        "Diagnóstico postural y energético de cortesía",
      ],
      popular: false,
      badge: "COMBO BIENESTAR",
    },
    {
      id: "sp2",
      categoria: "superplanes",
      titulo: "Super Plan 8",
      frecuencia: "8 clases + 2 terapias",
      precio: "$75.000",
      descripcion:
        "Sinergia completa entre fuerza postural y regeneración miofascial.",
      caracteristicas: [
        "8 Clases mensuales de Reformer",
        "2 Sesiones de Terapia Integrativa a elección",
        "Plan de recuperación muscular continuo",
      ],
      popular: true,
      badge: "RECOMENDADO VITALIS",
    },
    {
      id: "sp3",
      categoria: "superplanes",
      titulo: "Super Plan 12",
      frecuencia: "12 clases + 2 terapias",
      precio: "$92.000",
      descripcion:
        "Experiencia holística máxima para un renacer físico integral.",
      caracteristicas: [
        "12 Clases mensuales de Reformer",
        "2 Sesiones de Terapia Integrativa intensivas",
        "Seguimiento biomecánico y bioenergético total",
      ],
      popular: false,
      badge: "EXPERIENCIA TOTAL",
    },
  ];

  const planesFiltrados = planes.filter((p) => {
    if (categoriaPlanes === "todos") return true;
    return p.categoria === categoriaPlanes;
  });

  return (
    <div className="homepage-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section" id="home">
        <div className="hero-grid">
          {/* Columna Izquierda: Texto e Interacción */}
          <div className="hero-content">
            <div className="hero-badge">
              <span>Pilates Reformer, la evolución del movimiento</span>
            </div>

            <h1 className="hero-title">
              Descubre la Ciencia y Elegancia del{" "}
              <span className="hero-title-highlight">Pilates Reformer</span>
            </h1>

            <p className="hero-subtitle">
              Entrenamiento de bajo impacto, resistencia adaptable y precisión
              corporal para renovar tu postura y bienestar diario.
            </p>

            <div className="hero-cta-group">
              <button
                onClick={handleBookingClick}
                className="btn-hero-primary"
                aria-label="Agendar Clase Demo"
              >
                <span>Agendar Clase Demo</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <button
                onClick={handleVerHorarios}
                className="btn-hero-secondary"
              >
                Ver Horarios
              </button>
            </div>
          </div>

          {/* Columna Derecha: Imagen del Estudio con Floating Card */}
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src={imagenStudio}
                alt="Estudio de Pilates Reformer iluminado con luz natural"
                className="hero-main-img"
              />

              {/* Floating Card: Transformación Consciente */}
              <div className="hero-floating-card">
                <div className="floating-icon-circle">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v3m0 12v3M5 12H2m20 0h-3m-2.5-6.5L14.4 7.6M9.6 16.4l-2.1 2.1m0-11.5l2.1 2.1m9.6 9.6l-2.1-2.1"></path>
                  </svg>
                </div>
                <div className="floating-card-text">
                  <h3>Transformación Consciente</h3>
                  <p>Conecta mente y cuerpo en cada movimiento.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN EXPLICATIVA: Pilates Reformer, la evolución del movimiento */}
      <section className="section-overview" id="que-es-reformer">
        <div className="section-header-center">
          <h2 className="section-title">
            Pilates Reformer, la evolución del movimiento
          </h2>
          <p className="section-intro-text">
            A diferencia del Pilates tradicional en colchoneta (Mat Pilates), el
            Reformer utiliza una máquina especializada diseñada por Joseph
            Pilates. Esta estructura tipo cama cuenta con un carro deslizante,
            resortes de resistencia variable, cuerdas y poleas, ofreciendo un
            entorno controlado que desafía la gravedad y asiste el movimiento
            simultáneamente.
          </p>
        </div>

        <div className="feature-cards-grid">
          {/* Card 1: ¿Qué es el Pilates Reformer? */}
          <div className="feature-card">
            <div className="feature-icon-badge">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#253B59"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </div>
            <h3 className="feature-card-title">¿Qué es el Pilates Reformer?</h3>
            <p className="feature-card-body">
              El sistema de resortes del Reformer permite ajustar la resistencia
              de manera precisa para cada ejercicio y nivel de condición física.
              Esto significa que puede proporcionar un soporte suave para la
              rehabilitación de lesiones o un desafío intenso para atletas
              avanzados, todo dentro de una misma sesión, adaptándose a las
              necesidades biomecánicas de tu cuerpo en tiempo real.
            </p>
          </div>

          {/* Card 2: ¿Cómo funciona la experiencia de clase? */}
          <div className="feature-card">
            <div className="feature-icon-badge">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#253B59"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">
              ¿Cómo funciona la experiencia de clase?
            </h3>
            <p className="feature-card-body">
              Nuestras clases de Reformer están diseñadas para fluir. Acostado,
              sentado, de pie o arrodillado sobre el carro, realizarás
              secuencias de movimientos que requieren estabilización del core
              (centro de energía) mientras mueves extremidades contra la
              resistencia de los resortes. Esta tensión constante fomenta
              contracciones musculares excéntricas (alargamiento bajo tensión),
              lo que resulta en músculos largos, magros y articulaciones fuertes
              sin el volumen asociado al levantamiento de pesas tradicional.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN PLANES & TARIFAS */}
      <section className="section-benefits" id="beneficios">
        <div className="benefits-container-card">
          <div className="section-header-center">
            <span
              className="badge-pill-subtle"
              style={{ marginBottom: "0.75rem" }}
            >
              NUESTROS PLANES Y TARIFAS
            </span>
            <h2 className="section-title">Planes & Membresías</h2>
            <p className="section-subtitle">
              Elige la opción que mejor se adapte a tu ritmo de vida. Contamos
              con clases individuales, planes mensuales de Pilates Reformer y
              Súper Planes combinados con Terapias Integrativas.
            </p>

            {/* Categorías / Filtros de Planes */}
            <div className="planes-tabs-container">
              <button
                className={`plan-tab-btn ${categoriaPlanes === "todos" ? "active" : ""}`}
                onClick={() => setCategoriaPlanes("todos")}
              >
                Todos los Planes
              </button>
              <button
                className={`plan-tab-btn ${categoriaPlanes === "planes" ? "active" : ""}`}
                onClick={() => setCategoriaPlanes("planes")}
              >
                Planes Pilates
              </button>
              <button
                className={`plan-tab-btn ${categoriaPlanes === "superplanes" ? "active" : ""}`}
                onClick={() => setCategoriaPlanes("superplanes")}
              >
                ✨ Súper Planes (Pilates + Terapia)
              </button>
            </div>
          </div>

          <div className="planes-grid">
            {planesFiltrados.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card-item ${plan.popular ? "plan-card-popular" : ""} ${
                  plan.categoria === "superplanes" ? "plan-card-super" : ""
                }`}
              >
                {plan.badge && (
                  <span className="plan-badge-tag">{plan.badge}</span>
                )}

                <div className="plan-card-header">
                  <span className="plan-frecuencia-badge">
                    {plan.frecuencia}
                  </span>
                  <h3 className="plan-card-title">{plan.titulo}</h3>
                  <p className="plan-card-desc">{plan.descripcion}</p>
                </div>

                <div className="plan-price-wrapper">
                  <span className="plan-price-amount">{plan.precio}</span>
                </div>

                <ul className="plan-features-list">
                  {plan.caracteristicas.map((item, idx) => (
                    <li key={`${plan.id}-${idx}`}>
                      <span className="plan-check-icon">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleBookingClick}
                  className={`btn-plan-action ${
                    plan.popular ? "btn-plan-popular" : "btn-plan-standard"
                  }`}
                >
                  {currentUser ? "Elegir Plan" : "Registrarme y Reservar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN HORARIOS & CALL TO ACTION */}
      <section className="section-cta-banner">
        <div className="cta-banner-content">
          <h2>¿Listo para experimentar el verdadero movimiento consciente?</h2>
          <p>
            Consulta nuestros horarios disponibles o regístrate hoy mismo para
            agendar tu primera clase de Pilates Reformer.
          </p>
          <div className="cta-banner-buttons">
            <button onClick={handleBookingClick} className="btn-cta-white">
              {currentUser ? "Reservar mi Clase" : "Registrarme y Reservar"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
