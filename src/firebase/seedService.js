import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

/**
 * Siembras iniciales de plantillas de horarios y clases en Firestore
 * si las colecciones aún no cuentan con datos.
 */
export async function sembrarDatosInicialesSiEsNecesario() {
  try {
    const clasesRef = collection(db, "clases");
    const snapshotClases = await getDocs(clasesRef);

    if (!snapshotClases.empty) {
      console.log("Firestore ya contiene clases registradas.");
      return;
    }

    console.log("Sembrando datos iniciales en Firestore...");

    // 1. Plantillas de Horarios
    const plantillas = [
      { id: "lunes_0800", dia_semana: 1, hora_inicio: "08:00", hora_fin: "09:00", tipo_servicio: "Pilates Reformer", cupo_maximo: 5, activo: true },
      { id: "lunes_1000", dia_semana: 1, hora_inicio: "10:00", hora_fin: "11:00", tipo_servicio: "Pilates Reformer", cupo_maximo: 5, activo: true },
      { id: "martes_0900", dia_semana: 2, hora_inicio: "09:00", hora_fin: "10:00", tipo_servicio: "Pilates Reformer", cupo_maximo: 5, activo: true },
      { id: "martes_1700", dia_semana: 2, hora_inicio: "17:00", hora_fin: "18:00", tipo_servicio: "Pilates Reformer Flow", cupo_maximo: 5, activo: true },
      { id: "miercoles_0800", dia_semana: 3, hora_inicio: "08:00", hora_fin: "09:00", tipo_servicio: "Pilates Reformer", cupo_maximo: 5, activo: true },
      { id: "jueves_1000", dia_semana: 4, hora_inicio: "10:00", hora_fin: "11:00", tipo_servicio: "Pilates Reformer Core", cupo_maximo: 5, activo: true },
      { id: "viernes_0900", dia_semana: 5, hora_inicio: "09:00", hora_fin: "10:00", tipo_servicio: "Pilates Reformer", cupo_maximo: 5, activo: true },
      { id: "sabado_1000", dia_semana: 6, hora_inicio: "06:00", hora_fin: "11:00", tipo_servicio: "Pilates Reformer Weekend", cupo_maximo: 5, activo: true }
    ];

    const promesasPlantillas = plantillas.map((p) => {
      const { id, ...data } = p;
      return setDoc(doc(db, "plantillas_horarios", id), data);
    });
    await Promise.all(promesasPlantillas);

    // 2. Generación de Clases para los próximos 14 días
    const instructores = ["Camila Soto", "Valeria Rojas", "Ignacia Silva"];
    const hoy = new Date();
    const promesasClases = [];

    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      const dd = String(fecha.getDate()).padStart(2, "0");
      const fechaStr = `${yyyy}-${mm}-${dd}`;

      // Crear 2 o 3 bloques diarios
      const bloques = [
        { hora: "08:00", fin: "09:00", servicio: "Pilates Reformer", inst: instructores[0] },
        { hora: "10:00", fin: "11:00", servicio: "Pilates Reformer Flow", inst: instructores[1] },
        { hora: "17:00", fin: "18:00", servicio: "Pilates Reformer Core", inst: instructores[2] }
      ];

      for (const b of bloques) {
        const [hIni, mIni] = b.hora.split(":").map(Number);
        const [hFin, mFin] = b.fin.split(":").map(Number);

        const fechaIniObj = new Date(fecha);
        fechaIniObj.setHours(hIni, mIni, 0, 0);

        const fechaFinObj = new Date(fecha);
        fechaFinObj.setHours(hFin, mFin, 0, 0);

        const claseId = `${fechaStr}_${b.hora.replace(":", "")}_reformer`;

        promesasClases.push(
          setDoc(doc(db, "clases", claseId), {
            fecha_inicio: Timestamp.fromDate(fechaIniObj),
            fecha_fin: Timestamp.fromDate(fechaFinObj),
            tipo_servicio: b.servicio,
            instructor: b.inst,
            cupo_maximo: 5,
            cupos_disponibles: 5,
            inscritos_ids: [],
            estado: "activa",
            visible_desde: Timestamp.now()
          })
        );
      }
    }
    await Promise.all(promesasClases);

    console.log("¡Sembrado inicial completado exitosamente!");
  } catch (error) {
    console.error("Error en sembrado inicial:", error);
  }
}
