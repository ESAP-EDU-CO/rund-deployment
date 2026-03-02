# 005: Texto Alternativo en Imagenes

## Metadatos

| Campo | Valor |
|-------|-------|
| **ID** | A005 |
| **Severidad** | Critical |
| **Categoria** | Accesibilidad |
| **Fuente** | Vercel Web Interface Guidelines |

## Descripcion

Todas las imagenes deben tener un atributo `alt` que describa su contenido. Para imagenes decorativas, usar `alt=""` vacio para que los lectores de pantalla las ignoren.

## Regla

1. Imagenes informativas: `alt` con descripcion significativa
2. Imagenes decorativas: `alt=""` (vacio, no omitido)
3. Imagenes de texto: `alt` con el texto de la imagen
4. Imagenes funcionales (dentro de enlaces/botones): `alt` describe la funcion
5. Imagenes complejas (graficos, diagramas): Descripcion extensa disponible

## Anti-Patron (Incorrecto)

```html
<!-- Mal: Sin atributo alt -->
<img src="foto-equipo.jpg">

<!-- Mal: Alt generico o no descriptivo -->
<img src="foto-equipo.jpg" alt="imagen">
<img src="foto-equipo.jpg" alt="foto">
<img src="logo.png" alt="logo">

<!-- Mal: Alt que describe el tipo de archivo -->
<img src="producto.jpg" alt="producto.jpg">

<!-- Mal: Alt redundante -->
<img src="icono-usuario.svg" alt="Icono de usuario icono">

<!-- Mal: Alt excesivamente largo sin necesidad -->
<img src="flecha.svg" alt="Una flecha de color azul que apunta hacia la derecha indicando que puedes hacer clic para continuar">
```

## Patron Correcto

```html
<!-- Bien: Descripcion significativa -->
<img
  src="foto-equipo.jpg"
  alt="El equipo de desarrollo celebrando el lanzamiento del producto"
>

<!-- Bien: Imagen decorativa -->
<img src="decoracion.svg" alt="">

<!-- Bien: Logo con nombre de empresa -->
<img src="logo.png" alt="Acme Corporation">

<!-- Bien: Imagen dentro de enlace - describe destino -->
<a href="/perfil">
  <img src="avatar.jpg" alt="Ver perfil de Juan Perez">
</a>

<!-- Bien: Imagen con texto -->
<img src="banner-oferta.jpg" alt="50% de descuento en todos los productos">

<!-- Bien: Icono funcional -->
<button>
  <img src="icono-buscar.svg" alt="Buscar">
</button>
```

## Tipos de Imagenes y su Alt

| Tipo de Imagen | Ejemplo | Alt Recomendado |
|----------------|---------|-----------------|
| Foto informativa | Foto de producto | "Zapatillas Nike Air Max color negro" |
| Logo | Logo de empresa | "Nombre de la empresa" |
| Icono decorativo | Linea separadora | `alt=""` |
| Icono funcional | Icono de menu | "Menu de navegacion" |
| Grafico/Diagrama | Grafico de barras | Descripcion + enlace a datos |
| Avatar | Foto de usuario | "Foto de perfil de [nombre]" |
| Imagen de fondo | Patron decorativo | No usar `<img>`, usar CSS |
| Captura de pantalla | Screenshot de app | Descripcion del contenido relevante |

## React/Next.js

```jsx
import Image from 'next/image';

// Imagen informativa
<Image
  src="/equipo.jpg"
  alt="Nuestro equipo de 15 personas reunido en la oficina central"
  width={800}
  height={600}
/>

// Imagen decorativa
<Image
  src="/pattern.svg"
  alt=""
  aria-hidden="true"
  width={100}
  height={100}
/>

// Avatar de usuario
<Image
  src={user.avatar}
  alt={`Foto de perfil de ${user.name}`}
  width={48}
  height={48}
  className="rounded-full"
/>

// Imagen en enlace
<Link href="/producto/123">
  <Image
    src="/producto.jpg"
    alt="Ver detalles del Smartphone Galaxy S24"
    width={300}
    height={300}
  />
</Link>
```

## Imagenes Complejas

Para graficos, diagramas o infografias, proporcionar una descripcion mas extensa:

```html
<!-- Opcion 1: aria-describedby -->
<figure>
  <img
    src="grafico-ventas.png"
    alt="Grafico de ventas trimestrales"
    aria-describedby="descripcion-grafico"
  >
  <figcaption id="descripcion-grafico">
    Las ventas aumentaron un 25% en Q1, se mantuvieron estables en Q2,
    subieron 40% en Q3 y cayeron 10% en Q4. Total anual: $1.2M.
  </figcaption>
</figure>

<!-- Opcion 2: Enlace a descripcion detallada -->
<figure>
  <img
    src="diagrama-arquitectura.png"
    alt="Diagrama de arquitectura del sistema"
    longdesc="#descripcion-arquitectura"
  >
  <a href="#descripcion-arquitectura">Ver descripcion detallada del diagrama</a>
</figure>
```

## Tailwind CSS con Accesibilidad

```html
<!-- Avatar con alt descriptivo -->
<img
  src="avatar.jpg"
  alt="Maria Garcia, Desarrolladora Senior"
  class="w-12 h-12 rounded-full object-cover"
>

<!-- Icono decorativo (usar aria-hidden si es decorativo) -->
<img
  src="decoracion.svg"
  alt=""
  aria-hidden="true"
  class="w-24 h-24 opacity-50"
>

<!-- Imagen de producto -->
<figure class="relative">
  <img
    src="producto.jpg"
    alt="Laptop Dell XPS 15 con pantalla de 15 pulgadas, color plateado"
    class="w-full h-64 object-cover rounded-lg"
  >
  <figcaption class="mt-2 text-sm text-gray-600">
    Dell XPS 15 - $1,299
  </figcaption>
</figure>
```

## Deteccion Automatica

**Patrones a buscar:**
- Elementos `<img>` sin atributo `alt`
- Atributos `alt` con valores genericos: "image", "img", "foto", "picture"
- Atributos `alt` que contienen extensiones de archivo: ".jpg", ".png"
- Elementos `<img>` con `alt` igual al `src`

**Expresion regular para img sin alt:**
```regex
<img(?![^>]*\balt=)[^>]*>
```

## Notas Adicionales

- El `alt` debe describir la informacion, no la imagen en si
- No comenzar con "Imagen de..." o "Foto de..." (es redundante)
- Para imagenes puramente decorativas, `alt=""` es obligatorio
- Las imagenes CSS de fondo no necesitan alt (son invisibles para lectores de pantalla)
- Considerar el contexto: el mismo logo puede necesitar diferente alt en header vs footer

## Referencias

- [W3C: Alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/)
- [WebAIM: Alternative Text](https://webaim.org/techniques/alttext/)
