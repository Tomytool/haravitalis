import { useState, useEffect } from "react";
import {
  suscribirTodasLasClasesAdmin,
  crearClaseAdmin,
  actualizarClaseAdmin,
  eliminarClaseAdmin,
} from "../firebase/clasesService";
import {
  suscribirTodosLosUsuariosAdmin,
  suscribirTodasLasInscripcionesAdmin,
} from "../firebase/usuariosService";
import AdminUsuariosTab from "./AdminUsuariosTab";
import AdminTerapiasTab from "./AdminTerapiasTab";
import AdminCargaMasivaModal from "./AdminCargaMasivaModal";
import AdminPagination from "./AdminPagination";

// Función pura auxiliar para obtener el timestamp numérico en milisegundos de una fecha de Firestore o Date
function obtenerTimestampFecha(val) {
  if (!val) return 0;
  if (typeof val.toDate === "function") {
    const d = val.toDate();
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  if (typeof val.seconds === "number") {
    return val.seconds * 1000;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// Función pura auxiliar para comprobar si un timestamp pertenece al mismo día local que una fecha de referencia
function esMismoDiaLocal(timestampMs, fechaRef = new Date()) {
  if (!timestampMs) return false;
  const d = new Date(timestampMs);
  return (
    d.getFullYear() === fechaRef.getFullYear() &&
    d.getMonth() === fechaRef.getMonth() &&
    d.getDate() === fechaRef.getDate()
  );
}

// Función pura para determinar si una clase NO es anterior a la fecha/hora actual
// (se mantiene en la vista del CRUD si aún no ha finalizado respecto al momento actual)
function esClaseVigenteOProxima(clase, ahora = new Date()) {
  const tInicio = obtenerTimestampFecha(clase?.fecha_inicio);
  if (!tInicio) return false;
  const tFin = obtenerTimestampFecha(clase?.fecha_fin) || tInicio + 60 * 60 * 1000;
  return tFin >= ahora.getTime();
}

// Función pura para verificar si una clase coincide exactamente con la fecha y hora actual
function coincideConFechaYHoraActual(clase, ahora = new Date()) {
  const tInicio = obtenerTimestampFecha(clase?.fecha_inicio);
  if (!tInicio) return false;
  const tFin = obtenerTimestampFecha(clase?.fecha_fin) || tInicio + 60 * 60 * 1000;
  const ahoraMs = ahora.getTime();
  return esMismoDiaLocal(tInicio, ahora) && ahoraMs >= tInicio && ahoraMs <= tFin;
}

export default function AdminClasesPage({ currentUser }) {
  const [tabActiva, setTabActiva] = useState("clases"); // 'clases' | 'terapias' | 'usuarios'
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [ordenFecha, setOrdenFecha] = useState("asc"); // 'asc' (menor a mayor) | 'desc' (mayor a menor)
  // null indica que al abrir el CRUD se posiciona automáticamente en la página de la clase actual del día
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(null);

  // Modal de formulario (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCargaMasivaOpen, setIsCargaMasivaOpen] = useState(false);
  const [claseEditando, setClaseEditando] = useState(null); // null = crear nueva

  // Estado del formulario con los campos de la clase
  const [formData, setFormData] = useState({
    tipo_servicio: "Pilates Reformer",
    instructor: "Francisco Peña",
    cupo_maximo: 5,
    cupos_disponibles: 5,
    estado: "activa",
    fecha_inicio: "",
    fecha_fin: "",
    visible_desde: "",
    inscritos_ids: [],
  });

  // Mapas de usuarios e inscripciones para resolver nombres de inscritos en lugar de UIDs
  const [usuariosMap, setUsuariosMap] = useState({});
  const [inscripcionesNombresMap, setInscripcionesNombresMap] = useState({});

  const [guardando, setGuardando] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    error: false,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Bloqueo de scroll en el body al abrir cualquier modal
  useEffect(() => {
    if (isModalOpen || confirmDeleteId !== null || isCargaMasivaOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, confirmDeleteId, isCargaMasivaOpen]);

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
    if (currentUser?.rol !== "admin") return;

    const unsubscribe = suscribirTodasLasClasesAdmin((lista) => {
      const ahora = new Date();
      const listaProcesada = lista.map((clase) => {
        const fechaFinObj = clase.fecha_fin?.toDate
          ? clase.fecha_fin.toDate()
          : clase.fecha_fin
            ? new Date(clase.fecha_fin)
            : null;
        const fechaInicioObj = clase.fecha_inicio?.toDate
          ? clase.fecha_inicio.toDate()
          : clase.fecha_inicio
            ? new Date(clase.fecha_inicio)
            : null;

        const haCaducado = fechaFinObj
          ? fechaFinObj < ahora
          : Boolean(fechaInicioObj && fechaInicioObj < ahora);

        if (haCaducado && clase.estado === "activa") {
          // Inactivar automáticamente en Firestore y en la interfaz
          Promise.resolve(
            actualizarClaseAdmin(clase.id, {
              ...clase,
              estado: "inactiva",
            }),
          ).catch((err) =>
            console.error(
              "Error inactivando clase caducada automáticamente:",
              err,
            ),
          );
          return { ...clase, estado: "inactiva" };
        }
        return clase;
      });

      setClases(listaProcesada);
      setCargando(false);
    });

    const unsubUsuarios =
      typeof suscribirTodosLosUsuariosAdmin === "function"
        ? suscribirTodosLosUsuariosAdmin((listaUsuarios) => {
            const mapa = {};
            (listaUsuarios || []).forEach((u) => {
              const uidKey = u.id || u.uid;
              if (uidKey) {
                mapa[uidKey] = {
                  nombre: u.nombre || u.email || "Alumno",
                  email: u.email || "",
                };
              }
            });
            setUsuariosMap(mapa);
          })
        : null;

    const unsubInscripciones =
      typeof suscribirTodasLasInscripcionesAdmin === "function"
        ? suscribirTodasLasInscripcionesAdmin((listaInscripciones) => {
            const mapaIns = {};
            (listaInscripciones || []).forEach((ins) => {
              if (ins.usuario_id && ins.nombre_usuario) {
                mapaIns[ins.usuario_id] = ins.nombre_usuario;
                if (ins.clase_id) {
                  mapaIns[`${ins.clase_id}_${ins.usuario_id}`] =
                    ins.nombre_usuario;
                }
              }
            });
            setInscripcionesNombresMap(mapaIns);
          })
        : null;

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      if (typeof unsubUsuarios === "function") unsubUsuarios();
      if (typeof unsubInscripciones === "function") unsubInscripciones();
    };
  }, [currentUser]);

  // Auxiliar para resolver el nombre e información de un alumno inscrito a partir de su UID
  const obtenerDatosInscrito = (uid, claseId = null) => {
    const infoUsuario = usuariosMap[uid];
    if (infoUsuario?.nombre) {
      return {
        nombre: infoUsuario.nombre,
        email: infoUsuario.email || "",
      };
    }
    const nombreInscripcion =
      (claseId && inscripcionesNombresMap[`${claseId}_${uid}`]) ||
      inscripcionesNombresMap[uid];
    if (nombreInscripcion) {
      return {
        nombre: nombreInscripcion,
        email: "",
      };
    }
    return {
      nombre: "Alumno registrado",
      email: "",
    };
  };

  // Auxiliar para convertir Timestamp/Date a string ISO local (YYYY-MM-DDTHH:mm) para datetime-local input
  const dateToDatetimeLocal = (val) => {
    if (!val) return "";
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Auxiliar para formatear fecha para la tabla
  const formatearFechaTabla = (val) => {
    if (!val) return "N/A";
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "N/A";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Abrir Modal para crear una nueva clase
  const handleAbrirCrear = () => {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    setClaseEditando(null);
    setFormData({
      tipo_servicio: "Pilates Reformer",
      instructor: "",
      cupo_maximo: 5,
      cupos_disponibles: 5,
      estado: "activa",
      fecha_inicio: dateToDatetimeLocal(ahora),
      fecha_fin: dateToDatetimeLocal(unaHoraDespues),
      visible_desde: dateToDatetimeLocal(ahora),
      inscritos_ids: [],
    });
    setIsModalOpen(true);
  };

  // Abrir Modal para editar una clase existente
  const handleAbrirEditar = (clase) => {
    setClaseEditando(clase);
    setFormData({
      tipo_servicio: clase.tipo_servicio || "Pilates Reformer",
      instructor: clase.instructor || "",
      cupo_maximo: clase.cupo_maximo ?? 5,
      cupos_disponibles: clase.cupos_disponibles ?? 5,
      estado: clase.estado || "activa",
      fecha_inicio: dateToDatetimeLocal(clase.fecha_inicio),
      fecha_fin: dateToDatetimeLocal(clase.fecha_fin),
      visible_desde: dateToDatetimeLocal(clase.visible_desde),
      inscritos_ids: Array.isArray(clase.inscritos_ids)
        ? [...clase.inscritos_ids]
        : [],
    });
    setIsModalOpen(true);
  };

  const handleRemoverInscrito = (idRemover) => {
    const nuevosInscritos = formData.inscritos_ids.filter(
      (id) => id !== idRemover,
    );
    const nuevosCupos = Math.max(
      0,
      formData.cupo_maximo - nuevosInscritos.length,
    );
    setFormData({
      ...formData,
      inscritos_ids: nuevosInscritos,
      cupos_disponibles: nuevosCupos,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (claseEditando) {
        await actualizarClaseAdmin(claseEditando.id, formData);
        setNotification({
          message: "Clase actualizada exitosamente con los 9 campos.",
          error: false,
        });
      } else {
        await crearClaseAdmin(formData);
        setNotification({
          message: "Nueva clase creada en Firestore.",
          error: false,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar clase:", error);
      setNotification({
        message: "Error al guardar la clase en Firestore.",
        error: true,
      });
    } finally {
      setGuardando(false);
      setTimeout(() => setNotification({ message: "", error: false }), 4000);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!confirmDeleteId) return;
    try {
      await eliminarClaseAdmin(confirmDeleteId);
      setNotification({
        message: "Clase eliminada de Firestore.",
        error: false,
      });
    } catch (error) {
      console.error("Error al eliminar clase:", error);
      setNotification({
        message: "No se pudo eliminar la clase.",
        error: true,
      });
    } finally {
      setConfirmDeleteId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4000);
    }
  };

  // RBAC: Verificación de Rol
  if (currentUser?.rol !== "admin") {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "4rem auto",
          padding: "3rem 2rem",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FCA5A5",
          borderRadius: "20px",
          textAlign: "center",
          color: "#991B1B",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡️</div>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            color: "#7F1D1D",
          }}
        >
          Acceso Restringido
        </h2>
        <p style={{ fontSize: "1rem", color: "#991B1B" }}>
          Lo sentimos, esta sección es de uso exclusivo para usuarios con el rol
          de <strong>Administrador</strong>.
        </p>
      </div>
    );
  }

  // Alternar ordenamiento por fecha (menor a mayor / mayor a menor) y reiniciar a la página 1
  const handleToggleOrdenFecha = () => {
    setOrdenFecha((prev) => (prev === "asc" ? "desc" : "asc"));
    setPaginaSeleccionada(1);
  };

  const ahoraRef = new Date();

  // Filtrado de clases:
  // 1. No mostrar en la vista del CRUD las clases anteriores a la fecha/hora actual (sin borrar nada de Firebase).
  // 2. Filtrar por búsqueda de texto y estado.
  const clasesFiltradas = clases.filter((c) => {
    if (!esClaseVigenteOProxima(c, ahoraRef)) return false;

    const coincideTexto =
      (c.tipo_servicio || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.instructor || "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado =
      filtroEstado === "todas" || c.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  // Ordenar de menor a mayor por fecha_inicio para identificar siempre la clase más próxima a la fecha actual
  const clasesVigentesAsc = clasesFiltradas.toSorted(
    (a, b) =>
      obtenerTimestampFecha(a.fecha_inicio) -
      obtenerTimestampFecha(b.fecha_inicio),
  );
  const claseMasProximaId = clasesVigentesAsc[0]?.id ?? null;

  // Ordenamiento inmutable según selección del usuario (por defecto 'asc': primero la más próxima a la fecha actual)
  const clasesOrdenadas =
    ordenFecha === "asc"
      ? clasesVigentesAsc
      : clasesVigentesAsc.toReversed();

  const totalPaginas = Math.max(1, Math.ceil(clasesOrdenadas.length / 10));
  const paginaActual = Math.min(totalPaginas, paginaSeleccionada ?? 1);

  // Segmentación a 10 clases por página
  const clasesPaginadas = clasesOrdenadas.slice(
    (paginaActual - 1) * 10,
    paginaActual * 10,
  );

  return (
    <div className="admin-page-container">
      {/* Selector de Pestañas Principal de Administrador */}
      <nav
        className="admin-tabs-nav"
        aria-label="Secciones del panel de administración"
      >
        <button
          type="button"
          onClick={() => {
            setTabActiva("clases");
            setPaginaSeleccionada(null);
          }}
          className={`admin-tab-btn ${tabActiva === "clases" ? "admin-tab-btn--active" : "admin-tab-btn--inactive"}`}
          aria-current={tabActiva === "clases" ? "page" : undefined}
        >
          <span>🗓️</span>
          <span>Clases</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("terapias")}
          className={`admin-tab-btn ${tabActiva === "terapias" ? "admin-tab-btn--active" : "admin-tab-btn--inactive"}`}
          aria-current={tabActiva === "terapias" ? "page" : undefined}
        >
          <span>🌿</span>
          <span>Terapias</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("usuarios")}
          className={`admin-tab-btn ${tabActiva === "usuarios" ? "admin-tab-btn--active" : "admin-tab-btn--inactive"}`}
          aria-current={tabActiva === "usuarios" ? "page" : undefined}
        >
          <span>👥</span>
          <span>Usuarios</span>
        </button>
      </nav>

      {/* Renderizado según la pestaña activa */}
      {tabActiva === "usuarios" ? (
        <AdminUsuariosTab currentUser={currentUser} />
      ) : tabActiva === "terapias" ? (
        <AdminTerapiasTab />
      ) : (
        <>
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
                border: notification.error
                  ? "1px solid #FCA5A5"
                  : "1px solid #CED0F2",
              }}
            >
              <span>{notification.error ? "⚠️" : "✨"}</span>
              <span>{notification.message}</span>
            </div>
          )}

          {/* Header del Panel de Clases */}
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
                ⚙️ Administración
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
                Gestión de Clases
              </h1>
            </div>

            <div className="admin-header-actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setIsCargaMasivaOpen(true)}
                className="admin-btn-action"
                style={{
                  backgroundColor: "#CED0F2",
                  color: "#253B59",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "0.6rem 1.25rem",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 59, 89, 0.12)",
                  minHeight: "44px",
                }}
              >
                <span>📊</span>
                <span>Carga Masiva Excel</span>
              </button>

              <button
                type="button"
                onClick={handleAbrirCrear}
                className="admin-btn-action admin-btn-action--primary"
              >
                <span>➕</span>
                <span>Nueva Clase</span>
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda, Filtros y Ordenamiento */}
          <div className="admin-filter-bar">
            <div style={{ width: "100%" }}>
              <input
                type="text"
                placeholder="🔍 Buscar por instructor o servicio..."
                aria-label="Buscar clases por instructor o servicio"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaSeleccionada(1);
                }}
                className="admin-filter-input"
              />
            </div>

            <div className="admin-filter-controls-row">
              <div className="admin-filter-chips">
                {["todas", "activa", "inactiva", "completada", "cancelada"].map(
                  (est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => {
                        setFiltroEstado(est);
                        setPaginaSeleccionada(null);
                      }}
                      className={`admin-filter-chip ${filtroEstado === est ? "admin-filter-chip--active" : "admin-filter-chip--inactive"}`}
                    >
                      {est}
                    </button>
                  ),
                )}
              </div>

              <div className="admin-sort-control">
                <button
                  type="button"
                  onClick={() => {
                    setOrdenFecha("asc");
                    setPaginaSeleccionada(1);
                  }}
                  className="admin-jump-today-btn"
                  aria-label="Ir a la clase actual del día"
                >
                  <span aria-hidden="true">📍</span>
                  <span>Clase Más Próxima</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleOrdenFecha}
                  className="admin-sort-btn"
                  aria-label={`Ordenar por fecha: actualmente de ${ordenFecha === "asc" ? "menor a mayor" : "mayor a menor"}. Clic para cambiar orden.`}
                >
                  <span aria-hidden="true">📅</span>
                  <span>
                    Fecha:{" "}
                    <strong>
                      {ordenFecha === "asc" ? "Menor a mayor" : "Mayor a menor"}
                    </strong>
                  </span>
                  <span className="admin-sort-btn__icon" aria-hidden="true">
                    {ordenFecha === "asc" ? "↑" : "↓"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Vista Principal de Clases CRUD (Desktop Table + Mobile Cards) */}
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
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#64748B",
                }}
              >
                Cargando clases desde Firestore...
              </div>
            ) : clasesFiltradas.length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#64748B",
                }}
              >
                No se encontraron clases registradas.
              </div>
            ) : (
              <>
                {/* 1. VISTA TABLA (DESKTOP) */}
                <div
                  className="admin-table-desktop"
                  style={{ overflowX: "auto" }}
                >
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
                        <th style={{ padding: "1rem" }}>
                          Servicio & Instructor
                        </th>
                        <th
                          style={{ padding: "1rem" }}
                          aria-sort={
                            ordenFecha === "asc" ? "ascending" : "descending"
                          }
                        >
                          <button
                            type="button"
                            onClick={handleToggleOrdenFecha}
                            className="admin-th-sort-btn"
                            title={
                              ordenFecha === "asc"
                                ? "Ordenado de menor a mayor fecha (clic para invertir)"
                                : "Ordenado de mayor a menor fecha (clic para invertir)"
                            }
                          >
                            <span>Horario (Inicio - Fin)</span>
                            <span
                              className="admin-th-sort-btn__badge"
                              aria-hidden="true"
                            >
                              {ordenFecha === "asc" ? "↑ Asc" : "↓ Desc"}
                            </span>
                          </button>
                        </th>
                        <th style={{ padding: "1rem" }}>Cupos</th>
                        <th style={{ padding: "1rem" }}>Estado</th>
                        <th style={{ padding: "1rem" }}>Alumnos Inscritos</th>
                        <th style={{ padding: "1rem", textAlign: "right" }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clasesPaginadas.map((c) => {
                        const estadoColor =
                          c.estado === "activa"
                            ? { bg: "#DCFCE7", text: "#15803D" }
                            : c.estado === "inactiva"
                              ? { bg: "#F1F5F9", text: "#64748B" }
                              : c.estado === "completada"
                                ? { bg: "#E0F2FE", text: "#0369A1" }
                                : { bg: "#FEE2E2", text: "#B91C1C" };

                        const tInicio = obtenerTimestampFecha(c.fecha_inicio);
                        const esClaseDeHoy = esMismoDiaLocal(tInicio, ahoraRef);
                        const estaEnCurso = coincideConFechaYHoraActual(
                          c,
                          ahoraRef,
                        );
                        const esMasProxima = c.id === claseMasProximaId;

                        const rowClassName = estaEnCurso
                          ? "admin-row-today admin-row-current-hour"
                          : esClaseDeHoy || esMasProxima
                            ? "admin-row-today"
                            : undefined;

                        return (
                          <tr
                            key={c.id}
                            className={rowClassName}
                            style={{ borderBottom: "1px solid #F1F5F9" }}
                          >
                            <td style={{ padding: "1rem" }}>
                              <div className="admin-service-cell">
                                <span
                                  style={{ fontWeight: "700", color: "#253B59" }}
                                >
                                  {c.tipo_servicio}
                                </span>
                                {(estaEnCurso || esClaseDeHoy || esMasProxima) && (
                                  <span
                                    className={`admin-today-badge ${estaEnCurso ? "admin-today-badge--now" : ""}`}
                                  >
                                    {estaEnCurso
                                      ? "🟢 En curso ahora"
                                      : esClaseDeHoy && esMasProxima
                                        ? "📍 Hoy • Más próxima"
                                        : esClaseDeHoy
                                          ? "📍 Hoy"
                                          : "⚡ Más próxima"}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#64748B",
                                }}
                              >
                                👤 {c.instructor}
                              </div>
                            </td>

                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.9rem",
                                color: "#334155",
                              }}
                            >
                              <div>
                                <strong>Inicio:</strong>{" "}
                                {formatearFechaTabla(c.fecha_inicio)}
                              </div>
                              <div>
                                <strong>Fin:</strong>{" "}
                                {formatearFechaTabla(c.fecha_fin)}
                              </div>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span
                                style={{
                                  fontWeight: "700",
                                  color:
                                    c.cupos_disponibles > 0
                                      ? "#166534"
                                      : "#991B1B",
                                }}
                              >
                                {c.cupos_disponibles} / {c.cupo_maximo}
                              </span>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "9999px",
                                  backgroundColor: estadoColor.bg,
                                  color: estadoColor.text,
                                  fontWeight: "700",
                                  fontSize: "0.8rem",
                                  textTransform: "uppercase",
                                }}
                              >
                                {c.estado}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.85rem",
                                color: "#64748B",
                              }}
                            >
                              {c.inscritos_ids && c.inscritos_ids.length > 0 ? (
                                <div className="admin-table-inscritos">
                                  <span className="admin-table-inscritos__count">
                                    {c.inscritos_ids.length} inscritos
                                  </span>
                                  <div className="admin-table-inscritos__names">
                                    {c.inscritos_ids.map((uid) => {
                                      const { nombre } = obtenerDatosInscrito(
                                        uid,
                                        c.id,
                                      );
                                      return (
                                        <span
                                          key={uid}
                                          className="admin-table-inscritos__pill"
                                        >
                                          {nombre}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontStyle: "italic" }}>
                                  Sin alumnos
                                </span>
                              )}
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
                                  onClick={() => handleAbrirEditar(c)}
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
                                  onClick={() => setConfirmDeleteId(c.id)}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. VISTA TARJETAS (MOBILE PORTRAIT / LANDSCAPE) */}
                <div className="admin-cards-mobile">
                  {clasesPaginadas.map((c) => {
                    const estadoColor =
                      c.estado === "activa"
                        ? { bg: "#DCFCE7", text: "#15803D" }
                        : c.estado === "inactiva"
                          ? { bg: "#F1F5F9", text: "#64748B" }
                          : c.estado === "completada"
                            ? { bg: "#E0F2FE", text: "#0369A1" }
                            : { bg: "#FEE2E2", text: "#B91C1C" };

                    const tInicio = obtenerTimestampFecha(c.fecha_inicio);
                    const esClaseDeHoy = esMismoDiaLocal(tInicio, ahoraRef);
                    const estaEnCurso = coincideConFechaYHoraActual(
                      c,
                      ahoraRef,
                    );
                    const esMasProxima = c.id === claseMasProximaId;

                    const cardClassName = estaEnCurso
                      ? "admin-data-card admin-data-card--today admin-data-card--current-hour"
                      : esClaseDeHoy || esMasProxima
                        ? "admin-data-card admin-data-card--today"
                        : "admin-data-card";

                    return (
                      <div key={c.id} className={cardClassName}>
                        <div className="admin-card-header">
                          <div>
                            <div className="admin-service-cell">
                              <span className="admin-card-title">
                                {c.tipo_servicio}
                              </span>
                              {(estaEnCurso || esClaseDeHoy || esMasProxima) && (
                                <span
                                  className={`admin-today-badge ${estaEnCurso ? "admin-today-badge--now" : ""}`}
                                >
                                  {estaEnCurso
                                    ? "🟢 En curso ahora"
                                    : esClaseDeHoy && esMasProxima
                                      ? "📍 Hoy • Más próxima"
                                      : esClaseDeHoy
                                        ? "📍 Hoy"
                                        : "⚡ Más próxima"}
                                </span>
                              )}
                            </div>
                            <div className="admin-card-subtitle">
                              👤 {c.instructor}
                            </div>
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
                            {c.estado}
                          </span>
                        </div>

                        <div className="admin-card-body">
                          <div className="admin-card-row">
                            <span style={{ color: "#64748B" }}>
                              📅 Horario:
                            </span>
                            <span
                              style={{ fontWeight: "600", textAlign: "right" }}
                            >
                              {formatearFechaTabla(c.fecha_inicio)}
                            </span>
                          </div>

                          <div className="admin-card-row">
                            <span style={{ color: "#64748B" }}>📊 Cupos:</span>
                            <span
                              style={{
                                fontWeight: "700",
                                color:
                                  c.cupos_disponibles > 0
                                    ? "#166534"
                                    : "#991B1B",
                              }}
                            >
                              {c.cupos_disponibles} / {c.cupo_maximo}{" "}
                              disponibles
                            </span>
                          </div>

                          <div className="admin-card-row">
                            <span style={{ color: "#64748B" }}>
                              👥 Inscritos:
                            </span>
                            <span style={{ textAlign: "right" }}>
                              {c.inscritos_ids && c.inscritos_ids.length > 0
                                ? c.inscritos_ids
                                    .map(
                                      (uid) =>
                                        obtenerDatosInscrito(uid, c.id).nombre,
                                    )
                                    .join(", ")
                                : "Sin alumnos"}
                            </span>
                          </div>
                        </div>

                        <div className="admin-card-actions">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(c)}
                            style={{
                              backgroundColor: "#CED0F2",
                              color: "#253B59",
                              border: "none",
                              borderRadius: "10px",
                              padding: "0.6rem 1rem",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Editar Clase
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(c.id)}
                            style={{
                              backgroundColor: "#FEE2E2",
                              color: "#991B1B",
                              border: "none",
                              borderRadius: "10px",
                              padding: "0.6rem 1rem",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Controles de Paginación de 10 Clases */}
                <AdminPagination
                  paginaActual={paginaActual}
                  totalElementos={clasesFiltradas.length}
                  elementosPorPagina={10}
                  onCambiarPagina={(nuevaPagina) =>
                    setPaginaSeleccionada(nuevaPagina)
                  }
                  etiquetaItem="clases"
                />
              </>
            )}
          </div>

          {/* Modal de Creación / Edición de los 9 Campos */}
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
                    {claseEditando
                      ? "✏️ Modificar Clase"
                      : "➕ Crear Nueva Clase"}
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
                    }}
                    aria-label="Cerrar modal"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.1rem",
                  }}
                >
                  {/* Banner de acceso a Carga Masiva vía Excel dentro del formulario Crear Nueva Clase */}
                  {!claseEditando && (
                    <div
                      style={{
                        backgroundColor: "#F8FAFC",
                        border: "1px dashed #CBD5E1",
                        borderRadius: "14px",
                        padding: "0.85rem 1.15rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: "1.35rem" }}>📊</span>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "700",
                              fontSize: "0.875rem",
                              color: "#253B59",
                            }}
                          >
                            ¿Tienes varias clases por registrar?
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.775rem",
                              color: "#64748B",
                            }}
                          >
                            Carga un archivo Excel con la plantilla oficial y súbelas en lote a Firebase.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setIsCargaMasivaOpen(true);
                        }}
                        style={{
                          backgroundColor: "#253B59",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "9999px",
                          padding: "0.55rem 1.15rem",
                          fontSize: "0.825rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          minHeight: "38px",
                          boxShadow: "0 2px 8px rgba(37, 59, 89, 0.2)",
                        }}
                      >
                        <span>📂</span>
                        <span>Cargar desde Excel</span>
                      </button>
                    </div>
                  )}

                  {/* 1. Tipo de Servicio & 2. Instructor */}
                  <div className="admin-form-grid-2">
                    <div>
                      <label
                        htmlFor="admin-tipo-servicio"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Tipo de Servicio
                      </label>
                      <input
                        id="admin-tipo-servicio"
                        type="text"
                        required
                        value={formData.tipo_servicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipo_servicio: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                        }}
                        placeholder="ej. Pilates Reformer"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-instructor"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Instructor
                      </label>
                      <select
                        id="admin-instructor"
                        required
                        value={formData.instructor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructor: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          color: "#253B59",
                          fontSize: "0.875rem",
                          minHeight: "44px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="" disabled>
                          Selecciona un instructor...
                        </option>
                        <option value="Francisco Peña">Francisco Peña</option>
                        <option value="Carolina Escobillana">Carolina Escobillana</option>
                        <option value="Marcela Rendic">Marcela Rendic</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Cupo Máximo, 4. Cupos Disponibles & 5. Estado */}
                  <div className="admin-form-grid-3">
                    <div>
                      <label
                        htmlFor="admin-cupo-maximo"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Cupo Máximo
                      </label>
                      <input
                        id="admin-cupo-maximo"
                        type="number"
                        min="1"
                        required
                        value={formData.cupo_maximo}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = parseInt(raw, 10);
                          const val = isNaN(parsed) ? 1 : Math.max(1, parsed);
                          setFormData((prev) => ({
                            ...prev,
                            cupo_maximo: val,
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-cupos-disponibles"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Cupos Disponibles
                      </label>
                      <input
                        id="admin-cupos-disponibles"
                        type="number"
                        min="0"
                        required
                        value={formData.cupos_disponibles}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = parseInt(raw, 10);
                          const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                          setFormData((prev) => ({
                            ...prev,
                            cupos_disponibles: val,
                          }));
                        }}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-estado-clase"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Estado
                      </label>
                      <select
                        id="admin-estado-clase"
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({ ...formData, estado: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                        }}
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
                      <label
                        htmlFor="admin-fecha-inicio"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Fecha Inicio
                      </label>
                      <input
                        id="admin-fecha-inicio"
                        type="datetime-local"
                        required
                        value={formData.fecha_inicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_inicio: e.target.value,
                          })
                        }
                        className="admin-input-mobile"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-fecha-fin"
                        style={{
                          display: "block",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          color: "#253B59",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Fecha Fin
                      </label>
                      <input
                        id="admin-fecha-fin"
                        type="datetime-local"
                        required
                        value={formData.fecha_fin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_fin: e.target.value,
                          })
                        }
                        className="admin-input-mobile"
                      />
                    </div>
                  </div>

                  {/* 8. Visible Desde */}
                  <div>
                    <label
                      htmlFor="admin-visible-desde"
                      style={{
                        display: "block",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        color: "#253B59",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Visible Desde
                    </label>
                    <input
                      id="admin-visible-desde"
                      type="datetime-local"
                      required
                      value={formData.visible_desde}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visible_desde: e.target.value,
                        })
                      }
                      className="admin-input-mobile"
                    />
                  </div>

                  {/* 9. Alumnos Inscritos (Visualización por Nombre) */}
                  <div className="admin-enrolled-section">
                    <div className="admin-enrolled-section__header">
                      <span className="admin-enrolled-section__title">
                        👥 Alumnos Inscritos
                      </span>
                      <span className="admin-enrolled-section__badge">
                        {formData.inscritos_ids.length} / {formData.cupo_maximo}{" "}
                        ocupados
                      </span>
                    </div>

                    {formData.inscritos_ids.length > 0 ? (
                      <ul
                        className="admin-enrolled-list"
                        aria-label="Lista de alumnos inscritos en la clase"
                      >
                        {formData.inscritos_ids.map((uid) => {
                          const { nombre, email } = obtenerDatosInscrito(
                            uid,
                            claseEditando?.id,
                          );
                          const inicial = (nombre || "A")
                            .trim()
                            .charAt(0)
                            .toUpperCase();

                          return (
                            <li key={uid} className="admin-enrolled-chip">
                              <div className="admin-enrolled-chip__main">
                                <span
                                  className="admin-enrolled-chip__avatar"
                                  aria-hidden="true"
                                >
                                  {inicial}
                                </span>
                                <div className="admin-enrolled-chip__info">
                                  <span className="admin-enrolled-chip__name">
                                    {nombre}
                                  </span>
                                  {email && email !== nombre && (
                                    <span className="admin-enrolled-chip__email">
                                      {email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoverInscrito(uid)}
                                className="admin-enrolled-chip__remove"
                                aria-label={`Quitar a ${nombre} de la clase`}
                                title={`Quitar a ${nombre} de la clase`}
                              >
                                <span aria-hidden="true">✕</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div
                        className="admin-enrolled-empty"
                        role="status"
                      >
                        Sin alumnos inscritos en esta clase.
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
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
                      {guardando
                        ? "Guardando en Firestore..."
                        : claseEditando
                          ? "Guardar Cambios"
                          : "Crear Clase"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Confirmar Eliminación */}
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
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                  ⚠️
                </div>
                <h3
                  style={{
                    color: "#253B59",
                    fontWeight: "700",
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.2rem",
                  }}
                >
                  ¿Eliminar esta clase?
                </h3>
                <p
                  style={{
                    color: "#64748B",
                    fontSize: "0.9rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Esta acción borrará permanentemente la clase de Firestore.
                </p>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    style={{
                      backgroundColor: "#F1F5F9",
                      color: "#64748B",
                      border: "none",
                      padding: "0.75rem 1.2rem",
                      borderRadius: "9999px",
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
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "0.75rem 1.2rem",
                      borderRadius: "9999px",
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

          {/* Modal de Carga Masiva desde Excel */}
          <AdminCargaMasivaModal
            isOpen={isCargaMasivaOpen}
            onClose={() => setIsCargaMasivaOpen(false)}
            onClasesCargadas={(total) => {
              setNotification({
                message: `¡Se cargaron ${total} clases exitosamente a Firebase!`,
                error: false,
              });
              setTimeout(() => setNotification({ message: "", error: false }), 4000);
            }}
          />
        </>
      )}
    </div>
  );
}
