import { useState, useEffect } from "react";
import {
  suscribirTodosLosUsuariosAdmin,
  crearUsuarioAdmin,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  suscribirTodasLasInscripcionesAdmin,
  cancelarInscripcionAdmin,
  modificarClasesPactadasAdmin,
} from "../firebase/usuariosService";

export default function AdminUsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null); // null = crear nuevo

  const [usuarioClasesSeleccionado, setUsuarioClasesSeleccionado] =
    useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);

  // Estado del Formulario CRUD Usuario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rol: "cliente",
    estado_cuenta: "activo",
    clases_pactadas: 0,
  });

  const [guardando, setGuardando] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    error: false,
  });

  // Bloqueo de scroll en el body al abrir cualquier modal
  useEffect(() => {
    if (isFormModalOpen || usuarioClasesSeleccionado !== null || confirmDeleteUser !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormModalOpen, usuarioClasesSeleccionado, confirmDeleteUser]);

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isFormModalOpen) setIsFormModalOpen(false);
        if (usuarioClasesSeleccionado) setUsuarioClasesSeleccionado(null);
        if (confirmDeleteUser) setConfirmDeleteUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormModalOpen, usuarioClasesSeleccionado, confirmDeleteUser]);

  // Escuchar usuarios e inscripciones en tiempo real
  useEffect(() => {
    const unsubUsuarios = suscribirTodosLosUsuariosAdmin((listaUsuarios) => {
      setUsuarios(listaUsuarios);
      setCargando(false);
    });

    const unsubInscripciones = suscribirTodasLasInscripcionesAdmin(
      (listaInscripciones) => {
        setInscripciones(listaInscripciones);
      },
    );

    return () => {
      unsubUsuarios();
      unsubInscripciones();
    };
  }, []);

  // Notificaciones Toast
  const mostrarNotificacion = (message, isError = false) => {
    setNotification({ message, error: isError });
    setTimeout(() => {
      setNotification({ message: "", error: false });
    }, 4000);
  };

  // Abrir Modal para Crear Usuario
  const handleAbrirCrear = () => {
    setUsuarioEditando(null);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      rol: "cliente",
      estado_cuenta: "activo",
      clases_pactadas: 4,
    });
    setIsFormModalOpen(true);
  };

  // Abrir Modal para Editar Usuario
  const handleAbrirEditar = (usr) => {
    setUsuarioEditando(usr);
    setFormData({
      nombre: usr.nombre || "",
      email: usr.email || "",
      telefono: usr.telefono || "",
      rol: usr.rol || "cliente",
      estado_cuenta: usr.estado_cuenta || "activo",
      clases_pactadas: usr.clases_pactadas ?? 0,
    });
    setIsFormModalOpen(true);
  };

  // Modificación rápida de clases pactadas (+1 / -1)
  const handleModificarClasesPactadas = async (usuarioId, delta) => {
    try {
      await modificarClasesPactadasAdmin(usuarioId, delta);
      mostrarNotificacion(
        delta > 0
          ? "¡Clase pactada añadida al usuario!"
          : "Clase pactada descontada.",
      );
    } catch (error) {
      console.error("Error al modificar clases pactadas:", error);
      mostrarNotificacion("Error al actualizar clases pactadas.", true);
    }
  };

  // Guardar (Crear o Actualizar)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim()) {
      mostrarNotificacion(
        "Por favor completa el nombre y el correo electrónico.",
        true,
      );
      return;
    }

    setGuardando(true);
    try {
      if (usuarioEditando) {
        await actualizarUsuarioAdmin(usuarioEditando.id, formData);
        mostrarNotificacion("¡Datos del usuario actualizados con éxito!");
      } else {
        await crearUsuarioAdmin(formData);
        mostrarNotificacion("¡Nuevo usuario registrado con éxito!");
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      mostrarNotificacion(
        error.message || "Error al guardar el usuario.",
        true,
      );
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar Eliminación de Usuario
  const handleConfirmarEliminar = async () => {
    if (!confirmDeleteUser) return;
    try {
      await eliminarUsuarioAdmin(confirmDeleteUser.id);
      mostrarNotificacion(
        `El usuario "${confirmDeleteUser.nombre}" fue eliminado.`,
      );
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarNotificacion("No se pudo eliminar el usuario.", true);
    } finally {
      setConfirmDeleteUser(null);
    }
  };

  // Cancelar reserva de una clase desde el modal de inscripciones
  const handleCancelarReserva = async (inscripcion) => {
    try {
      await cancelarInscripcionAdmin(
        inscripcion.id,
        inscripcion.clase_id,
        inscripcion.usuario_id,
      );
      mostrarNotificacion("Reserva cancelada y cupo liberado en la clase.");
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      mostrarNotificacion("Error al cancelar la reserva.", true);
    }
  };

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = busqueda.toLowerCase();
    const coincideTexto =
      (u.nombre || "").toLowerCase().includes(texto) ||
      (u.email || "").toLowerCase().includes(texto) ||
      (u.telefono || "").toLowerCase().includes(texto);

    const coincideRol = filtroRol === "todos" || u.rol === filtroRol;
    const coincideEstado =
      filtroEstado === "todos" || u.estado_cuenta === filtroEstado;

    return coincideTexto && coincideRol && coincideEstado;
  });

  // Métricas rápidas
  const totalUsuarios = usuarios.length;
  const totalActivos = usuarios.filter(
    (u) => u.estado_cuenta === "activo",
  ).length;
  const totalAdmins = usuarios.filter((u) => u.rol === "admin").length;
  const totalInactivos = usuarios.filter(
    (u) => u.estado_cuenta !== "activo",
  ).length;

  // Formatear Fecha
  const formatearFecha = (val) => {
    if (!val) return "Sin fecha";
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
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
            border: notification.error
              ? "1px solid #FCA5A5"
              : "1px solid #CED0F2",
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
            👥 Directorio & Administración de Usuarios
          </span>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: "700",
              color: "#253B59",
              margin: 0,
            }}
          >
            Gestión de Usuarios Inscritos
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
            transition: "all 0.2s ease",
          }}
        >
          <span>👤➕</span> Nuevo Usuario
        </button>
      </div>

      {/* KPI Cards Grilla Adaptable */}
      <div className="admin-kpi-grid">
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid rgba(206, 208, 242, 0.6)",
            boxShadow: "0 4px 12px rgba(37, 59, 89, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              color: "#64748B",
              fontWeight: "600",
              marginBottom: "0.25rem",
            }}
          >
            Total Usuarios
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: "800", color: "#253B59" }}
          >
            {totalUsuarios}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid rgba(206, 208, 242, 0.6)",
            boxShadow: "0 4px 12px rgba(37, 59, 89, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              color: "#166534",
              fontWeight: "600",
              marginBottom: "0.25rem",
            }}
          >
            Cuentas Activas
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: "800", color: "#15803D" }}
          >
            {totalActivos}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid rgba(206, 208, 242, 0.6)",
            boxShadow: "0 4px 12px rgba(37, 59, 89, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              color: "#1D4ED8",
              fontWeight: "600",
              marginBottom: "0.25rem",
            }}
          >
            Administradores
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1E40AF" }}
          >
            {totalAdmins}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid rgba(206, 208, 242, 0.6)",
            boxShadow: "0 4px 12px rgba(37, 59, 89, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              color: "#991B1B",
              fontWeight: "600",
              marginBottom: "0.25rem",
            }}
          >
            Inactivos / Suspendidos
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: "800", color: "#B91C1C" }}
          >
            {totalInactivos}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
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
        }}
      >
        <div style={{ flex: "1 1 280px", width: "100%" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              fontSize: "0.95rem",
              outline: "none",
              backgroundColor: "#F8FAFC",
            }}
          />
        </div>

        {/* Filtro Rol */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}
          >
            Rol:
          </span>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              fontSize: "0.9rem",
              backgroundColor: "#FFFFFF",
              color: "#253B59",
              fontWeight: "600",
              minHeight: "40px",
            }}
          >
            <option value="todos">Todos</option>
            <option value="cliente">Cliente</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Filtro Estado */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}
          >
            Estado:
          </span>
          <select
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
              minHeight: "40px",
            }}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios (CRUD - Desktop & Mobile Dual View) */}
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
            style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}
          >
            Cargando lista de usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}
          >
            No se encontraron usuarios inscritos que coincidan con la búsqueda.
          </div>
        ) : (
          <>
            {/* 1. VISTA TABLA (DESKTOP >= 768px) */}
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
                    <th style={{ padding: "1rem" }}>Usuario</th>
                    <th style={{ padding: "1rem" }}>Contacto</th>
                    <th style={{ padding: "1rem" }}>Rol</th>
                    <th style={{ padding: "1rem" }}>Estado Cuenta</th>
                    <th style={{ padding: "1rem" }}>Clases Pactadas</th>
                    <th style={{ padding: "1rem" }}>Reservas Activas</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usr) => {
                    const userInscripciones = inscripciones.filter(
                      (ins) =>
                        ins.usuario_id === usr.id && ins.estado === "confirmada",
                    );

                    const iniciales = (usr.nombre || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    const estadoColor =
                      usr.estado_cuenta === "activo"
                        ? { bg: "#DCFCE7", text: "#15803D" }
                        : usr.estado_cuenta === "suspendido"
                          ? { bg: "#FEE2E2", text: "#B91C1C" }
                          : { bg: "#FEF3C7", text: "#D97706" };

                    const rolColor =
                      usr.rol === "admin"
                        ? { bg: "#DBEAFE", text: "#1E40AF" }
                        : { bg: "#F1F5F9", text: "#475569" };

                    const clasesPactadasNum = usr.clases_pactadas ?? 0;

                    return (
                      <tr
                        key={usr.id}
                        style={{ borderBottom: "1px solid #F1F5F9" }}
                      >
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#CED0F2",
                                color: "#253B59",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.9rem",
                              }}
                            >
                              {iniciales}
                            </div>
                            <div>
                              <div
                                style={{ fontWeight: "700", color: "#253B59" }}
                              >
                                {usr.nombre}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                          <div style={{ color: "#334155" }}>📧 {usr.email}</div>
                          <div style={{ color: "#64748B", fontSize: "0.8rem" }}>
                            📞 {usr.telefono || "Sin teléfono"}
                          </div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "9999px",
                              backgroundColor: rolColor.bg,
                              color: rolColor.text,
                              fontWeight: "700",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {usr.rol || "cliente"}
                          </span>
                        </td>

                        <td style={{ padding: "1rem" }}>
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
                            {usr.estado_cuenta || "activo"}
                          </span>
                        </td>

                        {/* Columna Clases Pactadas con ajustadores rápidos +- */}
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              backgroundColor: "#F8FAFC",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "10px",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "800",
                                fontSize: "0.95rem",
                                color:
                                  clasesPactadasNum > 0 ? "#15803D" : "#B91C1C",
                                minWidth: "24px",
                                textAlign: "center",
                              }}
                            >
                              {clasesPactadasNum}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <button
                            onClick={() => setUsuarioClasesSeleccionado(usr)}
                            style={{
                              backgroundColor: "rgba(206, 208, 242, 0.4)",
                              color: "#253B59",
                              border: "none",
                              borderRadius: "9999px",
                              padding: "0.35rem 0.85rem",
                              fontSize: "0.8rem",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            🎟️ {userInscripciones.length} Clase(s)
                          </button>
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
                              onClick={() => handleAbrirEditar(usr)}
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
                              onClick={() => setConfirmDeleteUser(usr)}
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
              {usuariosFiltrados.map((usr) => {
                const userInscripciones = inscripciones.filter(
                  (ins) =>
                    ins.usuario_id === usr.id && ins.estado === "confirmada",
                );

                const iniciales = (usr.nombre || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const estadoColor =
                  usr.estado_cuenta === "activo"
                    ? { bg: "#DCFCE7", text: "#15803D" }
                    : usr.estado_cuenta === "suspendido"
                      ? { bg: "#FEE2E2", text: "#B91C1C" }
                      : { bg: "#FEF3C7", text: "#D97706" };

                const rolColor =
                  usr.rol === "admin"
                    ? { bg: "#DBEAFE", text: "#1E40AF" }
                    : { bg: "#F1F5F9", text: "#475569" };

                const clasesPactadasNum = usr.clases_pactadas ?? 0;

                return (
                  <div key={usr.id} className="admin-data-card">
                    <div className="admin-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            backgroundColor: "#CED0F2",
                            color: "#253B59",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.95rem",
                            flexShrink: 0
                          }}
                        >
                          {iniciales}
                        </div>
                        <div>
                          <div className="admin-card-title">{usr.nombre}</div>
                          <div className="admin-card-subtitle">📧 {usr.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            backgroundColor: rolColor.bg,
                            color: rolColor.text,
                            fontWeight: "700",
                            fontSize: "0.725rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {usr.rol || "cliente"}
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            backgroundColor: estadoColor.bg,
                            color: estadoColor.text,
                            fontWeight: "700",
                            fontSize: "0.725rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {usr.estado_cuenta || "activo"}
                        </span>
                      </div>
                    </div>

                    <div className="admin-card-body">
                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>📞 Teléfono:</span>
                        <span style={{ fontWeight: "600" }}>{usr.telefono || "Sin teléfono"}</span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>📋 Clases Pactadas:</span>
                        <span style={{ fontWeight: "800", color: clasesPactadasNum > 0 ? "#15803D" : "#B91C1C" }}>
                          {clasesPactadasNum} clase(s)
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>🎟️ Reservas Activas:</span>
                        <button
                          type="button"
                          onClick={() => setUsuarioClasesSeleccionado(usr)}
                          style={{
                            backgroundColor: "rgba(206, 208, 242, 0.4)",
                            color: "#253B59",
                            border: "none",
                            borderRadius: "9999px",
                            padding: "0.3rem 0.75rem",
                            fontSize: "0.8rem",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Ver {userInscripciones.length} clase(s)
                        </button>
                      </div>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(usr)}
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
                        ✏️ Editar Usuario
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteUser(usr)}
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
          </>
        )}
      </div>

      {/* MODAL FORMULARIO: Crear / Editar Usuario */}
      {isFormModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setIsFormModalOpen(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "540px" }}
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
                {usuarioEditando
                  ? "✏️ Modificar Usuario"
                  : "👤➕ Nuevo Usuario Inscrito"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                aria-label="Cerrar modal de formulario"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "0.25rem"
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div>
                <label
                  htmlFor="user-form-nombre"
                  style={{
                    display: "block",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    color: "#253B59",
                    marginBottom: "0.35rem",
                  }}
                >
                  Nombre Completo *
                </label>
                <input
                  id="user-form-nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="ej. María González"
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
                  htmlFor="user-form-email"
                  style={{
                    display: "block",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    color: "#253B59",
                    marginBottom: "0.35rem",
                  }}
                >
                  Correo Electrónico *
                </label>
                <input
                  id="user-form-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="ej. maria@ejemplo.com"
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
                  htmlFor="user-form-telefono"
                  style={{
                    display: "block",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    color: "#253B59",
                    marginBottom: "0.35rem",
                  }}
                >
                  Teléfono de Contacto
                </label>
                <input
                  id="user-form-telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="ej. +56 9 1234 5678"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                  }}
                />
              </div>

              <div className="admin-form-grid-3">
                <div>
                  <label
                    htmlFor="user-form-clases"
                    style={{
                      display: "block",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      color: "#253B59",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Clases Pactadas
                  </label>
                  <select
                    id="user-form-clases"
                    value={formData.clases_pactadas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clases_pactadas: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    {![0, 1, 4, 8, 12].includes(
                      Number(formData.clases_pactadas),
                    ) && (
                      <option value={formData.clases_pactadas}>
                        {formData.clases_pactadas}
                      </option>
                    )}
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-form-rol"
                    style={{
                      display: "block",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      color: "#253B59",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Rol
                  </label>
                  <select
                    id="user-form-rol"
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="cliente">cliente</option>
                    <option value="admin">admin</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-form-estado"
                    style={{
                      display: "block",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      color: "#253B59",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Estado Cuenta
                  </label>
                  <select
                    id="user-form-estado"
                    value={formData.estado_cuenta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado_cuenta: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="activo">activo</option>
                    <option value="inactivo">inactivo</option>
                    <option value="suspendido">suspendido</option>
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  style={{
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                    borderRadius: "9999px",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    minHeight: "44px"
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
                    minHeight: "44px"
                  }}
                >
                  {guardando
                    ? "Guardando en Firestore..."
                    : usuarioEditando
                      ? "Guardar Cambios"
                      : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ver Clases Inscritas del Usuario */}
      {usuarioClasesSeleccionado && (
        <div
          className="admin-modal-overlay"
          onClick={() => setUsuarioClasesSeleccionado(null)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    color: "#253B59",
                    margin: 0,
                  }}
                >
                  🎟️ Clases Reservadas
                </h2>
                <div style={{ fontSize: "0.875rem", color: "#64748B", marginTop: "0.15rem" }}>
                  Usuario: <strong>{usuarioClasesSeleccionado.nombre}</strong> (
                  {usuarioClasesSeleccionado.email})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioClasesSeleccionado(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "0.25rem"
                }}
                aria-label="Cerrar modal de reservas"
              >
                ✕
              </button>
            </div>

            {(() => {
              const reservasUsuario = inscripciones.filter(
                (ins) =>
                  ins.usuario_id === usuarioClasesSeleccionado.id &&
                  ins.estado === "confirmada",
              );

              if (reservasUsuario.length === 0) {
                return (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#64748B",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "12px",
                    }}
                  >
                    Este usuario no tiene inscripciones ni reservas activas
                    actualmente.
                  </div>
                );
              }

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {reservasUsuario.map((ins) => (
                    <div
                      key={ins.id}
                      style={{
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        padding: "1rem",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#253B59",
                            fontSize: "1rem",
                          }}
                        >
                          {ins.tipo_servicio || "Pilates Reformer"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748B",
                            marginTop: "0.2rem",
                          }}
                        >
                          👤 Instructor: {ins.instructor || "Staff"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#334155",
                            marginTop: "0.2rem",
                          }}
                        >
                          📅 Fecha Clase: {formatearFecha(ins.fecha_clase)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelarReserva(ins)}
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          border: "none",
                          borderRadius: "8px",
                          padding: "0.55rem 1rem",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          minHeight: "42px"
                        }}
                      >
                        Cancelar Reserva
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {confirmDeleteUser && (
        <div
          className="admin-modal-overlay"
          onClick={() => setConfirmDeleteUser(null)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px", textAlign: "center" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h3
              style={{
                color: "#253B59",
                fontWeight: "700",
                margin: "0 0 0.5rem 0",
              }}
            >
              ¿Eliminar a {confirmDeleteUser.nombre}?
            </h3>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              Esta acción eliminará permanentemente al usuario, borrando todas
              sus reservas e inscripciones y liberando los cupos
              correspondientes en las clases.
            </p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                onClick={() => setConfirmDeleteUser(null)}
                style={{
                  backgroundColor: "#F1F5F9",
                  border: "none",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "9999px",
                  fontWeight: "600",
                  cursor: "pointer",
                  minHeight: "44px"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "9999px",
                  fontWeight: "600",
                  cursor: "pointer",
                  minHeight: "44px"
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
