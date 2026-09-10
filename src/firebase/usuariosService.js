import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  where
} from "firebase/firestore";
import { db } from "./config";

/**
 * Escucha la lista completa de usuarios registrados en Firestore en tiempo real.
 */
export function suscribirTodosLosUsuariosAdmin(callback) {
  const usuariosRef = collection(db, "usuarios");
  const q = query(usuariosRef, orderBy("fecha_creacion", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        uid: docItem.id,
        ...docItem.data()
      }));
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar usuarios en admin:", error);
      // Fallback si la colección no tiene índice por fecha_creacion
      const qFallback = query(usuariosRef);
      onSnapshot(qFallback, (snapshot) => {
        const listaFallback = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          uid: docItem.id,
          ...docItem.data()
        }));
        callback(listaFallback);
      });
    }
  );
}

/**
 * Crea un nuevo usuario manualmente desde el panel de administración.
 */
export async function crearUsuarioAdmin(datosUsuario) {
  const usuariosRef = collection(db, "usuarios");
  const nuevoDoc = doc(usuariosRef);

  const perfil = {
    nombre: datosUsuario.nombre.trim(),
    email: datosUsuario.email.toLowerCase().trim(),
    telefono: datosUsuario.telefono ? datosUsuario.telefono.trim() : "",
    rol: datosUsuario.rol || "cliente",
    estado_cuenta: datosUsuario.estado_cuenta || "activo",
    clases_pactadas: Number(datosUsuario.clases_pactadas ?? 0),
    fecha_creacion: serverTimestamp()
  };

  await setDoc(nuevoDoc, perfil);
  return nuevoDoc.id;
}

/**
 * Actualiza los datos de un usuario existente en Firestore.
 */
export async function actualizarUsuarioAdmin(usuarioId, datosUsuario) {
  const userRef = doc(db, "usuarios", usuarioId);
  await updateDoc(userRef, {
    nombre: datosUsuario.nombre.trim(),
    email: datosUsuario.email.toLowerCase().trim(),
    telefono: datosUsuario.telefono ? datosUsuario.telefono.trim() : "",
    rol: datosUsuario.rol,
    estado_cuenta: datosUsuario.estado_cuenta,
    clases_pactadas: Number(datosUsuario.clases_pactadas ?? 0)
  });
}

/**
 * Incrementa o decrementa directamente la cantidad de clases pactadas de un usuario.
 */
export async function modificarClasesPactadasAdmin(usuarioId, delta) {
  const userRef = doc(db, "usuarios", usuarioId);
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    let actuales = 0;
    if (userDoc.exists()) {
      actuales = userDoc.data().clases_pactadas ?? 0;
    }
    const nuevoTotal = Math.max(0, actuales + delta);
    transaction.set(userRef, { clases_pactadas: nuevoTotal }, { merge: true });
  });
}

/**
 * Elimina un usuario de Firestore en cascada de forma infalible:
 * 1. Busca en la colección 'clases' todas las clases donde 'inscritos_ids' contiene el usuarioId,
 *    remueve el ID y devuelve el cupo disponible (+1).
 * 2. Busca y elimina todos los documentos en 'inscripciones' vinculados al usuario_id.
 * 3. Elimina el documento del usuario en 'usuarios'.
 */
export async function eliminarUsuarioAdmin(usuarioId) {
  if (!usuarioId) return;

  try {
    // 1. Buscar de forma directa en TODAS las clases donde figure el usuarioId en inscritos_ids
    const clasesRef = collection(db, "clases");
    const qClases = query(clasesRef, where("inscritos_ids", "array-contains", usuarioId));
    const snapshotClases = await getDocs(qClases);

    const promesasClases = snapshotClases.docs.map((docClase) => {
      const claseData = docClase.data();
      const inscritosActuales = claseData.inscritos_ids || [];
      const nuevosInscritos = inscritosActuales.filter((id) => id !== usuarioId);
      
      const cupoMaximo = claseData.cupo_maximo ?? 5;
      const cuposActuales = claseData.cupos_disponibles ?? 0;
      const nuevosCupos = Math.min(cupoMaximo, cuposActuales + 1);

      return updateDoc(doc(db, "clases", docClase.id), {
        inscritos_ids: nuevosInscritos,
        cupos_disponibles: nuevosCupos
      });
    });
    await Promise.all(promesasClases);

    // 2. Buscar y eliminar todas las inscripciones del usuario en la colección 'inscripciones'
    const inscripcionesRef = collection(db, "inscripciones");
    const qInscripciones = query(inscripcionesRef, where("usuario_id", "==", usuarioId));
    const snapshotInscripciones = await getDocs(qInscripciones);

    const promesasInscripciones = snapshotInscripciones.docs.map((docInscripcion) => 
      deleteDoc(doc(db, "inscripciones", docInscripcion.id))
    );
    await Promise.all(promesasInscripciones);

    // 3. Borrar el documento del usuario en la colección 'usuarios'
    const userRef = doc(db, "usuarios", usuarioId);
    await deleteDoc(userRef);

    return { success: true };
  } catch (error) {
    console.error("Error al ejecutar eliminación completa del usuario:", error);
    throw error;
  }
}

/**
 * Escucha todas las inscripciones activas para relacionar reservas con usuarios.
 */
export function suscribirTodasLasInscripcionesAdmin(callback) {
  const inscripcionesRef = collection(db, "inscripciones");
  return onSnapshot(
    inscripcionesRef,
    (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar inscripciones:", error);
      callback([]);
    }
  );
}

/**
 * Cancela la reserva de un usuario en una clase (libera cupo en la clase y cambia estado de inscripción).
 */
export async function cancelarInscripcionAdmin(inscripcionId, claseId, usuarioId) {
  const inscripcionRef = doc(db, "inscripciones", inscripcionId);
  const claseRef = doc(db, "clases", claseId);

  await runTransaction(db, async (transaction) => {
    const inscripcionDoc = await transaction.get(inscripcionRef);
    if (!inscripcionDoc.exists()) {
      throw new Error("No existe el registro de inscripción.");
    }

    const claseDoc = await transaction.get(claseRef);
    if (claseDoc.exists()) {
      const claseData = claseDoc.data();
      const inscritosActuales = claseData.inscritos_ids || [];
      const nuevosInscritos = inscritosActuales.filter((id) => id !== usuarioId);
      const nuevosCupos = (claseData.cupos_disponibles || 0) + 1;

      transaction.update(claseRef, {
        cupos_disponibles: nuevosCupos,
        inscritos_ids: nuevosInscritos
      });
    }

    transaction.update(inscripcionRef, {
      estado: "cancelada"
    });
  });

  return { success: true };
}
