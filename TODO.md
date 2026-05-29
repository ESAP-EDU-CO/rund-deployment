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

### TAREA 1 · [FEATURE] Datos extraídos por IA visibles en la ficha del docente

**Etiqueta:** `[FEATURE]`
**Origen:** PRD §4 Objetivo 12 · Motor JIT — 28 mayo 2026
**Prioridad:** ALTA — el índice de extracción ya tiene los JSONs side-car con datos estructurados; mostrarlos en la ficha cierra el loop IA → usuario sin nuevo desarrollo en el backend

**Contexto:**
Cuando el scheduler procesa un documento, genera un JSON side-car en OpenKM con campos extraídos (nombre, cédula, cargo, fechas, etc.). El endpoint `GET /api/v2/extraccion/{cedula}` ya devuelve estos datos paginados. En la ficha del docente (`carga.html` → `mgp-ficha-docente`) solo se ve si hay archivos clasificados por IA pero no qué datos se extrajeron. Se requiere:
1. En `FichaDocente`, llamar a `GET /api/v2/extraccion/{cedula}` al cargar el docente y obtener los documentos con extracción completada
2. Mostrar un panel colapsable "Datos extraídos por IA" con el resumen de campos clave (ej. tipo de documento, campos detectados, confianza, fecha de extracción)
3. El panel solo aparece si existen extracciones completadas para el docente

**Archivos a modificar:**
- `rund-mgp/src/app/compartidos/servicios/data.ts` — método `getExtraccionDocente()` ya existe; usarlo en FichaDocente
- `rund-mgp/src/app/compartidos/componentes/ficha-docente/ficha-docente.ts` — llamada al servicio + signal/propiedad `extraccionesDocente`
- `rund-mgp/src/app/compartidos/componentes/ficha-docente/ficha-docente.html` — panel `p-panel` colapsable con tabla o chips de datos extraídos

**Definición de done:**
- [ ] Al seleccionar un docente con extracciones completadas, aparece el panel "Datos extraídos por IA"
- [ ] El panel muestra al menos: nombre del documento, tipo detectado, confianza y fecha
- [ ] El panel no aparece si no hay extracciones para el docente
- [ ] Sin regresión en la carga de docentes sin datos extraídos

---

### TAREA 3 · [DOC] Documentación de migración e integración para la OTIC

**Etiqueta:** `[DOC]`
**Origen:** Instrucción directa — 28 mayo 2026
**Prioridad:** ESTRATÉGICA — no compite con TAREA 1 y 2; se trabaja en paralelo o al completarlas

**Contexto:**
La OTIC-ESAP integrará `rund-api`, `rund-mgp` y el stack IA/OCR (`rund-ai`, `rund-ocr`, `rund-ollama`) en su plataforma institucional. La migración implicará:
1. **rund-api PHP → Node.js**: reescritura del backend manteniendo los contratos de API
2. **rund-mgp Angular → framework OTIC** (aún desconocido): migración del frontend
3. **rund-ai + rund-ocr + rund-ollama → microservicios OTIC**: integración sin reescritura

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
- [ ] Cada documento se puede entregar a un LLM sin adjuntar código fuente y el LLM puede reproducir la funcionalidad en el framework destino
- [ ] Todos los endpoints tienen ejemplos `curl` funcionales probados contra `localhost`
- [ ] El catálogo de componentes Angular es agnóstico de framework (describe comportamiento, no sintaxis)
- [ ] La spec de integración IA incluye un checklist de verificación post-deploy

---

## Historial de Tareas Completadas

| Fecha | Tarea | Estado | Notas |
|-------|-------|--------|-------|
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
