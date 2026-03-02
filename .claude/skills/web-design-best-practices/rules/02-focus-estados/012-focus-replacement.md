# 012: Nunca outline-none sin Reemplazo

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F002 |
| **Severidad** | Critical |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Nunca eliminar el outline de focus (`outline: none`, `outline: 0`) sin proporcionar un indicador de focus alternativo visible. Los usuarios de teclado dependen de estos indicadores para saber donde esta el focus.

## Regla

Si eliminas el outline por defecto, DEBES proporcionar:
1. Un `box-shadow` visible como indicador de focus
2. Un `border` que cambie de color
3. Un `outline` personalizado (diferente al por defecto)
4. Una combinacion de los anteriores

## Anti-Patron (Incorrecto)

```css
/* Mal: outline removido sin reemplazo */
button:focus {
  outline: none;
}

/* Mal: Reset global sin alternativa */
*:focus {
  outline: 0;
}

/* Mal: Outline transparente */
a:focus {
  outline: transparent;
}

/* Mal: Solo cambia el fondo (insuficiente) */
button:focus {
  outline: none;
  background-color: #f0f0f0;
}
```

```html
<!-- Mal: Inline style -->
<button style="outline: none;">Guardar</button>

<!-- Mal: Clase que elimina focus -->
<a href="/" class="no-focus-ring">Inicio</a>
```

## Patron Correcto

```css
/* Bien: outline:none CON reemplazo */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Bien: outline:none CON borde alternativo */
input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Bien: outline personalizado */
a:focus-visible {
  outline: 2px dashed #2563eb;
  outline-offset: 4px;
}

/* Bien: Combinacion de indicadores */
button:focus-visible {
  outline: none;
  border-color: #2563eb;
  box-shadow:
    0 0 0 2px white,
    0 0 0 4px #2563eb;
}
```

## Tailwind CSS - Patron Correcto

```html
<!-- CORRECTO: focus:outline-none CON focus-visible:ring-* -->
<button class="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
">
  Guardar
</button>

<!-- INCORRECTO: solo focus:outline-none -->
<button class="focus:outline-none">
  Guardar
</button>

<!-- CORRECTO: outline-none con alternativa de borde -->
<input class="
  border-2 border-gray-300
  focus:outline-none
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-500/20
"/>
```

## Configuracion Tailwind para Focus

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // Colores de ring personalizados
      ringColor: {
        focus: '#2563eb',
      },
      ringOffsetWidth: {
        3: '3px',
      },
    },
  },
  plugins: [
    // Plugin para focus seguro
    function({ addBase }) {
      addBase({
        // Asegurar que focus-visible tenga estilos por defecto
        ':focus-visible': {
          outline: '2px solid #2563eb',
          outlineOffset: '2px',
        },
      });
    },
  ],
};
```

## Estilos por Tipo de Elemento

```css
/* Sistema de focus consistente y seguro */

/* Botones */
button:focus-visible,
[role="button"]:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-color, white),
    0 0 0 4px var(--focus-color, #2563eb);
}

/* Enlaces */
a:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  border-radius: 2px;
}

/* Inputs */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  border-color: var(--focus-color, #2563eb);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Checkboxes y radios */
input[type="checkbox"]:focus-visible,
input[type="radio"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Cards interactivas */
[tabindex="0"]:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px white,
    0 0 0 4px var(--focus-color, #2563eb);
}
```

## React/JSX

```jsx
// HOC para asegurar focus visible
function withSafeFocus(WrappedComponent) {
  return function SafeFocusComponent(props) {
    const { className = '', ...rest } = props;

    const safeFocusClasses = `
      focus:outline-none
      focus-visible:ring-2
      focus-visible:ring-blue-500
      focus-visible:ring-offset-2
    `;

    return (
      <WrappedComponent
        className={`${safeFocusClasses} ${className}`}
        {...rest}
      />
    );
  };
}

// Uso
const SafeButton = withSafeFocus('button');

// Componente con focus seguro
function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`
        px-4 py-2 bg-blue-600 text-white rounded
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Validacion con ESLint

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsx-a11y'],
  rules: {
    // Detectar outline:none sin alternativa
    'jsx-a11y/no-noninteractive-tabindex': 'error',
  },
};
```

## Deteccion Automatica

**Patrones a buscar en CSS:**
```regex
outline:\s*(none|0|transparent)[^}]*}(?![^}]*(box-shadow|ring))
```

**Patrones a buscar en Tailwind:**
```regex
class="[^"]*focus:outline-none(?![^"]*focus-visible:ring)
```

**Script de validacion:**
```javascript
function checkFocusStyles(element) {
  const styles = getComputedStyle(element);
  element.focus();
  const focusStyles = getComputedStyle(element);

  const hasOutline = focusStyles.outline !== 'none' &&
                     focusStyles.outline !== '0px none';
  const hasBoxShadow = focusStyles.boxShadow !== 'none';
  const hasBorderChange = focusStyles.borderColor !== styles.borderColor;

  if (!hasOutline && !hasBoxShadow && !hasBorderChange) {
    console.warn('Elemento sin indicador de focus visible:', element);
    return false;
  }
  return true;
}
```

## Notas Adicionales

- WCAG requiere indicador de focus con contraste 3:1 minimo
- El area del indicador debe tener al menos 1px de grosor
- Combinar forma + color para usuarios daltonicos
- Probar con modo de alto contraste de Windows
- Considerar modo oscuro al elegir colores de focus

## Referencias

- [WCAG: Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [Deque: Removing focus outline is bad](https://www.deque.com/blog/give-site-focus-tips-designing-usable-focus-indicators/)
