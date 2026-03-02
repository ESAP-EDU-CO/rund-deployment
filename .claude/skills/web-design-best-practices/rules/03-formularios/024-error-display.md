# 024: Errores Inline Junto a Campos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | FM008 |
| **Severidad** | Critical |
| **Categoria** | Formularios |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los mensajes de error deben mostrarse inline, junto al campo con el error, y el focus debe moverse al primer campo con error al enviar el formulario.

## Regla

1. Mostrar errores directamente debajo o junto al campo
2. Al enviar, enfocar el primer campo con error
3. Los errores deben usar `role="alert"` o `aria-live`
4. Asociar errores con campos via `aria-describedby`

## Patron Correcto

```html
<form onsubmit="return validateForm()">
  <div class="form-field">
    <label for="email">Correo electronico</label>
    <input
      type="email"
      id="email"
      aria-describedby="email-error"
      aria-invalid="true"
    >
    <span id="email-error" class="error" role="alert">
      El correo electronico no es valido
    </span>
  </div>

  <button type="submit">Enviar</button>
</form>

<script>
function validateForm() {
  const firstError = document.querySelector('[aria-invalid="true"]');
  if (firstError) {
    firstError.focus();
    return false;
  }
  return true;
}
</script>
```

## Tailwind CSS

```html
<div class="space-y-1">
  <label for="email" class="block text-sm font-medium text-gray-700">
    Correo electronico
  </label>
  <input
    type="email"
    id="email"
    aria-invalid="true"
    aria-describedby="email-error"
    class="
      w-full px-3 py-2 rounded-lg border
      border-red-500
      focus:ring-2 focus:ring-red-500/20
    "
  >
  <p id="email-error" role="alert" class="text-sm text-red-600">
    Por favor ingresa un correo electronico valido
  </p>
</div>
```

## React/JSX

```jsx
function FormField({ label, error, children, id }) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
        className: `${children.props.className} ${error ? 'border-red-500' : ''}`,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Notas

- Nunca usar solo el color rojo para indicar errores (accesibilidad)
- Los errores deben ser descriptivos: "El email es invalido" vs "Error"
- Considerar mostrar errores mientras el usuario escribe (validacion en tiempo real)

## Referencias

- [WCAG: Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification)
