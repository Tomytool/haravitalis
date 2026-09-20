import { useState, useEffect } from "react";
import {
  suscribirTodasLasTerapiasAdmin,
  crearTerapiaAdmin,
  actualizarTerapiaAdmin,
  eliminarTerapiaAdmin,
} from "../firebase/terapiasService";

export default function AdminTerapiasTab() {
  const [terapias, setTerapias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // Modal de formulario (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [terapiaEditando, setTerapiaEditando] = useState(null); // null = crear nueva

  const [formData, setFormData] = useState({
    titulo: "",
    badge: "Terapia Especializada",
    duracion: "50 min",
    descripcion: "",
    precio: "$25.000",
    terapeuta: "Especialista MTC",
    cupo_maximo: 1,
    cupos_disponibles: 1,
    estado: "activa",
    fecha_inicio: "",
    fecha_fin: "",
    visible_desde: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [notification, setNotification] = useState({ message: "", error: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Auxiliar fecha local
  const dateToDatetimeLocal = (val) => {
    if (!val) return "";
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const formatearFechaTabla = (val) => {
    if (!val) return "N/A";
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "N/A";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // Bloqueo de scroll al abrir modal
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

  // Cierre con Escape
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

  // Escuchar terapias en tiempo real
  useEffect(() => {
    const unsubscribe = suscribirTodasLasTerapiasAdmin((lista) => {
      setTerapias(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const mostrarNotificacion = (message, isError = false) => {
    setNotification({ message, error: isError });
    setTimeout(() => {
      setNotification({ message: "", error: false });
    }, 4000);
  };

  const handleAbrirCrear = () => {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    setTerapiaEditando(null);
    setFormData({
      titulo: "Acupuntura Bioenergética",
      badge: "Terapia Principal",
      duracion: "50 min",
      descripcion: "Inserción indolora de agujas estériles para restablecer el flujo de energía y liberar endorfinas.",
      precio: "$25.000",
      terapeuta: "Especialista MTC",
      cupo_maximo: 1,
      cupos_disponibles: 1,
      estado: "activa",
      fecha_inicio: dateToDatetimeLocal(ahora),
      fecha_fin: dateToDatetimeLocal(unaHoraDespues),
      visible_desde: dateToDatetimeLocal(ahora),
    });
    setIsModalOpen(true);
  };

  const handleAbrirEditar = (t) => {
    setTerapiaEditando(t);
    setFormData({
      titulo: t.titulo || "",
      badge: t.badge || "Terapia Especializada",
      duracion: t.duracion || "50 min",
      descripcion: t.descripcion || "",
      precio: t.precio || "$25.000",
      terapeuta: t.terapeuta || t.instructor || "Especialista MTC",
      cupo_maximo: t.cupo_maximo ?? 1,
      cupos_disponibles: t.cupos_disponibles ?? 1,
      estado: t.estado || "activa",
      fecha_inicio: dateToDatetimeLocal(t.fecha_inicio),
      fecha_fin: dateToDatetimeLocal(t.fecha_fin),
      visible_desde: dateToDatetimeLocal(t.visible_desde),
    });
    setIsModalOpen(true);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (terapiaEditando) {
        await actualizarTerapiaAdmin(terapiaEditando.id, formData);
        mostrarNotificacion("Sesión de terapia actualizada con éxito.");
      } else {
        await crearTerapiaAdmin(formData);
        mostrarNotificacion("Nueva sesión de terapia creada exitosamente.");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error al guardar terapia:", err);
      mostrarNotificacion("Error al guardar la terapia en Firestore.", true);
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDeleteId) return;
    try {
      await eliminarTerapiaAdmin(confirmDeleteId);
      mostrarNotificacion("Sesión de terapia eliminada del sistema.");
    } catch (err) {
      console.error("Error al eliminar terapia:", err);
      mostrarNotificacion("No se pudo eliminar la terapia.", true);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const terapiasFiltradas = terapias.filter((t) => {
    const coincideTexto =
      (t.titulo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.terapeuta || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.badge || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === "todas" || t.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          style={{
            position: "fixed",
            top: "88px",
            right: "16px",
            left: "16px",
            maxWidth: "400px",
            margin: "0 auto",
            backgroundColor: notification.error ? "#991B1B" : "#253B59",
            color: "#FFFFFF",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(37, 59, 89, 0.25)",
            zIndex: 1200,
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            border: notification.error ? "1px solid #FCA5A5" : "1px solid #CED0F2",
          }}
        >
          <span>{notification.error ? "⚠️" : "✨"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header y Acción Principal */}
      <div className="admin-header-flex">
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.85rem",
              backgroundColor: "rgba(206, 208, 242, 0.4)",
              color: "#253B59",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}
          >
            🌿 Terapias Integrativas & MTC
          </span>
          <h1
            style={{
              fontSize: "clamp(1.35rem, 5vw, 2.25rem)",
              fontWeight: "700",
              color: "#253B59",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Gestión de Terapias
          </h1>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={handleAbrirCrear}
            className="admin-btn-action admin-btn-action--primary"
          >
            <span>🌿➕</span>
            <span>Nueva Sesión</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-filter-bar">
        <div style={{ width: "100%" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por título, terapeuta o categoría..."
            aria-label="Buscar terapias por título, terapeuta o categoría"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-filter-input"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
          <label
            htmlFor="admin-terapias-filtro-estado"
            style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600", minWidth: "50px" }}
          >
            Estado:
          </label>
          <select
            id="admin-terapias-filtro-estado"
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="admin-input-mobile"
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#253B59",
              fontWeight: "600",
              minHeight: "42px",
            }}
          >
            <option value="todas">Todas las terapias</option>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>
      </div>

      {/* Tabla de Terapias (Desktop) + Tarjetas Móviles (Mobile) */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(206, 208, 242, 0.5)",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(37, 59, 89, 0.06)",
          overflow: "hidden",
        }}
      >
        {cargando ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}>
            Cargando lista de terapias integrativas...
          </div>
        ) : terapiasFiltradas.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}>
            No se encontraron sesiones de terapia registradas.
          </div>
        ) : (
          <>
            {/* 1. VISTA TABLA (DESKTOP) */}
            <div className="admin-table-desktop" style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#F1F5F9",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#253B59",
                    }}
                  >
                    <th style={{ padding: "1rem" }}>Terapia / Servicio</th>
                    <th style={{ padding: "1rem" }}>Terapeuta</th>
                    <th style={{ padding: "1rem" }}>Duración & Precio</th>
                    <th style={{ padding: "1rem" }}>Horario / Fecha</th>
                    <th style={{ padding: "1rem" }}>Estado</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {terapiasFiltradas.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: "700", color: "#253B59" }}>
                          {t.titulo}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                          🏷️ {t.badge}
                        </div>
                      </td>

                      <td style={{ padding: "1rem", color: "#334155" }}>
                        🧑‍⚕️ {t.terapeuta || t.instructor || "Especialista MTC"}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: "600", color: "#1E293B" }}>
                          ⏱️ {t.duracion}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#166534", fontWeight: "700" }}>
                          💰 {t.precio}
                        </div>
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "#475569" }}>
                        {formatearFechaTabla(t.fecha_inicio)}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "9999px",
                            backgroundColor:
                              t.estado === "activa" ? "#DCFCE7" : "#FEE2E2",
                            color: t.estado === "activa" ? "#15803D" : "#B91C1C",
                            fontWeight: "700",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {t.estado}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(t)}
                            style={{
                              backgroundColor: "#CED0F2",
                              color: "#253B59",
                              border: "none",
                              borderRadius: "8px",
                              padding: "0.4rem 0.8rem",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(t.id)}
                            style={{
                              backgroundColor: "#FEE2E2",
                              color: "#991B1B",
                              border: "none",
                              borderRadius: "8px",
                              padding: "0.4rem 0.8rem",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. VISTA TARJETAS (MOBILE 320PX PORTRAIT) */}
            <div className="admin-cards-mobile">
              {terapiasFiltradas.map((t) => {
                const estadoColor =
                  t.estado === "activa"
                    ? { bg: "#DCFCE7", text: "#15803D" }
                    : { bg: "#FEE2E2", text: "#B91C1C" };

                return (
                  <div key={t.id} className="admin-data-card">
                    <div className="admin-card-header">
                      <div>
                        <div className="admin-card-title">{t.titulo}</div>
                        <div className="admin-card-subtitle">🏷️ {t.badge}</div>
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "9999px",
                          backgroundColor: estadoColor.bg,
                          color: estadoColor.text,
                          fontWeight: "700",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {t.estado}
                      </span>
                    </div>

                    <div className="admin-card-body">
                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>🧑‍⚕️ Terapeuta:</span>
                        <span style={{ fontWeight: "600", textAlign: "right" }}>
                          {t.terapeuta || t.instructor || "Especialista MTC"}
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>⏱️ Duración / Precio:</span>
                        <span style={{ fontWeight: "700", color: "#166534" }}>
                          {t.duracion} • {t.precio}
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>📅 Horario:</span>
                        <span style={{ fontWeight: "600", textAlign: "right" }}>
                          {formatearFechaTabla(t.fecha_inicio)}
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>📊 Cupos:</span>
                        <span style={{ fontWeight: "600" }}>
                          {t.cupos_disponibles ?? 1} / {t.cupo_maximo ?? 1} disponible(s)
                        </span>
                      </div>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(t)}
                        style={{
                          backgroundColor: "#CED0F2",
                          color: "#253B59",
                        }}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
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

      {/* Modal Formulario (Crear / Editar Terapia) */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  color: "#253B59",
                  margin: 0,
                }}
              >
                {terapiaEditando ? "✏️ Editar Sesión de Terapia" : "🌿 Nueva Sesión de Terapia"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "0.25rem",
                  lineHeight: 1,
                }}
                aria-label="Cerrar modal de terapia"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="terapia-titulo"
                  style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                >
                  Título / Nombre de la Terapia *
                </label>
                <input
                  id="terapia-titulo"
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="ej. Acupuntura Bioenergética"
                  className="admin-input-mobile"
                />
              </div>

              <div className="admin-form-grid-2">
                <div>
                  <label
                    htmlFor="terapia-badge"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Categoría / Badge
                  </label>
                  <input
                    id="terapia-badge"
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="ej. Terapia Principal"
                    className="admin-input-mobile"
                  />
                </div>

                <div>
                  <label
                    htmlFor="terapia-duracion"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Duración Estimada
                  </label>
                  <input
                    id="terapia-duracion"
                    type="text"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                    placeholder="ej. 50 min"
                    className="admin-input-mobile"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="terapia-descripcion"
                  style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                >
                  Descripción de la Terapia
                </label>
                <textarea
                  id="terapia-descripcion"
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe los beneficios y el objetivo clínico o energético de la sesión..."
                  className="admin-input-mobile"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="admin-form-grid-2">
                <div>
                  <label
                    htmlFor="terapia-terapeuta"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Terapeuta / Especialista
                  </label>
                  <input
                    id="terapia-terapeuta"
                    type="text"
                    value={formData.terapeuta}
                    onChange={(e) => setFormData({ ...formData, terapeuta: e.target.value })}
                    placeholder="ej. Dr. Camila Soto"
                    className="admin-input-mobile"
                  />
                </div>

                <div>
                  <label
                    htmlFor="terapia-precio"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Precio de la Sesión
                  </label>
                  <input
                    id="terapia-precio"
                    type="text"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="ej. $25.000"
                    className="admin-input-mobile"
                  />
                </div>
              </div>

              <div className="admin-form-grid-3">
                <div>
                  <label
                    htmlFor="terapia-fecha-inicio"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Fecha / Hora Inicio
                  </label>
                  <input
                    id="terapia-fecha-inicio"
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="admin-input-mobile"
                  />
                </div>

                <div>
                  <label
                    htmlFor="terapia-visible-desde"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Visible Desde *
                  </label>
                  <input
                    id="terapia-visible-desde"
                    type="datetime-local"
                    required
                    value={formData.visible_desde}
                    onChange={(e) => setFormData({ ...formData, visible_desde: e.target.value })}
                    className="admin-input-mobile"
                  />
                </div>

                <div>
                  <label
                    htmlFor="terapia-estado"
                    style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}
                  >
                    Estado
                  </label>
                  <select
                    id="terapia-estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="admin-input-mobile"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <option value="activa">activa</option>
                    <option value="inactiva">inactiva</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                    borderRadius: "9999px",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    backgroundColor: "#253B59",
                    color: "#FFFFFF",
                    borderRadius: "9999px",
                    padding: "0.75rem 1.75rem",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 59, 89, 0.25)",
                    minHeight: "44px",
                  }}
                >
                  {guardando ? "Guardando..." : terapiaEditando ? "Guardar Cambios" : "Crear Sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación Eliminar */}
      {confirmDeleteId && (
        <div
          className="admin-modal-overlay"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", textAlign: "center" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🗑️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#253B59", marginBottom: "0.5rem" }}>
              ¿Eliminar Sesión de Terapia?
            </h3>
            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Esta acción eliminará el registro de la terapia integrativa permanentemente.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#64748B",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.2rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.2rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
