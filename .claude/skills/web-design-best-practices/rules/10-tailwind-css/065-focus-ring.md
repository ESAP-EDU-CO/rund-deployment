# 065: Uso de focus:ring-* en Tailwind

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | TW001 |
| **Severidad** | Critical |
| **Categoria** | Tailwind CSS |
| **Fuente** | Best Practices |

## Descripcion

Usar las utilidades `focus-visible:ring-*` de Tailwind para indicadores de focus accesibles y consistentes en lugar de estilos personalizados.

## Regla

1. Usar `focus-visible:ring-*` para focus rings
2. Incluir `focus:outline-none` junto con ring
3. Usar `ring-offset-*` para separacion del borde

## Patron Correcto

```html
<!-- Boton con focus ring -->
<button class="
  px-4 py-2
  bg-blue-600 text-white
  rounded-lg
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
">
  Boton
</button>

<!-- Input con focus ring -->
<input
  type="text"
  class="
    px-3 py-2
    border border-gray-300
    rounded-lg
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
    focus-visible:border-blue-500
  "
/>

<!-- Card interactiva -->
<article
  tabindex="0"
  class="
    p-4 border rounded-xl
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-blue-500
  "
>
  Contenido
</article>
```

## Configuracion en tailwind.config.js

```javascript
module.exports = {
  theme: {
    extend: {
      ringColor: {
        DEFAULT: '#3b82f6',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
    },
  },
};
```

## Variantes Utiles

| Clase | Uso |
|-------|-----|
| `ring-2` | Ancho del ring (2px) |
| `ring-blue-500` | Color del ring |
| `ring-offset-2` | Espacio entre elemento y ring |
| `ring-offset-white` | Color del offset (fondo) |
| `focus-visible:ring-*` | Solo con navegacion teclado |

## Anti-Patrones

```html
<!-- Mal: Solo focus:outline-none sin ring -->
<button class="focus:outline-none">
  Sin indicador de focus
</button>

<!-- Mal: focus: en lugar de focus-visible: -->
<button class="focus:ring-2">
  Ring visible al hacer click
</button>
```

## Referencias

- [Tailwind: Ring](https://tailwindcss.com/docs/ring-width)
