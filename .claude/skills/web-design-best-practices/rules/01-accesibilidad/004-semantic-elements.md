# 004: Uso de Elementos Semanticos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A004 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Usar elementos HTML semanticos apropiados para cada proposito. Los botones deben ser `<button>`, los enlaces deben ser `<a>`, las listas deben ser `<ul>/<ol>`, etc. Los elementos semanticos proporcionan accesibilidad incorporada y comportamiento de teclado esperado.

## Regla

- Usar `<button>` para acciones (no `<div onClick>`)
- Usar `<a>` o `<Link>` para navegacion (no `<div onClick>`)
- Usar `<nav>` para navegacion principal
- Usar `<main>` para contenido principal
- Usar `<header>` y `<footer>` para cabecera y pie
- Usar `<article>` para contenido independiente
- Usar `<section>` para secciones tematicas
- Usar `<aside>` para contenido complementario

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Div como boton -->
<div class="btn" onclick="submitForm()">
  Enviar
</div>

<!-- Mal: Span como enlace -->
<span class="link" onclick="navigate('/about')">
  Acerca de
</span>

<!-- Mal: Div para navegacion sin semantica -->
<div class="nav">
  <div class="nav-item" onclick="goHome()">Inicio</div>
  <div class="nav-item" onclick="goProducts()">Productos</div>
</div>

<!-- Mal: Lista sin elementos de lista -->
<div class="list">
  <div class="list-item">Item 1</div>
  <div class="list-item">Item 2</div>
</div>
```

## Patron Correcto

```html
<!-- Bien: Button para acciones -->
<button type="submit" class="btn">
  Enviar
</button>

<!-- Bien: Anchor para navegacion -->
<a href="/about" class="link">
  Acerca de
</a>

<!-- Bien: Nav con enlaces -->
<nav aria-label="Navegacion principal">
  <ul>
    <li><a href="/">Inicio</a></li>
    <li><a href="/productos">Productos</a></li>
  </ul>
</nav>

<!-- Bien: Lista semantica -->
<ul class="list">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

## Estructura de Pagina Semantica

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Sitio Web</title>
</head>
<body>
  <header>
    <nav aria-label="Navegacion principal">
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/productos">Productos</a></li>
        <li><a href="/contacto">Contacto</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1>Titulo del Articulo</h1>
        <time datetime="2024-01-15">15 de enero, 2024</time>
      </header>

      <section aria-labelledby="intro">
        <h2 id="intro">Introduccion</h2>
        <p>Contenido de la seccion...</p>
      </section>

      <section aria-labelledby="contenido">
        <h2 id="contenido">Contenido Principal</h2>
        <p>Mas contenido...</p>
      </section>
    </article>

    <aside aria-label="Articulos relacionados">
      <h2>Relacionados</h2>
      <ul>
        <li><a href="/articulo-1">Articulo 1</a></li>
        <li><a href="/articulo-2">Articulo 2</a></li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2024 Mi Sitio Web</p>
  </footer>
</body>
</html>
```

## Tabla de Elementos Semanticos

| Proposito | Elemento Correcto | Evitar |
|-----------|------------------|--------|
| Accion/click | `<button>` | `<div onclick>`, `<span onclick>` |
| Navegacion | `<a href>`, `<Link>` | `<div onclick>`, `<span onclick>` |
| Lista de items | `<ul>`, `<ol>`, `<dl>` | `<div>` repetidos |
| Datos tabulares | `<table>` | `<div>` con grid |
| Encabezados | `<h1>` - `<h6>` | `<div class="title">` |
| Parrafos | `<p>` | `<div>` |
| Enfasis | `<em>`, `<strong>` | `<span style="font-style">` |
| Citas | `<blockquote>`, `<q>` | `<div class="quote">` |
| Codigo | `<code>`, `<pre>` | `<span class="code">` |
| Fechas | `<time datetime>` | `<span>` |

## React/Next.js

```jsx
// Bien: Componente con elementos semanticos
import Link from 'next/link';

function Navigation() {
  return (
    <nav aria-label="Navegacion principal">
      <ul className="flex gap-4">
        <li>
          <Link href="/" className="text-blue-600 hover:underline">
            Inicio
          </Link>
        </li>
        <li>
          <Link href="/productos" className="text-blue-600 hover:underline">
            Productos
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="p-4 border rounded-lg">
      <header>
        <h3>{product.name}</h3>
      </header>
      <p>{product.description}</p>
      <footer className="mt-4">
        <button
          onClick={() => onAddToCart(product.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Agregar al carrito
        </button>
      </footer>
    </article>
  );
}
```

## Deteccion Automatica

**Patrones a buscar:**
- `<div>` o `<span>` con `onClick` para acciones/navegacion
- Listas de items sin usar `<ul>`, `<ol>`, o `<dl>`
- Falta de landmarks (`<nav>`, `<main>`, `<header>`, `<footer>`)

**Expresion regular:**
```regex
<(div|span)[^>]*onclick\s*=\s*["'][^"']*navigate|router\.push|window\.location
```

## Notas Adicionales

- Los elementos semanticos tienen accesibilidad incorporada
- Los lectores de pantalla anuncian los roles de los elementos semanticos
- Los navegadores proporcionan estilos y comportamientos por defecto
- ARIA deberia usarse solo cuando no hay un elemento semantico apropiado
- "No ARIA is better than bad ARIA"

## Referencias

- [HTML5 Semantics](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)
- [WAI-ARIA Landmarks](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
