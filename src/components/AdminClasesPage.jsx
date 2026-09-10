import { useState, useEffect } from 'react';
import {
  suscribirTodasLasClasesAdmin,
  crearClaseAdmin,
  actualizarClaseAdmin,
  eliminarClaseAdmin
} from '../firebase/clasesService';
import AdminUsuariosTab from './AdminUsuariosTab';

export default function AdminClasesPage({ currentUser }) {
  const [tabActiva, setTabActiva] = useState('clases'); // 'clases' | 'usuarios'
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  
  // Modal de formulario (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claseEditando, setClaseEditando] = useState(null); // null = crear nueva

  // Estado del formulario con los 9 campos solicitados
  const [formData, setFormData] = useState({
    tipo_servicio: 'Pilates Reformer',
    instructor: 'Camila Soto',
    cupo_maximo: 5,
    cupos_disponibles: 5,
    estado: 'activa',
    fecha_inicio: '',
    fecha_fin: '',
    visible_desde: '',
    inscritos_ids: []
  });

  const [inscritoInput, setInscritoInput] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [notification, setNotification] = useState({ message: '', error: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Bloqueo de scroll en el body al abrir cualquier modal
  useEffect(() => {
    if (isModalOpen || confirmDeleteId !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, confirmDeleteId]);

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (confirmDeleteId) setConfirmDeleteId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, confirmDeleteId]);

  // Escuchar todas las clases en Firestore en tiempo real e inactivar caducadas
  useEffect(() => {
    if (currentUser?.rol !== 'admin') return;

    const unsubscribe = suscribirTodasLasClasesAdmin((lista) => {
      const ahora = new Date();
      const listaProcesada = lista.map((clase) => {
        const fechaFinObj = clase.fecha_fin?.toDate ? clase.fecha_fin.toDate() : (clase.fecha_fin ? new Date(clase.fecha_fin) : null);
        const fechaInicioObj = clase.fecha_inicio?.toDate ? clase.fecha_inicio.toDate() : (clase.fecha_inicio ? new Date(clase.fecha_inicio) : null);

        const haCaducado = (fechaFinObj && fechaFinObj < ahora) || (fechaInicioObj && fechaInicioObj < ahora);

        if (haCaducado && clase.estado === 'activa') {
          // Inactivar automáticamente en Firestore y en la interfaz
          actualizarClaseAdmin(clase.id, { ...clase, estado: 'inactiva' }).catch((err) =>
            console.error("Error inactivando clase caducada automáticamente:", err)
          );
          return { ...clase, estado: 'inactiva' };
        }
        return clase;
      });

      setClases(listaProcesada);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auxiliar para convertir Timestamp/Date a string ISO local (YYYY-MM-DDTHH:mm) para datetime-local input
  const dateToDatetimeLocal = (val) => {
    if (!val) return '';
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Auxiliar para formatear fecha para la tabla
  const formatearFechaTabla = (val) => {
    if (!val) return 'N/A';
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Abrir Modal para crear una nueva clase
  const handleAbrirCrear = () => {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    setClaseEditando(null);
    setFormData({
      tipo_servicio: 'Pilates Reformer',
      instructor: 'Camila Soto',
      cupo_maximo: 5,
      cupos_disponibles: 5,
      estado: 'activa',
      fecha_inicio: dateToDatetimeLocal(ahora),
      fecha_fin: dateToDatetimeLocal(unaHoraDespues),
      visible_desde: dateToDatetimeLocal(ahora),
      inscritos_ids: []
    });
    setInscritoInput('');
    setIsModalOpen(true);
  };

  // Abrir Modal para editar una clase existente
  const handleAbrirEditar = (clase) => {
    setClaseEditando(clase);
    setFormData({
      tipo_servicio: clase.tipo_servicio || 'Pilates Reformer',
      instructor: clase.instructor || '',
      cupo_maximo: clase.cupo_maximo ?? 5,
      cupos_disponibles: clase.cupos_disponibles ?? 5,
      estado: clase.estado || 'activa',
      fecha_inicio: dateToDatetimeLocal(clase.fecha_inicio),
      fecha_fin: dateToDatetimeLocal(clase.fecha_fin),
      visible_desde: dateToDatetimeLocal(clase.visible_desde),
      inscritos_ids: Array.isArray(clase.inscritos_ids) ? [...clase.inscritos_ids] : []
    });
    setInscritoInput('');
    setIsModalOpen(true);
  };

  const handleAgregarInscrito = () => {
    if (!inscritoInput.trim()) return;
    const uid = inscritoInput.trim();
    if (!formData.inscritos_ids.includes(uid)) {
      setFormData({
        ...formData,
        inscritos_ids: [...formData.inscritos_ids, uid]
      });
    }
    setInscritoInput('');
  };

  const handleRemoverInscrito = (uidRemover) => {
    setFormData({
      ...formData,
      inscritos_ids: formData.inscritos_ids.filter((id) => id !== uidRemover)
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (!formData.fecha_inicio || !formData.fecha_fin || !formData.visible_desde) {
        throw new Error("Por favor completa todas las fechas y horarios de la clase.");
      }

      if (claseEditando) {
        await actualizarClaseAdmin(claseEditando.id, formData);
        setNotification({ message: '¡Clase actualizada con éxito!', error: false });
      } else {
        await crearClaseAdmin(formData);
        setNotification({ message: '¡Nueva clase creada con éxito!', error: false });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar clase:", error);
      setNotification({ message: error.message || "Error al procesar la solicitud", error: true });
    } finally {
      setGuardando(false);
      setTimeout(() => setNotification({ message: '', error: false }), 4000);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDeleteId) return;
    try {
      await eliminarClaseAdmin(confirmDeleteId);
      setNotification({ message: 'Clase eliminada de Firestore.', error: false });
    } catch (error) {
      console.error("Error al eliminar clase:", error);
      setNotification({ message: 'No se pudo eliminar la clase.', error: true });
    } finally {
      setConfirmDeleteId(null);
      setTimeout(() => setNotification({ message: '', error: false }), 4000);
    }
  };

  // RBAC: Verificación de Rol
  if (currentUser?.rol !== 'admin') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '4rem auto',
        padding: '3rem 2rem',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '20px',
        textAlign: 'center',
        color: '#991B1B'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: '#7F1D1D' }}>
          Acceso Restringido
        </h2>
        <p style={{ fontSize: '1rem', color: '#991B1B' }}>
          Lo sentimos, esta sección es de uso exclusivo para usuarios con el rol de <strong>Administrador</strong>.
        </p>
      </div>
    );
  }

  // Filtrado de clases
  const clasesFiltradas = clases.filter((c) => {
    const coincideTexto =
      (c.tipo_servicio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.instructor || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'todas' || c.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="admin-page-container">
      {/* Selector de Pestañas Principal de Administrador */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        borderBottom: '2px solid rgba(206, 208, 242, 0.4)',
        paddingBottom: '0.75rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setTabActiva('clases')}
          style={{
            backgroundColor: tabActiva === 'clases' ? '#253B59' : '#F1F5F9',
            color: tabActiva === 'clases' ? '#FFFFFF' : '#64748B',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.75rem',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: tabActiva === 'clases' ? '0 4px 14px rgba(37, 59, 89, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <span>🗓️</span> Gestión de Clases
        </button>

        <button
          onClick={() => setTabActiva('usuarios')}
          style={{
            backgroundColor: tabActiva === 'usuarios' ? '#253B59' : '#F1F5F9',
            color: tabActiva === 'usuarios' ? '#FFFFFF' : '#64748B',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.75rem',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: tabActiva === 'usuarios' ? '0 4px 14px rgba(37, 59, 89, 0.25)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <span>👥</span> Usuarios e Inscritos (CRUD)
        </button>
      </div>

      {/* Renderizado según la pestaña activa */}
      {tabActiva === 'usuarios' ? (
        <AdminUsuariosTab />
      ) : (
        <>
          {/* Toast Notification */}
          {notification.message && (
            <div style={{
              position: 'fixed',
              top: '88px',
              right: '24px',
              backgroundColor: notification.error ? '#991B1B' : '#253B59',
              color: '#FFFFFF',
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(37, 59, 89, 0.25)',
              zIndex: 1200,
              fontWeight: '600',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: notification.error ? '1px solid #FCA5A5' : '1px solid #CED0F2'
            }}>
              <span>{notification.error ? '⚠️' : '✨'}</span>
              <span>{notification.message}</span>
            </div>
          )}

          {/* Header del Panel de Clases */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 1rem',
                backgroundColor: 'rgba(206, 208, 242, 0.4)',
                color: '#253B59',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>
                ⚙️ Panel de Control Administrador
              </span>
              <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '700', color: '#253B59', margin: 0 }}>
                Gestión de Clases
              </h1>
            </div>

            <button
              onClick={handleAbrirCrear}
              style={{
                backgroundColor: '#253B59',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.875rem 1.75rem',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 59, 89, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>➕</span> Nueva Clase
            </button>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(206, 208, 242, 0.5)',
            borderRadius: '20px',
            padding: '1.25rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(37, 59, 89, 0.04)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ flex: '1 1 280px', width: '100%' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por instructor o servicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: '#F8FAFC'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['todas', 'activa', 'inactiva', 'completada', 'cancelada'].map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    backgroundColor: filtroEstado === est ? '#253B59' : '#F1F5F9',
                    color: filtroEstado === est ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.2s ease',
                    minHeight: '38px'
                  }}
                >
                  {est}
                </button>
              ))}
            </div>
          </div>

          {/* Vista Principal de Clases CRUD (Desktop Table + Mobile Cards) */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(206, 208, 242, 0.5)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(37, 59, 89, 0.06)',
            overflow: 'hidden'
          }}>
            {cargando ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                Cargando clases desde Firestore...
              </div>
            ) : clasesFiltradas.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                No se encontraron clases registradas.
              </div>
            ) : (
              <>
                {/* 1. VISTA TABLA (DESKTOP) */}
                <div className="admin-table-desktop" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#253B59' }}>
                        <th style={{ padding: '1rem' }}>Servicio & Instructor</th>
                        <th style={{ padding: '1rem' }}>Horario (Inicio - Fin)</th>
                        <th style={{ padding: '1rem' }}>Cupos</th>
                        <th style={{ padding: '1rem' }}>Estado</th>
                        <th style={{ padding: '1rem' }}>Inscritos (UIDs)</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clasesFiltradas.map((c) => {
                        const estadoColor =
                          c.estado === 'activa' ? { bg: '#DCFCE7', text: '#15803D' } :
                          c.estado === 'inactiva' ? { bg: '#F1F5F9', text: '#64748B' } :
                          c.estado === 'completada' ? { bg: '#E0F2FE', text: '#0369A1' } :
                          { bg: '#FEE2E2', text: '#B91C1C' };

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '700', color: '#253B59' }}>{c.tipo_servicio}</div>
                              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>👤 {c.instructor}</div>
                            </td>

                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#334155' }}>
                              <div><strong>Inicio:</strong> {formatearFechaTabla(c.fecha_inicio)}</div>
                              <div><strong>Fin:</strong> {formatearFechaTabla(c.fecha_fin)}</div>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                fontWeight: '700',
                                color: c.cupos_disponibles > 0 ? '#166534' : '#991B1B'
                              }}>
                                {c.cupos_disponibles} / {c.cupo_maximo}
                              </span>
                            </td>

                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                backgroundColor: estadoColor.bg,
                                color: estadoColor.text,
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                textTransform: 'uppercase'
                              }}>
                                {c.estado}
                              </span>
                            </td>

                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748B' }}>
                              {c.inscritos_ids && c.inscritos_ids.length > 0 ? (
                                <span>{c.inscritos_ids.length} inscritos</span>
                              ) : (
                                <span style={{ fontStyle: 'italic' }}>Sin alumnos</span>
                              )}
                            </td>

                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleAbrirEditar(c)}
                                  style={{
                                    backgroundColor: '#CED0F2',
                                    color: '#253B59',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.8rem',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✏️ Editar
                                </button>

                                <button
                                  onClick={() => setConfirmDeleteId(c.id)}
                                  style={{
                                    backgroundColor: '#FEE2E2',
                                    color: '#991B1B',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.8rem',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. VISTA TARJETAS (MOBILE PORTRAIT / LANDSCAPE) */}
                <div className="admin-cards-mobile">
                  {clasesFiltradas.map((c) => {
                    const estadoColor =
                      c.estado === 'activa' ? { bg: '#DCFCE7', text: '#15803D' } :
                      c.estado === 'inactiva' ? { bg: '#F1F5F9', text: '#64748B' } :
                      c.estado === 'completada' ? { bg: '#E0F2FE', text: '#0369A1' } :
                      { bg: '#FEE2E2', text: '#B91C1C' };

                    return (
                      <div key={c.id} className="admin-data-card">
                        <div className="admin-card-header">
                          <div>
                            <div className="admin-card-title">{c.tipo_servicio}</div>
                            <div className="admin-card-subtitle">👤 {c.instructor}</div>
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: estadoColor.bg,
                            color: estadoColor.text,
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase'
                          }}>
                            {c.estado}
                          </span>
                        </div>

                        <div className="admin-card-body">
                          <div className="admin-card-row">
                            <span style={{ color: '#64748B' }}>📅 Horario:</span>
                            <span style={{ fontWeight: '600', textAlign: 'right' }}>
                              {formatearFechaTabla(c.fecha_inicio)}
                            </span>
                          </div>

                          <div className="admin-card-row">
                            <span style={{ color: '#64748B' }}>📊 Cupos:</span>
                            <span style={{
                              fontWeight: '700',
                              color: c.cupos_disponibles > 0 ? '#166534' : '#991B1B'
                            }}>
                              {c.cupos_disponibles} / {c.cupo_maximo} disponibles
                            </span>
                          </div>

                          <div className="admin-card-row">
                            <span style={{ color: '#64748B' }}>👥 Inscritos:</span>
                            <span>
                              {c.inscritos_ids && c.inscritos_ids.length > 0
                                ? `${c.inscritos_ids.length} alumnos`
                                : 'Sin alumnos'}
                            </span>
                          </div>
                        </div>

                        <div className="admin-card-actions">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(c)}
                            style={{
                              backgroundColor: '#CED0F2',
                              color: '#253B59',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '0.6rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Editar Clase
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(c.id)}
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '0.6rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Modal de Creación / Edición de los 9 Campos */}
          {isModalOpen && (
            <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
              <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#253B59', margin: 0 }}>
                    {claseEditando ? '✏️ Modificar Clase' : '➕ Crear Nueva Clase'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B', padding: '0.25rem' }}
                    aria-label="Cerrar modal"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* 1. Tipo de Servicio & 2. Instructor */}
                  <div className="admin-form-grid-2">
                    <div>
                      <label htmlFor="admin-tipo-servicio" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Tipo de Servicio
                      </label>
                      <input
                        id="admin-tipo-servicio"
                        type="text"
                        required
                        value={formData.tipo_servicio}
                        onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                        placeholder="ej. Pilates Reformer"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-instructor" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Instructor
                      </label>
                      <input
                        id="admin-instructor"
                        type="text"
                        required
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                        placeholder="ej. Camila Soto"
                      />
                    </div>
                  </div>

                  {/* 3. Cupo Máximo, 4. Cupos Disponibles & 5. Estado */}
                  <div className="admin-form-grid-3">
                    <div>
                      <label htmlFor="admin-cupo-maximo" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Cupo Máximo
                      </label>
                      <input
                        id="admin-cupo-maximo"
                        type="number"
                        min="1"
                        required
                        value={formData.cupo_maximo}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFormData({ ...formData, cupo_maximo: isNaN(val) ? 1 : Math.max(1, val) });
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-cupos-disponibles" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Cupos Disponibles
                      </label>
                      <input
                        id="admin-cupos-disponibles"
                        type="number"
                        min="0"
                        required
                        value={formData.cupos_disponibles}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFormData({ ...formData, cupos_disponibles: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-estado-clase" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Estado
                      </label>
                      <select
                        id="admin-estado-clase"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="activa">activa</option>
                        <option value="inactiva">inactiva</option>
                        <option value="cancelada">cancelada</option>
                        <option value="completada">completada</option>
                      </select>
                    </div>
                  </div>

                  {/* 6. Fecha Inicio & 7. Fecha Fin */}
                  <div className="admin-form-grid-2">
                    <div>
                      <label htmlFor="admin-fecha-inicio" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Fecha Inicio
                      </label>
                      <input
                        id="admin-fecha-inicio"
                        type="datetime-local"
                        required
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-fecha-fin" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                        Fecha Fin
                      </label>
                      <input
                        id="admin-fecha-fin"
                        type="datetime-local"
                        required
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  {/* 8. Visible Desde */}
                  <div>
                    <label htmlFor="admin-visible-desde" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                      Visible Desde
                    </label>
                    <input
                      id="admin-visible-desde"
                      type="datetime-local"
                      required
                      value={formData.visible_desde}
                      onChange={(e) => setFormData({ ...formData, visible_desde: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  {/* 9. Inscritos IDs (array) */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', color: '#253B59', marginBottom: '0.35rem' }}>
                      Inscritos IDs (array de UIDs)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Agregar UID del usuario..."
                        value={inscritoInput}
                        onChange={(e) => setInscritoInput(e.target.value)}
                        style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}
                      />
                      <button
                        type="button"
                        onClick={handleAgregarInscrito}
                        style={{
                          backgroundColor: '#CED0F2',
                          color: '#253B59',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.6rem 1rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Agregar
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {formData.inscritos_ids.map((uid) => (
                        <span
                          key={uid}
                          style={{
                            backgroundColor: 'rgba(206, 208, 242, 0.5)',
                            color: '#253B59',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {uid}
                          <button
                            type="button"
                            onClick={() => handleRemoverInscrito(uid)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: '700' }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {formData.inscritos_ids.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          No hay UIDs agregados manualmente.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        borderRadius: '9999px',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '44px'
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={guardando}
                      style={{
                        backgroundColor: '#253B59',
                        color: '#FFFFFF',
                        borderRadius: '9999px',
                        padding: '0.75rem 1.75rem',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37, 59, 89, 0.25)',
                        minHeight: '44px'
                      }}
                    >
                      {guardando ? 'Guardando en Firestore...' : (claseEditando ? 'Guardar Cambios' : 'Crear Clase')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Confirmar Eliminación */}
          {confirmDeleteId && (
            <div className="admin-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
              <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                <h3 style={{ color: '#253B59', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                  ¿Eliminar esta clase?
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Esta acción borrará permanentemente la clase de Firestore.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    style={{ backgroundColor: '#F1F5F9', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', minHeight: '44px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarEliminar}
                    style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', minHeight: '44px' }}
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
