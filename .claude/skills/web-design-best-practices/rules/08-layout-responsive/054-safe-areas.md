# 054: Safe Areas para Dispositivos con Notch

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | SA001 |
| **Severidad** | Warning |
| **Categoria** | Layout y Responsive |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los layouts full-bleed (que ocupan toda la pantalla) deben usar `env(safe-area-inset-*)` para evitar que el contenido quede oculto por notches, barras de navegacion, o esquinas redondeadas.

## Regla

Usar safe area insets en:
- Headers y footers fijos
- Navegacion inferior
- Contenido que toca los bordes de la pantalla

## Implementacion

```css
/* Meta viewport requerido */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

/* Header fijo con safe area */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Footer fijo */
.footer {
  position: fixed;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Contenedor principal */
.main-content {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
}
```

## Tailwind CSS (con plugin)

```html
<!-- Con @tailwindcss/safe-area o valores arbitrarios -->
<header class="
  fixed top-0 inset-x-0
  pt-[env(safe-area-inset-top)]
  px-[max(1rem,env(safe-area-inset-left))]
">
  Header
</header>

<nav class="
  fixed bottom-0 inset-x-0
  pb-[env(safe-area-inset-bottom)]
">
  Navegacion
</nav>
```

## Valores de Safe Area

| Variable | Uso |
|----------|-----|
| `safe-area-inset-top` | Notch, status bar |
| `safe-area-inset-bottom` | Home indicator |
| `safe-area-inset-left` | Esquinas en landscape |
| `safe-area-inset-right` | Esquinas en landscape |

## Referencias

- [MDN: env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Apple: Designing for iPhone X](https://developer.apple.com/design/human-interface-guidelines/layout)
