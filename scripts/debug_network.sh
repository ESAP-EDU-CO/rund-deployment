# Script de verificación de conectividad
# save as: debug_network.sh
#!/bin/bash

echo "=== VERIFICACIÓN DE RED DOCKER ==="

# 1. Verificar contenedores activos
echo "📋 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Verificar red
echo -e "\n🌐 Redes Docker:"
docker network ls

# 3. Inspeccionar la red específica
echo -e "\n🔍 Detalles de rund-network:"
docker network inspect rund-network 2>/dev/null | jq '.[0].Containers' || echo "Red no encontrada"

# 4. Test desde rund-api a rund-ai
echo -e "\n🧪 Test de conectividad desde rund-api:"
docker exec rund-api ping -c 2 rund-ai 2>/dev/null || echo "❌ Ping falló"

# 5. Test de puerto específico
echo -e "\n🔌 Test de puerto 11434:"
docker exec rund-api nc -zv rund-ai 11434 2>/dev/null || echo "❌ Puerto no accesible"

# 6. Test de endpoint /api/tags
echo -e "\n📡 Test de endpoint Ollama:"
docker exec rund-api curl -s --connect-timeout 5 http://rund-ai:11434/api/tags || echo "❌ Endpoint no responde"

echo -e "\n✅ Verificación completada"