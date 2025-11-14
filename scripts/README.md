# Scripts de RUND

Scripts de utilidad para construcción y despliegue de RUND.

## build-and-push.sh

Construye y sube imágenes Docker a Docker Hub con soporte multi-arquitectura (AMD64 + ARM64).

### Uso

```bash
# Construir todas las imágenes con tag 'latest'
./scripts/build-and-push.sh latest

# Construir solo componentes específicos
./scripts/build-and-push.sh latest ai,ocr

# Construir con versión específica
./scripts/build-and-push.sh v1.2.3

# Construir solo un componente
./scripts/build-and-push.sh latest ai
```

### Requisitos

- Docker con Buildx habilitado
- Sesión iniciada en Docker Hub (`docker login`)
- Repositorios clonados: `rund-api`, `rund-mgp`, `rund-ocr`, `rund-ai`

### Arquitecturas soportadas

El script construye automáticamente para:
- `linux/amd64` (servidores Intel/AMD)
- `linux/arm64` (Mac M1/M2, servidores ARM)

### Primera ejecución

La primera vez, el script creará un builder llamado `rund-builder`:

```bash
🔧 Creando builder multi-arquitectura...
```

Este builder persiste entre ejecuciones.

---

## check-architectures.sh

Verifica que las imágenes en Docker Hub tienen soporte multi-arquitectura.

### Uso

```bash
./scripts/check-architectures.sh
```

### Salida esperada

```
🔍 Verificando arquitecturas disponibles en Docker Hub
👤 Usuario: ocastelblanco

📦 Verificando: ocastelblanco/rund-api:latest
✅ Arquitecturas encontradas:
   - amd64
   - arm64

📦 Verificando: ocastelblanco/rund-mgp:latest
✅ Arquitecturas encontradas:
   - amd64
   - arm64

...
```

### Si solo hay una arquitectura

```
⚠️  Solo 1 arquitectura encontrada:
   - arm64
💡 Necesitas reconstruir con: ./scripts/build-and-push.sh latest
```

**Solución**: Ejecutar `build-and-push.sh` para agregar soporte multi-arquitectura.

---

## Flujo de Trabajo Recomendado

### Desarrollo y Build

1. **Hacer cambios en los componentes**
   ```bash
   cd rund-api  # o rund-ai, rund-ocr, rund-mgp
   # ... hacer cambios ...
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push
   ```

2. **Construir y subir imágenes actualizadas**
   ```bash
   cd /path/to/rund-deployment
   ./scripts/build-and-push.sh latest
   ```

3. **Verificar arquitecturas**
   ```bash
   ./scripts/check-architectures.sh
   ```

4. **Desplegar en producción**
   ```bash
   # En el servidor
   ./deploy.sh prod
   ```

### Solo actualizar un componente

Si solo modificaste `rund-ai`:

```bash
# Build solo de AI
./scripts/build-and-push.sh latest ai

# Verificar
./scripts/check-architectures.sh

# Desplegar (descarga solo la imagen actualizada)
./deploy.sh prod
```

---

## Troubleshooting

### Error: Docker Buildx no está disponible

```bash
# Verificar versión de Docker
docker version

# Docker Desktop ya incluye Buildx
# Si usas Docker CE, instalar Buildx manualmente
```

### Error: Permission denied al subir a Docker Hub

```bash
# Iniciar sesión
docker login

# Verificar autenticación
docker system info | grep Username
```

### Error: Builder ya existe

```bash
# Si hay problemas con el builder, eliminarlo y recrear
docker buildx rm rund-builder
./scripts/build-and-push.sh latest
```

### Build muy lento

El build multi-arquitectura tarda el doble porque construye dos veces (una por cada arquitectura). Es normal.

**Tiempo aproximado**:
- `rund-api`: 2-3 minutos
- `rund-mgp`: 3-4 minutos
- `rund-ocr`: 4-5 minutos
- `rund-ai`: 3-4 minutos
- **Total**: ~15-20 minutos para todas

### Error: No se encuentra el directorio rund-xxx

```bash
# Verificar qué repositorios tienes
ls -la | grep rund-

# Clonar los que falten
git clone https://github.com/ESAP-EDU-CO/rund-api.git
git clone https://github.com/ESAP-EDU-CO/rund-mgp.git
git clone https://github.com/ESAP-EDU-CO/rund-ocr.git
git clone https://github.com/ESAP-EDU-CO/rund-ai.git
```

---

## Notas Importantes

⚠️ **Ejecutar desde el directorio raíz**: Los scripts asumen que estás en `/rund-deployment/`

⚠️ **Repositorios hermanos**: Los componentes deben estar al mismo nivel que `rund-deployment`:
```
/ESAP/RUND/
  ├── rund-deployment/
  ├── rund-api/
  ├── rund-mgp/
  ├── rund-ocr/
  └── rund-ai/
```

✅ **Tag `latest` automático**: Si construyes con una versión (ej: `v1.2.3`), también se tagea como `latest`.

✅ **Caché de capas**: Docker reutiliza capas, builds subsecuentes son más rápidos.
