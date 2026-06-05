# CLAUDE.md

Este archivo proporciona orientación completa sobre el proyecto RUND y sus módulos AI y OCR cuando se trabaja con código en este repositorio.

## 📋 Resumen del Proyecto

**RUND** (Registro Único Nacional Docente) es un sistema de gestión documental para hojas de vida profesorales de la ESAP (Escuela Superior de Administración Pública - Colombia). Gestiona aproximadamente 300 profesores con ~40 documentos cada uno (~12,000 documentos totales).

## 🏗️ Arquitectura General

RUND es una aplicación basada en microservicios Docker que consiste en:

### Servicios Principales

- **rund-core** (OpenKM): Repositorio de documentos/base de datos (Java/Tomcat)
  - Puerto: 8080
  - Volumen: openkm-data
  - Plataforma: linux/amd64

- **rund-api**: Backend API en PHP 8.3
  - Puerto: 3000
  - Framework: Custom PHP
  - Dependencias: LibreOffice para conversión de documentos

- **rund-mgp**: Frontend Angular 20.x con SSR
  - Puerto: 4000
  - Lenguaje: TypeScript/JavaScript
  - Framework: Angular 20

- **rund-auth**: Servicio de Autenticación Centralizado (Node.js 20+)
  - Puerto: 8081
  - Stack: Express.js, TypeScript, Redis, PostgreSQL
  - Autenticación: LDAP, OAuth 2.0 (Azure AD), JWT (RS256)
  - Documentación: [rund-auth/README.md](rund-auth/README.md)

- **rund-ollama**: Motor LLM (anteriormente rund-ai)
  - Puerto: 11434
  - Imagen: ollama/ollama:latest
  - Modelos: nuextract, gemma2:2b
  - Volumen: ollama-data

- **rund-ai**: Servicio de Inteligencia Artificial (Python 3.9+)
  - Puerto: 8001
  - Stack: Flask, Sentence Transformers, ChromaDB
  - Integración con rund-ollama para LLM

- **rund-ocr**: Servicio de OCR (Python 3.9)
  - Puerto: 8000
  - Motor: PaddleOCR
  - Idiomas: Español e Inglés
  - Límite de archivo: 50MB

- **redis**: Cache y almacenamiento de sesiones
  - Puerto: 6379
  - Imagen: redis:7-alpine
  - Volumen: redis-data

- **postgres**: Base de datos PostgreSQL
  - Puerto: 5433
  - Imagen: postgres:16-alpine
  - Volumen: postgres-data

Todos los servicios se comunican a través de una red Docker bridge (`rund-network`) y usan nombres de contenedor internos para comunicación servicio-a-servicio.

## 🎯 Casos de Uso Principales

### Módulo OCR (RUND-OCR)
- Extracción de texto de documentos escaneados
- Procesamiento de cédulas de ciudadanía colombianas
- Extracción de información de certificados laborales y académicos
- Procesamiento de resoluciones, actas y oficios
- Soporte para imágenes (PNG, JPG, TIFF, BMP) y PDFs

### Módulo AI (RUND-AI)
Arquitectura híbrida con tres capas:

#### 1. Capa de Extracción Estructurada (NuExtract)
- **Modelo**: nuextract (basado en Phi-3-mini, ~3.8GB)
- **Casos de uso**:
  - Extracción de datos de cédulas de ciudadanía
  - Validación y clasificación de certificados
  - Extracción de metadatos estructurados
  - Clasificación automática de documentos
- **Latencia**: 5-10 segundos por documento
- **RAM requerida**: 4GB

#### 2. Capa de Embeddings (Sentence Transformers)
- **Modelo**: paraphrase-multilingual-MiniLM-L12-v2 (~120MB)
- **Casos de uso**:
  - Búsqueda semántica de documentos
  - Detección de duplicados
  - Clustering de documentos similares
  - Recomendación de documentos relacionados
- **Latencia**: ~100ms
- **RAM requerida**: 500MB

#### 3. Capa de Análisis Complejo (Gemma2:2b)
- **Modelo**: gemma2:2b (~2GB)
- **Casos de uso**:
  - Resúmenes automáticos de documentos
  - Análisis de tendencias
  - Minado de datos
  - Generación de reportes
- **Latencia**: 10-20 segundos
- **RAM requerida**: 3-4GB

#### 4. Base de Datos Vectorial (ChromaDB)
- Almacenamiento local
- Indexación automática
- Búsqueda semántica eficiente

## 📂 Tipos de Documentos Procesados

### Documentos Estructurados (Alta Prioridad)
1. **Cédulas de Ciudadanía**
   - Formato uniforme
   - Campos: número, nombres, apellidos, fechas, lugar de expedición
   - Template OCR optimizado requerido

2. **Resoluciones de Nombramiento**
   - Entidad emisora: ESAP
   - Campos: número de resolución, fecha, nombre docente, cargo

3. **Actas de Evaluación Docente**
   - Formato semi-estructurado
   - Campos: fecha, evaluadores, resultados, recomendaciones

### Documentos Semi-Estructurados
4. **Certificados Laborales**
   - Entidades públicas y privadas (nacionales e internacionales)
   - Campos: entidad, cargo, período, salario

5. **Certificados Académicos**
   - Títulos universitarios, postgrados
   - Campos: institución, título, fecha de grado

6. **Certificados de Docencia**
   - Experiencia en instituciones educativas
   - Campos: institución, asignatura, período

7. **Certificados de Idiomas**
   - Nivel, institución, fecha

### Documentos No Estructurados
8. **Evidencias de Investigación**
   - Artículos científicos
   - Papers
   - Capítulos de libros
   - Idiomas: español e inglés

## 🚀 Comandos de Despliegue

### Desarrollo Local
```bash
# Levantar todos los servicios
docker compose up -d

# Ver estado de servicios
docker compose ps

# Ver logs
docker compose logs -f

# Ver logs de servicio específico
docker compose logs -f rund-ai
docker compose logs -f rund-ocr
docker compose logs -f rund-ollama

# Reiniciar servicio específico
docker compose restart rund-ai

# Detener todos los servicios
docker compose down

# Reconstruir y levantar
docker compose up -d --build
```

### Producción
```bash
# Actualizar imágenes de producción
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Scripts de Despliegue
```bash
# Despliegue rápido desarrollo
./deploy.sh local

# Despliegue producción
./deploy.sh prod

# Build y push de imágenes
./scripts/build-and-push.sh v1.2.3

# Build de componentes específicos
./scripts/build-and-push.sh v1.2.3 api,ocr,ai
```

## 🔍 Health Checks y Testing

### OCR Service
```bash
# Health check
curl http://localhost:8000/health

# Info del servicio
curl http://localhost:8000/info

# Probar extracción
curl -X POST -F 'file=@documento.pdf' http://localhost:8000/extract-text
```

### AI Service
```bash
# Health check
curl http://localhost:8001/health

# Info del servicio
curl http://localhost:8001/info

# Probar clasificación
curl -X POST http://localhost:8001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"texto del documento"}'

# Probar extracción estructurada
curl -X POST http://localhost:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"texto","schema":"cedula"}'

# Añadir batch de documentos a cola
curl -X POST http://localhost:8001/queue/add-batch \
  -H 'Content-Type: application/json' \
  -d '{
    "documents": [
      {
        "document_id": "uuid-123",
        "file_path": "/okm:root/RUND/DOCENTES/HOJAS_DE_VIDA/71799891/cedula.pdf",
        "tipo_documento": "cedula"
      }
    ],
    "callback_url": "http://rund-api:3000/api/v2/webhooks/extraction-complete"
  }'

# Consultar estado de un job
curl http://localhost:8001/queue/job/uuid-123

# Estadísticas de la cola
curl http://localhost:8001/queue/stats

# Estadísticas del índice de extracción
curl http://localhost:8001/extraction/statistics

# Documentos de un profesor
curl http://localhost:8001/extraction/professor/71799891
```

### Ollama Service
```bash
# Listar modelos instalados
docker exec rund-ollama ollama list

# Ver tags disponibles
curl http://localhost:11434/api/tags

# Probar generación
curl -X POST http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"nuextract","prompt":"Hola","stream":false}'
```

## 📦 Estructura de Volúmenes

```yaml
volumes:
  openkm-data:        # Datos de OpenKM
  ollama-data:        # Modelos de Ollama
  ocr-temp:           # Archivos temporales OCR
  ocr-models:         # Cache de modelos PaddleOCR
  ai-models:          # Modelos de embeddings
  ai-cache:           # Cache de ChromaDB
```

## ⚙️ Variables de Entorno Importantes

### RUND-API
```env
API_BASE_URL=http://localhost:3000
CORE_API_URL=http://rund-core:8080/OpenKM
OCR_API_URL=http://rund-ocr:8000
AI_API_URL=http://rund-ai:8001
OLLAMA_API_URL=http://rund-ollama:11434
LIBREOFFICE_EXECUTABLE=/usr/lib/libreoffice/program/soffice
```

### RUND-OCR
```env
PADDLE_OCR_LANG=es,en
PADDLE_OCR_USE_GPU=false
MAX_FILE_SIZE=50MB
OCR_TIMEOUT=60
```

### RUND-AI
```env
OLLAMA_URL=http://rund-ollama:11434
EMBEDDINGS_MODEL=paraphrase-multilingual-MiniLM-L12-v2
VECTOR_DB_PATH=/cache/chromadb
NUEXTRACT_MODEL=nuextract
GEMMA_MODEL=gemma2:2b
```

### RUND-Ollama
```env
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_KEEP_ALIVE=5m
```

### RUND-AUTH
```env
# Aplicación
APP_BASE_URL=http://localhost:8081
APP_BASE_URL_UI=http://localhost:4000
SESSION_SECRET=change_me_long_random
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

# JWT Interno
INTERNAL_JWT_ISS=rund-auth
INTERNAL_JWT_AUD=rund-api,rund-mgp
INTERNAL_JWT_TTL_SECONDS=900
JWK_PRIVATE_SET_PATH=/keys/jwks-private.json
JWK_PUBLIC_SET_PATH=/keys/jwks-public.json

# Redis y PostgreSQL
REDIS_URL=redis://rund-redis:6379/0
DATABASE_URL=postgresql://user:pass@rund-postgres:5432/rund_auth

# LDAP (ESAP Active Directory)
LDAP_ENABLED=true
LDAP_URL=ldap://esap.edu.int:389
LDAP_BASE_DN=OU=USUARIOS,DC=esap,DC=edu,DC=int
LDAP_BIND_DN=ldap@esap.edu.int
LDAP_BIND_PASSWORD=Esap.2020
LDAP_LOGIN_ATTRIBUTE=sAMAccountName

# OAuth 2.0 / Azure AD (Opcional)
OIDC_ENABLED=false
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_CLIENT_SECRET=supersecret

# Modo desarrollo
DEV_FAKE_LOGIN=true
```

## 🔐 Autenticación y Seguridad (RUND-AUTH)

### Métodos de Autenticación

**rund-auth** proporciona tres métodos de autenticación:

1. **LDAP** (Active Directory de ESAP)
   - Usuarios: ~1777 docentes
   - Atributos: displayName, mail, employeeID, description
   - Filtro: Solo cuentas activas con correo @esap.edu.co

2. **OAuth 2.0 / OIDC** (Azure AD / Entra ID)
   - Flujo: Authorization Code con PKCE
   - Scopes: openid, profile, email, offline_access
   - Callback: `APP_BASE_URL/oauth/callback`

3. **Desarrollo** (Fake Login)
   - Solo habilitado con `DEV_FAKE_LOGIN=true`
   - Endpoint: `/dev/login?email=test@esap.edu.co`

### JWT Internos

Los JWT generados por rund-auth tienen:

- **Algoritmo**: RS256 (clave privada/pública)
- **Issuer**: `rund-auth`
- **Audience**: `rund-api`, `rund-mgp`
- **TTL**: 900 segundos (15 minutos)
- **Claims**: sub, email, roles, wl_ver, iss, aud, iat, exp

**Clave pública JWKS**: `http://rund-auth:8080/.well-known/jwks.json`

### Flujo de Autenticación

```
1. Frontend → POST /ldap/login {username, password}
2. rund-auth → Valida contra LDAP/AD de ESAP
3. rund-auth → Genera JWT firmado con RS256
4. rund-auth → Guarda sesión en Redis (8 horas)
5. Frontend ← Recibe {user, internal_jwt}
6. Frontend → Usa JWT en header Authorization: Bearer <token>
7. rund-api → Valida JWT con JWKS público
8. rund-api → Procesa request si token válido
```

### Integración en Servicios Backend

Ejemplo de validación de JWT en Node.js:

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('http://rund-auth:8080/.well-known/jwks.json')
)

const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'rund-auth',
  audience: 'rund-api'
})

console.log(payload.email) // usuario@esap.edu.co
```

Ver [rund-auth/README.md](rund-auth/README.md) para documentación completa.

## 🎓 Conceptos de IA Aplicados

### Extracción Estructurada (NuExtract)
- **Qué es**: Convertir texto no estructurado en datos JSON estructurados
- **Cómo funciona**: Se define un "schema" (estructura) y el modelo extrae los campos correspondientes
- **Ejemplo**: De un certificado en texto plano, extraer: entidad, nombre, cargo, fechas, etc.
- **Ventaja**: No requiere entrenamiento, funciona con "few-shot learning"

### Embeddings y Búsqueda Semántica
- **Qué es**: Convertir texto en vectores numéricos que capturan el "significado"
- **Cómo funciona**: Textos similares en significado tienen vectores cercanos
- **Ejemplo**: "certificado laboral" y "constancia de trabajo" tendrían vectores similares
- **Ventaja**: Permite búsquedas por significado, no solo palabras exactas

### Clasificación de Documentos
- **Qué es**: Asignar automáticamente categorías a documentos
- **Cómo funciona**: Compara el contenido con características de cada categoría
- **Ejemplo**: Determinar si un documento es "cédula", "certificado laboral" o "resolución"
- **Ventaja**: Automatiza organización y validación

### Base de Datos Vectorial (ChromaDB)
- **Qué es**: Base de datos especializada en almacenar y buscar vectores (embeddings)
- **Cómo funciona**: Indexa documentos como vectores para búsqueda rápida
- **Ejemplo**: Encontrar documentos similares a una consulta en milisegundos
- **Ventaja**: Búsquedas semánticas ultra-rápidas (~100ms)

## 📊 Rendimiento y Recursos

### Requisitos de Sistema

**Desarrollo**:
- RAM: 16GB (8GB mínimo)
- Disco: 20GB libres
- CPU: Apple M2 o equivalente (4+ cores)
- SO: macOS, Linux, Windows con WSL2

**Producción**:
- RAM: 16GB (mínimo)
- Disco: 50GB libres
- CPU: 4+ cores (sin GPU requerida)
- SO: Linux preferiblemente

### Uso de Recursos por Servicio

| Servicio | RAM | Disco | CPU | Latencia |
|----------|-----|-------|-----|----------|
| rund-core (OpenKM) | 2-3GB | 10GB | Bajo | - |
| rund-api (PHP) | 512MB | 2GB | Medio | 100-500ms |
| rund-mgp (Angular) | 512MB | 1GB | Bajo | - |
| rund-auth (Node.js) | 256MB | 500MB | Bajo | 50-200ms |
| redis (Cache) | 128MB | 200MB | Bajo | <10ms |
| postgres (DB) | 256MB | 500MB | Bajo | <50ms |
| rund-ollama (LLM) | 4-6GB | 6GB | Alto | 5-20s |
| rund-ai (Python) | 2GB | 2GB | Medio | 0.1-10s |
| rund-ocr (PaddleOCR) | 1-2GB | 1GB | Medio-Alto | 30-60s |
| **TOTAL** | **11-15GB** | **24GB** | - | - |

### Capacidad de Procesamiento

**Carga Inicial** (12,000 documentos):
- Ritmo: ~400 documentos/día (8 horas)
- Tiempo total: 15-30 días
- Procesamiento paralelo: posible optimizar a 10-15 días

**Operación Normal**:
- Capacidad: ~50-100 documentos/día
- Procesamiento batch nocturno: sí
- Latencia aceptable: 30-90 segundos/documento

## 🔧 Desarrollo e Integración

### Stack Tecnológico por Componente

**Backend (RUND-API)**:
- Lenguaje: PHP 8.3
- Servidor: Apache/Nginx
- Extensiones: GD, PDO, cURL, LibreOffice

**Frontend (RUND-MGP)**:
- Framework: Angular 20.x
- Lenguaje: TypeScript
- SSR: Sí (Server-Side Rendering)
- Estilos: SCSS

**Auth Service (RUND-AUTH)**:
- Lenguaje: TypeScript (Node.js 20+)
- Framework: Express.js
- Autenticación: LDAP (ldapts), OAuth 2.0 (openid-client)
- JWT: jose (RS256)
- Sesiones: Redis (ioredis), express-session
- Seguridad: helmet, cors
- Validación: zod

**AI Service (RUND-AI)**:
- Lenguaje: Python 3.9+
- Framework: Flask
- Librerías clave:
  - sentence-transformers
  - chromadb
  - requests (para Ollama)

**OCR Service (RUND-OCR)**:
- Lenguaje: Python 3.9
- Framework: Flask
- Librerías clave:
  - paddleocr
  - opencv-python
  - pdf2image
  - Pillow

### Flujo de Integración

```
Usuario (Angular)
    ↓
RUND-API (PHP)
    ↓
┌───────────────┬───────────────┐
↓               ↓               ↓
RUND-OCR    RUND-AI      RUND-Core
    ↓            ↓
    └────→ RUND-Ollama
```

### Arquitectura de Procesamiento Asíncrono (NUEVO)

RUND-AI implementa un sistema de cola FIFO (First In, First Out) con workers en background para procesar grandes volúmenes de documentos de manera eficiente:

**Componentes principales:**
1. **ExtractionQueue**: Cola FIFO thread-safe (singleton)
2. **ExtractionWorker**: Workers en threads paralelos (3 workers por defecto)
3. **ExtractionJob**: Modelo de job con estados (queued → processing → completed/failed)
4. **ExtractionIndexService**: Índice centralizado de documentos procesados

**Flujo de procesamiento asíncrono:**
```
1. RUND-API envía batch → POST /queue/add-batch
2. Jobs se encolan en ExtractionQueue (FIFO)
3. Workers toman jobs de la cola (3 workers paralelos)
4. Por cada job:
   a. Descarga PDF desde OpenKM (vía rund-api)
   b. Ejecuta OCR (rund-ocr)
   c. Extracción estructurada (NuExtract via rund-ollama)
   d. Guarda JSON side-car en OpenKM
   e. Actualiza categorías en OpenKM
   f. Actualiza índice de extracción
5. RUND-API puede consultar estado → GET /queue/job/<id>
```

**Ventajas:**
- Procesamiento paralelo de 3 documentos simultáneos
- No bloquea la API (respuesta inmediata con 202 Accepted)
- Sistema de reintentos automáticos (3 intentos máximo)
- Métricas detalladas (tiempo OCR, tiempo AI, tiempo total)
- Índice centralizado para consultas rápidas

### APIs REST Disponibles

**RUND-OCR** (Puerto 8000):
```
GET  /health          - Health check
GET  /info            - Información del servicio
POST /extract-text    - Extracción de texto (multipart/form-data)
```

**RUND-AI** (Puerto 8001):
```
# Endpoints principales
GET  /health                            - Health check
GET  /info                              - Información del servicio
POST /classify                          - Clasificación de documento
POST /extract                           - Extracción estructurada
POST /search                            - Búsqueda semántica
POST /validate                          - Validación de consistencia

# Endpoints de cola de procesamiento (NUEVO)
POST /queue/add-batch                   - Añadir batch de documentos a cola
GET  /queue/stats                       - Estadísticas de la cola
GET  /queue/job/<document_id>           - Estado de un job específico

# Endpoints de índice de extracción (NUEVO)
GET  /extraction/statistics             - Estadísticas generales del índice
GET  /extraction/professor/<cedula>     - Documentos de un profesor
```

**RUND-Ollama** (Puerto 11434):
```
GET  /api/tags        - Listar modelos
POST /api/generate    - Generar con LLM
POST /api/chat        - Chat con LLM
```

### Schemas de Extracción Estructurada (IMPLEMENTADO)

RUND-AI cuenta con **6 schemas completos** para extracción estructurada con NuExtract:

1. **Cédula de Ciudadanía** (`cedula`)
   - Prioridad: ALTA
   - Campos: número, nombres, apellidos, fecha_nacimiento, fecha_expedicion, lugar_expedicion, sexo, rh
   - Validaciones: número 6-10 dígitos, formatos de fecha

2. **Certificado Laboral** (`certificado_laboral`)
   - Prioridad: ALTA
   - Campos: entidad_emisora, nombre_empleado, cedula, cargo, fecha_inicio, fecha_fin, salario, tipo_contrato, firmante
   - Validaciones: rangos de fechas, formato salario

3. **Certificado Académico** (`certificado_academico`)
   - Prioridad: MEDIA
   - Campos: institucion, tipo_titulo, titulo, nivel_educativo, fecha_grado, matricula_profesional
   - Validaciones: niveles educativos válidos, formatos de fecha

4. **Resolución de Nombramiento** (`resolucion`)
   - Prioridad: ALTA
   - Campos: numero_resolucion, fecha, entidad_emisora, nombre_docente, cargo, vigencia
   - Validaciones: formato resolución ESAP

5. **Acta de Evaluación Docente** (`acta`)
   - Prioridad: MEDIA
   - Campos: numero_acta, fecha, nombre_docente, periodo, evaluadores, resultados
   - Validaciones: rangos de calificación, roles evaluadores

6. **Certificado de Idiomas** (`certificado_idiomas`)
   - Prioridad: BAJA
   - Campos: institucion, idioma, nivel, fecha_certificacion, vigencia
   - Validaciones: niveles MCER (A1-C2)

**Ubicación del código:**
- Schemas: [rund-ai/config/schemas.py](rund-ai/config/schemas.py)
- Mapeos: [rund-ai/config/document_type_mapping.py](rund-ai/config/document_type_mapping.py)

### Esquemas de Datos (Ejemplos)

**Cédula de Ciudadanía**:
```json
{
  "tipo_documento": "CC",
  "numero": "1234567890",
  "nombres": "JUAN CARLOS",
  "apellidos": "PEREZ GOMEZ",
  "fecha_nacimiento": "1980-05-15",
  "fecha_expedicion": "2010-03-20",
  "lugar_expedicion": "BOGOTA D.C.",
  "sexo": "M",
  "rh": "O+"
}
```

**Certificado Laboral**:
```json
{
  "tipo": "certificado_laboral",
  "entidad_emisora": "Universidad Nacional de Colombia",
  "nombre_empleado": "Juan Carlos Pérez Gómez",
  "cedula": "1234567890",
  "cargo": "Profesor Asociado",
  "fecha_inicio": "2015-01-15",
  "fecha_fin": "2023-12-31",
  "salario": "5000000",
  "tipo_contrato": "término_indefinido",
  "firmante": "Dr. María López - Decana"
}
```

### Índice de Extracción (extraction_index.json)

El sistema mantiene un **índice centralizado** de todos los documentos procesados en OpenKM:

**Ubicación:** `/okm:root/RUND/CONFIG/DATA/extraction_index.json`

**Estructura:**
```json
{
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-11-26T10:30:00",
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
      "cedula": 45,
      "certificado_laboral": 60,
      "certificado_academico": 30,
      "resolucion": 15
    },
    "by_confidence": {
      "high": 100,    // > 85%
      "medium": 40,   // 60-85%
      "low": 10       // < 60%
    },
    "processing": {
      "average_ocr_time": 12.5,
      "average_ai_time": 8.3,
      "average_total_time": 25.8,
      "queue_size": 20
    }
  },
  "documents": [...],
  "professors": {
    "71799891": {
      "cedula": "71799891",
      "total_documents": 4,
      "documents": [...]
    }
  }
}
```

**Ventajas del índice:**
- Consultas rápidas sin necesidad de recorrer OpenKM
- Estadísticas en tiempo real
- Búsqueda por profesor (cédula)
- Métricas de calidad y rendimiento

## 🐛 Troubleshooting

### Problemas Comunes

**Ollama no descarga modelos**:
```bash
# Entrar al contenedor y descargar manualmente
docker exec -it rund-ollama bash
ollama pull nuextract
ollama pull gemma2:2b
```

**OCR muy lento**:
- Verificar tamaño de imagen (reducir DPI si es muy alta)
- Revisar límites de CPU en docker-compose.yml
- Considerar procesamiento batch nocturno

**AI service sin memoria**:
```bash
# Aumentar límites en docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

**ChromaDB corrupto**:
```bash
# Eliminar y recrear
docker compose down
docker volume rm rund_ai-cache
docker compose up -d rund-ai
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
docker compose logs -f rund-ai

# Logs con timestamp
docker compose logs -f --timestamps rund-ocr

# Últimas 100 líneas
docker compose logs --tail=100 rund-ollama

# Logs de todos los servicios
docker compose logs -f > logs.txt
```

### Scripts de Diagnóstico

```bash
# Debug de red
./scripts/debug_network.sh

# Verificar salud de todos los servicios
curl http://localhost:8000/health  # OCR
curl http://localhost:8001/health  # AI
curl http://localhost:11434/api/tags  # Ollama
curl http://localhost:3000/health  # API
curl http://localhost:4000/health  # MGP
```

## 📚 Documentación Adicional

- **OpenKM**: https://docs.openkm.com/
- **PaddleOCR**: https://github.com/PaddlePaddle/PaddleOCR
- **Ollama**: https://ollama.ai/
- **NuExtract**: https://nuextract.ai/
- **ChromaDB**: https://docs.trychroma.com/
- **Sentence Transformers**: https://www.sbert.net/

## 🎯 Estado del Proyecto y Próximos Desarrollos

### ✅ Fase 1: COMPLETADA - Estructuración y Pruebas Básicas
- ✅ Configuración de contenedores Docker
- ✅ Integración Ollama + NuExtract
- ✅ Schemas JSON para 6 tipos de documentos
- ✅ APIs REST básicas
- ✅ Sistema de cola FIFO con workers
- ✅ Índice centralizado de extracción

### ✅ Fase 2: COMPLETADA - Sistema de Procesamiento Asíncrono
- ✅ Cola FIFO thread-safe (ExtractionQueue)
- ✅ Workers en background (3 workers paralelos)
- ✅ Sistema de jobs con estados (queued → processing → completed/failed)
- ✅ Reintentos automáticos (máximo 3 intentos)
- ✅ Métricas detalladas (tiempo OCR, AI, total)
- ✅ Integración con rund-api para descarga/upload

### ✅ Fase 3: COMPLETADA - Extracción Estructurada
- ✅ Implementación de NuExtract
- ✅ Schemas completos para 6 tipos de documentos:
  - Cédula de Ciudadanía
  - Certificado Laboral
  - Certificado Académico
  - Resolución de Nombramiento
  - Acta de Evaluación Docente
  - Certificado de Idiomas
- ✅ Validación de datos extraídos
- ✅ API de extracción (/extract)
- ✅ Archivos JSON side-car en OpenKM

### ✅ Fase 4: COMPLETADA (parcial) - Clasificación y Validación
- ✅ Clasificador automático (rund-ai#4, rund-api#8, rund-mgp#12)
- ✅ Validación de consistencia entre documentos (rund-ai#9, rund-api#12, rund-mgp#16)
- ⏭ Detector de duplicados (no entregado)
- ⏭ Dashboard de validación (no entregado)

### ⏭ Fase 5: NO ENTREGADA - OCR Optimizado
- ⏭ Templates para cédulas colombianas
- ⏭ Post-procesamiento y corrección
- ⏭ Detección de campos por posición
- ⏭ Validación con regex

### ✅ Fase 6: COMPLETADA (parcial) - Búsqueda y Análisis
- ✅ Búsqueda semántica con ChromaDB (rund-ai#8, rund-api#11, rund-mgp#15)
- ⏭ Análisis de tendencias (no entregado)
- ⏭ Reportes automatizados (no entregado)
- ⏭ Dashboard de estadísticas (no entregado)

**Leyenda:**
- ✅ Completado
- 🚧 En progreso
- ⏳ Implementado pero sin testing
- ❌ Pendiente

## ⚠️ Notas Importantes

### NO se requiere Fine-tuning
- Los modelos actuales (NuExtract, embeddings) son suficientes
- Se usarán templates y schemas para personalización
- Fine-tuning solo si precisión < 85% después de 2-3 meses

### Consideraciones de Despliegue
- Primera ejecución: descarga de modelos tarda 5-10 minutos
- Servicios tardan 1-2 minutos en estar completamente listos
- AI service requiere tiempo para cargar modelos en memoria
- OCR puede requerir ajustes de límites de CPU/memoria según carga

### Ubicación del Desarrollador
- País: Colombia
- Ciudad: Bogotá
- Zona horaria: America/Bogota (UTC-5)

### Conocimientos del Desarrollador
- **Fuerte**: TypeScript/JavaScript, Angular, PHP, CSS/SCSS, HTML
- **Medio**: Docker, DevOps básico, APIs REST
- **Básico**: Python (solo configuración, no desarrollo)
- **Interfaces y pruebas**: Desarrollar en PHP (rund-api) o TypeScript (rund-mgp)
- **Configuración AI/OCR**: Python (pero con documentación detallada)

---

**Última actualización**: 05 junio 2026
**Versión**: 3.2

**Cambios en v3.0:**
- ✅ Sistema de procesamiento asíncrono con cola FIFO
- ✅ 6 schemas completos de extracción estructurada
- ✅ Workers en background (3 paralelos)
- ✅ Índice centralizado de documentos procesados
- ✅ Integración completa con rund-api
- ✅ Métricas y estadísticas detalladas
