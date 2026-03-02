# 015: Estados Hover en Botones y Enlaces

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F005 |
| **Severidad** | Warning |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los botones y enlaces deben tener estados `:hover` claramente diferenciados que proporcionen retroalimentacion visual cuando el cursor esta sobre ellos. Esto mejora la usabilidad y confirma que el elemento es interactivo.

## Regla

Todo elemento interactivo debe tener:
1. Estado hover visualmente diferenciado
2. Transicion suave entre estados
3. Cambio suficiente para ser perceptible (no solo cambio de cursor)
4. Consistencia en todo el sitio

## Anti-Patron (Incorrecto)

```css
/* Mal: Sin estado hover */
button {
  background: #3b82f6;
  color: white;
}

/* Mal: Solo cursor pointer (insuficiente) */
a.card {
  cursor: pointer;
}

/* Mal: Hover casi imperceptible */
button:hover {
  background: #3a81f5; /* Cambio minimo */
}

/* Mal: Sin transicion (cambio abrupto) */
button:hover {
  background: #1d4ed8;
  /* Cambia instantaneamente */
}
```

## Patron Correcto

```css
/* Bien: Hover con transicion suave */
button {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

button:hover {
  background: #2563eb;
}

button:active {
  transform: scale(0.98);
}

/* Bien: Link con underline */
a {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* Bien: Card interactiva */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

## Patrones de Hover Comunes

### Cambio de Color

```css
/* Boton primario */
.btn-primary {
  background: #3b82f6;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background: #2563eb;
}

/* Boton secundario */
.btn-secondary {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: #3b82f6;
  color: white;
}
```

### Elevacion/Sombra

```css
.card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: box-shadow 0.3s ease;
}
.card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
```

### Underline Animado

```css
.fancy-link {
  position: relative;
  text-decoration: none;
}
.fancy-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s ease;
}
.fancy-link:hover::after {
  width: 100%;
}
```

## Tailwind CSS

```html
<!-- Boton con hover -->
<button class="
  px-4 py-2
  bg-blue-600 text-white
  rounded-lg
  transition-colors duration-200
  hover:bg-blue-700
  active:bg-blue-800
">
  Guardar
</button>

<!-- Boton outline -->
<button class="
  px-4 py-2
  border-2 border-blue-600 text-blue-600
  rounded-lg
  transition-all duration-200
  hover:bg-blue-600 hover:text-white
">
  Secundario
</button>

<!-- Card con hover -->
<article class="
  p-6 bg-white rounded-xl
  shadow-sm
  transition-all duration-300
  hover:shadow-lg hover:-translate-y-1
  cursor-pointer
">
  Contenido de la card
</article>

<!-- Link con underline animado -->
<a href="#" class="
  relative
  text-blue-600
  after:content-['']
  after:absolute after:bottom-0 after:left-0
  after:w-0 after:h-0.5 after:bg-current
  after:transition-[width] after:duration-300
  hover:after:w-full
">
  Enlace animado
</a>

<!-- Icono con hover -->
<button class="
  p-2 rounded-full
  text-gray-500
  transition-colors duration-200
  hover:text-gray-700 hover:bg-gray-100
">
  <svg class="w-6 h-6"><!-- icon --></svg>
</button>
```

## React/JSX

```jsx
// Sistema de botones con estados
const buttonVariants = {
  base: `
    px-4 py-2 rounded-lg font-medium
    transition-all duration-200
    focus:outline-none focus-visible:ring-2
  `,
  primary: `
    bg-blue-600 text-white
    hover:bg-blue-700
    active:bg-blue-800
    focus-visible:ring-blue-500
  `,
  secondary: `
    bg-gray-100 text-gray-900
    hover:bg-gray-200
    active:bg-gray-300
    focus-visible:ring-gray-500
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100 hover:text-gray-900
    active:bg-gray-200
    focus-visible:ring-gray-500
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    active:bg-red-800
    focus-visible:ring-red-500
  `,
};

function Button({ variant = 'primary', children, ...props }) {
  return (
    <button
      className={`${buttonVariants.base} ${buttonVariants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Card interactiva
function InteractiveCard({ children, onClick }) {
  return (
    <article
      onClick={onClick}
      className="
        p-6 bg-white rounded-xl
        shadow-sm border border-gray-200
        cursor-pointer
        transition-all duration-300 ease-out
        hover:shadow-lg hover:border-gray-300
        hover:-translate-y-1
        active:scale-[0.99]
      "
    >
      {children}
    </article>
  );
}
```

## Estados Completos (hover + focus + active + disabled)

```css
.button {
  /* Estado base */
  background: #3b82f6;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Hover */
.button:hover {
  background: #2563eb;
}

/* Focus */
.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Active (presionado) */
.button:active {
  background: #1d4ed8;
  transform: scale(0.98);
}

/* Disabled */
.button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}

.button:disabled:hover {
  background: #9ca3af; /* Sin cambio */
}
```

## Consideraciones de Accesibilidad

```css
/* No depender solo del color para hover */
.link:hover {
  color: #1d4ed8;
  text-decoration: underline; /* Cambio de forma ademas de color */
}

/* Hover no debe ser el unico indicador de interactividad */
.interactive-element {
  cursor: pointer;
  /* El elemento debe parecer interactivo sin hover */
}

/* Considerar prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .animated-hover {
    transition: none;
  }
}
```

## Deteccion Automatica

**Patrones a buscar:**
- Botones y enlaces sin estilos `:hover`
- Elementos interactivos solo con `cursor: pointer`
- Hover sin transiciones

## Notas Adicionales

- Transiciones de 150-300ms son optimas para hover
- El cambio debe ser notable pero no distractor
- Mantener consistencia en toda la aplicacion
- Considerar usuarios que no usan mouse (touch, teclado)
- El hover no debe ser el unico indicador de interactividad

## Referencias

- [Nielsen Norman: Hover States](https://www.nngroup.com/articles/timing-exposing-content/)
- [Material Design: States](https://m3.material.io/foundations/interaction/states)
