# RUND - Despliegue

Stack completo de la aplicación RUND, que incluye:

- **rund-core**: OpenKM (repositorio/base de datos)
- **rund-api**: API backend (PHP)
- **rund-mgp**: Frontend (Angular 20 SSR)

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

## 🌐 URLs de Acceso

### Desarrollo Local
- Frontend: http://localhost:4000
- API: http://localhost:3000  
- OpenKM: http://localhost:8080

### Producción (172.16.234.52)
- Frontend: http://172.16.234.52:4000
- API: http://172.16.234.52:3000
- OpenKM: http://172.16.234.52:8080

## 🛠️ Comandos Útiles

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f rund-mgp

# Detener todos los servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart rund-api

# Actualizar imágenes (solo producción)
docker compose pull
docker compose up -d
```

## 🔧 Desarrollo

Para desarrollo, necesitas clonar también los repositrios de los componentes:

```bash
# En la carpeta rund-deployment
git clone [URL-REPO-API] rund-api
git clone [URL-REPO-MGP] rund-mgp

# Luego usar docker-compose.yml normal
./deploy.sh local
```

## 📦 CI/CD

Para construir y subir nuevas versiones de las imágenes:

```bash
# Construir y subir con tag específico
./scripts/build-and-push.sh v1.2.3

# Construir y subir como latest
./scripts/build-and-push.sh
```

## 🔐 Variables de Entorno

### Desarrollo (.env)
- Configuración local con localhost
- Base de datos embebida
- Logs detallados

### Producción (.env.prod)  
- URLs del servidor de producción
- Optimizaciones de rendimiento
- Logs de nivel ERROR únicamente

## 🆘 Solución de Problemas

### Error: "No se puede conectar a la API"
1. Verificar que todos los servicios estén corriendo: `docker compose ps`
2. Revisar logs de la API: `docker compose logs rund-api`
3. Verificar variables de entorno en el archivo `.env` o `.env.prod`

### Error: "Imágenes no encontradas"
1. Para producción, verificar que las imágenes están en Docker Hub
2. Ejecutar `docker compose pull` para descargar las últimas versiones
3. Verificar el nombre de usuario en docker-compose.prod.yml

### Puertos ocupados
1. Verificar qué está usando los puertos: `netstat -tulpn | grep :3000`
2. Cambiar los puertos en el archivo docker-compose si es necesario
3. Reiniciar Docker: `sudo systemctl restart docker`

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades, crear un issue en el repositorio correspondiente:

- Issues del stack completo: Este repositorio
- Issues de la API: Repositorio rund-api  
- Issues del frontend: Repositorio rund-mgp