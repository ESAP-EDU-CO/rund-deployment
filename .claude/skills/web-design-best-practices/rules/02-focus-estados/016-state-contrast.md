# 016: Jerarquia de Contraste en Estados Interactivos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F006 |
| **Severidad** | Warning |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los estados interactivos deben tener una jerarquia de contraste clara: hover y active/focus deben ser mas prominentes que el estado de reposo. Esto proporciona retroalimentacion visual progresiva al usuario.

## Regla

La jerarquia de prominencia debe ser:
1. **Reposo**: Estado base, menos prominente
2. **Hover**: Mas prominente que reposo
3. **Focus**: Igual o mas prominente que hover
4. **Active (pressed)**: Maximo contraste, feedback inmediato
5. **Disabled**: Menos prominente que todos, visualmente "apagado"

## Anti-Patron (Incorrecto)

```css
/* Mal: Hover menos prominente que reposo */
.button {
  background: #2563eb;
}
.button:hover {
  background: #60a5fa; /* Mas claro = menos prominente */
}

/* Mal: Focus menos visible que hover */
.button:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.button:focus {
  background: #3b82f6; /* Vuelve al estado normal */
  box-shadow: none;
}

/* Mal: Active sin diferenciacion */
.button:active {
  background: #3b82f6; /* Igual que reposo */
}
```

## Patron Correcto

```css
/* Bien: Jerarquia progresiva de contraste */
.button {
  /* Reposo: Base */
  background: #3b82f6;
  color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.button:hover {
  /* Hover: Mas oscuro/prominente */
  background: #2563eb;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.button:focus-visible {
  /* Focus: Ring adicional */
  background: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.button:active {
  /* Active: Maximo contraste, feedback de presion */
  background: #1d4ed8;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transform: scale(0.98);
}

.button:disabled {
  /* Disabled: "Apagado" */
  background: #9ca3af;
  color: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}
```

## Escala de Contraste Visual

```
Estado      | Luminosidad | Sombra    | Escala
----------- | ----------- | --------- | ------
Disabled    | 60%         | none      | 100%
Reposo      | 50%         | sm        | 100%
Hover       | 45%         | md        | 100%
Focus       | 45%         | ring      | 100%
Active      | 40%         | sm        | 98%
```

## Ejemplo con Colores HSL

```css
:root {
  --primary-h: 217;
  --primary-s: 91%;
}

.button {
  /* Reposo: L = 54% */
  background: hsl(var(--primary-h), var(--primary-s), 54%);
  transition: all 0.2s;
}

.button:hover {
  /* Hover: L = 48% (mas oscuro) */
  background: hsl(var(--primary-h), var(--primary-s), 48%);
}

.button:focus-visible {
  /* Focus: L = 48% + ring */
  background: hsl(var(--primary-h), var(--primary-s), 48%);
  box-shadow: 0 0 0 3px hsla(var(--primary-h), var(--primary-s), 54%, 0.5);
}

.button:active {
  /* Active: L = 42% (mas oscuro aun) */
  background: hsl(var(--primary-h), var(--primary-s), 42%);
}
```

## Tailwind CSS

```html
<!-- Boton con jerarquia correcta -->
<button class="
  px-4 py-2 rounded-lg
  bg-blue-500 text-white
  shadow-sm
  transition-all duration-200

  hover:bg-blue-600
  hover:shadow-md

  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2

  active:bg-blue-700
  active:shadow-sm
  active:scale-[0.98]

  disabled:bg-gray-400
  disabled:text-gray-200
  disabled:shadow-none
  disabled:cursor-not-allowed
">
  Boton Primario
</button>

<!-- Link con jerarquia -->
<a href="#" class="
  text-blue-600
  underline-offset-4

  hover:text-blue-800
  hover:underline

  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:rounded

  active:text-blue-900
">
  Enlace
</a>

<!-- Card interactiva -->
<article class="
  p-6 bg-white rounded-xl
  border border-gray-200
  shadow-sm
  transition-all duration-200

  hover:border-gray-300
  hover:shadow-md
  hover:-translate-y-0.5

  focus-within:ring-2
  focus-within:ring-blue-500

  active:shadow-sm
  active:translate-y-0
">
  Contenido
</article>
```

## React/JSX - Sistema de Estados

```jsx
// Sistema de estilos con jerarquia correcta
const stateStyles = {
  // Base styles con transiciones
  base: `
    transition-all duration-200 ease-out
    focus:outline-none
  `,

  // Estados por variante
  primary: {
    rest: 'bg-blue-500 shadow-sm',
    hover: 'hover:bg-blue-600 hover:shadow-md',
    focus: 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    active: 'active:bg-blue-700 active:shadow-sm active:scale-[0.98]',
    disabled: 'disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none',
  },

  secondary: {
    rest: 'bg-gray-100 text-gray-800',
    hover: 'hover:bg-gray-200',
    focus: 'focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2',
    active: 'active:bg-gray-300 active:scale-[0.98]',
    disabled: 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
  },

  ghost: {
    rest: 'bg-transparent text-gray-600',
    hover: 'hover:bg-gray-100 hover:text-gray-900',
    focus: 'focus-visible:ring-2 focus-visible:ring-gray-500',
    active: 'active:bg-gray-200',
    disabled: 'disabled:text-gray-300 disabled:cursor-not-allowed',
  },
};

function Button({ variant = 'primary', children, ...props }) {
  const styles = stateStyles[variant];

  return (
    <button
      className={`
        px-4 py-2 rounded-lg font-medium
        ${stateStyles.base}
        ${styles.rest}
        ${styles.hover}
        ${styles.focus}
        ${styles.active}
        ${styles.disabled}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Validacion Visual

```
Estado    | bg-blue-* | Contraste | Feedback Visual
--------- | --------- | --------- | ---------------
Reposo    | 500       | Base      | Color solido
Hover     | 600       | +10%      | Mas oscuro + sombra
Focus     | 600       | +10%      | Ring azul
Active    | 700       | +20%      | Muy oscuro + scale
Disabled  | gray-400  | -30%      | Gris + opaco
```

## Consideraciones

- La jerarquia debe ser perceptible pero no exagerada
- Usuarios daltonicos: combinar color + otro indicador (sombra, borde)
- Transiciones suaves (150-250ms) para cambios de estado
- El estado active debe dar feedback inmediato de "presion"
- Disabled debe ser claramente diferente de todos los demas

## Notas Adicionales

- Probar en diferentes monitores y condiciones de luz
- El contraste minimo para estados debe ser 3:1
- Considerar modo oscuro (invertir la logica de claro/oscuro)
- Usar herramientas como Stark o Colour Contrast Checker

## Referencias

- [WCAG: Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast)
- [Material Design: Interaction States](https://m3.material.io/foundations/interaction/states)
