import { useState, useEffect } from 'react';
import { suscribirClasesActivas } from '../firebase/clasesService';

// Auxiliares de formateo para rendimiento y claridad de renderizado
const formatFecha = (val) => {
  if (!val) return '';
  const d = val.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  const str = d.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatHora = (val) => {
  if (!val) return '';
  const d = val.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function HorariosPage({ onNavigateToAuth, onNavigateToBooking, currentUser }) {
  const [todasLasClases, setTodasLasClases] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Suscripción en tiempo real a la colección /clases de Firestore
  useEffect(() => {
    const unsubscribe = suscribirClasesActivas((lista) => {
      setTodasLasClases(lista);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  // Derivar las clases activas no caducadas directamente
  const ahora = new Date();
  const clasesVisibles = todasLasClases.filter((c) => {
    if (c.estado && c.estado !== "activa") return false;
    const fechaInicioObj = c.fecha_inicio?.toDate ? c.fecha_inicio.toDate() : (c.fecha_inicio ? new Date(c.fecha_inicio) : null);
    const fechaFinObj = c.fecha_fin?.toDate ? c.fecha_fin.toDate() : (c.fecha_fin ? new Date(c.fecha_fin) : null);
    const estaCaducada = (fechaFinObj && fechaFinObj < ahora) || (fechaInicioObj && fechaInicioObj < ahora);
    return !estaCaducada;
  });

  const handleBooking = () => {
    if (currentUser) {
      onNavigateToBooking();
    } else {
      onNavigateToAuth(true); // Redirige a la página individual de registro
    }
  };

  return (
    <div className="page-wrapper page-horarios">
      <section className="page-hero">
        <div className="page-hero-content">
          <span className="badge-pill-subtle">Parrilla de Clases</span>
          <h1 className="page-title">Horarios & Clases Disponibles</h1>
          <p className="page-lead">
            Explora las clases creadas y asignadas por nuestros instructores en tiempo real. Todas las sesiones cuentan con cupos limitados para garantizar una atención personalizada.
          </p>
        </div>
      </section>

      <div className="page-container">
        {cargando ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            color: '#253B59',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(206, 208, 242, 0.5)',
              borderTopColor: '#253B59',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '1rem'
            }}></div>
            Cargando horarios de clases desde Firebase...
          </div>
        ) : clasesVisibles.length === 0 ? (
          <div className="horario-card text-center" style={{ padding: '3.5rem 2rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>🧘‍♀️</span>
            <h3 className="horario-clase-name" style={{ marginBottom: '0.5rem' }}>No hay clases programadas actualmente</h3>
            <p className="horario-desc" style={{ maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
              El administrador actualizará próximamente la parrilla de horarios. ¡Vuelve a consultar pronto o regístrate para reservar tu lugar en cuanto abran nuevas fechas!
            </p>
            <button onClick={handleBooking} className="btn-schedule-action">
              {currentUser ? "Ir a mi Panel de Reservas" : "Registrarme para Futuras Clases"}
            </button>
          </div>
        ) : (
          <div className="horarios-grid margin-bottom-xl">
            {clasesVisibles.map((clase) => {
              const sinCupos = Number(clase.cupos_disponibles) <= 0;
              const fechaStr = formatFecha(clase.fecha_inicio);
              const horaInicioStr = formatHora(clase.fecha_inicio);
              const horaFinStr = formatHora(clase.fecha_fin);

              return (
                <div key={clase.id} className="horario-card">
                  <div className="horario-header">
                    <span className="horario-bloque">
                      {clase.tipo_servicio || "Pilates Reformer"}
                    </span>
                    <span className={`badge-pill ${sinCupos ? 'completo' : 'plazas'}`}>
                      {sinCupos ? "Cupos Agotados" : `${clase.cupos_disponibles} de ${clase.cupo_maximo} cupos`}
                    </span>
                  </div>

                  <h3 className="horario-clase-name">
                    {clase.tipo_servicio || "Clase de Reformer"}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.25rem 0' }}>
                    <div style={{ fontSize: '0.925rem', fontWeight: '600', color: '#253B59', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📅</span>
                      <span>{fechaStr || "Fecha a confirmar"}</span>
                    </div>
                    {horaInicioStr && (
                      <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>🕒</span>
                        <span>{horaInicioStr} - {horaFinStr}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>👤</span>
                      <span>Instructor: <strong>{clase.instructor || "Camila Soto"}</strong></span>
                    </div>
                  </div>

                  <button 
                    onClick={handleBooking} 
                    className={sinCupos ? "btn-disabled" : "btn-schedule-action"}
                    disabled={sinCupos}
                  >
                    {sinCupos ? "Clase Completa" : (currentUser ? "Reservar en esta Clase" : "Registrarme para Reservar")}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <section className="niveles-info-box">
          <h2>Niveles de Clases en Hara Vitalis</h2>
          <div className="grid-3-cols margin-top-md">
            <div className="nivel-card">
              <span className="nivel-badge principiante">Principiante / Esencial</span>
              <p>Ideal si es tu primera experiencia con el Reformer. Enfoque en la respiración, activación del core y aprendizaje de la máquina.</p>
            </div>
            <div className="nivel-card">
              <span className="nivel-badge intermedio">Intermedio / Flow</span>
              <p>Transiciones continuas y secuencias más dinámicas para desarrollar resistencia muscular y coordinación postural avanzada.</p>
            </div>
            <div className="nivel-card">
              <span className="nivel-badge avanzado">Avanzado / Challenge</span>
              <p>Para practicantes experimentados que buscan desafiar el equilibrio, fuerza explosiva y tensión máxima en los resortes.</p>
            </div>
          </div>
        </section>

        <div className="cta-box margin-top-xl text-center">
          <h2>¿Deseas asegurar tu cupo en el horario de tu preferencia?</h2>
          <p>Crea tu cuenta o inicia sesión para acceder al calendario interactivo de reservas en tiempo real.</p>
          <button onClick={handleBooking} className="btn-primary-large margin-top-sm">
            {currentUser ? "Ir al Calendario de Reservas" : "Crear mi Cuenta y Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
}
