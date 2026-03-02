# 013: Usar :focus-visible sobre :focus

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F003 |
| **Severidad** | Warning |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Preferir `:focus-visible` sobre `:focus` para estilos de focus. `:focus-visible` solo aplica estilos cuando el usuario navega con teclado, evitando el anillo de focus molesto al hacer clic con el mouse.

## Regla

1. Usar `:focus-visible` para mostrar indicadores de focus
2. `:focus` muestra el focus ring siempre (incluso al hacer clic)
3. `:focus-visible` solo muestra el focus ring cuando es necesario (navegacion por teclado)

## Anti-Patron (Incorrecto)

```css
/* No ideal: Muestra focus ring al hacer clic */
button:focus {
  outline: 2px solid blue;
}

/* No ideal: Los usuarios de mouse ven el ring */
a:focus {
  box-shadow: 0 0 0 3px rgba(0, 0, 255, 0.5);
}
```

## Patron Correcto

```css
/* Bien: Solo muestra focus ring con teclado */
button:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}

/* Bien: Focus visible para enlaces */
a:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  border-radius: 2px;
}

/* Bien: Remover focus estandar, agregar focus-visible */
input:focus {
  outline: none;
}

input:focus-visible {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
```

## Comparacion: :focus vs :focus-visible

| Comportamiento | `:focus` | `:focus-visible` |
|---------------|---------|-----------------|
| Click con mouse | Muestra estilos | No muestra estilos |
| Navegacion Tab | Muestra estilos | Muestra estilos |
| Programatic focus | Muestra estilos | Depende del contexto |
| Touch en movil | Muestra estilos | No muestra estilos |

## Tailwind CSS

```html
<!-- Usar focus-visible: en lugar de focus: -->

<!-- Correcto -->
<button class="
  px-4 py-2 bg-blue-600 text-white rounded
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
">
  Guardar
</button>

<!-- Alternativa si necesitas ambos -->
<input class="
  border border-gray-300 rounded px-3 py-2
  focus:border-blue-500
  focus-visible:ring-2
  focus-visible:ring-blue-500/20
"/>

<!-- Botones con estilos completos -->
<button class="
  px-6 py-3
  bg-gradient-to-r from-blue-500 to-blue-600
  text-white font-medium
  rounded-lg
  shadow-md
  hover:shadow-lg
  hover:from-blue-600 hover:to-blue-700
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-400
  focus-visible:ring-offset-2
  transition-all duration-200
">
  Continuar
</button>
```

## Soporte de Navegadores

`:focus-visible` tiene soporte en todos los navegadores modernos:

| Navegador | Soporte |
|-----------|---------|
| Chrome | 86+ |
| Firefox | 85+ |
| Safari | 15.4+ |
| Edge | 86+ |

## Fallback para Navegadores Antiguos

```css
/* Fallback con @supports */
button:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}

@supports selector(:focus-visible) {
  button:focus {
    outline: none;
  }

  button:focus-visible {
    outline: 2px solid blue;
    outline-offset: 2px;
  }
}

/* Alternativa con JavaScript polyfill */
/* focus-visible-polyfill agrega la clase .focus-visible */
.js-focus-visible button:focus:not(.focus-visible) {
  outline: none;
}

.js-focus-visible button.focus-visible {
  outline: 2px solid blue;
}
```

## React/JSX

```jsx
// Componente con focus-visible
function InteractiveCard({ href, children }) {
  return (
    <a
      href={href}
      className="
        block p-4 rounded-lg border
        hover:shadow-md
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
        transition-shadow
      "
    >
      {children}
    </a>
  );
}

// Sistema de botones
const buttonStyles = {
  base: `
    px-4 py-2 rounded-lg font-medium
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-offset-2
    transition-colors
  `,
  variants: {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus-visible:ring-blue-500
    `,
    secondary: `
      bg-gray-100 text-gray-900
      hover:bg-gray-200
      focus-visible:ring-gray-500
    `,
  },
};

function Button({ variant = 'primary', children, ...props }) {
  return (
    <button
      className={`${buttonStyles.base} ${buttonStyles.variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Casos Especiales

### Inputs (siempre mostrar focus)

Para inputs, a veces es mejor mostrar focus siempre ya que el usuario necesita saber donde esta escribiendo:

```css
/* Inputs pueden usar :focus */
input:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* O combinacion de ambos */
input:focus {
  border-color: #2563eb;
}

input:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
```

### Elementos dentro de modales

```css
/* Focus mas prominente en modales */
.modal button:focus-visible,
.modal a:focus-visible {
  outline: 2px solid white;
  outline-offset: 4px;
  box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.3);
}
```

## Deteccion Automatica

**Patron CSS a modernizar:**
```regex
:focus\s*\{[^}]*outline[^}]*\}(?![^{]*:focus-visible)
```

**Script de migracion:**
```javascript
// Encontrar reglas :focus que deberian ser :focus-visible
function auditFocusStyles(stylesheet) {
  const rules = stylesheet.cssRules;
  const suggestions = [];

  for (const rule of rules) {
    if (rule.selectorText?.includes(':focus') &&
        !rule.selectorText?.includes(':focus-visible')) {
      suggestions.push({
        selector: rule.selectorText,
        suggestion: rule.selectorText.replace(':focus', ':focus-visible'),
      });
    }
  }

  return suggestions;
}
```

## Notas Adicionales

- `:focus-visible` es el estandar moderno para indicadores de focus
- Mejora la UX para usuarios de mouse sin afectar accesibilidad
- Los inputs de texto pueden beneficiarse de `:focus` para el borde
- Siempre probar con navegacion por teclado (Tab)
- Considerar combinacion: `:focus` para borde sutil, `:focus-visible` para ring prominente

## Referencias

- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [CSS Tricks: focus-visible](https://css-tricks.com/almanac/selectors/f/focus-visible/)
