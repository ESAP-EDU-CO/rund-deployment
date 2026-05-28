# TODO.md — Motor JIT · RUND

> **Motor Just-In-Time:** Este archivo contiene siempre exactamente **dos tareas atómicas** —
> las siguientes más prioritarias según el estado real del proyecto.
>
> **Cómo actualizar:** Al completar una tarea, moverla al historial y ejecutar el motor JIT:
> comparar `PRD.md` (objetivos) con `MEMORY.md` (estado real) → escribir las nuevas 2 tareas.
>
> **Criterio de atomicidad:** Una tarea es atómica si puede completarse en una sola sesión,
> modifica máximo 3 archivos, y tiene una definición de done verificable sin ambigüedad.

---

## Tareas Activas

### TAREA 1 · [FEATURE] Scheduler asíncrono de extracción en horas muertas

**Etiqueta:** `[FEATURE]`
**Origen:** PRD §4 Objetivo 13 + §6 Roadmap #15 · Backlog — 20 mayo 2026
**Prioridad:** ALTA — 77 documentos en el sistema, muchos pendientes o con error; la carga inicial de ~12 000 requiere procesamiento continuo

**Contexto:**
El sistema de extracción (rund-ai) procesa documentos de forma asíncrona cuando se suben, pero no tiene mecanismo para procesar el backlog pendiente fuera del horario de carga. Se requiere un scheduler configurable que:
- Se ejecute en rangos horarios definidos (ej. 22:00–06:00)
- Tome todos los documentos en estado "pendiente" o "error" del índice
- Los encole en rund-ai para reprocesamiento
- Se pueda iniciar/pausar/configurar desde la sección Extracción de datos

**Archivos a modificar/crear:**
- `rund-api/app/cli/scheduler_extraccion.php` — script CLI nuevo
- `rund-api/cron/rund-crontab` — agregar tarea del scheduler
- `rund-api/app/src/Controllers/V2/AIController.php` — endpoints de control del scheduler
- `rund-mgp/src/app/vistas/extraccion/` — controles de inicio/pausa/configuración en UI

**Definición de done:**
- [ ] El scheduler encola documentos pendientes/error en rund-ai durante el rango horario
- [ ] Los endpoints `POST /api/v2/ai/scheduler/start`, `/pause`, `/status` responden correctamente
- [ ] Los controles en la UI cambian el estado visible del scheduler
- [ ] El dashboard muestra el estado "activo / pausado" del scheduler

---

### TAREA 2 · [FEATURE] Clasificación automática al subir un documento

**Etiqueta:** `[FEATURE]`
**Origen:** PRD §4 Objetivo 9 · Roadmap #3 — 28 mayo 2026
**Prioridad:** ALTA — el endpoint `/classify` ya existe en rund-ai pero no está conectado al flujo de carga; conectarlo da clasificación correcta ≥ 80 % de los casos sin nuevo desarrollo en el backend AI

**Contexto:**
Cuando el gestor sube un documento en la sección "Editar documentación", rund-api lo guarda en OpenKM pero no invoca la clasificación automática. El endpoint `POST /api/v2/ai/extraer` (y el clasificador en rund-ai) ya existen. Se requiere:
1. En rund-api, al finalizar la subida exitosa de un archivo, enviar el documento a `POST http://rund-ai:8001/classify` de forma asíncrona (fire-and-forget)
2. Si la confianza es ≥ 0.8, actualizar la categoría del documento en OpenKM automáticamente
3. Mostrar en la UI un indicador ("clasificado automáticamente") en la ficha del documento cuando la categoría fue asignada por IA

**Archivos a modificar:**
- `rund-api/app/src/Handlers/FileHandlers.php` — llamada asíncrona a rund-ai tras subida exitosa
- `rund-api/app/src/Controllers/V2/AIController.php` — método `clasificar()` si no existe
- `rund-mgp/src/app/compartidos/componentes/ficha-docente/ficha-docente.ts/html` — badge "IA" en documentos clasificados automáticamente

**Definición de done:**
- [ ] Al subir un PDF, rund-api invoca `POST /classify` en rund-ai (sin bloquear la respuesta)
- [ ] Si confianza ≥ 0.8, la categoría del documento en OpenKM se actualiza automáticamente
- [ ] La ficha del docente muestra un badge o indicador en documentos con categoría asignada por IA
- [ ] La subida sigue funcionando aunque rund-ai no responda (degradación elegante)

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
