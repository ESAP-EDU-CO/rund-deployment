# Tech Specs — RUND

> **Audiencia:** Equipo de desarrollo  
> **Nivel de detalle:** Referencia exhaustiva — suficiente para retomar el proyecto sin contexto previo  
> **Versión:** 1.0 — 14 mayo 2026  
> **Referencia de negocio:** Ver [PRD.md](./PRD.md)

---

## 1. Visión General de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENTE (navegador)                             │
│                  Chrome / Firefox / Edge 120+                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTP :4000
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              rund-mgp — Angular 21 + SSR (Node 22)                  │
│  Puerto: 4000  │  Imagen: ocastelblanco/rund-mgp:latest             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /login  /app/dashboard  /app/gestion  /app/certificados    │   │
│  │  /app/consultas  /app/listados  /app/validacion             │   │
│  │  /app/herramientas (solo admin)                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTP :3000  (withCredentials — cookie RUND_SESSION)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              rund-api — PHP 8.3 + Nginx + Supervisor                │
│  Puerto: 3000  │  Imagen: ocastelblanco/rund-api:latest             │
│                                                                     │
│  BFF: orquesta todas las llamadas a servicios internos              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │  /auth   │ │/profesores│ │/certif.  │ │/archivos │ │  /ai   │  │
│  │  /admin  │ │/categorias│ │/documentos│ │/listados │ │/firmas │  │
│  └────┬─────┘ └─────┬────┘ └────┬─────┘ └─────┬────┘ └────┬───┘  │
└───────┼─────────────┼───────────┼──────────────┼───────────┼───────┘
        │             │           │              │           │
    :8080           :8080       :8080          :8001      :8000
        │             │           │              │           │
        ▼             ▼           ▼              ▼           ▼
┌──────────┐   ┌──────────┐             ┌──────────┐ ┌──────────────┐
│rund-auth │   │  OpenKM  │             │  rund-ai │ │  rund-ocr    │
│Node 20+  │   │(rund-core│             │Python 3.9│ │ Python 3.9   │
│TS/Express│   │Java/Tomcat│             │  Flask   │ │  PaddleOCR   │
│  :8080   │   │  :8080   │             │  :8001   │ │    :8000     │
│          │   │          │             │          │ │              │
│ Redis ←──┤   │ openkm-  │             │ ollama ←─┤ │              │
│ Postgres ←┤   │   data   │             │  :11434  │ │              │
└────┬─────┘   └──────────┘             └──────────┘ └──────────────┘
     │
     ├── Redis :6379  (sesiones, 8h TTL)
     └── PostgreSQL :5433  (BD rund_auth)

Red interna: rund-network (Docker bridge)
Todos los servicios se referencian por nombre de contenedor internamente.
```

### Principio de comunicación

- **rund-mgp → rund-api:** Único punto de entrada del frontend. Siempre `withCredentials: true`.
- **rund-api → servicios internos:** PHP hace fetch HTTP a los servicios por nombre Docker.
- **rund-ai ↔ rund-ocr:** rund-ai llama a rund-ocr durante el procesamiento asíncrono.
- **rund-ai ↔ ollama:** rund-ai usa Ollama como motor de inferencia local.
- **rund-auth → Redis:** Almacena sesiones. rund-api → rund-auth: valida tokens via JWKS.

---

## 2. Stack Tecnológico Completo

| Servicio | Tecnología | Versión | Propósito |
|----------|-----------|---------|-----------|
| **rund-mgp** | Angular | 21.2.x | Frontend SPA con SSR |
| **rund-mgp** | TypeScript | 5.9.3 | Tipado estático frontend |
| **rund-mgp** | Node.js | 22 Alpine | Runtime SSR y build |
| **rund-mgp** | PrimeNG | 21.1.1 | Biblioteca de componentes UI |
| **rund-mgp** | Chart.js | 4.5.0 | Gráficos y dashboards |
| **rund-mgp** | pdf.js | 5.4.449 | Visualización de PDFs en navegador |
| **rund-mgp** | Tailwind CSS | — | Sistema de estilos (postcss) |
| **rund-api** | PHP | 8.3 FPM Alpine 3.19 | Backend API y orquestación |
| **rund-api** | Nginx | Alpine | Servidor web / proxy |
| **rund-api** | Supervisor | — | Gestión de procesos (Nginx + PHP-FPM) |
| **rund-api** | PHPSpreadsheet | 5.2 | Lectura/escritura Excel |
| **rund-api** | PHPWord | 1.4 | Generación de documentos Word |
| **rund-api** | dompdf | 3.1 | Conversión HTML/Word → PDF |
| **rund-api** | endroid/qr-code | 6.0.9 | Generación de códigos QR |
| **rund-api** | LibreOffice | Alpine | Conversión de formatos de documento |
| **rund-auth** | Node.js | 20 Alpine | Runtime del servicio de autenticación |
| **rund-auth** | Express.js | 4.19.2 | Framework web |
| **rund-auth** | TypeScript | 5.6.3 | Tipado estático |
| **rund-auth** | jose | 5.9.3 | JWT RS256 (firmar y validar) |
| **rund-auth** | ldapts | 8.0.19 | Cliente LDAP para Active Directory |
| **rund-auth** | openid-client | 5.6.5 | OAuth 2.0 / OIDC con Azure AD |
| **rund-auth** | ioredis | 5.4.1 | Cliente Redis para sesiones |
| **rund-auth** | express-session | 1.17.3 | Middleware de sesiones |
| **rund-auth** | helmet | 7.1.0 | Headers de seguridad HTTP |
| **rund-auth** | zod | 3.23.8 | Validación de entradas |
| **rund-ai** | Python | 3.9 Slim | Runtime del servicio de IA |
| **rund-ai** | Flask | 3.0.0 | Framework web |
| **rund-ai** | gunicorn | 21.2.0 | Servidor WSGI (4 workers) |
| **rund-ai** | sentence-transformers | 2.7.0 | Embeddings multilingües |
| **rund-ai** | chromadb | 0.4.18 | Base de datos vectorial |
| **rund-ai** | torch | 2.1.2 CPU | Inferencia de modelos (sin GPU) |
| **rund-ai** | pymupdf | 1.24.5 | PDF → imágenes |
| **rund-ocr** | Python | 3.9 Slim | Runtime del servicio OCR |
| **rund-ocr** | PaddleOCR | 2.9.1 | Motor OCR (español + inglés) |
| **rund-ocr** | paddlepaddle | 3.2.1 | Backend de PaddleOCR |
| **rund-ocr** | Flask | 3.0.0 | Framework web |
| **rund-ocr** | pdf2image | 1.17.0 | PDF → imágenes PNG |
| **rund-ocr** | opencv-python-headless | 4.10.0.84 | Preprocesamiento de imágenes |
| **rund-core** | OpenKM CE | latest | Repositorio documental (DMS) |
| **rund-core** | Java / Tomcat | — | Runtime de OpenKM |
| **rund-ollama** | Ollama | latest | Motor de inferencia LLM local |
| **Modelo LLM** | gemma4:e4b | — | Extracción estructurada + clasificación |
| **Modelo embeddings** | paraphrase-multilingual-MiniLM-L12-v2 | — | Embeddings semánticos multilingües |
| **redis** | Redis | 7 Alpine | Cache y almacenamiento de sesiones |
| **postgres** | PostgreSQL | 16 Alpine | Base de datos de rund-auth |
| **Infraestructura** | Docker + Docker Compose | — | Orquestación de contenedores |
| **Build multiplataforma** | Docker Buildx | — | Imágenes linux/amd64 + linux/arm64 |
| **Registro de imágenes** | Docker Hub | — | `ocastelblanco/rund-*:latest` |

---

## 3. Estructura del Repositorio

```
rund-deployment/
├── rund-api/                    # Backend PHP 8.3
│   ├── app/
│   │   ├── index.php            # Punto de entrada único
│   │   ├── bootstrap.php        # Inicialización de la aplicación
│   │   ├── routes_v2.php        # Definición de todas las rutas
│   │   └── src/
│   │       ├── Config/Config.php         # URLs y constantes globales
│   │       ├── Core/
│   │       │   ├── Router.php            # Router personalizado PSR-4
│   │       │   ├── OpenKM.php            # Cliente HTTP para OpenKM API
│   │       │   └── Utils.php             # Helpers generales
│   │       ├── Controllers/V2/           # Un archivo por recurso
│   │       │   ├── AuthController.php
│   │       │   ├── ProfesoresController.php
│   │       │   ├── DocumentosController.php
│   │       │   ├── ArchivosController.php
│   │       │   ├── CertificadosController.php
│   │       │   ├── CategoriasController.php
│   │       │   ├── ListadosController.php
│   │       │   ├── FirmasController.php
│   │       │   ├── AIController.php
│   │       │   └── WhitelistController.php
│   │       ├── Middleware/
│   │       │   ├── AuthMiddleware.php    # Valida JWT en cada request
│   │       │   ├── CorsMiddleware.php
│   │       │   └── ValidationMiddleware.php
│   │       └── Services/
│   │           ├── AuthService.php       # Proxy hacia rund-auth
│   │           ├── JWTValidator.php      # Valida JWT con JWKS (OpenSSL nativo)
│   │           └── WhitelistService.php  # Gestión de roles por email
│   ├── Dockerfile
│   └── composer.json
│
├── rund-mgp/                    # Frontend Angular 21
│   ├── src/app/
│   │   ├── app.ts               # Bootstrap + APP_INITIALIZER
│   │   ├── app.routes.ts        # Rutas con lazy loading y guards
│   │   ├── compartidos/
│   │   │   ├── servicios/
│   │   │   │   ├── auth.ts      # Login, logout, session, señales reactivas
│   │   │   │   ├── data.ts      # CRUD hacia rund-api
│   │   │   │   ├── config.service.ts   # Carga /api/config al inicio
│   │   │   │   └── categoria.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth-guard.ts       # authGuard, adminGuard
│   │   │   └── componentes/     # Componentes reutilizables
│   │   └── vistas/              # Páginas (una por ruta)
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── rund-auth/                   # Servicio de autenticación Node.js
│   ├── src/
│   │   ├── server.ts            # Entry point Express
│   │   ├── routes/
│   │   │   ├── oauth.ts         # /oauth/login, /oauth/callback
│   │   │   ├── ldap.ts          # /ldap/login, /ldap/test-connection
│   │   │   ├── session.ts       # /session, /logout
│   │   │   └── dev.ts           # /dev/login (solo DEV_FAKE_LOGIN=true)
│   │   ├── services/
│   │   │   ├── ldapService.ts   # Conexión y bind LDAP
│   │   │   ├── jwtService.ts    # Firma JWT RS256 con jose
│   │   │   └── sessionService.ts # Redis sessions
│   │   └── middleware/
│   ├── scripts/
│   │   └── generate-jwks.ts     # Genera par de claves RSA para JWT
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
├── rund-ai/                     # Servicio de IA Python
│   ├── app.py                   # Factory Flask + registro de blueprints
│   ├── config/
│   │   ├── settings.py          # Variables de entorno y configuración
│   │   ├── schemas.py           # 6 schemas de extracción JSON
│   │   └── document_type_mapping.py  # tipo OpenKM → schema
│   ├── api/
│   │   ├── routes.py            # Registro de blueprints
│   │   ├── extract.py           # POST /extract
│   │   ├── classify.py          # POST /classify
│   │   ├── search.py            # POST /search
│   │   ├── validate.py          # POST /validate
│   │   └── queue.py             # POST /queue/add-batch, GET /queue/*
│   ├── services/
│   │   ├── ollama_service.py    # Cliente Ollama (singleton con lazy loading)
│   │   ├── extractor_service.py # Orquesta NuExtract via Ollama
│   │   ├── classifier_service.py
│   │   ├── search_service.py    # Búsqueda ChromaDB
│   │   ├── embeddings_service.py
│   │   ├── extraction_worker.py # Pool de 3 workers para procesamiento async
│   │   ├── extraction_queue.py  # Cola FIFO thread-safe
│   │   ├── ocr_client.py        # Llama a rund-ocr /extract-text
│   │   └── openkm_client.py     # Descarga/sube archivos a OpenKM
│   ├── requirements.txt
│   └── Dockerfile
│
├── rund-ocr/                    # Servicio OCR Python
│   ├── app.py                   # Flask + endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── keys/                        # Claves RSA para JWT (NO en git)
│   ├── jwks-private.json        # Clave privada (solo rund-auth)
│   └── jwks-public.json         # Clave pública (comparte rund-api)
│
├── scripts/
│   ├── build-and-push.sh        # Build multiplataforma + push a Docker Hub
│   ├── check-architectures.sh   # Verifica linux/amd64 + linux/arm64
│   └── debug_network.sh         # Diagnóstico de red Docker
│
├── docs/
│   ├── 2026-03-UAT/             # Documentación de la fase UAT
│   ├── guias/
│   │   └── workflow-git.md      # Guía de git flow del equipo
│   └── reportes/
│       └── RUND-Arquitectura-Seguridad.md
│
├── docker-compose.yml           # Entorno de desarrollo
├── docker-compose.prod.yml      # Entorno de producción
├── deploy.sh                    # Script unificado de despliegue
├── whitelist.json               # Roles por usuario y aplicación
├── CLAUDE.md                    # Instrucciones para agentes IA
├── PRD.md                       # Requisitos de producto
├── tech-specs.md                # Este documento
├── MEMORY.md                    # Estado del proyecto y ADRs
└── TODO.md                      # Motor JIT (2 tareas atómicas)
```

### Alias de rutas TypeScript (rund-mgp)

| Alias | Ruta real |
|-------|-----------|
| `@vistas/*` | `src/app/vistas/*` |
| `@componentes/*` | `src/app/compartidos/componentes/*` |
| `@servicios/*` | `src/app/compartidos/servicios/*` |
| `@modulos/*` | `src/app/compartidos/modulos/*` |
| `@pipes/*` | `src/app/compartidos/pipes/*` |

---

## 4. Frontend — rund-mgp (Angular 21)

### 4.1 Patrones Arquitectónicos

| Patrón | Descripción | Cuándo aplicarlo |
|--------|-------------|-----------------|
| **Señales reactivas (Signals)** | Estado de usuario/sesión con `signal()`, `computed()`, `effect()` | Estado global de autenticación, datos reactivos de UI |
| **Lazy loading** | Cada ruta carga su módulo solo cuando se navega | Todas las rutas en `app.routes.ts` |
| **SSR (Server-Side Rendering)** | El servidor Node renderiza el HTML inicial | Siempre activo; evitar `window`/`document` sin `isPlatformBrowser` |
| **Standalone components** | Sin NgModules para componentes de ruta | Toda componente nueva desde Angular 21 |
| **Smart / Dumb components** | Las vistas son smart (acceden a servicios); los componentes reutilizables son dumb | Separar lógica de presentación |

### 4.2 Rutas y Navegación

| Ruta | Componente | Guard | Notas |
|------|-----------|-------|-------|
| `/login` | `LoginComponent` | — | Redirige a `/app/dashboard` si ya hay sesión |
| `/app` | Layout raíz | `authGuard` | Verifica sesión activa en rund-api |
| `/app/dashboard` | `DashboardComponent` | `authGuard` | Vista principal |
| `/app/consultas` | `ConsultasComponent` | `authGuard` | Búsqueda de profesores y documentos |
| `/app/listados` | `ListadosComponent` | `authGuard` | Carga masiva desde Excel |
| `/app/validacion` | `ValidacionComponent` | `authGuard` | Revisión de datos extraídos |
| `/app/gestion` | `GestionComponent` | `authGuard` | CRUD de hojas de vida |
| `/app/gestion/carga` | `CargaComponent` | `authGuard` | Subida de documentos |
| `/app/gestion/edicion` | `EdicionComponent` | `authGuard` | Edición de datos |
| `/app/gestion/reemplazo` | `ReemplazoComponent` | `authGuard` | Reemplazo de archivos |
| `/app/certificados` | `CertificadosComponent` | `authGuard` | Generación de certificados |
| `/app/herramientas` | `HerramientasComponent` | `authGuard` + `adminGuard` | Solo rol `admin` |
| `/acceso-denegado` | `AccessDeniedComponent` | — | Destino si falla `adminGuard` |

**Lógica de guards:**

```typescript
// authGuard: verifica sesión activa en el backend
async function authGuard(): Promise<boolean | UrlTree> {
  const session = await authService.verificarSesion(); // GET /api/v2/auth/session
  if (!session) return router.parseUrl('/login');
  return true;
}

// adminGuard: verifica rol admin en el objeto de sesión
function adminGuard(): boolean | UrlTree {
  const usuario = authService.usuarioSignal();
  if (usuario?.rol !== 'admin') return router.parseUrl('/acceso-denegado');
  return true;
}
```

### 4.3 Inicialización de la Aplicación

Al arrancar, `app.ts` registra un `APP_INITIALIZER` que llama a `ConfigService.cargar()`:

```
GET /api/config → { apiBaseUrl, environment, version }
```

Esto permite que la URL de la API sea dinámica (dev vs. prod) sin recompilar el frontend.

### 4.4 Modelos de Datos Principales

```typescript
interface Usuario {
  sub: string;       // Identificador único (cédula o email)
  name: string;      // Nombre completo
  email: string;     // Email corporativo @esap.edu.co
  tid: string;       // Tenant ID (Azure) o 'ldap'
  rol?: Rol;
  roles?: Rol[];
}

type Rol = 'admin' | 'gestor' | 'directivo' | 'usuario';

interface InfoProfesor {
  cedula: string;
  nombre: string;
  archivos: Array<{ uuid: string; nombre: string }>;
  demografia: DatoDemografico[];
}

interface ResultadoExtraccion {
  tipo_documento: string;
  campos: Record<string, string>;
  confianza: number;         // 0–100
  es_valido: boolean;
  errores: string[];
}
```

### 4.5 Sistema de Estilos

- **Framework base:** Tailwind CSS (PostCSS)
- **Componentes:** PrimeNG 21.1.1 con `@primeuix/styles` 2.0.3
- **Iconografía:** Font Awesome 6.7.2
- **Convención:** Clases utilitarias Tailwind en el template; estilos específicos de componente en archivos `.scss` del mismo directorio

### 4.6 SSR — Consideraciones

El frontend usa Angular SSR (`server/server.mjs`). Reglas obligatorias:

- Nunca acceder a `window`, `document`, `localStorage` directamente — usar `isPlatformBrowser()` o `PLATFORM_ID`.
- Los servicios que hacen HTTP deben funcionar en servidor y cliente.
- `TransferState` para pasar datos del servidor al cliente sin doble fetch.

---

## 5. Backend — rund-api (PHP 8.3)

### 5.1 Endpoints Completos

**Base URL:** `/api/v2`

#### Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/system/info` | No | Versión, entorno, estado |
| GET | `/system/health` | No | Health check agregado |
| GET | `/system/capabilities` | No | Features habilitadas |
| GET | `/api/config` | No | Config para frontend (apiBaseUrl, env) |

#### Autenticación (BFF → rund-auth)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login LDAP (forwarded a rund-auth) |
| POST | `/auth/dev/login` | No | Dev login (solo `DEV_FAKE_LOGIN=true`) |
| GET | `/auth/health` | No | Estado de rund-auth |
| GET | `/auth/session` | ✅ | Verificar sesión activa |
| POST | `/auth/logout` | ✅ | Cerrar sesión |
| POST | `/auth/refresh` | ✅ | Refrescar JWT |

#### Profesores

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/profesores/{cedula}` | ✅ | Datos del profesor |
| GET | `/profesores/{cedula}/archivos` | ✅ | Lista de archivos del profesor |
| GET | `/profesores/{cedula}/demografia` | ✅ | Datos demográficos |
| GET | `/profesores/{cedula}/{nombre_archivo}` | ✅ | Archivo específico por nombre |

#### Categorías

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/categorias/arbol` | ✅ | Árbol de categorías de OpenKM |
| GET | `/categorias/cruce/{x}/{y}` | ✅ | Tabla cruzada de categorías |

#### Archivos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/archivos/subir` | ✅ | Subir archivo (multipart/form-data) |
| GET | `/archivos/datos/{nombre}` | ✅ | Metadatos de un archivo |
| GET | `/archivos/imagenes/{nombre}` | ✅ | Descargar imagen |
| GET | `/archivos/{uuid}` | ✅ | Descargar archivo por UUID |
| POST | `/archivos/{uuid}/actualizar` | ✅ | Actualizar metadatos |
| DELETE | `/archivos/{uuid}` | ✅ | Eliminar archivo |
| DELETE | `/archivos/temp/limpiar` | ✅ admin | Limpiar archivos temporales |
| DELETE | `/archivos/papelera` | ✅ admin | Vaciar papelera |

#### Documentos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/documentos/plantillas` | ✅ | Listar plantillas disponibles |
| POST | `/documentos/generar` | ✅ | Generar documento (Word/PDF) |
| POST | `/documentos/exportar` | ✅ | Exportar en formato específico |

#### Certificados

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/certificados/{id}` | ✅ | Obtener certificado |
| GET | `/certificados/plantillas` | ✅ | Plantillas de certificados |
| POST | `/certificados/generar` | ✅ | Generar certificado (Word/PDF) |

#### Listados

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/listados/cargar` | ✅ | Cargar Excel/CSV |
| GET | `/listados/datos` | ✅ | Ver datos del listado |
| GET | `/listados/csv` | ✅ | Descargar como CSV |
| GET | `/listados/indice` | ✅ | Índice de listados disponibles |

#### Firmas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/firmas/lista` | ✅ | Listar firmas disponibles |
| GET | `/firmas/{uuid}` | ✅ | Obtener imagen de firma |
| POST | `/firmas/subir` | ✅ admin | Subir firma digitalizada |

#### IA (orquestación hacia rund-ai y rund-ocr)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/ai/extraer` | ✅ | OCR + extracción estructurada |
| POST | `/ai/webhook/extraction-complete` | ✅ interno | Callback de rund-ai |
| GET | `/ai/extraction/statistics` | ✅ | Estadísticas de extracciones |
| GET | `/ai/extraction/professor/{cedula}` | ✅ | Extracciones de un profesor |

#### Administración (whitelist)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/admin/whitelist/seed` | Red interna | Inicializar whitelist |
| GET | `/admin/whitelist` | ✅ admin | Ver whitelist completa |
| GET | `/admin/whitelist/{app_id}` | ✅ admin | Ver app específica |
| PUT | `/admin/whitelist/{app_id}/usuario` | ✅ admin | Agregar usuario |
| DELETE | `/admin/whitelist/{app_id}/usuario/{email}` | ✅ admin | Remover usuario |

#### Endpoints internos (solo red Docker)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/internos/health` | Red interna | Health check interno |
| POST | `/internos/documentos/obtener-uuid` | Red interna | UUID de documento en OpenKM |
| GET | `/internos/documentos/descargar/{uuid}` | Red interna | Descargar documento |
| POST | `/internos/documentos/subir-json` | Red interna | Subir JSON side-car |
| PUT | `/internos/documentos/categoria` | Red interna | Cambiar categoría en OpenKM |

### 5.2 Servicios Externos Consumidos por rund-api

| Servicio | URL interna | Estado | Uso actual | Uso futuro |
|----------|------------|--------|-----------|-----------|
| rund-auth | `http://rund-auth:8080` | ✅ Activo | Login LDAP/OAuth, validación JWKS | Rate limiting, 2FA |
| OpenKM (rund-core) | `http://rund-core:8080/OpenKM` | ✅ Activo | Almacenamiento y recuperación de documentos | Sin cambios planificados |
| rund-ai | `http://rund-ai:8001` | ✅ Activo | Extracción estructurada, estadísticas | Clasificación automática |
| rund-ocr | `http://rund-ocr:8000` | ✅ Activo | Extracción de texto de documentos | OCR optimizado para cédulas |

---

## 6. Servicio de IA — rund-ai (Python 3.9)

### 6.1 Endpoints

**Base URL:** `http://rund-ai:8001` (interno) / `http://localhost:8001` (desarrollo)

| Método | Ruta | Descripción | Payload |
|--------|------|-------------|---------|
| GET | `/health` | Estado del servicio | — |
| GET | `/info` | Modelos cargados, capabilities | — |
| POST | `/extract` | Extrae datos estructurados | `{ text, schema_or_document_type }` |
| POST | `/classify` | Clasifica tipo de documento | `{ text }` |
| POST | `/search` | Búsqueda semántica | `{ query, top_k }` |
| POST | `/validate` | Valida consistencia entre docs | `{ documents: [...] }` |
| POST | `/queue/add-batch` | Agrega batch a cola async | `{ documents: [...], callback_url }` |
| GET | `/queue/stats` | Estadísticas de la cola | — |
| GET | `/queue/job/{document_id}` | Estado de un job | — |
| GET | `/extraction/statistics` | Estadísticas globales del índice | — |
| GET | `/extraction/professor/{cedula}` | Extracciones de un profesor | — |

### 6.2 Schemas de Extracción

Definidos en `rund-ai/config/schemas.py`:

| Schema | Tipo de documento | Campos clave |
|--------|------------------|--------------|
| `cedula` | Cédula de ciudadanía | número, nombres, apellidos, fecha_nacimiento, lugar_expedicion, sexo, rh |
| `certificado_laboral` | Certificado laboral | entidad_emisora, cargo, fecha_inicio, fecha_fin, salario, tipo_contrato |
| `certificado_academico` | Título universitario | institucion, tipo_titulo, nivel_educativo, fecha_grado, matricula_profesional |
| `resolucion` | Resolución de nombramiento | numero_resolucion, fecha, entidad_emisora, cargo, vigencia |
| `acta` | Acta de evaluación docente | numero_acta, periodo, evaluadores, resultados |
| `certificado_idiomas` | Certificado de idiomas | idioma, nivel (A1-C2), institucion, fecha_certificacion |

### 6.3 Procesamiento Asíncrono

```
POST /queue/add-batch
  → ExtractionQueue (FIFO thread-safe)
    → ExtractionWorker (pool de 3 workers paralelos)
      → OCRClient → rund-ocr /extract-text (texto del PDF)
      → ExtractorService → Ollama /api/generate (extracción JSON)
      → OpenKMClient → sube JSON side-car al repositorio
      → ExtractionIndexService → actualiza índice centralizado
      → Callback al webhook de rund-api (si se especificó callback_url)

Reintentos: máximo 3 intentos por job
Estados: queued → processing → completed | failed
```

### 6.4 Base de Datos Vectorial (ChromaDB)

- **Almacenamiento:** Volumen Docker `ai-cache` en `/cache/chromadb`
- **Modelo de embeddings:** `paraphrase-multilingual-MiniLM-L12-v2` (~120 MB)
- **Uso:** Indexación de documentos para búsqueda semántica
- **Latencia de búsqueda:** ~100 ms

---

## 7. Servicio OCR — rund-ocr (Python 3.9)

### 7.1 Endpoint Principal

```
POST /extract-text
Content-Type: multipart/form-data
Body: file (PDF, PNG, JPG, TIFF, BMP — máx 50 MB)

Response:
{
  "success": true,
  "filename": "cedula.pdf",
  "pages_processed": 2,
  "text": "REPÚBLICA DE COLOMBIA...",
  "confidence": 0.94,
  "lines_detected": 28,
  "details": [{ "page": 1, "text": "...", "confidence": 0.95, "lines_detected": 14 }]
}
```

### 7.2 Pipeline de Procesamiento

```
1. Si es PDF: pdf2image (300 DPI) → lista de imágenes PNG
2. Por cada imagen:
   a. OpenCV: escala de grises
   b. Filtro bilateral (reducción de ruido)
   c. CLAHE (mejora de contraste adaptativo)
   d. Umbralización adaptativa
   e. PaddleOCR (modelos español + inglés)
3. Combinar texto de todas las páginas
4. Retornar texto + métricas de confianza
```

---

## 8. Servicio de Autenticación — rund-auth (Node.js 20)

### 8.1 Endpoints

**Base URL:** `http://rund-auth:8080` (interno) / `http://localhost:8081` (desarrollo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/ldap/login` | Autenticación con AD de ESAP |
| GET | `/ldap/test-connection` | Diagnóstico de conexión LDAP |
| GET | `/ldap/user-info/{username}` | Atributos de usuario (solo DEV) |
| GET | `/ldap/stats` | Estadísticas de usuarios en AD |
| GET | `/oauth/login` | Inicia flujo OAuth 2.0 (Entra ID) |
| GET | `/oauth/callback` | Callback de Entra ID |
| GET | `/.well-known/jwks.json` | Clave pública para validar JWT |
| GET | `/session` | Sesión actual del usuario |
| POST | `/logout` | Cerrar sesión (elimina de Redis) |
| GET | `/dev/login` | Fake login (solo `DEV_FAKE_LOGIN=true`) |
| POST | `/dev/login` | Fake login POST |
| GET | `/healthz` | Estado de rund-auth |

### 8.2 Estructura del JWT Emitido

```json
{
  "sub": "71799891",
  "email": "juan.perez@esap.edu.co",
  "roles": [],
  "wl_ver": 1,
  "iss": "rund-auth",
  "aud": ["rund-api", "rund-mgp"],
  "iat": 1700000000,
  "exp": 1700000900
}
```

- **Algoritmo:** RS256 (asimétrico)
- **TTL:** 900 segundos (15 minutos)
- **Clave privada:** `keys/jwks-private.json` (solo rund-auth)
- **Clave pública:** `http://rund-auth:8080/.well-known/jwks.json`

### 8.3 Flujo de Autenticación Completo

```
1. rund-mgp POST /api/v2/auth/login { username, password }
2. rund-api → POST http://rund-auth:8080/ldap/login
3. rund-auth → LDAP bind contra ldap://esap.edu.int:389
4. Si OK: rund-auth genera JWT RS256, crea sesión en Redis (8h)
5. rund-api recibe JWT → consulta whitelist.json por el email
6. rund-api asigna rol → establece cookie RUND_SESSION (httpOnly, sameSite=Lax)
7. rund-mgp recibe { user, rol } y actualiza señales reactivas
8. Requests siguientes: cookie incluida automáticamente → rund-api valida JWT con JWKS
```

---

## 9. Infraestructura y Despliegue

### 9.1 Entornos

| Entorno | URL frontend | URL API | Compose file | Comando |
|---------|-------------|---------|-------------|---------|
| **Desarrollo** | http://localhost:4000 | http://localhost:3000 | `docker-compose.yml` | `./deploy.sh local` |
| **UAT / Producción** | http://172.16.234.52:4000 | http://172.16.234.52:3000 | `docker-compose.prod.yml` | `./deploy.sh prod` |

**Diferencias clave entre entornos:**

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `ENVIRONMENT` | development | production |
| `DEV_FAKE_LOGIN` | true | false |
| `FLASK_ENV` | development | production |
| `PHP_OPCACHE_VALIDATE_TIMESTAMPS` | 1 | 0 |
| Código fuente | Bind mount (live reload) | Copiado en imagen |
| Imágenes | Build local | `ocastelblanco/rund-*:latest` |
| Límite RAM Ollama | Sin límite | 12 GB |

### 9.2 Proceso de Build y Deploy

**Build de imágenes (desde Mac de desarrollo):**
```bash
# Build y push de todas las imágenes con soporte multi-arquitectura
./scripts/build-and-push.sh [tag] [componentes]
# Ejemplo: ./scripts/build-and-push.sh v1.3.0 api,mgp,auth

# Verificar que las imágenes tienen ambas arquitecturas
./scripts/check-architectures.sh
```

**Arquitecturas soportadas:** `linux/amd64` (servidor de producción) + `linux/arm64` (Mac M2)

**Deploy en producción (en el servidor):**
```bash
./deploy.sh prod
# El script hace: pull de imágenes → up -d → health checks → descarga modelos Ollama
```

**Modelos Ollama descargados automáticamente en el primer deploy:**
- `nuextract` (extracción estructurada)
- `gemma2:2b` (análisis complejo)
- `gemma4:e4b` (modelo principal actual — multimodal)

### 9.3 Volúmenes Docker

| Volumen | Contenedor | Propósito | Persistencia |
|---------|-----------|-----------|-------------|
| `openkm-data` | rund-core | Repositorio de documentos | Permanente |
| `ollama-data` | rund-ollama | Modelos de IA descargados | Permanente |
| `ocr-models` | rund-ocr | Cache de modelos PaddleOCR | Permanente |
| `ai-models` | rund-ai | Modelos de embeddings | Permanente |
| `ai-cache` | rund-ai | ChromaDB (índice vectorial) | Permanente |
| `redis-data` | redis | Sesiones de usuario | Permanente |
| `postgres-data` | postgres | BD de rund-auth | Permanente |

### 9.4 Health Checks

| Servicio | Endpoint | Intervalo | Start period |
|----------|----------|-----------|-------------|
| rund-api | `GET /health` | 30s | 40s |
| rund-mgp | `GET /health` | 30s | 40s |
| rund-ai | `GET /health` | 30s | 60s |
| rund-ocr | `GET /health` | 30s | 90s |
| rund-ollama | `GET /api/tags` | 30s | 120s |
| rund-auth | `GET /healthz` (wget) | 30s | 40s |
| redis | `redis-cli ping` | 10s | — |
| postgres | `pg_isready` | 10s | — |

---

## 10. Autenticación y Seguridad

### 10.1 Flujo de Tokens

```
rund-auth emite JWT RS256
    ↓
rund-api valida JWT con JWTValidator.php (OpenSSL nativo)
    ↓ JWKS cache: 5 minutos TTL
rund-api guarda JWT en sesión PHP del servidor
    ↓
Frontend recibe solo cookie httpOnly (RUND_SESSION)
    ↓ El JWT NUNCA llega al navegador
```

### 10.2 Configuración de Cookies

| Propiedad | Valor desarrollo | Valor producción |
|-----------|----------------|-----------------|
| `httpOnly` | true | true |
| `sameSite` | Lax | Lax |
| `secure` | false | **true** (requiere HTTPS) |
| TTL (inactividad) | 8 horas | 8 horas |

### 10.3 Validación de JWT en PHP

`JWTValidator.php` implementa la validación sin dependencias externas:
1. Descarga JWKS desde `http://rund-auth:8080/.well-known/jwks.json`
2. Cachea las claves 5 minutos en memoria
3. Verifica firma RS256 con `openssl_verify()`
4. Valida claims: `iss = rund-auth`, `aud ∋ rund-api`, `exp > now()`

### 10.4 Seguridad de Servicios Internos

- **rund-ai** y **rund-ocr** NO tienen autenticación propia — confían en que solo rund-api los llama.
- El CORS de rund-ai está abierto (`*`); esto es aceptable mientras los servicios no estén expuestos fuera de la red Docker.
- **Los servicios de IA y OCR no deben exponerse en puertos públicos en producción.**

---

## 11. Gestión de Secretos

| Variable | Servicio | Propósito | Dónde definir |
|----------|---------|-----------|--------------|
| `SESSION_SECRET` | rund-auth | Firma de sesiones Express | `docker-compose.prod.yml` o secrets manager |
| `JWK_PRIVATE_SET_PATH` | rund-auth | Ruta a clave privada RS256 | Variable de entorno + volumen `keys/` |
| `LDAP_BIND_PASSWORD` | rund-auth | Contraseña de cuenta de servicio LDAP | Secrets manager (no en git) |
| `AZURE_CLIENT_SECRET` | rund-auth | Secreto de app Azure AD | Secrets manager (no en git) |
| `DATABASE_URL` | rund-auth | Conexión PostgreSQL | `docker-compose.prod.yml` |
| `POSTGRES_PASSWORD` | postgres | Contraseña de BD | `docker-compose.prod.yml` |
| `REDIS_URL` | rund-auth | Conexión Redis | `docker-compose.prod.yml` |
| `INTERNAL_JWT_ISS` | rund-auth | Issuer del JWT | `docker-compose.prod.yml` |

**Reglas de seguridad de secretos:**
- Nunca commitear archivos `.env` con valores reales.
- Los valores de ejemplo van en `.env.prod.example` (sin secretos reales).
- Las claves RSA (`keys/jwks-private.json`) están en `.gitignore`.
- En producción, usar el secrets manager del servidor o variables de entorno del sistema operativo.

---

## 12. Convenciones de Código

### PHP (rund-api)

- PSR-4 autoloading. Namespaces: `App\Controllers\V2\`, `App\Services\`, etc.
- Un controlador por recurso de dominio.
- Los controladores no tienen lógica de negocio — delegan a servicios.
- Respuestas siempre en JSON: `{ success: bool, data?: any, error?: string }`.
- Errores HTTP: 400 (validación), 401 (no autenticado), 403 (sin permisos), 404, 500.

### TypeScript / Angular (rund-mgp)

- Señales (Signals) para todo estado reactivo global.
- `async/await` en lugar de `.subscribe()` cuando sea posible.
- Interfaces en `compartidos/modelos/` o al lado del componente que las usa.
- No usar `any` — tipado estricto siempre.
- Un servicio por dominio de negocio.

### TypeScript / Node.js (rund-auth)

- Módulos ES2022 (`"module": "ES2022"`).
- Zod para validar todo input externo.
- `async/await` para operaciones asíncronas; nunca callbacks.
- `helmet()` aplicado globalmente al servidor Express.

### Python (rund-ai, rund-ocr)

- Flask Blueprints para separar rutas por dominio.
- Servicios como clases singleton (lazy loading).
- `requirements.txt` con versiones exactas fijadas.
- Logging con `logger.py` — no `print()`.

### Git — Convención de commits

```
tipo(alcance): descripción en español

Tipos: feat | fix | docs | refactor | test | chores | deploy
Ejemplos:
  feat(rund-auth): agregar endpoint de refresh de JWT
  fix(rund-api): corregir validación de cédula con 6 dígitos
  docs(CLAUDE.md): actualizar variables de entorno de producción
```

---

## 13. Roadmap Técnico

> Ver [PRD.md §6](./PRD.md#6-roadmap-de-funcionalidades-futuras) para el contexto de negocio de cada item.

| Feature técnica | Archivos a crear / modificar | Dependencias técnicas |
|----------------|-----------------------------|-----------------------|
| Auth guard en Angular | `src/app/compartidos/guards/auth-guard.ts`, `src/app/compartidos/servicios/auth.interceptor.ts`, `src/app/vistas/login/` | rund-api `/auth/session` funcionando |
| Proteger rutas de rund-api | `rund-api/app/routes_v2.php` — agregar `AuthMiddleware::authenticate()` a grupos `/profesores`, `/certificados`, `/archivos`, `/ai` | JWTValidator.php estable |
| Rate limiting en login | `rund-auth/src/middleware/rateLimiter.ts` + dependencia `express-rate-limit` | Redis disponible |
| HTTPS en producción | Certificado SSL en servidor, `COOKIE_SECURE=true`, `DEV_FAKE_LOGIN=false` | Coordinación con OTIC-ESAP |
| Clasificación auto al subir | `rund-api/src/Controllers/V2/ArchivosController.php` — llamar `/classify` después de `/subir` | rund-ai `/classify` testeado |
| OCR optimizado para cédulas | `rund-ocr/app.py` — templates de regiones por posición | Templates de cédula colombiana definidos |
| Búsqueda semántica en UI | `rund-mgp/src/app/vistas/consultas/` — integrar con `/ai/search` | ChromaDB poblado con índice inicial |
| Audit logging | `rund-auth/src/middleware/auditLogger.ts` + tabla en PostgreSQL | Schema de BD definido |
