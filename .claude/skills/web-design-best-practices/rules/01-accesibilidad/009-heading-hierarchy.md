# 009: Jerarquia de Encabezados

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A009 |
| **Severidad** | Warning |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los encabezados (`<h1>` a `<h6>`) deben seguir una jerarquia logica y secuencial. No saltar niveles (ej: de `<h1>` a `<h3>`). Los usuarios de lectores de pantalla usan encabezados para navegar por el contenido.

## Regla

1. Usar un solo `<h1>` por pagina (titulo principal)
2. Seguir jerarquia descendente: h1 → h2 → h3 → h4 → h5 → h6
3. No saltar niveles (no ir de h2 a h4)
4. Usar encabezados para estructura, no para estilos
5. Incluir skip link para saltar al contenido principal

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Multiples h1 -->
<h1>Mi Sitio Web</h1>
<article>
  <h1>Titulo del Articulo</h1>
</article>

<!-- Mal: Saltar niveles -->
<h1>Titulo Principal</h1>
<h3>Subtitulo</h3>  <!-- Deberia ser h2 -->
<h5>Seccion</h5>    <!-- Deberia ser h3 -->

<!-- Mal: Usar heading por estilo -->
<h4 class="small-text">Este texto debe ser pequeno</h4>

<!-- Mal: Jerarquia incorrecta en sidebar -->
<main>
  <h1>Contenido</h1>
  <h2>Seccion 1</h2>
</main>
<aside>
  <h1>Sidebar</h1>  <!-- Deberia ser h2 o inferior -->
</aside>
```

## Patron Correcto

```html
<!-- Bien: Jerarquia correcta -->
<body>
  <header>
    <h1>Mi Sitio Web</h1>
  </header>

  <nav aria-labelledby="nav-heading">
    <h2 id="nav-heading" class="sr-only">Navegacion principal</h2>
    <!-- enlaces de navegacion -->
  </nav>

  <main>
    <article>
      <h2>Titulo del Articulo</h2>

      <section>
        <h3>Introduccion</h3>
        <p>...</p>
      </section>

      <section>
        <h3>Contenido Principal</h3>
        <h4>Subseccion A</h4>
        <p>...</p>
        <h4>Subseccion B</h4>
        <p>...</p>
      </section>

      <section>
        <h3>Conclusion</h3>
        <p>...</p>
      </section>
    </article>
  </main>

  <aside aria-labelledby="sidebar-heading">
    <h2 id="sidebar-heading">Articulos Relacionados</h2>
    <h3>Articulo 1</h3>
    <h3>Articulo 2</h3>
  </aside>

  <footer>
    <h2 class="sr-only">Informacion del sitio</h2>
    <!-- contenido del footer -->
  </footer>
</body>
```

## Skip Link para Contenido Principal

```html
<body>
  <!-- Skip link (primer elemento focusable) -->
  <a href="#main-content" class="skip-link">
    Saltar al contenido principal
  </a>

  <header>
    <h1>Mi Sitio Web</h1>
    <nav><!-- navegacion extensa --></nav>
  </header>

  <main id="main-content" tabindex="-1">
    <h2>Contenido Principal</h2>
    <!-- contenido -->
  </main>
</body>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

## Tailwind CSS - Skip Link

```html
<a
  href="#main-content"
  class="
    sr-only focus:not-sr-only
    focus:absolute focus:top-0 focus:left-0
    focus:z-50 focus:p-4
    focus:bg-blue-600 focus:text-white
  "
>
  Saltar al contenido principal
</a>

<main id="main-content" tabindex="-1" class="outline-none">
  <!-- contenido -->
</main>
```

## React/JSX

```jsx
// Componente con jerarquia correcta
function ArticlePage({ article }) {
  return (
    <>
      <SkipLink />

      <Header>
        <h1>Mi Blog</h1>
        <Navigation />
      </Header>

      <main id="main-content" tabIndex={-1}>
        <article>
          <h2>{article.title}</h2>

          {article.sections.map((section, index) => (
            <section key={section.id}>
              <h3>{section.title}</h3>
              {section.content}

              {section.subsections?.map((sub) => (
                <div key={sub.id}>
                  <h4>{sub.title}</h4>
                  {sub.content}
                </div>
              ))}
            </section>
          ))}
        </article>
      </main>

      <Sidebar headingLevel={2} />
    </>
  );
}

// Skip Link component
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4
        focus:z-50 focus:px-4 focus:py-2
        focus:bg-blue-600 focus:text-white focus:rounded
      "
    >
      Saltar al contenido principal
    </a>
  );
}

// Componente Heading dinamico
function Heading({ level = 2, children, ...props }) {
  const Tag = `h${Math.min(Math.max(level, 1), 6)}`;
  return <Tag {...props}>{children}</Tag>;
}
```

## Estructura de Encabezados por Tipo de Pagina

### Pagina de Inicio
```
h1: Nombre del sitio
  h2: Seccion destacada
  h2: Productos populares
    h3: Producto 1
    h3: Producto 2
  h2: Testimonios
```

### Pagina de Articulo
```
h1: Nombre del sitio (en header)
  h2: Titulo del articulo
    h3: Seccion 1
    h3: Seccion 2
      h4: Subseccion 2.1
    h3: Seccion 3
  h2: Comentarios
    h3: Comentario 1
```

### Pagina de Producto
```
h1: Nombre del producto
  h2: Descripcion
  h2: Especificaciones
    h3: Dimensiones
    h3: Materiales
  h2: Resenas
    h3: Resena 1
```

## Deteccion Automatica

**Patrones a buscar:**
- Multiples `<h1>` en una pagina
- Saltos de nivel (h1 seguido de h3, h2 seguido de h5)
- Uso de headings para estilos en lugar de estructura
- Falta de skip link en paginas con navegacion extensa

**Validacion con JavaScript:**
```javascript
function validateHeadingHierarchy() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  const issues = [];

  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.tagName[1]);

    if (currentLevel - previousLevel > 1) {
      issues.push({
        element: heading,
        message: `Salto de nivel: de h${previousLevel} a h${currentLevel}`,
        index
      });
    }

    previousLevel = currentLevel;
  });

  return issues;
}
```

## Notas Adicionales

- Los lectores de pantalla tienen atajos para navegar por encabezados
- El `<h1>` debe describir el proposito principal de la pagina
- En SPAs, considerar actualizar el focus al cambiar de pagina
- Usar `aria-labelledby` para asociar encabezados a regiones
- El skip link debe ser el primer elemento focusable

## Referencias

- [WCAG: Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels)
- [WebAIM: Headings](https://webaim.org/techniques/semanticstructure/#headings)
