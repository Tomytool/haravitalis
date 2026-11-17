# Manifiesto de Diseño & Especificación Analítica: Cartografía Somática del Rendimiento

**Movimiento Estético:** *Cartografía Somática & Precisión Analítica*  
**Entidad:** Hara Vitalis — Centro de Pilates Reformer & Bienestar Integrativo  
**Aplicación:** Reporte Ejecutivo de Evaluación de KPIs para el Rendimiento de Clases  

---

## I. Filosofía Visual: Cartografía Somática & Precisión Analítica

### 1. Espacio, Forma y Observación Sistemática
La *Cartografía Somática* concibe los datos operativos de un estudio de Pilates Reformer no como cifras inertes, sino como el registro anatómico de un organismo vivo en movimiento continuo. Cada métrica de asistencia, cadencia horaria y tensión de capacidad se traduce en geometrías puras, curvas sinusoidales y matrices de observación clínica. El espacio negativo en blanco lavanda (`#F7F8FC`) actúa como el silencio respiratorio entre repeticiones sobre el carro del Reformer: amplifica la legibilidad, elimina la fatiga cognitiva y otorga a cada diagrama la presencia serena de un instrumento de precisión. El resultado final ha sido meticulosamente elaborado con la dedicación artesanal de quien calibra cada milímetro de una pieza de colección.

### 2. Calibración Cromática y Codificación Semántica
El color opera como el sistema primario de información, prescindiendo de todo artificio decorativo. El **Azul Noche Profundo (`#253B59`)** ancla la arquitectura estructural del documento, representando la estabilidad ósea, el rigor metodológico y la línea base del volumen operativo. El **Verde Menta Botánico (`#4E9F8E`)** y el **Verde Esmeralda (`#16A34A`)** iluminan exclusivamente los hallazgos críticos: plenitud de cupo (100%), adherencia óptima y tracción saludable. Por su parte, el **Lavanda Suave (`#CED0F2`)** construye planos de contexto, bandas de referencia e intervalos de comparación histórica. Cada transición cromática refleja horas de calibración experta y un dominio absoluto del contraste perceptual WCAG AAA.

### 3. Escala, Ritmo Editorial y Tipografía Clínica
La composición equilibra la monumentalidad de los indicadores clave (números titulares en tipografía *Montserrat Black* de gran escala) con anotaciones técnicas susurradas de máxima nitidez. Siguiendo la tradición de los manuales científicos de biomecánica y el diseño editorial suizo, las fórmulas matemáticas, los esquemas de colección de Firestore y los umbrales de control se disponen en retículas ortogonales rigurosas. Nada se superpone ni compite por la atención; cada línea divisoria de 1px y cada marcador de referencia reflejan una ejecución de nivel maestro y un cuidado obsesivo por el detalle tipográfico.

### 4. Visualización de Datos sin Ruido (Data-Ink Mastery)
Cada uno de los diez indicadores se expresa mediante su representación gráfica óptima: *Bullet Charts* para evaluar ocupación frente a meta, mapas de calor matriciales (*Heatmaps*) para descubrir los bloques *Prime-Time*, curvas de velocidad de reserva desde la apertura (`visible_desde`) y diagramas de embudo para prevenir la deserción. Se destierran por completo los gráficos tridimensionales distorsionados o la ornamentación superflua. Cada trazo vectorial dentro del lienzo cumple una función analítica verificable, fruto de una artesanía visual sin concesiones.

### 5. Narrativa para la Toma de Decisiones (Data Storytelling)
Un indicador carece de valor si no conduce a una acción concreta. Por ello, la arquitectura de cada ficha KPI articula tres pilares indivisibles: la **Evidencia** (fórmula exacta y campos fuente en Firestore), el **Significado** (diagnóstico de negocio y umbrales semáforo RAG) y la **Acción Recomendada** (criterio ejecutivo para evaluar su incorporación inmediata en el Dashboard). El documento entero funciona como un atlas estratégico diseñado con maestría para transformar los registros transaccionales de Hara Vitalis en decisiones de alto impacto comercial y terapéutico.

---

## II. Arquitectura de Parámetros del Sistema (`@database-schema-designer`)

El ecosistema de datos de **Hara Vitalis** en Cloud Firestore se compone de 5 colecciones transaccionales cuyos atributos alimentan directamente los 10 KPIs propuestos:

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│           clases             │       │          usuarios            │
├──────────────────────────────┤       ├──────────────────────────────┤
│ PK id: string                │       │ PK id / uid: string          │
│    tipo_servicio: string     │       │    nombre: string            │
│    instructor: string        │       │    email: string             │
│    cupo_maximo: number (5)   │◄──┐   │    rol: 'cliente' | 'admin'  │
│    cupos_disponibles: number │   │   │    estado_cuenta: 'activo'   │
│    inscritos_ids: string[]   │───┼──►│    clases_pactadas: number   │
│    estado: 'activa'|'inact.' │   │   │    sesion_terapia: number    │
│    fecha_inicio: Timestamp   │   │   │    fecha_creacion: Timestamp │
│    fecha_fin: Timestamp      │   │   └──────────────┬───────────────┘
│    visible_desde: Timestamp  │   │                  │
└──────────────────────────────┘   │                  │
                                   │                  ▼
┌──────────────────────────────┐   │   ┌──────────────────────────────┐
│        inscripciones         │   │   │   historial_pagos_usuarios   │
├──────────────────────────────┤   │   ├──────────────────────────────┤
│ PK id: string                │   │   │ PK id: string                │
│ FK clase_id: string ─────────┼───┘   │ FK usuario_id: string        │
│ FK usuario_id: string        │       │    clases_agregadas: number  │
│    tipo_servicio: string     │       │    sesiones_terapia_agreg.:# │
│    estado: 'confirmada'|     │       │    monto_pago: number        │
│            'cancelada'       │       │    detalle_tarifa: string    │
│    cancelado_por_admin: bool │       │    es_tarifa_oficial: bool   │
│    fecha_cancelacion: Timest.│       │    fecha_modificacion: Time. │
└──────────────────────────────┘       └──────────────────────────────┘
```

---

## III. Catálogo Detallado de los 10 KPIs para Medir el Rendimiento de Clases

### KPI 01 — Tasa de Ocupación Real de Reformers (TOR)
- **Nivel:** Estratégico | **Frecuencia:** Diaria / Semanal / Mensual
- **Descripción para Evaluación:** Mide el porcentaje efectivo de camas Reformer utilizadas respecto a la capacidad total instalada en las clases programadas. Es el indicador madre de eficiencia de activos físicos del estudio.
- **Parámetros del Sistema:** `clases.inscritos_ids.length`, `clases.cupo_maximo`, `clases.estado`.
- **Fórmula Matemática:**
  $$\text{TOR (\%)} = \left( \frac{\sum_{i=1}^{n} \text{inscritos\_ids}_i.\text{length}}{\sum_{i=1}^{n} \text{cupo\_maximo}_i} \right) \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Óptimo:** $\ge 80\%$ (4–5 alumnos/clase) | 🟡 **Alerta:** $55\% - 79\%$ | 🔴 **Crítico:** $< 55\%$.
- **Visualización Recomendada:** *Bullet Chart* horizontal con línea de meta en 85%.
- **Valor de Incorporación:** Permite detectar de un vistazo si la oferta de horarios está sobredimensionada o si el estudio requiere abrir nuevos bloques horarios.

---

### KPI 02 — Índice de Saturación de Clases (Cupo 100% Completo)
- **Nivel:** Estratégico | **Frecuencia:** Semanal
- **Descripción para Evaluación:** Cuantifica la proporción de sesiones que alcanzan el lleno total (`cupos_disponibles === 0`). Un porcentaje muy alto indica demanda insatisfecha (alumnos que no logran reservar); uno muy bajo refleja baja presión de demanda.
- **Parámetros del Sistema:** `clases.cupos_disponibles`, `clases.inscritos_ids.length`, `clases.cupo_maximo`.
- **Fórmula Matemática:**
  $$\text{ISC (\%)} = \left( \frac{\text{Total de clases con } \text{cupos\_disponibles} = 0}{\text{Total de clases dictadas en el periodo}} \right) \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Óptimo:** $35\% - 65\%$ | 🟡 **Precaución:** $> 75\%$ (cuello de botella para agendar) | 🔴 **Crítico:** $< 20\%$.
- **Visualización Recomendada:** Gráfico de doble curva suave (Clases Totales vs. Clases 100% Llenas).
- **Valor de Incorporación:** Identifica exactamente qué días generan listas de espera implícitas para duplicar turnos rentables.

---

### KPI 03 — Mapa de Calor de Demanda por Bloque Horario y Día (*Prime-Time Index*)
- **Nivel:** Táctico | **Frecuencia:** Mensual / Trimestral
- **Descripción para Evaluación:** Cruza el día de la semana (`Lunes` a `Domingo`) con la hora de inicio (`08:00` a `20:00`) extraídos de `fecha_inicio`, revelando las "zonas calientes" (*Prime-Time*) y los "valles muertos" de asistencia.
- **Parámetros del Sistema:** `clases.fecha_inicio` (`getDay()`, `getHours()`, `getMinutes()`), `clases.inscritos_ids.length`, `clases.cupo_maximo`.
- **Fórmula Matemática:**
  $$\text{Ocupación}_{(d, h)} = \frac{\sum \text{inscritos en día } d \text{ y hora } h}{\sum \text{cupo\_maximo en día } d \text{ y hora } h} \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Prime-Time:** $\ge 85\%$ | 🟡 **Horario Estándar:** $50\% - 84\%$ | 🔴 **Valle Crítico:** $< 50\%$.
- **Visualización Recomendada:** *Heatmap* matricial de 7 columnas $\times$ franjas horarias con escala secuencial Lavanda $\rightarrow$ Menta $\rightarrow$ Azul Noche.
- **Valor de Incorporación:** Imprescindible para optimizar la parrilla horaria, reasignar instructores estrella y crear promociones en horarios valle.

---

### KPI 04 — Velocidad de Llenado desde Apertura (*Booking Lead-Time*)
- **Nivel:** Táctico | **Frecuencia:** Semanal / Mensual
- **Descripción para Evaluación:** Mide cuántas horas o días de anticipación transcurren entre el momento en que la clase se hace pública (`visible_desde`) y su inicio (`fecha_inicio`), evaluando la urgencia de reserva del alumnado.
- **Parámetros del Sistema:** `clases.visible_desde`, `clases.fecha_inicio`, `clases.cupos_disponibles`, `inscripciones`.
- **Fórmula Matemática:**
  $$\text{Ventana de Exposición (hrs)} = \frac{\text{fecha\_inicio} - \text{visible\_desde}}{3.600.000 \text{ ms}} \quad \text{vs.} \quad \text{Tasa de Llenado Previo (24h antes)}$$
- **Umbrales Semáforo (RAG):** 🟢 **Alta Anticipación:** $\ge 75\%$ de cupos reservados 24h antes | 🟡 **Media:** $45\% - 74\%$ | 🔴 **Última Hora:** $< 45\%$.
- **Visualización Recomendada:** Curva acumulada de llenado (*S-Curve* de anticipación).
- **Valor de Incorporación:** Permite planificar con 24 horas de antelación si una clase debe confirmarse, fusionarse o promocionarse por WhatsApp.

---

### KPI 05 — Tasa de Cancelación y Fricción de Reservas (*Class Churn Rate*)
- **Nivel:** Operativo | **Frecuencia:** Semanal / Mensual
- **Descripción para Evaluación:** Cuantifica el porcentaje de reservas que terminan en estado `cancelada` dentro de la colección `inscripciones`, diferenciando entre cancelaciones originadas por el alumno y ajustes administrativos (`cancelado_por_admin`).
- **Parámetros del Sistema:** `inscripciones.estado`, `inscripciones.cancelado_por_admin`, `inscripciones.fecha_cancelacion`, `clases.fecha_inicio`.
- **Fórmula Matemática:**
  $$\text{TCR (\%)} = \left( \frac{\text{Inscripciones con } \text{estado} = \text{'cancelada'}}{\text{Total de Inscripciones Registradas}} \right) \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Saludable:** $\le 8\%$ | 🟡 **Alerta:** $8.1\% - 15\%$ | 🔴 **Fuga Operativa:** $> 15\%$.
- **Visualización Recomendada:** Gráfico de barras apiladas (Cancelación Alumno vs. Cancelación Admin) por franja horaria.
- **Valor de Incorporación:** Ayuda a detectar si ciertos horarios matutinos o nocturnos sufren cancelaciones recurrentes que dejan camas vacías sin tiempo de reemplazo.

---

### KPI 06 — Índice de Tracción y Eficiencia por Instructor (ITEI)
- **Nivel:** Táctico | **Frecuencia:** Mensual
- **Descripción para Evaluación:** Evalúa la capacidad de convocatoria, retención y plenitud de sala de cada profesional (`clases.instructor`), ponderando su tasa de ocupación media con su proporción de clases llenas al 100%.
- **Parámetros del Sistema:** `clases.instructor`, `clases.inscritos_ids.length`, `clases.cupo_maximo`, `clases.estado`.
- **Fórmula Matemática:**
  $$\text{ITEI}_{\text{inst}} = \left( 0.6 \times \text{Tasa Ocupación}_{\text{inst}} \right) + \left( 0.4 \times \%\text{Clases Llenas}_{\text{inst}} \right)$$
- **Umbrales Semáforo (RAG):** 🟢 **Instructor Ancla:** $\ge 75\text{ pts}$ | 🟡 **Consolidado:** $50 - 74\text{ pts}$ | 🔴 **En Desarrollo:** $< 50\text{ pts}$.
- **Visualización Recomendada:** Gráfico *Lollipop* o barras horizontales emparejadas con insignia de promedio de alumnos/clase.
- **Valor de Incorporación:** Objetiviza la evaluación de desempeño docente, incentivos por asistencia y asignación de bloques estratégicos.

---

### KPI 07 — Velocidad de Consumo de Plan y Riesgo de Renovación (*Credit Burn-Rate*)
- **Nivel:** Operativo | **Frecuencia:** Tiempo Real / Semanal
- **Descripción para Evaluación:** Cruza el saldo actual de clases del alumno (`usuarios.clases_pactadas`) con su ritmo de asistencia semanal para identificar quiénes agotarán su plan en los próximos 7 días o ya están en saldo $0$.
- **Parámetros del Sistema:** `usuarios.clases_pactadas`, `usuarios.estado_cuenta`, `clases.inscritos_ids`, `historial_pagos_usuarios.clases_agregadas`.
- **Fórmula Matemática:**
  $$\text{Semanas Restantes de Plan} = \frac{\text{usuarios.clases\_pactadas}}{\text{Promedio de Clases Asistidas por Semana del Alumno}}$$
- **Umbrales Semáforo (RAG):** 🟢 **Saldo Holgado:** $> 2\text{ semanas}$ ($\ge 4$ clases) | 🟡 **Próximo a Vencer:** $1 - 2$ clases | 🔴 **Renovación Inmediata:** $0$ clases pactadas.
- **Visualización Recomendada:** Embudo de retención y tabla accionable ordenada por urgencia de renovación.
- **Valor de Incorporación:** Impacta directamente el flujo de caja mensual al activar recordatorios comerciales antes de que el alumno interrumpa su hábito.

---

### KPI 08 — Frecuencia Media de Adherencia Semanal por Alumno (*Somatic Habit Score*)
- **Nivel:** Estratégico | **Frecuencia:** Semanal / Mensual
- **Descripción para Evaluación:** Mide cuántas sesiones por semana asiste en promedio cada alumno único activo. En Pilates Reformer, los alumnos que asisten $\ge 2$ veces por semana presentan una retención anual hasta 3 veces superior a los de asistencia esporádica.
- **Parámetros del Sistema:** `clases.inscritos_ids` (conteo total de apariciones vs. conjunto `Set` de UIDs únicos por semana).
- **Fórmula Matemática:**
  $$\text{FMAS} = \frac{\text{Total de Cupos Ocupados en la Semana}}{\text{Número de Alumnos Únicos que Asistieron en la Semana}}$$
- **Umbrales Semáforo (RAG):** 🟢 **Hábito Consolidado:** $\ge 2.1\text{ clases/semana}$ | 🟡 **Moderado:** $1.4 - 2.0$ | 🔴 **Riesgo de Abandono:** $< 1.4$.
- **Visualización Recomendada:** Histograma de distribución de frecuencias ($1\text{x}$, $2\text{x}$, $3\text{x+}$ sesiones semanales).
- **Valor de Incorporación:** Mide la salud real de la comunidad y justifica la venta de planes de 8 y 12 clases mensuales frente a clases sueltas.

---

### KPI 09 — Tasa de Subutilización Crítica (*Low-Yield Class Rate*)
- **Nivel:** Operativo | **Frecuencia:** Semanal
- **Descripción para Evaluación:** Identifica el porcentaje de clases dictadas que operaron por debajo del punto de equilibrio operativo ($\le 1$ alumno inscrito de 5 disponibles, es decir, $\le 20\%$ de ocupación), donde el costo de hora-instructor supera el retorno marginal.
- **Parámetros del Sistema:** `clases.inscritos_ids.length`, `clases.cupo_maximo`, `clases.instructor`, `clases.fecha_inicio`.
- **Fórmula Matemática:**
  $$\text{TSC (\%)} = \left( \frac{\text{Clases dictadas con } \text{inscritos\_ids.length} \le 1}{\text{Total de clases dictadas}} \right) \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Controlado:** $\le 5\%$ | 🟡 **Atención:** $5.1\% - 12\%$ | 🔴 **Pérdida Operativa:** $> 12\%$.
- **Visualización Recomendada:** Gráfico de barras de alerta por bloque horario con línea roja de corte en $\le 1$ alumno.
- **Valor de Incorporación:** Permite tomar decisiones quirúrgicas de reagrupación de alumnos para proteger el margen operativo del estudio.

---

### KPI 10 — Rendimiento e Ingreso Efectivo por Hora-Estudio (*RevPASH & Cross-Wellness*)
- **Nivel:** Estratégico | **Frecuencia:** Mensual
- **Descripción para Evaluación:** Combina los datos de `clases`, `terapias` e `historial_pagos_usuarios` para estimar el ingreso devengado por cada clase dictada y el porcentaje de alumnos de Pilates que además adquieren sesiones en `terapias` (`sesion_terapia > 0`).
- **Parámetros del Sistema:** `historial_pagos_usuarios.monto_pago`, `clases_agregadas`, `clases.inscritos_ids`, `usuarios.sesion_terapia`, `terapias.precio`.
- **Fórmula Matemática:**
  $$\text{Ingreso por Clase Dictada} = \left( \frac{\sum \text{monto\_pago}}{\sum \text{clases\_agregadas}} \right) \times \text{inscritos\_ids.length} \quad \big| \quad \text{Cross-Sell (\%)} = \frac{\text{Usuarios con Pilates } \cap \text{ Terapia}}{\text{Total Usuarios Activos}} \times 100$$
- **Umbrales Semáforo (RAG):** 🟢 **Alto Valor:** Cross-Sell $\ge 20\%$ y ocupación $\ge 80\%$ | 🟡 **Medio:** $10\% - 19\%$ | 🔴 **Bajo:** $< 10\%$.
- **Visualización Recomendada:** Gráfico combinado de Barras de Ingreso por Servicio + Indicador de Penetración Cruzada.
- **Valor de Incorporación:** Conecta la operación diaria de las clases con la rentabilidad financiera real y el potencial de venta cruzada del centro integrativo.
