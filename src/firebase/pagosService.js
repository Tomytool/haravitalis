import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Tabla de tarifas fijas del centro Huravitalis.
 * Calcula automáticamente el monto en CLP según las clases pactadas y terapias agregadas.
 *
 * @param {number} clases - Cantidad de clases pactadas tomadas/agregadas.
 * @param {number} terapias - Cantidad de sesiones de terapia tomadas/agregadas.
 * @returns {{ monto: number, detalle: string, esTarifaOficial: boolean }}
 */
export function calcularTarifaAutomatica(clases, terapias) {
  const c = Math.max(0, Number(clases) || 0);
  const t = Math.max(0, Number(terapias) || 0);

  // 1. Caso sin adición de clases ni terapias (ej. actualización de teléfono o nombre)
  if (c === 0 && t === 0) {
    return {
      monto: 0,
      detalle: "Sin adición de clases ni terapias",
      esTarifaOficial: true,
    };
  }

  // 2. Combinaciones Clases Pactadas + 2 Terapias
  if (t === 2) {
    if (c === 4) return { monto: 57000, detalle: "Pack: 4 clases + 2 terapias", esTarifaOficial: true };
    if (c === 8) return { monto: 75000, detalle: "Pack: 8 clases + 2 terapias", esTarifaOficial: true };
    if (c === 12) return { monto: 92000, detalle: "Pack: 12 clases + 2 terapias", esTarifaOficial: true };
    if (c === 16) return { monto: 109000, detalle: "Pack: 16 clases + 2 terapias", esTarifaOficial: true };
  }

  // 3. Solo Clases Pactadas (0 terapias)
  if (t === 0) {
    if (c === 1) return { monto: 10000, detalle: "1 Clase Pactada", esTarifaOficial: true };
    if (c === 4) return { monto: 40000, detalle: "4 Clases Pactadas", esTarifaOficial: true };
    if (c === 8) return { monto: 58000, detalle: "8 Clases Pactadas", esTarifaOficial: true };
    if (c === 12) return { monto: 75000, detalle: "12 Clases Pactadas", esTarifaOficial: true };
    if (c === 16) return { monto: 92000, detalle: "16 Clases Pactadas", esTarifaOficial: true };
  }

  // 4. Solo Sesiones de Terapia (0 clases)
  if (c === 0) {
    if (t === 1) return { monto: 25000, detalle: "1 Sesión de Terapia", esTarifaOficial: true };
    if (t === 2) return { monto: 32990, detalle: "2 Sesiones de Terapia", esTarifaOficial: true };
    if (t === 3) return { monto: 39990, detalle: "3 Sesiones de Terapia", esTarifaOficial: true };
  }

  // 5. Casos especiales / combinaciones fuera de tabla estándar
  let detalleTexto = [];
  if (c > 0) detalleTexto.push(`${c} clase(s)`);
  if (t > 0) detalleTexto.push(`${t} terapia(s)`);

  return {
    monto: 0,
    detalle: `Combinación personalizada (${detalleTexto.join(" + ")}) - Ajuste manual`,
    esTarifaOficial: false,
  };
}

/**
 * Formatea un valor numérico a pesos chilenos (CLP).
 * @param {number} valor
 * @returns {string} Ej: "$58.000"
 */
export function formatearMonedaCLP(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

/**
 * Registra un evento de auditoría de pago / modificación de usuario en Firestore.
 * Colección: historial_pagos_usuarios
 */
export async function registrarHistorialPagoAdmin({
  usuario,
  admin,
  saldoAnteriorClases = 0,
  saldoNuevoClases = 0,
  saldoAnteriorTerapias = 0,
  saldoNuevoTerapias = 0,
  tipoOperacion = "edicion_usuario",
}) {
  const coleccionRef = collection(db, "historial_pagos_usuarios");

  const clasesAnteriores = Number(saldoAnteriorClases) || 0;
  const clasesNuevas = Number(saldoNuevoClases) || 0;
  const clasesAgregadas = Math.max(0, clasesNuevas - clasesAnteriores);

  const terapiasAnteriores = Number(saldoAnteriorTerapias) || 0;
  const terapiasNuevas = Number(saldoNuevoTerapias) || 0;
  const terapiasAgregadas = Math.max(0, terapiasNuevas - terapiasAnteriores);

  // Si no hubo incremento neto pero se estableció un valor directo mayor a 0 (ej. usuario editando o paquete renovado)
  const clasesParaTarifa = clasesAgregadas > 0 ? clasesAgregadas : (clasesNuevas > 0 ? clasesNuevas : 0);
  const terapiasParaTarifa = terapiasAgregadas > 0 ? terapiasAgregadas : (terapiasNuevas > 0 ? terapiasNuevas : 0);

  const calculo = calcularTarifaAutomatica(clasesParaTarifa, terapiasParaTarifa);

  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fechaLegible = `${pad(ahora.getDate())}/${pad(ahora.getMonth() + 1)}/${ahora.getFullYear()} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;

  const nuevoRegistro = {
    fecha_modificacion: serverTimestamp(),
    fecha_legible: fechaLegible,
    timestamp_ms: ahora.getTime(),

    // Datos del Usuario
    usuario_id: usuario.id || usuario.uid || "",
    usuario_nombre: (usuario.nombre || "Sin Nombre").trim(),
    usuario_email: (usuario.email || "Sin Email").toLowerCase().trim(),

    // Datos del Administrador Responsable
    admin_id: admin?.uid || admin?.id || "admin_sistema",
    admin_nombre: (admin?.nombre || admin?.displayName || "Administrador Huravitalis").trim(),
    admin_email: (admin?.email || "admin@huravitalis.cl").toLowerCase().trim(),

    // Clases
    clases_pactadas_anteriores: clasesAnteriores,
    clases_pactadas_nuevas: clasesNuevas,
    clases_agregadas: clasesAgregadas > 0 ? clasesAgregadas : clasesNuevas,

    // Terapias
    sesiones_terapia_anteriores: terapiasAnteriores,
    sesiones_terapia_nuevas: terapiasNuevas,
    sesiones_terapia_agregadas: terapiasAgregadas > 0 ? terapiasAgregadas : terapiasNuevas,

    // Datos Económicos
    monto_pago: calculo.monto,
    monto_formateado: formatearMonedaCLP(calculo.monto),
    detalle_tarifa: calculo.detalle,
    es_tarifa_oficial: calculo.esTarifaOficial,

    tipo_operacion: tipoOperacion,
  };

  const docRef = await addDoc(coleccionRef, nuevoRegistro);
  return { id: docRef.id, ...nuevoRegistro };
}

/**
 * Obtiene todos los registros del historial de pagos ordenados por fecha descendente.
 */
export async function obtenerHistorialPagosAdmin() {
  const coleccionRef = collection(db, "historial_pagos_usuarios");
  let snapshot;

  try {
    const q = query(coleccionRef, orderBy("fecha_modificacion", "desc"));
    snapshot = await getDocs(q);
  } catch (err) {
    // Si aún no se crea el índice o no hay campo fecha_modificacion serverTimestamp listo
    const qFallback = query(coleccionRef);
    snapshot = await getDocs(qFallback);
  }

  const registros = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));

  // Ordenar en memoria por timestamp si fue necesario fallback
  registros.sort((a, b) => {
    const timeA = a.fecha_modificacion?.toMillis ? a.fecha_modificacion.toMillis() : (a.timestamp_ms || 0);
    const timeB = b.fecha_modificacion?.toMillis ? b.fecha_modificacion.toMillis() : (b.timestamp_ms || 0);
    return timeB - timeA;
  });

  return registros;
}

/**
 * Genera y descarga un archivo CSV con el historial de pagos.
 * Compatible 100% con Microsoft Excel y hojas de cálculo (UTF-8 con BOM).
 *
 * @param {Array<Object>} registros
 * @returns {boolean} true si se descargó correctamente
 */
export function exportarHistorialPagosCSV(registros = []) {
  if (!registros || registros.length === 0) {
    throw new Error("No hay registros en el historial de pagos para exportar.");
  }

  const encabezados = [
    "ID Transacción",
    "Fecha y Hora",
    "Nombre Usuario",
    "Email Usuario",
    "Administrador",
    "Email Administrador",
    "Clases Anteriores",
    "Clases Nuevas",
    "Clases Tomadas/Agregadas",
    "Terapias Anteriores",
    "Terapias Nuevas",
    "Terapias Tomadas/Agregadas",
    "Monto Pago CLP",
    "Detalle Tarifa",
    "Tipo Operación",
  ];

  // Escapar valores para formato CSV
  const sanitizarCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const filas = registros.map((r) => {
    const fecha = r.fecha_legible || (r.fecha_modificacion?.toDate ? r.fecha_modificacion.toDate().toLocaleString("es-CL") : "N/A");
    return [
      sanitizarCSV(r.id),
      sanitizarCSV(fecha),
      sanitizarCSV(r.usuario_nombre),
      sanitizarCSV(r.usuario_email),
      sanitizarCSV(r.admin_nombre),
      sanitizarCSV(r.admin_email),
      sanitizarCSV(r.clases_pactadas_anteriores ?? 0),
      sanitizarCSV(r.clases_pactadas_nuevas ?? 0),
      sanitizarCSV(r.clases_agregadas ?? 0),
      sanitizarCSV(r.sesiones_terapia_anteriores ?? 0),
      sanitizarCSV(r.sesiones_terapia_nuevas ?? 0),
      sanitizarCSV(r.sesiones_terapia_agregadas ?? 0),
      sanitizarCSV(r.monto_pago ?? 0),
      sanitizarCSV(r.detalle_tarifa || ""),
      sanitizarCSV(r.tipo_operacion || "edicion_usuario"),
    ].join(";"); // Usamos punto y coma (;) como delimitador estándar para Excel en español
  });

  const contenidoCSV = "\uFEFF" + [encabezados.join(";"), ...filas].join("\r\n");

  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fechaHoy = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `reporte_pagos_huravitalis_${fechaHoy}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
