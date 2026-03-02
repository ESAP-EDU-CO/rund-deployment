# 038: Numeros Tabulares para Columnas

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | T005 |
| **Severidad** | Warning |
| **Categoria** | Tipografia |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Usar `font-variant-numeric: tabular-nums` para numeros en columnas, tablas, o cualquier contexto donde los numeros deben alinearse verticalmente.

## Regla

Aplicar numeros tabulares cuando:
- Numeros en columnas de tablas
- Precios o cantidades alineadas
- Contadores o temporizadores
- Cualquier lista de numeros

## Anti-Patron (Incorrecto)

```css
/* Sin numeros tabulares - los digitos tienen ancho variable */
.price-list {
  /* Los precios no se alinean bien */
}
```

## Patron Correcto

```css
/* Bien: Numeros tabulares para alineacion */
.price-list,
.data-table td,
.counter {
  font-variant-numeric: tabular-nums;
}

/* Alternativa con font-feature-settings */
.tabular {
  font-feature-settings: "tnum";
}
```

## Tailwind CSS

```html
<!-- Tabla con numeros alineados -->
<table>
  <tbody>
    <tr>
      <td class="tabular-nums">$1,234.56</td>
    </tr>
    <tr>
      <td class="tabular-nums">$987.00</td>
    </tr>
  </tbody>
</table>

<!-- Contador -->
<span class="tabular-nums text-4xl font-mono">
  00:42:15
</span>
```

## Comparacion Visual

```
Sin tabular-nums:    Con tabular-nums:
$1,234.56            $1,234.56
  $987.00            $  987.00
   $12.34            $   12.34

Los numeros se alinean correctamente con tabular-nums
```

## Referencias

- [MDN: font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)
