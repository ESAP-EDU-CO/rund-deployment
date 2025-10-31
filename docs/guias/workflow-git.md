# Workflow Git - Proyectos RUND

**Versión:** 2.0
**Fecha:** Octubre 2025
**Organización:** ESAP (Escuela Superior de Administración Pública)

---

## 📋 Proyectos RUND

Este workflow se aplica a todos los proyectos del ecosistema RUND:

- **RUND-AI** - Servicio de Inteligencia Artificial (Python/Flask)
- **RUND-API** - Backend API (PHP)
- **RUND-MGP** - Frontend Management Portal (Angular)
- **RUND-OCR** - Servicio de OCR (Python/Flask)
- **RUND-Deployment** - Configuración de despliegue (Docker Compose)

---

## 1. Estructura de Branches

```
main (producción)
  └── develop (desarrollo)
       ├── feature/nombre-feature
       ├── bugfix/nombre-bug
       └── hotfix/nombre-hotfix
```

### Descripción de Branches

- **`main`**: Branch de producción. Código estable y desplegado.
- **`develop`**: Branch de desarrollo. Integración de features.
- **`feature/*`**: Nuevas funcionalidades.
- **`bugfix/*`**: Corrección de bugs no críticos.
- **`hotfix/*`**: Correcciones urgentes en producción.

---

## 2. Flujo de Trabajo

### 2.1 Configurar Repositorio Local

```bash
# Clonar repositorio (primera vez)
git clone https://github.com/ESAP-EDU-CO/rund-ai.git
cd rund-ai

# O para rund-deployment
git clone https://github.com/ESAP-EDU-CO/rund-deployment.git
cd rund-deployment

# Verificar remotes
git remote -v

# Configurar identidad (si no está configurada globalmente)
git config user.name "Tu Nombre"
git config user.email "tu.email@esap.edu.co"
```

### 2.2 Crear Feature Branch

```bash
# Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear nueva feature branch
git checkout -b feature/nombre-descriptivo

# Ejemplos por proyecto:
# RUND-AI
git checkout -b feature/ai-clasificador-mejorado

# RUND-API
git checkout -b feature/api-nuevo-endpoint-docentes

# RUND-MGP
git checkout -b feature/mgp-dashboard-estadisticas

# RUND-OCR
git checkout -b feature/ocr-mejora-precision-cedulas
```

### 2.3 Trabajar en la Feature

```bash
# Hacer cambios en el código...

# Ver estado
git status

# Agregar archivos modificados
git add .

# O agregar archivos específicos
git add archivo1.py archivo2.ts

# Commit con mensaje descriptivo
git commit -m "feat(ai): implementar clasificador con embeddings"

# Continuar trabajando y haciendo commits...
git add .
git commit -m "feat(ai): agregar validación de schemas"
```

### 2.4 Push y Crear Pull Request

```bash
# Push de la feature branch
git push origin feature/nombre-descriptivo

# Si es el primer push de esta branch
git push -u origin feature/nombre-descriptivo

# Crear Pull Request en GitHub:
# 1. Ir a https://github.com/ESAP-EDU-CO/rund-[proyecto]
# 2. Hacer clic en "Compare & pull request"
# 3. Base: develop <- Compare: feature/nombre-descriptivo
# 4. Agregar descripción detallada
# 5. Asignar reviewers si es necesario
# 6. Crear Pull Request
```

### 2.5 Merge a Develop (después de aprobación)

```bash
# Actualizar develop local
git checkout develop
git pull origin develop

# Merge de la feature (--no-ff preserva historial)
git merge --no-ff feature/nombre-descriptivo

# Push a develop
git push origin develop

# Eliminar feature branch local (opcional)
git branch -d feature/nombre-descriptivo

# Eliminar feature branch remota (opcional)
git push origin --delete feature/nombre-descriptivo
```

### 2.6 Release a Main (producción)

```bash
# Solo cuando develop está estable y probado

# Actualizar main
git checkout main
git pull origin main

# Merge desde develop
git merge --no-ff develop

# Tag de versión
git tag -a v1.2.0 -m "Release v1.2.0: Nueva funcionalidad X"

# Push main y tags
git push origin main
git push origin --tags
```

---

## 3. Convenciones de Commits

Seguimos **Conventional Commits** para mantener un historial limpio y generar changelogs automáticos.

### 3.1 Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 3.2 Types (Tipos de Commit)

| Type | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(ai): agregar endpoint de clasificación` |
| `fix` | Corrección de bug | `fix(ocr): corregir timeout en documentos grandes` |
| `docs` | Cambios en documentación | `docs(readme): actualizar instrucciones de instalación` |
| `style` | Formato, no cambia lógica | `style(api): formatear código con PHP CS Fixer` |
| `refactor` | Refactorización de código | `refactor(mgp): mejorar estructura de componentes` |
| `test` | Agregar o corregir tests | `test(ai): agregar tests para extractor service` |
| `chore` | Mantenimiento (deps, config) | `chore(deps): actualizar Angular a v20` |
| `perf` | Mejora de performance | `perf(ocr): optimizar procesamiento de imágenes` |
| `ci` | Cambios en CI/CD | `ci(docker): actualizar docker-compose` |
| `build` | Cambios en build system | `build(webpack): optimizar configuración` |

### 3.3 Scopes (Alcance por Proyecto)

#### RUND-AI
- `ai`: General
- `classifier`: Clasificador
- `extractor`: Extractor
- `embeddings`: Embeddings
- `ollama`: Integración Ollama
- `schemas`: Schemas de documentos

#### RUND-API
- `api`: General
- `docentes`: Módulo docentes
- `documentos`: Módulo documentos
- `auth`: Autenticación
- `core`: Integración OpenKM
- `ocr`: Integración OCR
- `ai`: Integración IA

#### RUND-MGP
- `mgp`: General
- `dashboard`: Dashboard
- `docentes`: Vista docentes
- `documentos`: Vista documentos
- `upload`: Subida de archivos
- `search`: Búsqueda
- `ui`: Componentes UI

#### RUND-OCR
- `ocr`: General
- `paddle`: PaddleOCR
- `preprocessing`: Preprocesamiento
- `postprocessing`: Postprocesamiento
- `templates`: Templates de documentos

#### RUND-Deployment
- `deployment`: General
- `docker`: Docker Compose
- `scripts`: Scripts de despliegue
- `docs`: Documentación

### 3.4 Ejemplos de Commits por Proyecto

#### RUND-AI
```bash
feat(classifier): implementar clasificador con embeddings semánticos
feat(extractor): agregar soporte para certificados de idiomas
fix(ollama): corregir timeout en requests largos
docs(readme): agregar guía de troubleshooting
test(extractor): agregar tests para schema de cédula
refactor(schemas): reorganizar validaciones de campos
chore(deps): actualizar sentence-transformers a v2.2.2
```

#### RUND-API
```bash
feat(ai): agregar integración con servicio de clasificación
feat(docentes): implementar endpoint de búsqueda avanzada
fix(auth): corregir validación de tokens JWT
docs(api): documentar endpoints de documentos
test(docentes): agregar tests para controller
refactor(core): mejorar manejo de errores de OpenKM
chore(deps): actualizar guzzlehttp a v7.8
```

#### RUND-MGP
```bash
feat(dashboard): agregar gráficos de estadísticas de documentos
feat(upload): implementar drag & drop para subida de archivos
fix(search): corregir filtros de búsqueda por fecha
docs(readme): actualizar comandos de desarrollo
test(upload): agregar tests e2e para subida
style(ui): aplicar guía de estilos de ESAP
refactor(docentes): modularizar componente de listado
chore(deps): actualizar Angular a v20.1.0
```

#### RUND-OCR
```bash
feat(paddle): agregar soporte para idioma inglés
feat(templates): crear template para cédulas colombianas
fix(preprocessing): mejorar detección de bordes en imágenes
docs(readme): agregar ejemplos de uso de API
test(ocr): agregar tests con imágenes de ejemplo
perf(paddle): optimizar procesamiento de PDFs grandes
chore(deps): actualizar paddleocr a v2.7.0
```

#### RUND-Deployment
```bash
feat(docker): agregar servicio rund-ai al compose
fix(scripts): corregir script de backup de volúmenes
docs(claude): actualizar documentación de arquitectura
ci(docker): optimizar build de imágenes
chore(config): actualizar variables de entorno de producción
```

---

## 4. Comandos Útiles

### 4.1 Verificar Estado

```bash
# Ver estado actual
git status

# Ver historial de commits
git log --oneline --graph --all

# Ver diferencias
git diff

# Ver diferencias de archivo específico
git diff archivo.py
```

### 4.2 Actualizar Branch

```bash
# Actualizar branch actual
git pull

# Actualizar branch específico
git checkout develop
git pull origin develop

# Traer cambios sin merge
git fetch origin
```

### 4.3 Manejo de Branches

```bash
# Listar branches locales
git branch

# Listar branches remotas
git branch -r

# Listar todas las branches
git branch -a

# Cambiar de branch
git checkout nombre-branch

# Crear y cambiar a nueva branch
git checkout -b nueva-branch

# Eliminar branch local
git branch -d nombre-branch

# Eliminar branch remota
git push origin --delete nombre-branch
```

### 4.4 Deshacer Cambios

```bash
# Deshacer cambios en archivo (antes de add)
git checkout -- archivo.py

# Quitar archivo del staging (después de add)
git reset HEAD archivo.py

# Deshacer último commit (mantiene cambios)
git reset --soft HEAD~1

# Deshacer último commit (elimina cambios)
git reset --hard HEAD~1

# Revertir commit específico (crea nuevo commit)
git revert <commit-hash>
```

### 4.5 Stash (Guardar Cambios Temporalmente)

```bash
# Guardar cambios sin commit
git stash

# Listar stashes
git stash list

# Aplicar último stash
git stash apply

# Aplicar y eliminar último stash
git stash pop

# Eliminar todos los stashes
git stash clear
```

---

## 5. Flujos Especiales

### 5.1 Hotfix en Producción

```bash
# Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/correccion-critica

# Hacer cambios y commit
git add .
git commit -m "fix(api): corregir validación de documentos"

# Merge a main
git checkout main
git merge --no-ff hotfix/correccion-critica
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# Merge también a develop
git checkout develop
git merge --no-ff hotfix/correccion-critica
git push origin develop

# Eliminar hotfix branch
git branch -d hotfix/correccion-critica
```

### 5.2 Sincronizar Fork (si aplica)

```bash
# Agregar upstream (solo primera vez)
git remote add upstream https://github.com/ESAP-EDU-CO/rund-ai.git

# Actualizar desde upstream
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

### 5.3 Resolver Conflictos

```bash
# Al hacer merge/pull aparecen conflictos

# Ver archivos en conflicto
git status

# Editar archivos para resolver conflictos
# Buscar marcadores: <<<<<<< HEAD, =======, >>>>>>>

# Después de resolver
git add archivo-resuelto.py
git commit -m "merge: resolver conflictos en archivo.py"
git push
```

---

## 6. Integración Continua

### 6.1 Pre-commit Hooks (Recomendado)

Cada proyecto puede tener hooks para:
- Linting automático
- Tests antes de commit
- Validación de mensajes de commit

### 6.2 GitHub Actions

Los proyectos pueden tener workflows para:
- Build automático en PR
- Tests automáticos
- Deployment automático a staging

---

## 7. Buenas Prácticas

### ✅ DO (Hacer)

- Hacer commits pequeños y frecuentes
- Escribir mensajes de commit descriptivos
- Hacer pull antes de push
- Crear branches para cada feature/bugfix
- Revisar código antes de crear PR
- Probar localmente antes de push
- Mantener develop estable
- Actualizar documentación con cambios

### ❌ DON'T (No Hacer)

- Commit directo a `main` o `develop`
- Commits con mensaje genérico ("fix", "update")
- Push de código sin probar
- Commits con código comentado o debug
- Commits de archivos de configuración local (.env, .vscode)
- Reescribir historial de branches públicas
- Hacer merge de branches sin code review

---

## 8. Recursos Adicionales

### Enlaces Útiles

- **GitHub ESAP**: https://github.com/ESAP-EDU-CO
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Git Documentation**: https://git-scm.com/doc
- **Atlassian Git Tutorial**: https://www.atlassian.com/git/tutorials

### Comandos de Ayuda

```bash
# Ayuda de git
git help

# Ayuda de comando específico
git help commit
git help merge
git help branch
```

---

## 9. Contacto y Soporte

- **Líder Técnico**: [Contacto]
- **DevOps Team**: [Contacto]
- **Issues**: Crear issue en GitHub del proyecto correspondiente

---

**Última actualización**: 31 de octubre de 2025
**Mantenido por**: RUND Development Team - ESAP
