# rund-ai Integration Spec — Microservicios IA/OCR

> **Propósito:** Guía de integración para los microservicios `rund-ai`, `rund-ocr` y `rund-ollama`.
> Estos servicios se entregan como **imágenes Docker** (build desde Dockerfile); la OTIC **no los reescribe**,
> solo los integra. Este documento describe todos los contratos de API, flujos de datos, configuración Docker
> y checklist de verificación post-deploy.
>
> **Fecha de escritura:** 05 jun 2026
> **Versiones documentadas:** rund-ai commit rund-ai#9, rund-ocr v1.0.0

---

## Índice

1. [Arquitectura de los Microservicios](#1-arquitectura-de-los-microservicios)
2. [rund-ai — API Completa](#2-rund-ai--api-completa)
   - 2.1 [Cola de Procesamiento](#21-cola-de-procesamiento)
   - 2.2 [Extracción Estructurada](#22-extracción-estructurada)
   - 2.3 [Clasificación](#23-clasificación)
   - 2.4 [Búsqueda Semántica](#24-búsqueda-semántica)
   - 2.5 [Validación de Consistencia](#25-validación-de-consistencia)
   - 2.6 [Índice de Extracción](#26-índice-de-extracción)
3. [rund-ocr — API Completa](#3-rund-ocr--api-completa)
4. [rund-ollama — API de Modelos LLM](#4-rund-ollama--api-de-modelos-llm)
5. [Flujos de Datos End-to-End](#5-flujos-de-datos-end-to-end)
6. [Schemas de Extracción (6 tipos)](#6-schemas-de-extracción-6-tipos)
7. [Extraction Index — Estructura de Datos](#7-extraction-index--estructura-de-datos)
8. [Configuración Docker](#8-configuración-docker)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Integración desde rund-api (Node.js)](#10-integración-desde-rund-api-nodejs)
11. [Sustitución de Servicios Equivalentes](#11-sustitución-de-servicios-equivalentes)
12. [Checklist de Verificación Post-Deploy](#12-checklist-de-verificación-post-deploy)

---

## 1. Arquitectura de los Microservicios

```
┌──────────────────────────────────────────────┐
│              rund-api (Node.js)               │
│                                              │
│  • Proxy de llamadas a rund-ai               │
│  • Webhook receiver (extraction-complete)    │
│  • Scheduler CLI (encola vía rund-ai)        │
└──────────────┬───────────────────────────────┘
               │ HTTP (red interna Docker)
               ▼
┌──────────────────────────────────┐
│          rund-ai (Python Flask)  │
│  Puerto: 8001                    │
│                                  │
│  ┌─────────────────────────┐     │
│  │  ExtractionQueue (FIFO) │     │
│  └───────────┬─────────────┘     │
│              │                   │
│  ┌─────────────────────────┐     │
│  │  WorkerPool (3 workers) │     │
│  │  ┌───────────────────┐  │     │
│  │  │ Worker 1          │  │     │  ←──── rund-ocr:8000
│  │  │ Worker 2          │  │     │  ←──── rund-ollama:11434
│  │  │ Worker 3          │  │     │  ←──── rund-api:3000 (internos)
│  │  └───────────────────┘  │     │
│  └─────────────────────────┘     │
│                                  │
│  ExtractionIndexService          │
│  (extraction_index.json en OpenKM│
│  + fcntl.flock anti-race)        │
└──────────────────────────────────┘

┌────────────────────────────────────────┐
│        rund-ocr (Python Flask)         │
│  Puerto: 8000                          │
│  Motor: PaddleOCR 2.9.1               │
│  Preprocesamiento: OpenCV              │
│  Idiomas: español (es), inglés (en)    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│        rund-ollama (Ollama)            │
│  Puerto: 11434                         │
│  Modelo activo: gemma4:e4b (~7.2GB)   │
│  Modelo backup: gemma2:2b (~2GB)      │
│  Modo: 1 worker + 4 threads + flock   │
└────────────────────────────────────────┘
```

**Modo de entrega:** Los tres servicios se entregan como Dockerfiles. La OTIC los construye con `docker compose build` y los ejecuta. **No requieren modificación de código.**

**Comunicación:** Todos en la misma red Docker (`rund-network`). Se comunican por nombre de contenedor.

---

## 2. rund-ai — API Completa

**Base URL:** `http://rund-ai:8001` (interno) · `http://localhost:8001` (dev)

**No requiere autenticación.** Solo accesible desde la red Docker interna.

---

### 2.1 Cola de Procesamiento

#### POST /queue/add-batch
Añade documentos a la cola FIFO para procesamiento asíncrono. **Responde inmediatamente (202)** — el procesamiento ocurre en background.

**Request:**
```json
{
  "documents": [
    {
      "document_id": "uuid-del-archivo-en-openkm",
      "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
      "tipo_documento": "cedula"
    }
  ],
  "callback_url": "http://rund-api:3000/api/v2/ai/webhook/extraction-complete"
}
```

**Campos `documents`:**
- `document_id` (string, requerido): UUID del archivo en OpenKM
- `file_path` (string, requerido): Ruta completa en OpenKM — debe contener `HOJAS_DE_VIDA/{cedula}/` para extraer la cédula
- `tipo_documento` (string, requerido): Nombre del tipo de documento (ver §6 para valores válidos)

**Respuesta 202:**
```json
{
  "success": true,
  "queued": 1,
  "queue_size": 45,
  "total_queued": 1500
}
```

**Errores:**
- `400`: Lista de documentos vacía
- `500`: Error interno

```bash
curl -X POST http://localhost:8001/queue/add-batch \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "document_id": "16acbc5c-4d9d-4152-a39a-9783a1536943",
        "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
        "tipo_documento": "cedula"
      }
    ],
    "callback_url": "http://rund-api:3000/api/v2/ai/webhook/extraction-complete"
  }'
```

---

#### GET /queue/stats
Estadísticas actuales de la cola.

```json
{
  "success": true,
  "queue_size": 25,
  "total_queued": 1500,
  "total_completed": 1400,
  "total_failed": 50,
  "uptime_seconds": 86400
}
```

```bash
curl http://localhost:8001/queue/stats
```

---

#### GET /queue/job/{document_id}
Estado de un job específico.

```json
{
  "success": true,
  "job": {
    "document_id": "16acbc5c-...",
    "file_path": "/okm:root/.../cedula.pdf",
    "tipo_documento": "cedula",
    "status": "processing",
    "started_at": "2026-06-05T22:15:00",
    "completed_at": null,
    "retry_count": 0,
    "max_retries": 3,
    "ocr_time": 0.0,
    "ai_time": 12.3,
    "total_time": null
  }
}
```

**Estados posibles:** `queued`, `processing`, `completed`, `failed`

---

#### POST /queue/enqueue-pending
Lee todos los documentos en estado `"pendiente"` del índice y los encola. **Usado por el scheduler nocturno.**

**Request (opcional):**
```json
{ "callback_url": "http://rund-api:3000/api/v2/ai/webhook/extraction-complete" }
```

Si no se provee `callback_url`, usa el valor por defecto `http://rund-api:3000/api/v2/ai/webhook/extraction-complete`.

**Respuesta 202:**
```json
{ "success": true, "enqueued": 120, "queue_size": 120 }
```

```bash
curl -X POST http://localhost:8001/queue/enqueue-pending \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

#### POST /retry-error-jobs
Re-encola todos los documentos en estado `"error"` → `"pendiente"`.

```json
{ "success": true, "retried": 8 }
```

```bash
curl -X POST http://localhost:8001/retry-error-jobs
```

---

#### POST /reset-stuck-jobs
Resetea documentos en estado `"procesando"` → `"pendiente"`. Útil tras reinicios del contenedor.

```json
{ "success": true, "resetted": 15 }
```

```bash
curl -X POST http://localhost:8001/reset-stuck-jobs
```

---

### 2.2 Extracción Estructurada

#### POST /extract
Extrae datos estructurados del texto de un documento usando el LLM (gemma4:e4b via Ollama).

**Request:**
```json
{
  "text": "CÉDULA DE CIUDADANÍA No. 71799891 GUSTAVO ADOLFO MUÑOZ GAVIRIA ...",
  "schema": "cedula"
}
```

**Campos:**
- `text` (string, requerido): Texto extraído por OCR del documento
- `schema` (string, requerido): Nombre del schema (ver §6)

**Respuesta 200:**
```json
{
  "success": true,
  "schema": "cedula",
  "data": {
    "tipo_documento": "CC",
    "numero": "71799891",
    "nombres": "GUSTAVO ADOLFO",
    "apellidos": "MUÑOZ GAVIRIA",
    "fecha_nacimiento": "1965-03-12",
    "fecha_expedicion": "2010-05-20",
    "lugar_expedicion": "MEDELLÍN",
    "sexo": "M",
    "rh": "O+"
  },
  "confidence_score": 87.5,
  "processing_time": 8.3,
  "model_used": "gemma4:e4b"
}
```

**Errores:**
- `400`: Parámetros faltantes o schema no reconocido
- `500`: Error del LLM o timeout

```bash
curl -X POST http://localhost:8001/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "CEDULA DE CIUDADANIA No. 71799891 ...", "schema": "cedula"}'
```

---

### 2.3 Clasificación

#### POST /classify
Clasifica un documento según su tipo usando embeddings (Jaccard token overlap).

**Request:**
```json
{
  "text": "CÉDULA DE CIUDADANÍA REPÚBLICA DE COLOMBIA No. 71799891 ...",
  "top_k": 3
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "top_prediction": {
    "type": "cedula",
    "confidence": 0.92,
    "label": "Cédula de Ciudadanía"
  },
  "all_predictions": [
    { "type": "cedula", "confidence": 0.92 },
    { "type": "resolucion", "confidence": 0.31 },
    { "type": "certificado_academico", "confidence": 0.18 }
  ],
  "processing_time": 0.08
}
```

**Nota:** La clasificación tiene un umbral de confianza de **0.8** para considerarse válida. Por debajo de este umbral, no se aplica la categoría `IA_CLASIFICADO` en OpenKM.

```bash
curl -X POST http://localhost:8001/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "CEDULA DE CIUDADANIA...", "top_k": 1}'
```

---

### 2.4 Búsqueda Semántica

#### POST /search
Búsqueda por similitud sobre el índice de documentos extraídos (Jaccard token overlap sobre texto indexado).

**Request:**
```json
{
  "query": "diploma maestría administración pública",
  "limit": 10
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "query": "diploma maestría administración pública",
  "results": [
    {
      "document_id": "uuid-123",
      "nombre": "Diploma_Maestria.pdf",
      "tipo": "certificado_academico",
      "similarity": 0.78,
      "cedula": "71799891",
      "file_path": "/okm:root/..."
    }
  ],
  "total": 3,
  "processing_time": 0.12
}
```

```bash
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{"query": "diploma maestría administración", "limit": 10}'
```

---

### 2.5 Validación de Consistencia

#### POST /validate
Valida la consistencia documental de un profesor. Ejecuta 5 checks sobre los metadatos del índice.

**Request:**
```json
{ "cedula": "71799891" }
```

**Checks realizados:**
1. Documentos con status `"error"` persistente
2. Documentos con confianza baja (< 60%)
3. Múltiples documentos del mismo tipo (posibles duplicados)
4. Nombre inconsistente entre documentos (Jaccard < 0.75)
5. Documentos sin tipo_documento asignado

**Respuesta 200:**
```json
{
  "success": true,
  "cedula": "71799891",
  "issues": [
    {
      "tipo": "nombre_inconsistente",
      "severidad": "warning",
      "descripcion": "Nombre en cédula: 'GUSTAVO MUÑOZ', en certificado: 'GUSTAVO ADOLFO MUÑOZ GAVIRIA' — similitud: 0.68"
    }
  ],
  "score": 85,
  "total_documentos": 10,
  "completados": 8,
  "en_error": 1,
  "pendientes": 1,
  "processing_time": 0.05
}
```

**Severidades posibles:** `critical`, `high`, `medium`, `low`, `info`

```bash
curl -X POST http://localhost:8001/validate \
  -H "Content-Type: application/json" \
  -d '{"cedula": "71799891"}'
```

---

### 2.6 Índice de Extracción

#### GET /extraction/statistics
Estadísticas del índice completo de extracción.

```json
{
  "success": true,
  "metadata": {
    "version": "1.0",
    "last_updated": "2026-06-05T10:30:00-05:00",
    "total_documents": 150,
    "total_professors": 45
  },
  "statistics": {
    "by_status": {
      "pendiente": 20,
      "procesando": 5,
      "completado": 120,
      "error": 5
    },
    "by_category": {
      "cedula": { "total": 45, "completado": 42, "procesando": 1, "error": 1, "pendiente": 1 },
      "certificado_laboral": { "total": 60, "completado": 55, "procesando": 2, "error": 2, "pendiente": 1 }
    },
    "by_confidence": {
      "high": 100,
      "medium": 40,
      "low": 10
    },
    "processing": {
      "average_ocr_time": 12.5,
      "average_ai_time": 8.3,
      "average_total_time": 25.8,
      "queue_size": 20
    }
  }
}
```

```bash
curl http://localhost:8001/extraction/statistics
```

---

#### GET /extraction/professor/{cedula}
Documentos extraídos de un profesor específico.

```json
{
  "success": true,
  "cedula": "71799891",
  "total_documents": 4,
  "statistics": {
    "completado": 3,
    "error": 1,
    "pendiente": 0
  },
  "documents": [
    {
      "document_id": "uuid-123",
      "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
      "tipo_documento": "cedula",
      "status": "completado",
      "confidence_score": 87.5,
      "created_at": "2026-05-20T10:00:00",
      "updated_at": "2026-05-20T10:00:30",
      "processing_info": {
        "ocr_time": 0.0,
        "ai_time": 12.3,
        "total_time": 14.5,
        "retry_count": 0
      }
    }
  ]
}
```

```bash
curl http://localhost:8001/extraction/professor/71799891
```

---

#### GET /health
Health check de rund-ai.

```json
{
  "status": "healthy",
  "service": "rund-ai",
  "version": "1.0.0",
  "workers": 3,
  "queue_size": 0,
  "ollama_status": "connected",
  "timestamp": "2026-06-05T10:00:00"
}
```

---

## 3. rund-ocr — API Completa

**Base URL:** `http://rund-ocr:8000` (interno) · `http://localhost:8000` (dev)

rund-api **no llama directamente a rund-ocr**. El worker de rund-ai llama a rund-ocr internamente cuando `USE_MULTIMODAL=false` o cuando la ruta multimodal falla.

---

#### POST /extract-text
Extrae texto de un documento (imagen o PDF).

**Request (multipart/form-data):**
- `file` (File, requerido): archivo a procesar
  - Formatos: `png`, `jpg`, `jpeg`, `pdf`, `tiff`, `bmp`
  - Tamaño máximo: 50MB

**Respuesta 200:**
```json
{
  "success": true,
  "filename": "cedula.pdf",
  "pages_processed": 1,
  "text": "REPÚBLICA DE COLOMBIA CÉDULA DE CIUDADANÍA\nNo 71.799.891\nGUSTAVO ADOLFO MUÑOZ GAVIRIA\n...",
  "confidence": 0.93,
  "lines_detected": 24,
  "processing_time": "2026-06-05T10:15:30",
  "details": [
    {
      "page": 1,
      "text": "...",
      "confidence": 0.93,
      "lines_detected": 24
    }
  ]
}
```

**Errores:**
- `400`: Sin archivo, nombre vacío, extensión no permitida, archivo demasiado grande
- `500`: Error en PaddleOCR

```bash
curl -X POST http://localhost:8000/extract-text \
  -F "file=@cedula.pdf"
```

---

#### GET /health
```json
{
  "status": "healthy",
  "service": "rund-ocr",
  "version": "1.0.0",
  "timestamp": "2026-06-05T10:00:00"
}
```

---

#### GET /info
Información del servicio OCR.

```json
{
  "service": "rund-ocr",
  "version": "1.0.0",
  "supported_formats": ["png", "jpg", "jpeg", "pdf", "tiff", "bmp"],
  "max_file_size_mb": 50,
  "timeout_seconds": 60,
  "languages": ["es", "en"],
  "gpu_enabled": false
}
```

---

## 4. rund-ollama — API de Modelos LLM

**Base URL:** `http://rund-ollama:11434` (interno) · `http://localhost:11434` (dev)

rund-api **no llama directamente a rund-ollama**. Solo rund-ai lo usa.

**Modelo activo:** `gemma4:e4b` (reemplaza a nuextract + gemma2:2b)

---

#### GET /api/tags
Lista modelos instalados.

```json
{
  "models": [
    {
      "name": "gemma4:e4b",
      "modified_at": "2026-05-01T00:00:00Z",
      "size": 7234567890
    }
  ]
}
```

#### POST /api/generate
Generación de texto.

```json
{
  "model": "gemma4:e4b",
  "prompt": "Extrae la información de esta cédula...",
  "stream": false,
  "format": "json",
  "options": { "temperature": 0.1, "num_predict": 500 }
}
```

#### POST /api/chat
Chat con el modelo.

**Descarga manual de modelos** (primer arranque):
```bash
docker exec -it rund-ollama bash
ollama pull gemma4:e4b
# Fallback:
ollama pull gemma2:2b
ollama pull nuextract
```

---

## 5. Flujos de Datos End-to-End

### 5.1 Flujo de Subida y Extracción (Happy Path)

```
1. Usuario → Frontend: sube cedula.pdf para el profesor 71799891
   │
2. Frontend → rund-api: POST /api/v2/archivos/subir
   │  multipart: archivo=cedula.pdf, accion=cargaDocumento
   │  propiedades: cedula=71799891, tipo=cedula, ...
   │
3. rund-api → OpenKM: sube el PDF
   │  OpenKM asigna UUID: "uuid-abc-123"
   │  Ruta: /okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf
   │
4. rund-api → rund-ai: POST /queue/add-batch
   │  {
   │    "documents": [{
   │      "document_id": "uuid-abc-123",
   │      "file_path": "/okm:root/.../71799891/cedula.pdf",
   │      "tipo_documento": "cedula"
   │    }],
   │    "callback_url": "http://rund-api:3000/api/v2/ai/webhook/extraction-complete"
   │  }
   │  → rund-ai responde 202 inmediatamente
   │
5. rund-api → Frontend: 200 OK (el frontend no espera la extracción)
   │
   │  [Asíncrono — rund-ai worker en background]
   │
6. rund-ai Worker:
   a) Descarga PDF: POST /api/v2/internos/documentos/obtener-uuid
      + GET /api/v2/internos/documentos/descargar/{uuid} → PDF bytes
   │
   b) Extracción multimodal (gemma4:e4b via Ollama):
      POST /api/generate { model: "gemma4:e4b", prompt: [pdf_image + prompt], format: "json" }
      → { tipo_documento: "CC", numero: "71799891", nombres: "GUSTAVO ADOLFO", ... }
   │
      [Si falla: fallback a OCR]
   b') OCR: POST http://rund-ocr:8000/extract-text (archivo PDF)
       → { text: "CÉDULA DE CIUDADANÍA No. 71799891 GUSTAVO ADOLFO..." }
       + Extracción: POST /api/generate con el texto
   │
   c) Sube JSON side-car a OpenKM:
      POST /api/v2/internos/documentos/subir-json
      { json_path: "/okm:root/.../71799891/cedula.json", data: { ...datos_extraidos... } }
   │
   d) Actualiza categoría: PUT /api/v2/internos/documentos/categoria
      { doc_path: ".../cedula.pdf", category: "completado" }
   │
   e) Callback a rund-api: POST /api/v2/ai/webhook/extraction-complete
      {
        "document_id": "uuid-abc-123",
        "status": "completed",
        "ia_classification": { "type": "cedula", "confidence": 0.90 },
        "processing_info": { "ocr_time": 0, "ai_time": 12.3, "total_time": 14.5 }
      }
   │
7. rund-api (webhook handler):
   a) Construye ruta de categoría IA: /okm:categories/.../IA_CLASIFICADO/CEDULA
   b) Obtiene UUID del documento
   c) Obtiene categorías actuales
   d) Añade categoría IA a las existentes: document/setProperties
   │
8. Frontend puede consultar estado:
   GET /api/v2/extraccion/71799891 → lista de extracciones del profesor
   GET /api/v2/extraccion/json/71799891/cedula.json → datos extraídos
```

---

### 5.2 Flujo del Scheduler Nocturno

```
1. Crontab: cada 30 min entre 22:00 y 06:00
   node /app/cron/scheduler.js

2. Leer scheduler_state.json → si habilitado:false → exit

3. Verificar hora actual en rango [hora_inicio, hora_fin]

4. POST http://rund-ai:8001/queue/enqueue-pending
   → rund-ai lee extraction_index.json
   → encola todos los documentos con status="pendiente"

5. Actualizar scheduler_state.json con ultimo_run y resultado
```

---

### 5.3 Flujo de Reintentos

```
Error durante extracción:
  → job.retry_count < max_retries (3): espera 5 minutos + reencola
  → job.retry_count >= 3: marca como "error" + callback "failed" a rund-api

POST /api/v2/ai/retry-error-jobs:
  → rund-api llama a POST /retry-error-jobs en rund-ai
  → rund-ai cambia status "error" → "pendiente" en el índice
  → El scheduler nocturno los procesará en el siguiente ciclo
```

---

## 6. Schemas de Extracción (6 tipos)

### Resumen de Schemas

| Schema key | Nombre | Prioridad | Campos requeridos |
|------------|--------|-----------|-------------------|
| `cedula` | Cédula de Ciudadanía | ALTA | tipo_documento, numero, nombres, apellidos |
| `certificado_laboral` | Certificado Laboral | ALTA | tipo_documento, entidad_emisora, nombre_empleado, cargo, fecha_inicio |
| `certificado_academico` | Certificado Académico | ALTA | tipo_documento, institucion, nombre_estudiante, titulo_otorgado, nivel_educativo, fecha_grado |
| `resolucion` | Resolución de Nombramiento | ALTA | tipo_documento, entidad_emisora, numero_resolucion, fecha_resolucion, nombre_docente, cargo |
| `acta` | Acta de Evaluación Docente | MEDIA | tipo_documento, fecha_evaluacion, nombre_docente |
| `certificado_idiomas` | Certificado de Idiomas | MEDIA | tipo_documento, institucion, nombre_estudiante, idioma, nivel_alcanzado |

### Schema: cedula

**Salida esperada:**
```json
{
  "tipo_documento": "CC",
  "numero": "71799891",
  "nombres": "GUSTAVO ADOLFO",
  "apellidos": "MUÑOZ GAVIRIA",
  "fecha_nacimiento": "1965-03-12",
  "fecha_expedicion": "2010-05-20",
  "lugar_expedicion": "MEDELLÍN",
  "sexo": "M",
  "rh": "O+"
}
```

**Validaciones:**
- `numero`: `/^\d{6,10}$/` — solo dígitos, sin puntos ni comas
- `sexo`: valores `["M", "F", "MASCULINO", "FEMENINO"]`
- `rh`: valores `["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]`

---

### Schema: certificado_laboral

**Salida esperada:**
```json
{
  "tipo_documento": "certificado_laboral",
  "entidad_emisora": "Universidad Nacional de Colombia",
  "tipo_entidad": "publica",
  "numero_certificado": "CL-2023-001234",
  "nombre_empleado": "Juan Carlos Pérez Gómez",
  "cedula_empleado": "1234567890",
  "cargo": "Profesor Asociado",
  "tipo_contrato": "termino_indefinido",
  "fecha_inicio": "2015-01-15",
  "fecha_fin": null,
  "aun_labora": true,
  "salario": "5000000",
  "funciones": "Docencia e investigación",
  "fecha_expedicion_cert": "2023-12-15",
  "firmante_nombre": "Dr. María López",
  "firmante_cargo": "Decana"
}
```

---

### Schema: certificado_academico

**Salida esperada:**
```json
{
  "tipo_documento": "titulo",
  "institucion": "Universidad Nacional de Colombia",
  "tipo_institucion": "universidad",
  "nombre_estudiante": "Juan Carlos Pérez Gómez",
  "cedula_estudiante": "1234567890",
  "titulo_otorgado": "Ingeniero de Sistemas y Computación",
  "nivel_educativo": "pregrado",
  "programa_academico": "Ingeniería de Sistemas",
  "fecha_grado": "2010-06-15",
  "numero_acta": "045",
  "numero_diploma": "IS-2010-12345",
  "mencion_honor": "cum_laude",
  "pais": "Colombia",
  "ciudad": "Bogotá D.C.",
  "fecha_expedicion_cert": "2010-07-01"
}
```

**`nivel_educativo` valores:** `["pregrado", "especializacion", "maestria", "doctorado", "posdoctorado"]`

---

### Schema: resolucion

**Salida esperada:**
```json
{
  "tipo_documento": "resolucion_nombramiento",
  "entidad_emisora": "ESAP",
  "numero_resolucion": "RES-2024-0123",
  "fecha_resolucion": "2024-01-15",
  "nombre_docente": "Juan Carlos Pérez Gómez",
  "cedula_docente": "1234567890",
  "cargo": "Docente Catedrático",
  "categoria_docente": "catedra",
  "asignatura": "Administración Pública",
  "programa": "Administración Pública Territorial",
  "fecha_inicio_nombramiento": "2024-02-01",
  "fecha_fin_nombramiento": "2024-06-30",
  "valor_honorarios": "80000 por hora cátedra",
  "firmante_nombre": "Dr. Ricardo Gómez",
  "firmante_cargo": "Director Territorial"
}
```

---

### Schema: acta

**Salida esperada:**
```json
{
  "tipo_documento": "acta_evaluacion",
  "numero_acta": "AE-2024-045",
  "fecha_evaluacion": "2024-06-20",
  "nombre_docente": "Juan Carlos Pérez Gómez",
  "cedula_docente": "1234567890",
  "periodo_evaluado": "2024-I",
  "calificacion_final": "4.5/5.0",
  "resultado": "sobresaliente",
  "evaluadores": "Dr. María López, Dra. Ana García",
  "observaciones": "Excelente desempeño",
  "recomendaciones": "Continuar con investigación"
}
```

---

### Schema: certificado_idiomas

**Salida esperada:**
```json
{
  "tipo_documento": "certificado_idiomas",
  "institucion": "Cambridge English Language Assessment",
  "nombre_estudiante": "Juan Carlos Pérez Gómez",
  "cedula_estudiante": "1234567890",
  "idioma": "ingles",
  "tipo_examen": "Cambridge",
  "nivel_alcanzado": "C1 Advanced",
  "puntaje": "185/210",
  "fecha_examen": "2023-05-15",
  "fecha_expedicion": "2023-06-20",
  "fecha_vencimiento": null,
  "numero_certificado": "CAE-2023-12345"
}
```

### Mapeo tipo_documento → schema

rund-ai normaliza el `tipo_documento` recibido al nombre de schema interno:

| tipo_documento (entrada) | schema (interno) |
|--------------------------|-----------------|
| cedula, CEDULA, CEDULA_CIUDADANIA, DATOS_BASICOS | cedula |
| certificado_laboral, EXPERIENCIA_DOCENTE, EXPERIENCIA_LABORAL, CERTIFICADO_DOCENTE, EXPERIENCIA_INVESTIGATIVA | certificado_laboral |
| certificado_academico, TITULOS_DE_FORMACION, DIPLOMA, TITULO, ESPECIALIZACION, MAESTRIA, DOCTORADO | certificado_academico |
| resolucion, RESOLUCION, RESOLUCION_NOMBRAMIENTO, ACTO_ADMINISTRATIVO | resolucion |
| acta, ACTA, ACTA_EVALUACION, EVALUACION_DOCENTE, ESTUDIO_DE_HOJA_DE_VIDA | acta |
| certificado_idiomas, IDIOMAS, SUFICIENCIA_IDIOMAS | certificado_idiomas |

Si el tipo no coincide con ninguno, se usa el schema `"default"` (extracción genérica).

---

## 7. Extraction Index — Estructura de Datos

El índice se almacena en OpenKM en `/okm:root/RUND/CONFIG/DATA/extraction_index.json`.

**Estructura completa:**
```json
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2026-06-05T10:30:00-05:00",
    "total_documents": 150,
    "total_professors": 45
  },
  "statistics": {
    "by_status": {
      "pendiente": 20,
      "procesando": 5,
      "completado": 120,
      "error": 5
    },
    "by_category": {
      "cedula": { "total": 45, "completado": 42, "procesando": 1, "error": 1, "pendiente": 1 },
      "certificado_laboral": { "total": 60, "completado": 55, ... }
    },
    "by_confidence": {
      "high": 100,
      "medium": 40,
      "low": 10
    },
    "processing": {
      "average_ocr_time": 12.5,
      "average_ai_time": 8.3,
      "average_total_time": 25.8,
      "queue_size": 20
    }
  },
  "documents": [
    {
      "document_id": "uuid-abc-123",
      "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
      "cedula": "71799891",
      "tipo_documento": "cedula",
      "status": "completado",
      "confidence_score": 87.5,
      "created_at": "2026-05-20T10:00:00",
      "updated_at": "2026-05-20T10:00:30",
      "processing_info": {
        "ocr_time": 0.0,
        "ai_time": 12.3,
        "total_time": 14.5,
        "retry_count": 0
      },
      "error": null
    }
  ],
  "professors": {
    "71799891": {
      "cedula": "71799891",
      "total_documents": 4,
      "documents": ["uuid-abc-123", "uuid-def-456"]
    }
  }
}
```

**Concurrencia:** rund-ai usa Gunicorn con **1 worker + 4 threads** + `fcntl.flock` para evitar race conditions al escribir el índice. La OTIC no debe modificar esta configuración.

**Riesgo de corrupción:** Si el contenedor de rund-ai se reinicia mientras un worker está escribiendo el índice, el archivo puede quedar corrupto. En ese caso:
```bash
# Resetear stuck jobs primero:
curl -X POST http://localhost:8001/reset-stuck-jobs

# Si el índice sigue corrupto — hacer backup y reiniciar rund-ai:
docker compose restart rund-ai
```

---

## 8. Configuración Docker

### 8.1 rund-ai (docker-compose)

```yaml
rund-ai:
  build: ./rund-ai
  container_name: rund-ai
  ports:
    - "8001:8001"
  environment:
    - FLASK_ENV=production
    - FLASK_PORT=8001
    - OLLAMA_URL=http://rund-ollama:11434
    - NUEXTRACT_MODEL=gemma4:e4b
    - GEMMA_MODEL=gemma4:e4b
    - EMBEDDINGS_MODEL=paraphrase-multilingual-MiniLM-L12-v2
    - EMBEDDINGS_DEVICE=cpu
    - VECTOR_DB_PATH=/cache/chromadb
    - OCR_URL=http://rund-ocr:8000
    - API_URL=http://rund-api:3000
    - LOG_LEVEL=INFO
    - USE_MULTIMODAL=false
    - MAX_WORKERS=3
  volumes:
    - ai-models:/home/rund/.cache              # Modelos de embeddings
    - ai-cache:/cache/chromadb                  # ChromaDB
  networks:
    - rund-network
  depends_on:
    - rund-ollama
    - rund-ocr
  deploy:
    resources:
      limits:
        memory: 4G
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 8.2 rund-ocr (docker-compose)

```yaml
rund-ocr:
  build: ./rund-ocr
  container_name: rund-ocr
  ports:
    - "8000:8000"
  environment:
    - PADDLE_OCR_LANG=es,en
    - PADDLE_OCR_USE_GPU=false
    - MAX_FILE_SIZE=50
    - OCR_TIMEOUT=60
  volumes:
    - ocr-models:/root/.paddleocr              # Modelos PaddleOCR
    - ocr-temp:/tmp/ocr-processing             # Temporales
  networks:
    - rund-network
  deploy:
    resources:
      limits:
        memory: 2G
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 8.3 rund-ollama (docker-compose)

```yaml
rund-ollama:
  image: ollama/ollama:latest
  container_name: rund-ollama
  ports:
    - "11434:11434"
  environment:
    - OLLAMA_HOST=0.0.0.0:11434
    - OLLAMA_ORIGINS=*
    - OLLAMA_KEEP_ALIVE=5m
    - OLLAMA_MAX_LOADED_MODELS=1
  volumes:
    - ollama-data:/root/.ollama                # Modelos Ollama
  networks:
    - rund-network
  # Para Mac M2: platform: linux/arm64
  # Para servidor Linux amd64: platform: linux/amd64
  deploy:
    resources:
      limits:
        memory: 8G
```

### 8.4 Volúmenes requeridos

```yaml
volumes:
  ollama-data:       # Modelos Ollama (~7.2GB para gemma4:e4b)
  ai-models:         # Cache modelos embeddings (~120MB)
  ai-cache:          # ChromaDB (~variable)
  ocr-models:        # Modelos PaddleOCR (~500MB en primer arranque)
  ocr-temp:          # Archivos temporales OCR
```

### 8.5 Tiempo de arranque

| Servicio | Tiempo hasta ready | Razón |
|----------|--------------------|-------|
| rund-ollama | 30-60s | Inicialización del servicio |
| rund-ocr | 60-120s | Descarga modelos PaddleOCR (primer arranque: ~500MB) |
| rund-ai | 30-60s | Carga modelo embeddings (~500MB en memoria) |

**Primer arranque:** Los modelos Ollama NO se descargan automáticamente. Se deben descargar manualmente:
```bash
docker exec -it rund-ollama bash
ollama pull gemma4:e4b          # ~7.2GB, puede tardar 10-20 min
# Opcional (backup):
ollama pull gemma2:2b           # ~2GB
ollama pull nuextract           # ~3.8GB (legacy)
```

---

## 9. Variables de Entorno

### rund-ai

| Variable | Default | Descripción |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Entorno Flask |
| `FLASK_PORT` | `8001` | Puerto del servicio |
| `OLLAMA_URL` | `http://rund-ollama:11434` | URL del servicio LLM |
| `OLLAMA_TIMEOUT` | `300` | Timeout Ollama (segundos) |
| `NUEXTRACT_MODEL` | `gemma4:e4b` | Modelo de extracción estructurada |
| `GEMMA_MODEL` | `gemma4:e4b` | Modelo para análisis complejo |
| `USE_MULTIMODAL` | `false` | Habilitar extracción multimodal (imagen directa) |
| `EMBEDDINGS_MODEL` | `paraphrase-multilingual-MiniLM-L12-v2` | Modelo de embeddings |
| `EMBEDDINGS_DEVICE` | `cpu` | Dispositivo (cpu/cuda/mps) |
| `VECTOR_DB_PATH` | `/cache/chromadb` | Ruta de ChromaDB |
| `OCR_URL` | `http://rund-ocr:8000` | URL del servicio OCR |
| `API_URL` | `http://rund-api:3000` | URL de rund-api (para internos) |
| `MAX_WORKERS` | `3` (pool) | Workers de extracción paralela |
| `LOG_LEVEL` | `INFO` | Nivel de logs |

### rund-ocr

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PADDLE_OCR_LANG` | `es,en` | Idiomas OCR (primer idioma es el principal) |
| `PADDLE_OCR_USE_GPU` | `false` | Usar GPU para OCR |
| `MAX_FILE_SIZE` | `50` | Tamaño máximo en MB |
| `OCR_TIMEOUT` | `60` | Timeout en segundos |

### rund-ollama

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OLLAMA_HOST` | `0.0.0.0:11434` | Bind address |
| `OLLAMA_ORIGINS` | `*` | Orígenes permitidos |
| `OLLAMA_KEEP_ALIVE` | `5m` | Tiempo en memoria del modelo |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Solo 1 modelo en RAM a la vez |

---

## 10. Integración desde rund-api (Node.js)

### 10.1 Encolado tras subida de documento

```typescript
// Después de subir el archivo a OpenKM exitosamente:
async function enqueueForExtraction(
  documentId: string,
  filePath: string,
  tipoDocumento: string
) {
  const aiUrl = process.env.RUND_AI_URL ?? 'http://rund-ai:8001';
  const res = await fetch(`${aiUrl}/queue/add-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documents: [{ document_id: documentId, file_path: filePath, tipo_documento: tipoDocumento }],
      callback_url: 'http://rund-api:3000/api/v2/ai/webhook/extraction-complete'
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`rund-ai /queue/add-batch returned ${res.status}`);
  return res.json(); // { success: true, queued: 1, queue_size: N }
}
```

### 10.2 Webhook handler (extraction-complete)

```typescript
// POST /api/v2/ai/webhook/extraction-complete
async function handleExtractionComplete(payload: {
  document_id: string;
  status: 'completed' | 'failed';
  ia_classification?: { type: string; confidence: number };
  extraction?: object;
  error?: string;
  processing_info?: object;
}) {
  // 1. Loguear
  console.log(`Webhook: ${payload.document_id} → ${payload.status}`);

  // 2. Si completado y clasificación IA con confianza >= 0.8
  const extraCategorias: string[] = [];
  if (
    payload.status === 'completed' &&
    payload.ia_classification &&
    payload.ia_classification.confidence >= 0.8
  ) {
    const tipoNorm = payload.ia_classification.type
      .toUpperCase().replace(/[\s-]/g, '_');
    extraCategorias.push(
      `/okm:categories/RUND/DOCUMENTOS/HOJAS_DE_VIDA/IA_CLASIFICADO/${tipoNorm}`
    );
  }

  // 3. Aplicar categorías en OpenKM si las hay
  if (extraCategorias.length > 0) {
    // Obtener UUID del documento
    const uuidResp = await fetch('http://rund-api:3000/api/v2/internos/documentos/obtener-uuid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_path: payload.document_id }),
    });
    // ... ver lógica completa en rund-api-migration-guide.md §5.4
  }

  return { success: true, ia_clasificado: extraCategorias.length > 0 };
}
```

### 10.3 Polling de estado (opcional)

```typescript
async function pollJobStatus(documentId: string, maxAttempts = 10): Promise<string> {
  const aiUrl = process.env.RUND_AI_URL ?? 'http://rund-ai:8001';
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`${aiUrl}/queue/job/${documentId}`);
    const data = await res.json();
    if (['completed', 'failed'].includes(data.job?.status)) {
      return data.job.status;
    }
  }
  throw new Error('Timeout esperando el job');
}
// Nota: En producción, usar el webhook en lugar de polling.
```

---

## 11. Sustitución de Servicios Equivalentes

Si la OTIC tiene infraestructura propia equivalente, puede sustituir estos servicios. Los contratos de integración que deben preservarse son:

### 11.1 Sustituir rund-ocr

El servicio equivalente debe exponer:
```
POST /extract-text  (multipart, campo: file)
→ { success: true, text: string, confidence: float, pages_processed: int }
```

Cambiar `OCR_URL` en rund-ai para apuntar al servicio equivalente.

### 11.2 Sustituir rund-ollama

Cualquier servicio LLM con API compatible con Ollama o que pueda ser adaptado. Requerimientos mínimos:
- Soportar `POST /api/generate` con `format: "json"` para salida JSON estructurada
- Modelo capaz de seguir instrucciones detalladas de extracción de campos específicos
- Contexto mínimo: 4096 tokens

Cambiar `OLLAMA_URL` y `NUEXTRACT_MODEL`/`GEMMA_MODEL` en rund-ai.

**⚠️ Importante:** Si se usa un modelo diferente, los prompts de extracción en `rund-ai/config/schemas.py` pueden requerir ajuste. Los prompts están optimizados para gemma4 y modelos instruction-tuned.

### 11.3 Sustituir rund-ai completamente

Si la OTIC tiene un servicio de extracción propio, debe:
1. Exponer los mismos endpoints (`/queue/add-batch`, `/extraction/statistics`, `/extraction/professor/{cedula}`, etc.)
2. Llamar al webhook `POST /api/v2/ai/webhook/extraction-complete` con el mismo payload
3. Mantener el mismo formato del `extraction_index.json` en OpenKM

---

## 12. Checklist de Verificación Post-Deploy

### Arranque de servicios

- [ ] `rund-ollama`: `GET /api/tags` retorna al menos `gemma4:e4b`
  ```bash
  curl http://localhost:11434/api/tags | grep gemma4
  ```
- [ ] `rund-ocr`: `GET /health` retorna `{ "status": "healthy" }`
  ```bash
  curl http://localhost:8000/health
  ```
- [ ] `rund-ai`: `GET /health` retorna `{ "status": "healthy" }` con `ollama_status: "connected"`
  ```bash
  curl http://localhost:8001/health
  ```

### Test de extracción de extremo a extremo

- [ ] Subir un PDF de prueba y verificar que rund-ai lo procesa:
  ```bash
  # 1. Encolar directamente (sin pasar por rund-api)
  curl -X POST http://localhost:8001/queue/add-batch \
    -H "Content-Type: application/json" \
    -d '{
      "documents": [{
        "document_id": "test-uuid-001",
        "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/12345678/cedula.pdf",
        "tipo_documento": "cedula"
      }],
      "callback_url": "http://rund-api:3000/api/v2/ai/webhook/extraction-complete"
    }'
  
  # 2. Esperar ~20s y verificar estado
  curl http://localhost:8001/queue/job/test-uuid-001
  ```

### Test de OCR directo

- [ ] `POST /extract-text` con un PDF de prueba retorna texto legible:
  ```bash
  curl -X POST http://localhost:8000/extract-text \
    -F "file=@test.pdf" | jq '.text' | head -5
  ```

### Test de clasificación

- [ ] `POST /classify` retorna tipo correcto:
  ```bash
  curl -X POST http://localhost:8001/classify \
    -H "Content-Type: application/json" \
    -d '{"text": "CÉDULA DE CIUDADANÍA REPÚBLICA DE COLOMBIA No. 71799891", "top_k": 1}' \
    | jq '.top_prediction'
  # Esperado: { "type": "cedula", "confidence": > 0.8 }
  ```

### Test de extracción estructurada

- [ ] `POST /extract` con texto de cédula retorna campos correctos:
  ```bash
  curl -X POST http://localhost:8001/extract \
    -H "Content-Type: application/json" \
    -d '{"text": "CEDULA DE CIUDADANIA No. 71799891 GUSTAVO ADOLFO MUÑOZ GAVIRIA", "schema": "cedula"}' \
    | jq '.data'
  # Esperado: { "numero": "71799891", "nombres": "GUSTAVO ADOLFO", ... }
  ```

### Test del índice de extracción

- [ ] `GET /extraction/statistics` retorna estructura válida sin errores:
  ```bash
  curl http://localhost:8001/extraction/statistics | jq '.metadata'
  ```

### Test de webhook (integración con rund-api)

- [ ] El webhook llega a rund-api y aplica la categoría IA en OpenKM:
  ```bash
  curl -X POST http://localhost:3000/api/v2/ai/webhook/extraction-complete \
    -H "Content-Type: application/json" \
    -d '{
      "document_id": "test-uuid-001",
      "status": "completed",
      "ia_classification": { "type": "cedula", "confidence": 0.92 }
    }'
  # Esperado: { "success": true, "ia_clasificado": true }
  ```

### Comportamiento en errores

- [ ] Si rund-ollama está caído, rund-ai marca los jobs como `"error"` (no cuelga indefinidamente)
- [ ] `POST /reset-stuck-jobs` funciona tras reiniciar rund-ai con jobs en estado `"procesando"`
- [ ] `POST /retry-error-jobs` cambia jobs de `"error"` a `"pendiente"` y el scheduler los reprocesa

---

*Spec generada el 05 jun 2026 — Versiones documentadas: rund-ai v1.0 (commit rund-ai#9), rund-ocr v1.0.0, rund-ollama (gemma4:e4b)*
