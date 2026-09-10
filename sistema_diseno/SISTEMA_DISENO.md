# Sistema de Diseño Unificado: "Hara Vitalis"

Este documento contiene la especificación integral del Sistema de Diseño para **Hara Vitalis - Renacer Pilates**, combinando los principios de **`@ckm-design`**, **`@color-expert`** y **`@composicion-tipografica`**.

---

## 📐 Principios de Diseño

1. **Claridad Biomédica & Elegancia Organica**: Transmitir la seguridad del ejercicio científico asistido por máquinas Reformer combinando la solidez técnica con la calidez y fluidez del movimiento corporal.
2. **Minimalismo Cálido & Contraste WCAG**: Fondo suave en tono `#F7F8FC`, tipografía limpia de alta legibilidad en `#111827`, toques de azul noche `#253B59` y lavanda `#CED0F2` con acentos de menta botánica `#4E9F8E`.
3. **Escala y Composición Tipográfica Fluida**: Tipografía adaptativa que responde mediante funciones `clamp()` de CSS para una lectura impecable en dispositivos móviles, tablets y pantallas de alta resolución.

---

## 🔤 Tipografía y Jerarquía (`@composicion-tipografica`)

Las fuentes tipográficas utilizadas provienen directamente de los archivos locales en la carpeta `./fonts`:

- **Fuente de Marca / Logo / Isotipo**: `'Great Vibes'`, cursive (`fonts/GreatVibes-Regular.ttf`). Utilizada para la marca "Hara Vitalis", firmas visuales y titulares decorativos del hero.
- **Fuente Primaria (Encabezados y Cuerpo)**: `'Montserrat'`, sans-serif (`fonts/Montserrat-VariableFont_wght.ttf`). Utilizada para H1-H6, textos explicativos, botones, badges y menús de navegación.

### Jerarquía Tipográfica (Escala Adaptativa `clamp()`)

- **Brand Title / Logotipo**: `font-family: 'Great Vibes', cursive; font-size: clamp(2.5rem, 6vw, 4.25rem); font-weight: 400; line-height: 1.1; color: var(--color-primary);`
- **H1 (Hero Heading)**: `font-family: 'Montserrat', sans-serif; font-size: clamp(2.25rem, 5vw, 3.75rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em;`
- **H2 (Section Heading)**: `font-family: 'Montserrat', sans-serif; font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 600; line-height: 1.25; letter-spacing: -0.01em;`
- **H3 (Card Title)**: `font-family: 'Montserrat', sans-serif; font-size: clamp(1.25rem, 2vw, 1.5rem); font-weight: 600; line-height: 1.35;`
- **Body Large**: `font-family: 'Montserrat', sans-serif; font-size: 1.125rem; font-weight: 400; line-height: 1.6; color: var(--color-text-secondary);`
- **Body Standard**: `font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 400; line-height: 1.5; color: var(--color-text-main);`
- **Badge / Label Bold**: `font-family: 'Montserrat', sans-serif; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;`

---

## 🧱 Componentes Fundamentales

### 1. Botones (Button Component)
- **Botón Primario**:
  - Font: `'Montserrat', sans-serif; font-weight: 600;`
  - Background: `var(--color-primary)` (`#253B59`)
  - Text: `#FFFFFF`
  - Border-radius: `var(--radius-pill)` (`9999px`)
  - Padding: `0.875rem 1.75rem`
  - Shadow: `var(--shadow-md)`
  - Hover: `background: var(--color-primary-dark); transform: translateY(-2px);`
- **Botón Secundario / Lavender**:
  - Font: `'Montserrat', sans-serif; font-weight: 600;`
  - Background: `var(--color-secondary)` (`#CED0F2`)
  - Text: `var(--color-primary)` (`#253B59`)
  - Border-radius: `var(--radius-pill)`
  - Padding: `0.875rem 1.75rem`
  - Hover: `background: var(--color-secondary-hover);`

### 2. Tarjeta de Contenido / Feature Card (Glassmorphism)
- Background: `var(--glass-bg)` (`rgba(255, 255, 255, 0.85)`)
- Border: `var(--glass-border)` (`1px solid rgba(206, 208, 242, 0.4)`)
- Border-radius: `var(--radius-md)` (`16px`)
- Backdrop-filter: `blur(12px)`
- Box-shadow: `var(--shadow-glass)`
- Padding: `2rem`
- Hover state: `transform: translateY(-4px); box-shadow: var(--shadow-lg); transition: all 0.3s ease;`

### 3. Badge de Etiqueta / Highlight Pill
- Font: `'Montserrat', sans-serif; font-weight: 600; font-size: 0.875rem;`
- Background: `rgba(206, 208, 242, 0.4)`
- Color: `var(--color-primary)` (`#253B59`)
- Border-radius: `var(--radius-pill)`
- Padding: `0.375rem 1rem`
- Display: `inline-flex; align-items: center; gap: 0.5rem;`

---

## 📊 Tokens de Espaciado y Rejilla (Grid System)

- **Contenedor Máximo**: `max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;`
- **Escala de Espaciado (Gap & Margins)**:
  - `xs`: `0.5rem` (8px)
  - `sm`: `1rem` (16px)
  - `md`: `1.5rem` (24px)
  - `lg`: `3rem` (48px)
  - `xl`: `5rem` (80px)
- **Disposición**:
  - Desktop Grid: 12 columnas (`gap: 2rem`)
  - Feature Cards: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`

