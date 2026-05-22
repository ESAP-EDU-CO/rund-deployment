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

### TAREA 1 · [OPS] Reset de jobs bloqueados en estado "procesando"

**Etiqueta:** `[OPS]`
**Origen:** Observación directa — 20 mayo 2026 · PRD §6 Roadmap #18
**Prioridad:** MEDIA — 15 documentos bloqueados degradan métricas reales (61% → ~80% tasa de éxito tras reset)

**Contexto:**
El dashboard de Extracción de datos muestra 15 documentos en estado "procesando" con la cola vacía. Son jobs de sesiones anteriores de rund-ai que quedaron sin completar. Necesita:
1. Un endpoint en rund-ai: `POST /reset-stuck-jobs` que marque todos los "procesando" como "pendiente"
2. Un proxy en rund-api: `POST /api/v2/ai/reset-stuck-jobs`
3. Un botón en la sección Extracción de datos, visible solo cuando `procesando > 0`

**Archivos a modificar:**
- `rund-ai/` — nuevo endpoint Flask (Python)
- `rund-api/app/src/Controllers/V2/AIController.php` — método `resetStuckJobs()`
- `rund-api/app/routes_v2.php` — nueva ruta POST
- `rund-mgp/src/app/vistas/extraccion/extraccion.ts/html` — botón condicional

**Definición de done:**
- [ ] `POST http://localhost:8001/reset-stuck-jobs` resetea todos los "procesando" a "pendiente"
- [ ] El endpoint proxiado en rund-api responde 200
- [ ] El botón aparece en el dashboard solo cuando `procesando > 0` (actualmente: 15)
- [ ] Tras el reset, el dashboard muestra los jobs como "pendiente" al hacer clic en Actualizar

---

### TAREA 2 · [FEATURE] Scheduler asíncrono de extracción en horas muertas

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

## Historial de Tareas Completadas

| Fecha | Tarea | Estado | Notas |
|-------|-------|--------|-------|
| 14 may 2026 | [SEGURIDAD] Integrar autenticación en rund-mgp (Angular) | ⏸ Postergada | Desplazada por prioridad operacional — se retoma en fase de seguridad |
| 19 may 2026 | [FEATURE] Simplificar menú + ítem activo + fecha de nacimiento | ✅ Completada | rund-mgp#5 + rund-api#1 fusionados |
| 20 may 2026 | [HOTFIX] Docentes faltantes en desplegable Editar documentación | ✅ Completada | rund-api#2 + rund-mgp#6. Causa: search/find sin categorías + nombre de cédula no estándar |
| 20 may 2026 | [FEATURE] Sección "Extracción de datos" con dashboard | ✅ Completada | rund-api#3 + rund-mgp#7 |
| 21 may 2026 | [FEATURE] API /extraccion/* + Vista previa con accordion + datos extraídos | ✅ Completada | rund-api#4 + rund-mgp#8. Endpoints paginados, JSON side-car, AccordionModule |

---

## Log del Motor JIT

| Fecha | Comparación PRD vs MEMORY | Tareas seleccionadas | Criterio |
|-------|--------------------------|---------------------|---------|
| 14 may 2026 | PRD §4 Obj 7 y 8 en 🚧. Seguridad: 3 gaps. | Rutas API + auth Angular | Prioridad seguridad. |
| 14 may 2026 | Instrucción directa: simplificar menú. | Menú + rutas API | Feature a P1. |
| 19 may 2026 | Hotfix crítico + carga masiva sin visibilidad. | Hotfix dropdown + extracción | Hotfix → P0; visibilidad → P1. |
| 20 may 2026 | Obj 12 completado. 15 jobs bloqueados. API JSONs pendiente. | API JSONs + reset bloqueados | Operabilidad primero. |
| 21 may 2026 | Obj 14 completado (API JSONs + accordion + datos extraídos). 15 docs en "procesando" con cola vacía. Obj 13 (scheduler) sin iniciar. | Reset jobs bloqueados + scheduler extracción | Reset desbloquea métricas reales; scheduler habilita carga inicial de ~12000 docs. |
