import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

/**
 * Realiza la reserva de una clase mediante una transacción atómica en Firestore.
 * Garantiza:
 * 1. Imposibilidad de doble reserva (ID compuesto {clase_id}_{usuario_id}).
 * 2. Validación de cupos disponibles > 0.
 * 3. Actualización de inscritos_ids y cupos_disponibles en la clase.
 */
export async function reservarClase({ claseId, usuarioId, nombreUsuario }) {
  const inscripcionId = `${claseId}_${usuarioId}`;
  const inscripcionRef = doc(db, "inscripciones", inscripcionId);
  const claseRef = doc(db, "clases", claseId);
  const usuarioRef = doc(db, "usuarios", usuarioId);

  await runTransaction(db, async (transaction) => {
    // 1. Validar usuario y sus clases pactadas
    const usuarioDoc = await transaction.get(usuarioRef);
    let clasesPactadasActuales = 0;
    if (usuarioDoc.exists()) {
      clasesPactadasActuales = usuarioDoc.data().clases_pactadas ?? 0;
    }

    if (clasesPactadasActuales <= 0) {
      throw new Error("No tienes clases pactadas disponibles (saldo 0). Contacta al administrador para habilitar más clases.");
    }

    // 2. Validar si ya existe la inscripción
    const inscripcionDoc = await transaction.get(inscripcionRef);
    if (inscripcionDoc.exists() && inscripcionDoc.data().estado === "confirmada") {
      throw new Error("Ya te encuentras inscrito en esta clase.");
    }

    // 3. Obtener estado actual de la clase
    const claseDoc = await transaction.get(claseRef);
    if (!claseDoc.exists()) {
      throw new Error("La clase especificada no existe.");
    }

    const claseData = claseDoc.data();

    const ahora = new Date();
    const fechaInicioObj = claseData.fecha_inicio?.toDate ? claseData.fecha_inicio.toDate() : (claseData.fecha_inicio ? new Date(claseData.fecha_inicio) : null);
    const fechaFinObj = claseData.fecha_fin?.toDate ? claseData.fecha_fin.toDate() : (claseData.fecha_fin ? new Date(claseData.fecha_fin) : null);

    const haCaducado = (fechaFinObj && fechaFinObj < ahora) || (fechaInicioObj && fechaInicioObj < ahora);

    if (claseData.estado !== "activa" || haCaducado) {
      if (haCaducado && claseData.estado === "activa") {
        transaction.update(claseRef, { estado: "inactiva" });
      }
      throw new Error("Esta clase ha caducado o se encuentra inactiva. No se pueden realizar reservas.");
    }

    if (claseData.cupos_disponibles <= 0) {
      throw new Error("No hay cupos disponibles para esta clase.");
    }

    const inscritosActuales = claseData.inscritos_ids || [];
    if (inscritosActuales.includes(usuarioId)) {
      throw new Error("Ya estás dentro de los alumnos inscritos en esta clase.");
    }

    // 4. Actualizar la clase (decremento de cupo y adición de UID)
    const nuevosInscritos = [...inscritosActuales, usuarioId];
    const nuevosCupos = claseData.cupos_disponibles - 1;

    transaction.update(claseRef, {
      cupos_disponibles: nuevosCupos,
      inscritos_ids: nuevosInscritos
    });

    // 5. Descontar 1 clase pactada del perfil de usuario
    transaction.set(usuarioRef, { clases_pactadas: clasesPactadasActuales - 1 }, { merge: true });

    // 6. Crear el documento de inscripción
    transaction.set(inscripcionRef, {
      clase_id: claseId,
      usuario_id: usuarioId,
      nombre_usuario: nombreUsuario || "Usuario",
      fecha_reserva: serverTimestamp(),
      fecha_clase: claseData.fecha_inicio,
      tipo_servicio: claseData.tipo_servicio || "Pilates Reformer",
      instructor: claseData.instructor || "Instructor",
      estado: "confirmada"
    });
  });

  return { success: true, message: "Reserva realizada con éxito." };
}

/**
 * Anula una reserva realizada por el cliente respetando la regla de al menos 15 horas de anticipación.
 */
export async function cancelarReservaCliente({ inscripcionId, claseId, usuarioId }) {
  const inscripcionRef = doc(db, "inscripciones", inscripcionId);
  const usuarioRef = doc(db, "usuarios", usuarioId);

  await runTransaction(db, async (transaction) => {
    // 1. LECTURAS (TODAS LAS LECTURAS DEBEN EJECUTARSE ANTES DE CUALQUIER ESCRITURA)
    const inscripcionDoc = await transaction.get(inscripcionRef);
    if (!inscripcionDoc.exists()) {
      throw new Error("No se encontró el registro de la reserva.");
    }

    const inscripcionData = inscripcionDoc.data();
    if (inscripcionData.estado !== "confirmada") {
      throw new Error("La reserva ya ha sido cancelada previamente.");
    }

    const esTerapia =
      inscripcionId.startsWith("terapia_") ||
      (inscripcionData.tipo_servicio || "").toLowerCase().includes("terapia");
    const coleccionServicio = esTerapia ? "terapias" : "clases";
    const targetId = claseId || inscripcionData.clase_id;
    const servicioRef = doc(db, coleccionServicio, targetId);

    const servicioDoc = await transaction.get(servicioRef);
    if (!servicioDoc.exists()) {
      throw new Error("El servicio asociado a esta reserva ya no está disponible.");
    }

    const usuarioDoc = await transaction.get(usuarioRef);

    // 2. VALIDACIÓN DE 15 HORAS DE ANTICIPACIÓN
    const servicioData = servicioDoc.data();
    const fechaInicioVal = servicioData.fecha_inicio || inscripcionData.fecha_clase;
    const fechaServicioObj = fechaInicioVal?.toDate ? fechaInicioVal.toDate() : new Date(fechaInicioVal);
    const ahora = new Date();

    const diferenciaHoras = (fechaServicioObj.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras < 15) {
      throw new Error("Solo puedes anular una reserva con al menos 15 horas de anticipación al inicio de la sesión.");
    }

    // 3. ESCRITURAS (TODAS LAS ESCRITURAS SE REALIZAN DESPUÉS DE LAS LECTURAS)
    // A. Marcar inscripción como cancelada
    transaction.update(inscripcionRef, {
      estado: "cancelada"
    });

    // B. Liberar cupo en el servicio (clase o terapia)
    const inscritosActuales = servicioData.inscritos_ids || [];
    const nuevosInscritos = inscritosActuales.filter((uid) => uid !== usuarioId);
    const nuevosCupos = (servicioData.cupos_disponibles || 0) + 1;

    transaction.update(servicioRef, {
      cupos_disponibles: nuevosCupos,
      inscritos_ids: nuevosInscritos
    });

    // C. Reintegrar la reserva al conteo personal del usuario (clases_pactadas o sesion_terapia)
    if (esTerapia) {
      const terapiasActuales = usuarioDoc.exists() ? (usuarioDoc.data().sesion_terapia ?? 0) : 0;
      transaction.set(usuarioRef, { sesion_terapia: terapiasActuales + 1 }, { merge: true });
    } else {
      const clasesActuales = usuarioDoc.exists() ? (usuarioDoc.data().clases_pactadas ?? 0) : 0;
      transaction.set(usuarioRef, { clases_pactadas: clasesActuales + 1 }, { merge: true });
    }
  });

  return { success: true, message: "Reserva anulada con éxito y restituida a tu saldo." };
}

/**
 * Realiza la reserva de una sesión de terapia mediante una transacción atómica en Firestore.
 */
export async function reservarTerapia({ terapiaId, usuarioId, nombreUsuario }) {
  const inscripcionId = `terapia_${terapiaId}_${usuarioId}`;
  const inscripcionRef = doc(db, "inscripciones", inscripcionId);
  const terapiaRef = doc(db, "terapias", terapiaId);
  const usuarioRef = doc(db, "usuarios", usuarioId);

  await runTransaction(db, async (transaction) => {
    // 1. Validar usuario y sus sesiones de terapia
    const usuarioDoc = await transaction.get(usuarioRef);
    let sesionesTerapiaActuales = 0;
    if (usuarioDoc.exists()) {
      sesionesTerapiaActuales = usuarioDoc.data().sesion_terapia ?? 0;
    }

    if (sesionesTerapiaActuales <= 0) {
      throw new Error("No tienes sesiones de terapia disponibles. Contacta al administrador para adquirir horas de terapia.");
    }

    // 2. Validar si ya existe la inscripción
    const inscripcionDoc = await transaction.get(inscripcionRef);
    if (inscripcionDoc.exists() && inscripcionDoc.data().estado === "confirmada") {
      throw new Error("Ya te encuentras inscrito en esta sesión de terapia.");
    }

    // 3. Obtener estado de la terapia
    const terapiaDoc = await transaction.get(terapiaRef);
    if (!terapiaDoc.exists()) {
      throw new Error("La sesión de terapia especificada ya no está disponible.");
    }

    const terapiaData = terapiaDoc.data();

    if (terapiaData.estado === "inactiva") {
      throw new Error("Esta sesión de terapia se encuentra inactiva.");
    }

    if ((terapiaData.cupos_disponibles ?? 1) <= 0) {
      throw new Error("No hay cupos disponibles para esta sesión de terapia.");
    }

    const inscritosActuales = terapiaData.inscritos_ids || [];
    if (inscritosActuales.includes(usuarioId)) {
      throw new Error("Ya estás dentro de los alumnos inscritos para esta sesión.");
    }

    // 4. Actualizar la terapia
    const nuevosInscritos = [...inscritosActuales, usuarioId];
    const nuevosCupos = Math.max(0, (terapiaData.cupos_disponibles ?? 1) - 1);

    transaction.update(terapiaRef, {
      cupos_disponibles: nuevosCupos,
      inscritos_ids: nuevosInscritos
    });

    // 5. Descontar 1 sesión de terapia del usuario
    transaction.set(usuarioRef, { sesion_terapia: sesionesTerapiaActuales - 1 }, { merge: true });

    // 6. Crear inscripción
    transaction.set(inscripcionRef, {
      clase_id: terapiaId,
      usuario_id: usuarioId,
      nombre_usuario: nombreUsuario || "Usuario",
      fecha_reserva: serverTimestamp(),
      fecha_clase: terapiaData.fecha_inicio || serverTimestamp(),
      tipo_servicio: terapiaData.titulo || "Terapia Integrativa",
      instructor: terapiaData.terapeuta || "Especialista MTC",
      estado: "confirmada"
    });
  });

  return { success: true, message: "Sesión de terapia reservada con éxito." };
}

/**
 * Escucha las reservas confirmed del usuario actual ("Mis Próximas Clases").
 */
export function suscribirMisInscripciones(usuarioId, callback) {
  if (!usuarioId) {
    callback([]);
    return () => {};
  }

  const inscripcionesRef = collection(db, "inscripciones");
  const q = query(
    inscripcionesRef,
    where("usuario_id", "==", usuarioId),
    where("estado", "==", "confirmada"),
    orderBy("fecha_clase", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reservas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(reservas);
    },
    (error) => {
      console.error("Error al escuchar inscripciones del usuario:", error);
      callback([]);
    }
  );
}

