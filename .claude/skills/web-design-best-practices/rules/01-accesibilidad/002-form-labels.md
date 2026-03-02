# 002: Labels en Controles de Formulario

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A002 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Todos los controles de formulario (`<input>`, `<select>`, `<textarea>`) deben tener una etiqueta asociada mediante `<label>` o `aria-label`. Esto permite a los usuarios de lectores de pantalla entender el proposito del campo.

## Regla

Cada control de formulario debe tener:
1. Un elemento `<label>` asociado via `for`/`htmlFor` que coincida con el `id` del control, O
2. Un `<label>` que envuelva al control, O
3. Un atributo `aria-label` descriptivo, O
4. Un atributo `aria-labelledby` que referencie otro elemento

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Input sin label asociado -->
<input type="text" id="nombre" placeholder="Tu nombre">

<!-- Mal: Label sin for y sin envolver -->
<label>Nombre</label>
<input type="text" id="nombre">

<!-- Mal: Usando solo placeholder como etiqueta -->
<input type="email" placeholder="Email">

<!-- Mal: Label con for incorrecto -->
<label for="user-name">Nombre</label>
<input type="text" id="nombre">
```

## Patron Correcto

```html
<!-- Bien: Label con for/htmlFor -->
<label for="nombre">Nombre completo</label>
<input type="text" id="nombre" name="nombre">

<!-- Bien: Label envolviendo al input -->
<label>
  Correo electronico
  <input type="email" name="email">
</label>

<!-- Bien: aria-label para campos sin label visible -->
<input
  type="search"
  aria-label="Buscar productos"
  placeholder="Buscar..."
>

<!-- Bien: aria-labelledby referenciando otro elemento -->
<h2 id="seccion-contacto">Informacion de contacto</h2>
<input
  type="tel"
  aria-labelledby="seccion-contacto"
  placeholder="Telefono"
>
```

## Tailwind CSS

```html
<!-- Campo con label visible -->
<div class="flex flex-col gap-1">
  <label for="email" class="text-sm font-medium text-gray-700">
    Correo electronico
  </label>
  <input
    type="email"
    id="email"
    name="email"
    class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="tu@email.com"
  >
</div>

<!-- Campo de busqueda con label oculto visualmente -->
<div class="relative">
  <label for="search" class="sr-only">Buscar</label>
  <input
    type="search"
    id="search"
    class="pl-10 pr-4 py-2 w-full border rounded-lg"
    placeholder="Buscar..."
  >
  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true">
    <!-- icono de busqueda -->
  </svg>
</div>
```

## Labels Ocultos Visualmente

Cuando el diseno no permite un label visible, usar `sr-only` (screen reader only):

```html
<label for="search" class="sr-only">Buscar en el sitio</label>
<input type="search" id="search" placeholder="Buscar...">
```

```css
/* Equivalente CSS de sr-only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Deteccion Automatica

**Patrones a buscar:**
- Elementos `<input>` sin `id` y sin `aria-label`
- Elementos `<label>` con `for` que no coincide con ningun `id`
- Inputs sin label asociado ni atributos ARIA

**Expresion regular para inputs sin label:**
```regex
<input[^>]*(?!aria-label)[^>]*>(?![\s\S]*?<label[^>]*for=)
```

## Notas Adicionales

- Los placeholders NO son sustitutos de labels (desaparecen al escribir)
- Labels clickeables mejoran la usabilidad (el click en el label enfoca el campo)
- Para campos requeridos, indicar con asterisco visible Y `aria-required="true"`
- Agrupar campos relacionados con `<fieldset>` y `<legend>`
- El texto del label debe ser descriptivo y conciso

## Referencias

- [WAI-ARIA: Form Labels](https://www.w3.org/WAI/tutorials/forms/labels/)
- [MDN: The Label Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
