# Guía de Restauración de OpenKM

## Uso del Script de Restauración

El script `restore_openkm.sh` ha sido actualizado para detectar automáticamente el archivo `docker-compose.yml` o `docker-compose.prod.yml` correcto.

### Uso Básico

```bash
# En producción (auto-detecta docker-compose.prod.yml)
./scripts/restore_openkm.sh backup-file.tar

# Especificar archivo de backup con ruta completa
./scripts/restore_openkm.sh -f ~/backups/openkm/backup-20251114.tar

# Modo dry-run (simular sin ejecutar)
./scripts/restore_openkm.sh --dry-run backup-file.tar
```

### Auto-detección del Archivo Docker Compose

El script detecta automáticamente el archivo correcto en este orden:

1. Si se especifica `--compose-file`, usa ese archivo
2. Si existe `docker-compose.prod.yml`, lo usa (producción)
3. Si existe `docker-compose.yml`, lo usa (desarrollo)
4. Si no encuentra ninguno, muestra error

### Opciones Disponibles

```bash
./scripts/restore_openkm.sh [OPCIONES] <archivo_backup>

Opciones:
  -h, --help              Mostrar ayuda
  -f, --file             Especificar archivo de backup
  -c, --container        Nombre del contenedor (default: rund-core)
  -d, --compose-dir      Directorio donde está docker-compose.yml
  --compose-file         Especificar archivo docker-compose manualmente
  --dry-run              Simular restauración sin ejecutar
```

### Ejemplos de Uso

#### Producción (Recomendado)

```bash
# El script detecta automáticamente docker-compose.prod.yml
cd /path/to/rund-deployment
./scripts/restore_openkm.sh ~/backups/openkm/rund_openkm-data-backup-20251114_103052.tar
```

#### Desarrollo

```bash
# El script detecta automáticamente docker-compose.yml
cd /path/to/rund-deployment
./scripts/restore_openkm.sh backup-file.tar
```

#### Especificar Archivo Compose Manualmente

```bash
# Útil si tienes múltiples archivos compose
./scripts/restore_openkm.sh --compose-file docker-compose.prod.yml backup.tar
```

#### Desde Otro Directorio

```bash
# Especificar directorio donde está docker-compose
./scripts/restore_openkm.sh -d /path/to/rund-deployment backup.tar
```

#### Simulación (Dry-run)

```bash
# Ver qué haría sin ejecutar realmente
./scripts/restore_openkm.sh --dry-run backup.tar
```

Salida:
```
[2025-11-14 00:45:12] [INFO] MODO DRY-RUN: La restauración sería exitosa
[2025-11-14 00:45:12] [INFO] Comandos que se ejecutarían:
[2025-11-14 00:45:12] [INFO]   1. Crear backup de seguridad
[2025-11-14 00:45:12] [INFO]   2. Detener servicios con: docker compose -f docker-compose.prod.yml down
[2025-11-14 00:45:12] [INFO]   3. Iniciar servicios con: docker compose -f docker-compose.prod.yml up -d
[2025-11-14 00:45:12] [INFO]   4. Copiar backup.tar al contenedor
[2025-11-14 00:45:12] [INFO]   5. Extraer backup en /opt/tomcat
[2025-11-14 00:45:12] [INFO]   6. Limpiar archivo temporal
[2025-11-14 00:45:12] [INFO]   7. Verificar estado de servicios
```

## Proceso de Restauración Completo

### 1. Pre-requisitos

- ✅ Archivo de backup válido (`.tar`)
- ✅ Docker y Docker Compose instalados
- ✅ Contenedor `rund-core` existe
- ✅ Estar en el directorio correcto o especificar `-d`

### 2. Verificaciones Automáticas

El script realiza estas verificaciones automáticas:

1. ✅ Detecta el archivo docker-compose correcto
2. ✅ Verifica que Docker está ejecutándose
3. ✅ Verifica que el contenedor existe
4. ✅ Verifica que el archivo de backup es válido
5. ✅ Verifica la integridad del archivo TAR

### 3. Proceso de Restauración

1. **Backup de seguridad**: Crea un backup del estado actual antes de restaurar
2. **Detener servicios**: Ejecuta `docker compose -f [archivo] down`
3. **Iniciar servicios**: Ejecuta `docker compose -f [archivo] up -d`
4. **Copiar archivo**: Copia el backup al contenedor
5. **Extraer**: Extrae el contenido en `/opt/tomcat`
6. **Limpiar**: Elimina archivos temporales
7. **Reiniciar**: Reinicia los servicios para aplicar cambios
8. **Verificar**: Verifica que todo funcione correctamente

### 4. Confirmación del Usuario

El script siempre pide confirmación antes de proceder:

```
⚠️  ADVERTENCIA: Esta operación sobrescribirá los datos actuales de OpenKM
📁 Archivo de backup: /home/user/backups/openkm/backup.tar
🐳 Contenedor: rund-core

¿Está seguro de que desea continuar? (y/N):
```

Escribe `y` y presiona Enter para continuar.

## Logs y Troubleshooting

### Ver Logs de Restauración

Los logs se guardan en:
```
~/backups/openkm/restore.log
```

Ver logs:
```bash
tail -f ~/backups/openkm/restore.log
```

### Errores Comunes

#### Error: "no configuration file provided: not found"

**Antes (error)**:
```bash
[ERROR] Error al detener servicios
no configuration file provided: not found
```

**Solución**: Actualizado en la versión actual. El script ahora detecta automáticamente `docker-compose.prod.yml`.

#### Error: "El contenedor no está ejecutándose"

**Causa**: Los servicios no se iniciaron correctamente.

**Solución**:
```bash
# Verificar estado
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs rund-core

# Reiniciar manualmente
docker compose -f docker-compose.prod.yml restart rund-core
```

#### Error: "Archivo de backup corrupto"

**Causa**: El archivo TAR está dañado o incompleto.

**Solución**:
```bash
# Verificar integridad del TAR
tar -tf backup.tar >/dev/null && echo "OK" || echo "Corrupto"

# Usar otro backup
ls -lh ~/backups/openkm/
```

#### Error: "No se puede cambiar al directorio"

**Causa**: El directorio especificado con `-d` no existe.

**Solución**:
```bash
# Ejecutar desde el directorio correcto
cd /path/to/rund-deployment
./scripts/restore_openkm.sh backup.tar

# O especificar ruta completa
./scripts/restore_openkm.sh -d /path/to/rund-deployment backup.tar
```

## Backup de Seguridad

Antes de cada restauración, el script crea automáticamente un backup de seguridad:

```
[INFO] Creando backup de seguridad antes de restaurar...
[INFO] Backup de seguridad creado: /home/user/backups/openkm/safety-backup-20251114_104523.tar
```

Si algo sale mal, puedes restaurar este backup de seguridad:

```bash
./scripts/restore_openkm.sh ~/backups/openkm/safety-backup-20251114_104523.tar
```

## Verificación Post-Restauración

Después de la restauración, verifica que todo funcione:

### 1. Verificar servicios

```bash
docker compose -f docker-compose.prod.yml ps
```

Salida esperada:
```
NAME        STATUS     PORTS
rund-core   running    0.0.0.0:8080->8080/tcp
...
```

### 2. Verificar logs

```bash
docker compose -f docker-compose.prod.yml logs -f rund-core
```

### 3. Acceder a OpenKM

Abre el navegador:
```
http://172.16.234.52:8080/OpenKM
```

Credenciales por defecto:
- Usuario: `okmAdmin`
- Contraseña: `admin`

### 4. Verificar datos

- ✅ Navega por los documentos
- ✅ Verifica que los archivos estén accesibles
- ✅ Revisa la estructura de carpetas
- ✅ Prueba búsquedas

## Mejores Prácticas

### 1. Siempre hacer dry-run primero

```bash
./scripts/restore_openkm.sh --dry-run backup.tar
```

### 2. Verificar el backup antes de restaurar

```bash
# Ver contenido del backup
tar -tvf backup.tar | less

# Verificar tamaño
ls -lh backup.tar
```

### 3. Mantener backups regulares

```bash
# Crear backup antes de cambios importantes
./scripts/backup_openkm.sh
```

### 4. Probar en entorno de desarrollo primero

Si es posible, prueba la restauración en desarrollo antes de producción:

```bash
# En desarrollo
./scripts/restore_openkm.sh backup-from-prod.tar
```

## Contacto y Soporte

Si encuentras problemas:

1. Revisa los logs: `~/backups/openkm/restore.log`
2. Verifica el estado de Docker: `docker ps`
3. Consulta esta guía de troubleshooting
4. Si el problema persiste, contacta al equipo de desarrollo

---

**Última actualización**: 14 de noviembre de 2025
**Versión del script**: 2.1
