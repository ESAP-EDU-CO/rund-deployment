# 066: Variante dark: Consistente

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | TW002 |
| **Severidad** | Warning |
| **Categoria** | Tailwind CSS |
| **Fuente** | Best Practices |

## Descripcion

Usar la variante `dark:` de forma consistente para implementar modo oscuro, asegurando que todos los elementos tengan su contraparte dark.

## Regla

1. Cada color de texto debe tener su variante dark
2. Cada color de fondo debe tener su variante dark
3. Los bordes y sombras tambien necesitan variantes

## Configuracion

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // o 'media'
};
```

## Patron Correcto

```html
<!-- Texto con dark mode -->
<p class="text-gray-900 dark:text-gray-100">
  Texto adaptativo
</p>

<!-- Fondo con dark mode -->
<div class="bg-white dark:bg-gray-900">
  Contenido
</div>

<!-- Componente completo -->
<article class="
  p-6
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border border-gray-200 dark:border-gray-700
  shadow-sm dark:shadow-gray-900/20
  rounded-xl
">
  <h2 class="text-lg font-bold text-gray-900 dark:text-white">
    Titulo
  </h2>
  <p class="text-gray-600 dark:text-gray-400">
    Descripcion
  </p>
</article>

<!-- Boton con dark mode -->
<button class="
  bg-blue-600 dark:bg-blue-500
  text-white
  hover:bg-blue-700 dark:hover:bg-blue-600
  focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400
">
  Accion
</button>
```

## Escala de Colores Recomendada

| Light Mode | Dark Mode |
|------------|-----------|
| white | gray-900 |
| gray-50 | gray-800 |
| gray-100 | gray-700 |
| gray-900 | gray-100 |
| blue-600 | blue-500 |

## Anti-Patrones

```html
<!-- Mal: Sin variante dark -->
<p class="text-gray-900">
  No visible en dark mode
</p>

<!-- Mal: Inconsistente -->
<div class="bg-white dark:bg-black text-gray-900">
  Falta dark: en texto
</div>
```

## Script de Validacion

```javascript
// Buscar clases sin variante dark
const lightOnlyClasses = ['bg-white', 'text-gray-900', 'border-gray-200'];
// Verificar que tengan su contraparte dark:
```

## Referencias

- [Tailwind: Dark Mode](https://tailwindcss.com/docs/dark-mode)
