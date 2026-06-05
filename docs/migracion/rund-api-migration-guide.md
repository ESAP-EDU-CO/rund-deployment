# rund-api Migration Guide — PHP 8.3 → Node.js

> **Propósito:** Guía completa para que un LLM (Claude Code, Codex, Gemini Code, etc.) pueda
> reescribir `rund-api` de PHP 8.3 a Node.js **sin leer el código fuente PHP original**.
> Todos los contratos de API, flujos críticos, decisiones de arquitectura y gotchas están
> documentados aquí con suficiente detalle para una migración semiautomatizada.
>
> **Fecha de escritura:** 05 jun 2026
> **Versión PHP documentada:** 2.1 (commit `rund-api#13` — último mergeado)

---

## Índice

1. [Alcance de Entrega](#1-alcance-de-entrega)
2. [Arquitectura General](#2-arquitectura-general)
3. [Middleware Chain](#3-middleware-chain)
4. [Catálogo Completo de Endpoints](#4-catálogo-completo-de-endpoints)
   - 4.1 [Sistema (7 endpoints)](#41-sistema-7-endpoints)
   - 4.2 [Autenticación BFF (6 endpoints)](#42-autenticación-bff-6-endpoints)
   - 4.3 [Certificados (3 endpoints)](#43-certificados-3-endpoints)
   - 4.4 [Categorías (2 endpoints)](#44-categorías-2-endpoints)
   - 4.5 [Profesores (4 endpoints)](#45-profesores-4-endpoints)
   - 4.6 [Documentos (3 endpoints)](#46-documentos-3-endpoints)
   - 4.7 [Archivos (8 endpoints)](#47-archivos-8-endpoints)
   - 4.8 [Listados (4 endpoints)](#48-listados-4-endpoints)
   - 4.9 [Firmas (3 endpoints)](#49-firmas-3-endpoints)
   - 4.10 [Inteligencia Artificial (11 endpoints)](#410-inteligencia-artificial-11-endpoints)
   - 4.11 [Extracción de Datos (5 endpoints)](#411-extracción-de-datos-5-endpoints)
   - 4.12 [Administración — Lista Blanca (5 endpoints)](#412-administración--lista-blanca-5-endpoints)
   - 4.13 [Internos — Microservicios (5 endpoints)](#413-internos--microservicios-5-endpoints)
   - 4.14 [URLs Cortas Legacy (3 endpoints)](#414-urls-cortas-legacy-3-endpoints)
5. [Lógica de Negocio Crítica](#5-lógica-de-negocio-crítica)
   - 5.1 [Generación de Certificados](#51-generación-de-certificados)
   - 5.2 [Subida de Documentos a OpenKM](#52-subida-de-documentos-a-openkm)
   - 5.3 [Consulta de Datos de Profesor](#53-consulta-de-datos-de-profesor)
   - 5.4 [Clasificación IA Automática (Webhook)](#54-clasificación-ia-automática-webhook)
   - 5.5 [Scheduler Nocturno](#55-scheduler-nocturno)
6. [Integración con OpenKM](#6-integración-con-openkm)
7. [Integración con rund-auth (BFF)](#7-integración-con-rund-auth-bff)
8. [Integración con rund-ai y rund-ocr](#8-integración-con-rund-ai-y-rund-ocr)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Estructura de Carpetas Recomendada (Node.js)](#10-estructura-de-carpetas-recomendada-nodejs)
11. [Decisiones de Arquitectura (ADRs)](#11-decisiones-de-arquitectura-adrs)
12. [Gotchas y Casos Especiales](#12-gotchas-y-casos-especiales)
13. [Checklist de Verificación Post-Migración](#13-checklist-de-verificación-post-migración)

---

## 1. Alcance de Entrega

| Componente | Entrega | Acción OTIC |
|------------|---------|-------------|
| `rund-api` (este documento) | **Código fuente PHP** | Reescribir en Node.js manteniendo contratos de API |
| `rund-mgp` | **Código fuente Angular** | Reescribir en framework propio |
| `rund-ai` | Imagen Docker (build desde Dockerfile) | Integrar como microservicio, sin reescribir |
| `rund-ocr` | Imagen Docker (build desde Dockerfile) | Integrar como microservicio, sin reescribir |
| `rund-core` (OpenKM) | Imagen Docker oficial | Integrar como repositorio documental, sin modificar |
| `rund-auth` | Imagen Docker (build desde Dockerfile) | Integrar como microservicio, sin reescribir |

**Contratos que deben preservarse exactamente:**
- Todas las rutas `/api/v2/*` con los mismos métodos HTTP
- Formato de respuesta JSON: `{ "success": true, "data": {...} }` para éxito, `{ "error": "..." }` para error
- El sistema de sesiones BFF (cookie httpOnly `RUND_SESSION`) — el frontend Angular existente depende de esto
- El webhook `POST /api/v2/ai/webhook/extraction-complete` — rund-ai llama a este endpoint

---

## 2. Arquitectura General

```
Cliente (rund-mgp Angular)
        │ HTTP con cookies
        ▼
┌─────────────────────────────────────────────┐
│              rund-api (Node.js)              │
│                                             │
│  Routes → Middleware → Controllers          │
│                  │                          │
│         ┌────────┼────────────┐             │
│         ▼        ▼            ▼             │
│    rund-auth  OpenKM API   rund-ai          │
│    (LDAP+JWT) (Java REST) (Python Flask)    │
└─────────────────────────────────────────────┘
```

**Patrón en capas (PHP → Node.js equivalente):**

| Capa PHP | Equivalente Node.js |
|----------|---------------------|
| `index.php` + `bootstrap.php` | `server.ts` / `app.ts` |
| `routes_v2.php` | `routes/` con Express Router |
| `Controllers/V2/*.php` | `controllers/*.ts` |
| `Handlers/*.php` | Parte de controllers o servicios |
| `Services/*.php` | `services/*.ts` |
| `Core/OpenKM.php` | `services/openkm.service.ts` |
| `Core/Router.php` | Express.js |
| `Middleware/*.php` | Express middleware |
| `Config/Config.php` | Variables de entorno (`process.env`) |

**Respuesta estándar (mantener este formato exacto):**
```typescript
// Éxito
{ success: true, data: { ... }, message?: string }

// Error
{ error: "Descripción del error" }
// O con campos adicionales:
{ error: "Parámetros requeridos faltantes: campo1, campo2", missing: ["campo1"], required: ["campo1","campo2"] }
```

**Código HTTP de éxito:** siempre 200 (incluso para operaciones que típicamente usarían 201/204).
El cliente PHP original siempre espera 200.

---

## 3. Middleware Chain

### 3.1 Orden de ejecución (replicar exactamente)

```
Request
  │
  ├─► CORS (siempre primero, antes de cualquier auth)
  │     OPTIONS → responde 200 inmediatamente, sin procesar más
  │
  ├─► Global Auth Check (para rutas NO públicas)
  │     Rutas públicas (no requieren sesión):
  │       /api/v2/auth/*
  │       /api/v2/system/*
  │       /api/v2/archivos/imagenes/*
  │       /api/v2/internos/*
  │       /api/v2/ai/webhook/*
  │
  ├─► Route-specific middleware (por ruta):
  │     ValidationMiddleware.requireFiles(['campo'])
  │     ValidationMiddleware.validateFileSize(50MB)
  │     AuthMiddleware.requireRole('admin')
  │     AuthMiddleware.internalOnly()
  │
  └─► Controller
```

### 3.2 CORS

**Configuración actual (permisiva — red interna):**
```typescript
// Permite cualquier origen con credentials
// En producción la OTIC debería restringir con lista blanca
app.use(cors({
  origin: (origin, cb) => cb(null, origin || '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: true,
  maxAge: 86400
}));
```

### 3.3 Auth Check Global

La validación de sesión se hace en un middleware global que:
1. Lee la cookie `RUND_SESSION`
2. Valida que exista en la sesión del servidor
3. Verifica que el JWT almacenado en sesión no haya expirado
4. Si inválido → 401 `{ "error": "No autenticado" }`

```typescript
// Sesión: usar express-session + Redis o equivalente
// Nombre de cookie: RUND_SESSION
// httpOnly: true, sameSite: 'lax', secure: false (dev) / true (prod HTTPS)
// TTL inactividad: 28800 segundos (8 horas)
```

### 3.4 Validación de archivos (multipart)

Para endpoints que reciben archivos:
- Campo requerido: si falta → 400
- Tamaño máximo: si supera 50MB → 413

```typescript
// Usar multer en Node.js
// memStorage o diskStorage según el endpoint
```

### 3.5 internalOnly()

Algunos endpoints solo deben ser accesibles desde la red interna Docker:
- Verifica que el request venga de IP `172.x.x.x` o `10.x.x.x` o `127.x.x.x`
- Si viene de IP externa → 403 `{ "error": "Acceso solo desde red interna" }`

---

## 4. Catálogo Completo de Endpoints

**Base URL:** `http://rund-api:3000` (interno) · `http://localhost:3000` (dev)

---

### 4.1 Sistema (7 endpoints)

Todos públicos. Respuestas estáticas o información del sistema.

#### GET /api/v2/system/info
Información del sistema.
```json
// Respuesta 200
{
  "success": true,
  "data": {
    "version": "2.0",
    "nombre": "RUND API v2",
    "endpoints": {
      "certificados": "/api/v2/certificados",
      "categorias": "/api/v2/categorias",
      "profesores": "/api/v2/profesores",
      "documentos": "/api/v2/documentos",
      "archivos": "/api/v2/archivos",
      "listados": "/api/v2/listados",
      "firmas": "/api/v2/firmas",
      "ai": "/api/v2/ai"
    }
  }
}
```

#### GET /api/v2/system/health
Health check — verifica conectividad con OpenKM y servicios.
```json
// 200
{ "success": true, "data": { "status": "healthy", "version": "2.0", "services": { "database": "connected", "storage": "available", "ai": "operational" } } }
```

#### GET /api/v2/system/capabilities
Lista de capacidades del sistema (respuesta estática).

#### GET /api/v2/system/migration
Estado de la migración v1→v2 (respuesta estática — indica 100% completado).

#### GET /api/v2/system/deprecation
Estado de endpoints deprecados (respuesta estática — v1 removida).

#### GET /api/v2/system/docs
Especificación OpenAPI 3.0 en JSON. Puede retornar una spec estática actualizada.

#### GET /api/v2/system/swagger-ui
Interfaz HTML de Swagger UI. Retorna el contenido del archivo `static/swagger-ui.html`.
- 404 si el archivo no existe.

---

### 4.2 Autenticación BFF (6 endpoints)

rund-api actúa como **BFF (Backend-for-Frontend)**: el frontend nunca ve el JWT. El JWT se guarda en la sesión del servidor PHP (equivalente Node.js: `req.session.internal_jwt`).

Ver sección [§7 Integración con rund-auth](#7-integración-con-rund-auth-bff) para el flujo completo.

#### POST /api/v2/auth/login
Autentica usuario con LDAP.

**Request body (JSON):**
```json
{ "username": "juan.perez", "password": "contraseña123" }
```

**Headers opcionales:**
```
X-App-Id: rund-mgp  (para scoping de roles en lista blanca)
```

**Flujo interno:**
1. Validar `username` y `password` requeridos
2. `POST http://rund-auth:8080/ldap/login { username, password }` → recibe `{ user, jwt }`
3. Enriquecer `user.roles` consultando `WhitelistService.getRolesForUser(email, appId)`
4. Guardar en sesión: `req.session.internal_jwt = jwt`, `req.session.user = user`
5. Regenerar session ID (seguridad)
6. Retornar usuario (sin JWT)

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "sub": "juan.perez",
      "email": "juan.perez@esap.edu.co",
      "displayName": "Juan Pérez",
      "roles": ["gestor"]
    },
    "session_id": "abc123xyz"
  },
  "message": "Autenticación exitosa"
}
```

**Errores:**
- `400`: Falta `username` o `password`
- `401`: Credenciales inválidas (error de rund-auth)

```bash
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"juan.perez","password":"miClave123"}'
```

---

#### GET /api/v2/auth/session
Verifica sesión activa y retorna datos del usuario. **Requiere autenticación.**

**Flujo interno:**
1. Verificar que `req.session.user` exista
2. Verificar que no haya expirado por inactividad (> 8 horas desde `last_activity`)
3. Verificar si el JWT está próximo a expirar (< 5 minutos → `should_refresh: true`)
4. Actualizar `last_activity`

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "user": { "sub": "juan.perez", "email": "juan.perez@esap.edu.co", "roles": ["gestor"] },
    "session_id": "abc123xyz",
    "should_refresh": false,
    "last_activity": 1717632000
  }
}
```

**Errores:**
- `401`: No hay sesión activa o expiró por inactividad

```bash
curl -X GET http://localhost:3000/api/v2/auth/session \
  -b cookies.txt
```

---

#### POST /api/v2/auth/logout
Cierra la sesión.

**Flujo:**
1. Intentar `POST http://rund-auth:8080/logout` con la cookie `connect.sid` de rund-auth (best effort — puede fallar silenciosamente)
2. Limpiar `req.session` completamente
3. Borrar la cookie `RUND_SESSION`
4. Destruir la sesión

**Respuesta 200:**
```json
{ "success": true, "data": {}, "message": "Sesión cerrada exitosamente" }
```

---

#### POST /api/v2/auth/refresh
Refresca el JWT antes de su expiración. **Requiere sesión activa.**

**Flujo:**
1. Verificar que `req.session.user` exista
2. Enviar `POST http://rund-auth:8080/refresh` con cookie `connect.sid` de rund-auth
3. Actualizar `req.session.internal_jwt` con el nuevo JWT

**Respuesta 200:**
```json
{ "success": true, "data": {}, "message": "JWT refrescado exitosamente" }
```

**Errores:**
- `401`: No hay sesión activa
- `500`: rund-auth no pudo refrescar

---

#### GET /api/v2/auth/health
Health check del sistema de autenticación. **Público.**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "rund-auth": "healthy",
      "session": "healthy"
    }
  }
}
```

---

#### POST /api/v2/auth/dev/login
**Solo disponible con `DEV_FAKE_LOGIN=true`. NUNCA en producción.**

**Request body (JSON):**
```json
{ "email": "test@esap.edu.co" }
```

**Flujo:**
1. Verificar `DEV_FAKE_LOGIN === 'true'` en env — si no, retornar 404
2. `POST http://rund-auth:8080/dev/login { email }` → recibe `{ user, jwt }`
3. Mismo flujo de sesión que login normal

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "user": { "email": "test@esap.edu.co", "roles": ["admin"] },
    "session_id": "abc123",
    "warning": "DEV MODE - NO usar en producción"
  }
}
```

---

### 4.3 Certificados (3 endpoints)

Los certificados se generan a partir de plantillas Word (.docx) almacenadas en OpenKM y se pueden exportar como DOCX o PDF (vía LibreOffice). **Requieren autenticación.**

#### GET /api/v2/certificados/plantillas
Lista las plantillas disponibles (respuesta estática).

```json
{
  "success": true,
  "data": {
    "plantillas": [
      { "id": "1050", "nombre": "Certificación de categorización y evaluación", "formatos": ["docx", "pdf"] },
      { "id": "1051", "nombre": "Certificación de vinculación", "formatos": ["docx", "pdf"] },
      { "id": "1231", "nombre": "Certificación de puntos por bonificación", "formatos": ["docx", "pdf"] }
    ]
  }
}
```

#### GET /api/v2/certificados/{id}
Obtiene información de un certificado previamente generado.

**Path:** `id` = ID del certificado (ej: `CERT-20251020-ABC123`)

**Flujo:**
1. Buscar `expedidos.json` en OpenKM → `/okm:root/RUND/DOCUMENTOS/CERTIFICADOS/`
2. Parsear el JSON y buscar el registro con ese `id`
3. Si no existe → 404

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "certificado": {
      "id": "CERT-20251020-ABC123",
      "plantilla": "1050",
      "data": { "cedula": "1234567890", "nombre": "Juan Pérez" },
      "fecha_generacion": "2025-10-20T14:30:00Z"
    }
  }
}
```

**Errores:**
- `400`: ID requerido
- `404`: Certificado no encontrado

```bash
curl -X GET http://localhost:3000/api/v2/certificados/CERT-20251020-ABC123 -b cookies.txt
```

#### POST /api/v2/certificados/generar
**El endpoint más complejo del sistema.** Genera un certificado desde una plantilla Word.

Ver sección [§5.1 Generación de Certificados](#51-generación-de-certificados) para el flujo completo.

**Request body (JSON o form-data):**
```json
{
  "plantilla": "1050",
  "formato": "pdf",
  "id": "OPCION_ID_PERSONALIZADO",
  "data": "[{\"tipo\":\"parrafo\",\"value\":\"<strong>ESAP</strong> certifica que:\"},{\"tipo\":\"firma\",\"value\":{\"uuid\":\"firma-uuid\",\"nombre\":\"María López\",\"cargo\":\"Directora\"}}]"
}
```

**Campos:**
- `plantilla` (string, requerido): ID de plantilla ("1050", "1051", "1231")
- `formato` (string, opcional): "docx" o "pdf" (default: "docx")
- `id` (string, opcional): Si se provee, evita regenerar si ya existe
- `data` (string JSON, requerido): Array de bloques — ver estructura en §5.1

**Respuesta:** Archivo binario (no JSON).
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="1050.pdf"
[binary content]
```

**Errores:**
- `400`: Datos o plantilla faltantes
- `404`: Plantilla no encontrada en OpenKM
- `500`: Error LibreOffice / procesamiento

```bash
curl -X POST http://localhost:3000/api/v2/certificados/generar \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"plantilla":"1050","formato":"pdf","data":"[{\"tipo\":\"parrafo\",\"value\":\"Texto del certificado\"}]"}' \
  --output certificado.pdf
```

---

### 4.4 Categorías (2 endpoints)

Operan sobre las categorías de OpenKM que clasifican documentos. **Requieren autenticación.**

#### GET /api/v2/categorias/arbol
Obtiene el árbol jerárquico de categorías desde OpenKM.

**Flujo:**
1. `GET /OpenKM/services/rest/repository/getCategoriesFolder` → lista raíz de categorías
2. Para cada carpeta, `GET /OpenKM/services/rest/folder/getChildren?fldId={path}` recursivamente
3. Construir árbol con `{ uuid, label, path, children }`

```json
{
  "success": true,
  "data": {
    "arbol": [
      { "uuid": "abc-123", "label": "Formación Académica", "path": "/okm:categories/RUND/FORMACION_ACADEMICA", "children": [...] }
    ],
    "total_categorias": 45
  }
}
```

#### GET /api/v2/categorias/cruce/{x}/{y}
Cruce matricial entre dos categorías (para reportes demográficos).

**Path:** `x` = UUID categoría columnas, `y` = UUID categoría filas

**Flujo:**
1. Obtener documentos de categoría X → lista de documentos por subcategoría
2. Obtener documentos de categoría Y → ídem
3. Calcular intersecciones (documentos que pertenecen a ambas)
4. Construir matriz de conteos

```json
{
  "success": true,
  "data": {
    "cruce": {
      "nomCol": "Formación Académica",
      "nomFil": "Experiencia Docente",
      "cols": ["Pregrado", "Maestría", "Doctorado"],
      "filas": [
        { "label": "0-5 años", "data": [12, 8, 3] },
        { "label": "6-10 años", "data": [5, 20, 8] }
      ]
    }
  }
}
```

---

### 4.5 Profesores (4 endpoints)

Consultas sobre documentos y datos demográficos de profesores en OpenKM. **Requieren autenticación.**

#### GET /api/v2/profesores/{cedula}
Información completa: archivos + datos demográficos.

**Validación:** cédula debe cumplir `/^\d{4,20}$/`

**Flujo:** Ver §5.3 — incluye dos búsquedas en OpenKM.

```json
{
  "success": true,
  "data": {
    "profesor": {
      "archivosProfesor": [
        { "uuid": "file-uuid-123", "nombre": "Diploma_Pregrado.pdf", "path": "/okm:root/...", "categorias": [["TIPO","DIPLOMA"],["FORMATO","PDF"]] }
      ],
      "datosDemograficos": {
        "Género": ["Masculino"],
        "Edad": ["30 a 40 años"],
        "Programas": { "Maestría": ["Administración Pública"] }
      }
    },
    "cedula": "1234567890",
    "meta": { "total_archivos": 15, "incluye_demografia": true }
  }
}
```

#### GET /api/v2/profesores/{cedula}/archivos
Solo los archivos del profesor (sin datos demográficos), con estadísticas por tipo/formato/origen.

```json
{
  "success": true,
  "data": {
    "archivos": [...],
    "cedula": "1234567890",
    "estadisticas": {
      "por_tipo": { "DIPLOMA": 5, "CERTIFICADO": 8 },
      "por_formato": { "PDF": 12, "DOCX": 3 },
      "por_origen": { "ONEDRIVE": 10, "LOCAL": 5 }
    }
  }
}
```

#### GET /api/v2/profesores/{cedula}/demografia
Solo los datos demográficos del profesor (categorías de OpenKM mapeadas a labels legibles).

#### GET /api/v2/profesores/{cedula}/{nombre_archivo}
Busca un archivo por nombre dentro de la carpeta del profesor y retorna su UUID.

**Path:**
- `cedula`: cédula del profesor (validación `/^\d{4,20}$/`)
- `nombre_archivo`: nombre completo del archivo con extensión (URL-encoded si tiene espacios)

**Flujo:**
1. Construir ruta base: `/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/{cedula}/`
2. Búsqueda recursiva en OpenKM por nombre de archivo
3. Obtener propiedades del archivo encontrado

```json
{
  "success": true,
  "uuid": "16acbc5c-4d9d-4152-a39a-9783a1536943",
  "nombre_archivo": "1990_1_ESAP.pdf",
  "cedula": "4080160",
  "propiedades": {
    "path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/4080160/EXPERIENCIA_INVESTIGATIVA/1990_1_ESAP.pdf",
    "mimeType": "application/pdf",
    "size": 36868,
    "created": "2025-11-20T12:18:15.792-05:00",
    "lastModified": "2025-11-20T12:18:15.792-05:00"
  }
}
```

**Errores:**
- `400`: Cédula o nombre de archivo faltante / cédula inválida
- `404`: Archivo no encontrado

```bash
curl http://localhost:3000/api/v2/profesores/4080160/1990_1_ESAP.pdf -b cookies.txt
curl "http://localhost:3000/api/v2/profesores/4080160/Diploma%20Maestr%C3%ADa.pdf" -b cookies.txt
```

⚠️ **Gotcha:** La búsqueda es case-sensitive. Si hay múltiples archivos con el mismo nombre, retorna el primero encontrado.

---

### 4.6 Documentos (3 endpoints)

Generación y exportación de documentos. **Requieren autenticación.**

#### GET /api/v2/documentos/plantillas
Lista de plantillas disponibles (respuesta estática — mismas que certificados + reportes).

#### POST /api/v2/documentos/generar
Genera un documento según `tipo`:
- `tipo: "certificado"` → delega a la lógica de `/certificados/generar`
- `tipo: "reporte"` → genera Excel con `data`
- `tipo: "consulta"` → igual a reporte

**Request:**
```json
{
  "tipo": "reporte",
  "formato": "xlsx",
  "data": "{\"cols\":[\"Enero\",\"Febrero\"],\"filas\":[[100,200]],\"nomCol\":\"Meses\",\"nomFil\":\"Ventas\"}"
}
```

**Respuesta:** Archivo binario (xlsx o pdf).

#### POST /api/v2/documentos/exportar
Exporta datos tabulares como Excel o PDF.

**Request:**
```json
{
  "tipo": "xlsx",
  "data": "{\"cols\":[\"Q1\",\"Q2\"],\"filas\":[[100,200]],\"nomCol\":\"Trimestres\",\"nomFil\":\"Ingresos\"}"
}
```

**Respuesta:** Archivo binario.

**Lógica de reportes Excel:** La estructura `data` contiene:
- `cols`: array de strings con nombres de columnas
- `filas`: array de arrays con los valores
- `nomCol`: label del eje de columnas
- `nomFil`: label del eje de filas

Usar `exceljs` o `xlsx` en Node.js para generar el archivo. Para PDF, convertir el Excel con LibreOffice (comando headless):
```bash
libreoffice --headless --convert-to pdf --outdir /tmp reporte.xlsx
```

---

### 4.7 Archivos (8 endpoints)

CRUD de archivos en OpenKM. **Requieren autenticación** salvo `/imagenes/*`.

#### POST /api/v2/archivos/subir
Sube un archivo a OpenKM. Es el endpoint de carga principal del sistema.

**Multipart fields:**
- `archivo` (File, requerido): el archivo a subir (max 50MB)
- `accion` (string, requerido): `"cargaDocumento"` o `"cargaFirma"`
- `propiedades` (string JSON, requerido): array de `{ label, valor }`

**Para `cargaDocumento`:**
```json
// propiedades:
[
  { "label": "cedula", "valor": "1234567890" },
  { "label": "taxonomia", "valor": "ACADEMICOS/DIPLOMAS" },
  { "label": "tipo", "valor": "DIPLOMA" },
  { "label": "formato", "valor": "PDF" },
  { "label": "origen", "valor": "ONEDRIVE" },
  { "label": "esCedula", "valor": false },
  { "label": "categorias", "valor": ["FORMACION_ACADEMICA/PREGRADO"] }
]
```

**Para `cargaFirma`:**
```json
[
  { "label": "cargo", "valor": "Director Académico" },
  { "label": "nombres", "valor": "Carlos Andrés" },
  { "label": "apellidos", "valor": "Rodríguez Pérez" },
  { "label": "fecha", "valor": "2025-10-20" }
]
```

**Flujo `cargaDocumento`:**
1. Parsear propiedades: `html_entity_decode` → `JSON.parse`
2. Validar cédula (`/^\d{4,20}$/`)
3. Construir ruta de taxonomía: `/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/{cedula}/{taxonomia}/`
4. Crear carpetas en OpenKM si no existen (recursivamente)
5. Crear carpetas de categorías en OpenKM si no existen
6. Subir archivo a OpenKM (si ya existe → nueva versión via checkout/checkin)
7. Obtener UUID del archivo subido
8. Asignar categorías al archivo (`document/setProperties`)
9. Si `esCedula: true` → asignar también categorías demográficas de `categorias[]`

**Flujo `cargaFirma`:**
1. Subir PNG a `/okm:root/RUND/DOCUMENTOS/FIRMAS/`
2. Crear JSON side-car con los metadatos (mismo nombre con extensión `.json`)
3. Asignar categorías a ambos archivos

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "archivo": {
      "carga": { "uuid": "uploaded-file-uuid", "path": "/okm:root/..." },
      "creaTaxonomia": "OK",
      "creaCategorias": "OK",
      "setProperties": "OK"
    },
    "meta": { "accion": "cargaDocumento", "nombre_original": "diploma.pdf", "tamaño": 245678 }
  }
}
```

⚠️ **Gotcha crítico:** Las `propiedades` llegan con entidades HTML del frontend Angular (`&quot;` etc.). Siempre hacer `html_entity_decode` antes del `JSON.parse` en Node.js: usar `he.decode()` de la librería `he`.

```bash
curl -X POST http://localhost:3000/api/v2/archivos/subir \
  -b cookies.txt \
  -F "archivo=@diploma.pdf" \
  -F "accion=cargaDocumento" \
  -F 'propiedades=[{"label":"cedula","valor":"1234567890"},{"label":"taxonomia","valor":"ACADEMICOS/DIPLOMAS"},{"label":"tipo","valor":"DIPLOMA"},{"label":"formato","valor":"PDF"},{"label":"origen","valor":"LOCAL"},{"label":"esCedula","valor":false}]'
```

---

#### GET /api/v2/archivos/datos/{nombre}
Obtiene el contenido de un archivo JSON por nombre (sin extensión).

**Ruta en OpenKM:** `/okm:root/RUND/CONFIG/DATA/{nombre}.json`

```json
{ "success": true, "data": { "datos": { ... contenido del JSON ... }, "nombre": "expedidos" } }
```

**Errores:** `400` nombre requerido, `404` no encontrado.

---

#### GET /api/v2/archivos/imagenes/{nombre}
Sirve una imagen directamente desde OpenKM. **Público** (no requiere autenticación — se usa en el login).

**Query params opcionales:**
- `ruta`: subcarpeta bajo `DOCUMENTOS/` (ej: `PLANTILLAS/CERTIFICADOS`)

**Ruta por defecto para imágenes de configuración:**
- `logoESAP.svg` → `/okm:root/RUND/CONFIG/IMAGENES/logoESAP.svg`
- `logoRUND.png` → `/okm:root/RUND/CONFIG/IMAGENES/logoRUND.png`

**Respuesta:** Contenido binario con `Content-Type` correcto.

⚠️ Las firmas **no** se sirven por este endpoint — usar `/api/v2/firmas/{uuid}`.

---

#### GET /api/v2/archivos/{uuid}
Descarga un archivo por UUID desde OpenKM. Retorna binario inline.

**Respuesta:**
```
Content-Type: application/pdf (auto-detectado desde OpenKM)
Content-Length: 2048576
Content-Disposition: inline; filename="documento.pdf"
Cache-Control: private, max-age=3600
ETag: "md5hash"
```

Soporta `If-None-Match` → retorna 304 si el ETag coincide.

---

#### POST /api/v2/archivos/{uuid}/actualizar
Reemplaza el contenido de un archivo existente (nueva versión en OpenKM via checkout/checkin).

**⚠️ Se usa POST, no PUT, porque PHP no soporta `$_FILES` con PUT. Mantener POST en Node.js también para compatibilidad con el frontend.**

**Multipart fields:**
- `file` (File, requerido): nuevo contenido
- `nombre_archivo` (string, requerido): nombre del archivo original
- `comment` (string, opcional): comentario de versión (default: `"Actualización YYYY-MM-DD HH:MM:SS"`)

**Flujo:**
1. Obtener propiedades actuales del documento (`document/getProperties`)
2. `document/checkout` → bloquear para edición
3. Subir nuevo contenido (`document/checkin`) con el comentario
4. Obtener propiedades actualizadas

**Respuesta 200:**
```json
{
  "success": true,
  "uuid": "16acbc5c-...",
  "nombre_archivo": "1990_1_ESAP.pdf",
  "version": "1.2",
  "propiedades": { "path": "...", "mimeType": "application/pdf", "size": 2048576 }
}
```

---

#### DELETE /api/v2/archivos/{uuid}
Elimina un archivo de OpenKM.

```json
{ "success": true, "data": { "eliminado": true, "uuid": "abc-123-def-456" } }
```

---

#### DELETE /api/v2/archivos/temp/limpiar
Borra archivos temporales del servidor (`reporte.xlsx`, `reporte.pdf`).

```json
{ "success": true, "data": { "limpieza": { "borrados": ["reporte.xlsx"], "aBorrar": ["reporte.xlsx","reporte.pdf"] } } }
```

---

#### DELETE /api/v2/archivos/papelera
Vacía la papelera de reciclaje de OpenKM.

```bash
# Llama a OpenKM: DELETE /OpenKM/services/rest/repository/purgeTrash
```

```json
{ "success": true, "data": { "resultado": { "status": "purged" }, "mensaje": "Papelera vaciada" } }
```

---

### 4.8 Listados (4 endpoints)

Gestión de listados Excel/CSV de profesores. **Requieren autenticación.**

#### POST /api/v2/listados/cargar
Sube un listado Excel o CSV a OpenKM, lo categoriza y lo indexa.

**Multipart fields:**
- `archivo` (File): archivo Excel/CSV (acción `"cargar"`)
- `accion` (string, requerido): `"cargar"` o `"duplicado"`
- `propiedades` (string JSON, requerido)

**Propiedades para `cargar`:**
```json
[
  { "label": "Nombre", "valor": "listado_profesores_2025.xlsx" },
  { "label": "Tipo", "valor": "Administración" },
  { "label": "Origen", "valor": "OneDrive" },
  { "label": "Formato", "valor": "Excel" },
  { "label": "Size", "valor": 204800 },
  { "label": "Duplicado", "valor": false }
]
```

Para `accion: "duplicado"` — verifica si ya existe el archivo, no requiere `archivo` adjunto.

**Ruta de destino en OpenKM:** `/okm:root/RUND/DOCUMENTOS/LISTADOS/{TIPO}/`

---

#### GET /api/v2/listados/datos
Obtiene datos de un listado procesado o verifica duplicados.

**Query params:**
- `accion=duplicado&propiedades=JSON-URL-encoded`: verifica si existe
- `categoria=LISTADOS&tipo=PROFESORES&nombre=datos_2025&extension=.csv`: obtiene CSV

---

#### GET /api/v2/listados/csv
Obtiene datos CSV con estructura tabular (arrayCSV, columnasCSV, rawCSV).

**Query params:** `categoria`, `tipo`, `nombre`, `extension` (todos requeridos)

---

#### GET /api/v2/listados/indice
Retorna el índice de listados almacenados.

---

### 4.9 Firmas (3 endpoints)

Gestión de firmas digitalizadas para uso en certificados. **Requieren autenticación.**

Las firmas se almacenan en `/okm:root/RUND/DOCUMENTOS/FIRMAS/` como pares `firma_nombre.png` + `firma_nombre.json`.

#### GET /api/v2/firmas/lista
Lista todas las firmas disponibles con sus metadatos.

**Flujo:**
1. `search/find` en `/okm:root/RUND/DOCUMENTOS/FIRMAS/` buscando archivos `.json`
2. Descargar cada JSON side-car
3. Construir lista con datos de cada firma

```json
{
  "success": true,
  "data": {
    "firmas": [
      {
        "uuid": "uuid-del-png",
        "nombre": "firma_director_academico.png",
        "cargo": "Director Académico",
        "nombres": "Carlos Andrés",
        "apellidos": "Rodríguez Pérez",
        "fecha": "2025-10-20"
      }
    ]
  }
}
```

#### GET /api/v2/firmas/{uuid}
Descarga la imagen de la firma (PNG). Retorna binario con `Content-Type: image/png`.

#### POST /api/v2/firmas/subir
Sube una nueva firma. Usa el mismo flujo que `POST /archivos/subir` con `accion: "cargaFirma"`.
Requiere multipart: `archivo` (PNG), `propiedades` (cargo, nombres, apellidos, fecha).

---

### 4.10 Inteligencia Artificial (11 endpoints)

Operaciones con rund-ai (extracción, cola, scheduler). **La mayoría requieren autenticación**, excepto el webhook.

#### POST /api/v2/ai/extraer
Envía un documento directamente a rund-ai para extracción. Uso puntual (no via cola).

**Multipart fields:**
- `documento` (File, requerido, max 50MB)
- `accion` (string): acción de extracción
- `tipoDocumento` (string): tipo del documento

**Flujo:**
1. Reenviar el archivo a `rund-ai:8001` via HTTP multipart
2. Retornar el resultado de rund-ai

---

#### POST /api/v2/ai/webhook/extraction-complete
**Público — rund-ai llama a este endpoint cuando termina una extracción.** No requiere sesión.

**Request body (JSON):**
```json
{
  "document_id": "uuid-del-documento-en-openkm",
  "status": "completed",
  "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
  "extracted_data": { ... },
  "ia_classification": {
    "type": "cedula",
    "confidence": 0.92
  },
  "error_message": null
}
```

**Campos opcionales importantes:**
- `ia_classification`: presente cuando rund-ai clasificó el documento automáticamente
- `ia_classification.confidence` ≥ 0.8 → aplicar categoría `IA_CLASIFICADO/{TIPO}` en OpenKM

**Flujo crítico:**
1. Validar `document_id` y `status` requeridos
2. Si `status === 'completed'` Y `ia_classification.confidence >= 0.8`:
   - Normalizar tipo: `strtoupper(str_replace([' ','-'], '_', type))` → ej: `"cedula"` → `"CEDULA"`
   - Construir ruta de categoría: `CTGR_DOCS_HOJAS + 'IA_CLASIFICADO/' + tipo_norm`
3. Llamar a `AIHandlers.procesarCallbackExtraccion(postData, extraCategorias)`
   - Esto obtiene el UUID del documento via `POST /internos/documentos/obtener-uuid`
   - Aplica las categorías extra en OpenKM (`document/setProperties`)
4. Retornar confirmación

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "message": "Callback procesado correctamente",
    "document_id": "...",
    "status": "completed",
    "ia_clasificado": true,
    "processed": { "openkm_updated": true }
  }
}
```

⚠️ **Crítico:** Si `ia_classification` es `null` o `confidence < 0.8`, el documento se procesa igualmente pero sin la categoría IA. No es un error.

```bash
curl -X POST http://localhost:3000/api/v2/ai/webhook/extraction-complete \
  -H "Content-Type: application/json" \
  -d '{"document_id":"uuid-123","status":"completed","ia_classification":{"type":"cedula","confidence":0.92}}'
```

---

#### POST /api/v2/ai/retry-error-jobs
Re-encola documentos en estado "error" → "pendiente". Proxy a rund-ai.

**Flujo:** `POST http://rund-ai:8001/retry-error-jobs` (timeout: 90s por lock de workers)

```json
{ "success": true, "data": { "retried": 5 } }
```

---

#### POST /api/v2/ai/reset-stuck-jobs
Resetea documentos bloqueados en "procesando" → "pendiente". Proxy a rund-ai.

**Flujo:** `POST http://rund-ai:8001/reset-stuck-jobs` (timeout: 90s)

```json
{ "success": true, "data": { "resetted": 3 } }
```

---

#### GET /api/v2/ai/scheduler/status
Estado del scheduler nocturno. Lee `scheduler_state.json`.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "habilitado": true,
      "hora_inicio": 22,
      "hora_fin": 6,
      "ultimo_run": "2026-06-05T06:00:00",
      "ultimo_resultado": { "encolados": 120 },
      "actualizado_en": "2026-06-05T06:00:01"
    }
  }
}
```

---

#### POST /api/v2/ai/scheduler/start
Habilita el scheduler. Actualiza `scheduler_state.json`: `habilitado: true`.

#### POST /api/v2/ai/scheduler/pause
Pausa el scheduler. Actualiza `scheduler_state.json`: `habilitado: false`.

#### POST /api/v2/ai/scheduler/config
Configura el rango horario. Body: `{ "hora_inicio": 22, "hora_fin": 6 }`. Ambos 0-23.

**Nota sobre `scheduler_state.json`:** El PHP lo almacena en `/var/www/html/cli/scheduler_state.json`. En Node.js, usar una ruta configurable via env var `SCHEDULER_STATE_FILE`. El crontab lee el mismo archivo para saber si está habilitado.

```json
// Estructura del scheduler_state.json
{
  "habilitado": true,
  "hora_inicio": 22,
  "hora_fin": 6,
  "ultimo_run": null,
  "ultimo_resultado": null,
  "actualizado_en": "2026-06-05T00:00:00"
}
```

---

#### GET /api/v2/ai/extraction/statistics
Estadísticas generales del índice de extracción. Proxy a rund-ai.

**Flujo:** `GET http://rund-ai:8001/extraction/statistics` (timeout: 10s)

---

#### GET /api/v2/ai/extraction/professor/{cedula}
Documentos de un profesor específico del índice. Proxy a rund-ai.

**Flujo:** `GET http://rund-ai:8001/extraction/professor/{cedula}` (timeout: 10s)

---

#### GET /api/v2/ai/queue/stats
Estadísticas de la cola de procesamiento. Proxy a rund-ai.

**Flujo:** `GET http://rund-ai:8001/queue/stats` (timeout: 10s)

---

### 4.11 Extracción de Datos (5 endpoints)

Consulta paginada del índice de extracción. **Requieren autenticación.**

#### GET /api/v2/extraccion/stats
Estadísticas resumen del índice (proxy y transformación de rund-ai).

**Flujo:** Llama a `rund-ai:8001/extraction/statistics` y transforma la respuesta:
```json
{
  "success": true,
  "data": {
    "total_documentos": 150,
    "total_profesores": 45,
    "por_estado": { "completado": 120, "pendiente": 20, "procesando": 5, "error": 5 },
    "por_categoria": { "cedula": 45, "certificado_laboral": 60 },
    "tasa_exito": 80,
    "ultima_actualizacion": "2026-06-05T10:30:00"
  }
}
```

---

#### GET /api/v2/extraccion/buscar
Búsqueda semántica de documentos. Proxy a rund-ai.

**Query params:**
- `q` (string, requerido): consulta de búsqueda
- `limit` (int, opcional): máximo de resultados (default: 10, max: 50)

**Flujo:** `POST http://rund-ai:8001/search { query, limit }` (timeout: 15s)

```json
{
  "success": true,
  "data": {
    "query": "diploma maestría administración",
    "results": [
      { "document_id": "uuid", "nombre": "diploma.pdf", "tipo": "certificado_academico", "similarity": 0.85, "cedula": "1234567890" }
    ],
    "total": 5
  }
}
```

---

#### POST /api/v2/extraccion/validar/{cedula}
Valida la consistencia documental de un profesor. Proxy a rund-ai.

**Flujo:** `POST http://rund-ai:8001/validate { cedula }` (timeout: 15s)

```json
{
  "success": true,
  "data": {
    "cedula": "1234567890",
    "issues": [
      { "tipo": "nombre_inconsistente", "severidad": "warning", "descripcion": "Nombre en cédula: 'Juan Perez', en certificado: 'Juan Pérez García'" }
    ],
    "score": 85,
    "resumen": { "total_documentos": 10, "completados": 8, "en_error": 1, "pendientes": 1 }
  }
}
```

---

#### GET /api/v2/extraccion/{cedula}
Lista paginada de documentos extraídos de un profesor.

**Query params:**
- `page` (int, default: 1)
- `size` (int, default: 10, max: 50)

**Flujo:**
1. `GET http://rund-ai:8001/extraction/professor/{cedula}`
2. Paginar resultado en rund-api
3. Para cada documento con `status: 'completado'` y `file_path` → añadir `json_nombre = basename(file_path, ext) + '.json'`

```json
{
  "success": true,
  "data": {
    "cedula": "1234567890",
    "documentos": [
      {
        "document_id": "uuid",
        "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/1234567890/cedula.pdf",
        "status": "completado",
        "tipo_documento": "cedula",
        "confidence": 0.95,
        "json_nombre": "cedula.json",
        "created_at": "2026-05-20T10:00:00"
      }
    ],
    "paginacion": { "page": 1, "size": 10, "total": 4, "pages": 1 }
  }
}
```

---

#### GET /api/v2/extraccion/json/{cedula}/{nombre_json}
Obtiene el contenido del JSON side-car de extracción de un documento.

**Flujo:**
1. Construir ruta base: `/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/{cedula}/`
2. Buscar el archivo `{nombre_json}` con `OpenKM.findArchivo`
3. Si no existe → retornar `{ uuid: null, datos: null }` con 200 (no 404)
4. Descargar y parsear el JSON

```json
{
  "success": true,
  "data": {
    "cedula": "1234567890",
    "nombre_json": "cedula.json",
    "uuid": "json-file-uuid",
    "datos": {
      "data": {
        "numero": "1234567890",
        "nombres": "JUAN CARLOS",
        "apellidos": "PEREZ GOMEZ",
        "fecha_nacimiento": "1980-05-15"
      }
    }
  }
}
```

⚠️ El lado-car puede tener dos estructuras: directamente los campos extraídos, o `{ "data": { ... campos ... } }`. El frontend usa `datos.data` si existe.

---

### 4.12 Administración — Lista Blanca (5 endpoints)

Gestión de la whitelist de roles por aplicación. **Requieren autenticación + rol `admin`**, excepto `/seed` que requiere `internalOnly`.

#### POST /api/v2/admin/whitelist/seed
Carga inicial de la whitelist (solo red interna Docker). No requiere sesión.

#### GET /api/v2/admin/whitelist
Lista todos los registros de la whitelist. Requiere `rol: admin`.

#### GET /api/v2/admin/whitelist/{app_id}
Detalle de una aplicación específica en la whitelist.

#### PUT /api/v2/admin/whitelist/{app_id}/usuario
Agrega o actualiza un usuario en la whitelist de una app.

**Body:**
```json
{ "email": "juan@esap.edu.co", "roles": ["gestor", "consultor"] }
```

#### DELETE /api/v2/admin/whitelist/{app_id}/usuario/{email}
Elimina un usuario de la whitelist de una app.

---

### 4.13 Internos — Microservicios (5 endpoints)

**Solo accesibles desde la red interna Docker (rund-network).** rund-ai los usa para acceder a documentos en OpenKM.

#### GET /api/v2/internos/health
Health check del servicio de documentos internos.

```json
{ "success": true, "data": { "status": "ok", "service": "documentos-internos" } }
```

---

#### POST /api/v2/internos/documentos/obtener-uuid
Obtiene el UUID de un documento a partir de su ruta completa.

**Request body:**
```json
{ "doc_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71776491/cedula.pdf" }
```

**Flujo:**
1. Separar `doc_path` en `filename` y `parentPath`
2. URL-decode del `filename`
3. Normalizar Unicode a NFD (OpenKM almacena nombres en NFD — los nombres con tildes/ñ pueden venir en NFC desde rund-ai)
4. Buscar UUID con `OpenKM.findArchivo(filename, parentPath)`

```json
{
  "success": true,
  "uuid": "16acbc5c-4d9d-4152-a39a-9783a1536943",
  "path": "/okm:root/.../cedula.pdf",
  "filename": "cedula.pdf",
  "parent_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71776491"
}
```

**Errores:** `400` si `doc_path` inválido, `404` si no encontrado.

⚠️ **Gotcha crítico:** Los nombres de archivo en OpenKM están en Unicode NFD. Si el nombre llega en NFC desde rund-ai, la búsqueda falla. Usar `unorm` o la API `Intl.Normalizer` en Node.js.

---

#### GET /api/v2/internos/documentos/descargar/{uuid}
Descarga el contenido binario de un documento por UUID. Retorna el archivo directamente.

---

#### POST /api/v2/internos/documentos/subir-json
Sube un JSON side-car de extracción a OpenKM.

**Request body:**
```json
{
  "json_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71776491/cedula.json",
  "data": { ... contenido del JSON de extracción ... }
}
```

**Flujo:**
1. Separar ruta en `filename` y `parentPath`
2. Verificar si ya existe con `OpenKM.getFileUuidByPath(json_path)` (**no** `findArchivo` — ver gotcha)
3. Serializar `data` a JSON
4. Si existe → nueva versión (checkout/checkin)
5. Si no existe → `document/createSimple`

```json
{ "success": true, "uuid": "...", "path": "...", "is_new_version": false }
```

⚠️ **Gotcha crítico:** `findArchivo` usa el índice de búsqueda de OpenKM (que puede estar stale). Para verificar si un archivo existe, usar `getFileUuidByPath` que hace una llamada directa a `repository/getNodeUuid`. Si se usa `findArchivo` y el índice está desactualizado, se puede crear un duplicado (y `createSimple` fallará con 500 si ya existe).

---

#### PUT /api/v2/internos/documentos/categoria
Asigna una categoría de estado de extracción a un documento.

**Request body:**
```json
{ "doc_path": "/okm:root/RUND/...", "category": "completado" }
```

**Categorías permitidas:** `"procesando"`, `"completado"`, `"error"`, `"pendiente"`

**Flujo:**
1. Obtener UUID del documento
2. Obtener categorías actuales del documento
3. Eliminar todas las categorías que empiecen por `Config.CTGR_EXTRACTION` (limpiar estado previo)
4. Crear carpeta de la nueva categoría si no existe: `Config.CTGR_EXTRACTION + category`
5. Añadir la nueva categoría con `document/setProperties`

---

### 4.14 URLs Cortas Legacy (3 endpoints)

Compatibilidad con clientes que usan rutas sin `/api/v2`.

```
GET  /img/{nombre}       →  alias de GET /api/v2/archivos/imagenes/{nombre}
POST /upload/archivos    →  alias de POST /api/v2/archivos/subir
POST /upload/listados    →  alias de POST /api/v2/listados/cargar
```

---

## 5. Lógica de Negocio Crítica

### 5.1 Generación de Certificados

**El único flujo que requiere librerías externas sin sustituto directo en Node.js.**

**Estructura de `data`:** Array JSON de bloques, cada bloque tiene `tipo` y `value`:

```typescript
type Bloque =
  | { tipo: 'parrafo'; value: string }       // texto, puede contener HTML básico (<strong>, <em>, <br>)
  | { tipo: 'tabla'; value: { encabezados: string[]; filas: string[][] } }
  | { tipo: 'firma'; value: { uuid: string; nombre: string; cargo: string } }
```

**Algoritmo (replicar en Node.js con librería DOCX compatible):**

1. **Generar ID:** si no se provee `id`, generar 16 caracteres alfanuméricos (A-Z, 0-9)
2. **Registro en expedidos.json:**
   - Buscar el archivo en OpenKM: `search/find?name=expedidos.json&path=/okm:root/RUND/DOCUMENTOS/CERTIFICADOS/`
   - Descargar, parsear, verificar si el ID ya existe
   - Si no existe → agregar el registro y subir nueva versión (checkout/checkin)
3. **Descargar plantilla DOCX:** buscar `{plantilla}.docx` en `/okm:root/RUND/DOCUMENTOS/PLANTILLAS/CERTIFICADOS/`
4. **Procesar bloques:**

   **Bloque `parrafo`:**
   - Si el texto contiene HTML (`<strong>`, `<em>`, `<br>`) → parsear y crear TextRuns con formato
   - Si es texto plano → simplemente reemplazar el placeholder `${bloque_N}` en la plantilla

   **Bloque `tabla`:**
   - La plantilla tiene una fila "template" con placeholders `${ENC_0}`, `${ENC_1}`, etc. para encabezados
   - Y placeholders `${FIL_0_0}`, `${FIL_0_1}`, etc. para las celdas de la primera fila
   - Clonar la fila template N veces (una por cada fila de datos)
   - Rellenar `${FIL_i_j}` con `filas[i][j]`

   **Bloque `firma`:**
   - Descargar la imagen PNG de la firma desde OpenKM (`document/getContent?docId={uuid}`)
   - Guardar temporalmente en `/tmp/firma_{uuid}.png`
   - Insertar la imagen en el placeholder `${firma_imagen}`
   - Reemplazar `${firma_nombre}` y `${firma_cargo}`
   - Eliminar el archivo temporal inmediatamente

5. **Generar QR:**
   - URL de validación: `{APP_BASE_URL}/api/v2/certificados/{id}` (o URL pública configurable)
   - Generar PNG 300×300px del QR
   - Insertar en placeholder `${valida_qr}`
   - Reemplazar `${valida_url}` con la URL
   - Eliminar PNG temporal

6. **Exportar:**
   - `formato: "docx"` → retornar el DOCX directamente como stream
   - `formato: "pdf"` → guardar DOCX temporal → ejecutar LibreOffice headless → retornar PDF
     ```bash
     libreoffice --headless --convert-to pdf:writer_pdf_Export --outdir /tmp /tmp/certificado.docx
     ```

**Librerías Node.js recomendadas:**
- Plantillas DOCX: `docxtemplater` + `pizzip` (recomendado por soporte de clonación de filas e imágenes)
- QR: `qrcode` (npm)
- Conversión PDF: ejecutar LibreOffice via `child_process.exec` (o `execa`)

**Archivo temporal de plantilla:** al finalizar, eliminar `/tmp/plantilla.docx` y cualquier temporal de firma/QR.

**⚠️ Gotcha con LibreOffice:** El contenedor Docker de rund-api ya tiene LibreOffice instalado. En Node.js, verificar que el path sea `/usr/lib/libreoffice/program/soffice` o usar env var `LIBREOFFICE_EXECUTABLE`.

---

### 5.2 Subida de Documentos a OpenKM

**Flujo completo para `cargaDocumento`:**

```
POST /archivos/subir (accion: cargaDocumento)
  │
  ├─ Parsear propiedades (he.decode → JSON.parse)
  ├─ Validar cédula (/^\d{4,20}$/)
  │
  ├─ PASO 1: Crear taxonomía en OpenKM
  │     ruta = /okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/{cedula}/{taxonomia}/
  │     Para cada nivel de carpeta:
  │       folder/isValid?fldId={path}
  │       Si no existe: folder/create { path }
  │
  ├─ PASO 2: Crear carpetas de categorías en OpenKM
  │     Categorías base (siempre): TIPO/{tipo}, FORMATO/{formato}, ORIGEN/{origen}
  │     Si esCedula: también GENERO/{g}, EDAD/{e}, etc. (desde `categorias[]`)
  │     Para cada categoría: verificar/crear en /okm:categories/RUND/...
  │
  ├─ PASO 3: Subir archivo
  │     ¿Ya existe? (search/find?name={nombre}&path={ruta})
  │     - No existe: document/createSimple
  │     - Ya existe: document/checkout → document/checkin (nueva versión)
  │
  └─ PASO 4: Categorizar documento
       Obtener UUID del archivo subido
       document/setProperties con todas las categorías
```

**Normalización de nombres de carpetas:**
```typescript
function textoANombreCarpeta(texto: string): string {
  const reemplazos: Record<string, string> = {
    'á':'a','é':'e','í':'i','ó':'o','ú':'u',
    'Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U',
    'ñ':'n','Ñ':'N','ü':'u','Ü':'U'
  };
  return texto.split('').map(c => reemplazos[c] || c).join('')
    .toUpperCase().replace(/ /g, '_');
}
```

---

### 5.3 Consulta de Datos de Profesor

**Flujo para `GET /profesores/{cedula}`:**

1. **Buscar todos los archivos:**
   ```
   GET /OpenKM/services/rest/search/find?path=/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/{cedula}
   ```
   Retorna `queryResult[]`. Para cada nodo, extraer:
   - `nombre`: último segmento del path
   - `categorias`: array `[tipo, valor]` filtrado por prefijo `CTGR_DOCS_HOJAS`

2. **Buscar datos demográficos (cédula específica):**
   ```
   GET /OpenKM/services/rest/search/find?path=.../{cedula}&name=cedula
   ```
   ⚠️ La búsqueda por `name=cedula` hace búsqueda prefijo. El archivo puede llamarse `cedula.pdf`, `1990_1_CEDULA_CIUDADANÍA.pdf`, etc. En la práctica, se busca por categoría `TIPO/CEDULA` en los resultados.

3. **Estructurar categorías demográficas:**
   - Descargar `labels.json` desde `/okm:root/RUND/CONFIG/DATA/labels.json`
   - Para cada categoría `[TIPO, VALOR]`:
     - Buscar en labels: `labels[TIPO]` → label legible del tipo
     - `labels[VALOR]` → label legible del valor
   - Agrupar por tipo, soportando jerarquía de 3 niveles `[TIPO, SUBTIPO, VALOR]`

---

### 5.4 Clasificación IA Automática (Webhook)

El flujo completo desde la subida hasta la clasificación:

```
1. POST /archivos/subir (cargaDocumento)
      │
      ↓
2. rund-api agrega el documento a la cola de rund-ai
   POST http://rund-ai:8001/queue/add-batch
   { documents: [{ document_id: uuid, file_path: okm_path, tipo_documento: tipo }],
     callback_url: "http://rund-api:3000/api/v2/ai/webhook/extraction-complete" }
      │
      ↓ (async — rund-ai procesa en background)
3. rund-ai descarga PDF, ejecuta OCR + IA
4. rund-ai llama al webhook:
   POST http://rund-api:3000/api/v2/ai/webhook/extraction-complete
   { document_id, status: "completed", ia_classification: { type, confidence }, ... }
      │
      ↓
5. Webhook handler en rund-api:
   - Si confidence >= 0.8:
     tipo_norm = ia_classification.type.toUpperCase().replace(/[\s-]/g, '_')
     categoriaPath = CTGR_DOCS_HOJAS + 'IA_CLASIFICADO/' + tipo_norm
   - Obtener UUID del documento (POST /internos/documentos/obtener-uuid)
   - Obtener categorías actuales (document/getProperties)
   - Añadir la categoría IA a las categorías existentes (NO reemplazar las existentes)
   - document/setProperties con todas las categorías
```

**Constante `CTGR_DOCS_HOJAS`:** `/okm:categories/RUND/DOCUMENTOS/HOJAS_DE_VIDA/`

---

### 5.5 Scheduler Nocturno

El scheduler encola documentos pendientes durante las horas muertas.

**Componentes:**
- `scheduler_state.json`: archivo de estado (path configurable via env)
- Script CLI `scheduler_extraccion.php` → equivalente en Node.js: script separado `cron/scheduler.ts`
- Crontab: `*/30 22-6 * * * node /app/cron/scheduler.js`

**Lógica del script CLI:**
1. Leer `scheduler_state.json`
2. Si `habilitado: false` → salir
3. Verificar hora actual dentro de rango `[hora_inicio, hora_fin]` (el rango puede cruzar medianoche: ej. 22:00 a 06:00)
4. `POST http://rund-ai:8001/queue/enqueue-pending` → rund-ai encola todos los documentos pendientes
5. Actualizar `scheduler_state.json` con `ultimo_run` y `ultimo_resultado`

---

## 6. Integración con OpenKM

**rund-core (OpenKM) es la base de datos documental.** Toda la información de documentos y profesores vive aquí.

### 6.1 Conexión

```
URL: http://rund-core:8080/OpenKM/services/rest/
Auth: Basic (okmAdmin:admin) — credenciales hardcodeadas en Config.php
      En Node.js: usar variables de entorno OPENKM_USER / OPENKM_PASSWORD
```

```typescript
// Base headers para todas las requests a OpenKM
const headers = {
  'Authorization': `Basic ${Buffer.from(`${OPENKM_USER}:${OPENKM_PASSWORD}`).toString('base64')}`,
  'Content-Type': 'application/json',
};
```

### 6.2 Operaciones Frecuentes

**Buscar archivo por nombre y ruta:**
```
GET /OpenKM/services/rest/search/find?name={encodeURIComponent(nombre)}&path={encodeURIComponent(path)}
```
Retorna `{ queryResult: [{ path, uuid, ... }] }` o `{ queryResult: null }` si no hay resultados.

**Obtener UUID por ruta exacta (más confiable que find):**
```
GET /OpenKM/services/rest/repository/getNodeUuid?path={encodeURIComponent(path)}
```

**Obtener propiedades de un documento:**
```
GET /OpenKM/services/rest/document/getProperties?docId={uuid}
```

**Descargar contenido de un documento:**
```
GET /OpenKM/services/rest/document/getContent?docId={uuid}
```

**Subir un nuevo documento:**
```
POST /OpenKM/services/rest/document/createSimple
Content-Type: multipart/form-data
Fields: docPath, content (binary)
```

**Checkout (bloquear para edición):**
```
POST /OpenKM/services/rest/document/checkout
Body: { "docId": "{uuid}" }
```

**Checkin (guardar nueva versión):**
```
POST /OpenKM/services/rest/document/checkin
Content-Type: multipart/form-data
Fields: docId, content (binary), comment
```

**Verificar si una carpeta existe:**
```
GET /OpenKM/services/rest/folder/isValid?fldId={encodeURIComponent(path)}
```

**Crear carpeta:**
```
POST /OpenKM/services/rest/folder/create
Body: { "path": "/okm:root/..." }
```

**Asignar categorías a un documento:**
```
PUT /OpenKM/services/rest/document/setProperties
Body: { "uuid": "...", "categories": [{ "path": "/okm:categories/..." }] }
```

**Obtener hijos de una carpeta (árbol de categorías):**
```
GET /OpenKM/services/rest/folder/getChildren?fldId={path}
```

**Eliminar un documento:**
```
DELETE /OpenKM/services/rest/document/delete?docId={uuid}
```

**Vaciar papelera:**
```
DELETE /OpenKM/services/rest/repository/purgeTrash
```

### 6.3 Rutas Importantes en OpenKM

```
/okm:root/RUND/
├── DOCENTES/
│   └── HOJAS_DE_VIDA/
│       └── {cedula}/          ← carpeta por profesor
│           ├── ACADEMICOS/
│           │   ├── DIPLOMAS/
│           │   └── ACTAS/
│           ├── LABORALES/
│           │   └── CONTRATOS/
│           └── {nombre_archivo}.pdf
│           └── {nombre_archivo}.json  ← JSON side-car de extracción
├── DOCUMENTOS/
│   ├── CERTIFICADOS/
│   │   └── expedidos.json
│   ├── FIRMAS/
│   │   ├── {nombre_firma}.png
│   │   └── {nombre_firma}.json
│   ├── LISTADOS/
│   │   └── {TIPO}/
│   │       └── {archivo}.xlsx
│   └── PLANTILLAS/
│       └── CERTIFICADOS/
│           └── {plantilla}.docx
└── CONFIG/
    ├── DATA/
    │   ├── labels.json
    │   ├── expedidos.json
    │   └── extraction_index.json
    └── IMAGENES/
        ├── logoESAP.svg
        └── logoRUND.png

/okm:categories/RUND/
├── DOCUMENTOS/
│   └── HOJAS_DE_VIDA/
│       ├── TIPO/
│       │   ├── DIPLOMA
│       │   ├── CERTIFICADO
│       │   ├── CEDULA
│       │   └── IA_CLASIFICADO/
│       │       ├── CEDULA
│       │       ├── CERTIFICADO_LABORAL
│       │       └── ...
│       ├── FORMATO/
│       │   ├── PDF
│       │   └── DOCX
│       └── ORIGEN/
│           ├── ONEDRIVE
│           ├── SCANNER
│           └── LOCAL
├── DOCENTES/
│   ├── GENERO/
│   │   ├── MASCULINO
│   │   └── FEMENINO
│   ├── EDAD/
│   │   └── 30-40
│   └── ...
└── EXTRACTION_STATUS/
    ├── procesando
    ├── completado
    ├── error
    └── pendiente
```

### 6.4 Timeout y Manejo de Errores

- Timeout por defecto: 30 segundos
- Timeout para operaciones de cola/reset: 90 segundos
- Retornar los errores de OpenKM directamente al cliente con 500

---

## 7. Integración con rund-auth (BFF)

### 7.1 URLs de rund-auth (red interna)

```
Base: http://rund-auth:8080
POST   /ldap/login          → { user, jwt, session_cookie }
POST   /dev/login           → { user, jwt }  (solo DEV_FAKE_LOGIN=true)
POST   /logout              → 200
POST   /refresh             → { jwt }
GET    /health              → { status }
GET    /.well-known/jwks.json → JWKS público (para validar JWT)
```

### 7.2 Flujo BFF Completo

**Login:**
```typescript
// 1. Frontend → POST /api/v2/auth/login { username, password }
// 2. rund-api → rund-auth: POST /ldap/login { username, password }
const authResponse = await fetch('http://rund-auth:8080/ldap/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include',   // para recibir la cookie connect.sid de rund-auth
});
const { user, jwt } = await authResponse.json();

// 3. Enriquecer roles desde whitelist
user.roles = await WhitelistService.getRolesForUser(user.email, req.headers['x-app-id'] ?? '');

// 4. Guardar en sesión (JWT nunca va al frontend)
req.session.internal_jwt = jwt;
req.session.user = user;
req.session.last_activity = Date.now();

// 5. Responder al frontend con el usuario (sin JWT)
res.json({ success: true, data: { user, session_id: req.sessionID } });
```

**Validación de sesión en cada request (middleware global):**
```typescript
// 1. Verificar timeout de inactividad (28800 segundos = 8 horas)
if (Date.now() - req.session.last_activity > 28800 * 1000) {
  req.session.destroy();
  return res.status(401).json({ error: 'Sesión expirada' });
}

// 2. Verificar que el JWT existe en la sesión
const jwt = req.session.internal_jwt;
if (!jwt) {
  return res.status(401).json({ error: 'No autenticado' });
}

// 3. Validar JWT con JWKS público de rund-auth
// Cache el JWKS por 5 minutos
const jwks = await getJwksWithCache('http://rund-auth:8080/.well-known/jwks.json');
// Verificar firma RS256, issuer: 'rund-auth', audience: 'rund-api'
try {
  const claims = verifyJwt(jwt, jwks, { issuer: 'rund-auth', audience: 'rund-api' });
  req.session.last_activity = Date.now();
  next();
} catch (e) {
  req.session.destroy();
  return res.status(401).json({ error: 'Token inválido o expirado' });
}
```

### 7.3 Estructura del JWT

```json
{
  "header": { "alg": "RS256", "kid": "key-id", "typ": "JWT" },
  "payload": {
    "sub": "juan.perez",
    "email": "juan.perez@esap.edu.co",
    "roles": [],
    "wl_ver": 1,
    "iss": "rund-auth",
    "aud": ["rund-api", "rund-mgp"],
    "iat": 1717632000,
    "exp": 1717632900
  }
}
```

**TTL:** 900 segundos (15 minutos). La sesión PHP dura 8 horas; si el JWT expira, el middleware de validación en rund-api lo detecta y limpia la sesión.

---

## 8. Integración con rund-ai y rund-ocr

rund-api solo actúa como **proxy/orquestador** de estos servicios. No tiene lógica IA propia.

### 8.1 rund-ai (Python Flask, puerto 8001)

```
POST /queue/add-batch
  Body: { documents: [{ document_id, file_path, tipo_documento }], callback_url }
  Respuesta: 202 { queued: N }

GET  /queue/stats
GET  /queue/job/{document_id}
GET  /extraction/statistics
GET  /extraction/professor/{cedula}
POST /retry-error-jobs
POST /reset-stuck-jobs
POST /classify    → { type, confidence }
POST /search      → { results, total }
POST /validate    → { issues, score, total_documentos, completados, en_error }
POST /queue/enqueue-pending  ← usado por el scheduler CLI
```

**Env var:** `RUND_AI_URL=http://rund-ai:8001`

### 8.2 rund-ocr (Python Flask, puerto 8000)

rund-api no llama directamente a rund-ocr. rund-ai orquesta el OCR internamente.

### 8.3 Patrón de proxy

```typescript
// Ejemplo de proxy genérico a rund-ai
async function proxyToAI(path: string, method: 'GET' | 'POST' = 'GET', body?: object) {
  const aiUrl = process.env.RUND_AI_URL ?? 'http://rund-ai:8001';
  const res = await fetch(`${aiUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`rund-ai returned ${res.status}`);
  return res.json();
}
```

---

## 9. Variables de Entorno

```env
# Aplicación
APP_ENV=development                    # "development" | "production"
APP_PORT=3000                          # Puerto del servidor
APP_BASE_URL=http://localhost:3000     # URL pública (para QR en certificados)

# OpenKM
OPENKM_URL=http://rund-core:8080/OpenKM
OPENKM_USER=okmAdmin
OPENKM_PASSWORD=admin                  # ⚠️ Cambiar en producción

# Autenticación
RUND_AUTH_URL=http://rund-auth:8080
SESSION_SECRET=cambiar_en_produccion_string_muy_largo_y_aleatorio
SESSION_NAME=RUND_SESSION
COOKIE_SECURE=false                    # true en producción con HTTPS
COOKIE_SAMESITE=Lax
SESSION_TIMEOUT=28800                  # segundos (8 horas)
JWKS_CACHE_TTL=300                     # segundos (5 minutos)
DEV_FAKE_LOGIN=false                   # true solo en desarrollo

# Servicios externos
RUND_AI_URL=http://rund-ai:8001
RUND_OCR_URL=http://rund-ocr:8000      # no usado directamente por rund-api aún

# Archivos y directorios
TEMP_DIR=/tmp/rund                     # directorio temporal para archivos procesados
SCHEDULER_STATE_FILE=/app/cli/scheduler_state.json
LIBREOFFICE_EXECUTABLE=/usr/lib/libreoffice/program/soffice

# Logging
LOG_LEVEL=debug                        # "debug" | "info" | "warn" | "error"
```

---

## 10. Estructura de Carpetas Recomendada (Node.js)

```
rund-api/
├── src/
│   ├── app.ts                 # Express app setup (middlewares, error handler)
│   ├── server.ts              # Entry point (listen)
│   ├── config/
│   │   └── config.ts          # Constantes y rutas OpenKM (desde process.env)
│   ├── routes/
│   │   └── v2/
│   │       ├── index.ts       # Router principal (registra todos los sub-routers)
│   │       ├── system.routes.ts
│   │       ├── auth.routes.ts
│   │       ├── certificados.routes.ts
│   │       ├── categorias.routes.ts
│   │       ├── profesores.routes.ts
│   │       ├── documentos.routes.ts
│   │       ├── archivos.routes.ts
│   │       ├── listados.routes.ts
│   │       ├── firmas.routes.ts
│   │       ├── ai.routes.ts
│   │       ├── extraccion.routes.ts
│   │       ├── admin.routes.ts
│   │       └── internos.routes.ts
│   ├── controllers/
│   │   ├── base.controller.ts        # successResponse(), errorResponse()
│   │   ├── system.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── certificados.controller.ts
│   │   ├── categorias.controller.ts
│   │   ├── profesores.controller.ts
│   │   ├── documentos.controller.ts
│   │   ├── archivos.controller.ts
│   │   ├── listados.controller.ts
│   │   ├── firmas.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── extraccion.controller.ts
│   │   ├── admin.controller.ts
│   │   └── internos.controller.ts
│   ├── middleware/
│   │   ├── cors.middleware.ts
│   │   ├── auth.middleware.ts         # sesión + JWT validation
│   │   └── validation.middleware.ts  # requireFiles, validateFileSize
│   ├── services/
│   │   ├── openkm.service.ts          # Client para OpenKM REST API
│   │   ├── auth.service.ts            # Comunicación con rund-auth
│   │   ├── jwt-validator.service.ts   # Validación JWT RS256 con JWKS cache
│   │   ├── certificados.service.ts    # docxtemplater + QR + LibreOffice
│   │   ├── document.service.ts        # Operaciones de documentos en OpenKM
│   │   ├── categorias.service.ts      # Árbol de categorías
│   │   ├── firmas.service.ts          # Gestión de firmas
│   │   ├── reportes.service.ts        # Generación de Excel/PDF
│   │   ├── ai.service.ts              # Proxy a rund-ai
│   │   ├── scheduler.service.ts       # Lectura/escritura scheduler_state.json
│   │   └── whitelist.service.ts       # Lista blanca de roles
│   └── utils/
│       ├── openkm-paths.ts            # Constantes de rutas OpenKM
│       ├── texto-a-carpeta.ts         # textoANombreCarpeta()
│       ├── generar-id.ts              # Genera IDs de 16 chars alfanuméricos
│       └── decode-propiedades.ts      # he.decode + JSON.parse
├── cli/
│   └── scheduler.ts                   # Script de scheduler (cron)
├── static/
│   └── swagger-ui.html
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Dependencias principales recomendadas:**
```json
{
  "express": "^4.x",
  "express-session": "^1.x",
  "connect-redis": "^7.x",
  "ioredis": "^5.x",
  "multer": "^1.x",
  "jose": "^5.x",
  "docxtemplater": "^3.x",
  "pizzip": "^3.x",
  "docxtemplater-image-module-free": "^3.x",
  "qrcode": "^1.x",
  "exceljs": "^4.x",
  "he": "^1.x",
  "node-fetch": "^3.x",
  "cors": "^2.x",
  "helmet": "^7.x",
  "zod": "^3.x"
}
```

---

## 11. Decisiones de Arquitectura (ADRs)

### ADR-001 — OpenKM como repositorio documental
- **No reescribir.** Se entrega como imagen Docker.
- La API REST de OpenKM usa Basic Auth. Las credenciales van en env vars.
- No hay base de datos SQL en rund-api — toda la persistencia es OpenKM + JSONs en OpenKM.

### ADR-002 — PHP → Node.js
- El contrato de API debe preservarse exactamente (rutas, métodos, formatos de respuesta).
- Siempre responder 200 para éxito (no 201/204).
- Mantener `Content-Disposition: inline` para archivos (no `attachment`) — permite previsualización en el frontend.

### ADR-003 — Sin HTTPS en la fase actual
- El entorno de producción es HTTP en red interna.
- `COOKIE_SECURE=false` en producción actual. Cambiar a `true` cuando la OTIC habilite HTTPS.

### ADR-004 — BFF Pattern
- El JWT de rund-auth nunca llega al navegador.
- `req.session.internal_jwt` es el único lugar donde vive el JWT.
- El logout es en dos pasos: sesión Node.js + sesión Redis de rund-auth (best-effort).
- Si el logout de rund-auth falla, el logout local igual se completa (el JWT expirará solo en 15 min).

### ADR-005 — JWT RS256 asimétrico
- rund-auth firma con clave privada RSA.
- rund-api valida con `/.well-known/jwks.json` (clave pública).
- Cache del JWKS: 5 minutos.
- Usar `jose` (npm) para la validación — soporta RS256 y JWKS nativamente.

### ADR-006 — Procesamiento asíncrono de documentos
- rund-api encola jobs en rund-ai via `POST /queue/add-batch`.
- rund-api retorna 200 inmediatamente (no espera el resultado).
- rund-ai llama al webhook cuando termina (puede tardar 30-90 segundos).
- Si el webhook falla, el job en rund-ai queda en "completado" pero la categoría IA no se aplica en OpenKM.

### ADR-007 — PHP POST para actualizar archivos
- El endpoint `POST /archivos/{uuid}/actualizar` usa POST (no PUT) porque PHP no soporta `$_FILES` con PUT.
- **Mantener POST en Node.js** por compatibilidad con el frontend Angular existente.

### ADR-008 — scheduler_state.json como estado del scheduler
- El scheduler es un script CLI que el cron ejecuta cada 30 minutos.
- El estado (habilitado/pausado, horas de operación, último run) se persiste en un JSON en disco.
- La API REST lee/escribe ese mismo archivo.
- En Node.js, usar acceso atómico al archivo (writeFileSync con replace atómico o similar).

---

## 12. Gotchas y Casos Especiales

| Situación | Descripción | Solución |
|-----------|-------------|---------|
| **Propiedades HTML-encoded** | El frontend Angular envía `propiedades` con HTML entities (`&quot;` etc.) | Usar `he.decode(propiedades)` antes de `JSON.parse` |
| **Nombres en NFD en OpenKM** | OpenKM almacena nombres de archivos en Unicode NFD (descompuesto). `"CIUDADANÍA"` en NFC falla la búsqueda | `filename = unescape(filename)` + `normalize('NFD')` antes de `findArchivo` |
| **findArchivo vs getFileUuidByPath** | `search/find` usa el índice de búsqueda de OpenKM (puede estar desactualizado). Para verificar existencia antes de `createSimple`, usar `repository/getNodeUuid` (ruta directa) | Usar `getNodeUuid` siempre que sea posible para verificar existencia |
| **Scheduler cruzando medianoche** | Rango `hora_inicio=22, hora_fin=6` cruza medianoche. La lógica debe manejar: `hora >= 22 OR hora < 6` | `const enRango = h >= inicio || h < fin` (cuando inicio > fin) |
| **Timeout 90s en retry/reset** | El reset y retry de jobs pueden tardar hasta 90 segundos si hay workers activos esperando el lock | `AbortSignal.timeout(90000)` en fetch |
| **Caracteres especiales en nombres de archivos** | Los nombres con espacios o `#`, `%`, etc. deben URL-encodarse al pasarlos como path params | `encodeURIComponent(nombre)` en las URLs de búsqueda OpenKM |
| **expedidos.json con checkout** | Al registrar un nuevo certificado, se debe hacer checkout del JSON, actualizarlo y hacer checkin. Si se falla a mitad, el archivo queda bloqueado | Implementar manejo de errores con `document/cancelCheckout` en el catch |
| **Archivos temporales** | Los PDFs generados por LibreOffice y los DOCXs temporales deben eliminarse aunque falle el envío | Usar `try/finally` para garantizar `fs.unlink` |
| **CORS con credentials** | Angular envía `withCredentials: true`. Con CORS permisivo actual, funciona. Si la OTIC restringe orígenes, revisar que el origen del frontend esté en la whitelist | — |
| **Sesión expirada vs JWT expirado** | Son dos validaciones separadas: (1) timeout de inactividad de 8h, (2) JWT de 15min. El JWT puede expirar dentro de la sesión activa → el middleware lo detecta y cierra la sesión | Verificar ambas condiciones en el middleware de auth |
| **rund-auth "degraded"** | En el primer request al health check después de arrancar, rund-auth puede retornar "degraded" | Es timing — no es un error real. Ignorar en desarrollo; en producción el health check reintenta |
| **extraction_index.json** | rund-ai persiste el índice en OpenKM. Gunicorn corre con 1 worker + 4 threads + `fcntl.flock` para evitar race conditions. rund-api no escribe directamente este archivo | No modificar este archivo desde rund-api |

---

## 13. Checklist de Verificación Post-Migración

### Endpoints críticos (probar primero)

- [ ] `POST /api/v2/auth/login` — login LDAP funciona, cookie RUND_SESSION se establece
- [ ] `GET /api/v2/auth/session` — retorna usuario con cookie válida, 401 sin cookie
- [ ] `GET /api/v2/profesores/{cedula}` — retorna archivos + demografía correctamente
- [ ] `POST /api/v2/archivos/subir` (cargaDocumento) — archivo aparece en OpenKM con categorías
- [ ] `GET /api/v2/archivos/{uuid}` — descarga correcta con Content-Type correcto
- [ ] `POST /api/v2/certificados/generar` — genera DOCX y PDF correctamente
- [ ] `POST /api/v2/ai/webhook/extraction-complete` — categoría IA_CLASIFICADO se aplica en OpenKM
- [ ] `POST /api/v2/internos/documentos/obtener-uuid` — retorna UUID correcto con nombres NFD

### Validaciones de contratos

- [ ] Todas las rutas públicas son accesibles sin cookie
- [ ] Todas las rutas protegidas retornan 401 sin cookie (no 403, no redirect)
- [ ] El formato de respuesta siempre es `{ "success": true, "data": {...} }` o `{ "error": "..." }`
- [ ] Los archivos binarios se sirven con `Content-Type` correcto (no `application/json`)
- [ ] `POST /archivos/{uuid}/actualizar` usa POST (no PUT) — verificar que el frontend funciona

### Funcionalidad de negocio

- [ ] Certificado DOCX con parrafo, tabla y firma: contenido correcto en el documento
- [ ] Certificado PDF: conversión LibreOffice funciona y el archivo es válido
- [ ] QR code en certificados: URL es accesible y apunta al endpoint correcto
- [ ] Propiedades HTML-encoded: subida de documentos con propiedades que contienen comillas
- [ ] Archivos con nombres NFD: búsqueda funciona para archivos con tildes y ñ
- [ ] Scheduler state: toggle habilitado/pausado persiste entre reinicios

### Integración con microservicios

- [ ] rund-ai webhook: el webhook recibe el callback y actualiza OpenKM con la categoría IA
- [ ] rund-ai proxy: estadísticas, cola, retry/reset — todos los endpoints proxy funcionan
- [ ] rund-auth: login LDAP real (no fake) funciona en staging
- [ ] OpenKM: crear carpeta, subir archivo, checkout/checkin funcionan correctamente

---

*Guía generada el 05 jun 2026 — Versión PHP documentada: rund-api v2.1 (commit rund-api#13)*
