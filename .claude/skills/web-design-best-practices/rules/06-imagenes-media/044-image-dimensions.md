# 044: Dimensiones Explicitas en Imagenes

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | I001 |
| **Severidad** | Critical |
| **Categoria** | Imagenes y Media |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Las imagenes deben tener atributos `width` y `height` explicitos para evitar Cumulative Layout Shift (CLS), uno de los Core Web Vitals.

## Regla

Siempre incluir `width` y `height` en elementos `<img>`:
1. Previene salto de layout cuando la imagen carga
2. El navegador reserva espacio mientras carga
3. Mejora Core Web Vitals (CLS)

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Sin dimensiones -->
<img src="hero.jpg" alt="Hero image">

<!-- Mal: Solo una dimension -->
<img src="photo.jpg" alt="Photo" width="800">
```

## Patron Correcto

```html
<!-- Bien: Ambas dimensiones -->
<img
  src="hero.jpg"
  alt="Hero image"
  width="1200"
  height="600"
>

<!-- Bien: Con CSS para responsividad -->
<img
  src="photo.jpg"
  alt="Photo"
  width="800"
  height="600"
  style="max-width: 100%; height: auto;"
>
```

## Next.js Image

```jsx
import Image from 'next/image';

// Bien: next/image requiere dimensiones
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>

// O con fill para imagenes responsivas
<div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

## CSS para Mantener Aspect Ratio

```css
/* Moderno: aspect-ratio */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

/* Fallback con padding */
.image-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
}

.image-container img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## Tailwind CSS

```html
<img
  src="photo.jpg"
  alt="Photo"
  width="800"
  height="600"
  class="w-full h-auto aspect-video object-cover"
>
```

## Referencias

- [Web.dev: CLS](https://web.dev/cls/)
- [MDN: Intrinsic size](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-width)
