#!/bin/bash

# Script para verificar las arquitecturas disponibles en las imágenes de Docker Hub
# Uso: ./scripts/check-architectures.sh

set -e

DOCKER_USERNAME="ocastelblanco"
COMPONENTS=("api" "mgp" "ocr" "ai")

echo "🔍 Verificando arquitecturas disponibles en Docker Hub"
echo "👤 Usuario: $DOCKER_USERNAME"
echo ""

# Función para obtener arquitecturas de una imagen
check_image_architectures() {
    local image_name=$1

    echo "📦 Verificando: $image_name"

    # Usar docker manifest inspect para ver las arquitecturas
    if docker manifest inspect "$image_name" > /dev/null 2>&1; then
        # Extraer las plataformas disponibles
        platforms=$(docker manifest inspect "$image_name" | \
            grep -A 2 '"platform"' | \
            grep '"architecture"' | \
            sed 's/.*"architecture": "\([^"]*\)".*/\1/' | \
            sort | uniq)

        # Contar arquitecturas
        arch_count=$(echo "$platforms" | wc -l | tr -d ' ')

        if [ "$arch_count" -ge 2 ]; then
            echo "✅ Arquitecturas encontradas:"
            echo "$platforms" | while read -r arch; do
                echo "   - $arch"
            done
        else
            echo "⚠️  Solo 1 arquitectura encontrada:"
            echo "$platforms" | while read -r arch; do
                echo "   - $arch"
            done
            echo "💡 Necesitas reconstruir con: ./scripts/build-and-push.sh latest"
        fi
    else
        echo "❌ No se pudo obtener información de la imagen"
        echo "💡 ¿Está subida a Docker Hub?"
    fi

    echo ""
}

# Verificar cada componente
for component in "${COMPONENTS[@]}"; do
    check_image_architectures "$DOCKER_USERNAME/rund-$component:latest"
done

echo "✅ Verificación completada"
echo ""
echo "💡 Si alguna imagen solo tiene 1 arquitectura, reconstruye con:"
echo "   ./scripts/build-and-push.sh latest"
echo ""
echo "💡 Para reconstruir solo un componente específico:"
echo "   ./scripts/build-and-push.sh latest ai"
