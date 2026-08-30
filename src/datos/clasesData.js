export const diasOctubre = [
  { diaSemana: "Lun", numero: 14, id: "2024-10-14" },
  { diaSemana: "Mar", numero: 15, id: "2024-10-15" },
  { diaSemana: "Mié", numero: 16, id: "2024-10-16" },
  { diaSemana: "Jue", numero: 17, id: "2024-10-17" },
  { diaSemana: "Vie", numero: 18, id: "2024-10-18" },
  { diaSemana: "Sáb", numero: 19, id: "2024-10-19" },
  { diaSemana: "Dom", numero: 20, id: "2024-10-20" }
];

export const clasesDisponiblesPorDia = {
  "2024-10-15": [
    {
      id: "cls-1",
      hora: "08:00",
      duracion: "50 MIN",
      titulo: "Reformer Essentials",
      instructor: "Elena M.",
      nivel: "Básico",
      plazasTexto: "3 plazas",
      plazasDisponibles: 3,
      estado: "disponible"
    },
    {
      id: "cls-2",
      hora: "10:00",
      duracion: "50 MIN",
      titulo: "Flow & Strength",
      instructor: "Carlos G.",
      nivel: "Intermedio",
      plazasTexto: "1 plaza",
      plazasDisponibles: 1,
      estado: "disponible"
    },
    {
      id: "cls-3",
      hora: "18:00",
      duracion: "50 MIN",
      titulo: "Pilates Mat",
      instructor: "Sofía R.",
      nivel: "Todos los niveles",
      plazasTexto: "Completo",
      plazasDisponibles: 0,
      estado: "completo"
    }
  ],
  "2024-10-14": [
    {
      id: "cls-4",
      hora: "09:00",
      duracion: "50 MIN",
      titulo: "Reformer Fundamentals",
      instructor: "Elena M.",
      nivel: "Básico",
      plazasTexto: "2 plazas",
      plazasDisponibles: 2,
      estado: "disponible"
    },
    {
      id: "cls-5",
      hora: "17:00",
      duracion: "50 MIN",
      titulo: "Core & Stretch",
      instructor: "Lucía P.",
      nivel: "Todos los niveles",
      plazasTexto: "4 plazas",
      plazasDisponibles: 4,
      estado: "disponible"
    }
  ],
  "2024-10-16": [
    {
      id: "cls-6",
      hora: "08:30",
      duracion: "50 MIN",
      titulo: "Reformer Advanced Flow",
      instructor: "Carlos G.",
      nivel: "Avanzado",
      plazasTexto: "2 plazas",
      plazasDisponibles: 2,
      estado: "disponible"
    },
    {
      id: "cls-7",
      hora: "19:00",
      duracion: "50 MIN",
      titulo: "Postural Pilates",
      instructor: "Sofía R.",
      nivel: "Básico",
      plazasTexto: "5 plazas",
      plazasDisponibles: 5,
      estado: "disponible"
    }
  ],
  "2024-10-17": [
    {
      id: "cls-8",
      hora: "09:00",
      duracion: "50 MIN",
      titulo: "Flow & Strength",
      instructor: "Carlos G.",
      nivel: "Intermedio",
      plazasTexto: "2 plazas",
      plazasDisponibles: 2,
      estado: "disponible"
    },
    {
      id: "cls-9",
      hora: "17:00",
      duracion: "50 MIN",
      titulo: "Reformer Essentials",
      instructor: "Elena M.",
      nivel: "Básico",
      plazasTexto: "1 plaza",
      plazasDisponibles: 1,
      estado: "disponible"
    }
  ]
};

export const proximasClasesIniciales = [
  {
    id: "prox-1",
    etiquetaFecha: "HOY",
    titulo: "Reformer Essentials",
    horario: "17:00 - 17:50",
    tieneNotificacion: true
  },
  {
    id: "prox-2",
    etiquetaFecha: "JUE, 17 OCT",
    titulo: "Flow & Strength",
    horario: "09:00 - 09:50",
    tieneNotificacion: false
  }
];
