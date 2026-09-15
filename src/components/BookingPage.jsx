import { useState, useEffect, useMemo } from "react";
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
import {
  suscribirTodasLasInscripcionesAdmin,
  suscribirTodosLosUsuariosAdmin,
} from "../firebase/usuariosService";
import { sembrarDatosInicialesSiEsNecesario } from "../firebase/seedService";
import imagenpilates from "/pilates-studio-wide.jpg";

function generarCuatroSemanas(offsetBloque = 0) {
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
  hoy.setHours(0, 0, 0, 0);

  // Calcular Lunes de la semana actual para alinear columnas (Lunes a Domingo)
  const dayOfWeek = hoy.getDay();
  const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const inicioLunes = new Date(hoy);
  inicioLunes.setDate(hoy.getDate() - distToMon + offsetBloque * 28);

  const listaDias = [];

  for (let i = 0; i < 28; i++) {
    const fecha = new Date(inicioLunes);
    fecha.setDate(inicioLunes.getDate() + i);

    const diaSemanaStr = diasNombres[fecha.getDay()];
    const numero = fecha.getDate();
    const mesStr = mesesNombres[fecha.getMonth()];
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");

    const id = `${yyyy}-${mm}-${dd}`;

    const fechaSinHora = new Date(fecha);
    fechaSinHora.setHours(0, 0, 0, 0);

    const esHoy = fechaSinHora.getTime() === hoy.getTime();
    const esPasado = fechaSinHora.getTime() < hoy.getTime();

    const nombreDiaLargo =
      diaSemanaStr === "Mar"
        ? "Martes"
        : diaSemanaStr === "Lun"
          ? "Lunes"
          : diaSemanaStr === "Mié"
            ? "Miércoles"
            : diaSemanaStr === "Jue"
              ? "Jueves"
              : diaSemanaStr === "Vie"
                ? "Viernes"
                : diaSemanaStr === "Sáb"
                  ? "Sábado"
                  : "Domingo";

    listaDias.push({
      id,
      fechaObj: fecha,
      diaSemana: diaSemanaStr,
      numero,
      mesStr,
      mesIndex: fecha.getMonth(),
      anio: yyyy,
      esHoy,
      esPasado,
      semanaIndex: Math.floor(i / 7),
      nombreCompleto: `${nombreDiaLargo} ${numero} de ${mesStr}`,
    });
  }
  return listaDias;
}

export default function BookingPage({ currentUser }) {
  // Estado de navegación para bloques de 4 semanas (0 = actual, +1 = +4 semanas, -1 = -4 semanas)
  const [semanaOffset, setSemanaOffset] = useState(0);

  // Memorización de los 28 días según el patrón rerender-memo y derived-state
  const diasDisponibles = useMemo(
    () => generarCuatroSemanas(semanaOffset),
    [semanaOffset],
  );

  // Seleccionar por defecto hoy o el primer día disponible
  const [selectedDayObj, setSelectedDayObj] = useState(() => {
    const hoyObj = diasDisponibles.find((d) => d.esHoy);
    return hoyObj || diasDisponibles[0] || null;
  });

  // Título de mes dinámico memorizado (ej. "Sep 2026" o "Sep - Oct 2026")
  const tituloMes = useMemo(() => {
    if (!diasDisponibles || diasDisponibles.length === 0) return "Calendario";
    const primerDia = diasDisponibles[0];
    const ultimoDia = diasDisponibles[diasDisponibles.length - 1];

    if (
      primerDia.mesStr === ultimoDia.mesStr &&
      primerDia.anio === ultimoDia.anio
    ) {
      return `${primerDia.mesStr} ${primerDia.anio}`;
    }
    if (primerDia.anio === ultimoDia.anio) {
      return `${primerDia.mesStr} - ${ultimoDia.mesStr} ${primerDia.anio}`;
    }
    return `${primerDia.mesStr} ${primerDia.anio} - ${ultimoDia.mesStr} ${ultimoDia.anio}`;
  }, [diasDisponibles]);

  const handleSemanaOffsetChange = (newOffset) => {
    setSemanaOffset(newOffset);
    const nuevosDias = generarCuatroSemanas(newOffset);
    const hoyObj = nuevosDias.find((d) => d.esHoy);
    setSelectedDayObj(hoyObj || nuevosDias[0]);
  };

  const handleIrAHoy = () => {
    setSemanaOffset(0);
    const diasHoy = generarCuatroSemanas(0);
    const hoyObj = diasHoy.find((d) => d.esHoy);
    setSelectedDayObj(hoyObj || diasHoy[0]);
  };
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

  // Modo Administrador: escuchar inscripciones y mapa de usuarios para mostrar asistencia
  const esAdmin = currentUser?.rol === "admin" || currentUser?.isAdmin === true;
  const [todasLasInscripciones, setTodasLasInscripciones] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});

  useEffect(() => {
    if (!esAdmin) return;

    const unsubInscripciones = suscribirTodasLasInscripcionesAdmin(
      (listaInscripciones) => {
        setTodasLasInscripciones(listaInscripciones);
      },
    );

    const unsubUsuarios = suscribirTodosLosUsuariosAdmin((listaUsuarios) => {
      const mapa = {};
      listaUsuarios.forEach((u) => {
        mapa[u.id] = u.nombre || u.email || "Usuario";
      });
      setUsuariosMap(mapa);
    });

    return () => {
      unsubInscripciones();
      unsubUsuarios();
    };
  }, [esAdmin]);

  // Helper para obtener la lista de personas inscritas a una clase o terapia específica
  const obtenerInscritosParaItem = (itemId, inscritosIds = []) => {
    if (!esAdmin) return [];

    const inscripcionesItem = todasLasInscripciones.filter(
      (ins) => ins.clase_id === itemId && ins.estado === "confirmada",
    );

    if (inscripcionesItem.length > 0) {
      return inscripcionesItem.map((ins) => ({
        id: ins.id,
        usuarioId: ins.usuario_id,
        nombre:
          usuariosMap[ins.usuario_id] || ins.nombre_usuario || "Usuario",
        email: ins.email || "",
      }));
    }

    if (inscritosIds && inscritosIds.length > 0) {
      return inscritosIds.map((uid) => ({
        id: uid,
        usuarioId: uid,
        nombre: usuariosMap[uid] || "Usuario",
        email: "",
      }));
    }

    return [];
  };

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
        <div className="booking-balances-row">
          <div
            className="balance-pill balance-pilates"
            style={{
              backgroundColor:
                saldoClases > 0 ? "rgba(206, 208, 242, 0.5)" : "#FEE2E2",
              color: saldoClases > 0 ? "#253B59" : "#991B1B",
            }}
          >
            💳 Clases Pilates Pactadas: <strong>{saldoClases}</strong>
          </div>

          <div
            className="balance-pill balance-terapia"
            style={{
              backgroundColor:
                saldoTerapias > 0 ? "rgba(220, 252, 231, 0.9)" : "#FEE2E2",
              color: saldoTerapias > 0 ? "#15803D" : "#991B1B",
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
      <div className="booking-tabs-container">
        <button
          onClick={() => setTabActivaReserva("todas")}
          className={`booking-tab-btn ${tabActivaReserva === "todas" ? "active-todas" : ""}`}
        >
          🌟 Todas las Opciones
        </button>

        <button
          onClick={() => setTabActivaReserva("clases")}
          className={`booking-tab-btn ${tabActivaReserva === "clases" ? "active-clases" : ""}`}
        >
          🧘‍♀️ Clases Pilates Reformer
        </button>

        <button
          onClick={() => setTabActivaReserva("terapias")}
          className={`booking-tab-btn ${tabActivaReserva === "terapias" ? "active-terapias" : ""}`}
        >
          🌿 Sesiones Terapia Integrativa
        </button>
      </div>

      {/* Grid Principal Layout Split: Izquierda (Calendario Sticky) / Derecha (Clases & Terapias) */}
      <div className="booking-split-container">
        {/* COLUMNA IZQUIERDA: CALENDARIO DE 4 SEMANAS (STICKY) */}
        <aside className="booking-left-sidebar">
          <div className="calendar-card sticky-calendar">
            <div className="calendar-card-header">
              <div className="calendar-header-info">
                <span className="month-title">{tituloMes}</span>
                <span className="calendar-badge">4 Semanas</span>
              </div>

              <div className="calendar-nav-btns">
                <button
                  type="button"
                  className="nav-btn-secondary"
                  onClick={handleIrAHoy}
                  title="Ir al día de hoy"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className="nav-arrow-btn"
                  onClick={() => handleSemanaOffsetChange(semanaOffset - 1)}
                  title="4 semanas anteriores"
                  aria-label="4 semanas anteriores"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="nav-arrow-btn"
                  onClick={() => handleSemanaOffsetChange(semanaOffset + 1)}
                  title="Próximas 4 semanas"
                  aria-label="Próximas 4 semanas"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="days-row calendar-grid-4weeks">
              {diasDisponibles.map((dia) => {
                const isActive = selectedDayObj && dia.id === selectedDayObj.id;
                return (
                  <button
                    key={dia.id}
                    type="button"
                    aria-selected={isActive}
                    aria-label={dia.nombreCompleto}
                    className={`day-pill ${isActive ? "active" : ""} ${dia.esHoy ? "is-today" : ""} ${dia.esPasado ? "is-past" : ""}`}
                    onClick={() => setSelectedDayObj(dia)}
                  >
                    <span className="day-name">{dia.diaSemana}</span>
                    <span className="day-number">{dia.numero}</span>
                    {dia.esHoy && <span className="today-dot" title="Hoy" />}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA: CLASES Y TERAPIAS DISPONIBLES PARA EL DÍA SELECCIONADO */}
        <main className="booking-right-content">
          {/* Banner Informativo del Día Seleccionado */}
          <div className="selected-day-banner">
            <div className="selected-day-info">
              <span className="selected-day-icon">📅</span>
              <div>
                <h3 className="selected-day-title">
                  {selectedDayObj?.nombreCompleto || "Selecciona un día"}
                </h3>
                <span className="selected-day-subtitle">
                  {(tabActivaReserva === "todas"
                    ? clasesDelDia.length + terapiasDelDia.length
                    : tabActivaReserva === "clases"
                      ? clasesDelDia.length
                      : terapiasDelDia.length)}{" "}
                  opción
                  {(tabActivaReserva === "todas"
                    ? clasesDelDia.length + terapiasDelDia.length
                    : tabActivaReserva === "clases"
                      ? clasesDelDia.length
                      : terapiasDelDia.length) !== 1
                    ? "es"
                    : ""}{" "}
                  disponible
                  {(tabActivaReserva === "todas"
                    ? clasesDelDia.length + terapiasDelDia.length
                    : tabActivaReserva === "clases"
                      ? clasesDelDia.length
                      : terapiasDelDia.length) !== 1
                    ? "s"
                    : ""}{" "}
                  para reservar
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: CLASES DE PILATES REFORMER */}
          {(tabActivaReserva === "todas" || tabActivaReserva === "clases") && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3
                className="classes-section-title"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span>🧘‍♀️</span> Clases de Pilates Reformer
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
                    const inscritosClase = esAdmin
                      ? obtenerInscritosParaItem(clase.id, clase.inscritos_ids)
                      : [];

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

                            {/* Panel Exclusivo de Administrador: Alumnos con Reserva */}
                            {esAdmin && (
                              <div className="admin-roster-box">
                                <div className="admin-roster-header">
                                  <span className="admin-roster-badge">
                                    🛡️ Admin
                                  </span>
                                  <span className="admin-roster-count">
                                    Inscritos: <strong>{inscritosClase.length}</strong>
                                    {clase.cupos_totales
                                      ? ` / ${clase.cupos_totales}`
                                      : ""}
                                  </span>
                                </div>
                                {inscritosClase.length > 0 ? (
                                  <div className="admin-roster-list">
                                    {inscritosClase.map((alumno, idx) => (
                                      <span
                                        key={alumno.id || idx}
                                        className="admin-alumno-chip"
                                        title={
                                          alumno.email
                                            ? `${alumno.nombre} (${alumno.email})`
                                            : alumno.nombre
                                        }
                                      >
                                        <span className="admin-alumno-avatar">
                                          {alumno.nombre.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="admin-alumno-nombre">
                                          {alumno.nombre}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="admin-roster-empty">
                                    Sin alumnos inscritos aún
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="class-action-box">
                          {yaInscrito ? (
                            <div className="class-action-inscrito">
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
                  <span>🌿</span> Sesiones de Terapia Integrativa
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
                    const inscritosTerapia = esAdmin
                      ? obtenerInscritosParaItem(terapia.id, terapia.inscritos_ids)
                      : [];

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

                            {/* Panel Exclusivo de Administrador: Paciente / Alumno con Reserva */}
                            {esAdmin && (
                              <div className="admin-roster-box admin-roster-terapia">
                                <div className="admin-roster-header">
                                  <span className="admin-roster-badge badge-admin-terapia">
                                    🛡️ Admin
                                  </span>
                                  <span className="admin-roster-count">
                                    Paciente reservado: <strong>{inscritosTerapia.length}</strong>
                                    {terapia.cupos_totales
                                      ? ` / ${terapia.cupos_totales}`
                                      : ` / ${terapia.cupos_disponibles ?? 1}`}
                                  </span>
                                </div>
                                {inscritosTerapia.length > 0 ? (
                                  <div className="admin-roster-list">
                                    {inscritosTerapia.map((paciente, idx) => (
                                      <span
                                        key={paciente.id || idx}
                                        className="admin-alumno-chip chip-terapia"
                                        title={
                                          paciente.email
                                            ? `${paciente.nombre} (${paciente.email})`
                                            : paciente.nombre
                                        }
                                      >
                                        <span className="admin-alumno-avatar avatar-terapia">
                                          {paciente.nombre.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="admin-alumno-nombre">
                                          {paciente.nombre}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="admin-roster-empty">
                                    Sin pacientes citados aún
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="class-action-box">
                          {yaInscrito ? (
                            <div className="class-action-inscrito">
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
        </main>
      </div>
    </div>
  );
}
