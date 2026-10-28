import * as XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datos de ejemplo para la plantilla con los 3 instructores oficiales
const datosClasesEjemplo = [
  {
    "Tipo de Servicio": "Pilates Reformer",
    "Instructor": "Francisco Peña",
    "Fecha Inicio": "2026-11-02 09:00",
    "Fecha Fin": "2026-11-02 10:00",
    "Cupo Máximo": 5,
    "Cupos Disponibles": 5,
    "Estado": "activa",
    "Visible Desde": "2026-11-01 08:00",
    "Inscritos IDs": ""
  },
  {
    "Tipo de Servicio": "Pilates Reformer",
    "Instructor": "Carolina Escobillana",
    "Fecha Inicio": "2026-11-02 10:30",
    "Fecha Fin": "2026-11-02 11:30",
    "Cupo Máximo": 5,
    "Cupos Disponibles": 5,
    "Estado": "activa",
    "Visible Desde": "2026-11-01 08:00",
    "Inscritos IDs": ""
  },
  {
    "Tipo de Servicio": "Pilates Mat",
    "Instructor": "Marcela Rendic",
    "Fecha Inicio": "2026-11-02 17:00",
    "Fecha Fin": "2026-11-02 18:00",
    "Cupo Máximo": 8,
    "Cupos Disponibles": 8,
    "Estado": "activa",
    "Visible Desde": "2026-11-01 08:00",
    "Inscritos IDs": ""
  }
];

// Hoja de instrucciones claras y formatos tolerados
const instrucciones = [
  { "Campo": "Tipo de Servicio", "Requerido": "SÍ", "Descripción": "Ej: Pilates Reformer, Pilates Mat, Terapia Integral" },
  { "Campo": "Instructor", "Requerido": "SÍ", "Descripción": "Opciones válidas: Francisco Peña, Carolina Escobillana, Marcela Rendic" },
  { "Campo": "Fecha Inicio", "Requerido": "SÍ", "Descripción": "Formato recomendado: YYYY-MM-DD HH:mm o DD/MM/YYYY HH:mm (ej: 2026-11-02 09:00 o 02/11/2026 09:00)" },
  { "Campo": "Fecha Fin", "Requerido": "SÍ", "Descripción": "Formato recomendado: YYYY-MM-DD HH:mm o DD/MM/YYYY HH:mm (ej: 2026-11-02 10:00 o 02/11/2026 10:00)" },
  { "Campo": "Cupo Máximo", "Requerido": "SÍ", "Descripción": "Número entero mayor a 0 (ej: 5)" },
  { "Campo": "Cupos Disponibles", "Requerido": "NO", "Descripción": "Opcional. Si se deja en blanco, será igual al Cupo Máximo" },
  { "Campo": "Estado", "Requerido": "NO", "Descripción": "activa, inactiva, cancelada, completada (Por defecto: activa)" },
  { "Campo": "Visible Desde", "Requerido": "NO", "Descripción": "Opcional. Por defecto será igual a la Fecha de Inicio" },
  { "Campo": "Inscritos IDs", "Requerido": "NO", "Descripción": "Opcional. UIDs de alumnos inscritos separados por coma (ej: u1, u2). Dejar vacío si es clase nueva." }
];

const wb = XLSX.utils.book_new();

// Hoja 1: Clases
const wsClases = XLSX.utils.json_to_sheet(datosClasesEjemplo);
wsClases["!cols"] = [
  { wch: 22 }, // Tipo de Servicio
  { wch: 22 }, // Instructor
  { wch: 20 }, // Fecha Inicio
  { wch: 20 }, // Fecha Fin
  { wch: 14 }, // Cupo Máximo
  { wch: 18 }, // Cupos Disponibles
  { wch: 14 }, // Estado
  { wch: 20 }, // Visible Desde
  { wch: 22 }, // Inscritos IDs
];

// Marcar explícitamente celdas como texto para evitar conversiones automáticas destructivas de Excel
const range = XLSX.utils.decode_range(wsClases["!ref"]);
for (let R = range.s.r; R <= range.e.r; ++R) {
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
    if (wsClases[cellAddress]) {
      // Formato texto @ para columnas de fecha y strings
      if (C !== 4 && C !== 5) {
        wsClases[cellAddress].z = "@";
      }
    }
  }
}
XLSX.utils.book_append_sheet(wb, wsClases, "Clases");

// Hoja 2: Instrucciones
const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
wsInstrucciones["!cols"] = [
  { wch: 20 },
  { wch: 12 },
  { wch: 75 }
];
XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

const rutaDestino = path.resolve(__dirname, "public", "plantilla_clases.xlsx");
XLSX.writeFile(wb, rutaDestino);
console.log("Plantilla generada con éxito en:", rutaDestino);
