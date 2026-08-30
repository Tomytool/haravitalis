import { useState } from 'react';
import { diasOctubre, clasesDisponiblesPorDia, proximasClasesIniciales } from '../datos/clasesData';

export default function BookingPage({ currentUser }) {
  const [selectedDayId, setSelectedDayId] = useState("2024-10-15");
  const [clasesState, setClasesState] = useState(clasesDisponiblesPorDia);
  const [proximasClases, setProximasClases] = useState(proximasClasesIniciales);
  const [notification, setNotification] = useState('');

  // Formatear el día seleccionado para el título
  const diaSeleccionadoObj = diasOctubre.find((d) => d.id === selectedDayId);
  const nombreDia = diaSeleccionadoObj ? `${diaSeleccionadoObj.diaSemana === 'Mar' ? 'Martes' : diaSeleccionadoObj.diaSemana} ${diaSeleccionadoObj.numero}` : 'Seleccionado';

  const clasesDelDia = clasesState[selectedDayId] || [];

  const handleReservar = (clase) => {
    if (clase.plazasDisponibles <= 0) return;

    // Actualizar disponibilidad
    setClasesState((prevState) => {
      const actualizadas = prevState[selectedDayId].map((item) => {
        if (item.id === clase.id) {
          const nuevasPlazas = item.plazasDisponibles - 1;
          return {
            ...item,
            plazasDisponibles: nuevasPlazas,
            plazasTexto: nuevasPlazas > 0 ? `${nuevasPlazas} plaza${nuevasPlazas > 1 ? 's' : ''}` : 'Completo',
            estado: nuevasPlazas > 0 ? 'disponible' : 'completo'
          };
        }
        return item;
      });
      return { ...prevState, [selectedDayId]: actualizadas };
    });

    // Agregar a próximas clases
    const nuevaReserva = {
      id: `res-${Date.now()}`,
      etiquetaFecha: `${diaSeleccionadoObj.diaSemana.toUpperCase()}, ${diaSeleccionadoObj.numero} OCT`,
      titulo: clase.titulo,
      horario: `${clase.hora} - ${calculaFin(clase.hora)}`,
      tieneNotificacion: true
    };

    setProximasClases([nuevaReserva, ...proximasClases]);
    setNotification(`¡Clase de ${clase.titulo} reservada con éxito!`);
    
    setTimeout(() => setNotification(''), 4000);
  };

  const calculaFin = (horaInicio) => {
    const [h, m] = horaInicio.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + 50);
    const fh = String(date.getHours()).padStart(2, '0');
    const fm = String(date.getMinutes()).padStart(2, '0');
    return `${fh}:${fm}`;
  };

  // Capitalizar nombre de usuario
  const nombreMostrar = currentUser?.usuario 
    ? currentUser.usuario.charAt(0).toUpperCase() + currentUser.usuario.slice(1)
    : 'Usuario';

  return (
    <div className="booking-page-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '88px',
          right: '24px',
          backgroundColor: '#253B59',
          color: '#FFFFFF',
          padding: '0.85rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(37, 59, 89, 0.25)',
          zIndex: 100,
          fontWeight: '600',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: '1px solid #CED0F2'
        }}>
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header Sección Agendamiento */}
      <div className="booking-header">
        <h1 className="booking-title">Reserva tu sesión</h1>
        <h2 className="booking-username">{nombreMostrar}</h2>
        <p className="booking-subtitle">
          Selecciona el día y la clase que mejor se adapte a tu horario.
        </p>
      </div>

      {/* Grid Principal: Izquierda (Calendario + Clases) / Derecha (Sidebar) */}
      <div className="booking-grid">
        <div className="booking-main">
          {/* Tarjeta de Calendario Horizontal */}
          <div className="calendar-card">
            <div className="calendar-card-header">
              <span className="month-title">Octubre 2024</span>
              <div className="calendar-nav-btns">
                <button className="nav-arrow-btn" aria-label="Mes anterior">{"‹"}</button>
                <button className="nav-arrow-btn" aria-label="Mes siguiente">{"›"}</button>
              </div>
            </div>

            <div className="days-row">
              {diasOctubre.map((dia) => {
                const isActive = dia.id === selectedDayId;
                return (
                  <button
                    key={dia.id}
                    className={`day-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedDayId(dia.id)}
                  >
                    <span className="day-name">{dia.diaSemana}</span>
                    <span className="day-number">{dia.numero}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Clases Disponibles */}
          <div>
            <h3 className="classes-section-title">
              Clases Disponibles - {nombreDia}
            </h3>

            <div className="classes-list">
              {clasesDelDia.length > 0 ? (
                clasesDelDia.map((clase) => {
                  const isFull = clase.plazasDisponibles <= 0;
                  return (
                    <div key={clase.id} className="class-card">
                      <div className="class-left-info">
                        <div className="time-box">
                          <span className="time-text">{clase.hora}</span>
                          <span className="duration-text">{clase.duracion}</span>
                        </div>

                        <div className="class-details">
                          <h4 className="class-name">{clase.titulo}</h4>
                          <span className="class-instructor">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {clase.instructor}
                          </span>

                          <div className="class-pills-row">
                            <span className="badge-pill">{clase.nivel}</span>
                            <span className={`badge-pill ${isFull ? 'completo' : 'plazas'}`}>
                              {clase.plazasTexto}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isFull ? (
                          <button className="btn-disabled" disabled>
                            Lista de espera
                          </button>
                        ) : (
                          <button 
                            className="btn-reserve" 
                            onClick={() => handleReservar(clase)}
                          >
                            Reservar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  padding: '2.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: '#64748B'
                }}>
                  No hay clases programadas para este día.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Derecho */}
        <aside className="booking-sidebar">
          {/* Tarjeta Azul Navy: Mis Próximas Clases */}
          <div className="upcoming-card">
            <div className="upcoming-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Mis Próximas Clases</span>
            </div>

            <div className="upcoming-list">
              {proximasClases.map((item) => (
                <div key={item.id} className="upcoming-item">
                  <div className="upcoming-item-top">
                    <span className="upcoming-date-tag">{item.etiquetaFecha}</span>
                    {item.tieneNotificacion && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CED0F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    )}
                  </div>

                  <h5 className="upcoming-class-title">{item.titulo}</h5>
                  
                  <div className="upcoming-time-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{item.horario}</span>
                  </div>
                </div>
              ))}
            </div>

            <a href="#historial" className="view-history-link">
              Ver todo el historial
            </a>
          </div>

          {/* Tarjeta de Imagen Apaisada del Estudio */}
          <div className="sidebar-image-card">
            <img 
              src="/pilates-studio-wide.jpg" 
              alt="Estudio Reformer de Hara Vitalis" 
              className="sidebar-image"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
