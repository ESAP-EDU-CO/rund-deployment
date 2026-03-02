# 017: Autocomplete y Name Significativos en Inputs

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | FM001 |
| **Severidad** | Warning |
| **Categoria** | Formularios |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Los campos de formulario deben tener atributos `autocomplete` y `name` significativos para mejorar la experiencia de autocompletado del navegador y accesibilidad.

## Regla

1. Usar valores de `autocomplete` estandar para campos comunes
2. Usar nombres descriptivos para el atributo `name`
3. `autocomplete="off"` solo en campos que no son de autenticacion

## Patron Correcto

```html
<!-- Campos de usuario -->
<input type="text" name="given-name" autocomplete="given-name" placeholder="Nombre">
<input type="text" name="family-name" autocomplete="family-name" placeholder="Apellido">
<input type="email" name="email" autocomplete="email" placeholder="Correo">
<input type="tel" name="phone" autocomplete="tel" placeholder="Telefono">

<!-- Campos de direccion -->
<input type="text" name="address" autocomplete="street-address" placeholder="Direccion">
<input type="text" name="city" autocomplete="address-level2" placeholder="Ciudad">
<input type="text" name="postal-code" autocomplete="postal-code" placeholder="Codigo postal">
<select name="country" autocomplete="country">
  <option value="MX">Mexico</option>
</select>

<!-- Campos de pago -->
<input type="text" name="cc-name" autocomplete="cc-name" placeholder="Nombre en tarjeta">
<input type="text" name="cc-number" autocomplete="cc-number" placeholder="Numero de tarjeta">
<input type="text" name="cc-exp" autocomplete="cc-exp" placeholder="MM/AA">
<input type="text" name="cc-csc" autocomplete="cc-csc" placeholder="CVV">
```

## Valores de Autocomplete Comunes

| Campo | Valor autocomplete |
|-------|-------------------|
| Nombre | `given-name` |
| Apellido | `family-name` |
| Nombre completo | `name` |
| Email | `email` |
| Telefono | `tel` |
| Usuario | `username` |
| Contrasena nueva | `new-password` |
| Contrasena actual | `current-password` |
| Direccion | `street-address` |
| Ciudad | `address-level2` |
| Estado/Provincia | `address-level1` |
| Codigo postal | `postal-code` |
| Pais | `country` |

## Notas

- El autocomplete mejora accesibilidad para usuarios con discapacidades cognitivas
- Los gestores de contrasenas dependen de estos atributos
- `autocomplete="off"` puede ser ignorado por navegadores en campos de login

## Referencias

- [MDN: autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
