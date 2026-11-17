import { useState, useEffect, useMemo } from "react";
import { suscribirTodasLasClasesAdmin } from "../firebase/clasesService";
import {
  suscribirTodosLosUsuariosAdmin,
  suscribirTodasLasInscripcionesAdmin,
} from "../firebase/usuariosService";
import { suscribirTodasLasTerapiasAdmin } from "../firebase/terapiasService";
import {
  IconoAlumnosInscritosAltA,
  IconoClasesHechasAltA,
  IconoCupoCompletoAltA,
  IconoOcupacionPromedioAltA,
  IconoSemanaClasesAltA,
  IconoEvolucionAlumnosAltA,
  IconoDistribucionDonaAltA,
  IconoActividadInstructoresAltA,
  IconoAlumnosRenovacionAltA,
} from "./DashboardIcons";

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const NOMBRES_MESES_CORTOS = [
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

const DIAS_SEMANA_LARGOS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Devuelve el lunes 00:00 (hora local) de la semana que contiene la fecha indicada
function obtenerInicioSemana(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const desdeLunes = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - desdeLunes);
  return d;
}

// Formatea una fecha local como "YYYY-MM-DD" (formato de input type="date")
function formatearFechaISO(fecha) {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Convierte "YYYY-MM-DD" a una fecha local (evita el desfase de zona horaria de new Date("YYYY-MM-DD"))
function parsearFechaISO(valor) {
  if (!valor) return null;
  const [yyyy, mm, dd] = valor.split("-").map(Number);
  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd);
}

// Paleta armónica de Hara Vitalis para segmentos del gráfico de dona
const PALETA_DONA_HARA = [
  "#16A34A", // Verde Esmeralda (Óptimo / Cupo completo)
  "#4E9F8E", // Verde Salvia / Teal Hara Vitalis
  "#253B59", // Azul Marino Profundo Hara Vitalis
  "#6366F1", // Índigo Lavanda
  "#D97706", // Ámbar Cálido
  "#DC2626", // Coral / Alerta
];

// Convierte cualquier valor de fecha de Firestore o Date a timestamp en milisegundos
function obtenerTimestamp(val) {
  if (!val) return 0;
  if (typeof val.toDate === "function") {
    const d = val.toDate();
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  if (typeof val.seconds === "number") {
    return val.seconds * 1000;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// Calcula cuántos alumnos están inscritos en una clase a partir de inscritos_ids o cupos
function obtenerInscritosClase(clase) {
  const cupoMax = Math.max(0, Number(clase?.cupo_maximo ?? 0));
  const ids = Array.isArray(clase?.inscritos_ids) ? clase.inscritos_ids : [];
  if (ids.length > 0) {
    return ids.length;
  }
  if (
    clase?.cupos_disponibles !== undefined &&
    clase?.cupos_disponibles !== null &&
    cupoMax > 0
  ) {
    const disp = Math.max(0, Number(clase.cupos_disponibles));
    return Math.max(0, cupoMax - disp);
  }
  return 0;
}

// Determina si una clase ocupó todos sus cupos disponibles (100% llena)
function tieneCupoCompleto(clase) {
  const cupoMax = Number(clase?.cupo_maximo ?? 0);
  if (cupoMax <= 0) return false;
  const inscritos = obtenerInscritosClase(clase);
  const disponibles =
    clase?.cupos_disponibles !== undefined && clase?.cupos_disponibles !== null
      ? Number(clase.cupos_disponibles)
      : cupoMax - inscritos;
  return inscritos >= cupoMax || disponibles <= 0;
}

// Determina si una clase ya fue realizada/dictada respecto al momento actual
function fueClaseRealizada(clase, ahoraMs) {
  const tInicio = obtenerTimestamp(clase?.fecha_inicio);
  if (!tInicio) return false;
  const tFin = obtenerTimestamp(clase?.fecha_fin) || tInicio + 60 * 60 * 1000;
  return tFin <= ahoraMs;
}

// Obtiene la etiqueta horaria en formato HH:MM (ej. "08:30" o "09:00")
function obtenerEtiquetaHora(timestampMs) {
  if (!timestampMs) return "Sin hora";
  const d = new Date(timestampMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Semáforo RAG (Red-Amber-Green) para tasas de ocupación
function obtenerNivelRAG(porcentaje) {
  if (porcentaje >= 70) {
    return {
      nivel: "success",
      etiqueta: "Óptima",
      color: "#16A34A",
    };
  }
  if (porcentaje >= 40) {
    return {
      nivel: "warning",
      etiqueta: "Moderada",
      color: "#D97706",
    };
  }
  return {
    nivel: "danger",
    etiqueta: "Baja",
    color: "#DC2626",
  };
}

// Construye una curva Cubic Bezier suave (estilo Revenue Overview) a partir de una lista de puntos { x, [keyY] }
function construirCurvaSuaveSVG(puntos, keyY) {
  if (!puntos || puntos.length === 0) return "";
  if (puntos.length === 1) {
    const p = puntos[0];
    return `M ${p.x} ${p[keyY]}`;
  }
  let d = `M ${puntos[0].x} ${puntos[0][keyY]}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i];
    const p1 = puntos[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0[keyY]}, ${midX} ${p1[keyY]}, ${p1.x} ${p1[keyY]}`;
  }
  return d;
}

// Construye el path cerrado debajo de la curva suave para rellenar con gradiente
function construirAreaSuaveSVG(puntos, keyY, baseLineY) {
  if (!puntos || puntos.length === 0) return "";
  if (puntos.length === 1) {
    const p = puntos[0];
    return `M ${p.x - 20} ${baseLineY} L ${p.x} ${p[keyY]} L ${p.x + 20} ${baseLineY} Z`;
  }
  const curva = construirCurvaSuaveSVG(puntos, keyY);
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  return `${curva} L ${ultimo.x} ${baseLineY} L ${primero.x} ${baseLineY} Z`;
}

export default function AdminDashboardPage({
  currentUser,
  embedded = false,
  onNavigateToClases,
}) {
  const [clases, setClases] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [terapias, setTerapias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Controles de filtrado adaptativo
  // modoBarra: "semanal" | "dia" para la tarjeta de barras
  const [modoBarra, setModoBarra] = useState("semanal");
  const [fechaBarra, setFechaBarra] = useState(() =>
    formatearFechaISO(new Date()),
  );
  const [anioFiltro, setAnioFiltro] = useState("todos");
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [diaFiltro, setDiaFiltro] = useState("todos");
  const [fechaExactaFiltro, setFechaExactaFiltro] = useState("");
  const [instructorFiltro, setInstructorFiltro] = useState("todos");
  const [servicioFiltro, setServicioFiltro] = useState("todos");
  // alcanceEstado: "todas" | "hechas" | "proximas"
  const [alcanceEstado, setAlcanceEstado] = useState("todas");
  // modoDona: "ocupacion" | "instructores"
  const [modoDona, setModoDona] = useState("ocupacion");

  // Controles para Consumo de Plan y Riesgo de Renovación (Burn-Rate)
  // filtroEstadoBurnRate: "todos" | "vigente" | "por_vencer" | "renovar"
  const [filtroEstadoBurnRate, setFiltroEstadoBurnRate] = useState("todos");
  const [paginaBurnRate, setPaginaBurnRate] = useState(1);
  const ELEMENTOS_POR_PAGINA_BURN_RATE = 10;

  // Semana configurable del gráfico de línea (lunes de la semana visible) y día señalado por el puntero
  const [inicioSemana, setInicioSemana] = useState(() =>
    obtenerInicioSemana(new Date()),
  );
  const [diaActivo, setDiaActivo] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.rol !== "admin") return;

    const unsubClases =
      typeof suscribirTodasLasClasesAdmin === "function"
        ? suscribirTodasLasClasesAdmin((lista) => {
            setClases(Array.isArray(lista) ? lista : []);
            setCargando(false);
          })
        : null;

    const unsubUsuarios =
      typeof suscribirTodosLosUsuariosAdmin === "function"
        ? suscribirTodosLosUsuariosAdmin((lista) => {
            setUsuarios(Array.isArray(lista) ? lista : []);
          })
        : null;

    const unsubInscripciones =
      typeof suscribirTodasLasInscripcionesAdmin === "function"
        ? suscribirTodasLasInscripcionesAdmin((lista) => {
            setInscripciones(Array.isArray(lista) ? lista : []);
          })
        : null;

    const unsubTerapias =
      typeof suscribirTodasLasTerapiasAdmin === "function"
        ? suscribirTodasLasTerapiasAdmin((lista) => {
            setTerapias(Array.isArray(lista) ? lista : []);
          })
        : null;

    return () => {
      if (typeof unsubClases === "function") unsubClases();
      if (typeof unsubUsuarios === "function") unsubUsuarios();
      if (typeof unsubInscripciones === "function") unsubInscripciones();
      if (typeof unsubTerapias === "function") unsubTerapias();
    };
  }, [currentUser]);

  // Mapa rápido de UID -> Nombre del alumno
  const mapaUsuarios = useMemo(() => {
    const mapa = {};
    usuarios.forEach((u) => {
      const uid = u.id || u.uid;
      if (uid) {
        mapa[uid] = {
          nombre: u.nombre || u.email || "Alumno",
          email: u.email || "",
          clases_pactadas: Number(u.clases_pactadas ?? 0),
          sesion_terapia: Number(u.sesion_terapia ?? 0),
          estado_cuenta: u.estado_cuenta || "activo",
          rol: u.rol || "cliente",
        };
      }
    });
    inscripciones.forEach((ins) => {
      if (ins.usuario_id && ins.usuario_nombre && !mapa[ins.usuario_id]) {
        mapa[ins.usuario_id] = {
          nombre: ins.usuario_nombre,
          email: ins.usuario_email || "",
          clases_pactadas: 0,
          sesion_terapia: 0,
          estado_cuenta: "activo",
          rol: "cliente",
        };
      }
    });
    return mapa;
  }, [usuarios, inscripciones]);

  // Normalización de todas las clases con sus metadatos temporales y de ocupación
  const ahoraMs = Date.now();
  const clasesEnriquecidas = useMemo(() => {
    return clases
      .map((c) => {
        const tsInicio = obtenerTimestamp(c.fecha_inicio);
        if (!tsInicio) return null;
        const fechaObj = new Date(tsInicio);
        const anio = fechaObj.getFullYear();
        const mes = fechaObj.getMonth(); // 0..11
        const dia = fechaObj.getDate(); // 1..31
        const yyyyMmDd = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const inscritosCount = obtenerInscritosClase(c);
        const cupoMaximo = Math.max(1, Number(c.cupo_maximo ?? 5));
        const esHecha = fueClaseRealizada(c, ahoraMs);
        const esLlena = tieneCupoCompleto(c);
        const horaEtiqueta = obtenerEtiquetaHora(tsInicio);

        return {
          ...c,
          tsInicio,
          anio,
          mes,
          dia,
          yyyyMmDd,
          horaEtiqueta,
          instructorNombre: (c.instructor || "Sin instructor").trim(),
          servicioNombre: (c.tipo_servicio || "Pilates").trim(),
          inscritosCount,
          cupoMaximo,
          esHecha,
          esLlena,
          inscritosIds: Array.isArray(c.inscritos_ids) ? c.inscritos_ids : [],
        };
      })
      .filter(Boolean);
  }, [clases, ahoraMs]);

  // Opciones dinámicas adaptativas extraídas de los datos reales
  const opcionesAnios = useMemo(() => {
    const setAnios = new Set(clasesEnriquecidas.map((c) => c.anio));
    if (setAnios.size === 0) setAnios.add(new Date().getFullYear());
    return Array.from(setAnios).sort((a, b) => b - a);
  }, [clasesEnriquecidas]);

  const opcionesInstructores = useMemo(() => {
    const setInst = new Set(clasesEnriquecidas.map((c) => c.instructorNombre));
    return Array.from(setInst).sort((a, b) => a.localeCompare(b, "es"));
  }, [clasesEnriquecidas]);

  const opcionesServicios = useMemo(() => {
    const setServ = new Set(clasesEnriquecidas.map((c) => c.servicioNombre));
    return Array.from(setServ).sort((a, b) => a.localeCompare(b, "es"));
  }, [clasesEnriquecidas]);

  const opcionesDiasDelMes = useMemo(() => {
    const setDias = new Set(
      clasesEnriquecidas
        .filter((c) => {
          if (anioFiltro !== "todos" && c.anio !== Number(anioFiltro))
            return false;
          if (mesFiltro !== "todos" && c.mes !== Number(mesFiltro))
            return false;
          return true;
        })
        .map((c) => c.dia),
    );
    return Array.from(setDias).sort((a, b) => a - b);
  }, [clasesEnriquecidas, anioFiltro, mesFiltro]);

  // Aplicación de todos los filtros seleccionados por el usuario
  const clasesFiltradas = useMemo(() => {
    return clasesEnriquecidas.filter((c) => {
      if (anioFiltro !== "todos" && c.anio !== Number(anioFiltro)) return false;
      if (mesFiltro !== "todos" && c.mes !== Number(mesFiltro)) return false;
      if (diaFiltro !== "todos" && c.dia !== Number(diaFiltro)) return false;
      if (fechaExactaFiltro && c.yyyyMmDd !== fechaExactaFiltro) return false;
      if (
        instructorFiltro !== "todos" &&
        c.instructorNombre !== instructorFiltro
      )
        return false;
      if (servicioFiltro !== "todos" && c.servicioNombre !== servicioFiltro)
        return false;
      if (alcanceEstado === "hechas" && !c.esHecha) return false;
      if (alcanceEstado === "proximas" && c.esHecha) return false;
      return true;
    });
  }, [
    clasesEnriquecidas,
    anioFiltro,
    mesFiltro,
    diaFiltro,
    fechaExactaFiltro,
    instructorFiltro,
    servicioFiltro,
    alcanceEstado,
  ]);

  // 1. Métricas Ejecutivas Globales (KPIs)
  const kpisGlobales = useMemo(() => {
    const totalClases = clasesFiltradas.length;
    const clasesHechas = clasesFiltradas.filter((c) => c.esHecha).length;
    const clasesProximas = totalClases - clasesHechas;
    const clasesLlenas = clasesFiltradas.filter((c) => c.esLlena).length;
    const totalInscritos = clasesFiltradas.reduce(
      (acc, c) => acc + c.inscritosCount,
      0,
    );
    const totalCuposOfertados = clasesFiltradas.reduce(
      (acc, c) => acc + c.cupoMaximo,
      0,
    );
    const tasaOcupacion =
      totalCuposOfertados > 0
        ? Math.round((totalInscritos / totalCuposOfertados) * 100)
        : 0;
    const porcentajeClasesLlenas =
      totalClases > 0 ? Math.round((clasesLlenas / totalClases) * 100) : 0;
    const porcentajeClasesHechas =
      totalClases > 0 ? Math.round((clasesHechas / totalClases) * 100) : 0;
    const promedioAlumnosPorClase =
      totalClases > 0 ? (totalInscritos / totalClases).toFixed(1) : "0.0";

    const alumnosUnicosSet = new Set();
    clasesFiltradas.forEach((c) => {
      c.inscritosIds.forEach((uid) => alumnosUnicosSet.add(uid));
    });

    const clientesActivos = usuarios.filter(
      (u) => u.rol !== "admin" && (u.estado_cuenta || "activo") === "activo",
    );
    const clientesSinCreditos = clientesActivos.filter(
      (u) => Number(u.clases_pactadas ?? 0) === 0,
    );

    return {
      totalClases,
      clasesHechas,
      clasesProximas,
      porcentajeClasesHechas,
      clasesLlenas,
      porcentajeClasesLlenas,
      totalInscritos,
      totalCuposOfertados,
      tasaOcupacion,
      promedioAlumnosPorClase,
      alumnosUnicosPeriodo: alumnosUnicosSet.size,
      totalClientesActivos: clientesActivos.length,
      clientesPorRenovar: clientesSinCreditos.length,
    };
  }, [clasesFiltradas, usuarios]);

  // 2. Desglose por Instructor (Clases hechas, clases próximas, clases llenas y alumnos inscritos)
  const estadisticasPorInstructor = useMemo(() => {
    const mapa = {};
    clasesFiltradas.forEach((c) => {
      const nombre = c.instructorNombre;
      if (!mapa[nombre]) {
        mapa[nombre] = {
          instructor: nombre,
          clasesHechas: 0,
          clasesProximas: 0,
          totalClases: 0,
          clasesLlenas: 0,
          alumnosInscritos: 0,
          cuposOfertados: 0,
          alumnosUnicos: new Set(),
        };
      }
      const item = mapa[nombre];
      item.totalClases += 1;
      if (c.esHecha) {
        item.clasesHechas += 1;
      } else {
        item.clasesProximas += 1;
      }
      if (c.esLlena) {
        item.clasesLlenas += 1;
      }
      item.alumnosInscritos += c.inscritosCount;
      item.cuposOfertados += c.cupoMaximo;
      c.inscritosIds.forEach((uid) => item.alumnosUnicos.add(uid));
    });

    return Object.values(mapa)
      .map((item) => {
        const tasaOcupacion =
          item.cuposOfertados > 0
            ? Math.round((item.alumnosInscritos / item.cuposOfertados) * 100)
            : 0;
        const promedioPorClase =
          item.totalClases > 0
            ? (item.alumnosInscritos / item.totalClases).toFixed(1)
            : "0.0";
        return {
          ...item,
          alumnosUnicosCount: item.alumnosUnicos.size,
          tasaOcupacion,
          promedioPorClase,
        };
      })
      .sort((a, b) => {
        if (b.alumnosInscritos !== a.alumnosInscritos) {
          return b.alumnosInscritos - a.alumnosInscritos;
        }
        return b.totalClases - a.totalClases;
      });
  }, [clasesFiltradas]);

  // 3. Línea de tiempo semanal (Lunes a Domingo) de clases y cupos completos
  // Usa su propia semana configurable; solo aplica los filtros de Instructor, Servicio y Alcance
  const serieSemanal = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, idx) => {
      const fecha = new Date(inicioSemana);
      fecha.setDate(fecha.getDate() + idx);
      const dd = String(fecha.getDate()).padStart(2, "0");
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      return {
        clave: formatearFechaISO(fecha),
        diaLargo: DIAS_SEMANA_LARGOS[idx],
        diaCorto: DIAS_SEMANA_CORTOS[idx],
        fechaCorta: `${dd}/${mm}`,
        fechaTexto: `${dd}/${mm}/${fecha.getFullYear()}`,
        totalClases: 0,
        clasesLlenas: 0,
        alumnosInscritos: 0,
        cuposOfertados: 0,
        horasLlenasSet: new Set(),
      };
    });
    const indicePorClave = {};
    dias.forEach((d, idx) => {
      indicePorClave[d.clave] = idx;
    });

    clasesEnriquecidas.forEach((c) => {
      const idx = indicePorClave[c.yyyyMmDd];
      if (idx === undefined) return;
      if (
        instructorFiltro !== "todos" &&
        c.instructorNombre !== instructorFiltro
      )
        return;
      if (servicioFiltro !== "todos" && c.servicioNombre !== servicioFiltro)
        return;
      if (alcanceEstado === "hechas" && !c.esHecha) return;
      if (alcanceEstado === "proximas" && c.esHecha) return;

      const dia = dias[idx];
      dia.totalClases += 1;
      dia.alumnosInscritos += c.inscritosCount;
      dia.cuposOfertados += c.cupoMaximo;
      if (c.esLlena) {
        dia.clasesLlenas += 1;
        dia.horasLlenasSet.add(c.horaEtiqueta);
      }
    });

    return dias.map(({ horasLlenasSet, ...d }) => ({
      ...d,
      horasLlenas: Array.from(horasLlenasSet).sort(),
      porcentajeLlenas:
        d.totalClases > 0
          ? Math.round((d.clasesLlenas / d.totalClases) * 100)
          : 0,
      tasaOcupacionDia:
        d.cuposOfertados > 0
          ? Math.round((d.alumnosInscritos / d.cuposOfertados) * 100)
          : 0,
    }));
  }, [
    clasesEnriquecidas,
    inicioSemana,
    instructorFiltro,
    servicioFiltro,
    alcanceEstado,
  ]);

  // 4. Datos para el Gráfico de Barras: Modo Semanal vs. Modo Día con Subutilización Crítica
  const inicioSemanaBarra = useMemo(() => {
    const fechaObj = parsearFechaISO(fechaBarra) || new Date();
    return obtenerInicioSemana(fechaObj);
  }, [fechaBarra]);

  const finSemanaBarra = useMemo(() => {
    const fin = new Date(inicioSemanaBarra);
    fin.setDate(fin.getDate() + 6);
    return fin;
  }, [inicioSemanaBarra]);

  const textoSemanaBarra = useMemo(() => {
    const dInicio = String(inicioSemanaBarra.getDate()).padStart(2, "0");
    const mInicio = String(inicioSemanaBarra.getMonth() + 1).padStart(2, "0");
    const dFin = String(finSemanaBarra.getDate()).padStart(2, "0");
    const mFin = String(finSemanaBarra.getMonth() + 1).padStart(2, "0");
    return `Semana barras: ${dInicio}/${mInicio} al ${dFin}/${mFin}/${finSemanaBarra.getFullYear()}`;
  }, [inicioSemanaBarra, finSemanaBarra]);

  const textoDiaBarra = useMemo(() => {
    const fechaObj = parsearFechaISO(fechaBarra) || new Date();
    const diaIdx = (fechaObj.getDay() + 6) % 7;
    const dd = String(fechaObj.getDate()).padStart(2, "0");
    const mm = String(fechaObj.getMonth() + 1).padStart(2, "0");
    return `${DIAS_SEMANA_LARGOS[diaIdx]} ${dd}/${mm}/${fechaObj.getFullYear()}`;
  }, [fechaBarra]);

  // Serie semanal: Lunes a Domingo con color uniforme y subíndice de alumnos inscritos
  const serieSemanalBarra = useMemo(() => {
    const dias = Array.from({ length: 7 }, (_, idx) => {
      const fecha = new Date(inicioSemanaBarra);
      fecha.setDate(fecha.getDate() + idx);
      const dd = String(fecha.getDate()).padStart(2, "0");
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      return {
        clave: formatearFechaISO(fecha),
        diaLargo: DIAS_SEMANA_LARGOS[idx],
        diaCorto: DIAS_SEMANA_CORTOS[idx],
        fechaCorta: `${dd}/${mm}`,
        etiqueta: `${DIAS_SEMANA_CORTOS[idx]} ${dd}/${mm}`,
        etiquetaCompleta: `${DIAS_SEMANA_LARGOS[idx]} ${dd}/${mm}/${fecha.getFullYear()}`,
        alumnosInscritos: 0,
        totalClases: 0,
        clasesLlenas: 0,
      };
    });
    const indicePorClave = {};
    dias.forEach((d, idx) => {
      indicePorClave[d.clave] = idx;
    });

    clasesFiltradas.forEach((c) => {
      const idx = indicePorClave[c.yyyyMmDd];
      if (idx === undefined) return;
      dias[idx].alumnosInscritos += c.inscritosCount;
      dias[idx].totalClases += 1;
      if (c.esLlena) dias[idx].clasesLlenas += 1;
    });

    return dias;
  }, [inicioSemanaBarra, clasesFiltradas]);

  // Desglose por horario del día y Evaluación de Rendimiento / Subutilización Crítica
  const desgloseDiaBarra = useMemo(() => {
    const clasesDia = clasesFiltradas
      .filter((c) => c.yyyyMmDd === fechaBarra)
      .sort((a, b) => a.tsInicio - b.tsInicio);

    const totalClases = clasesDia.length;

    // Clasificación de cada clase según los parámetros del usuario:
    // 🟢 Controlado (4 a 5 inscritos): Verde (#16A34A)
    // 🟡 Atención (2 a 3 inscritos): Amarillo (#EAB308)
    // 🔴 Déficit (0 a 1 inscrito): Rojo (#DC2626)
    let clasesControladas = 0;
    let clasesAtencion = 0;
    let clasesDeficit = 0;

    const puntosHorarios = clasesDia.map((c) => {
      const inscritos = Array.isArray(c.inscritos_ids)
        ? c.inscritos_ids.length
        : c.inscritosCount;

      let estadoClase = "controlado";
      let colorClase = "#16A34A"; // Verde
      let etiquetaClase = "Controlado (4 a 5 inscritos)";

      if (inscritos <= 1) {
        estadoClase = "deficit";
        colorClase = "#DC2626"; // Rojo
        etiquetaClase = "Déficit (0 a 1 inscrito)";
        clasesDeficit += 1;
      } else if (inscritos <= 3) {
        estadoClase = "atencion";
        colorClase = "#EAB308"; // Amarillo
        etiquetaClase = "Atención (2 a 3 inscritos)";
        clasesAtencion += 1;
      } else {
        clasesControladas += 1;
      }

      return {
        id: c.id,
        hora: c.horaEtiqueta,
        titulo: `${c.servicioNombre} · ${c.instructorNombre}`,
        servicio: c.servicioNombre,
        instructor: c.instructorNombre,
        inscritos,
        cupoMaximo: c.cupoMaximo,
        estadoClase,
        color: colorClase,
        etiquetaClase,
        esCritica: inscritos <= 1,
      };
    });

    const tasaSubutilizacion =
      totalClases > 0 ? (clasesDeficit / totalClases) * 100 : 0;
    const tasaRedondeada = Math.round(tasaSubutilizacion * 10) / 10;

    // Estado global del día según la presencia de turnos en déficit o atención
    let estadoKpi = "controlado";
    let colorKpi = "#16A34A";
    let etiquetaEstado = "Controlado (4 a 5 inscritos)";

    if (clasesDeficit > 0) {
      estadoKpi = "deficit";
      colorKpi = "#DC2626";
      etiquetaEstado = `Déficit (${clasesDeficit} turno${clasesDeficit > 1 ? "s" : ""} con 0-1 insc.)`;
    } else if (clasesAtencion > 0) {
      estadoKpi = "atencion";
      colorKpi = "#EAB308";
      etiquetaEstado = `Atención (${clasesAtencion} turno${clasesAtencion > 1 ? "s" : ""} con 2-3 insc.)`;
    }

    return {
      clasesDia,
      totalClases,
      clasesCriticas: clasesDeficit,
      clasesControladas,
      clasesAtencion,
      clasesDeficit,
      tasaSubutilizacion: tasaRedondeada,
      estadoKpi,
      colorKpi,
      etiquetaEstado,
      puntosHorarios,
    };
  }, [fechaBarra, clasesFiltradas]);

  // Funciones de navegación temporal para el selector de barras
  const navegarBarraAnterior = () => {
    const d = parsearFechaISO(fechaBarra) || new Date();
    if (modoBarra === "semanal") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setFechaBarra(formatearFechaISO(d));
  };

  const navegarBarraSiguiente = () => {
    const d = parsearFechaISO(fechaBarra) || new Date();
    if (modoBarra === "semanal") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setFechaBarra(formatearFechaISO(d));
  };

  const irAHoyBarra = () => {
    setFechaBarra(formatearFechaISO(new Date()));
  };

  // Máximo para escala Y de las barras
  const maxInscritosBarra = useMemo(() => {
    if (modoBarra === "semanal") {
      return Math.max(
        1,
        ...serieSemanalBarra.map((item) => item.alumnosInscritos),
      );
    }
    return Math.max(
      1,
      ...desgloseDiaBarra.puntosHorarios.map((item) => item.inscritos),
    );
  }, [modoBarra, serieSemanalBarra, desgloseDiaBarra]);

  // 5. Segmentos para el Gráfico de Dona (Estilo "Order Status Distribution")
  const segmentosDona = useMemo(() => {
    if (modoDona === "instructores") {
      const total = Math.max(
        1,
        estadisticasPorInstructor.reduce(
          (acc, i) => acc + i.alumnosInscritos,
          0,
        ),
      );
      return estadisticasPorInstructor.map((inst, idx) => ({
        etiqueta: inst.instructor,
        valor: inst.alumnosInscritos,
        porcentaje: Math.round((inst.alumnosInscritos / total) * 100),
        color: PALETA_DONA_HARA[idx % PALETA_DONA_HARA.length],
        detalle: `${inst.totalClases} clases (${inst.clasesHechas} hechas)`,
      }));
    }

    // Por estado de ocupación de las clases
    let llenas100 = 0;
    let ocupacionAlta = 0;
    let ocupacionParcial = 0;
    let sinInscritos = 0;

    clasesFiltradas.forEach((c) => {
      if (c.esLlena) {
        llenas100 += 1;
      } else if (c.inscritosCount === 0) {
        sinInscritos += 1;
      } else if (c.inscritosCount / c.cupoMaximo >= 0.5) {
        ocupacionAlta += 1;
      } else {
        ocupacionParcial += 1;
      }
    });

    const total = Math.max(1, clasesFiltradas.length);
    return [
      {
        etiqueta: "Cupo 100% Completo",
        valor: llenas100,
        porcentaje: Math.round((llenas100 / total) * 100),
        color: "#16A34A",
        detalle: "Todos los cupos ocupados",
      },
      {
        etiqueta: "Ocupación Media-Alta",
        valor: ocupacionAlta,
        porcentaje: Math.round((ocupacionAlta / total) * 100),
        color: "#4E9F8E",
        detalle: "50% a 99% del cupo",
      },
      {
        etiqueta: "Ocupación Inicial",
        valor: ocupacionParcial,
        porcentaje: Math.round((ocupacionParcial / total) * 100),
        color: "#253B59",
        detalle: "1 a 49% del cupo",
      },
      {
        etiqueta: "Cupos Disponibles (0 insc.)",
        valor: sinInscritos,
        porcentaje: Math.round((sinInscritos / total) * 100),
        color: "#D97706",
        detalle: "Sin alumnos inscritos aún",
      },
    ].filter((s) => s.valor > 0);
  }, [clasesFiltradas, estadisticasPorInstructor, modoDona]);

  // 6. Consumo de Plan y Riesgo de Renovación (Burn-Rate)
  const analisisBurnRate = useMemo(() => {
    // Recopilar estadísticas de asistencia y semanas activas por alumno
    const mapaAsistencia = {};

    clasesFiltradas.forEach((c) => {
      const semanaClave = c.tsInicio
        ? obtenerInicioSemana(new Date(c.tsInicio)).getTime()
        : 0;
      c.inscritosIds.forEach((uid) => {
        if (!mapaAsistencia[uid]) {
          mapaAsistencia[uid] = {
            uid,
            clasesTomadas: 0,
            clasesHechasAsistidas: 0,
            semanasSet: new Set(),
          };
        }
        mapaAsistencia[uid].clasesTomadas += 1;
        if (c.esHecha) mapaAsistencia[uid].clasesHechasAsistidas += 1;
        if (semanaClave) mapaAsistencia[uid].semanasSet.add(semanaClave);
      });
    });

    // Identificar universo de clientes (con clases registradas o usuarios activos en base de datos)
    const uidsSet = new Set([
      ...Object.keys(mapaAsistencia),
      ...usuarios
        .filter(
          (u) =>
            u.rol !== "admin" && (u.estado_cuenta || "activo") === "activo",
        )
        .map((u) => u.id || u.uid),
    ]);

    const listaAlumnos = Array.from(uidsSet)
      .map((uid) => {
        const perfil = mapaUsuarios[uid];
        const asist = mapaAsistencia[uid] || {
          clasesTomadas: 0,
          clasesHechasAsistidas: 0,
          semanasSet: new Set(),
        };

        const clasesPactadas = Number(perfil?.clases_pactadas ?? 0);
        // FMAS: Frecuencia Media de Asistencia Semanal (mínimo 1 para evitar división por 0)
        const semanasActivas = Math.max(1, asist.semanasSet.size);
        const fmasCalculada =
          asist.clasesTomadas > 0
            ? Math.max(
                1,
                Math.round((asist.clasesTomadas / semanasActivas) * 10) / 10,
              )
            : 1;

        // Proyección de Burn-Rate: Semanas = clases_pactadas / FMAS
        const semanasCobertura = clasesPactadas / fmasCalculada;
        const diasCobertura = Math.round(semanasCobertura * 7);

        // Clasificación según los parámetros solicitados:
        // 🟢 Vigente: >= 3 clases  color verde (#16A34A)
        // 🟡 Por Vencer: 1 - 2 clases  color amarillo (#EAB308)
        // 🔴 Renovar: 0 clases color rojo (#DC2626)
        let estado = "vigente";
        let color = "#16A34A";
        let etiquetaEstado = "Vigente";

        if (clasesPactadas === 0) {
          estado = "renovar";
          color = "#DC2626";
          etiquetaEstado = "Renovar";
        } else if (clasesPactadas <= 2) {
          estado = "por_vencer";
          color = "#EAB308";
          etiquetaEstado = "Por Vencer";
        }

        return {
          uid,
          nombre: perfil?.nombre || `Alumno (${uid.slice(0, 6)})`,
          email: perfil?.email || "",
          clasesTomadas: asist.clasesTomadas,
          clasesHechasAsistidas: asist.clasesHechasAsistidas,
          clasesPactadas,
          fmas: fmasCalculada,
          semanasCobertura: Number(semanasCobertura.toFixed(1)),
          diasCobertura,
          estado,
          color,
          etiquetaEstado,
        };
      })
      .filter((al) => al.nombre !== "Alumno Desconocido");

    // Ordenar con prioridad comercial: primero los que requieren renovar (0 clases), luego por vencer (1-2)
    const ordenEstados = { renovar: 0, por_vencer: 1, vigente: 2 };
    listaAlumnos.sort((a, b) => {
      if (ordenEstados[a.estado] !== ordenEstados[b.estado]) {
        return ordenEstados[a.estado] - ordenEstados[b.estado];
      }
      if (a.clasesPactadas !== b.clasesPactadas) {
        return a.clasesPactadas - b.clasesPactadas;
      }
      return b.clasesTomadas - a.clasesTomadas;
    });

    const conteos = {
      todos: listaAlumnos.length,
      vigente: listaAlumnos.filter((a) => a.estado === "vigente").length,
      por_vencer: listaAlumnos.filter((a) => a.estado === "por_vencer").length,
      renovar: listaAlumnos.filter((a) => a.estado === "renovar").length,
    };

    return {
      todos: listaAlumnos,
      conteos,
    };
  }, [clasesFiltradas, mapaUsuarios, usuarios]);

  // Alumnos filtrados por el selector de estado/color
  const alumnosBurnRateFiltrados = useMemo(() => {
    if (filtroEstadoBurnRate === "todos") return analisisBurnRate.todos;
    return analisisBurnRate.todos.filter(
      (a) => a.estado === filtroEstadoBurnRate,
    );
  }, [analisisBurnRate, filtroEstadoBurnRate]);

  // Paginación a no más de 10 clientes por vista
  const totalPaginasBurnRate = Math.max(
    1,
    Math.ceil(alumnosBurnRateFiltrados.length / ELEMENTOS_POR_PAGINA_BURN_RATE),
  );

  const indiceInicioBurnRate =
    (paginaBurnRate - 1) * ELEMENTOS_POR_PAGINA_BURN_RATE;
  const indiceFinBurnRate = Math.min(
    alumnosBurnRateFiltrados.length,
    indiceInicioBurnRate + ELEMENTOS_POR_PAGINA_BURN_RATE,
  );

  const alumnosBurnRatePaginados = useMemo(() => {
    return alumnosBurnRateFiltrados.slice(
      indiceInicioBurnRate,
      indiceFinBurnRate,
    );
  }, [alumnosBurnRateFiltrados, indiceInicioBurnRate, indiceFinBurnRate]);

  // Mantener rankingAlumnos por compatibilidad de referencias
  const rankingAlumnos = alumnosBurnRatePaginados;

  // Descarga en CSV de los contactos (nombres y correos) según el filtro activo
  const descargarContactosBurnRateCSV = () => {
    if (alumnosBurnRateFiltrados.length === 0) return;

    const encabezados = [
      "Nombre",
      "Correo Electrónico",
      "Estado Comercial",
      "Saldo Clases Pactadas",
      "Frecuencia Semanal (FMAS)",
      "Días de Cobertura Estimados",
    ];

    const filas = alumnosBurnRateFiltrados.map((al) => [
      `"${(al.nombre || "").replace(/"/g, '""')}"`,
      `"${(al.email || "").replace(/"/g, '""')}"`,
      `"${al.etiquetaEstado}"`,
      al.clasesPactadas,
      al.fmas,
      al.clasesPactadas === 0 ? "0 (Agotado)" : `~${al.diasCobertura} días`,
    ]);

    const csvContenido =
      "\uFEFF" +
      [encabezados.join(";"), ...filas.map((f) => f.join(";"))].join("\r\n");

    const blob = new Blob([csvContenido], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `contactos_burnrate_${filtroEstadoBurnRate}_${formatearFechaISO(new Date())}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const limpiarFiltros = () => {
    setAnioFiltro("todos");
    setMesFiltro("todos");
    setDiaFiltro("todos");
    setFechaExactaFiltro("");
    setInstructorFiltro("todos");
    setServicioFiltro("todos");
    setAlcanceEstado("todas");
  };

  // Exportación rápida a CSV de los datos por instructor
  // const exportarResumenCSV = () => {
  //   const encabezados = [
  //     "Instructor",
  //     "Clases Hechas",
  //     "Clases Proximas",
  //     "Clases Cupo Completo (100%)",
  //     "Total Clases",
  //     "Alumnos Inscritos",
  //     "Tasa Ocupacion (%)",
  //   ];
  //   const filas = estadisticasPorInstructor.map((i) => [
  //     `"${i.instructor}"`,
  //     i.clasesHechas,
  //     i.clasesProximas,
  //     i.clasesLlenas,
  //     i.totalClases,
  //     i.alumnosInscritos,
  //     `${i.tasaOcupacion}%`,
  //   ]);
  //   const csvContent = [
  //     encabezados.join(","),
  //     ...filas.map((f) => f.join(",")),
  //   ].join("\n");
  //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.setAttribute("download", "dashboard_hara_vitalis.csv");
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // };

  // Coordenadas para el Gráfico Semanal de Doble Curva Suave (Estilo "Revenue Overview" HERO)
  const chartWidth = 880;
  const chartHeight = 260;
  const padLeft = 48;
  const padRight = 32;
  const padTop = 26;
  const padBottom = 48;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;
  const baseLineY = padTop + plotH;

  const maxValorSemana = Math.max(
    1,
    ...serieSemanal.map((d) => Math.max(d.totalClases, d.clasesLlenas)),
  );

  // 7 puntos fijos (Lunes a Domingo) distribuidos a lo ancho del gráfico
  const puntosSemana = serieSemanal.map((item, idx) => {
    const x = padLeft + (idx / 6) * plotW;
    const yLlenas =
      padTop + plotH - (item.clasesLlenas / maxValorSemana) * plotH;
    const yTotales =
      padTop + plotH - (item.totalClases / maxValorSemana) * plotH;
    return {
      ...item,
      x,
      yLlenas,
      yTotales,
    };
  });

  const puntoActivo = diaActivo !== null ? puntosSemana[diaActivo] : null;
  const totalClasesSemana = serieSemanal.reduce(
    (acc, d) => acc + d.totalClases,
    0,
  );

  const pathCurvaTotales = construirCurvaSuaveSVG(puntosSemana, "yTotales");
  const pathAreaTotales = construirAreaSuaveSVG(
    puntosSemana,
    "yTotales",
    baseLineY,
  );
  const pathCurvaLlenas = construirCurvaSuaveSVG(puntosSemana, "yLlenas");
  const pathAreaLlenas = construirAreaSuaveSVG(
    puntosSemana,
    "yLlenas",
    baseLineY,
  );

  // Etiqueta del rango de la semana seleccionada (ej. "09/11 al 15/11/2026")
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 6);
  const etiquetaRangoSemana = `${String(inicioSemana.getDate()).padStart(2, "0")}/${String(inicioSemana.getMonth() + 1).padStart(2, "0")} al ${String(finSemana.getDate()).padStart(2, "0")}/${String(finSemana.getMonth() + 1).padStart(2, "0")}/${finSemana.getFullYear()}`;
  const esSemanaActual =
    obtenerInicioSemana(new Date()).getTime() === inicioSemana.getTime();

  // Avanza o retrocede la semana visible del gráfico
  const moverSemana = (delta) => {
    const nueva = new Date(inicioSemana);
    nueva.setDate(nueva.getDate() + delta * 7);
    setInicioSemana(obtenerInicioSemana(nueva));
    setDiaActivo(null);
  };

  const maxClasesInstructor = Math.max(
    1,
    ...estadisticasPorInstructor.map((item) => item.totalClases),
  );
  const maxInscritosInstructor = Math.max(
    1,
    ...estadisticasPorInstructor.map((item) => item.alumnosInscritos),
  );

  // Cálculo de arcos para el Gráfico de Dona SVG (Estilo "Order Status Distribution")
  const radioDona = 72;
  const circunferenciaDona = 2 * Math.PI * radioDona;
  const totalValoresDona = Math.max(
    1,
    segmentosDona.reduce((acc, s) => acc + s.valor, 0),
  );
  let acumuladoLongitud = 0;
  const arcosDona = segmentosDona.map((seg) => {
    const longitudArco = (seg.valor / totalValoresDona) * circunferenciaDona;
    const dashArray = `${Math.max(0, longitudArco - 3)} ${circunferenciaDona}`;
    const dashOffset = -acumuladoLongitud;
    acumuladoLongitud += longitudArco;
    return {
      ...seg,
      dashArray,
      dashOffset,
    };
  });

  const ragGlobal = obtenerNivelRAG(kpisGlobales.tasaOcupacion);

  if (cargando) {
    return (
      <div className="bi-dashboard bi-dashboard--loading" role="status">
        Cargando métricas en tiempo real del Dashboard...
      </div>
    );
  }

  return (
    <section
      className={`bi-dashboard ${embedded ? "bi-dashboard--embedded" : ""}`}
      aria-label="Dashboard Analítico de Hara Vitalis"
    >
      {/* Aviso de bloqueo en pantallas móviles (visible solo en resoluciones menores a escritorio) */}
      <div className="bi-dashboard__mobile-guard" aria-hidden="true">
        <span className="bi-dashboard__mobile-guard-icon">💻</span>
        <div className="bi-dashboard__mobile-guard-title">
          Vista exclusiva para pantallas grandes de escritorio
        </div>
        <p className="bi-dashboard__mobile-guard-text">
          El Dashboard Analítico contiene gráficos y tablas de inteligencia de
          negocio diseñados exclusivamente para visualizarse en pantallas de
          computador (escritorio).
        </p>
        {onNavigateToClases && (
          <button
            type="button"
            onClick={onNavigateToClases}
            className="admin-btn-action admin-btn-action--primary"
          >
            <span>🗓️</span>
            <span>Volver a Gestión de Clases</span>
          </button>
        )}
      </div>

      {/* Contenido completo exclusivo para pantallas grandes de escritorio */}
      <div className="bi-dashboard__desktop-content">
        {/* Cabecera Estilo SaaS (como en la imagen de referencia) */}
        <header className="bi-saas-header">
          <div>
            <h1 className="bi-saas-header__title">
              Dashboard Analítico de Clases y Alumnos
            </h1>
            <p className="bi-saas-header__subtitle">
              {clasesFiltradas.length} clases analizadas
            </p>
          </div>

          <div className="bi-saas-header__actions">
            {onNavigateToClases && (
              <button
                type="button"
                onClick={onNavigateToClases}
                className="bi-saas-primary-btn"
              >
                <span>+</span>
                <span>Gestión de Clases</span>
              </button>
            )}
            <button
              type="button"
              onClick={limpiarFiltros}
              className="bi-saas-icon-btn"
              title="Restablecer todos los filtros"
              aria-label="Restablecer filtros"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            {/* <button
              type="button"
              onClick={exportarResumenCSV}
              className="bi-saas-icon-btn"
              title="Exportar resumen a CSV"
              aria-label="Exportar resumen a CSV"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button> */}
          </div>
        </header>

        {/* Barra Compacta de Filtros Adaptativos (Día, Mes, Año, Instructor, Servicio y Alcance) */}
        <div
          className="bi-filter-panel"
          role="region"
          aria-label="Filtros del Dashboard"
        >
          <div className="bi-filter-panel__top">
            <div
              className="bi-scope-group"
              role="group"
              aria-label="Filtrar por estado de realización de la clase"
            >
              <span className="bi-filter-label">Alcance:</span>
              <div className="bi-segmented-tabs">
                {[
                  { id: "todas", label: "Todas" },
                  { id: "hechas", label: "✅ Solo Hechas" },
                  { id: "proximas", label: "⏳ Próximas" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={alcanceEstado === item.id}
                    onClick={() => setAlcanceEstado(item.id)}
                    className={`bi-segmented-tab ${alcanceEstado === item.id ? "bi-segmented-tab--active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bi-filter-grid">
            <div className="bi-filter-field">
              <label htmlFor="bi-select-anio" className="bi-filter-label">
                Año
              </label>
              <select
                id="bi-select-anio"
                aria-label="Filtrar por año"
                value={anioFiltro}
                onChange={(e) => {
                  setAnioFiltro(e.target.value);
                  setFechaExactaFiltro("");
                }}
                className="bi-filter-select"
              >
                <option value="todos">Todos los años</option>
                {opcionesAnios.map((anio) => (
                  <option key={anio} value={String(anio)}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>

            <div className="bi-filter-field">
              <label htmlFor="bi-select-mes" className="bi-filter-label">
                Mes
              </label>
              <select
                id="bi-select-mes"
                aria-label="Filtrar por mes"
                value={mesFiltro}
                onChange={(e) => {
                  setMesFiltro(e.target.value);
                  setDiaFiltro("todos");
                  setFechaExactaFiltro("");
                }}
                className="bi-filter-select"
              >
                <option value="todos">Todos los meses</option>
                {NOMBRES_MESES.map((nombreMes, idx) => (
                  <option key={nombreMes} value={String(idx)}>
                    {nombreMes}
                  </option>
                ))}
              </select>
            </div>

            <div className="bi-filter-field">
              <label htmlFor="bi-select-dia" className="bi-filter-label">
                Día del mes
              </label>
              <select
                id="bi-select-dia"
                aria-label="Filtrar por día del mes"
                value={diaFiltro}
                onChange={(e) => {
                  setDiaFiltro(e.target.value);
                  setFechaExactaFiltro("");
                }}
                className="bi-filter-select"
              >
                <option value="todos">Todos los días</option>
                {opcionesDiasDelMes.map((d) => (
                  <option key={d} value={String(d)}>
                    Día {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="bi-filter-field">
              <label htmlFor="bi-input-fecha" className="bi-filter-label">
                Fecha específica
              </label>
              <input
                id="bi-input-fecha"
                type="date"
                aria-label="Filtrar por fecha específica"
                value={fechaExactaFiltro}
                onChange={(e) => {
                  setFechaExactaFiltro(e.target.value);
                  if (e.target.value) {
                    setAnioFiltro("todos");
                    setMesFiltro("todos");
                    setDiaFiltro("todos");
                  }
                }}
                className="bi-filter-select"
              />
            </div>

            <div className="bi-filter-field">
              <label htmlFor="bi-select-instructor" className="bi-filter-label">
                Instructor
              </label>
              <select
                id="bi-select-instructor"
                aria-label="Filtrar por instructor"
                value={instructorFiltro}
                onChange={(e) => setInstructorFiltro(e.target.value)}
                className="bi-filter-select"
              >
                <option value="todos">Todos los instructores</option>
                {opcionesInstructores.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div className="bi-filter-field">
              <label htmlFor="bi-select-servicio" className="bi-filter-label">
                Tipo de Servicio
              </label>
              <select
                id="bi-select-servicio"
                aria-label="Filtrar por tipo de servicio"
                value={servicioFiltro}
                onChange={(e) => setServicioFiltro(e.target.value)}
                className="bi-filter-select"
              >
                <option value="todos">Todos los servicios</option>
                {opcionesServicios.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FILA 1: 4 Tarjetas KPI Horizontales con Ícono Cuadrado a la Izquierda (como en la imagen) */}
        <div className="bi-saas-kpi-grid">
          <article className="bi-saas-kpi-card">
            <div className="bi-saas-kpi-card__icon-box" aria-hidden="true">
              <IconoAlumnosInscritosAltA size={30} />
            </div>
            <div className="bi-saas-kpi-card__body">
              <span className="bi-saas-kpi-card__label">ALUMNOS INSCRITOS</span>
              <div className="bi-saas-kpi-card__value">
                {kpisGlobales.totalInscritos.toLocaleString("es-CL")}
              </div>
              <span className="bi-saas-kpi-card__trend bi-saas-kpi-card__trend--up">
                ↑ {kpisGlobales.promedioAlumnosPorClase} prom./clase •{" "}
                {kpisGlobales.alumnosUnicosPeriodo} únicos
              </span>
            </div>
          </article>

          <article className="bi-saas-kpi-card">
            <div className="bi-saas-kpi-card__icon-box" aria-hidden="true">
              <IconoClasesHechasAltA size={30} />
            </div>
            <div className="bi-saas-kpi-card__body">
              <span className="bi-saas-kpi-card__label">CLASES HECHAS</span>
              <div className="bi-saas-kpi-card__value">
                {kpisGlobales.clasesHechas.toLocaleString("es-CL")}
              </div>
              <span className="bi-saas-kpi-card__trend bi-saas-kpi-card__trend--up">
                ↑ {kpisGlobales.porcentajeClasesHechas}% dictadas •{" "}
                {kpisGlobales.clasesProximas} próximas
              </span>
            </div>
          </article>

          <article className="bi-saas-kpi-card">
            <div className="bi-saas-kpi-card__icon-box" aria-hidden="true">
              <IconoCupoCompletoAltA size={30} />
            </div>
            <div className="bi-saas-kpi-card__body">
              <span className="bi-saas-kpi-card__label">
                CLASES CUPO COMPLETO
              </span>
              <div className="bi-saas-kpi-card__value">
                {kpisGlobales.clasesLlenas.toLocaleString("es-CL")}
              </div>
              <span
                className={`bi-saas-kpi-card__trend ${kpisGlobales.porcentajeClasesLlenas >= 30 ? "bi-saas-kpi-card__trend--up" : "bi-saas-kpi-card__trend--down"}`}
              >
                {kpisGlobales.porcentajeClasesLlenas >= 30 ? "↑" : "↓"}{" "}
                {kpisGlobales.porcentajeClasesLlenas}% ocuparon el 100%
              </span>
            </div>
          </article>

          <article className="bi-saas-kpi-card">
            <div className="bi-saas-kpi-card__icon-box" aria-hidden="true">
              <IconoOcupacionPromedioAltA size={30} />
            </div>
            <div className="bi-saas-kpi-card__body">
              <span className="bi-saas-kpi-card__label">
                OCUPACIÓN PROMEDIO
              </span>
              <div className="bi-saas-kpi-card__value">
                {kpisGlobales.tasaOcupacion}%
              </div>
              <span
                className={`bi-saas-kpi-card__trend ${kpisGlobales.tasaOcupacion >= 50 ? "bi-saas-kpi-card__trend--up" : "bi-saas-kpi-card__trend--down"}`}
              >
                {kpisGlobales.tasaOcupacion >= 50 ? "↑" : "↓"}{" "}
                {ragGlobal.etiqueta} ({kpisGlobales.totalInscritos}/
                {kpisGlobales.totalCuposOfertados} cupos)
              </span>
            </div>
          </article>
        </div>

        {/* FILA 2 (HERO): Gráfico de Doble Curva Suave Semanal a Ancho Completo (100%) */}
        <div className="bi-hero-chart-row">
          <article className="bi-chart-card bi-chart-card--hero">
            <header className="bi-chart-card__header">
              <div className="bi-card-title-group">
                <div className="bi-card-header-icon" aria-hidden="true">
                  <IconoSemanaClasesAltA size={26} />
                </div>
                <div>
                  <h2 className="bi-chart-card__title">
                    Semana de Clases y Cupos Completos (100% Llenas)
                  </h2>
                  <p className="bi-chart-card__subtitle">
                    Curva azul: Total de clases por día • Curva esmeralda:
                    Clases con el 100% de los cupos ocupados. Pasa el puntero
                    sobre un día para ver el detalle.
                  </p>
                </div>
              </div>
              <div className="bi-segmented-tabs">
                {[
                  { id: "todas", label: "Todas" },
                  { id: "hechas", label: "Hechas" },
                  { id: "proximas", label: "Próximas" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={alcanceEstado === tab.id}
                    onClick={() => setAlcanceEstado(tab.id)}
                    className={`bi-segmented-tab ${alcanceEstado === tab.id ? "bi-segmented-tab--active" : ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {/* Selector configurable de la semana a visualizar */}
            <div
              className="bi-week-nav"
              role="group"
              aria-label="Configurar semana del gráfico"
            >
              <button
                type="button"
                className="bi-week-nav__btn"
                onClick={() => moverSemana(-1)}
                aria-label="Semana anterior"
              >
                ‹
              </button>
              <span className="bi-week-nav__label" aria-live="polite">
                Semana del {etiquetaRangoSemana}
              </span>
              <button
                type="button"
                className="bi-week-nav__btn"
                onClick={() => moverSemana(1)}
                aria-label="Semana siguiente"
              >
                ›
              </button>
              <input
                type="date"
                className="bi-week-nav__date"
                aria-label="Elegir una fecha para ver su semana"
                value={formatearFechaISO(inicioSemana)}
                onChange={(e) => {
                  const fecha = parsearFechaISO(e.target.value);
                  if (fecha) {
                    setInicioSemana(obtenerInicioSemana(fecha));
                    setDiaActivo(null);
                  }
                }}
              />
              <button
                type="button"
                className="bi-week-nav__today"
                onClick={() => {
                  setInicioSemana(obtenerInicioSemana(new Date()));
                  setDiaActivo(null);
                }}
                disabled={esSemanaActual}
              >
                Semana actual
              </button>
            </div>

            <div
              className="bi-line-chart-wrapper"
              onMouseLeave={() => setDiaActivo(null)}
            >
              <div className="bi-line-chart-stage">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="bi-line-chart-svg"
                  role="img"
                  aria-label="Gráfico de línea semanal de clases con cupo completo por día"
                >
                  <defs>
                    <linearGradient
                      id="gradTotalClases"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#253B59"
                        stopOpacity="0.22"
                      />
                      <stop
                        offset="100%"
                        stopColor="#CED0F2"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradClasesLlenas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#4E9F8E"
                        stopOpacity="0.28"
                      />
                      <stop
                        offset="100%"
                        stopColor="#4E9F8E"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Líneas guía horizontales punteadas estilo SaaS */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padTop + plotH * (1 - ratio);
                    const val = Math.round(maxValorSemana * ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={chartWidth - padRight}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="#64748B"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Línea guía vertical del día señalado */}
                  {puntoActivo && (
                    <line
                      x1={puntoActivo.x}
                      y1={padTop}
                      x2={puntoActivo.x}
                      y2={baseLineY}
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Áreas suaves con gradiente */}
                  <path d={pathAreaTotales} fill="url(#gradTotalClases)" />
                  <path d={pathAreaLlenas} fill="url(#gradClasesLlenas)" />

                  {/* Curva suave 1: Total de clases del día */}
                  <path
                    d={pathCurvaTotales}
                    fill="none"
                    stroke="#253B59"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />

                  {/* Curva suave 2: Clases que ocuparon el 100% de sus cupos */}
                  <path
                    d={pathCurvaLlenas}
                    fill="none"
                    stroke="#4E9F8E"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />

                  {/* Puntos interactivos por día + etiquetas del eje X */}
                  {puntosSemana.map((p, idx) => {
                    const activo = diaActivo === idx;
                    const anchoColumna = plotW / 6;
                    return (
                      <g
                        key={p.clave}
                        className={`bi-chart-point ${activo ? "bi-chart-point--active" : ""}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${p.diaLargo} ${p.fechaTexto}: ${p.totalClases} clases, ${p.clasesLlenas} con cupo completo`}
                        onMouseEnter={() => setDiaActivo(idx)}
                        onFocus={() => setDiaActivo(idx)}
                        onBlur={() => setDiaActivo(null)}
                      >
                        {/* Zona invisible de detección (columna completa del día) */}
                        <rect
                          x={p.x - anchoColumna / 2}
                          y={padTop - 10}
                          width={anchoColumna}
                          height={plotH + 20}
                          fill="transparent"
                        />
                        <circle
                          className="bi-chart-point__dot"
                          cx={p.x}
                          cy={p.yTotales}
                          r={activo ? 6.5 : 4}
                          fill="#253B59"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <circle
                          className="bi-chart-point__dot"
                          cx={p.x}
                          cy={p.yLlenas}
                          r={activo ? 7.5 : 5}
                          fill="#16A34A"
                          stroke="#FFFFFF"
                          strokeWidth="1.8"
                        />
                        <text
                          x={p.x}
                          y={chartHeight - 20}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={activo ? "800" : "600"}
                          fill={activo ? "#253B59" : "#64748B"}
                        >
                          {p.diaCorto}
                        </text>
                        <text
                          x={p.x}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#94A3B8"
                        >
                          {p.fechaCorta}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip flotante con los datos del día señalado */}
                {puntoActivo && (
                  <div
                    className={`bi-chart-tooltip bi-chart-tooltip--${diaActivo <= 1 ? "start" : diaActivo >= 5 ? "end" : "center"}`}
                    role="tooltip"
                    style={{
                      left: `${(puntoActivo.x / chartWidth) * 100}%`,
                    }}
                  >
                    <div className="bi-chart-tooltip__title">
                      {puntoActivo.diaLargo} {puntoActivo.fechaTexto}
                    </div>
                    <div className="bi-chart-tooltip__row">
                      <span
                        className="bi-chart-tooltip__swatch"
                        style={{ backgroundColor: "#253B59" }}
                      />
                      <span>Total de clases:</span>
                      <strong>{puntoActivo.totalClases}</strong>
                    </div>
                    <div className="bi-chart-tooltip__row">
                      <span
                        className="bi-chart-tooltip__swatch"
                        style={{ backgroundColor: "#16A34A" }}
                      />
                      <span>Clases con cupo completo:</span>
                      <strong>
                        {puntoActivo.clasesLlenas} (
                        {puntoActivo.porcentajeLlenas}%)
                      </strong>
                    </div>
                    <div className="bi-chart-tooltip__row">
                      <span
                        className="bi-chart-tooltip__swatch"
                        style={{ backgroundColor: "#CED0F2" }}
                      />
                      <span>Alumnos inscritos:</span>
                      <strong>
                        {puntoActivo.alumnosInscritos} /{" "}
                        {puntoActivo.cuposOfertados} cupos (
                        {puntoActivo.tasaOcupacionDia}%)
                      </strong>
                    </div>
                    <div className="bi-chart-tooltip__footer">
                      Horarios llenos:{" "}
                      <strong>
                        {puntoActivo.horasLlenas.length > 0
                          ? puntoActivo.horasLlenas.join(", ")
                          : "Ninguno"}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {totalClasesSemana === 0 && (
              <p className="bi-week-empty-note" role="status">
                No hay clases registradas en esta semana. Usa ‹ › o el selector
                de fecha para ver otra semana.
              </p>
            )}
          </article>
        </div>

        {/* FILA 3: Gráfico de Columnas Verticales Redondeadas ("User Growth") + Gráfico de Dona Segmentado ("Order Status Distribution") */}
        <div className="bi-charts-grid-two">
          {/* Izquierda: Columnas Verticales Redondeadas de Alumnos Inscritos por Día / Mes / Año */}
          <article className="bi-chart-card">
            <header className="bi-chart-card__header">
              <div className="bi-card-title-group">
                <div className="bi-card-header-icon" aria-hidden="true">
                  <IconoEvolucionAlumnosAltA size={26} />
                </div>
                <div>
                  <h2 className="bi-chart-card__title">
                    Alumnos Inscritos (Por{" "}
                    {modoBarra === "semanal" ? "Semana" : "Día"})
                  </h2>
                  <p className="bi-chart-card__subtitle">
                    {modoBarra === "semanal"
                      ? "Distribución semanal con color uniforme y subíndice de alumnos inscritos."
                      : "Desglose por horario y evaluación de Tasa de Subutilización Crítica."}
                  </p>
                </div>
              </div>
              <div className="bi-segmented-tabs">
                {[
                  { id: "semanal", label: "Semanal" },
                  { id: "dia", label: "Día" },
                ].map((modo) => (
                  <button
                    key={modo.id}
                    type="button"
                    aria-pressed={modoBarra === modo.id}
                    onClick={() => setModoBarra(modo.id)}
                    className={`bi-segmented-tab ${modoBarra === modo.id ? "bi-segmented-tab--active" : ""}`}
                  >
                    {modo.label}
                  </button>
                ))}
              </div>
            </header>

            {/* Selector de periodo: Selección de Semana o Día específico */}
            <div className="bi-bar-selector">
              <div className="bi-bar-selector__nav-group">
                <button
                  type="button"
                  onClick={navegarBarraAnterior}
                  className="bi-btn-nav"
                  aria-label={
                    modoBarra === "semanal"
                      ? "Semana anterior de barras"
                      : "Día anterior de barras"
                  }
                  title={
                    modoBarra === "semanal"
                      ? "Retroceder 1 semana"
                      : "Retroceder 1 día"
                  }
                >
                  ‹
                </button>
                <span className="bi-bar-selector__period-text">
                  {modoBarra === "semanal" ? textoSemanaBarra : textoDiaBarra}
                </span>
                <button
                  type="button"
                  onClick={navegarBarraSiguiente}
                  className="bi-btn-nav"
                  aria-label={
                    modoBarra === "semanal"
                      ? "Semana siguiente de barras"
                      : "Día siguiente de barras"
                  }
                  title={
                    modoBarra === "semanal"
                      ? "Avanzar 1 semana"
                      : "Avanzar 1 día"
                  }
                >
                  ›
                </button>
              </div>
              <div className="bi-bar-selector__input-group">
                <label
                  htmlFor="selector-fecha-barra"
                  className="bi-bar-selector__label"
                >
                  {modoBarra === "semanal" ? "Elegir semana:" : "Elegir día:"}
                </label>
                <input
                  id="selector-fecha-barra"
                  type="date"
                  value={fechaBarra}
                  onChange={(e) => {
                    if (e.target.value) setFechaBarra(e.target.value);
                  }}
                  className="bi-date-input bi-bar-selector__input"
                />
                <button
                  type="button"
                  onClick={irAHoyBarra}
                  className="bi-btn-today"
                  title="Volver a la fecha actual"
                >
                  Hoy
                </button>
              </div>
            </div>

            {/* Vista 1: Semanal (Barras con color uniforme y subíndice de alumnos inscritos) */}
            {modoBarra === "semanal" && (
              <div className="bi-vertical-chart-container">
                {/* Eje Y numérico a la izquierda */}
                <div className="bi-vertical-chart__yaxis" aria-hidden="true">
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                    <span key={ratio}>
                      {Math.round(maxInscritosBarra * ratio)}
                    </span>
                  ))}
                </div>

                {/* Área de columnas semanales (mismo color corporativo uniforme #253B59) */}
                <div
                  className="bi-vertical-chart__bars"
                  role="list"
                  aria-label="Evolución de alumnos inscritos agrupada por semana"
                >
                  {serieSemanalBarra.map((punto) => {
                    const alturaPct = Math.max(
                      8,
                      Math.round(
                        (punto.alumnosInscritos / maxInscritosBarra) * 100,
                      ),
                    );
                    return (
                      <div
                        key={punto.clave}
                        className="bi-vbar-col"
                        role="listitem"
                      >
                        <div
                          className="bi-vbar-col__track"
                          title={`${punto.etiquetaCompleta}: ${punto.alumnosInscritos} alumnos inscritos en ${punto.totalClases} clases`}
                        >
                          <div
                            className="bi-vbar-col__fill bi-vbar-col__fill--uniforme"
                            style={{
                              height: `${alturaPct}%`,
                              backgroundColor: "#253B59",
                            }}
                          >
                            <span className="bi-vbar-col__badge">
                              {punto.alumnosInscritos}
                            </span>
                          </div>
                        </div>
                        <span className="bi-vbar-col__label">
                          {punto.etiqueta}
                        </span>
                        <span className="bi-vbar-col__subindex">
                          {punto.alumnosInscritos} inscritos
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vista 2: Por Día (Desglose por horario y Tasa de Subutilización Crítica) */}
            {modoBarra === "dia" && (
              <div className="bi-daily-bars-wrapper">
                {/* Banner de KPI: Evaluación de Rendimiento y Subutilización Crítica */}
                <div
                  className={`bi-subutilizacion-banner bi-subutilizacion-banner--${desgloseDiaBarra.estadoKpi}`}
                  style={{ borderColor: desgloseDiaBarra.colorKpi }}
                >
                  <div className="bi-subutilizacion-banner__header">
                    <div className="bi-subutilizacion-banner__title-group">
                      <span
                        className="bi-subutilizacion-banner__dot"
                        style={{ backgroundColor: desgloseDiaBarra.colorKpi }}
                        aria-hidden="true"
                      />
                      <h3 className="bi-subutilizacion-banner__title">
                        Evaluación de Rendimiento y Tasa de Subutilización
                        Crítica
                      </h3>
                    </div>
                    <span
                      className="bi-subutilizacion-badge"
                      style={{
                        color: desgloseDiaBarra.colorKpi,
                        borderColor: desgloseDiaBarra.colorKpi,
                        backgroundColor:
                          desgloseDiaBarra.estadoKpi === "controlado"
                            ? "#F0FDF4"
                            : desgloseDiaBarra.estadoKpi === "atencion"
                              ? "#FEFCE8"
                              : "#FEF2F2",
                      }}
                    >
                      {desgloseDiaBarra.etiquetaEstado}
                    </span>
                  </div>

                  <div className="bi-subutilizacion-banner__body">
                    {/* Tarjetas de los 3 parámetros de rendimiento */}
                    <div className="bi-status-pills-row">
                      <div className="bi-status-pill bi-status-pill--controlado">
                        <span
                          className="bi-status-pill__icon"
                          aria-hidden="true"
                        >
                          🟢
                        </span>
                        <div className="bi-status-pill__info">
                          <strong className="bi-status-pill__label">
                            Controlado (4 a 5 inscritos)
                          </strong>
                          <span className="bi-status-pill__count">
                            {desgloseDiaBarra.clasesControladas} clases
                          </span>
                        </div>
                      </div>
                      <div className="bi-status-pill bi-status-pill--atencion">
                        <span
                          className="bi-status-pill__icon"
                          aria-hidden="true"
                        >
                          🟡
                        </span>
                        <div className="bi-status-pill__info">
                          <strong className="bi-status-pill__label">
                            Atención (2 a 3 inscritos)
                          </strong>
                          <span className="bi-status-pill__count">
                            {desgloseDiaBarra.clasesAtencion} clases
                          </span>
                        </div>
                      </div>
                      <div className="bi-status-pill bi-status-pill--deficit">
                        <span
                          className="bi-status-pill__icon"
                          aria-hidden="true"
                        >
                          🔴
                        </span>
                        <div className="bi-status-pill__info">
                          <strong className="bi-status-pill__label">
                            Déficit (0 a 1 inscrito)
                          </strong>
                          <span className="bi-status-pill__count">
                            {desgloseDiaBarra.clasesDeficit} clases
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bi-subutilizacion-metric">
                      <span
                        className="bi-subutilizacion-metric__value"
                        style={{ color: desgloseDiaBarra.colorKpi }}
                      >
                        {desgloseDiaBarra.tasaSubutilizacion}%
                      </span>
                      <span className="bi-subutilizacion-metric__caption">
                        Tasa de Subutilización Crítica:{" "}
                        {desgloseDiaBarra.clasesCriticas} de{" "}
                        {desgloseDiaBarra.totalClases} clases operaron en
                        déficit (≤ 1 alumno, ≤ 20% ocupación)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gráficos de barra por horario (estrictamente solo gráficos de barra) */}
                {desgloseDiaBarra.totalClases === 0 ? (
                  <div className="bi-empty-state">
                    No hay clases registradas para el día {textoDiaBarra}. Usa
                    las flechas o el selector para explorar otra fecha.
                  </div>
                ) : (
                  <div className="bi-vertical-chart-container">
                    {/* Eje Y numérico a la izquierda */}
                    <div
                      className="bi-vertical-chart__yaxis"
                      aria-hidden="true"
                    >
                      {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                        <span key={ratio}>
                          {Math.round(maxInscritosBarra * ratio)}
                        </span>
                      ))}
                    </div>

                    {/* Área de columnas por horario con el color individual según su nivel de inscritos */}
                    <div
                      className="bi-vertical-chart__bars"
                      role="list"
                      aria-label="Desglose de alumnos inscritos por horario"
                    >
                      {desgloseDiaBarra.puntosHorarios.map((punto) => {
                        const alturaPct = Math.max(
                          8,
                          Math.round(
                            (punto.inscritos / maxInscritosBarra) * 100,
                          ),
                        );
                        return (
                          <div
                            key={punto.id}
                            className="bi-vbar-col"
                            role="listitem"
                          >
                            <div
                              className="bi-vbar-col__track"
                              title={`${punto.hora} - ${punto.titulo}: ${punto.inscritos} de ${punto.cupoMaximo} cupos ocupados (${punto.etiquetaClase})`}
                            >
                              <div
                                className="bi-vbar-col__fill"
                                style={{
                                  height: `${alturaPct}%`,
                                  backgroundColor: punto.color,
                                  backgroundImage: "none",
                                }}
                              >
                                <span className="bi-vbar-col__badge">
                                  {punto.inscritos}
                                </span>
                              </div>
                            </div>
                            <span className="bi-vbar-col__label">
                              {punto.hora}
                            </span>
                            <span
                              className="bi-vbar-col__subindex bi-vbar-col__subindex--schedule"
                              title={`${punto.titulo} · ${punto.etiquetaClase}`}
                            >
                              {punto.inscritos}/{punto.cupoMaximo} cupos
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>

          {/* Derecha: Gráfico de Dona Segmentado (Estilo "Order Status Distribution") */}
          <article className="bi-chart-card">
            <header className="bi-chart-card__header">
              <div className="bi-card-title-group">
                <div className="bi-card-header-icon" aria-hidden="true">
                  <IconoDistribucionDonaAltA size={26} />
                </div>
                <div>
                  <h2 className="bi-chart-card__title">
                    Distribución de Ocupación e Instructores
                  </h2>
                  <p className="bi-chart-card__subtitle">
                    Proporción de clases según nivel de cupos ocupados o por
                    instructor.
                  </p>
                </div>
              </div>
              <div className="bi-segmented-tabs">
                <button
                  type="button"
                  onClick={() => setModoDona("ocupacion")}
                  className={`bi-segmented-tab ${modoDona === "ocupacion" ? "bi-segmented-tab--active" : ""}`}
                >
                  Cupos
                </button>
                <button
                  type="button"
                  onClick={() => setModoDona("instructores")}
                  className={`bi-segmented-tab ${modoDona === "instructores" ? "bi-segmented-tab--active" : ""}`}
                >
                  Instructores
                </button>
              </div>
            </header>

            {arcosDona.length === 0 ? (
              <div className="bi-empty-state">
                Sin datos suficientes para el gráfico circular.
              </div>
            ) : (
              <div className="bi-donut-layout">
                <div className="bi-donut-svg-box">
                  <svg
                    viewBox="0 0 200 200"
                    className="bi-donut-svg"
                    role="img"
                    aria-label="Gráfico de dona de distribución de clases y cupos"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r={radioDona}
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="26"
                    />
                    {arcosDona.map((arco) => (
                      <circle
                        key={arco.etiqueta}
                        cx="100"
                        cy="100"
                        r={radioDona}
                        fill="none"
                        stroke={arco.color}
                        strokeWidth="26"
                        strokeDasharray={arco.dashArray}
                        strokeDashoffset={arco.dashOffset}
                        transform="rotate(-90 100 100)"
                      >
                        <title>{`${arco.etiqueta}: ${arco.valor} (${arco.porcentaje}%)`}</title>
                      </circle>
                    ))}
                    <text
                      x="100"
                      y="96"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="800"
                      fill="#253B59"
                    >
                      {modoDona === "ocupacion"
                        ? `${kpisGlobales.tasaOcupacion}%`
                        : kpisGlobales.totalInscritos}
                    </text>
                    <text
                      x="100"
                      y="116"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#64748B"
                    >
                      {modoDona === "ocupacion" ? "OCUPACIÓN" : "INSCRITOS"}
                    </text>
                  </svg>
                </div>

                <div className="bi-donut-legend">
                  {arcosDona.map((arco) => (
                    <div key={arco.etiqueta} className="bi-donut-legend__item">
                      <span
                        className="bi-donut-legend__swatch"
                        style={{ backgroundColor: arco.color }}
                      />
                      <div className="bi-donut-legend__info">
                        <div className="bi-donut-legend__top">
                          <span className="bi-donut-legend__name">
                            {arco.etiqueta}
                          </span>
                          <strong className="bi-donut-legend__pct">
                            {arco.valor} ({arco.porcentaje}%)
                          </strong>
                        </div>
                        <span className="bi-donut-legend__sub">
                          {arco.detalle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        {/* FILA 4: Detalle Comparativo de Clases Hechas por Instructor y Alumnos Inscritos por Instructor */}
        <div className="bi-charts-grid-two">
          {/* Clases Hechas por Instructor */}
          <article className="bi-chart-card">
            <header className="bi-chart-card__header">
              <div className="bi-card-title-group">
                <div className="bi-card-header-icon" aria-hidden="true">
                  <IconoActividadInstructoresAltA size={26} />
                </div>
                <div>
                  <h2 className="bi-chart-card__title">
                    Clases Hechas por Instructor
                  </h2>
                  <p className="bi-chart-card__subtitle">
                    Desglose de clases dictadas, próximas y con cupo 100%
                    completo.
                  </p>
                </div>
              </div>
            </header>

            <div
              className="bi-bar-list"
              role="list"
              aria-label="Clases hechas por instructor"
            >
              {estadisticasPorInstructor.map((item) => {
                const anchoHechas = Math.round(
                  (item.clasesHechas / maxClasesInstructor) * 100,
                );
                const anchoProximas = Math.round(
                  (item.clasesProximas / maxClasesInstructor) * 100,
                );
                return (
                  <div
                    key={item.instructor}
                    className="bi-bar-item"
                    role="listitem"
                  >
                    <div className="bi-bar-item__header">
                      <span className="bi-bar-item__name">
                        {item.instructor}
                      </span>
                      <div className="bi-bar-item__badges">
                        <span className="bi-stat-pill bi-stat-pill--done">
                          ✅ {item.clasesHechas} hechas
                        </span>
                        <span className="bi-stat-pill bi-stat-pill--upcoming">
                          ⏳ {item.clasesProximas} próximas
                        </span>
                        <span className="bi-stat-pill bi-stat-pill--full">
                          🔥 {item.clasesLlenas} llenas
                        </span>
                      </div>
                    </div>

                    <div className="bi-bar-track" aria-hidden="true">
                      <div
                        className="bi-bar-fill bi-bar-fill--done"
                        style={{ width: `${anchoHechas}%` }}
                      />
                      <div
                        className="bi-bar-fill bi-bar-fill--upcoming"
                        style={{ width: `${anchoProximas}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Alumnos Inscritos por Instructor */}
          <article className="bi-chart-card">
            <header className="bi-chart-card__header">
              <div className="bi-card-title-group">
                <div className="bi-card-header-icon" aria-hidden="true">
                  <IconoAlumnosInscritosAltA size={26} />
                </div>
                <div>
                  <h2 className="bi-chart-card__title">
                    Alumnos Inscritos por Instructor
                  </h2>
                  <p className="bi-chart-card__subtitle">
                    Total de alumnos inscritos, promedio por clase y tasa de
                    ocupación.
                  </p>
                </div>
              </div>
            </header>

            <div
              className="bi-bar-list"
              role="list"
              aria-label="Alumnos inscritos por instructor"
            >
              {estadisticasPorInstructor.map((item) => {
                const anchoInscritos = Math.round(
                  (item.alumnosInscritos / maxInscritosInstructor) * 100,
                );
                const ragInst = obtenerNivelRAG(item.tasaOcupacion);
                return (
                  <div
                    key={item.instructor}
                    className="bi-bar-item"
                    role="listitem"
                  >
                    <div className="bi-bar-item__header">
                      <span className="bi-bar-item__name">
                        {item.instructor}
                      </span>
                      <div className="bi-bar-item__badges">
                        <span className="bi-stat-pill bi-stat-pill--primary">
                          👥 {item.alumnosInscritos} inscritos
                        </span>
                        <span
                          className={`bi-rag-pill bi-rag-pill--${ragInst.nivel}`}
                        >
                          {item.tasaOcupacion}% ocupación
                        </span>
                      </div>
                    </div>

                    <div className="bi-bar-track" aria-hidden="true">
                      <div
                        className="bi-bar-fill bi-bar-fill--enrolled"
                        style={{ width: `${anchoInscritos}%` }}
                      />
                    </div>

                    <div className="bi-bar-item__footer">
                      <span>
                        Promedio: <strong>{item.promedioPorClase}</strong>{" "}
                        alumnos/clase
                      </span>
                      <span>
                        Alumnos únicos:{" "}
                        <strong>{item.alumnosUnicosCount}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {/* FILA 5: Consumo de Plan y Riesgo de Renovación (Burn-Rate) */}
        <article className="bi-chart-card">
          <header className="bi-chart-card__header">
            <div className="bi-card-title-group">
              <div className="bi-card-header-icon" aria-hidden="true">
                <IconoAlumnosRenovacionAltA size={26} />
              </div>
              <div>
                <h2 className="bi-chart-card__title">
                  Consumo de Plan y Riesgo de Renovación (Burn-Rate)
                </h2>
                <p className="bi-chart-card__subtitle">
                  Cruza el saldo actual de clases pactadas con la frecuencia
                  semanal (FMAS) para proyectar días de cobertura y activar el
                  contacto comercial antes de llegar a 0 clases.
                </p>
              </div>
            </div>
          </header>

          {/* Selector de Agrupación por Estado / Color */}
          <div className="bi-burnrate-toolbar">
            <div
              className="bi-segmented-tabs"
              role="tablist"
              aria-label="Filtrar clientes por estado de renovación"
            >
              {[
                {
                  id: "todos",
                  label: "Todos",
                  count: analisisBurnRate.conteos.todos,
                  dot: null,
                },
                {
                  id: "vigente",
                  label: "Vigente (≥ 3 clases)",
                  count: analisisBurnRate.conteos.vigente,
                  dot: "🟢",
                },
                {
                  id: "por_vencer",
                  label: "Por Vencer (1-2 clases)",
                  count: analisisBurnRate.conteos.por_vencer,
                  dot: "🟡",
                },
                {
                  id: "renovar",
                  label: "Renovar (0 clases)",
                  count: analisisBurnRate.conteos.renovar,
                  dot: "🔴",
                },
              ].map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  role="tab"
                  aria-selected={filtroEstadoBurnRate === opcion.id}
                  onClick={() => {
                    setFiltroEstadoBurnRate(opcion.id);
                    setPaginaBurnRate(1);
                  }}
                  className={`bi-segmented-tab ${filtroEstadoBurnRate === opcion.id ? "bi-segmented-tab--active" : ""}`}
                >
                  {opcion.dot && (
                    <span className="bi-tab-dot" aria-hidden="true">
                      {opcion.dot}
                    </span>
                  )}
                  <span>{opcion.label}</span>
                  <span className="bi-tab-count">({opcion.count})</span>
                </button>
              ))}
            </div>

            {/* Botón para descargar contactos (nombres y correos) según el filtro activo */}
            <button
              type="button"
              onClick={descargarContactosBurnRateCSV}
              disabled={alumnosBurnRateFiltrados.length === 0}
              className="bi-btn-export-csv"
              title={`Descargar lista de ${alumnosBurnRateFiltrados.length} contactos en formato CSV`}
              aria-label="Descargar correos y nombres en CSV"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exportar Correos ({alumnosBurnRateFiltrados.length})</span>
            </button>
          </div>

          {alumnosBurnRatePaginados.length === 0 ? (
            <div className="bi-empty-state">
              No hay alumnos en el estado seleccionado (
              {filtroEstadoBurnRate === "todos"
                ? "Todos"
                : filtroEstadoBurnRate === "vigente"
                  ? "Vigente"
                  : filtroEstadoBurnRate === "por_vencer"
                    ? "Por Vencer"
                    : "Renovar"}
              ).
            </div>
          ) : (
            <div className="bi-insight-table-wrapper">
              <table className="bi-insight-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Frecuencia Semanal (FMAS)</th>
                    <th>Clases Asistidas</th>
                    <th>Saldo Pactadas</th>
                    <th>Cobertura Proyectada</th>
                    <th>Estado Comercial</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosBurnRatePaginados.map((al) => (
                    <tr key={al.uid}>
                      <td>
                        <div className="bi-student-name">{al.nombre}</div>
                        {al.email && (
                          <div className="bi-student-email">{al.email}</div>
                        )}
                      </td>
                      <td>
                        <strong>{al.fmas}</strong>{" "}
                        <span className="bi-table-subtext">clases/sem</span>
                      </td>
                      <td>{al.clasesHechasAsistidas} asistidas</td>
                      <td>
                        <span
                          className={`bi-burnrate-badge bi-burnrate-badge--${al.estado}`}
                          style={{
                            borderColor: al.color,
                            color: al.color,
                          }}
                        >
                          {al.clasesPactadas === 0
                            ? "0 clases"
                            : `${al.clasesPactadas} disp.`}
                        </span>
                      </td>
                      <td>
                        {al.clasesPactadas === 0 ? (
                          <span
                            className="bi-coverage-text bi-coverage-text--danger"
                            style={{ color: "#DC2626" }}
                          >
                            0 días (Sin cobertura)
                          </span>
                        ) : (
                          <span className="bi-coverage-text">
                            ~{al.diasCobertura} días{" "}
                            <span className="bi-table-subtext">
                              ({al.semanasCobertura} sem)
                            </span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="bi-commercial-pill"
                          style={{
                            backgroundColor:
                              al.estado === "vigente"
                                ? "#F0FDF4"
                                : al.estado === "por_vencer"
                                  ? "#FEFCE8"
                                  : "#FEF2F2",
                            color: al.color,
                            borderColor: al.color,
                          }}
                        >
                          {al.estado === "vigente" && "🟢 Vigente"}
                          {al.estado === "por_vencer" && "🟡 Por Vencer"}
                          {al.estado === "renovar" && "🔴 Renovar"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Selector de Páginas (Máximo 10 clientes por vista) */}
              <footer className="bi-burnrate-footer">
                <div className="bi-pagination-info">
                  Mostrando{" "}
                  <strong>
                    {alumnosBurnRateFiltrados.length > 0
                      ? indiceInicioBurnRate + 1
                      : 0}
                  </strong>{" "}
                  a <strong>{indiceFinBurnRate}</strong> de{" "}
                  <strong>{alumnosBurnRateFiltrados.length}</strong> clientes
                </div>

                {totalPaginasBurnRate > 1 && (
                  <div
                    className="bi-pagination-controls"
                    role="navigation"
                    aria-label="Paginación de clientes"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaBurnRate((p) => Math.max(1, p - 1))
                      }
                      disabled={paginaBurnRate <= 1}
                      className="bi-pagination-btn bi-pagination-btn--prev"
                      aria-label="Página anterior"
                    >
                      ‹ Anterior
                    </button>

                    {Array.from(
                      { length: totalPaginasBurnRate },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPaginaBurnRate(num)}
                        aria-current={
                          paginaBurnRate === num ? "page" : undefined
                        }
                        className={`bi-pagination-page ${paginaBurnRate === num ? "bi-pagination-page--active" : ""}`}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaBurnRate((p) =>
                          Math.min(totalPaginasBurnRate, p + 1),
                        )
                      }
                      disabled={paginaBurnRate >= totalPaginasBurnRate}
                      className="bi-pagination-btn bi-pagination-btn--next"
                      aria-label="Página siguiente"
                    >
                      Siguiente ›
                    </button>
                  </div>
                )}
              </footer>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
