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
    <div style={{ marginTop: "1rem" }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          style={{
            position: "fixed",
            top: "88px",
            right: "24px",
            backgroundColor: notification.error ? "#991B1B" : "#253B59",
            color: "#FFFFFF",
            padding: "0.85rem 1.5rem",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(37, 59, 89, 0.25)",
            zIndex: 1200,
            fontWeight: "600",
            fontSize: "0.95rem",
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 1rem",
              backgroundColor: "rgba(206, 208, 242, 0.4)",
              color: "#253B59",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: "600",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            🌿 Terapias Integrativas & MTC
          </span>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: "700",
              color: "#253B59",
              margin: 0,
            }}
          >
            Gestión de Sesiones de Terapia
          </h1>
        </div>

        <button
          onClick={handleAbrirCrear}
          style={{
            backgroundColor: "#253B59",
            color: "#FFFFFF",
            borderRadius: "9999px",
            padding: "0.875rem 1.75rem",
            border: "none",
            fontWeight: "600",
            fontSize: "0.95rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 59, 89, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <span>🌿➕</span> Crear Sesión de Terapia
        </button>
      </div>

      {/* Filtros */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(206, 208, 242, 0.5)",
          borderRadius: "20px",
          padding: "1.25rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(37, 59, 89, 0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <input
            type="text"
            placeholder="Buscar por título, terapeuta o categoría..."
            aria-label="Buscar terapias por título, terapeuta o categoría"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              fontSize: "0.95rem",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label htmlFor="admin-terapias-filtro-estado" style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}>
            Estado:
          </label>
          <select
            id="admin-terapias-filtro-estado"
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              fontSize: "0.9rem",
              backgroundColor: "#FFFFFF",
              color: "#253B59",
              fontWeight: "600",
            }}
          >
            <option value="todas">Todas</option>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>
      </div>

      {/* Tabla de Terapias */}
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
          <div style={{ overflowX: "auto" }}>
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
        )}
      </div>

      {/* Modal Formulario (Crear / Editar Terapia) */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.4rem",
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
                <label htmlFor="terapia-titulo" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                  Título / Nombre de la Terapia *
                </label>
                <input
                  id="terapia-titulo"
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="ej. Acupuntura Bioenergética"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="terapia-badge" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Categoría / Badge
                  </label>
                  <input
                    id="terapia-badge"
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="ej. Terapia Principal"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>

                <div>
                  <label htmlFor="terapia-duracion" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Duración Estimada
                  </label>
                  <input
                    id="terapia-duracion"
                    type="text"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                    placeholder="ej. 50 min"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="terapia-descripcion" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                  Descripción de la Terapia
                </label>
                <textarea
                  id="terapia-descripcion"
                  rows="3"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe los beneficios y el objetivo clínico o energético de la sesión..."
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="terapia-terapeuta" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Terapeuta / Especialista
                  </label>
                  <input
                    id="terapia-terapeuta"
                    type="text"
                    value={formData.terapeuta}
                    onChange={(e) => setFormData({ ...formData, terapeuta: e.target.value })}
                    placeholder="ej. Dr. Camila Soto"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>

                <div>
                  <label htmlFor="terapia-precio" style={{ display: "block", fontWeight: "600", fontSize: "0.875rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Precio de la Sesión
                  </label>
                  <input
                    id="terapia-precio"
                    type="text"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="ej. $25.000"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="terapia-fecha-inicio" style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Fecha / Hora Inicio
                  </label>
                  <input
                    id="terapia-fecha-inicio"
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>

                <div>
                  <label htmlFor="terapia-visible-desde" style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Visible Desde *
                  </label>
                  <input
                    id="terapia-visible-desde"
                    type="datetime-local"
                    required
                    value={formData.visible_desde}
                    onChange={(e) => setFormData({ ...formData, visible_desde: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1" }}
                  />
                </div>

                <div>
                  <label htmlFor="terapia-estado" style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", color: "#253B59", marginBottom: "0.35rem" }}>
                    Estado
                  </label>
                  <select
                    id="terapia-estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="activa">activa</option>
                    <option value="inactiva">inactiva</option>
                  </select>
                </div>
              </div>



              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
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
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "2rem",
              maxWidth: "450px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗑️</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#253B59", marginBottom: "0.5rem" }}>
              ¿Eliminar Sesión de Terapia?
            </h3>
            <p style={{ color: "#64748B", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              Esta acción eliminará el registro de la terapia integrativa permanentemente.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#64748B",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
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
