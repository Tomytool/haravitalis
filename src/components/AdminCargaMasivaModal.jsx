import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { crearClasesMasivasAdmin } from "../firebase/clasesService";

/**
 * Normaliza las cabeceras del Excel para tolerar minúsculas, espacios, tildes o guiones bajos.
 */
function normalizarClave(clave) {
  if (!clave) return "";
  return clave
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Busca el valor de una columna entre varios alias posibles (tolerando diferencias de mayúsculas o nombres).
 */
function buscarValorColumna(mapaFila, listaAlias, defVal = "") {
  for (const alias of listaAlias) {
    const clave = normalizarClave(alias);
    if (mapaFila[clave] !== undefined && mapaFila[clave] !== null && mapaFila[clave] !== "") {
      return mapaFila[clave];
    }
  }
  return defVal;
}

/**
 * Convierte cualquier valor de fecha proveniente de Excel (Date, serial numérico o string en múltiples formatos) a un objeto Date local válido.
 */
function parsearFechaExcel(val) {
  if (!val && val !== 0) return null;

  // 1. Si ya es una instancia de Date válida (producida por SheetJS cellDates: true)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // SheetJS interpreta fechas seriales de Excel en UTC. Para preservar la fecha y hora exacta que el usuario ve:
    return new Date(
      val.getUTCFullYear(),
      val.getUTCMonth(),
      val.getUTCDate(),
      val.getUTCHours(),
      val.getUTCMinutes(),
      val.getUTCSeconds()
    );
  }

  // 2. Si es número (Serial date de Excel, ej: 45600.375)
  if (typeof val === "number" && val > 0) {
    if (val > 30000 && val < 100000) {
      const totalMs = Math.round((val - 25569) * 86400 * 1000);
      const d = new Date(totalMs);
      return new Date(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds()
      );
    }
  }

  // 3. Si es cadena de texto
  if (typeof val === "string") {
    let texto = val.trim();
    if (!texto) return null;

    // Detectar sufijo 12h: AM/PM o a. m. / p. m.
    let esPM = false;
    let esAM = false;
    if (/p\.?\s*m\.?/i.test(texto) || /pm/i.test(texto)) {
      esPM = true;
    } else if (/a\.?\s*m\.?/i.test(texto) || /am/i.test(texto)) {
      esAM = true;
    }
    // Limpiar sufijo AM/PM
    texto = texto.replace(/[ap]\.?\s*m\.?/gi, "").trim();

    // Reemplazar separadores T o espacios múltiples
    texto = texto.replace("T", " ").replace(/\s+/g, " ");

    // Caso A: Formato ISO con año al inicio: YYYY[-/]MM[-/]DD [HH:mm[:ss]]
    const matchISO = texto.match(
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (matchISO) {
      const anio = parseInt(matchISO[1], 10);
      const mes = parseInt(matchISO[2], 10) - 1;
      const dia = parseInt(matchISO[3], 10);
      let horas = matchISO[4] ? parseInt(matchISO[4], 10) : 0;
      const minutos = matchISO[5] ? parseInt(matchISO[5], 10) : 0;
      const segundos = matchISO[6] ? parseInt(matchISO[6], 10) : 0;

      if (esPM && horas < 12) horas += 12;
      if (esAM && horas === 12) horas = 0;

      const d = new Date(anio, mes, dia, horas, minutos, segundos);
      if (!isNaN(d.getTime())) return d;
    }

    // Caso B: Formato latino/europeo: DD[-/]MM[-/]YYYY [HH:mm[:ss]] o DD[-/]MM[-/]YY
    const matchLatino = texto.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (matchLatino) {
      const dia = parseInt(matchLatino[1], 10);
      const mes = parseInt(matchLatino[2], 10) - 1;
      let anio = parseInt(matchLatino[3], 10);
      if (anio < 100) anio += 2000;

      let horas = matchLatino[4] ? parseInt(matchLatino[4], 10) : 0;
      const minutos = matchLatino[5] ? parseInt(matchLatino[5], 10) : 0;
      const segundos = matchLatino[6] ? parseInt(matchLatino[6], 10) : 0;

      if (esPM && horas < 12) horas += 12;
      if (esAM && horas === 12) horas = 0;

      const d = new Date(anio, mes, dia, horas, minutos, segundos);
      if (!isNaN(d.getTime())) return d;
    }

    // Fallback estándar
    const dStandard = new Date(val);
    if (!isNaN(dStandard.getTime())) return dStandard;
  }

  return null;
}

/**
 * Formatea un objeto Date para visualización legible en la tabla de previsualización.
 */
function formatearFechaPreview(fecha) {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return "Inválida";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

export default function AdminCargaMasivaModal({ isOpen, onClose, onClasesCargadas }) {
  const [archivo, setArchivo] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [clasesLeidas, setClasesLeidas] = useState([]);
  const [erroresLectura, setErroresLectura] = useState([]);
  const [procesandoLectura, setProcesandoLectura] = useState(false);
  const [guardandoFirestore, setGuardandoFirestore] = useState(false);
  const [progresoGuardado, setProgresoGuardado] = useState(0);
  const [mensajeResultado, setMensajeResultado] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Bloqueo de scroll y tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !guardandoFirestore) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, guardandoFirestore, onClose]);

  // Limpiar estado al cerrar o abrir
  useEffect(() => {
    if (isOpen) {
      setArchivo(null);
      setNombreArchivo("");
      setClasesLeidas([]);
      setErroresLectura([]);
      setMensajeResultado(null);
      setProgresoGuardado(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Genera y descarga dinámicamente la plantilla oficial de clases en formato Excel.
   */
  const handleDescargarPlantilla = () => {
    try {
      const datosEjemplo = [
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

      const instrucciones = [
        { "Campo": "Tipo de Servicio", "Obligatorio": "SÍ", "Descripción": "Ej: Pilates Reformer, Pilates Mat, Terapia Integral" },
        { "Campo": "Instructor", "Obligatorio": "SÍ", "Descripción": "Nombre del instructor (Francisco Peña, Carolina Escobillana o Marcela Rendic)" },
        { "Campo": "Fecha Inicio", "Obligatorio": "SÍ", "Descripción": "Formato: YYYY-MM-DD HH:mm (ej: 2026-11-02 09:00)" },
        { "Campo": "Fecha Fin", "Obligatorio": "SÍ", "Descripción": "Formato: YYYY-MM-DD HH:mm (ej: 2026-11-02 10:00)" },
        { "Campo": "Cupo Máximo", "Obligatorio": "SÍ", "Descripción": "Número de cupos máximos (mínimo 1)" },
        { "Campo": "Cupos Disponibles", "Obligatorio": "NO", "Descripción": "Si se omite, se asigna igual al Cupo Máximo" },
        { "Campo": "Estado", "Obligatorio": "NO", "Descripción": "activa | inactiva | cancelada | completada (Por defecto: activa)" },
        { "Campo": "Visible Desde", "Obligatorio": "NO", "Descripción": "Fecha visible para alumnos (Por defecto: Fecha Inicio)" },
        { "Campo": "Inscritos IDs", "Obligatorio": "NO", "Descripción": "UIDs separados por coma si ya hay alumnos (ej: u1, u2). Omitir si es nueva." }
      ];

      const wb = XLSX.utils.book_new();
      const wsClases = XLSX.utils.json_to_sheet(datosEjemplo);
      wsClases["!cols"] = [
        { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 20 },
        { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 22 }
      ];

      // Marcar celdas con formato de texto explícito para evitar alteraciones de formato por Excel
      const range = XLSX.utils.decode_range(wsClases["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsClases[cellAddress]) {
            if (C !== 4 && C !== 5) {
              wsClases[cellAddress].z = "@";
            }
          }
        }
      }
      XLSX.utils.book_append_sheet(wb, wsClases, "Clases");

      const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
      wsInstrucciones["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 75 }];
      XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

      XLSX.writeFile(wb, "plantilla_clases_huravitalis.xlsx");
    } catch (err) {
      console.error("Error al descargar plantilla:", err);
      // Fallback a enlace estático si existiera
      window.open("/plantilla_clases.xlsx", "_blank");
    }
  };

  /**
   * Procesa el archivo Excel seleccionado o soltado.
   */
  const procesarArchivoExcel = (file) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErroresLectura(["Por favor sube un archivo Excel válido con extensión .xlsx o .xls"]);
      return;
    }

    setArchivo(file);
    setNombreArchivo(file.name);
    setProcesandoLectura(true);
    setErroresLectura([]);
    setClasesLeidas([]);
    setMensajeResultado(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          dateNF: "yyyy-mm-dd hh:mm"
        });

        // Buscar la hoja llamada 'Clases' o usar la primera hoja disponible
        const sheetName = workbook.SheetNames.includes("Clases")
          ? "Clases"
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setErroresLectura(["El archivo no contiene hojas de datos legibles."]);
          setProcesandoLectura(false);
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: true
        });

        if (rawRows.length === 0) {
          setErroresLectura(["La hoja de cálculo está vacía o no tiene filas de datos."]);
          setProcesandoLectura(false);
          return;
        }

        const clasesParseadas = [];
        const errores = [];

        rawRows.forEach((row, index) => {
          const numFila = index + 2; // +2 por la cabecera en fila 1 (1-indexed)

          // Mapear claves normalizadas
          const mapaFila = {};
          Object.keys(row).forEach((k) => {
            mapaFila[normalizarClave(k)] = row[k];
          });

          // Omitir filas completamente vacías (típicas cuando el usuario borra celdas en Excel)
          const esFilaVacia = Object.values(mapaFila).every(
            (v) => v === "" || v === null || v === undefined
          );
          if (esFilaVacia) return;

          const tipoServicio = String(
            buscarValorColumna(mapaFila, [
              "tipodeservicio",
              "tiposervicio",
              "servicio",
              "clase",
              "nombreclase",
              "tipo"
            ])
          ).trim();

          const instructor = String(
            buscarValorColumna(mapaFila, [
              "instructor",
              "profesor",
              "profesora",
              "docente",
              "instructora"
            ])
          ).trim();

          const fechaInicioRaw = buscarValorColumna(mapaFila, [
            "fechainicio",
            "fechadeinicio",
            "inicio",
            "horainicio",
            "comienzo"
          ]);

          const fechaFinRaw = buscarValorColumna(mapaFila, [
            "fechafin",
            "fechadefin",
            "fechatermino",
            "fin",
            "termino",
            "horafin"
          ]);

          const visibleDesdeRaw = buscarValorColumna(mapaFila, [
            "visibledesde",
            "visible",
            "fechavisible",
            "publicardesde"
          ]);

          const fechaInicio = parsearFechaExcel(fechaInicioRaw);
          const fechaFin = parsearFechaExcel(fechaFinRaw);
          const visibleDesde = parsearFechaExcel(visibleDesdeRaw) || fechaInicio;

          const cupoMaximoRaw = parseInt(
            String(
              buscarValorColumna(
                mapaFila,
                ["cupomaximo", "cuposmaximos", "cupomax", "cupo", "cupos", "capacidad"],
                "5"
              )
            ).replace(/[^\d]/g, ""),
            10
          );
          const cupoMaximo = isNaN(cupoMaximoRaw) || cupoMaximoRaw <= 0 ? 5 : cupoMaximoRaw;

          const cuposDispVal = buscarValorColumna(
            mapaFila,
            ["cuposdisponibles", "cuposdisp", "disponibles", "cuposlibres"],
            ""
          );
          const cuposDispParsed = parseInt(String(cuposDispVal).replace(/[^\d]/g, ""), 10);
          const cuposDisponibles =
            cuposDispVal !== "" && !isNaN(cuposDispParsed)
              ? Math.max(0, cuposDispParsed)
              : cupoMaximo;

          const estadoRaw = String(
            buscarValorColumna(mapaFila, ["estado", "status"], "activa")
          ).toLowerCase().trim();
          const estadoValido = ["activa", "inactiva", "cancelada", "completada"].includes(estadoRaw)
            ? estadoRaw
            : "activa";

          const inscritosRaw = String(
            buscarValorColumna(
              mapaFila,
              ["inscritosids", "inscritos", "alumnos", "alumnosinscritos", "uids"],
              ""
            )
          ).trim();
          const inscritos_ids = inscritosRaw
            ? inscritosRaw.split(",").map((id) => id.trim()).filter(Boolean)
            : [];

          // Validaciones de fila
          const motivosError = [];
          if (!tipoServicio) motivosError.push("Falta 'Tipo de Servicio'");
          if (!instructor) motivosError.push("Falta 'Instructor'");
          if (!fechaInicio) motivosError.push("Fecha Inicio inválida (ej: 2026-11-02 09:00 o 02/11/2026 09:00)");
          if (!fechaFin) motivosError.push("Fecha Fin inválida (ej: 2026-11-02 10:00 o 02/11/2026 10:00)");
          if (fechaInicio && fechaFin && fechaFin <= fechaInicio) {
            motivosError.push("Fecha Fin debe ser posterior a Fecha Inicio (verifica incluir la hora)");
          }

          const esValida = motivosError.length === 0;

          if (!esValida) {
            errores.push(`Fila ${numFila}: ${motivosError.join(", ")}`);
          }

          clasesParseadas.push({
            numFila,
            esValida,
            motivosError,
            tipo_servicio: tipoServicio || "Pilates Reformer",
            instructor: instructor || "Instructor Asignado",
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            visible_desde: visibleDesde,
            cupo_maximo: cupoMaximo,
            cupos_disponibles: cuposDisponibles,
            estado: estadoValido,
            inscritos_ids
          });
        });

        setClasesLeidas(clasesParseadas);
        setErroresLectura(errores);
      } catch (err) {
        console.error("Error al leer el archivo Excel:", err);
        setErroresLectura(["No se pudo procesar el archivo. Asegúrate de que no esté corrupto o protegido con contraseña."]);
      } finally {
        setProcesandoLectura(false);
      }
    };

    reader.onerror = () => {
      setErroresLectura(["Error de lectura del archivo en el navegador."]);
      setProcesandoLectura(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) procesarArchivoExcel(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) procesarArchivoExcel(file);
  };

  /**
   * Guarda todas las clases válidas en Firestore utilizando batch writing.
   */
  const handleGuardarEnFirestore = async () => {
    const clasesValidas = clasesLeidas.filter((c) => c.esValida);

    if (clasesValidas.length === 0) {
      setMensajeResultado({
        tipo: "error",
        texto: "No hay clases válidas para registrar. Por favor revisa los errores en el archivo."
      });
      return;
    }

    setGuardandoFirestore(true);
    setProgresoGuardado(30);

    try {
      // Simular incremento de progreso mientras procesa Firestore
      const timer = setInterval(() => {
        setProgresoGuardado((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const resultado = await crearClasesMasivasAdmin(clasesValidas);
      clearInterval(timer);
      setProgresoGuardado(100);

      if (resultado.errores && resultado.errores.length > 0) {
        setMensajeResultado({
          tipo: "warning",
          texto: `Se guardaron ${resultado.totalCreadas} clases, pero ocurrieron algunos problemas: ${resultado.errores.join("; ")}`
        });
      } else {
        setMensajeResultado({
          tipo: "exito",
          texto: `¡Éxito! Se crearon ${resultado.totalCreadas} clases correctamente en Firebase Firestore.`
        });
        if (onClasesCargadas) {
          onClasesCargadas(resultado.totalCreadas);
        }
      }
    } catch (err) {
      console.error("Error al guardar clases masivas:", err);
      setMensajeResultado({
        tipo: "error",
        texto: `Ocurrió un error al registrar las clases en Firebase: ${err.message || "Error desconocido"}`
      });
    } finally {
      setGuardandoFirestore(false);
    }
  };

  const totalValidas = clasesLeidas.filter((c) => c.esValida).length;
  const totalInvalidas = clasesLeidas.filter((c) => !c.esValida).length;

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => {
        if (!guardandoFirestore) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-carga-masiva-title"
    >
      <div
        className="admin-modal-content"
        style={{
          maxWidth: "960px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "1rem"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.2rem 0.65rem",
                backgroundColor: "rgba(206, 208, 242, 0.4)",
                color: "#253B59",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: "0.35rem"
              }}
            >
              📊 Carga Masiva
            </div>
            <h2
              id="modal-carga-masiva-title"
              style={{
                fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                fontWeight: "700",
                color: "#253B59",
                margin: 0
              }}
            >
              Importar Clases desde Excel
            </h2>
            <p style={{ margin: "0.3rem 0 0", color: "#64748B", fontSize: "0.875rem" }}>
              Carga múltiples clases a la vez en Firestore completando la plantilla oficial.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardandoFirestore}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: guardandoFirestore ? "not-allowed" : "pointer",
              color: "#64748B",
              padding: "0.35rem",
              borderRadius: "8px",
              lineHeight: 1
            }}
            aria-label="Cerrar modal de carga masiva"
          >
            ✕
          </button>
        </div>

        {/* Zona de Descarga de Plantilla & Instrucciones */}
        <div
          style={{
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "1rem 1.25rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#253B59",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span>📄</span> Plantilla Excel Oficial
            </h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.825rem", color: "#64748B" }}>
              Descarga la hoja preformateada con los 9 campos y ejemplos para evitar errores de importación.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDescargarPlantilla}
            style={{
              backgroundColor: "#253B59",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "9999px",
              padding: "0.6rem 1.25rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 8px rgba(37, 59, 89, 0.2)",
              transition: "transform 0.15s ease, background-color 0.15s ease"
            }}
          >
            <span>⬇️</span>
            <span>Descargar Plantilla Excel</span>
          </button>
        </div>

        {/* Zona Drag & Drop / Selección de Archivo */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="excel-file-upload-input"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              border: isDragging ? "2px dashed #253B59" : "2px dashed #CBD5E1",
              backgroundColor: isDragging ? "rgba(206, 208, 242, 0.25)" : "#FAFAFC",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
              {isDragging ? "📥" : "📂"}
            </div>
            <p style={{ margin: 0, fontWeight: "700", color: "#253B59", fontSize: "1rem" }}>
              {nombreArchivo ? `Archivo seleccionado: ${nombreArchivo}` : "Haz clic o arrastra aquí tu archivo Excel"}
            </p>
            <p style={{ margin: "0.35rem 0 0", color: "#64748B", fontSize: "0.825rem" }}>
              Formatos aceptados: .xlsx, .xls (Máximo recomendado: 500 clases por carga)
            </p>
          </div>
        </div>

        {/* Estado de Lectura / Feedback */}
        {procesandoLectura && (
          <div style={{ textAlign: "center", padding: "1.5rem", color: "#253B59" }}>
            <span style={{ fontSize: "1.5rem" }}>⏳</span>
            <p style={{ marginTop: "0.5rem", fontWeight: "600" }}>Leyendo y validando archivo Excel...</p>
          </div>
        )}

        {/* Mensaje de Resultado (Éxito o Error) */}
        {mensajeResultado && (
          <div
            style={{
              padding: "0.9rem 1.25rem",
              borderRadius: "12px",
              backgroundColor:
                mensajeResultado.tipo === "exito"
                  ? "#DCFCE7"
                  : mensajeResultado.tipo === "warning"
                  ? "#FEF3C7"
                  : "#FEE2E2",
              border:
                mensajeResultado.tipo === "exito"
                  ? "1px solid #86EFAC"
                  : mensajeResultado.tipo === "warning"
                  ? "1px solid #FCD34D"
                  : "1px solid #FCA5A5",
              color:
                mensajeResultado.tipo === "exito"
                  ? "#166534"
                  : mensajeResultado.tipo === "warning"
                  ? "#92400E"
                  : "#991B1B",
              fontSize: "0.9rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem"
            }}
          >
            <span>{mensajeResultado.tipo === "exito" ? "✅" : "⚠️"}</span>
            <span>{mensajeResultado.texto}</span>
          </div>
        )}

        {/* Alertas de Errores de Validación */}
        {erroresLectura.length > 0 && (
          <div
            style={{
              backgroundColor: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: "12px",
              padding: "0.85rem 1.25rem",
              maxHeight: "150px",
              overflowY: "auto"
            }}
          >
            <p style={{ margin: "0 0 0.4rem", fontWeight: "700", color: "#9F1239", fontSize: "0.875rem" }}>
              ⚠️ Se detectaron {erroresLectura.length} observaciones en el archivo:
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#BE123C", fontSize: "0.825rem" }}>
              {erroresLectura.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {erroresLectura.length > 10 && (
                <li>...y {erroresLectura.length - 10} observaciones adicionales.</li>
              )}
            </ul>
          </div>
        )}

        {/* Barra de Progreso durante la Inserción en Firestore */}
        {guardandoFirestore && (
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.825rem",
                fontWeight: "600",
                color: "#253B59",
                marginBottom: "0.35rem"
              }}
            >
              <span>Guardando clases en Firebase Firestore...</span>
              <span>{progresoGuardado}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#E2E8F0",
                borderRadius: "9999px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${progresoGuardado}%`,
                  height: "100%",
                  backgroundColor: "#253B59",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>
        )}

        {/* Tabla de Previsualización (Preview) */}
        {clasesLeidas.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.6rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#253B59" }}>
                Vista Previa ({clasesLeidas.length} clases detectadas)
              </h3>
              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span
                  style={{
                    backgroundColor: "#DCFCE7",
                    color: "#166534",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    fontWeight: "700"
                  }}
                >
                  ✓ {totalValidas} Válidas
                </span>
                {totalInvalidas > 0 && (
                  <span
                    style={{
                      backgroundColor: "#FEE2E2",
                      color: "#991B1B",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontWeight: "700"
                    }}
                  >
                    ✕ {totalInvalidas} Con Error
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                maxHeight: "260px",
                overflow: "auto",
                backgroundColor: "#FFFFFF"
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Fila</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Estado</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Servicio</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Instructor</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Inicio</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Fin</th>
                    <th style={{ padding: "0.65rem 0.75rem", color: "#64748B" }}>Cupos</th>
                  </tr>
                </thead>
                <tbody>
                  {clasesLeidas.map((c) => (
                    <tr
                      key={c.numFila}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: c.esValida ? "#FFFFFF" : "#FEF2F2"
                      }}
                    >
                      <td style={{ padding: "0.6rem 0.75rem", color: "#64748B", fontWeight: "600" }}>
                        #{c.numFila}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        {c.esValida ? (
                          <span
                            style={{
                              backgroundColor: "#DCFCE7",
                              color: "#166534",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "700"
                            }}
                          >
                            Lista
                          </span>
                        ) : (
                          <span
                            title={c.motivosError.join(", ")}
                            style={{
                              backgroundColor: "#FEE2E2",
                              color: "#991B1B",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              cursor: "help"
                            }}
                          >
                            Error
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: "600", color: "#253B59" }}>
                        {c.tipo_servicio}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
                        {c.instructor}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
                        {formatearFechaPreview(c.fecha_inicio)}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
                        {formatearFechaPreview(c.fecha_fin)}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#475569" }}>
                        {c.cupos_disponibles}/{c.cupo_maximo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones de Acción al Pie del Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            borderTop: "1px solid #E2E8F0",
            paddingTop: "1rem",
            marginTop: "auto"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={guardandoFirestore}
            style={{
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              borderRadius: "9999px",
              padding: "0.75rem 1.5rem",
              border: "none",
              fontWeight: "600",
              cursor: guardandoFirestore ? "not-allowed" : "pointer",
              minHeight: "44px"
            }}
          >
            {mensajeResultado && mensajeResultado.tipo === "exito" ? "Cerrar" : "Cancelar"}
          </button>

          <button
            type="button"
            onClick={handleGuardarEnFirestore}
            disabled={guardandoFirestore || totalValidas === 0}
            style={{
              backgroundColor: totalValidas > 0 && !guardandoFirestore ? "#253B59" : "#94A3B8",
              color: "#FFFFFF",
              borderRadius: "9999px",
              padding: "0.75rem 1.75rem",
              border: "none",
              fontWeight: "600",
              cursor: totalValidas > 0 && !guardandoFirestore ? "pointer" : "not-allowed",
              boxShadow:
                totalValidas > 0 && !guardandoFirestore
                  ? "0 4px 14px rgba(37, 59, 89, 0.25)"
                  : "none",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>{guardandoFirestore ? "⏳" : "💾"}</span>
            <span>
              {guardandoFirestore
                ? "Guardando en Firebase..."
                : `Guardar ${totalValidas} ${totalValidas === 1 ? "Clase" : "Clases"} en Firebase`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
