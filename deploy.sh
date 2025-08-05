#!/bin/bash

# Script de despliegue para RUND
# Uso: ./deploy.sh [local|prod]

set -e

ENVIRONMENT=${1:-local}

echo "🚀 Iniciando despliegue de RUND en entorno: $ENVIRONMENT"

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [local|prod]"
    echo ""
    echo "Opciones:"
    echo "  local    Despliegue local (desarrollo)"
    echo "  prod     Despliegue en producción"
    echo "  help     Muestra esta ayuda"
    exit 0
}

# Verificar argumentos
if [ "$ENVIRONMENT" = "help" ] || [ "$ENVIRONMENT" = "--help" ] || [ "$ENVIRONMENT" = "-h" ]; then
    show_help
fi

# Configurar archivos según el entorno
if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    BASE_URL="172.16.234.52"
    
    echo "📋 Verificando configuración de producción..."
    
    # Verificar que existe el archivo de entorno
    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ Error: No se encuentra $ENV_FILE"
        echo "💡 Copia $ENV_FILE.main y configúralo:"
        echo "   cp $ENV_FILE.main $ENV_FILE"
        exit 1
    fi
    
elif [ "$ENVIRONMENT" = "local" ]; then
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
    BASE_URL="localhost"
    
    echo "📋 Configuración local detectada"
    
else
    echo "❌ Error: Entorno '$ENVIRONMENT' no válido"
    show_help
fi

# Verificar que Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose"
    exit 1
fi

# Verificar que existe el archivo compose
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: No se encuentra $COMPOSE_FILE"
    exit 1
fi

echo "📁 Usando archivo: $COMPOSE_FILE"

# Crear directorios necesarios
echo "📂 Creando directorios necesarios..."
mkdir -p logs tmp

# Detener servicios existentes si están corriendo
echo "🛑 Deteniendo servicios existentes..."
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Para producción, hacer pull de las últimas imágenes
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "📥 Descargando últimas imágenes..."
    docker compose -f "$COMPOSE_FILE" pull
fi

# Levantar los servicios
echo "🔄 Iniciando servicios..."
if [ -f "$ENV_FILE" ]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
else
    docker compose -f "$COMPOSE_FILE" up -d
fi

# Verificar que los servicios estén corriendo
echo "⏳ Esperando que los servicios estén listos..."
sleep 20

# Función para verificar si un servicio está ejecutándose
check_service_running() {
    local service_name="$1"
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "$service_name.*Up\|$service_name.*running"; then
        return 0
    else
        return 1
    fi
}

# Función para verificar si un modelo de Ollama está instalado
check_ollama_model() {
    local model_name="$1"
    local container_name="rund-ai"
    
    echo "🔍 Verificando modelo de IA: $model_name"
    
    if ! check_service_running "rund-ai"; then
        echo "⚠️  Contenedor rund-ai no está ejecutándose, saltando configuración de modelo de IA"
        return 1
    fi
    
    # Esperar a que Ollama esté completamente listo
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$container_name" ollama list 2>/dev/null | grep -q "$model_name"; then
            echo "✅ Modelo $model_name ya está instalado"
            return 0
        elif docker exec "$container_name" ollama list >/dev/null 2>&1; then
            echo "📥 Descargando modelo $model_name... (esto puede tomar varios minutos)"
            if timeout 600 docker exec "$container_name" ollama pull "$model_name"; then
                echo "✅ Modelo $model_name descargado exitosamente"
                return 0
            else
                echo "❌ Error o timeout al descargar el modelo $model_name"
                return 1
            fi
        else
            echo "⏳ Esperando que Ollama esté listo... (intento $attempt/$max_attempts)"
            sleep 15
            ((attempt++))
        fi
    done
    
    echo "❌ Timeout esperando que Ollama esté listo"
    return 1
}

# Función para verificar el servicio OCR
check_ocr_service() {
    echo "🔍 Verificando servicio OCR..."
    
    if ! check_service_running "rund-ocr"; then
        echo "⚠️  Contenedor rund-ocr no está ejecutándose"
        return 1
    fi
    
    local max_attempts=15
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if timeout 10 docker exec rund-ocr curl -f http://localhost:8000/health >/dev/null 2>&1; then
            echo "✅ Servicio OCR funcionando correctamente"
            return 0
        else
            echo "⏳ Esperando que el servicio OCR esté listo... (intento $attempt/$max_attempts)"
            sleep 15
            ((attempt++))
        fi
    done
    
    echo "⚠️  Timeout esperando que el servicio OCR esté listo"
    return 1
}

# Verificar y configurar el modelo de IA
check_ollama_model "phi3:mini"

# Verificar que el servicio OCR esté funcionando
check_ocr_service

# Mostrar estado de los servicios
echo "📊 Estado de los servicios:"
docker compose -f "$COMPOSE_FILE" ps

# Verificar salud de los servicios
echo "🏥 Verificando salud de los servicios..."
sleep 10

# Función para verificar el health check de un servicio
check_service_health() {
    local service_name="$1"
    local max_attempts=8
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$service_name" 2>/dev/null || echo "no-healthcheck")
        
        if [ "$health_status" = "healthy" ]; then
            echo "✅ $service_name: Saludable"
            return 0
        elif [ "$health_status" = "no-healthcheck" ]; then
            # Verificar si el contenedor está ejecutándose
            if docker inspect --format='{{.State.Status}}' "$service_name" 2>/dev/null | grep -q "running"; then
                echo "✅ $service_name: Ejecutándose (sin health check)"
                return 0
            else
                echo "❌ $service_name: No está ejecutándose"
                return 1
            fi
        elif [ "$health_status" = "starting" ]; then
            echo "⏳ $service_name: Iniciando... (intento $attempt/$max_attempts)"
            sleep 15
            ((attempt++))
        else
            echo "⚠️  $service_name: Estado: $health_status (intento $attempt/$max_attempts)"
            sleep 15
            ((attempt++))
        fi
    done
    
    echo "⚠️  $service_name: No logró estar saludable en el tiempo esperado"
    return 1
}

# Verificar health checks de servicios principales
echo "🔍 Verificando servicios principales..."
check_service_health "rund-core" || echo "⚠️  rund-core podría necesitar más tiempo para iniciarse"
check_service_health "rund-api"
check_service_health "rund-mgp"

# Verificar servicios de IA y OCR (pueden tomar más tiempo)
echo "🔍 Verificando servicios de IA y OCR..."
check_service_health "rund-ai"
check_service_health "rund-ocr"

# Mostrar información de acceso
echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend:  http://$BASE_URL:4000"
echo "   API:       http://$BASE_URL:3000"
echo "   OpenKM:    http://$BASE_URL:8080"
echo "   Ollama AI: http://$BASE_URL:11434"
echo "   OCR:       http://$BASE_URL:8000"
echo ""
echo "🤖 Modelo de IA configurado: phi3:mini"
echo "📄 Servicio OCR: PaddleOCR con soporte para español e inglés"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:           docker compose -f $COMPOSE_FILE logs -f"
echo "   Ver logs de IA:     docker compose -f $COMPOSE_FILE logs -f rund-ai"
echo "   Ver logs de OCR:    docker compose -f $COMPOSE_FILE logs -f rund-ocr"
echo "   Detener servicios:  docker compose -f $COMPOSE_FILE down"
echo "   Listar modelos IA:  docker exec rund-ai ollama list"
echo "   Info OCR:           curl http://$BASE_URL:8000/info"
echo "   Health OCR:         curl http://$BASE_URL:8000/health"
echo "   Probar IA:          curl -X POST http://$BASE_URL:11434/api/generate -H 'Content-Type: application/json' -d '{\"model\":\"phi3:mini\",\"prompt\":\"Hola\",\"stream\":false}'"
echo "   Probar OCR:         curl -X POST -F 'file=@documento.pdf' http://$BASE_URL:8000/extract-text"
echo ""
echo "💡 Nota: Los servicios de IA y OCR pueden tomar tiempo adicional para estar completamente listos"