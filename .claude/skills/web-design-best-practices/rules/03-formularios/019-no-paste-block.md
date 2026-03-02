# 019: Nunca Bloquear Pegado de Texto

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | FM003 |
| **Severidad** | Critical |
| **Categoria** | Formularios |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

NUNCA bloquear la funcion de pegar (`paste`) en campos de formulario. Esto afecta negativamente a usuarios que usan gestores de contrasenas, usuarios con discapacidades, y la usabilidad general.

## Regla

No usar `onPaste` con `preventDefault()` para bloquear el pegado de texto.

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Bloquear paste -->
<input
  type="password"
  onpaste="return false;"
>

<input
  type="email"
  onpaste="event.preventDefault();"
>
```

```jsx
// Mal: Bloquear paste en React
<input
  type="password"
  onPaste={(e) => e.preventDefault()}
/>
```

## Patron Correcto

```html
<!-- Bien: Permitir paste -->
<input type="password" name="password">

<!-- Bien: Si necesitas validar, hazlo despues del paste -->
<input type="email" onpaste="validateAfterPaste(event)">
```

```jsx
// Bien: Validar despues de paste, no bloquearlo
const handlePaste = (e) => {
  // Permitir el paste, luego validar
  setTimeout(() => {
    validateInput(e.target.value);
  }, 0);
};

<input type="email" onPaste={handlePaste} />
```

## Por que es Importante

1. **Gestores de contrasenas**: Los usuarios generan contrasenas fuertes y las pegan
2. **Accesibilidad**: Usuarios con discapacidades motoras dependen de copiar/pegar
3. **Usabilidad**: Bloquear paste es frustrante y no mejora la seguridad
4. **Seguridad real**: No previene ataques, solo molesta a usuarios legitimos

## Referencias

- [UK Gov: Don't disable paste](https://design-system.service.gov.uk/patterns/passwords/#do-not-disable-paste)
- [Troy Hunt: The cobra effect of paste disabling](https://www.troyhunt.com/the-cobra-effect-that-is-disabling/)
