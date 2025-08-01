#!/bin/bash

# Script para construir y subir imágenes a Docker Hub
# Uso: ./scripts/build-and-push.sh [tag]

set -e

# Configuración
DOCKER_USERNAME="ocastelblanco"
TAG=${1:-latest}

echo "🏗️  Construyendo y subiendo imágenes de RUND"
echo "👤 Usuario Docker Hub: $DOCKER_USERNAME"
echo "🏷️  Tag: $TAG"

# Verificar que Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose"
    exit 1
fi

# Verificar que estamos logueados en Docker Hub
if ! docker info | grep -q "Username: $DOCKER_USERNAME" 2>/dev/null; then
    echo "🔑 Iniciando sesión en Docker Hub..."
    docker login
fi

# Función para construir y subir una imagen
build_and_push() {
    local component=$1
    local context_path=$2
    
    echo ""
    echo "🔨 Construyendo $component..."
    
    # Verificar que existe el directorio
    if [ ! -d "$context_path" ]; then
        echo "❌ Error: No se encuentra el directorio $context_path"
        echo "💡 Asegúrate de clonar el repositorio de $component"
        return 1
    fi
    
    # Construir la imagen
    docker build -t "$DOCKER_USERNAME/rund-$component:$TAG" "$context_path"
    
    # También tagear como latest si no es latest
    if [ "$TAG" != "latest" ]; then
        docker tag "$DOCKER_USERNAME/rund-$component:$TAG" "$DOCKER_USERNAME/rund-$component:latest"
    fi
    
    echo "📤 Subiendo $component..."
    docker push "$DOCKER_USERNAME/rund-$component:$TAG"
    
    if [ "$TAG" != "latest" ]; then
        docker push "$DOCKER_USERNAME/rund-$component:latest"
    fi
    
    echo "✅ $component completado"
}

# Verificar que existen los directorios de componentes
echo "📂 Verificando directorios de componentes..."

if [ ! -d "rund-api" ] || [ ! -d "rund-mgp" ]; then
    echo "❌ Error: No se encuentran los directorios de componentes"
    echo ""
    echo "💡 Para el desarrollo, necesitas clonar los repositorios:"
    echo "   git clone [URL-REPO-API] rund-api"
    echo "   git clone [URL-REPO-MGP] rund-mgp"
    echo ""
    echo "💡 Para CI/CD, este script se ejecutaría después de los builds individuales"
    exit 1
fi

# Construir y subir ambas imágenes
build_and_push "api" "rund-api"
build_and_push "mgp" "rund-mgp"

echo ""
echo "🎉 ¡Todas las imágenes se han construido y subido exitosamente!"
echo ""
echo "📋 Imágenes creadas:"
echo "   $DOCKER_USERNAME/rund-api:$TAG"
echo "   $DOCKER_USERNAME/rund-mgp:$TAG"
echo ""
echo "🚀 Listo para desplegar en producción con:"
echo "   ./deploy.sh prod"