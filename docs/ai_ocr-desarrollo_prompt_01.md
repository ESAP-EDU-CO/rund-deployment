# Instrucciones para Claude Code: Estructuración Proyecto RUND-AI y RUND-OCR

**Fecha**: 31 de octubre de 2025  
**Fase**: Estructuración inicial y configuración de contenedores  
**Objetivo**: Preparar la infraestructura básica para pruebas de los módulos AI y OCR

---

## ⚠️ ADVERTENCIA IMPORTANTE SOBRE CONOCIMIENTOS DEL DESARROLLADOR

El desarrollador principal tiene las siguientes características técnicas:

### Conocimientos Fuertes
- ✅ **TypeScript/JavaScript** (lenguaje principal)
- ✅ **Angular 20.x** (framework frontend preferido)
- ✅ **PHP 8.3** (lenguaje backend)
- ✅ **CSS/SCSS/HTML** (desarrollo web)

### Conocimientos Limitados
- ⚠️ **Python**: **NINGÚN CONOCIMIENTO** para desarrollo
- ⚠️ Solo puede configurar archivos Python existentes
- ⚠️ NO puede desarrollar lógica en Python
- ⚠️ NO puede debuggear código Python complejo

### Implicaciones para el Desarrollo

**Para interfaces, pruebas, validaciones y dashboards**:
- ✅ Desarrollar en **TypeScript/Angular** (rund-mgp)
- ✅ Desarrollar en **PHP** (rund-api)
- ❌ **NO desarrollar** en Python

**Para configuración de módulos AI y OCR**:
- ✅ Proveer código Python **completo y funcional**
- ✅ Incluir **comentarios exhaustivos** en español
- ✅ Proveer **documentación detallada** de cada función
- ✅ Incluir **scripts de testing** listos para ejecutar
- ✅ Anticipar errores comunes con **troubleshooting**

**Enfoque general**:
- Los módulos Python (rund-ai, rund-ocr) deben ser **"black boxes"** funcionales
- Las interfaces de usuario y APIs de integración deben estar en **PHP/TypeScript**
- Los módulos Python solo exponen **APIs REST** para consumo desde PHP/Angular

---

## 📋 Contexto del Proyecto

Lee primero el archivo `CLAUDE.md` actualizado que contiene:
- Arquitectura completa del sistema RUND
- Casos de uso de AI y OCR
- Especificaciones técnicas
- Variables de entorno
- Comandos de despliegue

### Resumen Rápido

**RUND-OCR** (Python + Flask):
- Motor: PaddleOCR
- Puerto: 8000
- Función: Extracción de texto de documentos escaneados

**RUND-AI** (Python + Flask):
- Arquitectura híbrida de 3 capas
- Puerto: 8001
- Funciones: Extracción estructurada, clasificación, búsqueda semántica

**RUND-Ollama**:
- Motor: Ollama
- Puerto: 11434
- Modelos: nuextract, gemma2:2b

---

## 🎯 Tareas a Realizar

Ejecuta las siguientes tareas en orden. Para cada tarea, genera archivos completos y funcionales.

---

## TAREA 1: Estructura del Proyecto RUND-AI

### 1.1. Crear estructura de directorios

Crea la siguiente estructura en `./rund-ai/`:

```
rund-ai/
├── app.py                      # Aplicación Flask principal
├── Dockerfile                  # Dockerfile para construcción
├── requirements.txt            # Dependencias Python
├── .dockerignore              # Archivos a ignorar
├── config/
│   ├── __init__.py
│   ├── settings.py            # Configuración general
│   └── schemas.py             # Schemas JSON para extracción
├── services/
│   ├── __init__.py
│   ├── ollama_service.py      # Cliente para Ollama
│   ├── embeddings_service.py  # Sentence Transformers
│   ├── extractor_service.py   # NuExtract para extracción
│   ├── classifier_service.py  # Clasificación de documentos
│   ├── validator_service.py   # Validación de consistencia
│   └── search_service.py      # ChromaDB búsqueda semántica
├── models/
│   ├── __init__.py
│   └── schemas.py             # Modelos de datos Pydantic
├── api/
│   ├── __init__.py
│   ├── routes.py              # Definición de rutas API
│   ├── classify.py            # Endpoint clasificación
│   ├── extract.py             # Endpoint extracción
│   ├── search.py              # Endpoint búsqueda
│   └── validate.py            # Endpoint validación
├── utils/
│   ├── __init__.py
│   ├── logger.py              # Configuración logging
│   └── helpers.py             # Funciones auxiliares
└── tests/
    ├── __init__.py
    ├── test_extractor.py
    ├── test_classifier.py
    └── sample_data/
        └── README.md          # Instrucciones para datos de prueba
```

### 1.2. Archivo `app.py`

Crea el archivo principal de Flask con:
- Inicialización de servicios (lazy loading)
- Registro de blueprints/rutas
- Manejo de errores global
- Health check endpoint
- Info endpoint con metadata del servicio
- CORS habilitado
- Logging configurado

**Requisitos**:
- Comentarios exhaustivos en español
- Manejo de errores robusto
- Validación de variables de entorno
- Inicialización ordenada de servicios

### 1.3. Archivo `Dockerfile`

Crea un Dockerfile optimizado con:
- Base: `python:3.9-slim`
- Instalación de dependencias del sistema
- Instalación de dependencias Python
- Copia de código fuente
- Usuario no-root para seguridad
- Health check
- Comando de inicio con gunicorn

### 1.4. Archivo `requirements.txt`

Incluye todas las dependencias necesarias con versiones específicas:
- Flask y Flask-CORS
- gunicorn
- sentence-transformers
- chromadb
- requests (cliente Ollama)
- pydantic
- numpy
- Otras necesarias

### 1.5. Archivo `config/schemas.py`

Define los schemas JSON para extracción estructurada de **6 tipos de documentos**:

1. **Cédula de Ciudadanía**
2. **Certificado Laboral**
3. **Certificado Académico**
4. **Resolución de Nombramiento**
5. **Acta de Evaluación**
6. **Certificado de Idiomas**

Cada schema debe incluir:
- Campos requeridos y opcionales
- Tipos de datos esperados
- Validaciones básicas
- Ejemplo de uso en comentarios

### 1.6. Servicios principales

Implementa los siguientes servicios (archivos en `services/`):

**`ollama_service.py`**:
- Cliente HTTP para comunicación con Ollama
- Métodos: `generate()`, `chat()`, `check_health()`
- Retry logic para solicitudes
- Timeout configurable

**`embeddings_service.py`**:
- Carga del modelo Sentence Transformers
- Método `encode(text)` para generar embeddings
- Cache de embeddings
- Batch processing

**`extractor_service.py`**:
- Integración con NuExtract vía Ollama
- Método `extract(text, schema_name)` 
- Parsing de respuesta JSON
- Validación de campos extraídos

**`classifier_service.py`**:
- Clasificación de documentos por tipo
- Usa embeddings para clasificación rápida
- Validación con NuExtract para confirmar
- Retorna tipo y nivel de confianza

**`validator_service.py`**:
- Validación de consistencia entre documentos
- Verificación de cédulas, nombres
- Detección de inconsistencias
- Generación de reportes de validación

**`search_service.py`**:
- Integración con ChromaDB
- Indexación de documentos
- Búsqueda semántica
- Búsqueda por similitud

**IMPORTANTE**: Cada servicio debe:
- Tener comentarios exhaustivos
- Incluir docstrings en todas las funciones
- Manejar errores específicos
- Tener logging detallado
- Ser testeable de forma independiente

---

## TAREA 2: Dockerfile y Docker Compose Actualizados

### 2.1. Dockerfile de RUND-AI

Ya especificado en Tarea 1.3, pero asegurar:
- Multi-stage build si es posible para optimizar tamaño
- Cache de dependencias eficiente
- Health check funcional
- Variables de entorno documentadas

### 2.2. Dockerfile de RUND-OCR (revisar y optimizar)

Revisa el `Dockerfile-RUND-OCR` existente (en biblioteca de archivos) y optimízalo:
- Asegurar instalación correcta de Poppler
- Optimizar cache de layers
- Reducir tamaño de imagen si es posible
- Agregar más validaciones en build

### 2.3. Docker Compose actualizado

Modifica el `docker-compose.yml` existente para:

#### Cambiar nombre de servicio:
- `rund-ai` → `rund-ollama`

#### Agregar nuevo servicio `rund-ai`:
```yaml
rund-ai:
  image: rund-ai:latest
  build:
    context: ./rund-ai
    dockerfile: Dockerfile
  container_name: rund-ai
  restart: unless-stopped
  ports:
    - "8001:8001"
  volumes:
    - ai-models:/models
    - ai-cache:/cache
    # Development only
    - type: bind
      source: ./rund-ai
      target: /app
    - /app/venv  # Preservar virtualenv
  environment:
    - TZ=America/Bogota
    - PYTHONUNBUFFERED=1
    - FLASK_ENV=development
    # URLs internas
    - OLLAMA_URL=http://rund-ollama:11434
    - OCR_URL=http://rund-ocr:8000
    # Configuración modelos
    - EMBEDDINGS_MODEL=paraphrase-multilingual-MiniLM-L12-v2
    - VECTOR_DB_PATH=/cache/chromadb
    - NUEXTRACT_MODEL=nuextract
    - GEMMA_MODEL=gemma2:2b
  networks:
    - rund-network
  depends_on:
    - rund-ollama
    - rund-ocr
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

#### Actualizar servicio Ollama:
- Cambiar nombre de contenedor a `rund-ollama`
- Agregar comando de inicialización para pull de modelos:
```yaml
command: >
  sh -c "ollama serve & 
         sleep 10 && 
         ollama pull nuextract && 
         ollama pull gemma2:2b &&
         wait"
```

#### Agregar volúmenes:
```yaml
volumes:
  # ... existentes ...
  ai-models:
    driver: local
  ai-cache:
    driver: local
```

#### Actualizar rund-api para incluir nueva URL:
```yaml
environment:
  # ... existentes ...
  - AI_API_URL=http://rund-ai:8001
  - OLLAMA_API_URL=http://rund-ollama:11434
```

### 2.4. Variables de entorno

Crea archivos de ejemplo:

**`.env.ai.example`**:
```env
# Ollama
OLLAMA_URL=http://rund-ollama:11434
NUEXTRACT_MODEL=nuextract
GEMMA_MODEL=gemma2:2b

# Embeddings
EMBEDDINGS_MODEL=paraphrase-multilingual-MiniLM-L12-v2
EMBEDDINGS_DEVICE=cpu

# ChromaDB
VECTOR_DB_PATH=/cache/chromadb
VECTOR_DB_NAME=rund_documents

# Configuración general
FLASK_ENV=development
LOG_LEVEL=INFO
MAX_WORKERS=4
```

---

## TAREA 3: Schemas JSON y Configuración

### 3.1. Implementar schemas detallados

En `config/schemas.py`, crea schemas completos para los 6 tipos de documentos mencionados.

**Ejemplo de estructura para Cédula**:

```python
CEDULA_SCHEMA = {
    "name": "cedula_ciudadania",
    "description": "Cédula de Ciudadanía Colombiana",
    "fields": {
        "tipo_documento": {
            "type": "string",
            "required": True,
            "values": ["CC", "cedula_ciudadania"],
            "description": "Tipo de documento"
        },
        "numero": {
            "type": "string",
            "required": True,
            "pattern": r"^\d{6,10}$",
            "description": "Número de cédula (6-10 dígitos)"
        },
        "nombres": {
            "type": "string",
            "required": True,
            "description": "Nombres completos"
        },
        "apellidos": {
            "type": "string",
            "required": True,
            "description": "Apellidos completos"
        },
        "fecha_nacimiento": {
            "type": "date",
            "required": False,
            "format": "YYYY-MM-DD",
            "description": "Fecha de nacimiento"
        },
        "fecha_expedicion": {
            "type": "date",
            "required": False,
            "format": "YYYY-MM-DD",
            "description": "Fecha de expedición"
        },
        "lugar_expedicion": {
            "type": "string",
            "required": False,
            "description": "Ciudad de expedición"
        }
    },
    "validation_rules": {
        "numero_valido": "Debe ser numérico de 6-10 dígitos",
        "nombres_completos": "No debe estar vacío",
        "formato_fecha": "Formato YYYY-MM-DD"
    },
    "extraction_prompt": """
Extrae la información de la siguiente cédula de ciudadanía colombiana.
Devuelve ÚNICAMENTE un objeto JSON con los siguientes campos:
- numero: número de cédula (solo dígitos)
- nombres: nombres completos en mayúsculas
- apellidos: apellidos completos en mayúsculas
- fecha_nacimiento: en formato YYYY-MM-DD si está disponible
- fecha_expedicion: en formato YYYY-MM-DD si está disponible
- lugar_expedicion: ciudad de expedición

Si un campo no está disponible, usa null.
"""
}
```

Crea schemas similares para los otros 5 tipos de documentos, siguiendo la estructura colombiana típica.

### 3.2. Funciones auxiliares de validación

En `utils/helpers.py`, crea funciones para:
- Validar números de cédula colombianos
- Normalizar nombres (mayúsculas, caracteres especiales)
- Parsear y validar fechas en diferentes formatos
- Validar consistencia entre documentos
- Limpiar texto de OCR (correcciones comunes)

**Incluir documentación exhaustiva y ejemplos de uso**.

### 3.3. Configuración de logging

En `utils/logger.py`, configura:
- Niveles de log por entorno
- Formato de logs con timestamps
- Rotación de archivos de log
- Output tanto a consola como archivo

---

## 📝 Entregables Esperados

Al finalizar estas tareas, el proyecto debe tener:

### Estructura de Archivos
✅ Directorio `rund-ai/` completamente estructurado  
✅ Todos los archivos Python con código funcional  
✅ Dockerfiles optimizados para ambos servicios  
✅ docker-compose.yml actualizado y funcional  

### Documentación
✅ README.md en `rund-ai/` explicando estructura  
✅ README.md en `rund-ai/tests/` explicando cómo ejecutar tests  
✅ Comentarios exhaustivos en TODOS los archivos Python  
✅ Docstrings en TODAS las funciones  

### Funcionalidad
✅ Health checks funcionales en ambos servicios  
✅ Info endpoints que retornen metadata  
✅ Schemas JSON completos y validados  
✅ Servicios de AI inicializables sin errores  

### Testing
✅ Scripts básicos de prueba para cada servicio  
✅ Documentación de cómo probar cada endpoint  
✅ Ejemplos de requests con curl  

---

## 🧪 Scripts de Prueba a Incluir

### Para RUND-AI

Crea `rund-ai/tests/test_services.sh`:

```bash
#!/bin/bash
# Script de pruebas básicas para RUND-AI

echo "=== Testing RUND-AI Services ==="

# Health check
echo "1. Health check..."
curl http://localhost:8001/health

# Info
echo -e "\n2. Service info..."
curl http://localhost:8001/info

# Clasificación (con texto de ejemplo)
echo -e "\n3. Testing clasificación..."
curl -X POST http://localhost:8001/classify \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "REPÚBLICA DE COLOMBIA CÉDULA DE CIUDADANÍA No. 1234567890 NOMBRES: JUAN CARLOS APELLIDOS: PEREZ GOMEZ"
  }'

# Extracción (con schema de cédula)
echo -e "\n4. Testing extracción..."
curl -X POST http://localhost:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "REPÚBLICA DE COLOMBIA CÉDULA DE CIUDADANÍA No. 1234567890",
    "schema": "cedula"
  }'

echo -e "\n=== Tests completados ==="
```

### Para RUND-OCR

Crea `rund-ocr/tests/test_ocr.sh`:

```bash
#!/bin/bash
# Script de pruebas básicas para RUND-OCR

echo "=== Testing RUND-OCR Service ==="

# Health check
echo "1. Health check..."
curl http://localhost:8000/health

# Info
echo -e "\n2. Service info..."
curl http://localhost:8000/info

# Test OCR (necesitas un archivo de prueba)
# echo -e "\n3. Testing OCR..."
# curl -X POST http://localhost:8000/extract-text \
#   -F 'file=@tests/sample_data/cedula_test.jpg'

echo -e "\n=== Tests completados ==="
```

---

## 📚 Documentación Adicional a Generar

### README.md principal de rund-ai

Debe incluir:
- Descripción del servicio
- Requisitos previos
- Instalación y configuración
- Variables de entorno
- Cómo ejecutar localmente
- Cómo ejecutar con Docker
- Endpoints disponibles con ejemplos
- Troubleshooting común

### README.md de tests

Debe incluir:
- Cómo ejecutar tests
- Qué archivos de ejemplo se necesitan
- Resultados esperados
- Cómo interpretar errores comunes

---

## ⚠️ Consideraciones Importantes

### 1. Comentarios y Documentación

**CADA archivo Python debe tener**:
- Docstring al inicio explicando propósito del módulo
- Docstring en CADA función explicando:
  - Qué hace
  - Parámetros (tipo y descripción)
  - Retorno (tipo y descripción)
  - Excepciones que puede lanzar
  - Ejemplo de uso

**Ejemplo de documentación esperada**:

```python
def extract_with_schema(text: str, schema_name: str) -> dict:
    """
    Extrae información estructurada de un texto usando NuExtract.
    
    Esta función toma un texto (típicamente resultado de OCR) y extrae
    campos estructurados según el schema especificado. Utiliza el modelo
    NuExtract de Ollama para la extracción.
    
    Args:
        text (str): Texto del cual extraer información. Típicamente es el
                   resultado de OCR de un documento.
        schema_name (str): Nombre del schema a usar. Debe ser uno de los
                          schemas definidos en config/schemas.py:
                          - 'cedula'
                          - 'certificado_laboral'
                          - 'certificado_academico'
                          - 'resolucion'
                          - 'acta'
                          - 'certificado_idiomas'
    
    Returns:
        dict: Diccionario con los campos extraídos según el schema.
              Incluye también metadata como:
              - confidence: nivel de confianza (0.0-1.0)
              - schema_used: schema utilizado
              - timestamp: fecha/hora de extracción
    
    Raises:
        ValueError: Si el schema_name no existe
        ConnectionError: Si no se puede conectar con Ollama
        TimeoutError: Si la extracción tarda más de 30 segundos
    
    Example:
        >>> texto = "CÉDULA No. 1234567890 JUAN PEREZ"
        >>> resultado = extract_with_schema(texto, 'cedula')
        >>> print(resultado['numero'])
        '1234567890'
    """
    # Implementación...
```

### 2. Manejo de Errores

Implementa manejo robusto de errores:
- Try-except en todas las funciones críticas
- Logging de errores con contexto
- Respuestas HTTP apropiadas (400, 404, 500, 503)
- Mensajes de error informativos pero seguros

### 3. Inicialización de Servicios

Los servicios pesados (modelos) deben usar **lazy loading**:
- No cargar en import
- Cargar solo cuando se usan por primera vez
- Cachear instancias
- Proveer feedback de carga en logs

### 4. Desarrollo Incremental

Prioriza que funcione sobre que sea perfecto:
- Primero implementa funcionalidad básica
- Luego optimiza
- Documenta problemas conocidos
- Deja TODOs para mejoras futuras

### 5. Compatibilidad con PHP/TypeScript

Recuerda que las interfaces finales estarán en PHP/TypeScript:
- APIs REST deben ser simples de consumir
- Respuestas JSON claras y consistentes
- Documentación de endpoints tipo OpenAPI
- Ejemplos de consumo desde JavaScript/PHP

---

## 🚀 Comando de Inicio

Una vez completadas las tareas, el desarrollador debe poder:

```bash
# 1. Clonar/actualizar repositorio
git pull

# 2. Construir imágenes
docker compose build rund-ai rund-ocr

# 3. Levantar servicios
docker compose up -d rund-ollama rund-ocr rund-ai

# 4. Verificar salud
./rund-ai/tests/test_services.sh
./rund-ocr/tests/test_ocr.sh

# 5. Ver logs
docker compose logs -f rund-ai
```

**Todo debe funcionar sin intervención manual en Python**.

---

## 📞 Siguientes Pasos Después de Esta Fase

Una vez completada esta fase de estructuración:

1. **Integración con RUND-API (PHP)**
   - Crear cliente PHP para consumir APIs de AI y OCR
   - Implementar endpoints en rund-api para operaciones comunes
   - Manejo de archivos desde PHP hacia servicios

2. **Dashboard en RUND-MGP (Angular)**
   - Interfaz para monitoreo de procesamiento
   - Validación manual de extracciones
   - Visualización de estadísticas

3. **Optimización OCR**
   - Templates específicos para cédulas colombianas
   - Post-procesamiento de texto
   - Mejora de precisión en campos estructurados

4. **Testing con datos reales**
   - Procesar primeros 100 documentos reales
   - Medir precisión y velocidad
   - Ajustar schemas según resultados

---

## ✅ Checklist de Finalización

Antes de considerar completa esta fase, verificar:

- [ ] Estructura de directorios completa en `rund-ai/`
- [ ] Todos los archivos Python creados y funcionales
- [ ] Dockerfiles optimizados y probados
- [ ] docker-compose.yml actualizado
- [ ] Schemas JSON para 6 tipos de documentos
- [ ] Comentarios exhaustivos en código Python
- [ ] READMEs con instrucciones claras
- [ ] Scripts de prueba funcionales
- [ ] Health checks respondiendo correctamente
- [ ] Modelos de Ollama descargándose automáticamente
- [ ] Logs configurados y funcionando
- [ ] Sin errores en `docker compose up`
- [ ] Servicios accesibles en puertos esperados
- [ ] Documentación de APIs completa

---

**¿Listo para comenzar?** 🚀

Claude Code, por favor ejecuta estas tareas en orden, generando código completo, funcional y exhaustivamente documentado. Recuerda que el desarrollador NO puede trabajar con Python directamente, así que todo debe funcionar "out of the box".

Si encuentras ambigüedades o necesitas tomar decisiones de diseño, opta por la solución más simple y documentada que funcione.
