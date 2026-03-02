# 003: Manejadores de Teclado en Elementos Interactivos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A003 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Todos los elementos interactivos personalizados (que no son nativamente interactivos como `<button>` o `<a>`) deben incluir manejadores de teclado (`onKeyDown`, `onKeyUp`) para que los usuarios que navegan con teclado puedan interactuar con ellos.

## Regla

Si un elemento tiene un manejador `onClick` pero no es un elemento nativamente interactivo, debe:
1. Tener `role="button"` o el role apropiado
2. Tener `tabindex="0"` para ser enfocable
3. Tener manejadores de teclado para Enter y/o Space

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Div clickeable sin soporte de teclado -->
<div onClick="handleClick()">
  Haz clic aqui
</div>

<!-- Mal: Span como boton sin accesibilidad -->
<span class="btn" onClick="submit()">
  Enviar
</span>

<!-- Mal: Solo onClick sin onKeyDown -->
<div
  role="button"
  tabindex="0"
  onClick="toggle()"
>
  Toggle
</div>
```

## Patron Correcto

```html
<!-- Bien: Usar elemento nativo (preferido) -->
<button onClick="handleClick()">
  Haz clic aqui
</button>

<!-- Bien: Div con soporte completo de accesibilidad -->
<div
  role="button"
  tabindex="0"
  onClick="handleClick()"
  onKeyDown="handleKeyDown(event)"
>
  Elemento interactivo
</div>

<!-- JavaScript para handleKeyDown -->
<script>
function handleKeyDown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
</script>
```

## React/JSX

```jsx
// Bien: Componente accesible
function InteractiveCard({ onClick, children }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer p-4 rounded-lg hover:bg-gray-100"
    >
      {children}
    </div>
  );
}

// Mejor: Usar elemento nativo
function InteractiveCard({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
```

## Tailwind CSS

```html
<!-- Elemento interactivo con estilos completos -->
<div
  role="button"
  tabindex="0"
  class="
    cursor-pointer
    p-4 rounded-lg
    bg-white
    hover:bg-gray-50
    focus:outline-none focus:ring-2 focus:ring-blue-500
    transition-colors
  "
  onclick="handleClick()"
  onkeydown="handleKeyDown(event)"
>
  <span>Contenido interactivo</span>
</div>
```

## Elementos Nativos vs Custom

| Elemento | Soporte Teclado Nativo | Necesita onKeyDown |
|----------|------------------------|-------------------|
| `<button>` | Si (Enter, Space) | No |
| `<a href="...">` | Si (Enter) | No |
| `<input>` | Si | No |
| `<select>` | Si | No |
| `<div onClick>` | No | Si |
| `<span onClick>` | No | Si |
| `<div role="button">` | No | Si |

## Deteccion Automatica

**Patrones a buscar:**
- Elementos `<div>` o `<span>` con `onClick` sin `onKeyDown`
- Elementos con `role="button"` sin manejadores de teclado
- Elementos no nativos con eventos de click sin `tabindex`

**Expresion regular:**
```regex
<(div|span)[^>]*onClick[^>]*>(?![^<]*onKeyDown)
```

## Hook Personalizado (React)

```jsx
// useAccessibleClick.js
import { useCallback } from 'react';

export function useAccessibleClick(onClick) {
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event);
    }
  }, [onClick]);

  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: handleKeyDown,
  };
}

// Uso
function MyComponent() {
  const accessibleProps = useAccessibleClick(() => console.log('clicked'));

  return (
    <div {...accessibleProps} className="interactive-element">
      Clickeable y accesible
    </div>
  );
}
```

## Notas Adicionales

- **Siempre preferir elementos nativos** (`<button>`, `<a>`) sobre elementos custom
- Space debe prevenirse con `preventDefault()` para evitar scroll
- Considerar tambien Escape para cerrar elementos
- Los elementos con `role="link"` solo necesitan Enter, no Space
- No olvidar estilos de focus visible

## Referencias

- [WAI-ARIA: Keyboard Interaction](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [MDN: Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
