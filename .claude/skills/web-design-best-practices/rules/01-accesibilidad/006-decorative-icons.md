# 006: Ocultar Iconos Decorativos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A006 |
| **Severidad** | Warning |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los iconos puramente decorativos (que no aportan informacion adicional) deben ocultarse de los lectores de pantalla usando `aria-hidden="true"`. Esto evita anuncios innecesarios y confusos.

## Regla

Agregar `aria-hidden="true"` a:
- Iconos decorativos junto a texto descriptivo
- Iconos que repiten informacion ya presente en el texto
- Elementos visuales puramente esteticos (separadores, adornos)
- Iconos dentro de botones que ya tienen texto o aria-label

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Icono decorativo sin ocultar -->
<button>
  <svg><!-- icono de guardar --></svg>
  Guardar
</button>
<!-- Lector de pantalla: "imagen guardar" -->

<!-- Mal: Icono con titulo innecesario -->
<span>
  <svg title="correo"><path>...</path></svg>
  Enviar email
</span>
<!-- Lector de pantalla: "correo Enviar email" -->

<!-- Mal: Icono decorativo visible para AT -->
<p>
  <i class="fa fa-star"></i>
  Este producto tiene 5 estrellas
</p>
```

## Patron Correcto

```html
<!-- Bien: Icono decorativo oculto -->
<button>
  <svg aria-hidden="true"><!-- icono de guardar --></svg>
  Guardar
</button>
<!-- Lector de pantalla: "Guardar" -->

<!-- Bien: Icono Font Awesome oculto -->
<span>
  <i class="fa fa-envelope" aria-hidden="true"></i>
  Enviar email
</span>

<!-- Bien: Decoracion puramente visual -->
<p>
  <span aria-hidden="true">★</span>
  Este producto tiene 5 estrellas
</p>

<!-- Bien: Separador decorativo -->
<span aria-hidden="true" class="separator">|</span>
```

## Iconos Funcionales vs Decorativos

| Situacion | Icono es... | Accion |
|-----------|-------------|--------|
| Boton solo icono | Funcional | `aria-label` en boton |
| Icono + texto visible | Decorativo | `aria-hidden="true"` |
| Icono indica estado | Funcional | Texto alternativo oculto |
| Icono es adorno visual | Decorativo | `aria-hidden="true"` |

## React/JSX

```jsx
// Bien: Icono decorativo en boton con texto
function SaveButton({ onClick }) {
  return (
    <button onClick={onClick} className="btn">
      <SaveIcon aria-hidden="true" className="w-5 h-5" />
      <span>Guardar</span>
    </button>
  );
}

// Bien: Icono solo - necesita aria-label
function IconButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Cerrar">
      <CloseIcon aria-hidden="true" className="w-5 h-5" />
    </button>
  );
}

// Bien: Icono indica estado - texto oculto
function StatusIndicator({ isOnline }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
        aria-hidden="true"
      />
      <span className="sr-only">{isOnline ? 'En linea' : 'Desconectado'}</span>
      {isOnline ? 'En linea' : 'Desconectado'}
    </span>
  );
}
```

## SVG con aria-hidden

```html
<!-- SVG inline decorativo -->
<svg
  aria-hidden="true"
  class="w-6 h-6"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
</svg>

<!-- Componente SVG reutilizable -->
<svg
  aria-hidden="true"
  focusable="false"
  role="img"
  class="icon"
>
  <use href="#icon-check" />
</svg>
```

## Tailwind CSS

```html
<!-- Boton con icono y texto -->
<button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
  <svg aria-hidden="true" class="w-5 h-5">
    <path d="..." />
  </svg>
  <span>Descargar</span>
</button>

<!-- Elemento con decoracion -->
<div class="flex items-center gap-3">
  <span aria-hidden="true" class="text-2xl">🎉</span>
  <p>Felicidades por tu logro!</p>
</div>

<!-- Lista con iconos decorativos -->
<ul class="space-y-2">
  <li class="flex items-center gap-2">
    <svg aria-hidden="true" class="w-4 h-4 text-green-500">
      <path d="..." />
    </svg>
    Caracteristica incluida
  </li>
</ul>
```

## Deteccion Automatica

**Patrones a buscar:**
- `<svg>` o `<i>` dentro de `<button>` con texto, sin `aria-hidden`
- Iconos de fuentes (Font Awesome, Material Icons) sin `aria-hidden`
- Emojis junto a texto sin `aria-hidden`

**Expresion regular:**
```regex
<(svg|i)[^>]*class="[^"]*icon[^"]*"[^>]*>(?![^<]*aria-hidden)
```

## Notas Adicionales

- `aria-hidden="true"` oculta el elemento y sus hijos de tecnologias asistivas
- No usar `aria-hidden` en elementos que pueden recibir focus
- `role="presentation"` es similar pero menos soportado
- `focusable="false"` adicional en SVG previene focus en algunos navegadores
- Considerar si el icono aporta informacion que el texto no tiene

## Referencias

- [WAI-ARIA: aria-hidden](https://www.w3.org/TR/wai-aria/#aria-hidden)
- [Accessible SVG Icons](https://css-tricks.com/accessible-svg-icons/)
