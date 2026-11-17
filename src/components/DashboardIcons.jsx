import React from "react";

/**
 * Catálogo de Íconos Vectoriales - Alternativa A (Geometría Somática - Pure Stroke)
 * Inspirados en la filosofía de diseño "Geometría Somática & Silencio Cromático" de Hara Vitalis.
 * Paleta oficial:
 * - Azul Noche Profundo: #253B59
 * - Lavanda Suave: #CED0F2
 * - Verde Menta Botánico: #4E9F8E
 * - Verde Esmeralda: #16A34A
 * - Blanco Puro: #FFFFFF
 */

// 1. KPI: Total Alumnos Inscritos
export function IconoAlumnosInscritosAltA({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Base sutil de alineación axial */}
      <circle cx="24" cy="24" r="22" stroke="#CED0F2" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      {/* Practicante Central (Eje Primario) */}
      <circle cx="24" cy="15" r="5" stroke="#253B59" strokeWidth="2.5" fill="none" />
      <path d="M14 36c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#253B59" strokeWidth="2.5" />
      {/* Centro Energético "Hara" (Acento Botánico) */}
      <circle cx="24" cy="30" r="2.5" fill="#4E9F8E" stroke="#4E9F8E" strokeWidth="1" />
      {/* Practicante Lateral Izquierdo */}
      <circle cx="12" cy="18" r="3.5" stroke="#4E9F8E" strokeWidth="2" />
      <path d="M6 36c0-3.866 3.134-7 7-7 1.25 0 2.418.33 3.428.91" stroke="#4E9F8E" strokeWidth="2" />
      {/* Practicante Lateral Derecho */}
      <circle cx="36" cy="18" r="3.5" stroke="#4E9F8E" strokeWidth="2" />
      <path d="M31.572 29.91C32.582 29.33 33.75 29 35 29c3.866 0 7 3.134 7 7" stroke="#4E9F8E" strokeWidth="2" />
    </svg>
  );
}

// 2. KPI: Clases Hechas / Dictadas
export function IconoClasesHechasAltA({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Órbita de cadencia horaria y ritmo completado */}
      <circle cx="24" cy="24" r="20" stroke="#CED0F2" strokeWidth="2" strokeDasharray="4 4" />
      {/* Arco activo de movimiento de 270 grados en Azul Noche Profundo */}
      <path d="M24 6a18 18 0 1 1-12.728 5.272" stroke="#253B59" strokeWidth="2.75" />
      {/* Nodo de inicio del ejercicio */}
      <circle cx="24" cy="6" r="2.5" fill="#253B59" />
      {/* Checkmark Somático de Ejercicio Completado (Acento Verde Menta) */}
      <polyline points="16 25 22 31 34 19" stroke="#4E9F8E" strokeWidth="3" />
    </svg>
  );
}

// 3. KPI: Clases con Cupo Completo (100% Llenas)
export function IconoCupoCompletoAltA({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Anillo exterior de capacidad máxima del estudio */}
      <circle cx="24" cy="24" r="20" stroke="#253B59" strokeWidth="2.25" strokeDasharray="1 3" />
      {/* Polígono pentagonal de equilibrio (5 cupos del reformer) */}
      <polygon points="24,10 37,19 32,34 16,34 11,19" stroke="#CED0F2" strokeWidth="1.75" />
      {/* 5 Nodos de alumnos ocupando el 100% de la clase */}
      <circle cx="24" cy="10" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="37" cy="19" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="32" cy="34" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="16" cy="34" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="11" cy="19" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      {/* Centro "Hara" irradiando plenitud total */}
      <circle cx="24" cy="23" r="4.5" fill="#4E9F8E" />
      <circle cx="24" cy="23" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

// 4. KPI: Ocupación Promedio
export function IconoOcupacionPromedioAltA({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Arco graduado de 180 grados */}
      <path d="M8 32a18 18 0 0 1 32 0" stroke="#CED0F2" strokeWidth="4" strokeLinecap="round" />
      {/* Segmento óptimo de ocupación en Verde Menta */}
      <path d="M24 14a18 18 0 0 1 14.5 7.5" stroke="#4E9F8E" strokeWidth="4.5" strokeLinecap="round" />
      {/* Marcas de calibración del reformer */}
      <line x1="8" y1="32" x2="12" y2="30" stroke="#253B59" strokeWidth="2" />
      <line x1="24" y1="14" x2="24" y2="18" stroke="#253B59" strokeWidth="2" />
      <line x1="40" y1="32" x2="36" y2="30" stroke="#253B59" strokeWidth="2" />
      {/* Pivote central y aguja indicadora de balance óptimo */}
      <circle cx="24" cy="32" r="4.5" fill="#253B59" />
      <line x1="24" y1="32" x2="33" y2="19" stroke="#253B59" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="32" r="1.5" fill="#FFFFFF" />
      {/* Base de soporte articular */}
      <line x1="16" y1="40" x2="32" y2="40" stroke="#253B59" strokeWidth="2.5" />
      <line x1="24" y1="36" x2="24" y2="40" stroke="#253B59" strokeWidth="2" />
    </svg>
  );
}

// 5. HERO: Semana de Clases y Cupos Completos (100% Llenas)
export function IconoSemanaClasesAltA({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="6" y1="38" x2="42" y2="38" stroke="#CED0F2" strokeWidth="2" />
      <line x1="6" y1="14" x2="42" y2="14" stroke="#CED0F2" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      <line x1="6" y1="26" x2="42" y2="26" stroke="#CED0F2" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
      <path d="M6 34C11 34 13 16 18 16s7 18 12 18 7-20 12-20" stroke="#253B59" strokeWidth="2.75" />
      <circle cx="18" cy="16" r="3" fill="#4E9F8E" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="30" cy="34" r="2.5" fill="#253B59" />
      <circle cx="42" cy="14" r="3.5" fill="#16A34A" stroke="#253B59" strokeWidth="1.5" />
      <circle cx="6" cy="38" r="1.5" fill="#253B59" />
      <circle cx="12" cy="38" r="1.5" fill="#253B59" />
      <circle cx="18" cy="38" r="1.5" fill="#253B59" />
      <circle cx="24" cy="38" r="1.5" fill="#253B59" />
      <circle cx="30" cy="38" r="1.5" fill="#253B59" />
      <circle cx="36" cy="38" r="1.5" fill="#253B59" />
      <circle cx="42" cy="38" r="1.5" fill="#253B59" />
    </svg>
  );
}

// 6. Gráfico: Alumnos Inscritos por Día / Mes / Año
export function IconoEvolucionAlumnosAltA({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="6" y1="40" x2="42" y2="40" stroke="#253B59" strokeWidth="2.5" />
      <rect x="9" y="28" width="5.5" height="12" rx="2.75" stroke="#253B59" strokeWidth="2" />
      <rect x="18" y="21" width="5.5" height="19" rx="2.75" stroke="#253B59" strokeWidth="2" />
      <rect x="27" y="14" width="5.5" height="26" rx="2.75" stroke="#253B59" strokeWidth="2" />
      <rect x="36" y="8" width="5.5" height="32" rx="2.75" fill="#4E9F8E" stroke="#4E9F8E" strokeWidth="2" />
      <path d="M8 24C16 22 26 12 39 7" stroke="#4E9F8E" strokeWidth="2.5" />
      <polyline points="33 7 39 7 39 13" stroke="#4E9F8E" strokeWidth="2.5" />
    </svg>
  );
}

// 7. Gráfico: Distribución de Ocupación e Instructores (Dona)
export function IconoDistribucionDonaAltA({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 6 A 18 18 0 0 1 42 24" stroke="#253B59" strokeWidth="5" />
      <path d="M42 27 A 18 18 0 0 1 18 41.5" stroke="#4E9F8E" strokeWidth="5" />
      <path d="M14 39.5 A 18 18 0 0 1 20 6.5" stroke="#CED0F2" strokeWidth="5" />
      <circle cx="24" cy="24" r="8" stroke="#253B59" strokeWidth="2" strokeDasharray="2 3" />
      <circle cx="24" cy="24" r="3" fill="#4E9F8E" />
    </svg>
  );
}

// 8. Métricas: Rendimiento de Instructores
export function IconoActividadInstructoresAltA({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="14" r="5" stroke="#253B59" strokeWidth="2.5" />
      <path d="M10 38c0-5.523 4.477-10 10-10 2.3 0 4.41.77 6.1 2.07" stroke="#253B59" strokeWidth="2.5" />
      <line x1="32" y1="8" x2="32" y2="40" stroke="#4E9F8E" strokeWidth="2.75" />
      <circle cx="32" cy="8" r="2.5" fill="#4E9F8E" />
      <circle cx="32" cy="40" r="2.5" fill="#4E9F8E" />
      <path d="M25 24h7" stroke="#4E9F8E" strokeWidth="2" strokeDasharray="2 2" />
      <circle cx="20" cy="24" r="1.5" fill="#253B59" />
    </svg>
  );
}

// 9. Tabla: Alumnos Más Frecuentes y Renovación de Planes
export function IconoAlumnosRenovacionAltA({ size = 26, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 7 L37 13 V25 C37 32.5 24 39 24 39 C24 39 11 32.5 11 25 V13 Z" stroke="#253B59" strokeWidth="2.5" />
      <path d="M24 16 A 6 6 0 1 1 19 22" stroke="#4E9F8E" strokeWidth="2.25" />
      <polyline points="19 18 19 22 23 22" stroke="#4E9F8E" strokeWidth="2.25" />
      <circle cx="24" cy="27" r="2.5" fill="#4E9F8E" />
      <circle cx="11" cy="13" r="1.5" fill="#253B59" />
      <circle cx="37" cy="13" r="1.5" fill="#253B59" />
      <circle cx="24" cy="7" r="2" fill="#4E9F8E" />
    </svg>
  );
}
