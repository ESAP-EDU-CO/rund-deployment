---
name: web-design-best-practices
description: Mejores practicas de diseno UI/UX web. Usar al crear, revisar o auditar interfaces, componentes visuales, formularios, animaciones, accesibilidad o estilos CSS/Tailwind.
allowed-tools: Read, Grep, Glob, Bash(node *)
---

# Web Design Best Practices

Aplica las mejores practicas de UI/UX al escribir o revisar codigo de interfaces web.

## Reglas principales

### Accesibilidad (Critical)
- Botones de icono deben tener **`aria-label`**
- Inputs deben tener **`<label>`** asociado o `aria-label`
- Imagenes deben tener **`alt`** (vacio para decorativas)
- Usar **elementos semanticos** (`<button>`, `<nav>`, `<main>`) antes de ARIA
- Incluir **skip link** al contenido principal
- Nunca bloquear zoom (`user-scalable=no`, `maximum-scale=1`)

### Focus y Estados (Critical)
- Indicadores de **focus visibles** en todos los interactivos
- Nunca **`outline: none`** sin reemplazo (usar `box-shadow` o `ring`)
- Preferir **`:focus-visible`** sobre `:focus`
- Estados **hover** claramente diferenciados

### Formularios
- Nunca bloquear **paste** en campos
- Usar **`autocomplete`** apropiado (email, tel, name)
- Mostrar **errores inline** junto al campo con error
- Focus en primer campo con error al submit

### Animaciones
- Respetar **`prefers-reduced-motion`**
- Solo animar **`transform`** y **`opacity`** (performante)
- Nunca usar **`transition: all`**

### Imagenes
- Siempre incluir **`width`** y **`height`** (evita CLS)
- Usar **`loading="lazy"`** en imagenes below-the-fold

### Modo Oscuro
- Declarar **`color-scheme: dark`** en html cuando activo
- Cada color claro debe tener variante **`dark:`** en Tailwind

## Tailwind CSS

```html
<!-- Patron correcto de boton -->
<button class="
  px-4 py-2 bg-blue-600 text-white rounded-lg
  hover:bg-blue-700
  focus:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
  active:scale-[0.98]
  disabled:bg-gray-400 disabled:cursor-not-allowed
">
  Guardar
</button>
```

## Recursos adicionales

Para reglas detalladas, consultar:
- [Accesibilidad](rules/01-accesibilidad/) - ARIA, labels, teclado, semantica
- [Focus y Estados](rules/02-focus-estados/) - Focus visible, hover
- [Formularios](rules/03-formularios/) - Validacion, errores, autocomplete
- [Animaciones](rules/04-animaciones/) - Motion, transform
- [Tipografia](rules/05-tipografia/) - Ellipsis, numeros
- [Imagenes](rules/06-imagenes-media/) - Dimensiones, lazy
- [Rendimiento](rules/07-rendimiento/) - Virtualizacion
- [Layout](rules/08-layout-responsive/) - Safe areas, responsive
- [Temas](rules/09-modo-oscuro-temas/) - Dark mode, variables
- [Tailwind](rules/10-tailwind-css/) - Ring, dark variant

Para plantillas de componentes, consultar [templates/](templates/).

## Comandos de auditoria

```bash
# Auditar proyecto completo
node scripts/audit-ui-project.js ./proyecto

# Verificar archivo especifico
node scripts/check-design-rules.js componente.tsx

# Generar reporte HTML
node scripts/generate-ui-report.js ./src --html > reporte.html
```
