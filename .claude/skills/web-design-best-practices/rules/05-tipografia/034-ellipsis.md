# 034: Usar Caracter Ellipsis Real

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | T001 |
| **Severidad** | Warning |
| **Categoria** | Tipografia |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Usar el caracter de elipsis tipografico (`…` U+2026) en lugar de tres puntos (`...`). El caracter de elipsis es un unico glifo disenado tipograficamente.

## Regla

- Usar `…` en lugar de `...`
- Usar `&hellip;` en HTML
- Usar `\u2026` en JavaScript

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Tres puntos separados -->
<p>Cargando...</p>
<span>Ver mas...</span>
```

## Patron Correcto

```html
<!-- Bien: Caracter ellipsis -->
<p>Cargando&hellip;</p>
<span>Ver mas&hellip;</span>

<!-- O directamente el caracter -->
<p>Cargando…</p>
```

```jsx
// JavaScript
const loadingText = 'Cargando\u2026';
const moreText = `Ver mas…`;
```

## CSS para Truncado

```css
/* Truncar texto con ellipsis */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Truncar multiples lineas */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## Tailwind CSS

```html
<!-- Truncar una linea -->
<p class="truncate">Texto muy largo que sera truncado...</p>

<!-- Truncar multiples lineas -->
<p class="line-clamp-3">
  Texto largo que se truncara despues de tres lineas…
</p>
```

## Notas

- El caracter ellipsis tiene espaciado correcto entre puntos
- Es un solo caracter, facilitando busqueda y accesibilidad
- Algunos lectores de pantalla lo anuncian diferente

## Referencias

- [Typography: Ellipsis](https://practicaltypography.com/ellipses.html)
