# MEMORY.md — Estado del Proyecto RUND

> Este documento es la fuente de verdad para retomar el proyecto sin contexto previo.
> Se actualiza al cierre de cada sesión de trabajo relevante.
> **Última actualización:** 05 jun 2026

---

## 1. Estado Actual del Proyecto

| Campo | Valor |
|-------|-------|
| **Versión** | 3.2 (Entregado — 05 jun 2026) |
| **Fase** | UAT iniciada en febrero 2026 — módulos core probados |
| **URL desarrollo** | http://localhost:4000 (frontend) · http://localhost:3000 (API) |
| **URL UAT/producción** | http://172.16.234.52:4000 · http://172.16.234.52:3000 |
| **Rama principal** | `main` |
| **Rama activa de trabajo** | `main` (feature branches según git flow) |
| **Último commit relevante** | `feature/clasificacion-automatica` en revisión — clasificación IA automática + badge en ficha docente + fix Dockerfile rund-ai (28 may 2026) |
| **Docker Hub** | `ocastelblanco/rund-*:latest` |
| **Desarrollador** | Oliver Castelblanco Martínez — Bogotá, Colombia (UTC-5) |

---

## 2. Funcionalidades Completadas vs. Pendientes

### ✅ Completado

- [x] Infraestructura Docker con 9 servicios (core, api, mgp, auth, ollama, ai, ocr, redis, postgres)
- [x] Repositorio documental OpenKM con taxonomía de carpetas por profesor
- [x] Backend PHP 8.3 con 40+ endpoints REST (`/api/v2/*`)
- [x] Frontend Angular 21 con SSR, PrimeNG, rutas lazy loading
- [x] Servicio de autenticación centralizado (rund-auth): LDAP + OAuth 2.0 + JWT RS256
- [x] Integración de autenticación en rund-api (BFF pattern)
- [x] JWTValidator.php con validación JWKS nativa (sin dependencias externas)
- [x] Sesiones seguras: httpOnly cookies, Redis, 8h TTL
- [x] Generación de certificados en Word y PDF (PHPWord + dompdf)
- [x] Subida y descarga de documentos (hasta 50 MB)
- [x] Extracción OCR con PaddleOCR (español + inglés, preprocesamiento con OpenCV)
- [x] Sistema de cola FIFO asíncrona con 3 workers paralelos (rund-ai)
- [x] 6 schemas de extracción estructurada con NuExtract vía Ollama
- [x] Índice centralizado de documentos extraídos (extraction_index.json en OpenKM)
- [x] Base de datos vectorial ChromaDB para búsqueda semántica (implementada, sin testing)
- [x] Gestión de categorías de OpenKM desde el frontend
- [x] Carga masiva de listados desde Excel/CSV
- [x] Gestión de firmas digitalizadas para certificados
- [x] Scripts de despliegue multi-arquitectura (amd64 + arm64)
- [x] Health checks en todos los servicios
- [x] Documentación de arquitectura y seguridad (docs/reportes/)
- [x] Fase UAT iniciada con documento introductorio y fichas de prueba
- [x] Dashboard de Extracción de datos con estadísticas en tiempo real (rund-api#3 + rund-mgp#7)
- [x] API paginada `/extraccion/*` + vista previa con accordion + datos extraídos (rund-api#4 + rund-mgp#8)
- [x] `POST /reset-stuck-jobs` — resetea documentos bloqueados "procesando" → "pendiente" (rund-ai#2 + rund-api#6 + rund-mgp#10)
- [x] `POST /retry-error-jobs` — re-encola documentos "error" → "pendiente" para scheduler (rund-ai#2 + rund-api#6 + rund-mgp#10)
- [x] Botones condicionales en dashboard: "Resetear bloqueados" y "Re-encolar errores"
- [x] Scheduler asíncrono nocturno: CLI PHP + crontab `*/30 22-6h` + 4 endpoints REST de control (rund-ai#3, rund-api#7, rund-mgp#11)
- [x] Panel de control del scheduler en UI: tag Activo/Pausado, toggle, configuración de rango horario, último run
- [x] Clasificación automática IA: ExtractionWorker invoca `/classify` tras OCR (confianza ≥ 0.8), aplica categoría `IA_CLASIFICADO/{tipo}` en OpenKM vía webhook, badge "Clasificados por IA" en ficha del docente (PRs: rund-ai#4, rund-api#8, rund-mgp#12)
- [x] Fix Dockerfile rund-ai: `--create-home` en `useradd` para que Sentence Transformers cachee modelos en `/home/rund/.cache`
- [x] Auto-refresh dashboard extracción: `interval(30s)` + `takeUntil` + `filter(colaActiva>0)` en Extraccion; badge p-tag info visible; `ngOnDestroy` sin leaks (rund-mgp#12)
- [x] Datos extraídos por IA en ficha del docente: panel colapsable `p-panel` + tabla con nombre, tipo, confianza, fecha. Skeleton de carga. `cargarExtracciones()` reactivo con `@Input() cedula` (rund-mgp#13)
- [x] Hotfix NG0100 + JSON side-car 404→200+null + reset CargaDocumento + refresco Editar documentación (rund-mgp#14)
- [x] Fix by_category/professors dict corruption en extraction_index_service.py: normaliza list→dict (rund-ai fix)
- [x] Fix IA_CLASIFICADO null en ruta multimodal: fallback job.tipo_documento con confidence=0.9 antes del callback (rund-ai#7)
- [x] Búsqueda semántica: SearchService Jaccard token overlap + `POST /search` + proxy PHP + panel UI con tabla resultados (rund-ai#8, rund-api#11, rund-mgp#15)
- [x] Validación de consistencia: ValidatorService 5 checks metadatos + Jaccard nombre <0.75 + normalización tipo_documento (rund-ai#9, rund-api#12, rund-mgp#16)
- [x] Estadísticas cobertura agregada en dashboard Extracción + aliases OpenKM→schema AI (rund-mgp#17)
- [x] Cobertura de tipos de documento en FichaDocente: getter `coberturaTipos` + panel chips success/danger (rund-mgp#18)
- [x] Detalle de campos extraídos por documento: botón `pi-eye` + `p-dialog` lazy con campos del side-car (rund-mgp#19)
- [x] 6 hotfixes UX: datos demográficos (búsqueda TIPO/CEDULA), selector múltiple normalizado, fecha extracción con `date` pipe, skeletons carga masiva, barra progreso real, dark mode sincronizado
- [x] Fix extraction_index.json: `getFileUuidByPath` (UUID estable), `_deep_merge()` sobre `_create_empty_index()`, 1 worker + 4 threads + `fcntl.flock` (anti-race condition)
- [x] Integración Angular con rund-auth: global middleware PHP en todas las rutas /api/v2 + fix loop infinito `data.init()→401→NavigationEnd` (rund-api#13, rund-mgp#20)

### ❌ No entregado / Fuera de alcance

- [ ] Rate limiting en endpoint de login (rund-auth)
- [ ] OCR optimizado para cédulas colombianas (templates por posición de campo)
- [ ] Dashboard de validación y calidad documental
- [ ] Análisis de tendencias con Gemma
- [ ] Reportes automáticos
- [ ] HTTPS en producción (coordinar con OTIC-ESAP)
- [ ] Audit logging de eventos de autenticación
- [ ] Detector de documentos duplicados
- [ ] Carga inicial de ~12 000 documentos

---

## 3. Registro de Decisiones de Arquitectura (ADR)

### ADR-001 — OpenKM como sistema de gestión documental

| Campo | Valor |
|-------|-------|
| **Fecha** | julio 2024 (commit inicial) |
| **Estado** | Implementado |
| **Decisión** | Usar OpenKM CE como repositorio documental en lugar de SharePoint, Alfresco o almacenamiento en filesystem |
| **Razón** | OpenKM CE es de código abierto (sin costo de licencia), se despliega on-premise (requisito de la ESAP por política de datos), tiene API REST nativa para integración y una taxonomía de carpetas que se mapea directamente a la estructura de hojas de vida profesorales. SharePoint requería licenciamiento Microsoft 365 que la ESAP no tenía asignado. Alfresco Community era más complejo de administrar. |
| **Consecuencias conocidas** | La API de OpenKM es Java/REST con autenticación básica (no OAuth). La imagen Docker solo tiene builds para `linux/amd64` — no corre nativamente en Mac M2 (se fuerza `platform: linux/amd64` con Rosetta). Las actualizaciones de OpenKM son manuales. |

---

### ADR-002 — PHP 8.3 para rund-api (Backend principal)

| Campo | Valor |
|-------|-------|
| **Fecha** | julio 2024 |
| **Estado** | Implementado |
| **Decisión** | Implementar el backend API en PHP 8.3 en lugar de Node.js, Python o Go |
| **Razón** | El desarrollador principal (Oliver Castelblanco) tiene experiencia fuerte en PHP. El ecosistema PHP tiene librerías maduras para manipulación de documentos Office (PHPWord, PHPSpreadsheet, dompdf) que son centrales al caso de uso. El tiempo de desarrollo se redujo significativamente al usar el stack conocido. |
| **Consecuencias conocidas** | Los servicios de IA y OCR (Python) tienen un lenguaje diferente al backend principal. No mezclar lógica de negocio entre PHP y Python — cada servicio tiene responsabilidades claras. El router de rund-api es custom (no un framework como Laravel/Symfony) lo que reduce dependencias pero requiere más código boilerplate. |

---

### ADR-003 — Sin HTTPS en producción (fase actual)

| Campo | Valor |
|-------|-------|
| **Fecha** | noviembre 2025 |
| **Estado** | Activo — pendiente de resolución |
| **Decisión** | Desplegar en producción con HTTP (no HTTPS) en la IP 172.16.234.52 |
| **Razón** | El servidor de producción está dentro de la red interna de la ESAP, no expuesto a Internet. La obtención de un certificado SSL requiere coordinación con la OTIC-ESAP (Oficina de TI), proceso administrativo que no depende del equipo de desarrollo. La decisión fue continuar el desarrollo y UAT en HTTP mientras se gestiona el certificado. |
| **Consecuencias conocidas** | `COOKIE_SECURE=false` en producción — las cookies de sesión van en texto plano en la red interna. Cuando se habilite HTTPS, se debe cambiar `COOKIE_SECURE=true` en rund-auth y rund-api, y `DEV_FAKE_LOGIN=false`. Las credenciales LDAP viajan cifradas por LDAP (no HTTP), así que el riesgo principal es el cookie de sesión. |

---

### ADR-004 — BFF Pattern (rund-api como proxy de autenticación)

| Campo | Valor |
|-------|-------|
| **Fecha** | diciembre 2025 |
| **Estado** | Implementado |
| **Decisión** | El frontend Angular nunca recibe ni almacena el JWT. rund-api actúa como BFF (Backend-for-Frontend): recibe las credenciales del frontend, las reenvía a rund-auth, recibe el JWT y lo guarda en la sesión del servidor PHP. El frontend solo recibe una cookie httpOnly. |
| **Razón** | Previene ataques XSS que roben tokens. El JWT nunca toca el navegador. Permite implementar validación de roles y whitelist en el servidor sin exponer lógica al cliente. |
| **Consecuencias conocidas** | El logout requiere dos pasos: destruir la sesión PHP en rund-api Y la sesión Redis en rund-auth. El segundo paso es "best effort" (puede fallar sin bloquear el logout local). Hay que documentar esto, no silenciarlo. |

---

### ADR-005 — JWT RS256 (asimétrico) en lugar de HS256 (simétrico)

| Campo | Valor |
|-------|-------|
| **Fecha** | diciembre 2025 |
| **Estado** | Implementado |
| **Decisión** | Usar RS256 (par de claves RSA) para firmar JWT en lugar de HS256 (secreto compartido) |
| **Razón** | Con RS256, rund-auth firma con la clave privada y cualquier servicio valida con la clave pública sin necesidad de compartir el secreto. El JWKS público (`/.well-known/jwks.json`) permite que rund-api valide tokens sin coordinación de secretos. Esto facilita escalar a múltiples servicios validadores sin riesgo de exposición del secreto de firma. |
| **Consecuencias conocidas** | Las claves RSA (`keys/jwks-private.json`, `keys/jwks-public.json`) deben generarse con `npm run gen:jwks` y montarse como volumen en rund-auth. Si se rotan las claves, todos los JWT activos quedan inválidos (sesiones rotas). El JWKS se cachea 5 minutos en rund-api. |

---

### ADR-006 — Procesamiento asíncrono con cola FIFO y 3 workers

| Campo | Valor |
|-------|-------|
| **Fecha** | noviembre 2025 |
| **Estado** | Implementado |
| **Decisión** | El procesamiento OCR+IA de documentos es asíncrono: rund-api encola los jobs y retorna 202 inmediatamente; 3 workers en threads paralelos procesan la cola |
| **Razón** | El OCR de un documento puede tomar 30-60 segundos y la extracción con IA 5-20 segundos adicionales. Un modelo síncrono bloquearía la interfaz y agotaría los timeouts HTTP. La cola FIFO garantiza orden y el sistema de reintentos (3 intentos) maneja errores transitorios de Ollama. |
| **Consecuencias conocidas** | El frontend debe implementar polling para conocer el estado de un job (`GET /queue/job/{id}`). El estado del índice de extracción (`extraction_index.json`) vive en OpenKM y puede quedar inconsistente si un worker falla entre la extracción y la escritura. |

---

### ADR-007 — PaddleOCR en lugar de Tesseract

| Campo | Valor |
|-------|-------|
| **Fecha** | septiembre 2024 |
| **Estado** | Implementado |
| **Decisión** | Usar PaddleOCR 2.9.1 como motor OCR en lugar de Tesseract |
| **Razón** | PaddleOCR tiene mejor desempeño en documentos colombianos (cédulas, certificados) que mezclan tipografías de impresión y letra manuscrita. El modelo español de PaddleOCR tiene mayor precisión que Tesseract en documentos de baja calidad (fotocopias). Además, PaddleOCR es más fácil de integrar en Python con un pipeline de preprocesamiento OpenCV. |
| **Consecuencias conocidas** | La imagen Docker de rund-ocr pesa ~2 GB por las dependencias de PaddlePaddle. El primer arranque descarga los modelos de OCR (~500 MB). Sin GPU, el tiempo por página es 5-15 segundos. |

---

### ADR-008 — Angular 21 con SSR habilitado

| Campo | Valor |
|-------|-------|
| **Fecha** | julio 2024 |
| **Estado** | Implementado |
| **Decisión** | Usar Angular con Server-Side Rendering (SSR) en lugar de SPA puro |
| **Razón** | SSR mejora el tiempo de First Contentful Paint en la red interna de la ESAP (que puede ser lenta). También facilita el despliegue en Docker con un único contenedor Node.js que sirve el HTML inicial. |
| **Consecuencias conocidas** | Código que usa `window`, `document` o `localStorage` rompe en SSR — siempre usar `isPlatformBrowser()`. Los servicios HTTP deben funcionar tanto en servidor como en cliente. El build genera dos targets: `browser/` y `server/`. |

---

## 4. Dependencias Instaladas (Versiones Exactas)

### rund-mgp (Angular)

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| @angular/* | 21.2.x | Framework frontend |
| @primeng/* | 21.1.1 | Componentes UI |
| @fortawesome/* | 6.7.2 | Iconografía |
| chart.js | 4.5.0 | Gráficos |
| pdfjs-dist | 5.4.449 | Visualización PDFs |
| exceljs | 4.4.0 | Exportación Excel |
| quill | 2.0.3 | Editor de texto enriquecido |
| rxjs | 7.8.x | Programación reactiva |
| typescript | 5.9.3 | Tipado estático |
| zone.js | 0.16.1 | Change detection |

### rund-auth (Node.js)

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| express | 4.19.2 | Framework web |
| jose | 5.9.3 | JWT RS256 |
| ldapts | 8.0.19 | Cliente LDAP |
| openid-client | 5.6.5 | OAuth 2.0 / OIDC |
| ioredis | 5.4.1 | Redis |
| express-session | 1.17.3 | Sesiones |
| helmet | 7.1.0 | Headers de seguridad |
| zod | 3.23.8 | Validación |
| typescript | 5.6.3 | Tipado estático |

### rund-ai (Python)

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| flask | 3.0.0 | Framework web |
| gunicorn | 21.2.0 | Servidor WSGI |
| sentence-transformers | 2.7.0 | Embeddings |
| chromadb | 0.4.18 | Vector DB |
| torch | 2.1.2 | Inferencia (CPU) |
| pymupdf | 1.24.5 | PDF → imágenes |
| pydantic | 2.5.2 | Validación |

### rund-ocr (Python)

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| paddleocr | 2.9.1 | Motor OCR |
| paddlepaddle | 3.2.1 | Backend OCR |
| flask | 3.0.0 | Framework web |
| pdf2image | 1.17.0 | PDF → PNG |
| opencv-python-headless | 4.10.0.84 | Preprocesamiento |
| Pillow | 11.0.0 | Procesamiento imágenes |

### rund-api (PHP Composer)

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| phpoffice/phpspreadsheet | 5.2 | Excel |
| phpoffice/phpword | 1.4 | Word/DOCX |
| dompdf/dompdf | 3.1 | PDF |
| endroid/qr-code | 6.0.9 | Códigos QR |

---

## 5. Configuraciones Vigentes

### URLs de servicios internos (red Docker)

| Servicio | URL interna | Puerto externo |
|----------|------------|---------------|
| rund-api | `http://rund-api:3000` | :3000 |
| rund-auth | `http://rund-auth:8080` | :8081 |
| rund-core (OpenKM) | `http://rund-core:8080/OpenKM` | :8080 |
| rund-ai | `http://rund-ai:8001` | :8001 |
| rund-ocr | `http://rund-ocr:8000` | :8000 |
| rund-ollama | `http://rund-ollama:11434` | :11434 |
| redis | `redis://rund-redis:6379/0` | :6379 |
| postgres | `postgresql://user:pass@rund-postgres:5432/rund_auth` | :5433 |

### Modelos Ollama activos

| Modelo | Tag | Uso |
|--------|-----|-----|
| gemma4 | e4b | Extracción estructurada + clasificación (modelo principal) |
| gemma2 | 2b | Análisis complejo (fallback) |
| nuextract | latest | Extracción estructurada (legacy) |

### Variables críticas por entorno

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `DEV_FAKE_LOGIN` | `true` | `false` ← CRÍTICO |
| `COOKIE_SECURE` | `false` | `false` (hasta HTTPS) |
| `ENVIRONMENT` | `development` | `production` |
| `FLASK_ENV` | `development` | `production` |

---

## 6. Patrones de Código Establecidos

### PHP — Respuesta estándar de API

```php
// Éxito
return $response->withJson(['success' => true, 'data' => $resultado]);

// Error de validación
return $response->withStatus(400)->withJson(['error' => 'Descripción del error']);

// Sin autorización
return $response->withStatus(401)->withJson(['error' => 'No autenticado']);
```

### PHP — Proteger una ruta con autenticación

```php
// En routes_v2.php
$router->get('/profesores/{cedula}', [ProfesoresController::class, 'show'],
    [AuthMiddleware::authenticate()]);
```

### Angular — Señal reactiva de sesión

```typescript
// En auth.service.ts
readonly usuario = signal<Usuario | null>(null);
readonly estaAutenticado = computed(() => this.usuario() !== null);
readonly esAdmin = computed(() => this.usuario()?.rol === 'admin');
```

### Angular — Llamada HTTP con manejo de error

```typescript
async obtenerProfesor(cedula: string): Promise<Profesor> {
  const resp = await firstValueFrom(
    this.http.get<{ data: Profesor }>(`/api/v2/profesores/${cedula}`)
  );
  return resp.data;
}
```

### Python (rund-ai) — Blueprint de endpoint

```python
from flask import Blueprint, request, jsonify

bp = Blueprint('extract', __name__)

@bp.route('/extract', methods=['POST'])
def extract():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Campo text requerido'}), 400
    resultado = extractor_service.extraer(data['text'], data.get('schema'))
    return jsonify(resultado)
```

---

## 7. Gotchas Conocidos

| Situación | Solución |
|-----------|---------|
| OpenKM no corre en Mac M2 con Docker Desktop sin `platform: linux/amd64` | Agregar `platform: linux/amd64` al servicio `rund-core` en docker-compose.yml |
| rund-auth muestra "degraded" en el primer health check de rund-api | Es un timing issue del primer request. No afecta funcionalidad. Ignorar en desarrollo. |
| Ollama no descarga modelos automáticamente | `docker exec -it rund-ollama bash` → `ollama pull gemma4:e4b` |
| El logout en rund-auth falla silenciosamente si el token ya expiró | Por diseño (best effort). El logout local en rund-api siempre destruye la sesión PHP. |
| ChromaDB queda corrupto después de un kill forzado del contenedor | `docker compose down && docker volume rm rund_ai-cache && docker compose up -d rund-ai` |
| Las claves JWKS no se regeneran automáticamente | Ejecutar `cd rund-auth && npm run gen:jwks` y reiniciar rund-auth |
| SSR falla con `window is not defined` | Envolver en `if (isPlatformBrowser(this.platformId))` o usar `afterNextRender()` |
| `DEV_FAKE_LOGIN` activo en entorno compartido crea puerta trasera | Verificar que `docker-compose.prod.yml` tiene `DEV_FAKE_LOGIN=false` antes de cualquier deploy |
| Los archivos temporales de LibreOffice se acumulan en rund-api | `DELETE /api/v2/archivos/temp/limpiar` o reiniciar el contenedor |
| Build multiplataforma falla si no existe el builder `rund-builder` | `docker buildx create --name rund-builder --use` antes del primer build |

---

## 8. Documentos de Referencia

| Documento | Ubicación | Propósito | Actualizar cuando |
|-----------|-----------|-----------|------------------|
| `CLAUDE.md` | Raíz | Instrucciones para agentes IA, OWASP, git flow | Se agrega tecnología, convención o regla de seguridad |
| `PRD.md` | Raíz | Requisitos de producto, casos de uso, glosario | Se completa una funcionalidad o cambia el roadmap |
| `tech-specs.md` | Raíz | Arquitectura, endpoints, dependencias, patrones | Se cambia arquitectura, API, o dependencias |
| `MEMORY.md` | Raíz | Estado del proyecto, ADRs, gotchas | Al cerrar cada sesión de trabajo relevante |
| `TODO.md` | Raíz | Motor JIT — 2 tareas atómicas activas | Al completar cualquiera de las dos tareas activas |
| `DEPLOY.md` | Raíz | Guía rápida de despliegue | Al cambiar el proceso de deploy |
| `ESTADO_PROYECTO.md` | Raíz | Reporte histórico del sistema de autenticación | Documento de referencia histórico — no actualizar |
| `README.md` | Raíz | Vista general para nuevos desarrolladores | Al cambiar la arquitectura o el stack |
| `docs/2026-03-UAT/` | `docs/` | Documentación de la fase UAT | Al generar nuevas actas, reportes o fichas de prueba |
| `docs/reportes/RUND-Arquitectura-Seguridad.md` | `docs/reportes/` | Reporte formal de arquitectura para ESAP | Al cambiar la arquitectura de seguridad |
| `rund-auth/README.md` | `rund-auth/` | Documentación del servicio de autenticación | Al agregar endpoints o cambiar el flujo de auth |
| `rund-api/docs/` | `rund-api/docs/` | Documentación interna del backend PHP | Al agregar endpoints o cambiar la lógica |
| `instrucciones-inicio.md` | Raíz | Protocolo para documentar proyectos nuevos/existentes | Solo si se refina el proceso de documentación |

---

## 9. Contexto de la Sesión Actual

### Lo que se hizo en sesiones recientes

**14 mayo 2026**
- ✅ Creados `PRD.md`, `tech-specs.md`, `MEMORY.md`, `TODO.md` con motor JIT
- ✅ Actualizado `CLAUDE.md` con secciones OWASP y Git Flow

**19–21 mayo 2026**
- ✅ Simplificación de menú + ítem activo + fecha de nacimiento (rund-mgp#5 + rund-api#1)
- ✅ Hotfix docentes faltantes en desplegable (rund-api#2 + rund-mgp#6)
- ✅ Sección "Extracción de datos" con dashboard de estadísticas (rund-api#3 + rund-mgp#7)
- ✅ API `/extraccion/*` paginada + vista previa accordion (rund-api#4 + rund-mgp#8)

**28 mayo 2026**
- ✅ Reset/retry jobs bloqueados en cola de extracción (rund-ai#2, rund-api#6, rund-mgp#10)
- ✅ Scheduler nocturno completo: CLI PHP + crontab + 4 endpoints REST + panel UI (rund-ai#3, rund-api#7, rund-mgp#11)
- ✅ Clasificación automática IA al subir: ExtractionWorker + webhook + badge FichaDocente (rund-ai#4, rund-api#8, rund-mgp#12)

**02–05 jun 2026**
- ✅ Datos extraídos en ficha del docente (rund-mgp#13)
- ✅ Hotfixes: NG0100, JSON side-car 404, reset carga, refresco edición (rund-mgp#14)
- ✅ Búsqueda semántica con Jaccard token overlap (rund-ai#8, rund-api#11, rund-mgp#15)
- ✅ Validación de consistencia documental 5 checks + Jaccard nombre (rund-ai#9, rund-api#12, rund-mgp#16)
- ✅ Cobertura de tipos en FichaDocente y dashboard (rund-mgp#17, rund-mgp#18)
- ✅ Detalle de campos extraídos por documento en diálogo (rund-mgp#19)
- ✅ 6 hotfixes UX: datos demográficos, fecha extracción, skeletons, dark mode
- ✅ Fix extraction_index.json: UUID estable + _deep_merge + fcntl.flock
- ✅ Fix IA_CLASIFICADO null en ruta multimodal (rund-ai#7)
- ✅ Integración Angular con rund-auth: global middleware + fix loop infinito (rund-api#13, rund-mgp#20)

### Tarea activa

Ver `TODO.md`:
- **TAREA 3** *(única activa)*: Documentación de migración para la OTIC — 3 archivos en `docs/migracion/`: `rund-api-migration-guide.md`, `rund-mgp-component-catalog.md`, `rund-ai-integration-spec.md`.

**Contexto de entrega:** Producto entregado el 05 jun 2026. No se realizarán smoke-tests adicionales. La documentación de migración es el único trabajo pendiente.

**Alcance de entrega (definido 05 jun 2026):**
- `rund-api` y `rund-mgp` → código fuente completo (la OTIC reescribe: PHP→Node.js, Angular→framework desconocido)
- `rund-ai`, `rund-ocr`, `rund-core` → fuentes Docker (Dockerfile + docker-compose); la OTIC construye imágenes sin reescribir

Los documentos de migración deben permitir a un LLM ejecutar la migración semiautomatizada a la plataforma OTIC sin leer el código fuente original.
