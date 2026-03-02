# 014: :focus-within para Controles Compuestos

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | F004 |
| **Severidad** | Suggestion |
| **Categoria** | Focus y Estados |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Usar `:focus-within` para aplicar estilos cuando cualquier elemento hijo tiene focus. Esto es util para controles compuestos como grupos de inputs, campos con botones integrados, o contenedores interactivos.

## Regla

Usar `:focus-within` en contenedores cuando:
1. El contenedor agrupa multiples elementos focusables
2. Quieres resaltar visualmente todo el grupo cuando un hijo tiene focus
3. El control compuesto debe comportarse como una unidad visual

## Casos de Uso

- Campo de busqueda con boton integrado
- Input con selector de pais + numero de telefono
- Grupo de inputs para fecha (dia/mes/ano)
- Formularios en cards que resaltan al editar
- Dropdowns y comboboxes

## Patron Correcto

```css
/* Grupo de input con boton */
.search-group {
  display: flex;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-group:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.search-group input {
  border: none;
  outline: none;
  flex: 1;
}

.search-group button {
  border: none;
  background: transparent;
}

/* Input con prefijo/sufijo */
.input-with-addon {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.input-with-addon:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input-with-addon .addon {
  padding: 8px 12px;
  background: #f3f4f6;
  color: #6b7280;
}

.input-with-addon input {
  border: none;
  outline: none;
  padding: 8px 12px;
  flex: 1;
}
```

## HTML de Ejemplo

```html
<!-- Campo de busqueda -->
<div class="search-group">
  <input type="search" placeholder="Buscar..." aria-label="Buscar">
  <button type="submit" aria-label="Enviar busqueda">
    <svg aria-hidden="true"><!-- icono --></svg>
  </button>
</div>

<!-- Input con prefijo -->
<div class="input-with-addon">
  <span class="addon">https://</span>
  <input type="text" placeholder="tu-sitio.com">
</div>

<!-- Input de precio -->
<div class="input-with-addon">
  <span class="addon">$</span>
  <input type="number" placeholder="0.00">
  <span class="addon">USD</span>
</div>

<!-- Selector de telefono -->
<div class="phone-input">
  <select aria-label="Codigo de pais">
    <option value="+1">+1</option>
    <option value="+52">+52</option>
  </select>
  <input type="tel" placeholder="(555) 123-4567">
</div>
```

## Tailwind CSS

```html
<!-- Campo de busqueda con Tailwind -->
<div class="
  flex items-center
  border-2 border-gray-200
  rounded-lg
  overflow-hidden
  focus-within:border-blue-500
  focus-within:ring-2
  focus-within:ring-blue-500/20
  transition-all
">
  <input
    type="search"
    placeholder="Buscar..."
    class="flex-1 px-4 py-2 border-0 focus:outline-none focus:ring-0"
  />
  <button class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
    <svg class="w-5 h-5" aria-hidden="true"><!-- icon --></svg>
    <span class="sr-only">Buscar</span>
  </button>
</div>

<!-- Input con addon -->
<div class="
  flex
  border border-gray-300
  rounded-md
  overflow-hidden
  focus-within:border-blue-500
  focus-within:ring-1
  focus-within:ring-blue-500
">
  <span class="px-3 py-2 bg-gray-100 text-gray-500 border-r">
    @
  </span>
  <input
    type="text"
    placeholder="usuario"
    class="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0"
  />
</div>

<!-- Card de formulario -->
<div class="
  p-6 bg-white rounded-xl shadow
  border-2 border-transparent
  focus-within:border-blue-500
  focus-within:shadow-lg
  transition-all duration-200
">
  <h3 class="text-lg font-semibold mb-4">Informacion de contacto</h3>
  <div class="space-y-4">
    <input type="text" placeholder="Nombre" class="w-full px-4 py-2 border rounded" />
    <input type="email" placeholder="Email" class="w-full px-4 py-2 border rounded" />
  </div>
</div>
```

## React/JSX

```jsx
// Componente InputGroup
function InputGroup({ prefix, suffix, children, className = '' }) {
  return (
    <div
      className={`
        flex items-center
        border border-gray-300 rounded-lg
        overflow-hidden
        focus-within:border-blue-500
        focus-within:ring-2
        focus-within:ring-blue-500/20
        transition-all
        ${className}
      `}
    >
      {prefix && (
        <span className="px-3 py-2 bg-gray-50 text-gray-500 border-r">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="px-3 py-2 bg-gray-50 text-gray-500 border-l">
          {suffix}
        </span>
      )}
    </div>
  );
}

// Uso
function PriceInput({ value, onChange }) {
  return (
    <InputGroup prefix="$" suffix="USD">
      <input
        type="number"
        value={value}
        onChange={onChange}
        className="flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0"
        placeholder="0.00"
      />
    </InputGroup>
  );
}

// SearchBar
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(query); }}
      className="
        flex
        border-2 border-gray-200 rounded-full
        overflow-hidden
        focus-within:border-blue-500
        focus-within:shadow-md
        transition-all
      "
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar productos..."
        className="flex-1 px-6 py-3 border-0 focus:outline-none"
      />
      <button
        type="submit"
        className="px-6 bg-blue-600 text-white hover:bg-blue-700"
      >
        Buscar
      </button>
    </form>
  );
}
```

## Accesibilidad con focus-within

```html
<!-- Fieldset con focus-within -->
<fieldset class="
  p-4 border-2 border-gray-200 rounded-lg
  focus-within:border-blue-500
  focus-within:bg-blue-50/30
">
  <legend class="px-2 font-medium">Fecha de nacimiento</legend>
  <div class="flex gap-2">
    <input type="number" placeholder="DD" aria-label="Dia" class="w-16 ..." />
    <input type="number" placeholder="MM" aria-label="Mes" class="w-16 ..." />
    <input type="number" placeholder="AAAA" aria-label="Ano" class="w-20 ..." />
  </div>
</fieldset>

<!-- Menu dropdown -->
<div class="
  relative
  focus-within:z-10
">
  <button
    aria-expanded="false"
    aria-haspopup="true"
    class="px-4 py-2 border rounded focus:outline-none focus-visible:ring-2"
  >
    Opciones
  </button>
  <ul class="
    hidden
    absolute top-full left-0
    mt-1 py-1 bg-white shadow-lg rounded-lg
    group-focus-within:block
  ">
    <li><a href="#">Opcion 1</a></li>
    <li><a href="#">Opcion 2</a></li>
  </ul>
</div>
```

## Notas Adicionales

- `:focus-within` se activa cuando cualquier descendiente tiene focus
- Util para mejorar la percepcion visual de grupos de controles
- Combinar con `:focus-visible` para los elementos individuales
- No olvidar transiciones suaves para mejor UX
- Probar con navegacion por teclado

## Referencias

- [MDN: :focus-within](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within)
- [CSS Tricks: focus-within](https://css-tricks.com/almanac/selectors/f/focus-within/)
