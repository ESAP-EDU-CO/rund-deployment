# Despliegue de Autenticación en UAT (172.16.234.52)

## 📋 Estado Actual y Requerimientos

### ✅ Componentes Listos

Los siguientes componentes ya están implementados y funcionando:

1. **rund-auth** (Node.js + Express)
   - ✅ LDAP login implementado (`/ldap/login`)
   - ✅ OAuth 2.0 / Azure AD implementado (`/oauth/login`)
   - ✅ Dev login implementado (`/dev/login`)
   - ✅ JWT RS256 con JWKS público
   - ✅ Sesiones Redis con 8 horas de duración
   - ✅ Healthcheck endpoint (`/healthz`)

2. **rund-api** (PHP 8.3)
   - ✅ AuthController implementado
   - ✅ AuthService implementado
   - ✅ JWTValidator implementado
   - ✅ Endpoints BFF funcionando

3. **rund-mgp** (Angular 20)
   - ✅ AuthService con Signals
   - ✅ Login component
   - ✅ AuthGuard
   - ✅ AuthInterceptor
   - ⚠️ **PENDIENTE**: Build y despliegue en UAT

---

## ⚙️ Configuración Necesaria para UAT

### 1. Variables de Entorno - rund-auth

Necesitas crear/actualizar el archivo `./rund-auth/.env` con los siguientes valores para UAT:

```bash
# ====== App ======
APP_BASE_URL=http://172.16.234.52:8081
APP_BASE_URL_UI=http://172.16.234.52:4000
SESSION_SECRET=<GENERAR_STRING_ALEATORIO_LARGO>  # ⚠️ CAMBIAR
COOKIE_DOMAIN=172.16.234.52
COOKIE_SECURE=false  # ⚠️ Cambiar a true cuando tengas HTTPS

# ====== Internal JWT ======
INTERNAL_JWT_ISS=rund-auth
INTERNAL_JWT_AUD=rund-api,rund-mgp
INTERNAL_JWT_TTL_SECONDS=900
JWK_PRIVATE_SET_PATH=/keys/jwks-private.json
JWK_PUBLIC_SET_PATH=/keys/jwks-public.json

# ====== DB / Cache ======
DATABASE_URL=postgresql://user:pass@rund-postgres:5432/rund_auth
REDIS_URL=redis://rund-redis:6379/0

# ====== Dev mode toggles ======
DEV_FAKE_LOGIN=true   # ⚠️ Dejar true para testing, cambiar a false en producción
OIDC_ENABLED=false    # ⚠️ Cambiar a true cuando configures Azure AD

# ====== LDAP Configuration (OTIC - ESAP) ======
LDAP_ENABLED=true
LDAP_URL=ldap://esap.edu.int:389
LDAP_BASE_DN=OU=USUARIOS,DC=esap,DC=edu,DC=int
LDAP_BIND_DN=ldap@esap.edu.int
LDAP_BIND_PASSWORD=Esap.2020
LDAP_LOGIN_ATTRIBUTE=sAMAccountName
LDAP_FILTER=(&(objectCategory=person)(objectClass=user)(givenName=*)(sn=*)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(mail=*@esap.edu.co)(employeeID=*)(!(description=*correo institucional*))(!(description=*cuenta de servicio*))(!(description=*egres*))(!(description=*estud*))(!(description=*gradu*))(!(description=*administrad*))((description=*Docente*)))
LDAP_ATTRIBUTES=displayName,givenName,sn,mail,employeeID,description,sAMAccountName

# ====== Entra ID (Azure AD) - OPCIONAL ======
# ⚠️ Solo necesario si OIDC_ENABLED=true
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_CLIENT_SECRET=supersecret
AZURE_AUTHORITY=https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0
AZURE_ISSUER=https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0
AZURE_SCOPES=openid profile email offline_access
```

### 2. CORS en rund-auth (server.ts)

**⚠️ ACCIÓN REQUERIDA**: Actualizar la configuración de CORS para permitir peticiones desde el dominio UAT.

**Ubicación**: `rund-auth/src/server.ts` líneas 18-22

**Estado Actual (solo localhost):**
```typescript
app.use(cors({
  origin: [/^http:\/\/localhost:\d+$/],
  credentials: true
}))
```

**Para UAT (permitir IP 172.16.234.52):**
```typescript
app.use(cors({
  origin: [
    /^http:\/\/localhost:\d+$/,           // Dev local
    /^http:\/\/172\.16\.234\.52:\d+$/    // UAT
  ],
  credentials: true
}))
```

**O más flexible (permitir cualquier origen en UAT):**
```typescript
const isDev = process.env.NODE_ENV !== 'production'
const isUAT = process.env.APP_BASE_URL?.includes('172.16.234.52')

app.use(cors({
  origin: isDev || isUAT
    ? [/^http:\/\/localhost:\d+$/, /^http:\/\/172\.16\.234\.52:\d+$/]
    : false, // En producción, configurar orígenes específicos
  credentials: true
}))
```

### 3. Verificar Claves JWKS

Las claves públicas/privadas para firmar JWT deben existir en `./keys/`:

```bash
# Verificar que existan
ls -la keys/
# Debe mostrar:
# - jwks-private.json
# - jwks-public.json
```

Si no existen, generarlas:
```bash
cd rund-auth
npm run gen:jwks
```

### 4. docker-compose.prod.yml

El archivo ya está configurado correctamente para usar:
- ✅ `env_file: ./rund-auth/.env`
- ✅ Puerto 8081:8080
- ✅ Volumen `/keys` montado
- ✅ Dependencias de redis y postgres

---

## 🚀 Pasos de Despliegue

### Paso 1: Generar SESSION_SECRET

```bash
# Generar un string aleatorio fuerte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# O en bash
openssl rand -hex 64
```

Copiar el resultado a `SESSION_SECRET` en `.env`.

### Paso 2: Actualizar CORS en server.ts

```bash
# Editar rund-auth/src/server.ts
nano rund-auth/src/server.ts

# Cambiar la sección CORS como se indica arriba
```

### Paso 3: Actualizar .env

```bash
# Editar rund-auth/.env
nano rund-auth/.env

# Actualizar:
# - APP_BASE_URL=http://172.16.234.52:8081
# - APP_BASE_URL_UI=http://172.16.234.52:4000
# - COOKIE_DOMAIN=172.16.234.52
# - SESSION_SECRET=<el_generado_en_paso_1>
```

### Paso 4: Verificar Conectividad LDAP

Desde el servidor UAT, verificar que pueda alcanzar el LDAP de ESAP:

```bash
# Test de conectividad
telnet esap.edu.int 389

# O con netcat
nc -zv esap.edu.int 389
```

Si no puede conectar, verificar:
- Firewall del servidor
- Reglas de red
- VPN o túnel necesario

### Paso 5: Build y Push de rund-auth

```bash
# Build de imagen actualizada
docker build -t ocastelblanco/rund-auth:uat rund-auth/

# Push a Docker Hub
docker push ocastelblanco/rund-auth:uat

# O actualizar imagen en docker-compose.prod.yml:
# image: ocastelblanco/rund-auth:uat
```

### Paso 6: Desplegar en UAT

```bash
# En el servidor UAT (172.16.234.52)

# Pull de imágenes actualizadas
docker compose -f docker-compose.prod.yml pull

# Levantar servicios (solo auth, redis, postgres)
docker compose -f docker-compose.prod.yml up -d rund-auth redis postgres

# Verificar logs
docker compose -f docker-compose.prod.yml logs -f rund-auth
```

---

## ✅ Verificación Post-Despliegue

### 1. Health Check

```bash
# Desde el servidor UAT
curl http://172.16.234.52:8081/healthz

# Respuesta esperada:
{"ok":true}
```

### 2. JWKS Público

```bash
curl http://172.16.234.52:8081/.well-known/jwks.json

# Debe retornar un JSON con las claves públicas
```

### 3. Dev Login (si DEV_FAKE_LOGIN=true)

```bash
curl -X POST http://172.16.234.52:8081/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@esap.edu.co"}'

# Respuesta esperada:
{
  "user": {
    "sub": "fake-sub-test@esap.edu.co",
    "name": "Dev User",
    "email": "test@esap.edu.co",
    "tid": "fake-tenant"
  },
  "internal_jwt": "eyJhbGc..."
}
```

### 4. LDAP Login (requiere credenciales reales)

```bash
curl -X POST http://172.16.234.52:8081/ldap/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"usuario.prueba","password":"contraseña"}'

# Si las credenciales son correctas:
{
  "user": {
    "sub": "CN=...",
    "name": "Usuario Prueba",
    "email": "usuario.prueba@esap.edu.co",
    "tid": "ldap"
  },
  "internal_jwt": "eyJhbGc..."
}
```

### 5. Verificar rund-api

```bash
# Health de autenticación
curl http://172.16.234.52:3000/api/v2/auth/health

# Respuesta esperada:
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "rund-auth": "healthy",
      "php-session": "healthy"
    }
  }
}
```

---

## 🔍 Troubleshooting

### Problema 1: CORS Error en Frontend

**Síntoma:**
```
Access to XMLHttpRequest at 'http://172.16.234.52:8081/ldap/login' from origin
'http://172.16.234.52:4000' has been blocked by CORS policy
```

**Solución:**
- Verificar que actualizaste CORS en `server.ts`
- Rebuild rund-auth
- Restart contenedor

### Problema 2: LDAP Connection Failed

**Síntoma:**
```
Error en autenticación LDAP: connect ETIMEDOUT
```

**Solución:**
- Verificar conectividad: `telnet esap.edu.int 389`
- Verificar firewall del servidor UAT
- Verificar que LDAP_URL, LDAP_BIND_DN, LDAP_BIND_PASSWORD sean correctos

### Problema 3: JWT Verification Failed

**Síntoma:**
```
JWT inválido: no signature verification key matching kid found
```

**Solución:**
- Verificar que `/keys/jwks-private.json` y `/keys/jwks-public.json` existan
- Verificar que el volumen esté montado correctamente en docker-compose
- Regenerar claves si es necesario

### Problema 4: Session Not Persisting

**Síntoma:**
- Usuario se autentica pero pierde sesión inmediatamente

**Solución:**
- Verificar que Redis esté funcionando: `docker compose logs rund-redis`
- Verificar COOKIE_DOMAIN en .env (debe ser `172.16.234.52`)
- Verificar que `withCredentials: true` esté en todas las peticiones HTTP del frontend

---

## 📊 Checklist Final

Antes de dar por completado el despliegue:

### Configuración
- [ ] `.env` actualizado con valores de UAT
- [ ] `SESSION_SECRET` generado y configurado
- [ ] CORS actualizado en `server.ts`
- [ ] Claves JWKS generadas y montadas

### Conectividad
- [ ] Redis funcionando y accesible
- [ ] PostgreSQL funcionando y accesible
- [ ] LDAP accesible desde servidor UAT (si LDAP_ENABLED=true)
- [ ] rund-api puede alcanzar rund-auth

### Endpoints
- [ ] `/healthz` responde con `{"ok":true}`
- [ ] `/.well-known/jwks.json` retorna claves públicas
- [ ] `/dev/login` funciona (si DEV_FAKE_LOGIN=true)
- [ ] `/ldap/login` funciona (si LDAP_ENABLED=true y credenciales son válidas)
- [ ] rund-api `/api/v2/auth/health` responde correctamente

### Testing
- [ ] Login desde frontend funciona
- [ ] Sesión persiste correctamente
- [ ] Logout funciona
- [ ] Guard protege rutas
- [ ] Interceptor maneja 401/403

---

## 🔒 Seguridad para Producción

Cuando migres a producción real (no UAT), cambiar:

1. **COOKIE_SECURE=true** (requiere HTTPS)
2. **DEV_FAKE_LOGIN=false** (deshabilitar login de desarrollo)
3. **SESSION_SECRET** único y aleatorio (64+ caracteres)
4. **CORS** restrictivo (solo orígenes específicos)
5. **LDAP_BIND_PASSWORD** encriptada o desde secreto
6. **Firewall** para restringir acceso a puertos internos
7. **HTTPS** con certificado SSL válido
8. **Rate limiting** para evitar ataques de fuerza bruta

---

## 📞 Contacto

**Autor**: Oliver Castelblanco Martínez / ESAP Development Team
**Fecha**: 17 de diciembre de 2025
**Versión**: 1.0
