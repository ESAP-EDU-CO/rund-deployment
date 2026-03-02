# 029: Solo Animar Transform y Opacity

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | AN002 |
| **Severidad** | Warning |
| **Categoria** | Animaciones |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Para animaciones performantes, solo animar propiedades que pueden ser manejadas por el compositor de GPU: `transform` y `opacity`. Evitar animar propiedades que causan repaint o reflow.

## Regla

Propiedades seguras para animar:
- `transform` (translate, scale, rotate)
- `opacity`

Evitar animar:
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `background-color`
- `border`

## Anti-Patron (Incorrecto)

```css
/* Mal: Animar propiedades que causan reflow */
.element {
  transition: width 0.3s, height 0.3s;
}

.element:hover {
  width: 200px;
  height: 200px;
}

/* Mal: Animar top/left */
.slide-in {
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from { left: -100px; }
  to { left: 0; }
}
```

## Patron Correcto

```css
/* Bien: Usar transform para movimiento */
.element {
  transition: transform 0.3s ease;
}

.element:hover {
  transform: scale(1.2);
}

/* Bien: Usar translate en lugar de top/left */
.slide-in {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(-100px); }
  to { transform: translateX(0); }
}

/* Bien: Combinar transform y opacity */
.fade-scale {
  transition: transform 0.3s, opacity 0.3s;
}

.fade-scale:hover {
  transform: scale(1.05);
  opacity: 0.9;
}
```

## Tailwind CSS

```html
<!-- Correcto: transform y opacity -->
<div class="
  transition-all duration-300
  hover:scale-105
  hover:opacity-90
">
  Contenido
</div>

<!-- Incorrecto: evitar transiciones de width/height -->
<!-- <div class="transition-all hover:w-64 hover:h-64"> -->
```

## Referencias

- [CSS Triggers](https://csstriggers.com/)
- [Google: Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering)
