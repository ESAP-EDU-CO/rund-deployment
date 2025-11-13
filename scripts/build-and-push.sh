#!/bin/bash

# Script para construir y subir imágenes a Docker Hub
# Uso: ./scripts/build-and-push.sh [tag] [component1,component2,...]

set -e

# Configuración
DOCKER_USERNAME="ocastelblanco"
TAG=${1:-latest}
COMPONENTS=${2:-"api,mgp,ocr,ai"}

echo "🏗️  Construyendo y subiendo imágenes de RUND"
echo "👤 Usuario Docker Hub: $DOCKER_USERNAME"
echo "🏷️  Tag: $TAG"
echo "📦 Componentes: $COMPONENTS"

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [tag] [components]"
    echo ""
    echo "Argumentos:"
    echo "  tag         Tag para las imágenes (default: latest)"
    echo "  components  Componentes a construir, separados por coma (default: api,mgp,ocr,ai)"
    echo ""
    echo "Ejemplos:"
    echo "  $0                           # Construir todos con tag latest"
    echo "  $0 v1.2.3                   # Construir todos con tag v1.2.3"
    echo "  $0 latest api,ocr,ai         # Construir solo api, ocr y ai"
    echo "  $0 v1.2.3 ai                # Construir solo ai con tag v1.2.3"
    echo ""
    echo "Componentes disponibles: api, mgp, ocr, ai"
    exit 0
}

# Verificar argumentos de ayuda
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
fi

# Verificar que Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose"
    exit 1
fi

# Verificar que Docker Buildx está disponible
if ! docker buildx version > /dev/null 2>&1; then
    echo "❌ Error: Docker Buildx no está disponible"
    echo "💡 Instala Docker Buildx o usa una versión más reciente de Docker"
    exit 1
fi

# Crear y usar un builder para multi-arquitectura si no existe
if ! docker buildx ls | grep -q "rund-builder"; then
    echo "🔧 Creando builder multi-arquitectura..."
    docker buildx create --name rund-builder --use --driver docker-container
else
    echo "🔧 Usando builder existente..."
    docker buildx use rund-builder
fi

# Verificar que estamos logueados en Docker Hub
echo "🔍 Verificando autenticación en Docker Hub..."
if ! docker system info --format '{{.RegistryConfig.IndexConfigs}}' | grep -q "docker.io" 2>/dev/null; then
    echo "🔑 Iniciando sesión en Docker Hub..."
    docker login
else
    echo "✅ Ya autenticado en Docker Hub"
fi

# Función para construir y subir una imagen
build_and_push() {
    local component=$1
    local context_path=$2
    
    echo ""
    echo "🔨 Construyendo rund-$component para múltiples arquitecturas..."
    
    # Verificar que existe el directorio
    if [ ! -d "$context_path" ]; then
        echo "❌ Error: No se encuentra el directorio $context_path"
        echo "💡 Asegúrate de clonar el repositorio de $component"
        return 1
    fi
    
    # Verificar que existe el Dockerfile
    if [ ! -f "$context_path/Dockerfile" ]; then
        echo "❌ Error: No se encuentra Dockerfile en $context_path"
        return 1
    fi
    
    echo "📋 Construyendo imagen: $DOCKER_USERNAME/rund-$component:$TAG"
    
    # Construir la imagen para múltiples plataformas
    if docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t "$DOCKER_USERNAME/rund-$component:$TAG" \
        --push \
        "$context_path"; then
        
        echo "✅ Imagen $DOCKER_USERNAME/rund-$component:$TAG construida y subida"
        
        # También tagear como latest si no es latest
        if [ "$TAG" != "latest" ]; then
            echo "🏷️  Tageando también como latest..."
            docker buildx build \
                --platform linux/amd64,linux/arm64 \
                -t "$DOCKER_USERNAME/rund-$component:latest" \
                --push \
                "$context_path"
            echo "✅ También disponible como: $DOCKER_USERNAME/rund-$component:latest"
        fi
        
        echo "✅ $component completado exitosamente"
        return 0
    else
        echo "❌ Error construyendo $component"
        return 1
    fi
}

# Convertir string de componentes a array
IFS=',' read -ra COMPONENT_ARRAY <<< "$COMPONENTS"

# Verificar componentes válidos
VALID_COMPONENTS=("api" "mgp" "ocr" "ai")
for component in "${COMPONENT_ARRAY[@]}"; do
    if [[ ! " ${VALID_COMPONENTS[@]} " =~ " $component " ]]; then
        echo "❌ Error: Componente '$component' no válido"
        echo "💡 Componentes válidos: ${VALID_COMPONENTS[*]}"
        exit 1
    fi
done

# Verificar que existen los directorios de componentes seleccionados
echo "📂 Verificando directorios de componentes seleccionados..."
missing_dirs=()

for component in "${COMPONENT_ARRAY[@]}"; do
    context_path="rund-$component"
    if [ ! -d "$context_path" ]; then
        missing_dirs+=("$context_path")
    fi
done

if [ ${#missing_dirs[@]} -gt 0 ]; then
    echo "❌ Error: No se encuentran los siguientes directorios:"
    for dir in "${missing_dirs[@]}"; do
        echo "   - $dir"
    done
    echo ""
    echo "💡 Para el desarrollo, necesitas clonar los repositorios:"
    for dir in "${missing_dirs[@]}"; do
        echo "   git clone https://github.com/ESAP-EDU-CO/$dir.git"
    done
    echo ""
    echo "💡 Para CI/CD, este script se ejecutaría después de los builds individuales"
    exit 1
fi

# Arrays para tracking
successful_builds=()
failed_builds=()

# Construir y subir las imágenes seleccionadas
echo ""
echo "🚀 Iniciando construcción de componentes..."

for component in "${COMPONENT_ARRAY[@]}"; do
    context_path="rund-$component"
    
    if build_and_push "$component" "$context_path"; then
        successful_builds+=("$component")
    else
        failed_builds+=("$component")
    fi
done

# Mostrar resumen final
echo ""
echo "📊 Resumen de construcción:"
echo ""

if [ ${#successful_builds[@]} -gt 0 ]; then
    echo "✅ Construidos exitosamente:"
    for component in "${successful_builds[@]}"; do
        echo "   - $DOCKER_USERNAME/rund-$component:$TAG"
        if [ "$TAG" != "latest" ]; then
            echo "   - $DOCKER_USERNAME/rund-$component:latest"
        fi
    done
fi

if [ ${#failed_builds[@]} -gt 0 ]; then
    echo ""
    echo "❌ Fallaron:"
    for component in "${failed_builds[@]}"; do
        echo "   - rund-$component"
    done
    echo ""
    echo "🔍 Revisa los logs anteriores para detalles del error"
    exit 1
fi

echo ""
echo "🎉 ¡Todas las imágenes se han construido y subido exitosamente!"
echo ""
echo "🚀 Listo para desplegar en producción con:"
echo "   ./deploy.sh prod"
echo ""
echo "💡 Las imágenes están disponibles para arquitecturas: linux/amd64, linux/arm64"