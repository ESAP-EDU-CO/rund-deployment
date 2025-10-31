# CLAUDE.md

Este archivo proporciona orientación completa sobre el proyecto RUND y sus módulos AI y OCR cuando se trabaja con código en este repositorio.

## 📋 Resumen del Proyecto

**RUND** (Repositorio Unificado Nacional de Docentes) es un sistema de gestión documental para hojas de vida profesorales de la ESAP (Escuela Superior de Administración Pública - Colombia). Gestiona aproximadamente 300 profesores con ~40 documentos cada uno (~12,000 documentos totales).

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

# Probar clasificación
curl -X POST http://localhost:8001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"texto del documento"}'

# Probar extracción estructurada
curl -X POST http://localhost:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"texto","schema":"cedula"}'
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
| rund-ollama (LLM) | 4-6GB | 6GB | Alto | 5-20s |
| rund-ai (Python) | 2GB | 2GB | Medio | 0.1-10s |
| rund-ocr (PaddleOCR) | 1-2GB | 1GB | Medio-Alto | 30-60s |
| **TOTAL** | **10-14GB** | **22GB** | - | - |

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

### APIs REST Disponibles

**RUND-OCR** (Puerto 8000):
```
GET  /health          - Health check
GET  /info            - Información del servicio
POST /extract-text    - Extracción de texto (multipart/form-data)
```

**RUND-AI** (Puerto 8001):
```
GET  /health          - Health check
GET  /info            - Información del servicio
POST /classify        - Clasificación de documento
POST /extract         - Extracción estructurada
POST /search          - Búsqueda semántica
POST /validate        - Validación de consistencia
GET  /stats           - Estadísticas y tendencias
```

**RUND-Ollama** (Puerto 11434):
```
GET  /api/tags        - Listar modelos
POST /api/generate    - Generar con LLM
POST /api/chat        - Chat con LLM
```

### Esquemas de Datos (Ejemplos)

**Cédula de Ciudadanía**:
```json
{
  "tipo": "cedula_ciudadania",
  "numero": "1234567890",
  "nombres": "JUAN CARLOS",
  "apellidos": "PEREZ GOMEZ",
  "fecha_nacimiento": "1980-05-15",
  "fecha_expedicion": "2010-03-20",
  "lugar_expedicion": "BOGOTA D.C."
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
  "firmante": "Dr. María López - Decana"
}
```

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

## 🎯 Próximos Desarrollos

### Fase Actual: Estructuración y Pruebas Básicas
- Configuración de contenedores Docker
- Integración Ollama + NuExtract
- Schemas JSON para tipos de documentos
- APIs REST básicas

### Fase 2: OCR Optimizado
- Templates para cédulas colombianas
- Post-procesamiento y corrección
- Detección de campos por posición
- Validación con regex

### Fase 3: Extracción Estructurada
- Implementación de NuExtract
- Schemas para 6-8 tipos de documentos
- Validación de datos extraídos
- API de extracción

### Fase 4: Clasificación y Validación
- Clasificador automático
- Validación de consistencia entre documentos
- Detector de duplicados
- Dashboard de validación

### Fase 5: Búsqueda y Análisis
- Búsqueda semántica con ChromaDB
- Análisis de tendencias
- Reportes automatizados
- Dashboard de estadísticas

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

**Última actualización**: 31 de octubre de 2025
**Versión**: 2.0
