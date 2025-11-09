# RUND - Registro Único Nacional Docente

Sistema de gestión documental para hojas de vida profesorales de la ESAP (Escuela Superior de Administración Pública - Colombia).

**Alcance**: ~300 profesores | ~40 documentos/profesor | ~12,000 documentos totales

---

## 🏗️ Arquitectura del Sistema

RUND es una aplicación basada en **microservicios Docker** que separa responsabilidades en 7 servicios principales:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA RUND                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      ┌─────────────────┐                            │
│                      │   rund-auth     │  ⚠️ EN DESARROLLO          │
│                      │   (Node.js)     │                            │
│                      │   Port: 8080    │                            │
│                      │   Entra ID OIDC │                            │
│                      └────────┬────────┘                            │
│                               │ JWT                                 │
│                               │                                     │
│  ┌──────────────┐      ┌─────▼────────┐      ┌──────────────┐      │
│  │  rund-mgp    │      │  rund-api    │      │  rund-core   │      │
│  │  (Frontend)  │─────▶│  (Backend)   │─────▶│  (OpenKM)    │      │
│  │  Angular 20  │      │  PHP 8.3     │      │  Java/Tomcat │      │
│  │  Port: 4000  │      │  Port: 3000  │      │  Port: 8080  │      │
│  └──────────────┘      └──────┬───────┘      └──────────────┘      │
│         │                     │                                     │
│         │      ┌──────────────┼──────────────┐                      │
│         │      │              │              │                      │
│         │   ┌──▼──────┐ ┌────▼─────┐ ┌──────▼──────┐               │
│         │   │rund-ocr │ │ rund-ai  │ │ rund-ollama │               │
│         │   │ (OCR)   │ │ (AI API) │ │   (LLM)     │               │
│         │   │Paddle   │ │  Flask   │ │  NuExtract  │               │
│         │   │Port:8000│ │Port: 8001│ │ Port: 11434 │               │
│         │   └─────────┘ └──────────┘ └─────────────┘               │
│         │                                                           │
│         └───────────────────────────────────────────────────────    │
│                                                                     │
│  Red: rund-network (bridge)                                        │
│  Volúmenes: openkm-data, ollama-data, ocr-models, ai-cache         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes del Sistema

### 1. **rund-core** - Repositorio de Documentos
- **Tecnología**: OpenKM (Java/Tomcat)
- **Función**: Almacenamiento y gestión de documentos
- **Puerto**: 8080
- **Volumen**: `openkm-data` (persistencia de documentos)
- **Plataforma**: linux/amd64
- **Recursos**: 2-3GB RAM

### 2. **rund-api** - Backend API
- **Tecnología**: PHP 8.3 + Apache
- **Función**: API REST, lógica de negocio, orquestación de servicios
- **Puerto**: 3000
- **Dependencias**: LibreOffice (conversión de documentos)
- **Recursos**: 512MB RAM
- **Endpoints principales**:
  - `/api/documentos` - CRUD de documentos
  - `/api/profesores` - Gestión de profesores
  - `/api/ocr/extract` - Proxy a rund-ocr
  - `/api/ai/extract` - Proxy a rund-ai

### 3. **rund-mgp** - Frontend
- **Tecnología**: Angular 20 + TypeScript + SSR
- **Función**: Interface de usuario
- **Puerto**: 4000
- **Características**:
  - Server-Side Rendering (SSR)
  - Componentes reactivos
  - Gestión de estado centralizada
- **Recursos**: 512MB RAM

### 4. **rund-ocr** - Servicio de OCR
- **Tecnología**: Python 3.9 + Flask + PaddleOCR
- **Función**: Extracción de texto desde imágenes y PDFs
- **Puerto**: 8000
- **Idiomas soportados**: Español, Inglés
- **Formatos**: PDF, PNG, JPG, TIFF, BMP
- **Límites**: 50MB por archivo, 60s timeout
- **Volúmenes**:
  - `ocr-temp` (archivos temporales)
  - `ocr-models` (cache de modelos PaddleOCR)
- **Recursos**: 1-2GB RAM

**Endpoints**:
```bash
GET  /health          # Health check
GET  /info            # Información del servicio
POST /extract-text    # Extracción de texto (multipart/form-data)
```

### 5. **rund-ai** - Servicio de Inteligencia Artificial
- **Tecnología**: Python 3.9+ + Flask + Sentence Transformers + ChromaDB
- **Función**: Extracción estructurada de datos, búsqueda semántica, validación
- **Puerto**: 8001
- **Modelos**:
  - `paraphrase-multilingual-MiniLM-L12-v2` (embeddings, ~120MB)
  - Validadores de datos implementados
- **Volúmenes**:
  - `ai-models` (modelos de embeddings)
  - `ai-cache` (ChromaDB para búsqueda semántica)
- **Recursos**: 2GB RAM

**Endpoints**:
```bash
GET  /health          # Health check
GET  /info            # Información del servicio
POST /extract         # Extracción estructurada (JSON)
POST /classify        # Clasificación de documento
POST /search          # Búsqueda semántica
POST /validate        # Validación de consistencia
GET  /stats           # Estadísticas y tendencias
```

**Características avanzadas**:
- ✅ Validación post-extracción implementada
- ✅ Limpieza de datos (números, texto)
- ✅ Confianza por campo (0-100%)
- ✅ Detección de datos sospechosos

### 6. **rund-ollama** - Motor LLM
- **Tecnología**: Ollama (servidor de modelos de lenguaje)
- **Función**: Modelos de IA para extracción y generación
- **Puerto**: 11434
- **Modelos instalados**:
  - `nuextract` (basado en Phi-3-mini, ~3.8GB) - Extracción estructurada
  - `gemma2:2b` (~2GB) - Análisis complejo y resúmenes
- **Volumen**: `ollama-data` (persistencia de modelos)
- **Recursos**: 4-6GB RAM
- **Primera ejecución**: Descarga de modelos ~5-10 minutos

**Endpoints**:
```bash
GET  /api/tags        # Listar modelos instalados
POST /api/generate    # Generar con LLM
POST /api/chat        # Chat con LLM
```

### 7. **rund-auth** - Autenticación y Autorización ⚠️ **EN DESARROLLO**
- **Tecnología**: Node.js 20+ + TypeScript + Express
- **Función**: Servicio de autenticación con Microsoft Entra ID (M365) de la ESAP
- **Puerto**: 8080
- **Estado**: Fase inicial de desarrollo
- **Recursos**: 256MB RAM
- **Arquitectura**:
  - **Módulo de acoplamiento débil**: Sin base de datos, solo validación de tokens
  - **OpenID Connect (OIDC)**: Integración con Azure Entra ID
  - **JWT pass-through**: Valida y reenvía tokens de Entra ID a servicios internos

**Características implementadas**:
- ✅ Flujo OAuth2/OIDC con Microsoft Entra ID
- ✅ Validación de tokens de Entra ID
- ✅ Modo DEV con login falso para desarrollo local
- ⏳ Integración con rund-api y rund-mgp (pendiente)
- ⏳ Middleware de autorización (pendiente)

**Endpoints**:
```bash
GET  /oauth/login      # Iniciar login con Entra ID
GET  /oauth/callback   # Callback de OAuth2
GET  /validate         # Validar token (middleware)
GET  /dev/login        # Login falso (solo DEV)
```

**Flujo de autenticación**:
```
Usuario → rund-mgp → rund-auth (/oauth/login)
                          ↓
                    Microsoft Entra ID (M365 ESAP)
                          ↓
              rund-auth (/oauth/callback)
                          ↓
              Valida token y retorna a rund-mgp
                          ↓
              rund-mgp incluye token en requests a rund-api
                          ↓
              rund-api valida con rund-auth (/validate)
```

---

## 🔄 Flujo de Datos

### Extracción de Documentos (OCR + IA)

```
Usuario sube PDF
       ↓
rund-mgp (Angular) - Interface de carga
       ↓
rund-api (PHP) - Recibe archivo
       ↓
┌──────┴──────────────────────────────┐
│                                     │
↓                                     ↓
rund-core (OpenKM)            rund-ocr (PaddleOCR)
Almacena PDF                  Extrae texto (30-60s)
       ↓                             ↓
       │                      rund-ai (Flask)
       │                      Valida y limpia datos
       │                             ↓
       │                      rund-ollama (NuExtract)
       │                      Extracción estructurada (60-300s)
       │                             ↓
       └─────────────────────────────┘
                    ↓
            Datos extraídos + validados
                    ↓
            rund-api procesa y guarda
                    ↓
            rund-mgp muestra resultado
```

### Búsqueda Semántica

```
Usuario busca "certificado laboral universidad"
       ↓
rund-mgp → rund-api → rund-ai (embeddings)
                           ↓
                      ChromaDB busca vectores similares
                           ↓
                      Retorna documentos relevantes
```

---

## 🚀 Despliegue Rápido

### Requisitos del Sistema

**Desarrollo Local**:
- Docker 20.10+
- Docker Compose 2.0+
- RAM: 16GB (mínimo 8GB)
- Disco: 20GB libres
- CPU: 4+ cores
- SO: macOS, Linux, Windows con WSL2

**Producción**:
- Docker 20.10+
- Docker Compose 2.0+
- RAM: 16GB mínimo (recomendado 32GB)
- Disco: 50GB libres
- CPU: 8+ cores
- SO: Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+)

### Instalación - Desarrollo Local

```bash
# 1. Clonar este repositorio
git clone https://github.com/esap/rund-deployment.git
cd rund-deployment

# 2. (Opcional) Configurar variables de entorno
cp .env.main .env
# Editar .env si es necesario

# 3. Desplegar todos los servicios
chmod +x deploy.sh
./deploy.sh local

# 4. Esperar a que los servicios estén listos (~2-3 minutos)
# La primera vez descargará ~10GB de imágenes y modelos

# 5. Verificar estado
docker compose ps
```

### Instalación - Producción

```bash
# 1. Clonar en servidor de producción
git clone https://github.com/esap/rund-deployment.git
cd rund-deployment

# 2. Configurar variables de entorno
cp .env.prod.main .env.prod
nano .env.prod  # Editar con IP/dominio del servidor

# 3. Desplegar
./deploy.sh prod

# 4. Verificar
docker compose -f docker-compose.prod.yml ps
```

---

## 🌐 URLs de Acceso

### Desarrollo Local

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:4000 | - |
| **API** | http://localhost:3000 | - |
| **OpenKM** | http://localhost:8080/OpenKM | admin/admin |
| **OCR** | http://localhost:8000 | - |
| **AI** | http://localhost:8001 | - |
| **Ollama** | http://localhost:11434 | - |
| **Auth** | http://localhost:8080 | - (Entra ID) |

### Producción (ejemplo: 172.16.234.52)

| Servicio | URL |
|----------|-----|
| **Frontend** | http://172.16.234.52:4000 |
| **API** | http://172.16.234.52:3000 |
| **OpenKM** | http://172.16.234.52:8080/OpenKM |
| **OCR** | http://172.16.234.52:8000 |
| **AI** | http://172.16.234.52:8001 |
| **Auth** | http://172.16.234.52:8080 |

---

## 🧪 Verificación de Servicios

### Health Checks

```bash
# Verificar todos los servicios
curl http://localhost:3000/health   # API
curl http://localhost:4000/health   # Frontend (si implementado)
curl http://localhost:8000/health   # OCR
curl http://localhost:8001/health   # AI
curl http://localhost:11434/api/tags # Ollama (lista modelos)
curl http://localhost:8080/oauth/login # Auth (debe redirigir)

# Script de verificación rápida
./scripts/check-health.sh  # (si existe)
```

### Prueba de OCR

```bash
# Extraer texto de un PDF
curl -X POST http://localhost:8000/extract-text \
  -F 'file=@/ruta/a/documento.pdf'

# Información del servicio
curl http://localhost:8000/info
```

### Prueba de AI

```bash
# Extracción estructurada de cédula
curl -X POST http://localhost:8001/extract \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "CEDULA DE CIUDADANIA 12345678 JUAN PEREZ",
    "tipo_documento": "cedula"
  }'

# Clasificar documento
curl -X POST http://localhost:8001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text": "CERTIFICADO LABORAL..."}'
```

### Prueba de Ollama

```bash
# Listar modelos instalados
docker exec rund-ollama ollama list

# Verificar API
curl http://localhost:11434/api/tags

# Generar con NuExtract
curl -X POST http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "nuextract",
    "prompt": "Extrae datos de: CEDULA 12345678 JUAN PEREZ",
    "stream": false
  }'
```

### Prueba de Auth (Desarrollo)

```bash
# Login en modo DEV (fake login)
curl http://localhost:8080/oauth/login
# Redirige a /dev/login?email=dev@local.test

# Validar token (desde rund-api)
curl -X GET http://localhost:8080/validate \
  -H 'Authorization: Bearer <token-de-entra-id>'

# En producción con Entra ID configurado:
# 1. Navegar a http://localhost:8080/oauth/login
# 2. Autenticar con credenciales de M365 ESAP
# 3. Callback retorna token de Entra ID
# 4. rund-mgp usa el token para requests a rund-api
```

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado de todos los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de servicio específico
docker compose logs -f rund-api
docker compose logs -f rund-ai
docker compose logs -f rund-ocr
docker compose logs -f rund-ollama

# Reiniciar servicio específico
docker compose restart rund-api

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra datos)
docker compose down -v

# Reconstruir y levantar (después de cambios en código)
docker compose up -d --build

# Ver uso de recursos
docker stats
```

### Gestión de Modelos de IA

```bash
# Entrar al contenedor de Ollama
docker exec -it rund-ollama bash

# Listar modelos
docker exec rund-ollama ollama list

# Descargar modelo manualmente
docker exec rund-ollama ollama pull nuextract
docker exec rund-ollama ollama pull gemma2:2b

# Eliminar modelo
docker exec rund-ollama ollama rm modelo_viejo
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls | grep rund

# Ver tamaño de volúmenes
docker system df -v

# Backup de volumen OpenKM
docker run --rm -v rund_openkm-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/openkm-backup-$(date +%Y%m%d).tar.gz /data

# Restaurar backup
docker run --rm -v rund_openkm-data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/openkm-backup-20241106.tar.gz -C /
```

---

## 📂 Estructura del Proyecto

```
rund-deployment/
├── docker-compose.yml          # Configuración desarrollo
├── docker-compose.prod.yml     # Configuración producción
├── deploy.sh                   # Script principal de despliegue
├── .env.main                   # Variables desarrollo
├── .env.prod.main              # Variables producción
├── CLAUDE.md                   # Guía completa del proyecto para IA
├── README.md                   # Esta documentación
├── scripts/
│   ├── build-and-push.sh       # Build y push de imágenes Docker
│   ├── debug_network.sh        # Debug de red Docker
│   └── check-health.sh         # Verificación de servicios
├── docs/
│   ├── arquitectura.md         # Documentación de arquitectura
│   ├── ai_ocr-prompt_03.md     # Análisis de OCR/AI
│   └── prompt_04_plan_implementacion_demo.md
├── pruebas/
│   ├── resultados_extraccion_cedula-2025-10-06.md
│   ├── resultados_validacion_critica.md
│   └── *.pdf                   # Documentos de prueba
└── rund-*/                     # Repositorios de componentes (desarrollo)
    ├── rund-api/
    ├── rund-mgp/
    ├── rund-ai/
    └── rund-ocr/
```

---

## 🐳 Imágenes Docker

### Repositorio: Docker Hub (ocastelblanco)

| Imagen | Tag | Tamaño | Plataforma |
|--------|-----|--------|------------|
| `ocastelblanco/rund-api` | latest, v1.x.x | ~500MB | amd64, arm64 |
| `ocastelblanco/rund-mgp` | latest, v1.x.x | ~300MB | amd64, arm64 |
| `ocastelblanco/rund-ocr` | latest, v1.x.x | ~2GB | amd64, arm64 |
| `ocastelblanco/rund-ai` | latest, v1.x.x | ~1.5GB | amd64, arm64 |
| `ocastelblanco/rund-auth` | latest, v0.1.x | ~100MB | amd64, arm64 |
| `ollama/ollama` | latest | ~500MB | amd64, arm64 |
| `openkm/openkm-ce` | latest | ~1GB | amd64 |

### Build y Push de Imágenes

```bash
# Build y push de todas las imágenes con versionado
./scripts/build-and-push.sh v1.2.3

# Build de componentes específicos
./scripts/build-and-push.sh v1.2.3 api,ocr,ai,auth

# Build sin versionado (solo latest)
./scripts/build-and-push.sh

# Build solo rund-auth
cd rund-auth && docker build -t ocastelblanco/rund-auth:latest .
```

---

## 📊 Uso de Recursos

### Por Servicio

| Servicio | RAM | Disco | CPU | Latencia Típica |
|----------|-----|-------|-----|-----------------|
| rund-core (OpenKM) | 2-3GB | 10GB | Bajo | - |
| rund-api (PHP) | 512MB | 2GB | Medio | 100-500ms |
| rund-mgp (Angular) | 512MB | 1GB | Bajo | - |
| rund-ollama (LLM) | 4-6GB | 6GB | Alto | 5-20s |
| rund-ai (Python) | 2GB | 2GB | Medio | 0.1-10s |
| rund-ocr (PaddleOCR) | 1-2GB | 1GB | Medio-Alto | 30-60s |
| rund-auth (Node.js) | 256MB | 100MB | Bajo | 10-50ms |
| **TOTAL** | **10-14GB** | **22GB** | - | - |

### Capacidad de Procesamiento

**Carga Inicial** (12,000 documentos):
- Ritmo: ~400 documentos/día (8 horas)
- Tiempo total estimado: 15-30 días
- Procesamiento paralelo: posible optimizar a 10-15 días

**Operación Normal**:
- Capacidad: ~50-100 documentos/día
- Procesamiento batch nocturno: recomendado
- Latencia aceptable: 30-90 segundos/documento

---

## 🔧 Variables de Entorno

### Desarrollo (.env)

```bash
# API
API_BASE_URL=http://localhost:3000
CORE_API_URL=http://rund-core:8080/OpenKM
OCR_API_URL=http://rund-ocr:8000
AI_API_URL=http://rund-ai:8001
OLLAMA_API_URL=http://rund-ollama:11434

# OCR
PADDLE_OCR_LANG=es,en
PADDLE_OCR_USE_GPU=false
MAX_FILE_SIZE=50MB
OCR_TIMEOUT=60

# AI
OLLAMA_URL=http://rund-ollama:11434
EMBEDDINGS_MODEL=paraphrase-multilingual-MiniLM-L12-v2
VECTOR_DB_PATH=/cache/chromadb
NUEXTRACT_MODEL=nuextract
GEMMA_MODEL=gemma2:2b
OLLAMA_TIMEOUT=300

# Ollama
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_KEEP_ALIVE=5m

# Auth
DEV_FAKE_LOGIN=true
AZURE_TENANT_ID=<tenant-id-esap>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=<secret>
AZURE_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
APP_BASE_URL=http://localhost:8080
ALLOWED_REDIRECT_URLS=http://localhost:4000
```

### Producción (.env.prod)

```bash
# Similar a desarrollo, pero con:
# - URLs de producción (172.16.234.52 o dominio)
# - Logs de nivel ERROR
# - Límites de recursos optimizados
# - Configuraciones de seguridad

# Auth en producción
DEV_FAKE_LOGIN=false
AZURE_TENANT_ID=<tenant-id-real-esap>
AZURE_CLIENT_ID=<client-id-real>
AZURE_CLIENT_SECRET=<secret-real>
APP_BASE_URL=https://auth.rund.esap.edu.co
ALLOWED_REDIRECT_URLS=https://rund.esap.edu.co
```

---

## 🆘 Solución de Problemas

### 1. Servicio no responde

```bash
# Verificar estado
docker compose ps

# Ver logs
docker compose logs -f <servicio>

# Reiniciar servicio
docker compose restart <servicio>
```

### 2. OCR muy lento o falla

**Síntomas**: Timeout, procesamiento >60s

**Soluciones**:
```bash
# Verificar recursos
docker stats rund-ocr

# Aumentar timeout en .env
OCR_TIMEOUT=120

# Verificar tamaño de imagen (reducir si >5MB)
# Verificar límites de CPU en docker-compose.yml
```

### 3. AI/Ollama timeout

**Síntomas**: Error después de 300s (5 minutos)

**Soluciones**:
```bash
# Verificar que modelos estén descargados
docker exec rund-ollama ollama list

# Descargar manualmente si falta
docker exec rund-ollama ollama pull nuextract

# Aumentar timeout en .env
OLLAMA_TIMEOUT=600

# Verificar memoria disponible
docker stats rund-ollama
```

### 4. Modelos de IA no se descargan

```bash
# Entrar al contenedor
docker exec -it rund-ollama bash

# Descargar manualmente
ollama pull nuextract
ollama pull gemma2:2b

# Verificar espacio en disco
df -h

# Verificar logs
docker compose logs -f rund-ollama
```

### 5. ChromaDB corrupto

```bash
# Detener servicios
docker compose down

# Eliminar volumen de AI cache
docker volume rm rund_ai-cache

# Levantar nuevamente
docker compose up -d rund-ai
```

### 6. Puertos ocupados

```bash
# Verificar qué usa el puerto
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"  # Mapea puerto externo 8001 a interno 8000
```

### 7. Problemas de memoria

```bash
# Ver uso actual
docker stats

# Aumentar límites en docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G

# Reiniciar Docker (libera memoria)
# macOS: Docker Desktop → Restart
# Linux: sudo systemctl restart docker
```

---

## 🔐 Seguridad

### Recomendaciones de Producción

1. **Cambiar credenciales por defecto**:
   - OpenKM: admin/admin → admin/contraseña_segura
   - Auth: Configurar credenciales reales de Entra ID en `.env.prod`

2. **Configurar HTTPS**:
   - Usar reverse proxy (Nginx/Traefik)
   - Certificados SSL (Let's Encrypt)

3. **Firewall**:
   - Cerrar puertos innecesarios
   - Permitir solo 80/443 externamente

4. **Backups**:
   - Programar backups diarios de volúmenes
   - Guardar en ubicación externa

5. **Actualizaciones**:
   - Revisar actualizaciones de imágenes semanalmente
   - Probar en desarrollo antes de producción

---

## 📈 Monitoreo

### Dashboard de Estado

```bash
# Verificar todos los servicios
./deploy.sh local  # Muestra resumen al final

# Uso de recursos en tiempo real
docker stats

# Health checks
curl http://localhost:3000/health && echo " ✓ API OK"
curl http://localhost:8000/health && echo " ✓ OCR OK"
curl http://localhost:8001/health && echo " ✓ AI OK"
curl http://localhost:11434/api/tags && echo " ✓ Ollama OK"
curl -I http://localhost:8080/oauth/login && echo " ✓ Auth OK"
```

### Logs Centralizados

```bash
# Todos los servicios
docker compose logs -f --tail=100

# Solo errores
docker compose logs -f | grep -i error

# Guardar logs en archivo
docker compose logs --since 1h > logs-$(date +%Y%m%d-%H%M).txt
```

---

## 🧑‍💻 Desarrollo

### Clonar Repositorios para Desarrollo

```bash
# En la carpeta rund-deployment
git clone https://github.com/esap/rund-api.git
git clone https://github.com/esap/rund-mgp.git
git clone https://github.com/esap/rund-ai.git
git clone https://github.com/esap/rund-ocr.git
git clone https://github.com/esap/rund-auth.git

# Usar docker-compose normal (monta código local)
./deploy.sh local
```

### Configuración Inicial de rund-auth (Desarrollo)

```bash
# Entrar a la carpeta
cd rund-auth

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Levantar en modo desarrollo (sin Docker)
npm run dev

# Verificar que funciona
curl http://localhost:8080/oauth/login
```

### Hot Reload (Desarrollo)

- **rund-mgp**: Angular CLI con hot reload automático
- **rund-api**: Requiere reinicio manual después de cambios
- **rund-ai/ocr**: Requiere reinicio del contenedor
- **rund-auth**: Hot reload con `npm run dev` (usa tsx watch)

```bash
# Reiniciar después de cambios
docker compose restart rund-api

# rund-auth en modo desarrollo local (fuera de Docker)
cd rund-auth/rund-auth
npm install
npm run dev  # Hot reload automático con tsx
```

---

## 📚 Documentación Adicional

- **[CLAUDE.md](CLAUDE.md)** - Guía completa del proyecto (casos de uso, tipos de documentos, comandos)
- **[docs/arquitectura.md](docs/arquitectura.md)** - Detalles de arquitectura
- **[docs/ai_ocr-prompt_03.md](docs/ai_ocr-prompt_03.md)** - Análisis de precisión OCR/AI
- **[pruebas/resultados_validacion_critica.md](pruebas/resultados_validacion_critica.md)** - Resultados de validación de datos

### Enlaces Externos

- **OpenKM**: https://docs.openkm.com/
- **PaddleOCR**: https://github.com/PaddlePaddle/PaddleOCR
- **Ollama**: https://ollama.ai/
- **NuExtract**: https://nuextract.ai/
- **ChromaDB**: https://docs.trychroma.com/
- **Sentence Transformers**: https://www.sbert.net/

---

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades:

- **Issues del stack completo**: Este repositorio
- **Issues de la API**: Repositorio rund-api
- **Issues del frontend**: Repositorio rund-mgp
- **Issues del AI**: Repositorio rund-ai
- **Issues del OCR**: Repositorio rund-ocr

---

## 📋 Roadmap

### ✅ Completado (v1.0)
- Arquitectura de microservicios con 7 contenedores
- OCR con PaddleOCR (español/inglés)
- Extracción estructurada con NuExtract
- Validación y limpieza de datos post-extracción
- Búsqueda semántica con ChromaDB
- Servicio de autenticación con Entra ID (fase inicial)

### 🚧 En Progreso (v1.1)
- **rund-auth**: Integración con rund-api y rund-mgp
- **rund-auth**: Middleware de validación de tokens
- Pre-procesamiento de imágenes para OCR
- Procesamiento por zonas (ROI) para cédulas
- Detección automática de formato de cédula
- Mejora de precisión de extracción (OCR)

### 📅 Planificado (v1.2+)
- **rund-auth**: Caché de validaciones de tokens
- **rund-auth**: Logs de auditoría de accesos
- Fine-tuning de modelos de IA
- Dashboard de estadísticas y métricas
- Procesamiento batch automatizado nocturno
- API de webhooks para notificaciones
- Sistema de workflows para aprobaciones
- Interfaz de administración mejorada

---

## 📄 Licencia

[Definir licencia según política de ESAP]

---

## 👥 Contribuidores

- **ESAP** - Escuela Superior de Administración Pública
- **Equipo de Desarrollo RUND** - Implementación y mantenimiento

---

**Última actualización**: Noviembre 2024
**Versión del documento**: 2.0
**Contacto**: [Definir contacto]
