# 011: Indicadores de Focus Visibles

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F001 |
| **Severidad** | Critical |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Todos los elementos interactivos deben tener indicadores de focus claramente visibles. Los usuarios que navegan con teclado necesitan saber que elemento esta enfocado.

## Regla

Todo elemento interactivo (botones, enlaces, inputs, etc.) debe tener:
1. Un estilo de focus visible con suficiente contraste
2. Un anillo o borde que indique claramente el focus
3. Preferiblemente usando `focus-visible` para evitar mostrar focus en clicks

## Anti-Patron (Incorrecto)

```css
/* Mal: Eliminar outline sin reemplazo */
button:focus {
  outline: none;
}

/* Mal: Focus invisible */
a:focus {
  outline: 0;
  border: none;
}

/* Mal: Focus con contraste insuficiente */
input:focus {
  outline: 1px solid #e0e0e0; /* Muy sutil */
}
```

```html
<!-- Mal: Inline style eliminando focus -->
<button style="outline: none;" onclick="save()">
  Guardar
</button>
```

## Patron Correcto

```css
/* Bien: Focus visible con ring */
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Bien: Focus con sombra */
a:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Bien: Focus en inputs */
input:focus-visible {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Bien: Sistema de focus consistente */
:focus-visible {
  outline: 2px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
}
```

## Tailwind CSS

```html
<!-- Focus ring estandar -->
<button class="
  px-4 py-2
  bg-blue-600 text-white
  rounded-lg
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
">
  Enviar
</button>

<!-- Input con focus -->
<input
  type="text"
  class="
    w-full px-4 py-2
    border border-gray-300
    rounded-lg
    focus:outline-none
    focus-visible:border-blue-500
    focus-visible:ring-2
    focus-visible:ring-blue-500/20
  "
/>

<!-- Link con focus -->
<a
  href="/about"
  class="
    text-blue-600
    underline
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:ring-offset-2
    rounded
  "
>
  Acerca de nosotros
</a>

<!-- Card clickeable con focus -->
<article
  tabindex="0"
  class="
    p-4 rounded-lg border
    cursor-pointer
    hover:shadow-md
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
  "
>
  Contenido de la tarjeta
</article>
```

## Sistema de Focus Global

```css
/* styles/focus.css */

/* Variables de focus */
:root {
  --focus-ring-color: #2563eb;
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-opacity: 1;
}

/* Focus global para todos los interactivos */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Reset para elementos que tienen su propio estilo */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
}

/* Boton */
button:focus-visible {
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
}

/* Input */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  border-color: var(--focus-ring-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

/* Link */
a:focus-visible {
  border-radius: 2px;
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --focus-ring-color: #60a5fa;
  }
}
```

## React/JSX

```jsx
// Hook para gestionar focus visible
import { useState, useEffect } from 'react';

function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
}

// Componente Button con focus correcto
function Button({ children, variant = 'primary', ...props }) {
  const baseClasses = `
    px-4 py-2 rounded-lg font-medium
    transition-colors duration-200
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-offset-2
  `;

  const variants = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus-visible:ring-blue-500
    `,
    secondary: `
      bg-gray-200 text-gray-800
      hover:bg-gray-300
      focus-visible:ring-gray-500
    `,
    outline: `
      border-2 border-blue-600 text-blue-600
      hover:bg-blue-50
      focus-visible:ring-blue-500
    `,
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Colores de Focus Accesibles

| Contexto | Color de Focus | Contraste Minimo |
|----------|---------------|------------------|
| Fondo claro | Azul (#2563eb) | 4.5:1 |
| Fondo oscuro | Azul claro (#60a5fa) | 4.5:1 |
| Fondo de marca | Color complementario | 4.5:1 |
| Alto contraste | Negro/Blanco | 7:1+ |

## Deteccion Automatica

**Patrones a buscar:**
- `outline: none` o `outline: 0` sin `focus-visible` alternativo
- Elementos interactivos sin estilos de focus
- Focus ring con contraste insuficiente

**Expresion regular:**
```regex
outline:\s*(none|0)[^}]*}(?![^}]*focus-visible)
```

## Notas Adicionales

- `focus-visible` solo muestra el focus ring con navegacion por teclado
- `:focus` muestra siempre (incluso al hacer click)
- El contraste minimo del indicador de focus debe ser 3:1
- Combinar color Y forma (no solo color) para usuarios daltonicos
- Probar con alto contraste de Windows

## Referencias

- [WCAG: Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
