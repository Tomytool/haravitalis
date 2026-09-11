import {
  collection,
  query,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where
} from "firebase/firestore";
import { db } from "./config";

/**
 * Convierte un valor a Firestore Timestamp.
 */
function toFirestoreTimestamp(val) {
  if (!val) return Timestamp.now();
  if (val instanceof Timestamp) return val;
  if (val.toDate && typeof val.toDate === "function") return val;
  const d = val.seconds ? new Date(val.seconds * 1000) : new Date(val);
  return Timestamp.fromDate(isNaN(d.getTime()) ? new Date() : d);
}

/**
 * Escucha todas las terapias registradas en Firestore (para el panel de Administración CRUD).
 */
export function suscribirTodasLasTerapiasAdmin(callback) {
  const terapiasRef = collection(db, "terapias");
  const q = query(terapiasRef, orderBy("fecha_creacion", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar terapias (ordenadas):", error);
      // Fallback sin orderBy si no se ha creado un índice por fecha_creacion
      const qFallback = query(terapiasRef);
      onSnapshot(qFallback, (snapshot) => {
        const listaFallback = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));
        callback(listaFallback);
      });
    }
  );
}

/**
 * Escucha las terapias activas y visibles en Firestore (para la vista pública de usuarios).
 * Filtra por estado == "activa" y visible_desde <= fechaActual.
 */
export function suscribirTerapiasActivas(callback) {
  const terapiasRef = collection(db, "terapias");

  return onSnapshot(
    terapiasRef,
    (snapshot) => {
      const lista = snapshot.docs.reduce((acc, docItem) => {
        const data = docItem.data();
        if (data.estado === "inactiva") return acc;
        acc.push({ id: docItem.id, ...data });
        return acc;
      }, []);
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar terapias activas de Firestore:", error);
      callback([]);
    }
  );
}


/**
 * Crea una nueva terapia integrativa en Firestore (Admin).
 */
export async function crearTerapiaAdmin(datosTerapia) {
  const terapiasRef = collection(db, "terapias");
  const docRef = await addDoc(terapiasRef, {
    titulo: datosTerapia.titulo?.trim() || "Terapia Integrativa",
    badge: datosTerapia.badge?.trim() || "Terapia Especializada",
    duracion: datosTerapia.duracion?.trim() || "50 min",
    descripcion: datosTerapia.descripcion?.trim() || "",
    bullets: Array.isArray(datosTerapia.bullets) ? datosTerapia.bullets : [],
    precio: datosTerapia.precio?.trim() || "$25.000",
    terapeuta: datosTerapia.terapeuta?.trim() || datosTerapia.instructor?.trim() || "Especialista MTC",
    cupo_maximo: Number(datosTerapia.cupo_maximo ?? 1),
    cupos_disponibles: Number(datosTerapia.cupos_disponibles ?? 1),
    estado: datosTerapia.estado || "activa",
    fecha_inicio: toFirestoreTimestamp(datosTerapia.fecha_inicio),
    fecha_fin: toFirestoreTimestamp(datosTerapia.fecha_fin),
    visible_desde: toFirestoreTimestamp(datosTerapia.visible_desde),
    fecha_creacion: Timestamp.now(),
    inscritos_ids: Array.isArray(datosTerapia.inscritos_ids) ? datosTerapia.inscritos_ids : [],
  });
  return docRef.id;
}

/**
 * Actualiza los campos de una terapia integrativa existente en Firestore (Admin).
 */
export async function actualizarTerapiaAdmin(terapiaId, datosTerapia) {
  const terapiaRef = doc(db, "terapias", terapiaId);
  await updateDoc(terapiaRef, {
    titulo: datosTerapia.titulo?.trim() || "Terapia Integrativa",
    badge: datosTerapia.badge?.trim() || "Terapia Especializada",
    duracion: datosTerapia.duracion?.trim() || "50 min",
    descripcion: datosTerapia.descripcion?.trim() || "",
    bullets: Array.isArray(datosTerapia.bullets) ? datosTerapia.bullets : [],
    precio: datosTerapia.precio?.trim() || "$25.000",
    terapeuta: datosTerapia.terapeuta?.trim() || datosTerapia.instructor?.trim() || "Especialista MTC",
    cupo_maximo: Number(datosTerapia.cupo_maximo ?? 1),
    cupos_disponibles: Number(datosTerapia.cupos_disponibles ?? 1),
    estado: datosTerapia.estado || "activa",
    fecha_inicio: toFirestoreTimestamp(datosTerapia.fecha_inicio),
    fecha_fin: toFirestoreTimestamp(datosTerapia.fecha_fin),
    visible_desde: toFirestoreTimestamp(datosTerapia.visible_desde),
    inscritos_ids: Array.isArray(datosTerapia.inscritos_ids) ? datosTerapia.inscritos_ids : [],
  });
}

/**
 * Elimina una terapia integrativa de Firestore (Admin).
 */
export async function eliminarTerapiaAdmin(terapiaId) {
  const terapiaRef = doc(db, "terapias", terapiaId);
  await deleteDoc(terapiaRef);
}

