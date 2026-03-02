# 028: Respetar prefers-reduced-motion

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | AN001 |
| **Severidad** | Critical |
| **Categoria** | Animaciones |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Respetar la preferencia del sistema `prefers-reduced-motion`. Proporcionar una version reducida o sin animacion para usuarios que tienen sensibilidad al movimiento.

## Regla

1. Detectar `prefers-reduced-motion: reduce`
2. Reducir o eliminar animaciones no esenciales
3. Mantener transiciones esenciales pero mas sutiles

## Anti-Patron (Incorrecto)

```css
/* Mal: Ignorar preferencias de movimiento */
.animated-element {
  animation: bounce 1s infinite;
}
```

## Patron Correcto

```css
/* Bien: Animacion con respeto a preferencias */
.animated-element {
  animation: bounce 1s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}

/* O reducir en lugar de eliminar */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  * {
    transition-duration: 0.01ms !important;
  }
}
```

## Tailwind CSS

```html
<!-- Animacion que respeta preferencias -->
<div class="animate-bounce motion-reduce:animate-none">
  Contenido animado
</div>

<!-- Transicion reducida -->
<button class="
  transition-transform duration-300
  motion-reduce:transition-none
  hover:scale-105
  motion-reduce:hover:scale-100
">
  Boton
</button>
```

## React Hook

```jsx
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// Uso
function AnimatedComponent() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{ duration: prefersReduced ? 0 : 0.3 }}
    >
      Contenido
    </motion.div>
  );
}
```

## Referencias

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
