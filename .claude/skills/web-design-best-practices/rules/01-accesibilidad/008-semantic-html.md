# 008: HTML Semantico Antes de ARIA

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A008 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Siempre usar elementos HTML semanticos nativos (`<button>`, `<a>`, `<label>`, `<table>`, `<nav>`, `<main>`) antes de recurrir a atributos ARIA. Los elementos nativos tienen accesibilidad incorporada y comportamiento de teclado esperado.

## Regla

Primera regla de ARIA: "No usar ARIA si puedes usar HTML nativo."

1. Usar elementos nativos siempre que sea posible
2. Solo agregar ARIA cuando no existe elemento nativo equivalente
3. ARIA incorrecto es peor que ningun ARIA

## Anti-Patron (Incorrecto)

```html
<!-- Mal: div con ARIA en lugar de button -->
<div role="button" tabindex="0" aria-pressed="false">
  Enviar
</div>

<!-- Mal: span con ARIA en lugar de anchor -->
<span role="link" tabindex="0" onclick="navigate()">
  Ir a inicio
</span>

<!-- Mal: div con role navigation -->
<div role="navigation">
  <div role="list">
    <div role="listitem">Item 1</div>
  </div>
</div>

<!-- Mal: ARIA redundante -->
<button role="button" aria-pressed="false">
  Toggle
</button>

<!-- Mal: input con role textbox (ya es textbox) -->
<input type="text" role="textbox">
```

## Patron Correcto

```html
<!-- Bien: Usar button nativo -->
<button type="button">
  Enviar
</button>

<!-- Bien: Usar anchor nativo -->
<a href="/">
  Ir a inicio
</a>

<!-- Bien: Usar nav y ul nativos -->
<nav aria-label="Navegacion principal">
  <ul>
    <li><a href="/">Inicio</a></li>
    <li><a href="/productos">Productos</a></li>
  </ul>
</nav>

<!-- Bien: ARIA solo cuando es necesario -->
<button aria-expanded="false" aria-controls="menu-dropdown">
  Menu
</button>

<!-- Bien: role en widget personalizado sin equivalente nativo -->
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
```

## Tabla de Equivalencias

| Necesitas... | Usa elemento nativo | NO uses |
|--------------|-------------------|---------|
| Boton | `<button>` | `<div role="button">` |
| Enlace | `<a href>` | `<span role="link">` |
| Encabezado | `<h1>` - `<h6>` | `<div role="heading">` |
| Lista | `<ul>`, `<ol>` | `<div role="list">` |
| Item de lista | `<li>` | `<div role="listitem">` |
| Tabla | `<table>` | `<div role="table">` |
| Navegacion | `<nav>` | `<div role="navigation">` |
| Contenido principal | `<main>` | `<div role="main">` |
| Pie de pagina | `<footer>` | `<div role="contentinfo">` |
| Formulario | `<form>` | `<div role="form">` |
| Cuadro de busqueda | `<input type="search">` | `<input role="searchbox">` |
| Checkbox | `<input type="checkbox">` | `<div role="checkbox">` |
| Radio | `<input type="radio">` | `<div role="radio">` |

## Cuando SI usar ARIA

```html
<!-- Tabs: No hay elemento nativo -->
<div role="tablist" aria-label="Secciones de contenido">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1"
  >
    General
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    id="tab-2"
  >
    Avanzado
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Contenido General
</div>

<!-- Slider: No hay input range equivalente visual -->
<div
  role="slider"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="50"
  aria-label="Volumen"
  tabindex="0"
>
</div>

<!-- Tree view: No hay elemento nativo -->
<ul role="tree" aria-label="Sistema de archivos">
  <li role="treeitem" aria-expanded="true">
    Carpeta 1
    <ul role="group">
      <li role="treeitem">Archivo 1.txt</li>
    </ul>
  </li>
</ul>

<!-- Combobox autocomplete: Extiende select nativo -->
<div role="combobox" aria-expanded="false" aria-haspopup="listbox">
  <input type="text" aria-autocomplete="list">
  <ul role="listbox">
    <li role="option">Opcion 1</li>
  </ul>
</div>
```

## React/JSX

```jsx
// Mal: ARIA innecesario
function BadButton({ onClick, children }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {children}
    </div>
  );
}

// Bien: Elemento nativo
function GoodButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

// Bien: ARIA para extender funcionalidad
function ExpandableButton({ expanded, onToggle, controls, children }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
    >
      {children}
    </button>
  );
}

// Bien: ARIA necesario para widget sin equivalente
function TabList({ tabs, activeTab, onTabChange }) {
  return (
    <div role="tablist" aria-label="Navegacion por pestanas">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

## Las 5 Reglas de ARIA

1. **No usar ARIA si puedes usar HTML nativo**
2. **No cambiar la semantica nativa** (no `<h1 role="button">`)
3. **Todos los controles ARIA deben ser operables por teclado**
4. **No usar `role="presentation"` o `aria-hidden="true"` en elementos focusables**
5. **Todos los elementos interactivos deben tener un nombre accesible**

## Deteccion Automatica

**Patrones a buscar:**
- `<div role="button">` → deberia ser `<button>`
- `<span role="link">` → deberia ser `<a>`
- `<div role="heading">` → deberia ser `<h1>-<h6>`
- `role="list"` en `<div>` → deberia ser `<ul>` o `<ol>`
- ARIA redundante en elementos nativos

**Expresion regular:**
```regex
<div[^>]*role="(button|link|navigation|main|list|listitem)"
```

## Notas Adicionales

- Los elementos nativos tienen comportamiento de teclado incorporado
- ARIA solo cambia la semantica, no agrega funcionalidad
- Un `<div role="button">` necesita implementar Enter, Space, y focus manualmente
- Usar herramientas como axe o Lighthouse para validar
- "No ARIA is better than bad ARIA"

## Referencias

- [W3C: Using ARIA](https://www.w3.org/TR/using-aria/)
- [The First Rule of ARIA](https://www.w3.org/TR/using-aria/#rule1)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
