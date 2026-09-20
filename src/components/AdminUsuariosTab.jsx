import { useState, useEffect } from "react";
import {
  suscribirTodosLosUsuariosAdmin,
  crearUsuarioAdmin,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  suscribirTodasLasInscripcionesAdmin,
  cancelarInscripcionAdmin,
  modificarClasesPactadasAdmin,
  modificarSesionesTerapiaAdmin,
} from "../firebase/usuariosService";
import {
  registrarHistorialPagoAdmin,
  obtenerHistorialPagosAdmin,
  exportarHistorialPagosCSV,
  calcularTarifaAutomatica,
  formatearMonedaCLP,
} from "../firebase/pagosService";

export default function AdminUsuariosTab({ currentUser }) {
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
    sesion_terapia: 0,
  });

  const [guardando, setGuardando] = useState(false);
  const [descargandoCSV, setDescargandoCSV] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    error: false,
  });

  // Bloqueo de scroll en el body al abrir cualquier modal
  useEffect(() => {
    if (
      isFormModalOpen ||
      usuarioClasesSeleccionado !== null ||
      confirmDeleteUser !== null
    ) {
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
      sesion_terapia: 0,
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
      sesion_terapia: usr.sesion_terapia ?? 0,
    });
    setIsFormModalOpen(true);
  };

  // Modificación rápida de clases pactadas (+1 / -1)
  const handleModificarClasesPactadas = async (usuarioId, delta) => {
    try {
      await modificarClasesPactadasAdmin(usuarioId, delta);
      mostrarNotificacion(
        `Clases pactadas actualizadas correctamente (${delta > 0 ? "+1" : "-1"}).`,
      );
    } catch (err) {
      console.error("Error al modificar clases pactadas:", err);
      mostrarNotificacion("Error al modificar clases pactadas.", true);
    }
  };

  // Modificación rápida de sesiones de terapia (+1 / -1)
  const handleModificarSesionesTerapia = async (usuarioId, delta) => {
    try {
      await modificarSesionesTerapiaAdmin(usuarioId, delta);
      mostrarNotificacion(
        `Sesiones de terapia actualizadas correctamente (${delta > 0 ? "+1" : "-1"}).`,
      );
    } catch (err) {
      console.error("Error al modificar sesiones de terapia:", err);
      mostrarNotificacion("Error al modificar sesiones de terapia.", true);
    }
  };

  // Guardar (Crear o Actualizar) y registrar historial de pago automático
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
        const saldoAnteriorClases = usuarioEditando.clases_pactadas ?? 0;
        const saldoAnteriorTerapias = usuarioEditando.sesion_terapia ?? 0;

        await actualizarUsuarioAdmin(usuarioEditando.id, formData);

        // Registrar en historial_pagos_usuarios
        await registrarHistorialPagoAdmin({
          usuario: { id: usuarioEditando.id, ...formData },
          admin: currentUser,
          saldoAnteriorClases,
          saldoNuevoClases: formData.clases_pactadas,
          saldoAnteriorTerapias,
          saldoNuevoTerapias: formData.sesion_terapia,
          tipoOperacion: "modificar_usuario",
        });

        mostrarNotificacion("¡Datos del usuario y registro de pago guardados con éxito!");
      } else {
        const nuevoId = await crearUsuarioAdmin(formData);

        // Registrar en historial_pagos_usuarios
        await registrarHistorialPagoAdmin({
          usuario: { id: nuevoId, ...formData },
          admin: currentUser,
          saldoAnteriorClases: 0,
          saldoNuevoClases: formData.clases_pactadas,
          saldoAnteriorTerapias: 0,
          saldoNuevoTerapias: formData.sesion_terapia,
          tipoOperacion: "nuevo_usuario",
        });

        mostrarNotificacion("¡Nuevo usuario registrado y saldo asentado!");
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

  // Descarga de reporte CSV de historial de pagos (Autorizado para Administradores)
  const handleDescargarCSV = async () => {
    if (currentUser?.rol && currentUser.rol !== "admin") {
      mostrarNotificacion(
        "Acceso denegado: Se requiere rol de Administrador para descargar este informe.",
        true,
      );
      return;
    }

    setDescargandoCSV(true);
    try {
      const registros = await obtenerHistorialPagosAdmin();
      if (!registros || registros.length === 0) {
        mostrarNotificacion(
          "Aún no hay transacciones en el historial de pagos para exportar.",
          true,
        );
        return;
      }
      exportarHistorialPagosCSV(registros);
      mostrarNotificacion("¡Reporte de pagos en formato CSV descargado exitosamente!");
    } catch (error) {
      console.error("Error al exportar historial de pagos:", error);
      mostrarNotificacion("Error al generar el reporte CSV.", true);
    } finally {
      setDescargandoCSV(false);
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
            👥 Directorio de Usuarios
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
            Gestión de Usuarios
          </h1>
        </div>

        <div className="admin-header-actions">
          {/* Botón Descargar Reporte CSV (exclusivo admin) */}
          <button
            type="button"
            onClick={handleDescargarCSV}
            disabled={descargandoCSV}
            aria-label="Descargar historial de pagos en formato CSV"
            className="admin-btn-action admin-btn-action--secondary"
            style={{ opacity: descargandoCSV ? 0.7 : 1 }}
          >
            <span>{descargandoCSV ? "⏳" : "📊"}</span>
            <span>{descargandoCSV ? "Generando CSV..." : "Pagos CSV"}</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirCrear}
            className="admin-btn-action admin-btn-action--primary"
          >
            <span>👤➕</span>
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grilla Adaptable */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ color: "#64748B" }}>
            Total Usuarios
          </div>
          <div className="admin-kpi-value" style={{ color: "#253B59" }}>
            {totalUsuarios}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ color: "#166534" }}>
            Activos
          </div>
          <div className="admin-kpi-value" style={{ color: "#15803D" }}>
            {totalActivos}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ color: "#1D4ED8" }}>
            Admins
          </div>
          <div className="admin-kpi-value" style={{ color: "#1E40AF" }}>
            {totalAdmins}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ color: "#991B1B" }}>
            Inactivos
          </div>
          <div className="admin-kpi-value" style={{ color: "#B91C1C" }}>
            {totalInactivos}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="admin-filter-bar">
        <div style={{ width: "100%" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o teléfono..."
            aria-label="Buscar usuarios por nombre, email o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-filter-input"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            width: "100%",
          }}
        >
          {/* Filtro Rol */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label
              htmlFor="admin-usuarios-filtro-rol"
              style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}
            >
              Rol:
            </label>
            <select
              id="admin-usuarios-filtro-rol"
              aria-label="Filtrar por rol"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
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
              <option value="todos">Todos los roles</option>
              <option value="cliente">Cliente</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label
              htmlFor="admin-usuarios-filtro-estado"
              style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}
            >
              Estado:
            </label>
            <select
              id="admin-usuarios-filtro-estado"
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
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
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
                    <th style={{ padding: "1rem" }}>Sesiones Terapia</th>
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
                        ins.usuario_id === usr.id &&
                        ins.estado === "confirmada",
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
                    const sesionTerapiaNum = usr.sesion_terapia ?? 0;

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

                        {/* Columna Sesiones Terapia con ajustadores rápidos +- */}
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
                                  sesionTerapiaNum > 0 ? "#0284C7" : "#B91C1C",
                                minWidth: "24px",
                                textAlign: "center",
                              }}
                            >
                              {sesionTerapiaNum}
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
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
                            flexShrink: 0,
                          }}
                        >
                          {iniciales}
                        </div>
                        <div>
                          <div className="admin-card-title">{usr.nombre}</div>
                          <div className="admin-card-subtitle">
                            📧 {usr.email}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          alignItems: "flex-end",
                        }}
                      >
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
                        <span style={{ fontWeight: "600" }}>
                          {usr.telefono || "Sin teléfono"}
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>
                          📋 Clases Pactadas:
                        </span>
                        <span
                          style={{
                            fontWeight: "800",
                            color:
                              clasesPactadasNum > 0 ? "#15803D" : "#B91C1C",
                          }}
                        >
                          {clasesPactadasNum} clase(s)
                        </span>
                      </div>

                      <div className="admin-card-row">
                        <span style={{ color: "#64748B" }}>
                          🎟️ Reservas Activas:
                        </span>
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
                            cursor: "pointer",
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
                  padding: "0.25rem",
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
                gap: "1rem",
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
                  className="admin-input-mobile"
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
                  className="admin-input-mobile"
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
                  className="admin-input-mobile"
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
                    className="admin-input-mobile"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    {[0, 1, 2, 4, 8, 12, 16, 20, 24].map((num) => (
                      <option key={num} value={num}>
                        {num} clase(s)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-form-terapia"
                    style={{
                      display: "block",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      color: "#253B59",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Sesiones Terapia
                  </label>
                  <select
                    id="user-form-terapia"
                    value={formData.sesion_terapia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sesion_terapia: Number(e.target.value),
                      })
                    }
                    className="admin-input-mobile"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    {[0, 1, 2, 3, 4, 5, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} sesión(es)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-form-rol"
                    style={{
                      display: "block",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      color: "#253B59",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Rol Asignado
                  </label>
                  <select
                    id="user-form-rol"
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData({ ...formData, rol: e.target.value })
                    }
                    className="admin-input-mobile"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <option value="cliente">cliente</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-form-estado"
                  style={{
                    display: "block",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    color: "#253B59",
                    marginBottom: "0.35rem",
                  }}
                >
                  Estado de la Cuenta
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
                  className="admin-input-mobile"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <option value="activo">activo</option>
                  <option value="inactivo">inactivo</option>
                  <option value="suspendido">suspendido</option>
                </select>
              </div>

              {/* Vista previa en vivo del cálculo automático de tarifa y cobro */}
              {(() => {
                const cAnteriores = usuarioEditando ? (usuarioEditando.clases_pactadas ?? 0) : 0;
                const cNuevas = Number(formData.clases_pactadas) || 0;
                const cAgregadas = Math.max(0, cNuevas - cAnteriores);

                const tAnteriores = usuarioEditando ? (usuarioEditando.sesion_terapia ?? 0) : 0;
                const tNuevas = Number(formData.sesion_terapia) || 0;
                const tAgregadas = Math.max(0, tNuevas - tAnteriores);

                const cTarifa = cAgregadas > 0 ? cAgregadas : (cNuevas > 0 ? cNuevas : 0);
                const tTarifa = tAgregadas > 0 ? tAgregadas : (tNuevas > 0 ? tNuevas : 0);

                const calculo = calcularTarifaAutomatica(cTarifa, tTarifa);

                return (
                  <div
                    style={{
                      backgroundColor: calculo.monto > 0 ? "#F0FDF4" : "#F8FAFC",
                      border: `1.5px solid ${calculo.monto > 0 ? "#86EFAC" : "#E2E8F0"}`,
                      borderRadius: "14px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          color: "#253B59",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        💳 Tarifa Automática:
                      </span>
                      <span
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: "800",
                          color: calculo.monto > 0 ? "#15803D" : "#64748B",
                        }}
                      >
                        {formatearMonedaCLP(calculo.monto)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#475569",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                      }}
                    >
                      <span>
                        Plan: <strong>{calculo.detalle}</strong>
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        (Firestore sync)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Botones */}
              <div className="admin-modal-actions">
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
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#253B59",
                    margin: 0,
                  }}
                >
                  🎟️ Clases Reservadas
                </h2>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748B",
                    marginTop: "0.15rem",
                    overflowWrap: "anywhere",
                  }}
                >
                  Usuario: <strong>{usuarioClasesSeleccionado.nombre}</strong>
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
                  padding: "0.25rem",
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
                      padding: "1.75rem 1rem",
                      textAlign: "center",
                      color: "#64748B",
                      backgroundColor: "#F8FAFC",
                      borderRadius: "12px",
                      fontSize: "0.9rem",
                    }}
                  >
                    Este usuario no tiene reservas activas actualmente.
                  </div>
                );
              }

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {reservasUsuario.map((ins) => (
                    <div
                      key={ins.id}
                      style={{
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        padding: "0.85rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.65rem",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#253B59",
                            fontSize: "0.95rem",
                          }}
                        >
                          {ins.tipo_servicio || "Pilates Reformer"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#64748B",
                            marginTop: "0.2rem",
                          }}
                        >
                          👤 Instructor: {ins.instructor || "Staff"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#334155",
                            marginTop: "0.15rem",
                          }}
                        >
                          📅 Fecha Clase: {formatearFecha(ins.fecha_clase)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelarReserva(ins)}
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          border: "none",
                          borderRadius: "8px",
                          padding: "0.6rem 1rem",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          minHeight: "44px",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
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
            style={{ maxWidth: "420px", textAlign: "center" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h3
              style={{
                color: "#253B59",
                fontWeight: "700",
                margin: "0 0 0.5rem 0",
                fontSize: "1.2rem",
              }}
            >
              ¿Eliminar a {confirmDeleteUser.nombre}?
            </h3>
            <p
              style={{
                color: "#64748B",
                fontSize: "0.875rem",
                marginBottom: "1.25rem",
                lineHeight: 1.4,
              }}
            >
              Esta acción eliminará permanentemente al usuario, liberando los cupos correspondientes en las clases.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
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
    </div>
  );
}
