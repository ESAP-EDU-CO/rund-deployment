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
sleep 10

# Mostrar estado de los servicios
echo "📊 Estado de los servicios:"
docker compose -f "$COMPOSE_FILE" ps

# Mostrar información de acceso
echo ""
echo "✅ Despliegue completado!"
echo ""
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🌐 URLs de acceso:"
    echo "   Frontend: http://172.16.234.52:4000"
    echo "   API:      http://172.16.234.52:3000"
    echo "   OpenKM:   http://172.16.234.52:8080"
else
    echo "🌐 URLs de acceso:"
    echo "   Frontend: http://localhost:4000"
    echo "   API:      http://localhost:3000"
    echo "   OpenKM:   http://localhost:8080"
fi
echo ""
echo "📋 Para ver logs: docker compose -f $COMPOSE_FILE logs -f"
echo "🛑 Para detener:  docker compose -f $COMPOSE_FILE down"