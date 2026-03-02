# 061: color-scheme en HTML

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | D001 |
| **Severidad** | Critical |
| **Categoria** | Modo Oscuro y Temas |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Usar `color-scheme: dark` en el elemento `<html>` cuando se activa el modo oscuro. Esto ajusta automaticamente elementos nativos del navegador (scrollbars, inputs, selects) al tema oscuro.

## Regla

1. Declarar `color-scheme` en HTML o CSS
2. Actualizar dinamicamente al cambiar de tema
3. Incluir meta tag para preferencia inicial

## Implementacion

```html
<!-- Meta tag para tema por defecto -->
<meta name="color-scheme" content="light dark">

<!-- O solo un tema -->
<html style="color-scheme: dark">
```

```css
/* CSS */
:root {
  color-scheme: light dark;
}

/* O basado en clase */
:root {
  color-scheme: light;
}

:root.dark {
  color-scheme: dark;
}

/* O con media query */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

## React/Next.js

```jsx
// ThemeProvider
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Elementos Afectados

`color-scheme` afecta automaticamente:
- Scrollbars
- Form controls (inputs, selects, buttons)
- System colors (Canvas, CanvasText, etc.)
- Cursores del sistema

## Referencias

- [MDN: color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
