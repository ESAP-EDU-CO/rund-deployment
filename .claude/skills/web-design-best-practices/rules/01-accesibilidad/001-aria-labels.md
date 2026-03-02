# 001: Etiquetas ARIA en Botones de Icono

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A001 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los botones que solo contienen iconos (sin texto visible) deben tener un atributo `aria-label` que describa su funcion. Sin este atributo, los usuarios de lectores de pantalla no pueden entender que hace el boton.

## Regla

Todo elemento `<button>` o elemento con `role="button"` que contenga solo un icono (SVG, imagen, o icono de fuente) debe tener un atributo `aria-label` descriptivo.

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Boton sin descripcion accesible -->
<button class="icon-btn">
  <svg><!-- icono de cerrar --></svg>
</button>

<!-- Mal: Usando title en lugar de aria-label -->
<button title="Cerrar">
  <svg><!-- icono de cerrar --></svg>
</button>

<!-- Mal: aria-label vacio -->
<button aria-label="">
  <svg><!-- icono de cerrar --></svg>
</button>
```

## Patron Correcto

```html
<!-- Bien: aria-label descriptivo -->
<button aria-label="Cerrar modal">
  <svg aria-hidden="true"><!-- icono de cerrar --></svg>
</button>

<!-- Bien: Con icono decorativo oculto -->
<button aria-label="Eliminar elemento">
  <i class="fa fa-trash" aria-hidden="true"></i>
</button>

<!-- Bien: Combinando texto visible e icono -->
<button>
  <svg aria-hidden="true"><!-- icono --></svg>
  <span>Guardar</span>
</button>
```

## Tailwind CSS

```html
<!-- Boton de icono con Tailwind -->
<button
  aria-label="Menu de navegacion"
  class="p-2 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
>
  <svg class="w-6 h-6" aria-hidden="true">
    <!-- icono de menu hamburguesa -->
  </svg>
</button>
```

## Deteccion Automatica

**Patron a buscar:**
- Elementos `<button>` que contengan solo `<svg>`, `<img>`, o `<i>` sin texto
- Elementos con `role="button"` sin contenido textual
- Botones sin `aria-label` o con `aria-label=""`

**Expresion regular:**
```regex
<button[^>]*>[\s]*<(svg|img|i|span class="[^"]*icon)[^>]*>.*?<\/\1>[\s]*<\/button>
```

## Notas Adicionales

- El `aria-label` debe ser descriptivo y conciso (ej: "Cerrar modal", no "X" o "Boton")
- Si el icono tiene significado, usar `aria-label` en el boton, no en el icono
- Los iconos dentro de botones con `aria-label` deben tener `aria-hidden="true"`
- Preferir `aria-label` sobre `title` para accesibilidad
- El texto del `aria-label` debe estar traducido si la aplicacion es multilenguaje

## Referencias

- [WAI-ARIA: aria-label](https://www.w3.org/TR/wai-aria/#aria-label)
- [MDN: Accessible Icon Buttons](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)
