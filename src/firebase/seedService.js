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

    // 3. Generación de Terapias Integrativas para los próximos 14 días si no existen
    const terapiasRef = collection(db, "terapias");
    const snapshotTerapias = await getDocs(terapiasRef);

    if (snapshotTerapias.empty) {
      console.log("Sembrando terapias iniciales en Firestore...");
      const terapiasPlantillas = [
        {
          titulo: "Acupuntura Bioenergética",
          badge: "Medicina Tradicional China",
          duracion: "50 min",
          descripcion: "Inserción indolora de agujas estériles en puntos de meridianos para equilibrio de Qi, alivio de dolor cervical/lumbar y manejo de ansiedad.",
          precio: "$25.000",
          terapeuta: "Camila Soto (Especialista MTC)",
          horaInicio: "11:00",
          horaFin: "12:00",
          cupo_maximo: 1,
          cupos_disponibles: 1
        },
        {
          titulo: "Ventosaterapia (Cupping)",
          badge: "Descompresión Miofascial",
          duracion: "40 min",
          descripcion: "Succión suave con ventosas de cristal para descompresión fascial, oxigenación profunda y liberación instantánea de contracturas musculares.",
          precio: "$22.000",
          terapeuta: "Especialista Holístico",
          horaInicio: "15:00",
          horaFin: "16:00",
          cupo_maximo: 1,
          cupos_disponibles: 1
        },
        {
          titulo: "Electromoxibustión & Qi",
          badge: "Termoterapia Herbal",
          duracion: "45 min",
          descripcion: "Estímulo térmico controlado con Artemisa y microcorrientes para fortalecer el sistema inmunológico y tonificar articulaciones.",
          precio: "$28.000",
          terapeuta: "Camila Soto (Especialista MTC)",
          horaInicio: "16:30",
          horaFin: "17:30",
          cupo_maximo: 1,
          cupos_disponibles: 1
        }
      ];

      const promesasTerapias = [];
      const hoy = new Date();
      for (let i = 0; i < 14; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);

        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        const fechaStr = `${yyyy}-${mm}-${dd}`;

        for (const t of terapiasPlantillas) {
          const [hIni, mIni] = t.horaInicio.split(":").map(Number);
          const [hFin, mFin] = t.horaFin.split(":").map(Number);

          const fechaIniObj = new Date(fecha);
          fechaIniObj.setHours(hIni, mIni, 0, 0);

          const fechaFinObj = new Date(fecha);
          fechaFinObj.setHours(hFin, mFin, 0, 0);

          const terapiaId = `${fechaStr}_${t.horaInicio.replace(":", "")}_${t.titulo.toLowerCase().replace(/\s+/g, "_")}`;

          promesasTerapias.push(
            setDoc(doc(db, "terapias", terapiaId), {
              titulo: t.titulo,
              badge: t.badge,
              duracion: t.duracion,
              descripcion: t.descripcion,
              precio: t.precio,
              terapeuta: t.terapeuta,
              cupo_maximo: t.cupo_maximo,
              cupos_disponibles: t.cupos_disponibles,
              fecha_inicio: Timestamp.fromDate(fechaIniObj),
              fecha_fin: Timestamp.fromDate(fechaFinObj),
              inscritos_ids: [],
              estado: "activa",
              visible_desde: Timestamp.now(),
              fecha_creacion: Timestamp.now()
            })
          );
        }
      }
      await Promise.all(promesasTerapias);
    }

    console.log("¡Sembrado inicial completado exitosamente!");
  } catch (error) {
    console.error("Error en sembrado inicial:", error);
  }
}
