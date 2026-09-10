import { useState, useEffect } from "react";
import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { suscribirClasesPorFecha } from "../firebase/clasesService";
import {
  reservarClase,
  suscribirMisInscripciones,
  cancelarReservaCliente,
} from "../firebase/inscripcionesService";
import { sembrarDatosInicialesSiEsNecesario } from "../firebase/seedService";
import imagenpilates from "/pilates-studio-wide.jpg";

function generarProximosDias() {
  const diasNombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const mesesNombres = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
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
  const [selectedDayObj, setSelectedDayObj] = useState(() => diasDisponibles[0] || null);
  const [clasesDelDia, setClasesDelDia] = useState([]);
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [notification, setNotification] = useState({
    message: "",
    error: false,
  });
  const [loadingReservaId, setLoadingReservaId] = useState(null);
  const [cancellingReservaId, setCancellingReservaId] = useState(null);

  // Estado reactivo en tiempo real para el saldo de clases pactadas
  const [saldoClases, setSaldoClases] = useState(
    currentUser?.clases_pactadas ?? 0,
  );

  // Escuchar el documento de usuario en tiempo real para actualizar saldo sin retrasos
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userDocRef = doc(db, "usuarios", currentUser.uid);
    const unsub = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSaldoClases(data.clases_pactadas ?? 0);
        }
      },
      (err) => {
        console.error("Error al escuchar saldo de clases:", err);
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

  // Escuchar las inscripciones ("Mis Próximas Clases") del usuario actual
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

  const handleReservar = async (clase) => {
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
          "Has consumido tus clases pactadas. Contacta a administración.",
        error: true,
      });
      return;
    }

    // Optimistic UI update: Descontar instantáneamente en pantalla (0ms)
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
        message: `¡Clase de ${clase.tipo_servicio} reservada con éxito!`,
        error: false,
      });
    } catch (error) {
      console.error("Error al reservar clase:", error);
      // Revertir estado optimista si ocurrió un error
      setSaldoClases((prev) => prev + 1);
      setNotification({
        message: error.message || "No se pudo realizar la reserva.",
        error: true,
      });
    } finally {
      setLoadingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 4500);
    }
  };

  const handleAnularReserva = async (reserva) => {
    if (!currentUser?.uid) return;

    // Optimistic UI update: Reintegrar instantáneamente en pantalla (0ms)
    setSaldoClases((prev) => prev + 1);
    setCancellingReservaId(reserva.id);
    setNotification({ message: "", error: false });

    try {
      await cancelarReservaCliente({
        inscripcionId: reserva.id,
        claseId: reserva.clase_id,
        usuarioId: currentUser.uid,
      });

      setNotification({
        message: "Reserva anulada con éxito y clase devuelta a tu saldo.",
        error: false,
      });
    } catch (error) {
      console.error("Error al anular reserva:", error);
      // Revertir estado optimista si la regla de 15 horas bloqueó la anulación
      setSaldoClases((prev) => Math.max(0, prev - 1));
      setNotification({
        message: error.message || "No se pudo anular la reserva.",
        error: true,
      });
    } finally {
      setCancellingReservaId(null);
      setTimeout(() => setNotification({ message: "", error: false }), 5000);
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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.5rem",
            padding: "0.4rem 1.2rem",
            backgroundColor:
              saldoClases > 0 ? "rgba(206, 208, 242, 0.4)" : "#FEE2E2",
            borderRadius: "9999px",
            color: saldoClases > 0 ? "#253B59" : "#991B1B",
            fontWeight: "700",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
          }}
        >
          💳 Clases Pactadas Disponibles: {saldoClases}
        </div>
        <p className="booking-subtitle" style={{ marginTop: "0.75rem" }}>
          Selecciona el día y la clase que mejor se adapte a tu horario. Puedes
          anular tu reserva hasta 15 horas antes de la clase.
        </p>
      </div>

      {/* Alerta de Cuenta Sin Clases Pactadas */}
      {saldoClases <= 0 && (
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
              Reservas Inhabilitadas — 0 Clases Pactadas
            </h3>
            <p
              style={{
                margin: 0,
                color: "#7F1D1D",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
            >
              Tu cuenta tiene <strong>0 clases pactadas</strong>. Para poder
              realizar reservas de clases, el administrador debe asignarte el
              número de clases correspondiente según el plan que adquieras.
              Contacta a administración para activar tu plan.
            </p>
          </div>
        </div>
      )}

      {/* Grid Principal: Izquierda (Calendario + Clases) / Derecha (Sidebar) */}
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

          {/* Lista de Clases Disponibles en Firestore */}
          <div>
            <h3 className="classes-section-title">
              Clases Disponibles - {selectedDayObj?.nombreCompleto || ""}
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
                  const fechaInicioObj = clase.fecha_inicio?.toDate ? clase.fecha_inicio.toDate() : (clase.fecha_inicio ? new Date(clase.fecha_inicio) : null);
                  const fechaFinObj = clase.fecha_fin?.toDate ? clase.fecha_fin.toDate() : (clase.fecha_fin ? new Date(clase.fecha_fin) : null);
                  const estaCaducada = (fechaFinObj && fechaFinObj < ahora) || (fechaInicioObj && fechaInicioObj < ahora);
                  const esInactiva = clase.estado === "inactiva" || estaCaducada;

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
                          <h4 className="class-name">{clase.tipo_servicio}</h4>
                          <span className="class-instructor">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {clase.instructor || "Instructor Studio"}
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
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.65rem 1.2rem",
                              backgroundColor: "#E0F2FE",
                              color: "#0369A1",
                              borderRadius: "8px",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                            }}
                          >
                            ✓ Reservado
                          </span>
                        ) : esInactiva ? (
                          <button className="btn-disabled" disabled title="No se permiten reservas en clases inactivas o caducadas">
                            🔒 Clase Inactiva
                          </button>
                        ) : sinCupos ? (
                          <button className="btn-disabled" disabled>
                            Sin cupos
                          </button>
                        ) : sinClasesPactadas ? (
                          <button
                            className="btn-disabled"
                            disabled
                            title="No tienes clases pactadas asignadas por el administrador (0 disponibes)"
                          >
                            🔒 Sin clases pactadas
                          </button>
                        ) : (
                          <button
                            className="btn-reserve"
                            disabled={loadingReservaId === clase.id}
                            onClick={() => handleReservar(clase)}
                          >
                            {loadingReservaId === clase.id
                              ? "Reservando..."
                              : "Reservar"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "2.5rem",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  No hay clases programadas para este día.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Derecho */}
        <aside className="booking-sidebar">
          {/* Tarjeta Azul Navy: Mis Próximas Clases en Firestore */}
          <div className="upcoming-card">
            <div className="upcoming-header">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Mis Próximas Clases ({misInscripciones.length})</span>
            </div>

            <div className="upcoming-list">
              {misInscripciones.length > 0 ? (
                misInscripciones.map((res) => (
                  <div key={res.id} className="upcoming-item">
                    <div className="upcoming-item-top">
                      <span className="upcoming-date-tag">
                        {formatearFechaInscripcion(res.fecha_clase)}
                      </span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#CED0F2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>

                    <h5 className="upcoming-class-title">
                      {res.tipo_servicio || "Pilates Reformer"}
                    </h5>

                    <div className="upcoming-time-row">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>
                        {formatearHora(res.fecha_clase)} hrs —{" "}
                        {res.instructor || "Instructor Studio"}
                      </span>
                    </div>

                    {/* Botón Anular Reserva del Cliente (Regla de 15 horas) */}
                    <button
                      onClick={() => handleAnularReserva(res)}
                      disabled={cancellingReservaId === res.id}
                      style={{
                        marginTop: "0.75rem",
                        width: "100%",
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        color: "#F87171",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        borderRadius: "8px",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>🗑️</span>
                      {cancellingReservaId === res.id
                        ? "Anulando..."
                        : "Anular Reserva (-15h)"}
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: "#94A3B8",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    padding: "1rem 0",
                  }}
                >
                  Aún no tienes reservas activas.
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Imagen Apaisada del Estudio */}
          <div className="sidebar-image-card">
            <img
              src={imagenpilates}
              alt="Estudio Reformer de Hara Vitalis"
              className="sidebar-image"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
