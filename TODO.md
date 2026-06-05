# TODO.md — Motor JIT · RUND

> **Motor Just-In-Time:** Este archivo contiene normalmente **dos tareas atómicas** —
> las siguientes más prioritarias según el estado real del proyecto.
> La TAREA 3 es una excepción explícita: es estratégica, no desplaza las operacionales.
>
> **Cómo actualizar:** Al completar una tarea, moverla al historial y ejecutar el motor JIT:
> comparar `PRD.md` (objetivos) con `MEMORY.md` (estado real) → escribir las nuevas 2 tareas.
>
> **Criterio de atomicidad:** Una tarea es atómica si puede completarse en una sola sesión,
> modifica máximo 3 archivos, y tiene una definición de done verificable sin ambigüedad.

---

## Tareas Activas

### TAREA 3 · [DOC] Documentación de migración e integración para la OTIC

**Etiqueta:** `[DOC]`
**Origen:** Instrucción directa — 28 mayo 2026
**Prioridad:** ESTRATÉGICA — no compite con TAREA 1 y 2; se trabaja en paralelo o al completarlas

**Alcance de entrega (definido 05 jun 2026):**
- `rund-api` y `rund-mgp` → **código fuente completo** (la OTIC reescribe: PHP→Node.js, Angular→framework desconocido)
- `rund-ai`, `rund-ocr`, `rund-core` → **fuentes Docker** (Dockerfile + docker-compose); la OTIC construye imágenes sin reescribir

**Contexto:**
La OTIC-ESAP integrará `rund-api`, `rund-mgp` y el stack IA/OCR (`rund-ai`, `rund-ocr`, `rund-ollama`) en su plataforma institucional. La migración implicará:
1. **rund-api PHP → Node.js**: reescritura del backend manteniendo los contratos de API
2. **rund-mgp Angular → framework OTIC** (aún desconocido): migración del frontend
3. **rund-ai + rund-ocr + rund-ollama → microservicios OTIC**: integración sin reescritura (se entregan como imágenes Docker)

El objetivo del documento es que un LLM (Claude Code, Codex, Gemini Code, etc.) pueda ejecutar cada migración de forma **semiautomatizada**, sin necesidad de leer el código fuente original.

**Documentos a producir (un archivo por componente):**

`docs/migracion/rund-api-migration-guide.md`
- Catálogo completo de endpoints (método, ruta, request, response, errores, ejemplos `curl`)
- Lógica de negocio crítica: generación de certificados, BFF de autenticación, proxy a OpenKM
- Patrones y convenciones: estructura de carpetas, manejo de errores, middleware chain
- Dependencias externas: OpenKM API, rund-auth JWKS, rund-ai, rund-ocr
- Variables de entorno requeridas con descripción y valores de ejemplo
- Gotchas y decisiones de diseño (ADRs relevantes)

`docs/migracion/rund-mgp-component-catalog.md`
- Inventario de todas las vistas y componentes con su propósito y props/inputs
- Mapa de rutas (Angular Router → rutas equivalentes agnósticas de framework)
- Servicios HTTP: cada método con URL, parámetros y forma de la respuesta
- Gestión de estado: signals, computed, stores utilizados
- Patrones UI recurrentes: tablas paginadas, acordeones, formularios de carga
- Assets críticos: iconos, estilos globales, tokens de diseño PrimeNG

`docs/migracion/rund-ai-integration-spec.md`
- Contratos de API completos de rund-ai (todos los endpoints con ejemplos)
- Contratos de API de rund-ocr y rund-ollama (endpoints relevantes)
- Flujos de datos: OCR → extracción estructurada → índice → callback
- Configuración Docker: variables de entorno, volúmenes, healthchecks, red
- Esquemas de extracción (6 tipos de documento) con campos y validaciones
- Instrucciones para sustituir servicios equivalentes si el LLM destino usa otro stack

**Archivos a crear:**
- `docs/migracion/rund-api-migration-guide.md`
- `docs/migracion/rund-mgp-component-catalog.md`
- `docs/migracion/rund-ai-integration-spec.md`

**Definición de done:**
- [x] Cada documento se puede entregar a un LLM sin adjuntar código fuente y el LLM puede reproducir la funcionalidad en el framework destino
- [x] Todos los endpoints tienen ejemplos `curl` funcionales probados contra `localhost`
- [x] El catálogo de componentes Angular es agnóstico de framework (describe comportamiento, no sintaxis)
- [x] La spec de integración IA incluye un checklist de verificación post-deploy

**Estado: ✅ COMPLETADA — 05 jun 2026**

---

## Historial de Tareas Completadas

| Fecha | Tarea | Estado | Notas |
|-------|-------|--------|-------|
| 05 jun 2026 | [OPS] Verificar flujo LDAP real en entorno de dev | ⏸ Cancelada | Producto entregado sin smoke-tests adicionales. Infraestructura auth completa (rund-api#13 + rund-mgp#20). |
| 14 may 2026 | [SEGURIDAD] Integrar autenticación en rund-mgp (Angular) | ⏸ Postergada | Desplazada por prioridad operacional — se retoma en fase de seguridad |
| 19 may 2026 | [FEATURE] Simplificar menú + ítem activo + fecha de nacimiento | ✅ Completada | rund-mgp#5 + rund-api#1 fusionados |
| 20 may 2026 | [HOTFIX] Docentes faltantes en desplegable Editar documentación | ✅ Completada | rund-api#2 + rund-mgp#6. Causa: search/find sin categorías + nombre de cédula no estándar |
| 20 may 2026 | [FEATURE] Sección "Extracción de datos" con dashboard | ✅ Completada | rund-api#3 + rund-mgp#7 |
| 21 may 2026 | [FEATURE] API /extraccion/* + Vista previa con accordion + datos extraídos | ✅ Completada | rund-api#4 + rund-mgp#8. Endpoints paginados, JSON side-car, AccordionModule |
| 28 may 2026 | [OPS] Reset de jobs bloqueados en estado "procesando" | ✅ Completada | rund-ai: `reset_stuck_jobs()` + `POST /reset-stuck-jobs`. rund-api: `resetStuckJobs()` + ruta. rund-mgp: botón condicional en dashboard de extracción |
| 28 may 2026 | [OPS] Re-encolar documentos en "error" → "pendiente" | ✅ Completada | rund-ai: `retry_error_jobs()` + `POST /retry-error-jobs`. rund-api: `retryErrorJobs()` + ruta. rund-mgp: botón "Re-encolar errores (N)" condicional. PRs: rund-ai#2, rund-api#6, rund-mgp#10 |
| 28 may 2026 | [FEATURE] Scheduler asíncrono de extracción en horas muertas | ✅ Completada | rund-ai: `POST /queue/enqueue-pending` + `get_pending_documents()`. rund-api: CLI `scheduler_extraccion.php` + crontab `*/30 22-6h` + 4 rutas REST (`/scheduler/status|start|pause|config`) + `scheduler_state.json`. rund-mgp: panel con tag Activo/Pausado, toggle, configuración de rango horario. PRs: rund-ai#3, rund-api#7, rund-mgp#11 |
| 28 may 2026 | [FEATURE] Clasificación automática al subir un documento | ✅ Completada | rund-ai: ClassifierService integrado en ExtractionWorker (tras OCR, confianza ≥ 0.8 → ia_classification en callback) + fix Dockerfile `--create-home`. rund-api: AIController aplica categoría `IA_CLASIFICADO/{tipo}` en OpenKM al recibir callback. rund-mgp: DatoArchivo+ia_clasificado/ia_tipo, data.ts detecta categoría IA, FichaDocente muestra panel "Clasificados por IA" con p-tag microchip. PRs: rund-ai#4, rund-api#8, rund-mgp#12 |
| 28 may 2026 | [FEATURE] Auto-refresh del dashboard de extracción con cola activa | ✅ Completada | rund-mgp: `interval(30_000)` + `takeUntil(destroy$)` + `filter(colaActiva > 0)` en Extraccion. Badge `p-tag info + pi-sync` visible mientras auto-refresh activo. `ngOnDestroy` sin memory leaks. PR: rund-mgp#12 (mismo branch clasificacion-automatica) |
| 02 jun 2026 | [FEATURE] Datos extraídos por IA visibles en la ficha del docente | ✅ Completada | rund-mgp: `@Input() cedula` en FichaDocente + `cargarExtracciones()` reactivo + panel colapsable `p-panel` con `p-table` (nombre, tipo, confianza, fecha). Skeleton de carga. `ngOnDestroy` sin leaks. carga.html pasa `[cedula]="profesorSeleccionado[1]"`. PR: rund-mgp#13 |
| 02 jun 2026 | [HOTFIX] Reset automático de CargaDocumento + refresco de Editar documentación | ✅ Completada | rund-mgp#14 (feature/reset-carga-refresh-edicion). 3 fixes: (1) NG0100 en CargaDocumento — side effects en progresoCarga() movidos a ngDoCheck+Promise.resolve; (2) JSON side-car sin extracción devuelve 200+null en vez de 404; (3) DataService.archivosCargados$ Subject notifica a Edicion para refrescar dropdown y árbol de archivos. |
| 02 jun 2026 | [HOTFIX] by_category/professors dict corruption en extraction_index_service.py | ✅ Completada | rund-ai: PHP json_encode convierte `{}` vacío a `[]` → Python falla al indexar como dict. Fix en `_load_index()`: normaliza list→dict para `by_category` y `professors`. PR: rund-ai fix/extraction-index-dict-corruption |
| 03 jun 2026 | [HOTFIX] IA_CLASIFICADO nunca se aplica en OpenKM tras extracción | ✅ Completada | rund-ai: `ia_classification` solo se generaba en `_extract_with_ocr()`, nunca en la ruta multimodal activa. Fix: fallback `job.tipo_documento` con confidence=0.9 antes del callback. Webhook y ruta PHP ya existían y funcionaban correctamente. PR: rund-ai#7 |
| 03 jun 2026 | [FEATURE] Búsqueda semántica de documentos | ✅ Completada | rund-ai: SearchService Jaccard token overlap sobre extraction index + POST /search. rund-api: GET /extraccion/buscar proxy. rund-mgp: panel búsqueda con input + tabla (nombre, tipo, similitud, cédula) + estado vacío. PRs: rund-ai#8, rund-api#11, rund-mgp#15 |
| 04 jun 2026 | [FEATURE] Validación de consistencia entre documentos de un profesor | ✅ Completada | rund-ai#9: ValidatorService 5 checks metadatos + nombre_inconsistente Jaccard<0.75 (detecta errores OCR como "Fakeline"≠"Jakeline"); fix _schema() normaliza TITULOS_DE_FORMACION→certificado_academico; validate.py deja de ser stub 501. rund-api#12: validateDocente() + POST /extraccion/validar/{cedula}. rund-mgp#16: validateDocente() en Data, botón Validar + panel issues (skeleton, score tag, severidades, estado vacío). |
| 04 jun 2026 | [FEATURE] Cobertura de tipos de documento en FichaDocente | ✅ Completada | rund-mgp: getter `coberturaTipos` (6 tipos estándar vs `extraccionesDocente` ya cargado) + panel "Cobertura documental" con chips success/danger antes de "Datos extraídos por IA". Estado vacío cuando `extraccionesDocente.length===0`. Sin nueva API. |
| 04 jun 2026 | [FEATURE] Estadísticas de cobertura agregada en dashboard de Extracción | ✅ Completada | rund-mgp#17 (merged): getter `coberturaPorTipo` + panel tarjetas. Fix aliases OpenKM→schema AI (por_categoria usa nombres de carpeta, no nombres de schema). Desplegado en Docker local. |
| 04 jun 2026 | [FEATURE] Cobertura documental con chips en FichaDocente | ✅ Completada | rund-mgp#18 (merged): getter `coberturaTipos` + `coberturaTiposPresentes` (arrow fn no permitida en templates). Aliases OpenKM→schema AI. Fix lint CI (arrow fn en binding). |
| 05 jun 2026 | [FEATURE] Detalle de campos extraídos por documento en FichaDocente | ✅ Completada | rund-mgp#19 (merged): botón `pi-eye` por fila + `p-dialog` carga lazy vía `getJsonExtraido`. 100% frontend: campos en `datos.data` del side-car. `isObject` flag + `<pre>` para objetos anidados. Width fijo eliminado del diálogo. |
| 05 jun 2026 | [FEATURE] Integración de Angular con rund-auth — server-side auth enforcement | ✅ Completada | rund-api#13 (merged): `addGlobalMiddleware` en `routes_v2.php` — whitelist 5 prefijos públicos, resto requiere sesión PHP válida. rund-mgp#20 (merged): `if (!estaAutenticado()) return` en `inicializa()` corta loop infinito (data.init()→401→NavigationEnd→data.init()). Infraestructura Angular (Auth service, interceptor, guard, Login component) ya existía completa. |
| 03 jun 2026 | [HOTFIX] 6 hotfixes UX — datos demográficos, fecha extracción, skeletons carga, dark mode | ✅ Completada | (1) `DocumentService.php`: búsqueda cédula por categoría `TIPO/CEDULA` en lugar de `name=cedula` → campos Género/Grupo étnico poblados. (2) `ficha-docente.ts`: selector `multiple` con valor `string` normalizado a array → campo Posgrado poblado. (3) `ficha-docente.html`: `date` pipe sin locale `es-CO` no registrado → Fecha extracción visible. (4) `carga.ts/html`: `p-skeleton` mientras carga CSV → elimina "No results found". (5) `edicion.ts`: progreso `cargandoProfesores` movido post-await → barra real. (6) `app.ts` + `extraccion.scss`: clase `app-dark` en `<html>` sincronizada con `prefers-color-scheme` + `:host-context` en scheduler-panel. rund-api: commit `78fb771`. rund-mgp: commit `b167d29`. |
| 03 jun 2026 | [HOTFIX] extraction_index.json nunca persiste — Desglose por categoría siempre vacío | ✅ Completada | 3 bugs encadenados: (1) `subirJson` usaba `findArchivo` (índice búsqueda stale) → devolvía null → `createSimple` fallaba con 500 porque el archivo ya existía; fix: `getFileUuidByPath` vía `repository/getNodeUuid` (ruta directa). (2) `_load_index()` no reconstruía claves faltantes → `KeyError: 'total_documents'/'statistics'` en `add_document()` y `get_statistics()`; fix: `_deep_merge()` sobre `_create_empty_index()`. (3) Gunicorn 4 workers → race condition con threading.Lock(); fix: 1 worker + 4 threads + `fcntl.flock`. PRs: rund-api fix/categorias-openkm-sobreescritura, rund-ai fix/extraction-index-dict-corruption |

---

## Log del Motor JIT

| Fecha | Comparación PRD vs MEMORY | Tareas seleccionadas | Criterio |
|-------|--------------------------|---------------------|---------|
| 14 may 2026 | PRD §4 Obj 7 y 8 en 🚧. Seguridad: 3 gaps. | Rutas API + auth Angular | Prioridad seguridad. |
| 14 may 2026 | Instrucción directa: simplificar menú. | Menú + rutas API | Feature a P1. |
| 19 may 2026 | Hotfix crítico + carga masiva sin visibilidad. | Hotfix dropdown + extracción | Hotfix → P0; visibilidad → P1. |
| 20 may 2026 | Obj 12 completado. 15 jobs bloqueados. API JSONs pendiente. | API JSONs + reset bloqueados | Operabilidad primero. |
| 21 may 2026 | Obj 14 completado (API JSONs + accordion + datos extraídos). 15 docs en "procesando" con cola vacía. Obj 13 (scheduler) sin iniciar. | Reset jobs bloqueados + scheduler extracción | Reset desbloquea métricas reales; scheduler habilita carga inicial de ~12000 docs. |
| 28 may 2026 | Reset jobs bloqueados completado. Scheduler sin iniciar (TAREA 1). Clasificador existente sin conectar al flujo de subida (Obj 9). | Scheduler extracción + Clasificación automática al subir | Scheduler es P1 por volumen (~12000 docs pendientes); clasificación es P2 por impacto operativo inmediato y bajo costo (endpoint ya existe). |
| 28 may 2026 | Retry-error-jobs completado. Instrucción directa: crear documentación para migración/integración OTIC. | TAREA 3 añadida como excepción estratégica | Documentación habilita migración semiautomatizada por LLM; no compite con TAREA 1 y 2 operacionales. |
| 28 may 2026 | Scheduler completado (rund-ai#3, rund-api#7, rund-mgp#11). Cola nocturna operativa. Clasificación automática sigue sin conectar (Obj 9). Dashboard sin auto-refresh durante runs activos. | Clasificación automática al subir (TAREA 1) + Auto-refresh dashboard cola activa (TAREA 2) | Clasificación cierra el loop upload→AI; auto-refresh permite monitoreo del scheduler sin intervención manual. |
| 28 may 2026 | Clasificación automática completada (rund-ai#4, rund-api#8, rund-mgp#12). Badge IA en ficha docente operativo. Datos extraídos (JSON side-car) visibles solo en dashboard pero no en ficha del docente. | Auto-refresh dashboard (TAREA 1) + Datos extraídos en ficha docente (TAREA 2) | Auto-refresh cierra loop de monitoreo del scheduler; datos extraídos expone el valor de la IA directamente al gestor en el flujo de carga. |
| 28 may 2026 | Auto-refresh completado (rund-mgp#12). Dashboard polling reactivo sin leaks. Datos extraídos (JSON side-car) aún no visibles en ficha docente. | Datos extraídos en ficha docente (TAREA 1 renombrada) + siguiente JIT pendiente | Datos extraídos IA en ficha es la pieza final del loop upload→OCR→AI→UI visible para el gestor. |
| 02 jun 2026 | Datos extraídos en ficha completados (rund-mgp#13). Loop OCR→IA→UI cerrado. ChromaDB implementada en rund-ai pero sin endpoint proxy ni UI (⏳ sin testing). | Búsqueda semántica (TAREA 2) + TAREA 3 doc sigue activa | Búsqueda semántica expone el valor de ChromaDB sin nuevo desarrollo en rund-ai; solo proxy PHP + campo en UI. |
| 02 jun 2026 | Hotfixes UX completados (rund-mgp#14: NG0100, 404 side-car, reset carga, refresco edición). Bug crítico by_category/professors en rund-ai corregido (commit pendiente). Prueba flujo completo: webhook POST /api/v2/webhooks/extraction-complete devuelve 404 → IA_CLASIFICADO no se aplica en OpenKM. Búsqueda semántica desplazada. | Webhook hotfix (TAREA 2) + TAREA 3 doc sigue activa | Webhook es P0: sin él la categorización IA en OpenKM nunca se completa tras extracción. |
| 03 jun 2026 | Hotfixes extraction_index completados (3 bugs: subirJson stale UUID, _load_index KeyError, Gunicorn race condition). Desglose por categoría operativo. docker-compose ollama platform:arm64 añadido. Webhook 404 sigue pendiente. | Webhook hotfix (TAREA 2) sigue como P0 + TAREA 3 doc sigue activa | Webhook es el último eslabón roto del loop upload→AI→OpenKM. |
| 03 jun 2026 | Webhook operativo (ruta existía, bug real: ia_classification=null en ruta multimodal). Loop upload→OCR→AI→IA_CLASIFICADO→OpenKM cerrado. PRs: rund-ai#7. | Búsqueda semántica (TAREA 2 actualizada) + TAREA 3 doc | Búsqueda semántica es la siguiente pieza de valor sin nuevo desarrollo en rund-ai. |
| 03 jun 2026 | 6 hotfixes UX completados (ver historial). Ramas limpiadas. Búsqueda semántica y TAREA 3 doc siguen activas. | TAREA 2 búsqueda semántica + TAREA 3 doc | Hotfixes no bloquean TAREA 2; búsqueda semántica sigue siendo la próxima pieza de valor. |
| 03 jun 2026 | Búsqueda semántica completada (rund-ai#8, rund-api#11, rund-mgp#15). SearchService implementado con Jaccard token overlap. Panel búsqueda en UI con tabla resultados. POST /validate en rund-ai es stub ⏳ sin testing, igual que /search lo era. | Validación de consistencia (TAREA 1) + TAREA 3 doc | Validación cierra el loop de calidad documental; mismo patrón que búsqueda (proxy PHP + UI Angular, rund-ai ya tiene el endpoint). |
| 04 jun 2026 | Validación de consistencia completada (rund-ai#9, rund-api#12, rund-mgp#16). Cobertura de tipos completada (rund-mgp: getter coberturaTipos + panel chips). by_category en extraction_index operativo. Próxima brecha: dashboard de extracción muestra totales globales pero no desglose por tipo. `by_category` ya disponible en `/extraccion/estadisticas`. | Cobertura agregada en dashboard Extracción (TAREA 2) + TAREA 3 doc | Cobertura individual ya visible en FichaDocente; la vista agregada completa la perspectiva de gestión sin nueva API. |
| 04 jun 2026 | Cobertura agregada completada (rund-mgp#17 merged, fix aliases OpenKM→schema AI incluido). rund-mgp#18 abierta para coberturaTipos en FichaDocente (cherry-pick de commit huérfano). Local limpio: main actualizado, ramas feature eliminadas, remote-tracking refs purgadas. | Detalle de campos extraídos en FichaDocente (TAREA 2) + TAREA 3 doc | Mostrar los campos extraídos cierra el loop IA→UI; el gestor puede verificar calidad de la extracción sin entrar al JSON side-car en OpenKM. |
| 04 jun 2026 | rund-mgp#18 merged (coberturaTipos FichaDocente + fix aliases + fix lint CI arrow fn). Ambas PRs merged, repo limpio. Aliases OpenKM→schema AI ahora consistentes en FichaDocente y dashboard Extracción. | Detalle de campos extraídos en FichaDocente (TAREA 2) + TAREA 3 doc | Próxima pieza de valor: gestor ve la lista de extracciones pero no los campos reales (número cédula, institución, cargo). |
| 04 jun 2026 | Validación de consistencia completada (rund-ai#9, rund-api#12, rund-mgp#16 ✅ merged). ValidatorService: 5 checks de metadatos + nombre_inconsistente Jaccard (detecta "Fakeline"≠"Jakeline"). Fix normalización tipo_documento vía DOCUMENT_TYPE_TO_SCHEMA. | Cobertura de tipos de documento en FichaDocente (TAREA 1) + TAREA 3 doc | Cobertura es la siguiente pieza de valor: usa extraccionesDocente ya cargado, sin nueva API, muestra al gestor qué tipos faltan en la hoja de vida. |
| 05 jun 2026 | Detalle de campos extraídos completado (rund-mgp#19 merged). Campos en datos.data del side-car (no datos_extraidos). isObject+pre para objetos anidados. Width fijo eliminado del diálogo. Rama eliminada, repo limpio. Sistema de autenticación (rund-auth ya desplegado con LDAP+JWT) sigue sin conectarse al frontend Angular. | Integración Angular con rund-auth (TAREA 2) + TAREA 3 doc | Auth es el gap de seguridad más crítico: rund-auth está listo, solo falta el flujo login→JWT→interceptor en Angular. |
| 05 jun 2026 | Auth integration completada (rund-api#13 + rund-mgp#20 merged). Global middleware PHP enforces sesión en todas las rutas /api/v2. Fix loop infinito data.init() en Angular. Infraestructura Angular de auth ya existía completa (Auth service, interceptor, authGuard, Login component). Repos limpios. | Verificar flujo LDAP real en entorno dev (TAREA 2 nueva) + TAREA 3 doc | Código completo; queda smoke-test del login real con DEV_FAKE_LOGIN y con LDAP. |
| 05 jun 2026 | Producto entregado tal como está. Testing en producción y verificación LDAP cancelados. TAREA 2 eliminada. Solo TAREA 3 (documentación migración OTIC) activa. | Solo TAREA 3 doc | Entrega del producto sin smoke-tests adicionales. |
