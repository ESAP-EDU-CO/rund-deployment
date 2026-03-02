# 007: Regiones Vivas para Actualizaciones Asincronas

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A007 |
| **Severidad** | Warning |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Las actualizaciones dinamicas de contenido (toasts, notificaciones, mensajes de validacion, resultados de busqueda) deben usar `aria-live` para que los lectores de pantalla anuncien los cambios a los usuarios.

## Regla

Usar regiones ARIA live para contenido que cambia dinamicamente:
- `aria-live="polite"`: Para actualizaciones no urgentes (la mayoria de casos)
- `aria-live="assertive"`: Solo para alertas criticas urgentes
- `role="status"`: Equivalente a `aria-live="polite"`
- `role="alert"`: Equivalente a `aria-live="assertive"`

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Toast sin anuncio a lectores de pantalla -->
<div class="toast">
  Archivo guardado exitosamente
</div>

<!-- Mal: Mensaje de error sin aria-live -->
<span class="error-message">
  El email es invalido
</span>

<!-- Mal: Contador actualizado sin anuncio -->
<span class="cart-count">3</span>
```

## Patron Correcto

```html
<!-- Bien: Toast con aria-live polite -->
<div class="toast" role="status" aria-live="polite">
  Archivo guardado exitosamente
</div>

<!-- Bien: Alerta urgente -->
<div class="alert-critical" role="alert" aria-live="assertive">
  Tu sesion esta por expirar
</div>

<!-- Bien: Mensaje de error en formulario -->
<span
  id="email-error"
  class="error-message"
  role="alert"
  aria-live="polite"
>
  El email es invalido
</span>

<!-- Bien: Contador con anuncio -->
<span class="cart-count" aria-live="polite" aria-atomic="true">
  <span class="sr-only">Items en carrito:</span> 3
</span>
```

## Tipos de aria-live

| Valor | Comportamiento | Uso recomendado |
|-------|---------------|-----------------|
| `off` | No anuncia cambios | Valor por defecto |
| `polite` | Espera que termine la lectura actual | Toasts, validaciones, actualizaciones |
| `assertive` | Interrumpe inmediatamente | Solo alertas criticas |

## Atributos Complementarios

```html
<!-- aria-atomic: Anuncia todo el contenido, no solo cambios -->
<div aria-live="polite" aria-atomic="true">
  Mostrando <span>15</span> de <span>100</span> resultados
</div>

<!-- aria-relevant: Que cambios anunciar -->
<ul aria-live="polite" aria-relevant="additions removals">
  <li>Nuevo mensaje</li>
</ul>

<!-- aria-busy: Indica que el contenido esta cargando -->
<div aria-live="polite" aria-busy="true">
  Cargando...
</div>
```

## React/JSX

```jsx
// Componente Toast accesible
function Toast({ message, type = 'info' }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`toast toast-${type}`}
    >
      {message}
    </div>
  );
}

// Mensaje de error en formulario
function FormError({ error }) {
  if (!error) return null;

  return (
    <span role="alert" aria-live="polite" className="text-red-600 text-sm">
      {error}
    </span>
  );
}

// Contador de carrito con anuncio
function CartCounter({ count }) {
  return (
    <span aria-live="polite" aria-atomic="true" className="badge">
      <span className="sr-only">Items en carrito:</span>
      {count}
    </span>
  );
}

// Resultados de busqueda
function SearchResults({ results, isLoading }) {
  return (
    <div
      aria-live="polite"
      aria-busy={isLoading}
      aria-atomic="true"
    >
      {isLoading ? (
        <span>Buscando...</span>
      ) : (
        <span>{results.length} resultados encontrados</span>
      )}
    </div>
  );
}
```

## Contenedor de Anuncios (Live Region Container)

```html
<!-- Contenedor persistente para anuncios dinamicos -->
<div
  id="announcements"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  <!-- El contenido se inyecta dinamicamente via JS -->
</div>

<script>
function announce(message) {
  const container = document.getElementById('announcements');
  container.textContent = message;

  // Limpiar despues para permitir mensajes repetidos
  setTimeout(() => {
    container.textContent = '';
  }, 1000);
}

// Uso
announce('Archivo guardado correctamente');
</script>
```

## Hook React para Anuncios

```jsx
import { useRef, useCallback } from 'react';

function useAnnounce() {
  const announcerRef = useRef(null);

  const announce = useCallback((message, politeness = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.textContent = '';
      // Timeout para forzar re-anuncio
      setTimeout(() => {
        announcerRef.current.textContent = message;
      }, 100);
    }
  }, []);

  const Announcer = () => (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announce, Announcer };
}

// Uso
function MyComponent() {
  const { announce, Announcer } = useAnnounce();

  const handleSave = async () => {
    await saveData();
    announce('Datos guardados correctamente');
  };

  return (
    <>
      <button onClick={handleSave}>Guardar</button>
      <Announcer />
    </>
  );
}
```

## Tailwind CSS

```html
<!-- Toast notification -->
<div
  role="status"
  aria-live="polite"
  class="fixed bottom-4 right-4 px-4 py-3 bg-green-100 text-green-800 rounded-lg shadow-lg"
>
  <div class="flex items-center gap-2">
    <svg aria-hidden="true" class="w-5 h-5"><!-- check icon --></svg>
    <span>Cambios guardados</span>
  </div>
</div>

<!-- Screen reader only announcer -->
<div
  id="sr-announcer"
  aria-live="polite"
  class="sr-only"
>
</div>
```

## Deteccion Automatica

**Patrones a buscar:**
- Elementos toast/notification sin `aria-live` o `role`
- Mensajes de error de formulario sin anuncio
- Contenido que aparece/desaparece dinamicamente sin region live

## Notas Adicionales

- La region live debe existir en el DOM antes de inyectar contenido
- `aria-live="assertive"` debe usarse con moderacion (es intrusivo)
- Combinar con `aria-atomic="true"` cuando todo el contenido es relevante
- Los mensajes muy frecuentes pueden abrumar al usuario
- Considerar usar librerias como `@react-aria/live-announcer`

## Referencias

- [WAI-ARIA: Live Regions](https://www.w3.org/TR/wai-aria/#aria-live)
- [MDN: ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
