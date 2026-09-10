import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

/**
 * Obtiene o se suscribe a las clases filtradas por rango de fechas (para el calendario).
 */
export function suscribirClasesPorFecha(fechaInicio, fechaFin, callback) {
  const clasesRef = collection(db, "clases");
  const q = query(
    clasesRef,
    where("fecha_inicio", ">=", fechaInicio),
    where("fecha_inicio", "<=", fechaFin),
    orderBy("fecha_inicio", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const listaClases = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(listaClases);
    },
    (error) => {
      console.error("Error al escuchar clases por fecha:", error);
      callback([]);
    }
  );
}

/**
 * Escucha todas las clases registradas en Firestore (para el panel de Administración CRUD).
 */
export function suscribirTodasLasClasesAdmin(callback) {
  const clasesRef = collection(db, "clases");
  const q = query(clasesRef, orderBy("fecha_inicio", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const listaClases = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      callback(listaClases);
    },
    (error) => {
      console.error("Error al escuchar todas las clases admin:", error);
      callback([]);
    }
  );
}

/**
 * Escucha las clases activas en Firestore ordenadas por fecha de inicio (para la vista pública de horarios).
 */
export function suscribirClasesActivas(callback) {
  const clasesRef = collection(db, "clases");
  const q = query(clasesRef, orderBy("fecha_inicio", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const listaClases = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      callback(listaClases);
    },
    (error) => {
      console.error("Error al escuchar clases activas:", error);
      callback([]);
    }
  );
}

function toFirestoreTimestamp(val) {
  if (!val) return Timestamp.now();
  if (val instanceof Timestamp) return val;
  if (val.toDate && typeof val.toDate === 'function') return val;
  const d = val.seconds ? new Date(val.seconds * 1000) : new Date(val);
  return Timestamp.fromDate(isNaN(d.getTime()) ? new Date() : d);
}

/**
 * Crea una nueva clase en Firestore (Admin).
 */
export async function crearClaseAdmin(datosClase) {
  const clasesRef = collection(db, "clases");
  const docRef = await addDoc(clasesRef, {
    tipo_servicio: datosClase.tipo_servicio,
    instructor: datosClase.instructor,
    cupo_maximo: Number(datosClase.cupo_maximo),
    cupos_disponibles: Number(datosClase.cupos_disponibles),
    estado: datosClase.estado || "activa",
    fecha_inicio: toFirestoreTimestamp(datosClase.fecha_inicio),
    fecha_fin: toFirestoreTimestamp(datosClase.fecha_fin),
    visible_desde: toFirestoreTimestamp(datosClase.visible_desde),
    inscritos_ids: Array.isArray(datosClase.inscritos_ids) ? datosClase.inscritos_ids : []
  });
  return docRef.id;
}

/**
 * Actualiza los 9 campos de una clase existente en Firestore (Admin).
 */
export async function actualizarClaseAdmin(claseId, datosClase) {
  const claseRef = doc(db, "clases", claseId);
  await updateDoc(claseRef, {
    tipo_servicio: datosClase.tipo_servicio,
    instructor: datosClase.instructor,
    cupo_maximo: Number(datosClase.cupo_maximo),
    cupos_disponibles: Number(datosClase.cupos_disponibles),
    estado: datosClase.estado,
    fecha_inicio: toFirestoreTimestamp(datosClase.fecha_inicio),
    fecha_fin: toFirestoreTimestamp(datosClase.fecha_fin),
    visible_desde: toFirestoreTimestamp(datosClase.visible_desde),
    inscritos_ids: Array.isArray(datosClase.inscritos_ids) ? datosClase.inscritos_ids : []
  });
}

/**
 * Elimina una clase de Firestore (Admin).
 */
export async function eliminarClaseAdmin(claseId) {
  const claseRef = doc(db, "clases", claseId);
  await deleteDoc(claseRef);
}

/**
 * Obtiene las clases disponibles de manera puntual.
 */
export async function obtenerClases() {
  const clasesRef = collection(db, "clases");
  const q = query(clasesRef, orderBy("fecha_inicio", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

