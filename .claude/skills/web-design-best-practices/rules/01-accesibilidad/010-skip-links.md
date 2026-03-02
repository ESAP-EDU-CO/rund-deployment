# 010: Enlaces de Salto para Contenido Principal

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A010 |
| **Severidad** | Warning |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Proporcionar un enlace de "salto al contenido principal" al inicio de la pagina permite a los usuarios de teclado y lectores de pantalla omitir la navegacion repetitiva y acceder directamente al contenido.

## Regla

1. Incluir un skip link como primer elemento focusable de la pagina
2. El enlace debe estar oculto visualmente pero visible al recibir focus
3. El destino debe ser el contenido principal (`<main>`)
4. El destino debe tener `tabindex="-1"` para recibir focus programatico
5. Considerar multiples skip links si hay varias secciones importantes

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Sin skip link -->
<body>
  <header>
    <nav>
      <!-- 20+ enlaces de navegacion -->
    </nav>
  </header>
  <main>
    <!-- contenido -->
  </main>
</body>

<!-- Mal: Skip link no es primer elemento focusable -->
<body>
  <header>
    <a href="/">Logo</a>
    <a href="#main">Saltar al contenido</a>
  </header>
</body>

<!-- Mal: Skip link permanentemente visible -->
<body>
  <a href="#main" style="display: block; padding: 20px;">
    Saltar al contenido
  </a>
</body>

<!-- Mal: Destino sin tabindex -->
<main id="main">
  <!-- No puede recibir focus -->
</main>
```

## Patron Correcto

```html
<!-- Bien: Skip link implementado correctamente -->
<body>
  <!-- Primer elemento del body -->
  <a href="#main-content" class="skip-link">
    Saltar al contenido principal
  </a>

  <header>
    <nav aria-label="Navegacion principal">
      <!-- enlaces de navegacion -->
    </nav>
  </header>

  <main id="main-content" tabindex="-1">
    <h1>Titulo de la Pagina</h1>
    <!-- contenido principal -->
  </main>
</body>

<style>
  .skip-link {
    position: absolute;
    top: -100%;
    left: 16px;
    padding: 12px 24px;
    background-color: #1a1a1a;
    color: #ffffff;
    text-decoration: none;
    border-radius: 4px;
    z-index: 9999;
    transition: top 0.2s ease;
  }

  .skip-link:focus {
    top: 16px;
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }

  main:focus {
    outline: none;
  }
</style>
```

## Tailwind CSS

```html
<!-- Skip link con Tailwind -->
<a
  href="#main-content"
  class="
    sr-only
    focus:not-sr-only
    focus:absolute
    focus:top-4
    focus:left-4
    focus:z-[9999]
    focus:px-6
    focus:py-3
    focus:bg-gray-900
    focus:text-white
    focus:rounded-lg
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
  "
>
  Saltar al contenido principal
</a>

<header class="sticky top-0 bg-white shadow">
  <nav><!-- navegacion extensa --></nav>
</header>

<main
  id="main-content"
  tabindex="-1"
  class="outline-none focus:outline-none"
>
  <!-- contenido -->
</main>
```

## Multiples Skip Links

```html
<!-- Para paginas con multiples secciones importantes -->
<div class="skip-links">
  <a href="#main-content" class="skip-link">
    Saltar al contenido principal
  </a>
  <a href="#main-nav" class="skip-link">
    Saltar a navegacion
  </a>
  <a href="#search" class="skip-link">
    Saltar a busqueda
  </a>
  <a href="#footer" class="skip-link">
    Saltar al pie de pagina
  </a>
</div>

<style>
  .skip-links {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    z-index: 9999;
  }

  .skip-link {
    position: absolute;
    top: -100%;
    background: #1a1a1a;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
  }

  .skip-link:focus {
    position: static;
    top: auto;
  }
</style>
```

## React/JSX

```jsx
// Componente SkipLinks
function SkipLinks({ links = [] }) {
  const defaultLinks = [
    { href: '#main-content', label: 'Saltar al contenido principal' },
  ];

  const allLinks = links.length ? links : defaultLinks;

  return (
    <div className="skip-links">
      {allLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="
            sr-only focus:not-sr-only
            focus:absolute focus:top-4 focus:left-4
            focus:z-[9999] focus:px-4 focus:py-2
            focus:bg-gray-900 focus:text-white
            focus:rounded-md focus:shadow-lg
          "
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

// Componente Main con focus correcto
function Main({ children, id = 'main-content' }) {
  const mainRef = useRef(null);

  // Manejar navegacion en SPA
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === `#${id}` && mainRef.current) {
      mainRef.current.focus();
    }
  }, [id]);

  return (
    <main
      ref={mainRef}
      id={id}
      tabIndex={-1}
      className="outline-none"
    >
      {children}
    </main>
  );
}

// Layout completo
function Layout({ children }) {
  return (
    <>
      <SkipLinks
        links={[
          { href: '#main-content', label: 'Saltar al contenido' },
          { href: '#search', label: 'Ir a busqueda' },
        ]}
      />
      <Header />
      <Main>{children}</Main>
      <Footer />
    </>
  );
}
```

## Next.js - App Router

```jsx
// app/layout.jsx
import SkipLink from '@/components/SkipLink';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SkipLink />
        <Header />
        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

// components/SkipLink.jsx
'use client';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        fixed top-0 left-1/2 -translate-x-1/2 -translate-y-full
        focus:translate-y-4 z-[9999]
        px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-400
      "
    >
      Saltar al contenido principal
    </a>
  );
}
```

## JavaScript para SPA

```javascript
// Manejar focus al navegar en SPA
function handleRouteChange() {
  const main = document.getElementById('main-content');
  if (main) {
    // Scroll al inicio
    window.scrollTo(0, 0);

    // Focus en main para lectores de pantalla
    main.focus();

    // Anunciar cambio de pagina
    const pageTitle = document.title;
    announceToScreenReader(`Navegaste a ${pageTitle}`);
  }
}

// Con React Router
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
```

## Deteccion Automatica

**Patrones a buscar:**
- Ausencia de skip link antes de navegacion extensa
- Skip link que no es primer elemento focusable
- Destino del skip link sin `tabindex="-1"`
- Skip link siempre visible (mala UX visual)

**Prueba manual:**
1. Cargar la pagina
2. Presionar Tab una vez
3. El skip link debe ser visible y enfocado
4. Presionar Enter
5. El focus debe moverse al contenido principal

## Notas Adicionales

- El skip link debe aparecer visualmente al recibir focus
- Debe desaparecer cuando pierde el focus
- En SPAs, considerar re-enfocar main al cambiar de ruta
- Probar con lector de pantalla (NVDA, VoiceOver)
- Verificar que funcione con navegacion por teclado

## Referencias

- [WebAIM: Skip Navigation Links](https://webaim.org/techniques/skipnav/)
- [WCAG: Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks)
