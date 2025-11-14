# Guía de Despliegue RUND

## Despliegue en Producción

### Requisitos Previos
- Docker y Docker Compose instalados
- Acceso al servidor de producción (172.16.234.52)
- Permisos para ejecutar Docker

### Pasos para Desplegar

1. **Clonar el repositorio** (si aún no está en el servidor):
   ```bash
   git clone <url-del-repositorio> rund-deployment
   cd rund-deployment
   ```

2. **Ejecutar el script de despliegue**:
   ```bash
   ./deploy.sh prod
   ```

   Esto hará:
   - ✅ Descargar las últimas imágenes de Docker Hub
   - ✅ Configurar todos los servicios
   - ✅ Descargar modelos de IA (nuextract, gemma2:2b)
   - ✅ Verificar health checks
   - ✅ Mostrar URLs de acceso

3. **Verificar que todo está funcionando**:
   ```bash
   # Ver estado de servicios
   docker compose -f docker-compose.prod.yml ps

   # Ver logs
   docker compose -f docker-compose.prod.yml logs -f
   ```

### URLs de Acceso (Producción)

- Frontend: http://172.16.234.52:4000
- API: http://172.16.234.52:3000
- OpenKM: http://172.16.234.52:8080
- AI Service: http://172.16.234.52:8001
- OCR Service: http://172.16.234.52:8000
- Ollama (LLM): http://172.16.234.52:11434

## Despliegue Local (Desarrollo)

```bash
./deploy.sh local
```

URLs locales:
- Frontend: http://localhost:4000
- API: http://localhost:3000
- OpenKM: http://localhost:8080
- AI Service: http://localhost:8001
- OCR Service: http://localhost:8000
- Ollama (LLM): http://localhost:11434

## Configuración de Variables de Entorno

### Modo por Defecto (Recomendado)
Las variables de entorno ya están configuradas en `docker-compose.prod.yml`. **No necesitas crear ningún archivo `.env.prod`**.

### Modo Personalizado (Opcional)
Si necesitas sobrescribir variables para tu entorno específico:

```bash
cp .env.prod.example .env.prod
nano .env.prod  # Edita las variables que necesites cambiar
./deploy.sh prod
```

## Comandos Útiles

### Ver Logs
```bash
# Todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Servicio específico
docker compose -f docker-compose.prod.yml logs -f rund-ai
docker compose -f docker-compose.prod.yml logs -f rund-ocr
docker compose -f docker-compose.prod.yml logs -f rund-ollama
```

### Reiniciar Servicios
```bash
# Reiniciar un servicio específico
docker compose -f docker-compose.prod.yml restart rund-api

# Reiniciar todos
docker compose -f docker-compose.prod.yml restart
```

### Detener Servicios
```bash
docker compose -f docker-compose.prod.yml down

# Detener y eliminar volúmenes (CUIDADO: elimina datos)
docker compose -f docker-compose.prod.yml down -v
```

### Verificar Salud de Servicios
```bash
# Health check OCR
curl http://172.16.234.52:8000/health

# Health check AI
curl http://172.16.234.52:8001/health

# Listar modelos de Ollama
docker exec rund-ollama ollama list
```

### Probar Servicios
```bash
# Info del servicio OCR
curl http://172.16.234.52:8000/info

# Probar extracción OCR
curl -X POST -F 'file=@documento.pdf' http://172.16.234.52:8000/extract-text

# Probar clasificación AI
curl -X POST http://172.16.234.52:8001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"Este es un certificado laboral"}'

# Probar Ollama
curl -X POST http://172.16.234.52:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"nuextract","prompt":"Hola","stream":false}'
```

## Actualización de Imágenes

### Actualizar desde Docker Hub
```bash
# Detener servicios
docker compose -f docker-compose.prod.yml down

# Descargar nuevas versiones
docker compose -f docker-compose.prod.yml pull

# Iniciar con nuevas imágenes
docker compose -f docker-compose.prod.yml up -d
```

### O usar el script de despliegue
```bash
./deploy.sh prod
```
El script automáticamente hace `pull` de las últimas imágenes.

## Construcción de Nuevas Imágenes

### Reconstruir con Soporte Multi-Arquitectura

**IMPORTANTE**: Las imágenes deben soportar tanto `linux/amd64` (servidores) como `linux/arm64` (Mac M1/M2).

```bash
# Construir y subir todas las imágenes con multi-arquitectura
./scripts/build-and-push.sh latest

# Construir solo componentes específicos
./scripts/build-and-push.sh latest ai,ocr

# Con una versión específica
./scripts/build-and-push.sh v1.2.3
```

### Verificar Arquitecturas Disponibles

Antes de desplegar en producción, verifica que las imágenes tienen ambas arquitecturas:

```bash
./scripts/check-architectures.sh
```

Deberías ver:
```
✅ Arquitecturas encontradas:
   - amd64
   - arm64
```

Si solo ves una arquitectura, reconstruye con el comando anterior.

## Troubleshooting

### Problema: Error de arquitectura incompatible
```
! rund-ai The requested image's platform (linux/arm64) does not match the detected host platform (linux/amd64/v4)
```

**Causa**: La imagen en Docker Hub solo tiene arquitectura ARM64.

**Solución**: Reconstruir las imágenes con soporte multi-arquitectura desde tu Mac:

```bash
# Desde tu máquina de desarrollo (Mac)
./scripts/build-and-push.sh latest

# Verificar que ahora tienen ambas arquitecturas
./scripts/check-architectures.sh

# Volver a desplegar en producción
# (en el servidor)
./deploy.sh prod
```

### Problema: Modelos de Ollama no se descargan
```bash
# Entrar al contenedor y descargar manualmente
docker exec -it rund-ollama bash
ollama pull nuextract
ollama pull gemma2:2b
exit
```

### Problema: Servicio AI sin memoria
```bash
# Ver uso de recursos
docker stats

# Aumentar límites en docker-compose.prod.yml si es necesario
```

### Problema: OCR muy lento
- Verificar tamaño de imagen (reducir DPI)
- Revisar límites de CPU
- Considerar procesamiento batch nocturno

### Problema: ChromaDB corrupto
```bash
docker compose -f docker-compose.prod.yml down
docker volume rm rund_ai-cache
docker compose -f docker-compose.prod.yml up -d
```

## Notas Importantes

⚠️ **Primera ejecución**: La descarga de modelos puede tardar 5-10 minutos.

⚠️ **Recursos**: Asegúrate de tener al menos 16GB RAM y 50GB de disco disponible.

⚠️ **Tiempo de inicio**: Los servicios de IA tardan 1-2 minutos en estar completamente listos.

✅ **Persistencia**: Los datos se guardan en volúmenes Docker y persisten entre reinicios.

✅ **Actualizaciones**: Puedes actualizar sin perder datos ejecutando `./deploy.sh prod`.
