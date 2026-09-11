import { useState, useEffect } from "react";
import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { suscribirClasesPorFecha } from "../firebase/clasesService";
import { suscribirTerapiasActivas } from "../firebase/terapiasService";
import {
  reservarClase,
  reservarTerapia,
  suscribirMisInscripciones,
  cancelarReservaCliente,
} from "../firebase/inscripcionesService";
import { sembrarDatosInicialesSiEsNecesario } from "../firebase/seedService";
import imagenpilates from "/pilates-studio-wide.jpg";

function generarProximosDias() {
  const diasNombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const mesesNombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const hoy = new Date();
  const listaDias = [];

  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);

    const diaSemanaStr = diasNombres[fecha.getDay()];
    const numero = fecha.getDate();
    const mesStr = mesesNombres[fecha.getMonth()];
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");

    const id = `${yyyy}-${mm}-${dd}`;

    listaDias.push({
      id,
      fechaObj: fecha,
      diaSemana: diaSemanaStr,
      numero,
      mesStr,
      nombreCompleto: `${diaSemanaStr === "Mar" ? "Martes" : diaSemanaStr === "Lun" ? "Lunes" : diaSemanaStr === "Mié" ? "Miércoles" : diaSemanaStr === "Jue" ? "Jueves" : diaSemanaStr === "Vie" ? "Viernes" : diaSemanaStr === "Sáb" ? "Sábado" : "Domingo"} ${numero} de ${mesStr}`,
    });
  }
  return listaDias;
}

export default function BookingPage({ currentUser }) {
  // Generar próximos 14 días a partir de hoy
  const [diasDisponibles] = useState(generarProximosDias);
  const [selectedDayObj, setSelectedDayObj] = useState(
    () => diasDisponibles[0] || null,
  );
  const [clasesDelDia, setClasesDelDia] = useState([]);
  const [terapiasDisponibles, setTerapiasDisponibles] = useState([]);
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [tabFiltroReservas, setTabFiltroReservas] = useState("pendientes"); // "pendientes" | "caducadas" | "todas"
  const [tabActivaReserva, setTabActivaReserva] = useState("todas"); // "todas" | "clases" | "terapias"
  const [notification, setNotification] = useState({
    message: "",
    error: false,
  });
  const [loadingReservaId, setLoadingReservaId] = useState(null);
  const [cancellingReservaId, setCancellingReservaId] = useState(null);

  // Estado reactivo en tiempo real para el saldo de clases pactadas y terapias
  const [saldoClases, setSaldoClases] = useState(
    currentUser?.clases_pactadas ?? 0,
  );
  const [saldoTerapias, setSaldoTerapias] = useState(
    currentUser?.sesion_terapia ?? 0,
  );

  // Escuchar el documento de usuario en tiempo real para actualizar saldos sin retrasos
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, "usuarios", currentUser.uid);
    const unsub = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSaldoClases(data.clases_pactadas ?? 0);
          setSaldoTerapias(data.sesion_terapia ?? 0);
        }
      },
      (err) => {
        console.error("Error al escuchar saldo de usuario:", err);
      },
    );

    return () => unsub();
  }, [currentUser?.uid]);

  // Sembrado inicial
  useEffect(() => {
    sembrarDatosInicialesSiEsNecesario();
  }, []);

  // Escuchar clases en tiempo real para el día seleccionado
  useEffect(() => {
    if (!selectedDayObj) return;

    const fechaInicio = new Date(selectedDayObj.fechaObj);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(selectedDayObj.fechaObj);
    fechaFin.setHours(23, 59, 59, 999);

    const unsubscribe = suscribirClasesPorFecha(
      Timestamp.fromDate(fechaInicio),
      Timestamp.fromDate(fechaFin),
      (clases) => setClasesDelDia(clases),
    );

    return () => unsubscribe();
  }, [selectedDayObj]);

  // Escuchar terapias en tiempo real desde Firestore
  useEffect(() => {
    const unsubscribe = suscribirTerapiasActivas((terapias) => {
      setTerapiasDisponibles(terapias);
    });
    return () => unsubscribe();
  }, []);

  // Escuchar las inscripciones ("Mis Próximas Clases / Terapias") del usuario actual
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = suscribirMisInscripciones(
      currentUser.uid,
      (reservas) => {
        setMisInscripciones(reservas);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Manejar reserva de Clases de Pilates Reformer
  const handleReservarClase = async (clase) => {
    if (!currentUser?.uid) {
      setNotification({
        message: "Debes iniciar sesión para reservar.",
        error: true,
      });
      return;
    }

    if (saldoClases <= 0) {
      setNotification({
        message:
          "Has consumido tus clases pactadas (Saldo 0). Contacta al administrador para cargar más clases a tu cuenta.",
        error: true,
      });
      return;
    }

    // Optimistic UI
    setSaldoClases((prev) => Math.max(0, prev - 1));
    setLoadingReservaId(clase.id);
    setNotification({ message: "", error: false });

    try {
      await reservarClase({
        claseId: clase.id,
        usuarioId: currentUser.uid,
        nombreUsuario: currentUser.nombre || currentUser.email,
      });

      setNotification({
        message: `¡${clase.tipo_servicio} reservada con éxito!`,
        error: false,
      });
    } catch (error) {
      console.error("Error al reservar clase:", error);
      setSaldoClases((prev) => prev + 1);
      setNotification({
        message: error.message || "No se pudo realizar la reserva de la clase.",
        error: true,
      });
    } finally {
      setLoadingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4500);
    }
  };

  // Manejar reserva de Terapias Integrativas (Usa saldo sesion_terapia)
  const handleReservarTerapia = async (terapia) => {
    if (!currentUser?.uid) {
      setNotification({
        message: "Debes iniciar sesión para reservar.",
        error: true,
      });
      return;
    }

    if (saldoTerapias <= 0) {
      setNotification({
        message:
          "No posees sesiones de terapia asignadas (Saldo 0). Contacta al administrador para cargar horas de terapia a tu cuenta.",
        error: true,
      });
      return;
    }

    // Optimistic UI
    setSaldoTerapias((prev) => Math.max(0, prev - 1));
    setLoadingReservaId(terapia.id);
    setNotification({ message: "", error: false });

    try {
      await reservarTerapia({
        terapiaId: terapia.id,
        usuarioId: currentUser.uid,
        nombreUsuario: currentUser.nombre || currentUser.email,
      });

      setNotification({
        message: `¡Sesión de ${terapia.titulo || "Terapia"} reservada con éxito!`,
        error: false,
      });
    } catch (error) {
      console.error("Error al reservar terapia:", error);
      setSaldoTerapias((prev) => prev + 1);
      setNotification({
        message:
          error.message || "No se pudo realizar la reserva de la terapia.",
        error: true,
      });
    } finally {
      setLoadingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4500);
    }
  };

  const handleAnularReservaDirecta = async (item, esTerapia = false) => {
    if (!currentUser?.uid) return;

    const inscripcionId = esTerapia
      ? `terapia_${item.id}_${currentUser.uid}`
      : `${item.id}_${currentUser.uid}`;

    setCancellingReservaId(item.id);
    setNotification({ message: "", error: false });

    // Actualización optimista del saldo en UI
    if (esTerapia) {
      setSaldoTerapias((prev) => prev + 1);
    } else {
      setSaldoClases((prev) => prev + 1);
    }

    try {
      await cancelarReservaCliente({
        inscripcionId,
        claseId: item.id,
        usuarioId: currentUser.uid,
      });

      setNotification({
        message: `Reserva anulada con éxito. Se ha devuelto 1 ${esTerapia ? "sesión de terapia" : "clase pactada"} a tu saldo personal.`,
        error: false,
      });
    } catch (error) {
      console.error("Error al anular reserva desde la tarjeta:", error);
      // Revertir optimismo si falla
      if (esTerapia) {
        setSaldoTerapias((prev) => Math.max(0, prev - 1));
      } else {
        setSaldoClases((prev) => Math.max(0, prev - 1));
      }
      setNotification({
        message: error.message || "No se pudo anular la reserva.",
        error: true,
      });
    } finally {
      setCancellingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4500);
    }
  };

  const handleAnularReserva = async (reserva) => {
    if (!currentUser?.uid) return;

    const esTerapia = (reserva.tipo_servicio || "")
      .toLowerCase()
      .includes("terapia");

    if (esTerapia) {
      setSaldoTerapias((prev) => prev + 1);
    } else {
      setSaldoClases((prev) => prev + 1);
    }
    setCancellingReservaId(reserva.id);
    setNotification({ message: "", error: false });

    try {
      await cancelarReservaCliente({
        inscripcionId: reserva.id,
        claseId: reserva.clase_id,
        usuarioId: currentUser.uid,
      });

      setNotification({
        message: "Reserva anulada con éxito y saldo restituido.",
        error: false,
      });
    } catch (error) {
      console.error("Error al anular reserva:", error);
      if (esTerapia) {
        setSaldoTerapias((prev) => Math.max(0, prev - 1));
      } else {
        setSaldoClases((prev) => Math.max(0, prev - 1));
      }
      setNotification({
        message: error.message || "No se pudo anular la reserva.",
        error: true,
      });
    } finally {
      setCancellingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4500);
    }
  };

  const formatearHora = (timestamp) => {
    if (!timestamp) return "00:00";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatearFechaInscripcion = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const dias = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    const meses = [
      "ENE",
      "FEB",
      "MAR",
      "ABR",
      "MAY",
      "JUN",
      "JUL",
      "AGO",
      "SEP",
      "OCT",
      "NOV",
      "DIC",
    ];
    return `${dias[date.getDay()]}, ${date.getDate()} ${meses[date.getMonth()]}`;
  };

  const nombreMostrar = currentUser?.nombre
    ? currentUser.nombre
    : currentUser?.email
      ? currentUser.email.split("@")[0]
      : "Alumno";

  const terapiasDelDia = terapiasDisponibles.filter((terapia) => {
    if (terapia.estado === "inactiva") return false;

    const fechaInicioObj = terapia.fecha_inicio?.toDate
      ? terapia.fecha_inicio.toDate()
      : terapia.fecha_inicio
        ? new Date(terapia.fecha_inicio)
        : null;

    if (!selectedDayObj?.fechaObj) return true;

    // Si no cuenta con timestamp de fecha específico, se muestra disponible para el día seleccionado
    if (!fechaInicioObj || isNaN(fechaInicioObj.getTime())) {
      return true;
    }

    const inicioDia = new Date(selectedDayObj.fechaObj);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(selectedDayObj.fechaObj);
    finDia.setHours(23, 59, 59, 999);

    return fechaInicioObj >= inicioDia && fechaInicioObj <= finDia;
  });

  const ahora = new Date();

  const reservasPendientes = misInscripciones.filter((res) => {
    if (!res.fecha_clase) return true;
    const fechaObj = res.fecha_clase?.toDate
      ? res.fecha_clase.toDate()
      : new Date(res.fecha_clase);
    return fechaObj >= ahora;
  });

  const reservasCaducadas = misInscripciones.filter((res) => {
    if (!res.fecha_clase) return false;
    const fechaObj = res.fecha_clase?.toDate
      ? res.fecha_clase.toDate()
      : new Date(res.fecha_clase);
    return fechaObj < ahora;
  });

  const reservasAMostrar =
    tabFiltroReservas === "pendientes"
      ? reservasPendientes
      : tabFiltroReservas === "caducadas"
      ? reservasCaducadas
      : misInscripciones;

  return (
    <div className="booking-page-container">
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
            zIndex: 100,
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

      {/* Header Sección Agendamiento */}
      <div className="booking-header">
        <h1 className="booking-title">Reserva tu sesión</h1>
        <h2 className="booking-username">{nombreMostrar}</h2>

        {/* Resumen de Saldos Disponibles (Clases & Terapias) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              backgroundColor:
                saldoClases > 0 ? "rgba(206, 208, 242, 0.5)" : "#FEE2E2",
              borderRadius: "9999px",
              color: saldoClases > 0 ? "#253B59" : "#991B1B",
              fontWeight: "700",
              fontSize: "0.9rem",
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            💳 Clases Pilates Pactadas: <strong>{saldoClases}</strong>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              backgroundColor:
                saldoTerapias > 0 ? "rgba(220, 252, 231, 0.9)" : "#FEE2E2",
              borderRadius: "9999px",
              color: saldoTerapias > 0 ? "#15803D" : "#991B1B",
              fontWeight: "700",
              fontSize: "0.9rem",
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            🌿 Sesiones Terapia Disponibles: <strong>{saldoTerapias}</strong>
          </div>
        </div>

        <p className="booking-subtitle" style={{ marginTop: "0.75rem" }}>
          Selecciona el día y agenda tu lugar en las Clases de Pilates Reformer
          o en las Sesiones de Terapia Integrativa.
        </p>
      </div>

      {/* Banner de Aviso de Saldo si ambos están en 0 */}
      {saldoClases <= 0 && saldoTerapias <= 0 && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1.5px solid #FCA5A5",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            boxShadow: "0 4px 12px rgba(153, 27, 27, 0.08)",
          }}
        >
          <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>🔒</span>
          <div>
            <h3
              style={{
                margin: "0 0 0.35rem 0",
                color: "#991B1B",
                fontSize: "1.05rem",
                fontWeight: "700",
              }}
            >
              Sin Saldos Disponibles para Reserva
            </h3>
            <p
              style={{
                margin: 0,
                color: "#7F1D1D",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
            >
              Actualmente cuentas con <strong>0 clases pactadas</strong> y{" "}
              <strong>0 sesiones de terapia</strong>. Contacta al administrador
              para abonar clases de Pilates o cargar horas de terapia a tu
              cuenta.
            </p>
          </div>
        </div>
      )}

      {/* Selector de Pestañas de Agendamiento en la Pantalla de Clases */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setTabActivaReserva("todas")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "9999px",
            border: "none",
            backgroundColor:
              tabActivaReserva === "todas" ? "#253B59" : "#E2E8F0",
            color: tabActivaReserva === "todas" ? "#FFFFFF" : "#475569",
            fontWeight: "700",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "background-color 0.2s ease, color 0.2s ease",
          }}
        >
          🌟 Todas las Opciones
        </button>

        <button
          onClick={() => setTabActivaReserva("clases")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "9999px",
            border: "none",
            backgroundColor:
              tabActivaReserva === "clases" ? "#253B59" : "#E2E8F0",
            color: tabActivaReserva === "clases" ? "#FFFFFF" : "#475569",
            fontWeight: "700",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "background-color 0.2s ease, color 0.2s ease",
          }}
        >
          🧘‍♀️ Clases Pilates Reformer
        </button>

        <button
          onClick={() => setTabActivaReserva("terapias")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "9999px",
            border: "none",
            backgroundColor:
              tabActivaReserva === "terapias" ? "#15803D" : "#E2E8F0",
            color: tabActivaReserva === "terapias" ? "#FFFFFF" : "#475569",
            fontWeight: "700",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "background-color 0.2s ease, color 0.2s ease",
          }}
        >
          🌿 Sesiones Terapia Integrativa
        </button>
      </div>

      {/* Grid Principal: Izquierda (Calendario + Clases & Terapias) / Derecha (Sidebar Próximas Reservas) */}
      <div className="booking-grid">
        <div className="booking-main">
          {/* Tarjeta de Calendario Horizontal */}
          <div className="calendar-card">
            <div className="calendar-card-header">
              <span className="month-title">
                {selectedDayObj
                  ? `${selectedDayObj.mesStr} ${selectedDayObj.fechaObj.getFullYear()}`
                  : "Calendario"}
              </span>
            </div>

            <div className="days-row">
              {diasDisponibles.map((dia) => {
                const isActive = selectedDayObj && dia.id === selectedDayObj.id;
                return (
                  <button
                    key={dia.id}
                    className={`day-pill ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedDayObj(dia)}
                  >
                    <span className="day-name">{dia.diaSemana}</span>
                    <span className="day-number">{dia.numero}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 1: CLASES DE PILATES REFORMER */}
          {(tabActivaReserva === "todas" || tabActivaReserva === "clases") && (
            <div style={{ marginBottom: "3rem" }}>
              <h3
                className="classes-section-title"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>🧘‍♀️</span> Clases de Pilates Reformer -{" "}
                {selectedDayObj?.nombreCompleto || ""}
              </h3>

              <div className="classes-list">
                {clasesDelDia.length > 0 ? (
                  clasesDelDia.map((clase) => {
                    const yaInscrito = clase.inscritos_ids?.includes(
                      currentUser?.uid,
                    );
                    const sinCupos = clase.cupos_disponibles <= 0;
                    const sinClasesPactadas = saldoClases <= 0;

                    const ahora = new Date();
                    const fechaInicioObj = clase.fecha_inicio?.toDate
                      ? clase.fecha_inicio.toDate()
                      : clase.fecha_inicio
                        ? new Date(clase.fecha_inicio)
                        : null;
                    const fechaFinObj = clase.fecha_fin?.toDate
                      ? clase.fecha_fin.toDate()
                      : clase.fecha_fin
                        ? new Date(clase.fecha_fin)
                        : null;
                    const estaCaducada =
                      (fechaFinObj && fechaFinObj < ahora) ||
                      (fechaInicioObj && fechaInicioObj < ahora);
                    const esInactiva =
                      clase.estado === "inactiva" || estaCaducada;

                    const horasHastaInicio = fechaInicioObj
                      ? (fechaInicioObj.getTime() - ahora.getTime()) /
                        (1000 * 60 * 60)
                      : 0;
                    const sePuedeAnular = horasHastaInicio >= 15;

                    const horaInicioStr = formatearHora(clase.fecha_inicio);
                    const horaFinStr = formatearHora(clase.fecha_fin);

                    return (
                      <div key={clase.id} className="class-card">
                        <div className="class-left-info">
                          <div className="time-box">
                            <span className="time-text">{horaInicioStr}</span>
                            <span className="duration-text">
                              {horaInicioStr} - {horaFinStr}
                            </span>
                          </div>

                          <div className="class-details">
                            <h4 className="class-name">
                              {clase.tipo_servicio}
                            </h4>
                            <span className="class-instructor">
                              👤 {clase.instructor || "Camila Soto"}
                            </span>

                            <div className="class-pills-row">
                              <span className="badge-pill">Reformer</span>
                              <span
                                className={`badge-pill ${esInactiva ? "inactiva" : sinCupos ? "completo" : "plazas"}`}
                              >
                                {esInactiva
                                  ? "Inactiva / Caducada"
                                  : sinCupos
                                    ? "Completo"
                                    : `${clase.cupos_disponibles} plaza${clase.cupos_disponibles > 1 ? "s" : ""}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {yaInscrito ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "0.5rem",
                              }}
                            >
                              <span className="badge-reservado-clase">
                                ✓ Reservado
                              </span>
                              <button
                                onClick={() =>
                                  handleAnularReservaDirecta(clase, false)
                                }
                                disabled={
                                  !sePuedeAnular ||
                                  cancellingReservaId === clase.id
                                }
                                className={
                                  sePuedeAnular
                                    ? "btn-anular-card-active"
                                    : "btn-anular-card-disabled"
                                }
                                title={
                                  sePuedeAnular
                                    ? "Anular esta reserva y restituir la clase a tu saldo personal"
                                    : "Solo puedes anular una reserva con al menos 15 horas de anticipación"
                                }
                              >
                                <span>🗑️</span>
                                {cancellingReservaId === clase.id
                                  ? "Anulando..."
                                  : sePuedeAnular
                                    ? "Anular Reserva (-15h)"
                                    : "No Anulable (<15h)"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleReservarClase(clase)}
                              disabled={
                                sinCupos ||
                                sinClasesPactadas ||
                                esInactiva ||
                                loadingReservaId === clase.id
                              }
                              className={
                                sinCupos || sinClasesPactadas || esInactiva
                                  ? "btn-booking-disabled"
                                  : "btn-booking-primary"
                              }
                            >
                              {loadingReservaId === clase.id
                                ? "Reservando..."
                                : sinClasesPactadas
                                  ? "Sin Clases"
                                  : sinCupos
                                    ? "Completo"
                                    : esInactiva
                                      ? "Inactiva"
                                      : "Reservar Clase"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "2rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.95rem" }}>
                      No hay clases de Pilates agendadas para el día{" "}
                      <strong>{selectedDayObj?.nombreCompleto}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: SESIONES DE TERAPIA INTEGRATIVA DISPONIBLES */}
          {(tabActivaReserva === "todas" ||
            tabActivaReserva === "terapias") && (
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <h3
                  className="classes-section-title"
                  style={{
                    color: "#166534",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>🌿</span> Sesiones de Terapia Integrativa -{" "}
                  {selectedDayObj?.nombreCompleto || ""}
                </h3>
              </div>

              <div className="classes-list">
                {terapiasDelDia.length > 0 ? (
                  terapiasDelDia.map((terapia) => {
                    const yaInscrito = terapia.inscritos_ids?.includes(
                      currentUser?.uid,
                    );
                    const sinCupos =
                      Number(terapia.cupos_disponibles ?? 1) <= 0;
                    const sinSaldoTerapia = saldoTerapias <= 0;

                    const ahora = new Date();
                    const fechaInicioObj = terapia.fecha_inicio?.toDate
                      ? terapia.fecha_inicio.toDate()
                      : terapia.fecha_inicio
                        ? new Date(terapia.fecha_inicio)
                        : null;
                    const fechaFinObj = terapia.fecha_fin?.toDate
                      ? terapia.fecha_fin.toDate()
                      : terapia.fecha_fin
                        ? new Date(terapia.fecha_fin)
                        : null;
                    const estaCaducada =
                      (fechaFinObj && fechaFinObj < ahora) ||
                      (fechaInicioObj && fechaInicioObj < ahora);
                    const esInactiva =
                      terapia.estado === "inactiva" || estaCaducada;

                    const horasHastaInicio = fechaInicioObj
                      ? (fechaInicioObj.getTime() - ahora.getTime()) /
                        (1000 * 60 * 60)
                      : 0;
                    const sePuedeAnular = horasHastaInicio >= 15;

                    const horaInicioStr = formatearHora(terapia.fecha_inicio);
                    const horaFinStr = formatearHora(terapia.fecha_fin);

                    return (
                      <div
                        key={terapia.id}
                        className="class-card"
                        style={{
                          borderLeft: "5px solid #15803D",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <div className="class-left-info">
                          <div
                            className="time-box"
                            style={{
                              backgroundColor: "#DCFCE7",
                              color: "#15803D",
                              border: "1px solid #BBF7D0",
                            }}
                          >
                            <span
                              className="time-text"
                              style={{ fontSize: "0.95rem" }}
                            >
                              {horaInicioStr !== "00:00" ? horaInicioStr : "🌿"}
                            </span>
                            <span
                              className="duration-text"
                              style={{ color: "#166534", fontWeight: "700" }}
                            >
                              {horaInicioStr !== "00:00" &&
                              horaFinStr !== "00:00"
                                ? `${horaInicioStr} - ${horaFinStr}`
                                : terapia.duracion || "50 min"}
                            </span>
                          </div>

                          <div className="class-details">
                            <h4
                              className="class-name"
                              style={{ color: "#166534" }}
                            >
                              {terapia.titulo || "Terapia Integrativa"}
                            </h4>
                            <p
                              style={{
                                margin: "0.2rem 0 0.5rem 0",
                                fontSize: "0.85rem",
                                color: "#475569",
                                lineHeight: "1.4",
                              }}
                            >
                              {terapia.descripcion}
                            </p>

                            <div className="class-pills-row">
                              <span
                                style={{
                                  backgroundColor: "#DCFCE7",
                                  color: "#15803D",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  textTransform: "uppercase",
                                }}
                              >
                                {terapia.badge || "Atención 1 a 1"}
                              </span>
                              <span
                                style={{
                                  backgroundColor: "#F1F5F9",
                                  color: "#475569",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                              >
                                🩺 {terapia.terapeuta || "Especialista MTC"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {yaInscrito ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "0.5rem",
                              }}
                            >
                              <span className="badge-reservado-terapia">
                                ✓ Terapia Reservada
                              </span>
                              <button
                                onClick={() =>
                                  handleAnularReservaDirecta(terapia, true)
                                }
                                disabled={
                                  !sePuedeAnular ||
                                  cancellingReservaId === terapia.id
                                }
                                className={
                                  sePuedeAnular
                                    ? "btn-anular-card-active"
                                    : "btn-anular-card-disabled"
                                }
                                title={
                                  sePuedeAnular
                                    ? "Anular esta reserva y restituir la sesión a tu saldo personal"
                                    : "Solo puedes anular una reserva con al menos 15 horas de anticipación"
                                }
                              >
                                <span>🗑️</span>
                                {cancellingReservaId === terapia.id
                                  ? "Anulando..."
                                  : sePuedeAnular
                                    ? "Anular Reserva (-15h)"
                                    : "No Anulable (<15h)"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleReservarTerapia(terapia)}
                              disabled={
                                sinCupos ||
                                sinSaldoTerapia ||
                                esInactiva ||
                                loadingReservaId === terapia.id
                              }
                              className={
                                sinCupos || sinSaldoTerapia || esInactiva
                                  ? "btn-booking-disabled"
                                  : "btn-booking-terapia"
                              }
                            >
                              {loadingReservaId === terapia.id
                                ? "Reservando..."
                                : sinSaldoTerapia
                                  ? "Sin Horas Terapia"
                                  : sinCupos
                                    ? "Agotado"
                                    : esInactiva
                                      ? "Inactiva"
                                      : "Reservar Hora de Terapia"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "2rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.95rem" }}>
                      No hay sesiones de terapia agendadas para el día{" "}
                      <strong>{selectedDayObj?.nombreCompleto}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
