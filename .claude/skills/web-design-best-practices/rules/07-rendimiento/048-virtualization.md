# 048: Virtualizacion de Listas Largas

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | P001 |
| **Severidad** | Warning |
| **Categoria** | Rendimiento |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Las listas con mas de 50 elementos deben usar virtualizacion para renderizar solo los elementos visibles en el viewport, mejorando significativamente el rendimiento.

## Regla

Virtualizar cuando:
- Listas con > 50 items
- Tablas con muchas filas
- Feeds infinitos
- Cualquier lista que pueda crecer

## Anti-Patron (Incorrecto)

```jsx
// Mal: Renderizar todos los elementos
function LongList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## Patron Correcto - React

```jsx
// Bien: Usar virtualizacion con react-window
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

```jsx
// Con TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## CSS content-visibility

```css
/* Alternativa CSS para listas menos dinamicas */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 50px;
}
```

## Librerias Recomendadas

| Libreria | Uso |
|----------|-----|
| react-window | Listas simples en React |
| @tanstack/react-virtual | Listas complejas, framework agnostico |
| virtua | Alternativa moderna y ligera |

## Referencias

- [react-window](https://react-window.vercel.app/)
- [TanStack Virtual](https://tanstack.com/virtual)
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
