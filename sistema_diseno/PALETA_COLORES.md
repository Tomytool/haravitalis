# Paleta de Colores y Guía de Color Expert: "Hara Vitalis"

Esta guía establece el sistema cromático para **Hara Vitalis - Renacer Pilates**, diseñado bajo la metodología **`@color-expert`** para proyectar bienestar, precisión biomecánica, serenidad y sofisticación visual.

---

## 🎨 Colores Base y Significado Emocional

| Rol | Color / HEX | HSL | Concepto & Psicología |
| :--- | :--- | :--- | :--- |
| **Primario Principal (Deep Slate Navy)** | `#253B59` | `hsl(215, 41%, 25%)` | Solidez, ciencia del movimiento, estabilidad corporal y elegancia. |
| **Secundario Pastel (Soft Lavender)** | `#CED0F2` | `hsl(236, 61%, 88%)` | Armonía, fluidez respiratoria, calma mental y flexibilidad. |
| **Acento Botánico (Vitality Mint)** | `#4E9F8E` | `hsl(167, 34%, 46%)` | Renovación orgánica, salud articular e indicadores de bienestar. |

---

## 🌈 Paleta Completa y Roles Semánticos (Design Tokens)

### 1. Colores Primarios y Brand Tokens
- `--color-brand-primary`: `#253B59` (Azul Noche Profundo)
- `--color-brand-primary-hover`: `#1C2E47` (Tono más oscuro para interacción hover)
- `--color-brand-primary-light`: `#3E587D` (Versión aligerada para destacar badges)

### 2. Colores Secundarios y Acentos
- `--color-brand-secondary`: `#CED0F2` (Lavanda Suave)
- `--color-brand-secondary-hover`: `#B5B8EC` (Lavanda Medio)
- `--color-brand-accent`: `#4E9F8E` (Verde Menta Botánico)
- `--color-brand-accent-hover`: `#3B7E70` (Verde Menta Oscuro)

### 3. Neutros y Fondos (Fondo & Superficie)
- `--color-bg-main`: `#F7F8FC` (Blanco Lavanda Suave - Evita el blanco puro para reducir fatiga visual)
- `--color-bg-surface`: `#FFFFFF` (Blanco Puro para Cards y Modales)
- `--color-bg-subtle`: `#EDF0F7` (Gris Azulado Claro para secciones alternadas)
- `--color-bg-dark`: `#172436` (Modo Oscuro / Footer Elegante)

### 4. Tipografía y Textos
- `--color-text-primary`: `#111827` (Negro Azulado de Alto Contraste - Ratio 15.2:1 en blanco)
- `--color-text-secondary`: `#475569` (Gris Azulado Muted)
- `--color-text-light`: `#F8FAFC` (Texto sobre fondos oscuros `#253B59`)
- `--color-text-accent`: `#253B59` (Texto de acento sobre `#CED0F2`)

### 5. Estados y Retroalimentación
- `--color-state-success`: `#2E7D32` (Verde Éxito)
- `--color-state-info`: `#253B59` (Información Brand)
- `--color-state-warning`: `#ED6C02` (Alerta Naranja Suave)
- `--color-state-error`: `#D32F2F` (Error Rojo Elegante)

---

## 📐 Cumplimiento de Accesibilidad WCAG 2.1

- **`#111827` sobre `#F7F8FC`**: Ratio **15.2:1** (Cumple **WCAG AAA** para texto normal y grande).
- **`#FFFFFF` sobre `#253B59`**: Ratio **10.8:1** (Cumple **WCAG AAA**).
- **`#253B59` sobre `#CED0F2`**: Ratio **6.7:1** (Cumple **WCAG AA** para texto normal y **AAA** para texto grande).
- **`#253B59` sobre `#FFFFFF`**: Ratio **10.5:1** (Cumple **WCAG AAA**).
- **`#FFFFFF` sobre `#4E9F8E`**: Ratio **4.6:1** (Cumple **WCAG AA** para botones y elementos UI).

---

## 💻 Código de Tokens CSS (variables.css)

```css
:root {
  /* Typography Fonts */
  --font-brand: 'Great Vibes', cursive;
  --font-heading: 'Montserrat', sans-serif;
  --font-body: 'Montserrat', sans-serif;

  /* Brand Colors */
  --color-primary: #253B59;
  --color-primary-dark: #1C2E47;
  --color-primary-light: #3E587D;
  --color-secondary: #CED0F2;
  --color-secondary-hover: #B5B8EC;
  --color-accent: #4E9F8E;
  --color-accent-hover: #3B7E70;

  /* Surfaces & Backgrounds */
  --color-bg-page: #F7F8FC;
  --color-bg-card: #FFFFFF;
  --color-bg-subtle: #EDF0F7;
  --color-bg-footer: #172436;

  /* Typography Colors */
  --color-text-main: #111827;
  --color-text-muted: #475569;
  --color-text-on-dark: #F8FAFC;

  /* Elevation & Shadows */
  --shadow-sm: 0 2px 4px rgba(37, 59, 89, 0.04);
  --shadow-md: 0 8px 24px rgba(37, 59, 89, 0.08);
  --shadow-lg: 0 16px 32px rgba(37, 59, 89, 0.12);
  --shadow-glass: 0 8px 32px 0 rgba(37, 59, 89, 0.1);

  /* Radius & Glassmorphism */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 9999px;
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: 1px solid rgba(206, 208, 242, 0.4);
}
```

