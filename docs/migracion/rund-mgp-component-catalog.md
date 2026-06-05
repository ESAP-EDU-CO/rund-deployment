# rund-mgp Component Catalog — Angular 21 → Framework OTIC

> **Propósito:** Guía completa para que un LLM pueda recrear `rund-mgp` en cualquier framework
> frontend sin leer el código fuente Angular original. Describe comportamiento, flujos de datos
> y contratos de API, no sintaxis Angular.
>
> **Fecha de escritura:** 05 jun 2026
> **Versión Angular documentada:** 21.2.x + PrimeNG 21.1.1 (commit rund-mgp#20)

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Configuración Dinámica](#2-configuración-dinámica)
3. [Autenticación](#3-autenticación)
4. [Mapa de Rutas](#4-mapa-de-rutas)
5. [Catálogo de Vistas](#5-catálogo-de-vistas)
6. [Catálogo de Componentes Compartidos](#6-catálogo-de-componentes-compartidos)
7. [Servicios HTTP](#7-servicios-http)
8. [Gestión de Estado](#8-gestión-de-estado)
9. [Patrones UI Recurrentes](#9-patrones-ui-recurrentes)
10. [Assets y Estilos](#10-assets-y-estilos)
11. [SSR y Restricciones de Plataforma](#11-ssr-y-restricciones-de-plataforma)
12. [Gotchas y Casos Especiales](#12-gotchas-y-casos-especiales)
13. [Checklist de Verificación Post-Migración](#13-checklist-de-verificación-post-migración)

---

## 1. Arquitectura General

```
rund-mgp/
├── Arranque
│   ├── main.ts              → bootstrapApplication (CSR)
│   ├── main.server.ts       → bootstrapApplication (SSR)
│   └── server.ts            → Express adapter para SSR
│
├── App Root (App)           → verifica sesión, inicializa datos, dark mode
│   ├── Header               → logo + nombre usuario + botón logout
│   ├── Menu                 → navegación lateral con control de roles
│   └── <router-outlet>      → vistas lazy-loaded
│
├── Vistas (lazy)
│   ├── /listados            → Listados: carga de Excel/CSV de profesores
│   ├── /extraccion          → Extraccion: dashboard IA (estadísticas, scheduler, búsqueda)
│   └── /gestion             → Gestion: panel de carga + edición de documentos (solo admin)
│       ├── Carga            → selección de profesor + FichaDocente + subida de archivos
│       └── Edicion          → árbol de documentos + acciones (ver/descargar/borrar/cambiar)
│
└── Componentes Compartidos
    ├── Login                → formulario de autenticación LDAP
    ├── FichaDocente         → formulario de categorías demográficas + extracciones IA
    ├── CargaDocumento       → lista de archivos a subir con control de taxonomía
    ├── Header               → barra superior
    ├── Menu                 → sidebar de navegación
    ├── Preview              → visor de documentos PDF/imagen inline
    ├── VistaExcel           → previsualizador de Excel/CSV
    ├── VistasDatos          → tabla de datos tabulares
    ├── Chart                → gráficos de estadísticas demográficas
    ├── FirmaCertificado     → selector/generador de firmas para certificados
    └── ExtraeDatos          → componente de extracción IA directa (legacy)
```

**Stack tecnológico:**
- Angular 21.2.x con SSR (Angular Universal)
- PrimeNG 21.1.1 — todos los componentes UI
- FontAwesome 6.7.2 — íconos complementarios
- RxJS 7.8.x — streams reactivos
- Chart.js 4.5.0 — gráficos
- ExcelJS 4.4.0 — exportación Excel
- pdfjs-dist 5.4.449 — renderizado PDF en navegador
- Quill 2.0.3 — editor de texto enriquecido

---

## 2. Configuración Dinámica

Al arrancar, la aplicación hace `GET /api/config` **antes** de montar cualquier componente. Este endpoint retorna la configuración del entorno:

```json
{
  "apiBaseUrl": "http://localhost:3000",
  "environment": "development",
  "version": "3.2.0",
  "devFakeLogin": false
}
```

**El framework de destino debe:**
1. Llamar a `/api/config` como primer paso del bootstrap
2. Guardar `apiBaseUrl` en un store/singleton accesible globalmente
3. Todas las llamadas HTTP a rund-api deben usar `apiBaseUrl` como base (no hardcodeado)
4. `devFakeLogin: true` → mostrar botón "Login de desarrollo" en la pantalla de login

**Endpoint `/api/config`** es servido por el propio servidor Node.js de SSR de rund-mgp (no por rund-api). En producción, este endpoint lee variables de entorno del servidor Angular. En el framework de destino, el equivalente puede ser una variable de entorno inyectada en el HTML o un endpoint similar.

---

## 3. Autenticación

### 3.1 Estado de sesión (reactivo)

El estado de autenticación es **reactivo** (Angular Signals):

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `usuario` | `Usuario \| null \| undefined` | `undefined` = no verificado aún; `null` = no autenticado; objeto = autenticado |
| `cargando` | `boolean` | Operación de auth en curso |
| `error` | `string \| null` | Mensaje de error del último intento |
| `estaAutenticado` | `boolean` (computed) | `usuario !== null && usuario !== undefined` |
| `esAdmin` | `boolean` (computed) | `usuario.rol === 'admin'` |

**Interfaz `Usuario`:**
```typescript
interface Usuario {
  sub: string;       // Username LDAP
  name: string;      // Nombre completo
  email: string;     // email@esap.edu.co
  tid: string;       // Tenant ID
  roles?: Rol[];     // array de roles
  rol?: Rol;         // rol efectivo (calculado)
}
type Rol = 'admin' | 'gestor' | 'directivo' | 'usuario';
```

**Jerarquía de roles (de mayor a menor privilegio):**
```
admin > gestor > directivo > usuario
```

### 3.2 Flujo de arranque (App root)

Al iniciar la aplicación (solo en navegador, no SSR):
1. Llamar a `Auth.verificarSesion()` → `GET /api/v2/auth/session`
2. Si responde con usuario → actualizar estado reactivo y cargar datos (labels, categorías)
3. Si responde 401 → estado queda `null`, el guard redirigirá a `/login` en la próxima navegación
4. Cada vez que cambia la ruta → reinvocar `inicializa()` para recargar las vars de datos
5. Sincronizar `prefers-color-scheme` con la clase `app-dark` en el elemento `<html>`

**Anti-loop crítico:** Si `data.init()` falla con 401, el interceptor HTTP captura el error y redirige a `/login`. El componente `App` NO debe reintentar `init()` al recibir un `NavigationEnd` hacia `/login` — verificar que el usuario esté autenticado antes de llamar a `init()`.

### 3.3 Interceptor HTTP

Se aplica automáticamente a **todas** las peticiones HTTP:

1. **Añade `withCredentials: true`** solo a requests hacia `localhost:3000` o rutas `/api/` — permite que la cookie `RUND_SESSION` viaje con cada request
2. **Error 401** → limpiar estado de auth local + redirigir a `/login?returnUrl=<ruta-actual>`
3. **Error 403** → redirigir a `/acceso-denegado`
4. **Error 0** (red/CORS) → loggear, no redirigir

### 3.4 Guards de ruta

| Guard | Aplica a | Comportamiento |
|-------|----------|----------------|
| `authGuard` | `/listados`, `/extraccion` | Verifica sesión activa. Sin sesión → `/login?returnUrl=<ruta>` |
| `adminGuard` | `/gestion` | Verifica sesión + rol admin. Sin auth → `/login`. Sin rol → `/acceso-denegado` |

**Optimización:** Si el estado reactivo ya tiene `estaAutenticado = true`, el guard no hace llamada HTTP — usa el estado en memoria.

### 3.5 Métodos del servicio de Auth

| Método | Request | Descripción |
|--------|---------|-------------|
| `login(username, password)` | `POST /api/v2/auth/login` + header `X-App-Id: rund-mgp` | Login LDAP. En éxito, actualiza estado reactivo. |
| `logout()` | `POST /api/v2/auth/logout` | Limpia estado local, redirige a `/login`. Funciona aunque falle el servidor. |
| `verificarSesion()` | `GET /api/v2/auth/session` | Verifica sesión. Si `should_refresh: true` → llama automáticamente a `refrescarJWT()`. |
| `refrescarJWT()` | `POST /api/v2/auth/refresh` | Refresca JWT interno. Si falla → logout automático. |
| `devLogin(email)` | `POST /api/v2/auth/dev/login` | Solo disponible con `devFakeLogin: true`. |
| `tienePermisos(rolMinimo, rolUsuario)` | — | Verifica jerarquía de roles. |

---

## 4. Mapa de Rutas

| Ruta | Componente | Guard | Rol mínimo |
|------|-----------|-------|-----------|
| `/` | — | — | Redirect a `/listados` |
| `/login` | `Login` | — | Público |
| `/acceso-denegado` | `AccesoDenegado` | — | Público |
| `/listados` | `Listados` | `authGuard` | gestor |
| `/extraccion` | `Extraccion` | `authGuard` | gestor |
| `/gestion` | `Gestion` | `adminGuard` | admin |
| `**` | — | — | Redirect a `/listados` |

**Todas las vistas son lazy-loaded** (code splitting). No existe navegación anidada de rutas.

---

## 5. Catálogo de Vistas

### 5.1 Vista: Login (`/login`)

**Propósito:** Formulario de autenticación LDAP. Única ruta pública.

**Comportamiento:**
- Si el usuario ya está autenticado al entrar → redirigir a `returnUrl` (o `/`)
- Al cargar: obtener el logo desde `GET /api/v2/archivos/imagenes/logoESAP.svg` → mostrarlo como imagen
- Formulario con dos campos: `username` (min 3 chars) y `password` (min 3 chars)
- Botón de submit: llama a `Auth.login(username, password)` con header `X-App-Id: rund-mgp`
- En éxito: navegar a `returnUrl` (guardada en query param `?returnUrl=...`)
- En error: mostrar mensaje de error (texto del campo `error` de la respuesta)
- Toggle de visibilidad de contraseña (ojo)
- Si `devFakeLogin: true` → mostrar botón "Login de desarrollo" que llama a `devLogin('usuario.administrador@esap.edu.co')`

**Estado reactivo:**
- `cargando` (del Auth service) → deshabilitar botón y mostrar spinner
- `errorMensaje` (signal local) → mostrar mensaje de error bajo el formulario

**UI:**
- Centrado verticalmente, sin menú lateral ni header
- Logo ESAP arriba del formulario
- Campos con validación inline (borde rojo + mensaje si dirty+invalid)

---

### 5.2 Vista: Listados (`/listados`)

**Propósito:** Carga de listados administrativos de profesores en Excel/CSV.

**Comportamiento principal:**
1. Componente `VistaExcel` permite seleccionar y previsualizar el archivo Excel
2. Al seleccionar un archivo, `VistaExcel` emite el tipo de listado detectado (`TipoListado.Propiedades`)
3. Se llama a `GET /api/v2/listados/datos?accion=duplicado&propiedades=...` para detectar si ya existe
4. Si existe → diálogo de confirmación de reemplazo con detalles (nombre, tipo, fecha)
5. Si el usuario acepta o el archivo es nuevo → `POST /api/v2/listados/cargar` con el archivo y propiedades
6. **Además**, se genera un CSV side-car a partir del Excel (mismo contenido, formato CSV) y se sube también con `POST /api/v2/listados/cargar` (con `Origen: 'RUND Side-car'`)
7. En éxito → diálogo de confirmación y limpiar formulario
8. En error → diálogo con el detalle del error

**Propiedades del listado (enviadas en el payload):**
```typescript
[
  { label: 'Nombre', valor: 'NombreArchivo.xlsx' },
  { label: 'Tipo', valor: 'Listado de docentes' },
  { label: 'Origen', valor: 'OneDrive ESAP' | 'ARCA' | 'RUND Side-car' },
  { label: 'Formato', valor: 'Excel XLSX' | 'CSV' },
  { label: 'Tamaño', valor: '204.8 KB' },
  { label: 'Size', valor: 204800 },
  // Solo si es reemplazo:
  { label: 'Uuid', valor: 'uuid-existente' },
  { label: 'Duplicado', valor: true },
  { label: 'Comentario', valor: '' },
]
```

**Tipos de listado reconocidos:**
```typescript
type Origen = 'OneDrive ESAP' | 'ARCA' | 'RUND Side-car';
type Formato = 'Excel XLSX' | 'CSV';
type Extension = '.xlsx' | '.csv';
```

---

### 5.3 Vista: Extracción (`/extraccion`)

**Propósito:** Dashboard de monitoreo de la extracción automática de datos por IA.

**Al cargar y cada 30 segundos (si hay trabajos en cola):**
Llamadas paralelas a:
- `GET /api/v2/extraccion/stats` → métricas del índice
- `GET /api/v2/ai/queue/stats` → tamaño de la cola activa
- `GET /api/v2/ai/scheduler/status` → estado del scheduler

**Métricas mostradas:**
- Total de documentos procesados
- Conteo por estado: completado, procesando, error, pendiente
- Tasa de éxito (%)
- Última actualización
- Badge de auto-refresh activo si `colaActiva > 0`
- Panel "Cobertura por tipo" con 6 tarjetas (cédula, cert. laboral, cert. académico, resolución, acta, cert. idiomas) — conteo de documentos completados por tipo usando aliases

**Acciones de la cola:**
- **Resetear bloqueados** (botón condicional si `procesando > 0`): `POST /api/v2/ai/reset-stuck-jobs` → recarga
- **Re-encolar errores** (botón condicional si `errores > 0`): `POST /api/v2/ai/retry-error-jobs` → recarga

**Panel del Scheduler:**
- Tag "Activo" (verde) / "Pausado" (naranja) según `schedulerHabilitado`
- Toggle habilitado/pausado: `POST /api/v2/ai/scheduler/start` o `/pause`
- Mostrar `hora_inicio`, `hora_fin`, `ultimo_run`
- Botón "Configurar" → diálogo con inputs numéricos (0-23) para `hora_inicio` y `hora_fin`
- Al guardar: `POST /api/v2/ai/scheduler/config { hora_inicio, hora_fin }`

**Búsqueda semántica:**
- Input de texto + botón Buscar
- Llama a `GET /api/v2/extraccion/buscar?q={query}&limit=10`
- Tabla de resultados: nombre, tipo, similitud (%), cédula del profesor
- Estado vacío si no hay resultados

**Aliases OpenKM → schema AI** (críticos para cobertura por tipo):
```typescript
const ALIASES = {
  cedula: ['cedula', 'CEDULA', 'CEDULA_CIUDADANIA', 'DATOS_BASICOS'],
  certificado_laboral: ['certificado_laboral', 'EXPERIENCIA_DOCENTE', 'EXPERIENCIA_LABORAL',
    'CERTIFICADO_LABORAL', 'CONSTANCIA_LABORAL', 'CERTIFICADO_DOCENTE', 'EXPERIENCIA_INVESTIGATIVA'],
  certificado_academico: ['certificado_academico', 'TITULOS_DE_FORMACION', 'FORMACION_ACADEMICA',
    'CERTIFICADO_ACADEMICO', 'TITULO_UNIVERSITARIO', 'DIPLOMA', 'TITULO',
    'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO', 'POSTDOCTORADO',
    'PRODUCTIVIDAD_ACADEMICA', 'FORMACION_NO_FORMAL_ADICIONAL'],
  resolucion: ['resolucion', 'RESOLUCION', 'RESOLUCION_NOMBRAMIENTO', 'ACTO_ADMINISTRATIVO'],
  acta: ['acta', 'ACTA', 'ACTA_EVALUACION', 'EVALUACION_DOCENTE', 'ESTUDIO_DE_HOJA_DE_VIDA'],
  certificado_idiomas: ['certificado_idiomas', 'IDIOMAS', 'CERTIFICADO_IDIOMAS',
    'SUFICIENCIA_IDIOMAS', 'CERTIFICACION_IDIOMAS'],
};
```

---

### 5.4 Vista: Gestión (`/gestion`) — solo admin

**Propósito:** Contenedor de dos sub-paneles (tabs o accordion): **Carga** y **Edición**.

**Comportamiento:** Solo muestra el contenido. No tiene lógica propia — delega a `Carga` y `Edicion`.

---

### 5.4.1 Sub-vista: Carga (dentro de Gestión)

**Propósito:** Carga masiva de documentos para un profesor específico.

**Flujo completo:**
1. **Cargar lista de profesores:** `GET /api/v2/listados/csv?categoria=Listados&tipo=Listado%20de%20docentes&nombre=ListadoGeneralDocente&formato=CSV&extension=.csv`
   - Parsear `arrayCSV`: primera fila son headers, resto son datos
   - `columnasCSV[1]` = cédula, `columnasCSV[3]` = nombre completo
   - Mostrar skeleton/spinner mientras carga
2. **Autocomplete de profesores:** campo de búsqueda que filtra por nombre o cédula
3. **Al seleccionar profesor:**
   - Guardar la fila del CSV seleccionada como `profesorSeleccionado`
   - `getInfoProfesor(cedula)` → `GET /api/v2/profesores/{cedula}` → cargar `infoProfesor`
   - Pasar datos al componente `FichaDocente` para pre-poblar categorías
   - Limpiar lista de archivos en `CargaDocumento`
4. **`FichaDocente`** emite `validado: string[]` con las categorías cuando todos los paneles están completados → habilitar la subida
5. **`FichaDocente`** emite `fechaNacimientoEmitida: string | null` → guardar para enviarlo con la cédula
6. **`CargaDocumento`** emite los archivos a subir como `ArchivoDocente[]`
7. **Subida secuencial** (un archivo a la vez, no paralelo):
   - Para cada `ArchivoDocente`:
     ```
     POST /api/v2/archivos/subir
     propiedades:
       - taxonomia: esCedula ? '' : archivo.tipo
       - tipo: esCedula ? 'cedula' : archivo.tipo
       - formato: archivo.formato
       - origen: archivo.origen
       - categorias: esCedula ? datosValidados : []
       - esCedula: archivo.esCedula
       - cedula: profesorSeleccionado[1]
       - fecha_nacimiento: esCedula ? fechaNacimiento : ''
     ```
   - Marcar cada archivo como subido → `CargaDocumento` lo muestra como completado
8. Al terminar todos: emitir `archivosCargados$.next(cedula)` para notificar a `Edicion`
9. Después de 1.5s → limpiar lista en `CargaDocumento`

**Estado reactivo (signal `archivosCargados$`):** Subject RxJS que `Edicion` escucha para refrescar el árbol de archivos cuando se cargan nuevos documentos.

---

### 5.4.2 Sub-vista: Edición (dentro de Gestión)

**Propósito:** Ver, descargar, borrar y actualizar documentos de profesores.

**Al inicializar:**
1. `GET /api/v2/listados/indice` → objeto `{ [cedula]: { NOMBRE_Y_APELLIDO, ... } }` con todos los profesores
2. Para cada profesor: `GET /api/v2/profesores/{cedula}` → obtener archivos
3. Mostrar barra de progreso real durante la carga: `(completados / total) * 100`
4. Al completar: mostrar en autocomplete la lista de profesores con archivos

**Campos del autocomplete:** nombre completo + cédula

**Al seleccionar profesor:**
- Cargar archivos del profesor
- Generar árbol agrupado por tipo:
  ```
  DIPLOMA (carpeta)
    ├── diploma_maestria.pdf  (PDF, icono pi-file-pdf)
    └── diploma_pregrado.pdf
  CERTIFICADO (carpeta)
    └── cert_laboral.docx     (DOCX, icono pi-file-word)
  ```
- Los archivos JSON (formato='JSON') se excluyen del árbol
- Mostrar datos del profesor (en el orden `ORDEN_FICHA`)

**`ORDEN_FICHA`** (orden de visualización de los datos del CSV):
```
NOMBRE_Y_APELLIDO, DOCUMENTO_DE_IDENTIDAD, FECHA_NACIMIENTO,
CORREO_INSTITUCIONAL, CORREO_PERSONAL, TELEFONO,
PERFIL_ACADEMICO, PREGRADO, ESPECIALIZACION, MAESTRIA,
DOCTORADO, POSTDOCTORADO, INVESTIGACION_2024,
TERRITORIAL, CATEGORIA, NUCLEO_TEMATICO, NIVEL_DE_FORMACION,
VINCULACION, ORIGEN_DE_VINCULACION, ACTO_ADMINISTRATIVO_DE_VINCULACION,
INICIO_DE_VINCULACION, FIN_DE_VINCULACION, ULTIMA_EVALUACION,
DEDICACION, SITUACION_ADMINISTRATIVA, PUNTAJE_SALARIAL
```

**Acciones disponibles (botones de toolbar, con archivos seleccionados):**

| Acción | Condición | Flujo |
|--------|-----------|-------|
| **Ver** (watch) | Exactamente 1 archivo | Abre diálogo con `Preview` — descarga inline |
| **Descargar** | 1+ archivos | Abre diálogo con `DownloadPreview` — descarga de archivos |
| **Borrar** | 1+ archivos | Abre diálogo `BorraDocumentos` — confirma y borra |
| **Reemplazar** | 1 archivo | Abre diálogo `Reemplazo` — sube nueva versión |
| **Añadir** | — | Abre diálogo `Adicion` — agrega nuevo documento al profesor |

**Íconos por formato:**
```typescript
const iconoFormato = {
  PDF: 'pi-file-pdf',
  XLSX: 'pi-file-excel',
  DOCX: 'pi-file-word',
  JPG: 'pi-image',
  PNG: 'pi-image',
};
```

**Escucha `archivosCargados$`:** Cuando `Carga` notifica que se subieron archivos para una cédula, si esa cédula es el profesor actualmente seleccionado → refrescar árbol. Si es un profesor nuevo → añadirlo a la lista del autocomplete.

---

## 6. Catálogo de Componentes Compartidos

### 6.1 FichaDocente

**Selector:** `mgp-ficha-docente`

**El componente más complejo del sistema.** Muestra y permite editar los datos demográficos de un profesor, con paneles de categorías, cobertura documental y datos extraídos por IA.

**Inputs:**

| Input | Tipo | Descripción |
|-------|------|-------------|
| `docente` | `string[]` | Fila del CSV con los datos del profesor |
| `labels` | `string[]` | Encabezados del CSV (nombres de columnas) |
| `claves` | `string[]` | Subset de labels que se mostrarán en la ficha |
| `infoProfesor` | `DatoDemografico` | Datos demográficos desde OpenKM (categorías ya asignadas) |
| `archivosProfesor` | `DatoArchivo[]` | Lista de archivos del profesor |
| `cedula` | `string` | Cédula del profesor (dispara carga de extracciones IA) |

**Outputs:**

| Output | Tipo | Descripción |
|--------|------|-------------|
| `validado` | `string[]` | Rutas de categorías seleccionadas (vacío si no está completo) |
| `fechaNacimientoEmitida` | `string \| null` | Fecha en formato `YYYY-MM-DD` |

**Comportamiento:**

1. **Carga el árbol de categorías:** `GET /api/v2/categorias/arbol` → filtra rama "Docentes"
2. **Mapea categorías a paneles:** cada nodo del árbol de "Docentes" es un panel con selectores
3. **Pre-pobla desde `infoProfesor`:** si el profesor ya tiene categorías asignadas en OpenKM, las carga en los selectores
4. **Pre-pobla desde `docente`/`labels`:** si hay datos del CSV, cruza con las opciones de cada selector usando normalización de texto
5. **Paneles con `tipo: 'single':** categorías que solo permiten un valor (dropdown)
   - `PERFIL_DOCENTE/GENERO`, `PERFIL_DOCENTE/GRUPO_ETNICO`, `PERFIL_DOCENTE/NIVEL_EDUCATIVO`, `PERFIL_DOCENTE/RANGO_ETARIO`, `VINCULACION_Y_CATEGORIA/CATEGORIA`, `VINCULACION_Y_CATEGORIA/VINCULACION`
6. **Paneles con `tipo: 'multiple':** categorías multi-valor (multi-select)
7. **Fecha de nacimiento:** campo especial que calcula el rango etario automáticamente al seleccionar una fecha
8. **`setCategorias()`:** cada vez que cambia una selección, recalcula si todos los paneles requeridos están validados → emite `validado`
9. **Panel "Documentos clasificados por IA":** si algún archivo tiene `ia_clasificado: true`, muestra chips con el tipo IA
10. **Panel "Cobertura documental":** 6 chips (éxito/peligro) para los tipos de documento estándar (ver aliases en §5.3)
11. **Panel "Datos extraídos por IA":** tabla con los documentos completados del índice + botón ojo por fila
12. **Botón "Validar consistencia":** `POST /api/v2/extraccion/validar/{cedula}` → muestra issues con severidad y score

**Comportamiento del diálogo de detalle:**
- Al hacer clic en el ojo de una extracción → `GET /api/v2/extraccion/json/{cedula}/{nombre_json}`
- Mostrar campos en tabla: clave → valor (los objetos anidados se muestran como `<pre>` JSON)
- Los campos vacíos, nulos o undefined se omiten

**Normalización de texto para cruce (importante):**
```typescript
// simp: normaliza tildes, espacios, mayúsculas/minúsculas
function simp(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/\s+/g, ' ');
}
// compara: igualdad normalizada
function compara(a: string, b: string): boolean {
  return simp(a) === simp(b);
}
```

---

### 6.2 CargaDocumento

**Selector:** `mgp-carga-documento`

**Propósito:** Lista de archivos a subir, con la taxonomía asignada a cada uno.

**Inputs:**

| Input | Tipo | Descripción |
|-------|------|-------------|
| `archivosYaCargados` | `number[]` | Índices de archivos ya subidos (mostrar como completados) |

**Outputs:**

| Output | Tipo | Descripción |
|--------|------|-------------|
| `archivos` | `ArchivoDocente[]` | Lista de archivos listos para subir (emitida al padre) |

**Comportamiento:**
- Drag & drop de archivos o selector de archivos (múltiple, máx 50)
- Para cada archivo: el usuario asigna la carpeta destino (taxonomía), tipo, formato y origen
- La cédula se hereda del profesor seleccionado en `Carga`
- Si el archivo se llama igual a "cedula" o tiene indicios de ser la cédula del profesor → marcar como `esCedula: true`
- Botón "Limpiar" (método `limpiar()`) — llamado desde el padre después de la carga exitosa
- Muestra check verde en archivos con índice en `archivosYaCargados`

**Estructura `ArchivoDocente`:**
```typescript
interface ArchivoDocente {
  archivo: File;
  taxonomia: DatosCarpeta;   // { origen, categoria, label }
  tipo: string;              // nombre de la carpeta destino
  formato: string;           // PDF, DOCX, JPG, PNG, XLSX
  origen: string;            // OneDrive, Scanner, Email, etc.
  esCedula: boolean;
}
```

---

### 6.3 Header

**Selector:** `mgp-header`

**Propósito:** Barra superior con logo + nombre del usuario + botón de logout.

**Comportamiento:**
- Muestra el logo de RUND (imagen cargada desde API)
- Muestra el nombre del usuario autenticado (desde el estado reactivo de Auth)
- Botón logout: `Auth.logout()` → redirige a `/login`
- Visible solo cuando el usuario está autenticado

---

### 6.4 Menu

**Selector:** `mgp-menu`

**Propósito:** Sidebar de navegación con ítems filtrados por rol.

**Elementos del menú:**

| Label | Ícono | Ruta | Rol mínimo |
|-------|-------|------|-----------|
| Listados | `pi-list-check` | `/listados` | gestor |
| Gestión | FontAwesome `file-arrow-up` | `/gestion` | gestor |
| Extracción de datos | `pi-chart-bar` | `/extraccion` | gestor |

**Comportamiento:**
- Los ítems se muestran u ocultan según el rol del usuario autenticado
- `tienePermisos(rolMinimo, rolUsuario)`: item visible si `roles.indexOf(rolUsuario) <= roles.indexOf(rolMinimo)`
- El ítem activo se resalta (RouterLinkActive en Angular → clase `active` en el ítem de la ruta actual)
- Solo visible cuando el usuario está autenticado

---

### 6.5 Preview

**Selector:** `mgp-preview`

**Propósito:** Visor inline de documentos (PDF, imagen).

**Comportamiento:**
- Para PDFs: renderiza con pdfjs-dist en un canvas
- Para imágenes (JPG, PNG): muestra con `<img>` con object-fit: contain
- Para DOCX: muestra un mensaje "No se puede previsualizar — descargar para ver"
- El blob del archivo se obtiene con `GET /api/v2/archivos/{uuid}` (responseType: 'blob')
- No puede funcionar en SSR (accede a `window.URL.createObjectURL`)

---

### 6.6 DownloadPreview

**Selector:** `mgp-download-preview`

**Propósito:** Descarga múltiples archivos secuencialmente mostrando progreso.

**Flujo:**
1. Para cada archivo en la lista: `GET /api/v2/archivos/{uuid}` → blob
2. Usar `URL.createObjectURL(blob)` para disparar la descarga
3. Mostrar progreso: N/Total completados
4. Al terminar → emitir evento para cerrar el diálogo

---

### 6.7 BorraDocumentos

**Selector:** `mgp-borra-documentos`

**Propósito:** Confirma y ejecuta la eliminación de archivos.

**Flujo:**
1. Mostrar lista de archivos a borrar con confirmación
2. Para cada archivo: `DELETE /api/v2/archivos/{uuid}`
3. Al terminar → refrescar árbol del profesor

---

### 6.8 Reemplazo

**Selector:** `mgp-reemplazo`

**Propósito:** Reemplaza el contenido de un archivo existente (nueva versión).

**Flujo:**
1. Selector de archivo (1 solo archivo)
2. `Data.reemplazaArchivo(uuid, nombre, archivo, comentario)` → `POST /api/v2/archivos/{uuid}/actualizar`
3. En éxito: mostrar nueva versión y refrescar árbol

---

### 6.9 Adicion

**Selector:** `mgp-adicion`

**Propósito:** Agrega un nuevo documento a la hoja de vida de un profesor.

**Flujo:** Similar a `CargaDocumento` pero para un solo archivo. Usa `POST /api/v2/archivos/subir`.

---

### 6.10 VistaExcel

**Selector:** `mgp-vista-excel`

**Propósito:** Previsualizador de archivos Excel/CSV con detección del tipo de listado.

**Outputs:**

| Output | Tipo | Descripción |
|--------|------|-------------|
| `tipoListado` | `TipoListado.Propiedades` | Tipo de listado detectado al analizar el Excel |
| `csvData` | `(string\|number)[][]` | Contenido como matriz para side-car CSV |

**Comportamiento:**
- Acepta archivos `.xlsx` y `.csv`
- Renderiza las primeras N filas como tabla HTML
- Detecta el tipo de listado basándose en los encabezados de la primera fila
- Emite el tipo detectado para que el padre genere las propiedades del payload

---

### 6.11 Chart

**Selector:** `mgp-chart`

**Propósito:** Gráfico de torta o barras para estadísticas demográficas.

**Inputs:**

| Input | Tipo | Descripción |
|-------|------|-------------|
| `dataChart` | `DataChart` | Datos del gráfico (labels, datasets, tipo) |

**Usa Chart.js** a través de PrimeNG `p-chart`. Los colores se calculan desde variables CSS de PrimeNG.

---

### 6.12 FirmaCertificado

**Selector:** `mgp-firma-certificado`

**Propósito:** Selector de firma digitalizada para usar en certificados.

**Comportamiento:**
- `GET /api/v2/firmas/lista` → lista de firmas disponibles
- Dropdown para seleccionar firma
- Preview de la imagen de la firma (`GET /api/v2/firmas/{uuid}` → blob)
- Emite el objeto `Documento.Firma` seleccionado al padre

---

### 6.13 ExtraeDatos

**Selector:** `mgp-extrae-datos`

**Propósito:** Extracción directa de datos de un documento (uso puntual, no via cola).

**Comportamiento:**
- Selector de archivo
- Selector de tipo de documento
- `POST /api/v2/ai/extraer` con el archivo
- Muestra los datos extraídos en un formulario editable

---

### 6.14 AccesoDenegado

**Selector:** `mgp-acceso-denegado`

**Propósito:** Página simple que informa que el usuario no tiene permisos para la sección.

**Comportamiento:** Solo muestra un mensaje. Botón para volver a `/listados`.

---

## 7. Servicios HTTP

### 7.1 Mapa completo de llamadas HTTP (Data service)

Todas las llamadas usan `apiBaseUrl` como base y envían `withCredentials: true` (interceptor).

| Método del servicio | HTTP | URL | Respuesta clave |
|--------------------|------|-----|-----------------|
| `init()` | GET ×2 | `/api/v2/archivos/datos/labels` `/api/v2/archivos/datos/categorias` | `{ datos: labels }` `{ datos: categorias[] }` |
| `getCategorias()` | GET | `/api/v2/categorias/arbol` | `{ data: { arbol: DataCategoria[] } }` |
| `getCruce(uuids)` | GET | `/api/v2/categorias/cruce/{x}/{y}` | `{ data: { cruce: DataTabla } }` |
| `loadDocumentos()` | GET | `/api/v2/archivos/datos/documentos` | `{ datos: Documento.Listado }` |
| `getCertificadoFile(...)` | POST | `/api/v2/documentos/generar` | Blob (PDF/DOCX) |
| `getConsultaFile(tipo, data)` | POST | `/api/v2/documentos/exportar` | Blob (XLSX/PDF) |
| `postCargaFiles(props, archivo)` | POST | `/api/v2/archivos/subir` | `{ success, data }` |
| `postLoadList(props, archivo)` | POST | `/api/v2/listados/cargar` | `{ success, data }` |
| `getLoadList(params)` | GET | `/api/v2/listados/datos?...` | `{ datos: { duplicado } }` |
| `getCsvData(params)` | GET | `/api/v2/listados/csv?...` | `{ csv: { arrayCSV, columnasCSV, rawCSV } }` |
| `getFirmas(params)` | GET | `/api/v2/firmas/lista` | array de firmas |
| `postFirma(datos, blob)` | POST | `/api/v2/firmas/subir` | `{ success }` |
| `getImagen(nombre)` | GET | `/api/v2/archivos/imagenes/{nombre}` | Blob → base64 |
| `getArchivo(uuid)` | GET | `/api/v2/archivos/{uuid}` | Blob |
| `getArchivoProfesorUuid(cedula, nombre)` | GET | `/api/v2/profesores/{cedula}/{nombre}` | `{ uuid, propiedades }` |
| `getInfoProfesor(cedula)` | GET | `/api/v2/profesores/{cedula}` | `{ profesor: { archivosProfesor, datosDemograficos } }` |
| `reemplazaArchivo(uuid, nombre, archivo, comentario)` | POST | `/api/v2/archivos/{uuid}/actualizar` | `{ uuid, version }` |
| `deleteFile(uuid)` | DELETE | `/api/v2/archivos/{uuid}` | `{ eliminado: true }` |
| `vaciaPapelera()` | DELETE | `/api/v2/archivos/papelera` | `{ resultado }` |
| `delTemp()` | DELETE | `/api/v2/archivos/temp/limpiar` | `{ borrados }` |
| `getIndiceDocente()` | GET | `/api/v2/listados/indice` | `{ indice: { [cedula]: { NOMBRE_Y_APELLIDO, ... } } }` |
| `extraeDatos(...)` | POST | `/api/v2/ai/extraer` | `{ extraccion }` |
| `getCertificadoInfo(id)` | GET | `/api/v2/certificados/{id}` | `{ certificado }` |
| `getExtraccionStats()` | GET | `/api/v2/extraccion/stats` | `{ total_documentos, por_estado, por_categoria, tasa_exito }` |
| `getQueueStats()` | GET | `/api/v2/ai/queue/stats` | `{ queue: { queue_size, ... } }` |
| `getExtraccionDocente(cedula, page, size)` | GET | `/api/v2/extraccion/{cedula}?page=N&size=N` | `{ documentos, paginacion }` |
| `getJsonExtraido(cedula, nombreJson)` | GET | `/api/v2/extraccion/json/{cedula}/{nombreJson}` | `{ datos }` |
| `resetStuckJobs()` | POST | `/api/v2/ai/reset-stuck-jobs` | `{ resetted }` |
| `retryErrorJobs()` | POST | `/api/v2/ai/retry-error-jobs` | `{ retried }` |
| `getSchedulerStatus()` | GET | `/api/v2/ai/scheduler/status` | `{ scheduler }` |
| `startScheduler()` | POST | `/api/v2/ai/scheduler/start` | `{ scheduler }` |
| `pauseScheduler()` | POST | `/api/v2/ai/scheduler/pause` | `{ scheduler }` |
| `configScheduler(hi, hf)` | POST | `/api/v2/ai/scheduler/config` | `{ scheduler }` |
| `searchDocumentos(query, limit)` | GET | `/api/v2/extraccion/buscar?q={q}&limit={limit}` | `{ results, total }` |
| `validateDocente(cedula)` | POST | `/api/v2/extraccion/validar/{cedula}` | `{ issues, score, resumen }` |

### 7.2 Procesamiento de `getInfoProfesor`

La respuesta de `GET /api/v2/profesores/{cedula}` se transforma antes de usarse:

```typescript
// Entrada desde API:
archivosProfesor: [{ nombre, categorias: [['TIPO','DIPLOMA'], ['FORMATO','PDF'], ...] }]

// Transformación:
DatoArchivo {
  nombre: string,
  formato: categorias.find(c => c[0] === 'FORMATO')?.[1] ?? '',
  tipo: categorias.find(c => c[0] === 'TIPO')?.[1] ?? '',
  origen: categorias.find(c => c[0] === 'ORIGEN')?.[1] ?? '',
  ia_clasificado: !!categorias.find(c => c[0] === 'IA_CLASIFICADO'),
  ia_tipo: categorias.find(c => c[0] === 'IA_CLASIFICADO')?.[1],
}
```

---

## 8. Gestión de Estado

### 8.1 Estado global de autenticación

Implementado con Angular Signals (equivalente: React Context + useState, Vue reactive, Svelte stores):

```typescript
// Estado de solo lectura expuesto por Auth service
usuario: Signal<Usuario | null | undefined>    // undefined = no verificado
cargando: Signal<boolean>
error: Signal<string | null>
estaAutenticado: Signal<boolean>               // computed
esAdmin: Signal<boolean>                       // computed
```

### 8.2 Estado local de vistas

Cada vista maneja su propio estado local (no hay store global más allá de `Auth`):

| Vista | Estado relevante |
|-------|-----------------|
| Extraccion | `totalDocs`, `completados`, `errores`, `pendientes`, `colaActiva`, `schedulerHabilitado`, `busquedaResultados` |
| Edicion | `profesoresFiltrados`, `arbolArchivos`, `archivosSeleccionados`, `dialogoVisible`, `tipoDialogo` |
| Carga | `profesorSeleccionado`, `datosValidados`, `fechaNacimiento`, `archivosYaCargados`, `infoProfesor` |
| Listados | `archivo`, `listadoProps`, `csvData`, `loadingDialog` |

### 8.3 Comunicación entre componentes

| Patrón | Usado entre | Mecanismo |
|--------|------------|-----------|
| Input/Output | Parent → Child → Parent | Props + eventos |
| Subject RxJS | `Carga` → `Edicion` | `archivosCargados$: Subject<string>` en Data service |
| Signal global | Cualquier componente → estado de auth | `Auth.usuario` signal |

---

## 9. Patrones UI Recurrentes

### 9.1 Tabla paginada

Patrón usado en: extracciones en FichaDocente, resultados de búsqueda en Extraccion.

```
Columnas: nombre/tipo/confidence/fecha
Paginación: page size 10 (configurable en API call)
Estado vacío: "No hay documentos" con ícono
Estado cargando: skeleton rows
```

### 9.2 Árbol de archivos

Patrón usado en: Edición.

```
Raíz: tipos de documento (DIPLOMA, CERTIFICADO, ...)
Hijos: archivos individuales con icono según formato
Selección múltiple: checkbox por nodo
El nodo padre se selecciona/deselecciona con todos sus hijos
Los nodos padre sin formato ('JSON') se excluyen del árbol
```

### 9.3 Accordion / Paneles colapsables

Patrón usado en: FichaDocente (paneles de categorías, datos extraídos).

```
Cada panel es colapsable
Los paneles requeridos tienen indicador visual de validado/pendiente
```

### 9.4 Diálogos modales

Patrón central en Edición. Un único `<p-dialog>` renderiza diferentes sub-componentes según `tipoDialogo`:

```
tipoDialogo === 'watch'    → Preview (no cerrable durante carga)
tipoDialogo === 'download' → DownloadPreview (no cerrable durante descarga)
tipoDialogo === 'delete'   → BorraDocumentos
tipoDialogo === 'change'   → Reemplazo
tipoDialogo === 'add'      → Adicion
```

### 9.5 Autocomplete con búsqueda

Patrón usado en: Carga (selección de profesor) y Edición (selección de profesor).

```
Input de texto con dropdown
Filtrado: incluye query en nombre OU en cédula
Al seleccionar: dispara carga asíncrona de datos del profesor
```

### 9.6 Chips de estado / cobertura

Patrón usado en: FichaDocente (cobertura documental), Extraccion (cobertura por tipo).

```
6 chips: uno por tipo de documento estándar
Color: success (verde) si presente, danger (rojo) si ausente
Label: tipo de documento (ej: "Cédula", "Cert. Laboral")
```

### 9.7 Badge de auto-refresh

En Extraccion:
```
Badge "Auto-refresh activo" visible cuando colaActiva > 0
Actualización automática cada 30 segundos mientras colaActiva > 0
Badge desaparece cuando la cola se vacía
```

### 9.8 Toggle con tag de estado

En el panel del Scheduler:
```
Tag "Activo" (success/verde) o "Pausado" (warn/naranja)
Toggle switch para cambiar estado
Spinner mientras la API responde
```

---

## 10. Assets y Estilos

### 10.1 Imágenes

Todas las imágenes se cargan **desde la API**, no están en el bundle del frontend:

| Imagen | Endpoint | Uso |
|--------|---------|-----|
| Logo ESAP | `GET /api/v2/archivos/imagenes/logoESAP.svg` | Login page y Header |
| Logo RUND | `GET /api/v2/archivos/imagenes/logoRUND.png` | Header |
| Imágenes de certificados | `GET /api/v2/archivos/imagenes/{nombre}?ruta=PLANTILLAS/CERTIFICADOS` | Plantillas |
| Firmas | `GET /api/v2/firmas/{uuid}` | Certificados |

No existen imágenes estáticas en el repositorio del frontend (excepto favicon).

### 10.2 Iconografía

Dos sistemas de íconos conviven:

| Sistema | Uso | Prefijo |
|---------|-----|---------|
| PrimeIcons | Mayoría de íconos de UI | `pi pi-...` (ej: `pi-list-check`) |
| FontAwesome 6 Free | Íconos no disponibles en PrimeIcons | `fas fa-...` (ej: `fa-file-arrow-up`) |

### 10.3 Temas y Dark Mode

- **Tema base:** PrimeNG (Aura o Material — verificar el tema configurado)
- **Dark mode:** Clase `app-dark` en el elemento `<html>`
  - Se sincroniza automáticamente con `prefers-color-scheme: dark` del OS al cargar
  - Se escucha el evento `change` del media query para actualizaciones en tiempo real
  - CSS usa `:host-context(.app-dark)` para variantes oscuras en componentes de vistas

### 10.4 Estilos globales

- SCSS modular por componente
- Variables de color de PrimeNG (`--p-{color}-{shade}`) para colores dinámicos en charts
- Clase `app-dark` en `<html>` como selector global de dark mode

---

## 11. SSR y Restricciones de Plataforma

La aplicación usa Angular Universal (SSR). Varias APIs del navegador no están disponibles en el servidor:

| API | Restricción | Solución |
|-----|-------------|---------|
| `window`, `document` | No disponible en SSR | Envolver en `if (isPlatformBrowser(platformId))` |
| `getComputedStyle()` | No disponible en SSR | Solo en browser (para colores de charts) |
| `FileReader` | No disponible en SSR | Solo en browser (para blobToBase64) |
| `URL.createObjectURL()` | No disponible en SSR | Solo en browser (para preview y descarga) |
| `matchMedia()` | No disponible en SSR | Solo en browser (para dark mode) |
| `localStorage`/`sessionStorage` | No disponible en SSR | No se usan — la sesión la maneja rund-api |

**Para el framework de destino:** Si usa SSR, aplicar la misma estrategia de detección de plataforma. Si es SPA puro (sin SSR), estas restricciones no aplican.

---

## 12. Gotchas y Casos Especiales

| Situación | Descripción | Solución |
|-----------|-------------|---------|
| **Loop de NavigationEnd** | `App.inicializa()` se llama en cada NavigationEnd. Si `data.init()` falla con 401, el interceptor redirige a `/login`, causando otro NavigationEnd → loop infinito | Verificar `estaAutenticado()` antes de llamar a `init()`. El interceptor no debe disparar logout/navigate si la URL ya es `/login` |
| **Señal `undefined` al arrancar** | El signal `usuario` empieza en `undefined` (no verificado). Las vistas NO deben mostrar "no autenticado" si `usuario === undefined` — esperar a que sea `null` o un objeto | Mostrar spinner mientras `usuario === undefined` |
| **Propiedades HTML-encoded** | El JSON de propiedades enviado en FormData puede llegar con entidades HTML al backend PHP | El frontend no necesita hacer nada especial — el backend hace el decode |
| **archivosCargados$ no es signal** | Es un RxJS Subject (hot observable). El componente `Edicion` debe suscribirse y desuscribirse correctamente | Usar `takeUntil(destroy$)` o equivalente en el framework de destino |
| **Orden de carga de Edición** | La barra de progreso real requiere esperar que `getIndiceDocente()` retorne y luego hacer N llamadas a `getInfoProfesor()`. Las llamadas son secuenciales, no paralelas | No hay optimización aquí — es por diseño (evitar sobrecarga de OpenKM) |
| **Autocomplete de profesores en Edición** | Solo se agregan a la lista profesores que tienen archivos. Un profesor sin archivos en OpenKM no aparece | Comportamiento esperado |
| **CSV de profesores en Carga** | El archivo `ListadoGeneralDocente.csv` debe existir en OpenKM. Si no existe, el autocomplete queda vacío | Mostrar skeleton y mensaje de error si la carga falla |
| **FichaDocente: selector `multiple` con string** | Si `infoProfesor` tiene un valor string para una categoría `multiple`, hay que normalizarlo a array antes de buscar en las opciones | `const valores = Array.isArray(opcionProf) ? opcionProf : [opcionProf]` |
| **FichaDocente: `Nivel de Formación` vs `Nivel educativo`** | La clave en el CSV es "Nivel de Formación" pero en las categorías de OpenKM se llama "Nivel educativo". Hay una tabla de conversión `convCat` | Aplicar la misma tabla de conversión: `'Nivel de Formación' → 'Nivel educativo'` |
| **Preview de PDF en SSR** | pdfjs-dist usa APIs del navegador. El render debe hacerse solo en el cliente | Lazy-load del componente Preview solo en el cliente |
| **Carga de logo en Login** | El logo se carga desde la API como blob y se convierte a base64. Si la API no responde, mostrar un placeholder | Manejar el error silenciosamente (no mostrar mensaje de error en la pantalla de login por esto) |
| **Colores de charts en SSR** | `getComputedStyle()` no está disponible en el servidor | Retornar string vacío y dejar que el cliente actualice los colores |

---

## 13. Checklist de Verificación Post-Migración

### Autenticación
- [ ] Login LDAP: formulario envía `{ username, password }` + header `X-App-Id: rund-mgp`
- [ ] Cookie `RUND_SESSION` se envía automáticamente en todas las requests
- [ ] 401 → redirige a `/login` con `?returnUrl=<ruta>`; 403 → redirige a `/acceso-denegado`
- [ ] Al recargar la página: verifica sesión con `GET /api/v2/auth/session` antes de mostrar contenido
- [ ] Logout limpia el estado local aunque falle la llamada al servidor
- [ ] `adminGuard` bloquea `/gestion` para usuarios no-admin

### Rutas y navegación
- [ ] `/` → redirect a `/listados`
- [ ] `/**` → redirect a `/listados`
- [ ] `/login` es accesible sin sesión
- [ ] Todas las rutas protegidas redirigen a `/login` sin sesión

### Carga de datos
- [ ] `GET /api/config` se llama antes del bootstrap y `apiBaseUrl` se usa en todas las llamadas
- [ ] `labels` y `categorias` se cargan al inicializar la app (una sola vez mientras la sesión esté activa)
- [ ] FichaDocente pre-popula categorías desde `infoProfesor` (datos de OpenKM) correctamente

### Vistas
- [ ] Listados: detecta duplicados y muestra diálogo de confirmación con detalles
- [ ] Listados: genera y sube CSV side-car junto con el Excel
- [ ] Extraccion: auto-refresh cada 30s mientras `colaActiva > 0`; se detiene al vaciarse la cola
- [ ] Extraccion: aliases OpenKM→schema AI correctos en cobertura por tipo
- [ ] Carga: subida secuencial (no paralela) de archivos
- [ ] Carga: notifica a Edición vía `archivosCargados$` al completar
- [ ] Edición: árbol agrupa archivos por tipo; excluye JSON (formato='JSON') y vacíos
- [ ] Edición: barra de progreso real durante la carga inicial

### Componentes
- [ ] FichaDocente: normalización de texto para cruce de datos (`simp()` + `compara()`)
- [ ] FichaDocente: fecha de nacimiento calcula rango etario automáticamente
- [ ] FichaDocente: validado emite array vacío si hay paneles requeridos incompletos
- [ ] FichaDocente: diálogo de detalle muestra campos del JSON side-car (usa `datos.data ?? datos`)
- [ ] Menu: visibilidad de ítems según rol del usuario autenticado

### Dark mode y estilos
- [ ] Clase `app-dark` en `<html>` se sincroniza con `prefers-color-scheme` del OS
- [ ] Componentes de vistas aplican `:host-context(.app-dark)` o equivalente para variantes oscuras

---

*Catálogo generado el 05 jun 2026 — Versión Angular documentada: rund-mgp v3.2 (commit rund-mgp#20)*
