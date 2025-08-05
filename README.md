# RUND - Despliegue

Stack completo de la aplicación RUND, que incluye:

- **rund-core**: OpenKM (repositorio/base de datos)
- **rund-api**: API backend (PHP)
- **rund-mgp**: Frontend (Angular 20 SSR)
- **rund-ai**: Servicio de IA con Ollama (modelo phi3:mini)
- **rund-ocr**: Servicio OCR con PaddleOCR (español/inglés)

## 🚀 Despliegue Rápido

### Desarrollo Local
```bash
# 1. Clonar este repositorio
git clone [URL-DE-ESTE-REPO] rund-deployment
cd rund-deployment

# 2. (Opcional) Configurar variables de entorno
cp .env.main .env

# 3. Desplegar
chmod +x deploy.sh
./deploy.sh local
```

### Producción
```bash
# 1. Configurar variables de entorno
cp .env.prod.main .env.prod
# Editar .env.prod con los valores correctos

# 2. Desplegar
./deploy.sh prod
```

## 📁 Estructura del Proyecto

```
rund-deployment/
├── docker-compose.yml          # Configuración para desarrollo
├── docker-compose.prod.yml     # Configuración para producción  
├── deploy.sh                   # Script principal de despliegue
├── .env.main                   # Variables de entorno (desarrollo)
├── .env.prod.main              # Variables de entorno (producción)
├── scripts/
│   └── build-and-push.sh      # Script para construir y subir imágenes
└── README.md                  # Esta documentación
```

## 🐳 Imágenes Docker

Las imágenes se almacenan en Docker Hub:

- `ocastelblanco/rund-api:latest` - API Backend
- `ocastelblanco/rund-mgp:latest` - Frontend Angular
- `ocastelblanco/rund-ocr:latest` - Servicio OCR con PaddleOCR
- `ollama/ollama:latest` - Servicio de IA

## 🌐 URLs de Acceso

### Desarrollo Local
- Frontend: http://localhost:4000
- API: http://localhost:3000  
- OpenKM: http://localhost:8080
- Ollama AI: http://localhost:11434
- OCR: http://localhost:8000

### Producción (172.16.234.52)
- Frontend: http://172.16.234.52:4000
- API: http://172.16.234.52:3000
- OpenKM: http://172.16.234.52:8080
- Ollama AI: http://172.16.234.52:11434
- OCR: http://172.16.234.52:8000

## 🤖 Servicios de IA y OCR

### Servicio de IA (Ollama)
- **Modelo**: phi3:mini (descarga automática en primer despliegue)
- **Capacidades**: Procesamiento de lenguaje natural en español
- **API**: Compatible con OpenAI API
- **Recursos**: Configurado con límites de CPU y memoria

### Servicio OCR (PaddleOCR)
- **Idiomas**: Español e inglés
- **Formatos**: PDF, imágenes (JPG, PNG, etc.)
- **Características**: Extracción de texto con coordenadas
- **Límites**: Archivos hasta 50MB, timeout de 60 segundos

## 🛠️ Comandos Útiles

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs
docker compose logs -f

# Ver logs de servicios específicos
docker compose logs -f rund-api
docker compose logs -f rund-ai
docker compose logs -f rund-ocr

# Detener todos los servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart rund-api

# Actualizar imágenes (solo producción)
docker compose pull
docker compose up -d

# Comandos específicos de IA y OCR
docker exec rund-ai ollama list                    # Listar modelos de IA
curl http://localhost:8000/health                  # Verificar OCR
curl http://localhost:11434/api/tags               # Verificar IA
```

## 🧪 Pruebas de los Servicios

### Probar el servicio OCR
```bash
# Extraer texto de un PDF
curl -X POST -F 'file=@documento.pdf' http://localhost:8000/extract-text

# Información del servicio
curl http://localhost:8000/info
```

### Probar el servicio de IA
```bash
# Generar respuesta
curl -X POST http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"phi3:mini","prompt":"Hola, ¿cómo estás?","stream":false}'

# Listar modelos disponibles
curl http://localhost:11434/api/tags
```

## 🔧 Desarrollo

Para desarrollo, necesitas clonar también los repositorios de los componentes:

```bash
# En la carpeta rund-deployment
git clone [URL-REPO-API] rund-api
git clone [URL-REPO-MGP] rund-mgp
git clone [URL-REPO-OCR] rund-ocr

# Luego usar docker-compose.yml normal
./deploy.sh local
```

## 📦 CI/CD

Para construir y subir nuevas versiones de las imágenes:

```bash
# Construir y subir todos los componentes
./scripts/build-and-push.sh v1.2.3

# Construir solo componentes específicos
./scripts/build-and-push.sh v1.2.3 api,ocr

# Construir y subir como latest
./scripts/build-and-push.sh
```

## 🔐 Variables de Entorno

### Desarrollo (.env)
- Configuración local con localhost
- Base de datos embebida
- Logs detallados
- IA y OCR con configuración de desarrollo

### Producción (.env.prod)  
- URLs del servidor de producción
- Optimizaciones de rendimiento
- Logs de nivel ERROR únicamente
- Límites de recursos para IA y OCR

## ⚙️ Requisitos del Sistema

### Desarrollo Local
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM mínimo (recomendado 16GB)
- 20GB espacio libre para imágenes y modelos

### Producción
- Docker 20.10+
- Docker Compose 2.0+
- 16GB RAM mínimo (recomendado 32GB)
- 50GB espacio libre
- CPU multi-core (recomendado 8+ cores)

**Importante**: Los servicios de IA y OCR requieren recursos significativos. En la primera ejecución, la descarga del modelo de IA puede tomar varios minutos.

## 🆘 Solución de Problemas

### Error: "No se puede conectar a la API"
1. Verificar que todos los servicios estén corriendo: `docker compose ps`
2. Revisar logs de la API: `docker compose logs rund-api`
3. Verificar variables de entorno en el archivo `.env` o `.env.prod`

### Error: "OCR service not available"
1. Verificar estado del contenedor: `docker compose ps rund-ocr`
2. Revisar logs: `docker compose logs rund-ocr`
3. Verificar health check: `curl http://localhost:8000/health`
4. El servicio puede tardar 1-2 minutos en estar listo

### Error: "AI model not found"
1. Verificar que el modelo está descargado: `docker exec rund-ai ollama list`
2. Descargar manualmente: `docker exec rund-ai ollama pull phi3:mini`
3. Revisar logs del servicio: `docker compose logs rund-ai`
4. La primera descarga puede tomar 5-10 minutos

### Problemas de memoria/rendimiento
1. Verificar uso de recursos: `docker stats`
2. Ajustar límites en docker-compose según hardware disponible
3. Considerar usar modelos más pequeños para desarrollo
4. En sistemas con poca RAM, desactivar temporalmente IA/OCR

### Puertos ocupados
1. Verificar qué está usando los puertos: `netstat -tulpn | grep :8000`
2. Cambiar los puertos en el archivo docker-compose si es necesario
3. Reiniciar Docker: `sudo systemctl restart docker`

## 🔄 Arquitecturas Soportadas

- **linux/amd64**: Completamente soportado
- **linux/arm64**: Soportado (Apple Silicon, Raspberry Pi 4+)

**Nota**: OpenKM y Ollama requieren emulación en ARM64, lo que puede afectar el rendimiento.

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades, crear un issue en el repositorio correspondiente:

- Issues del stack completo: Este repositorio
- Issues de la API: Repositorio rund-api  
- Issues del frontend: Repositorio rund-mgp
- Issues del OCR: Repositorio rund-ocr

## 📈 Monitoreo

```bash
# Verificar estado de todos los servicios
./deploy.sh local  # o prod, muestra resumen al final

# Verificar uso de recursos
docker stats

# Verificar logs en tiempo real
docker compose logs -f --tail=100

# Health checks manuales
curl http://localhost:3000/health   # API
curl http://localhost:4000/health   # Frontend  
curl http://localhost:8000/health   # OCR
curl http://localhost:11434/api/tags # IA
```