# PRD — Registro Único Nacional Docente (RUND)

> **Audiencia:** Equipo técnico + stakeholders ESAP  
> **Idioma:** Español colombiano  
> **Versión:** 1.0 — 14 mayo 2026  
> **Estado:** Refleja el sistema tal como existe hoy (UAT en curso)

---

## 1. Visión del Producto

| Campo | Valor |
|-------|-------|
| **Nombre** | RUND — Registro Único Nacional Docente |
| **Tipo** | Sistema de gestión documental con IA embebida |
| **Entidad** | ESAP — Escuela Superior de Administración Pública, Colombia |
| **Público objetivo** | Gestores documentales y administradores de la ESAP |
| **Idioma del sistema** | Español colombiano |
| **URL desarrollo** | http://localhost:4000 (frontend) / http://localhost:3000 (API) |
| **URL UAT / producción** | http://172.16.234.52:4000 (frontend) / http://172.16.234.52:3000 (API) |
| **Acceso** | Red interna ESAP o VPN (sin exposición a Internet público) |
| **Repositorio** | GitHub — ESAP-EDU-CO / rund-deployment |

---

## 2. Contexto y Problema que Resuelve

### Situación anterior

La ESAP gestiona aproximadamente **300 profesores** con una hoja de vida compuesta de hasta **40 documentos** cada una (~12 000 documentos en total). Antes de RUND, estos documentos se almacenaban en carpetas físicas o digitales sin estructura homogénea, lo que generaba:

- Búsquedas manuales lentas (horas por consulta).
- Imposibilidad de verificar si un docente tenía todos los documentos requeridos.
- Datos críticos —cédulas, certificados laborales, títulos académicos— dispersos y no indexados.
- Generación manual de certificados de vinculación, con alto riesgo de error.
- Ausencia de trazabilidad sobre qué documentos fueron revisados y cuándo.

### Solución

RUND centraliza la gestión documental de hojas de vida profesorales en una plataforma web que:

1. **Almacena** todos los documentos en un repositorio estructurado (OpenKM).
2. **Extrae automáticamente** el texto de los documentos escaneados mediante OCR.
3. **Interpreta** ese texto con inteligencia artificial para obtener datos estructurados (nombre, cédula, cargo, fechas).
4. **Genera** certificados institucionales a partir de las plantillas aprobadas por la ESAP.
5. **Controla el acceso** mediante autenticación contra el Active Directory corporativo de la ESAP.

---

## 3. Usuarios y Audiencias

| Perfil | Descripción | Necesidades principales |
|--------|-------------|------------------------|
| **Gestor documental** | Personal de la ESAP que administra las hojas de vida | Subir documentos, verificar que estén completos, corregir datos extraídos automáticamente |
| **Administrador** | Coordinador TI o responsable del sistema | Gestionar usuarios y roles, acceder a herramientas de administración, ver estadísticas del sistema |
| **Directivo** | Decano, jefe de área, auditor | Consultar el estado de la hoja de vida de un profesor, generar reportes |
| **Usuario básico** | Apoyo administrativo eventual | Validar datos básicos de un documento ya cargado |
| **Agente IA / Claude Code** | Herramienta de desarrollo asistida | Entender la arquitectura, los flujos y los contratos de API para dar soporte al equipo técnico |

---

## 4. Objetivos del Producto

| # | Objetivo | Métrica de éxito | Estado |
|---|----------|-----------------|--------|
| 1 | Centralizar las hojas de vida de ~300 profesores | 100 % de profesores con carpeta activa en OpenKM | ✅ Implementado |
| 2 | Permitir subida y descarga de documentos desde el navegador | Sin errores en carga de archivos hasta 50 MB | ✅ Implementado |
| 3 | Autenticar usuarios contra el LDAP de la ESAP | Login exitoso con credenciales corporativas | ✅ Implementado |
| 4 | Generar certificados de vinculación en Word y PDF | Certificado generado en < 5 segundos | ✅ Implementado |
| 5 | Extraer texto de documentos escaneados con OCR | Confianza ≥ 85 % en documentos estándar | ✅ Implementado |
| 6 | Extraer datos estructurados con IA (cédula, cargo, fechas) | Confianza ≥ 85 % en los 6 tipos de documento | ✅ Implementado |
| 7 | Proteger todas las rutas de la API con autenticación | 0 endpoints de datos accesibles sin token válido | 🚧 En progreso |
| 8 | Integrar autenticación en el frontend Angular | Flujo login → dashboard → logout funcionando | 🚧 En progreso |
| 9 | Clasificar documentos automáticamente al cargarlos | Clasificación correcta en ≥ 80 % de los casos | ⏳ Sin testing |
| 10 | Permitir búsqueda semántica de documentos | Resultados relevantes en < 2 segundos | ⏳ Sin testing |
| 11 | Procesar la carga inicial de ~12 000 documentos | Carga completa en ≤ 30 días (400 docs/día) | 🚧 En progreso |
| 12 | Monitorear el estado de extracción de datos con IA | Dashboard con totales, tasa de éxito y documentos pendientes | ✅ Implementado |
| 13 | Completar extracción pendiente en horas de baja carga | Job asíncrono configurable que procesa el backlog fuera del horario de uso | ❌ Pendiente |
| 14 | Exponer datos extraídos vía API paginada por docente | Endpoints con conteo, paginación y filtros por cédula | ✅ Implementado |
| 15 | Recolectar fecha de nacimiento y calcular rango etario automáticamente | Date picker en Carga masiva → rango calculado + almacenado; job nocturno actualiza OpenKM | ✅ Implementado |
| 16 | Gestión operacional de la sección Extracción de datos | Reset de jobs bloqueados, inicio/pausa manual del scheduler, rangos horarios configurables | 🚧 En progreso |

---

## 5. Funcionalidades Actuales

### 5.1 Autenticación y Sesiones

El sistema autentica a los usuarios contra el **Active Directory de la ESAP** mediante el protocolo LDAP. También soporta autenticación OAuth 2.0 con Microsoft Entra ID (Azure AD) para cuando la ESAP migre a M365.

**Flujo de autenticación:**
```
1. El usuario ingresa usuario y contraseña en el formulario de login
2. El sistema verifica las credenciales contra el AD de la ESAP
3. Si son correctas, se crea una sesión segura (8 horas de inactividad)
4. El sistema asigna un rol al usuario (admin / gestor / directivo / usuario)
5. El usuario accede al dashboard según su rol
```

**Roles disponibles:**

| Rol | Acceso |
|-----|--------|
| `admin` | Todas las secciones, incluyendo herramientas de administración |
| `gestor` | Gestión de documentos y generación de certificados |
| `directivo` | Solo consultas y reportes |
| `usuario` | Solo validación de datos básicos |

**Modo desarrollo:** El sistema incluye un acceso de prueba sin LDAP real (`/dev/login`), habilitado únicamente cuando la variable `DEV_FAKE_LOGIN=true` está activa.

---

### 5.2 Gestión de Documentos (Repositorio)

El sistema almacena todos los documentos en **OpenKM**, un repositorio de contenidos empresarial que organiza los archivos en una taxonomía de carpetas:

```
/okm:root/RUND/
└── DOCENTES/
    └── HOJAS_DE_VIDA/
        └── {cédula_del_profesor}/
            ├── cedula.pdf
            ├── certificado_laboral_1.pdf
            ├── titulo_pregrado.pdf
            └── {uuid}.extracted.json   ← datos extraídos por IA
```

**Acciones disponibles:**

- Subir documentos (PNG, JPG, PDF, Word, Excel) hasta 50 MB.
- Descargar documentos individuales.
- Ver el listado de documentos de un profesor.
- Eliminar documentos (requiere rol gestor o admin).
- Mover documentos a la papelera y vaciarla.

---

### 5.3 Extracción de Datos con OCR e IA

Cuando un gestor sube un documento escaneado, el sistema puede **extraer automáticamente** los datos que contiene:

```
1. El usuario sube el documento y solicita extracción
2. El sistema lee el texto del documento (OCR)
3. La inteligencia artificial identifica el tipo de documento
4. El sistema extrae los campos según la plantilla del tipo detectado
5. Se muestra un formulario pre-llenado para que el gestor revise y confirme
6. Los datos confirmados se guardan junto al documento en el repositorio
```

**Tipos de documentos con extracción automática:**

| Tipo | Campos extraídos | Prioridad |
|------|-----------------|-----------|
| Cédula de ciudadanía | Número, nombres, apellidos, fecha de nacimiento, lugar de expedición | Alta |
| Certificado laboral | Entidad, cargo, período, salario, tipo de contrato | Alta |
| Resolución de nombramiento | Número, fecha, entidad, cargo, vigencia | Alta |
| Certificado académico | Institución, título, nivel, fecha de grado | Media |
| Acta de evaluación docente | Fecha, evaluadores, calificaciones | Media |
| Certificado de idiomas | Idioma, nivel (MCER), institución, fecha | Baja |

---

### 5.4 Generación de Certificados

El sistema genera automáticamente certificados institucionales a partir de:

- Los datos almacenados en el repositorio (nombre, cargo, período).
- Plantillas en formato Word (`.docx`) aprobadas por la ESAP.
- Firmas digitalizadas de los funcionarios autorizados.

El certificado resultante puede descargarse en **Word** o **PDF** según lo requiera el usuario.

---

### 5.5 Gestión de Categorías

El sistema refleja la taxonomía de categorías de OpenKM, que clasifica los documentos por tipo y período. El gestor puede:

- Ver el árbol de categorías disponible.
- Ver las categorías asignadas a un documento.
- Cambiar la categoría de un documento.
- Ver tablas cruzadas de categorías (qué documentos pertenecen a qué categoría).

---

### 5.6 Carga de Listados

El gestor puede subir archivos **Excel o CSV** con listados masivos de datos (por ejemplo, listas de profesores con sus cédulas y nombres). El sistema:

- Valida el formato del archivo.
- Muestra una vista previa de los datos antes de confirmar.
- Permite descargar el listado procesado en CSV.

---

### 5.7 Panel de Herramientas (Administrador)

Solo accesible para usuarios con rol `admin`. Incluye:

- Gestión de firmas digitalizadas (subir, ver, eliminar).
- Limpieza de archivos temporales del servidor.
- Vaciar la papelera del repositorio.
- Vista de información del sistema (versión, estado de servicios).

---

## 6. Roadmap de Funcionalidades Futuras

> Estas funcionalidades **no están implementadas** hoy. Se incluyen para orientar el desarrollo futuro.

| # | Funcionalidad | Prioridad | Fase | Descripción |
|---|---------------|-----------|------|-------------|
| 1 | Integración completa del login en el frontend | **Alta** | 4 | Los guardas de ruta y el interceptor HTTP de Angular aún no están integrados con rund-auth |
| 2 | Protección de todas las rutas de la API | **Alta** | 4 | Varios endpoints de rund-api aún no requieren token válido |
| 3 | Clasificación automática al subir un documento | **Alta** | 4 | El endpoint de clasificación existe pero no está conectado al flujo de carga |
| 4 | Validación de consistencia entre documentos | Media | 4 | Detectar inconsistencias (ej. nombres diferentes en cédula y certificado) |
| 5 | Detector de documentos duplicados | Media | 4 | Identificar cuando se sube el mismo documento dos veces |
| 6 | OCR optimizado para cédulas colombianas | Media | 5 | Plantillas y detección de campos por posición para documentos de identidad |
| 7 | Post-procesamiento OCR con corrección automática | Media | 5 | Regex y validación para corregir errores comunes de OCR |
| 8 | Dashboard de validación y calidad | Media | 5 | Vista de qué documentos tienen datos incompletos o inconsistentes |
| 9 | Búsqueda semántica de documentos | Media | 6 | El motor de búsqueda (ChromaDB) está implementado pero sin testing en producción |
| 10 | Análisis de tendencias y reportes automáticos | Baja | 6 | Resúmenes automáticos generados por IA |
| 11 | Rate limiting en los endpoints de autenticación | **Alta** | Seguridad | Limitar a 5 intentos/minuto por IP en el endpoint de login |
| 12 | Habilitación de HTTPS en producción | **Alta** | Seguridad | La comunicación actual es HTTP sin cifrado |
| 13 | Audit logging de eventos de autenticación | Media | Seguridad | Registro de todos los login/logout para auditoría |
| 14 | Sección "Extracción de datos" en el frontend | **Alta** | 4 | ✅ Dashboard implementado: total cargados, JSONs generados, pendientes, errores, tasa de éxito, cola activa. Visible en menú lateral para gestor+. |
| 15 | Job asíncrono de extracción en horas muertas | **Alta** | 4 | Tarea configurable que completa el backlog de extracción fuera del horario de uso. Controles en la UI: rangos horarios, inicio manual, pausa. |
| 16 | API de consulta de JSONs extraídos por docente | **Alta** | 4 | `GET /api/v2/extraccion/{cedula}` — documentos extraídos, conteo y paginación. |
| 17 | Corrección: docentes faltantes en desplegable de Editar documentación | **Crítica** | Hotfix | ✅ Corregido: DocumentService ahora infiere TIPO/FORMATO de path y mimeType cuando OpenKM no devuelve categorías. getInfoProfesor() retorna datos aunque la cédula tenga nombre no estándar. |
| 18 | Reset de jobs bloqueados de extracción | **Media** | 4 | Los jobs que quedan en estado "procesando" con la cola vacía (sesiones anteriores) deben poder resetearse a "pendiente" desde la UI o un endpoint de administración. |

---

## 7. Casos de Uso Principales

| Actor | Acción | Resultado esperado |
|-------|--------|--------------------|
| Gestor | Sube un PDF escaneado de una cédula | El sistema extrae el número, nombre y apellidos automáticamente |
| Gestor | Solicita la generación de un certificado de vinculación | El sistema genera el PDF con los datos del profesor y la firma del decano |
| Gestor | Busca documentos de un profesor por cédula | El sistema muestra el listado completo de archivos almacenados |
| Administrador | Agrega un nuevo usuario con rol gestor | El usuario puede autenticarse y acceder al módulo de gestión |
| Directivo | Consulta el estado documental de un profesor | El sistema muestra qué documentos tiene y cuáles faltan |
| Sistema | Recibe un documento en la cola de procesamiento | Lo procesa con OCR + IA de forma asíncrona sin bloquear la interfaz |
| Sistema | Detecta que un certificado laboral tiene un período inválido | Marca el documento con error y lo notifica al gestor |

---

## 8. Requisitos No Funcionales

### 8.1 Rendimiento

| Operación | Tiempo máximo aceptable |
|-----------|------------------------|
| Extracción OCR de un PDF de 5 páginas | 30–60 segundos |
| Extracción estructurada con IA | 5–20 segundos |
| Búsqueda semántica | < 2 segundos |
| Generación de certificado | < 5 segundos |
| Login (LDAP) | < 3 segundos |
| Carga/descarga de archivo | < 10 segundos (red interna) |

### 8.2 Disponibilidad

- **Entorno:** Red interna ESAP o VPN. No expuesto a Internet.
- **Downtime planificado:** Posible en horario nocturno o fines de semana.
- **Alta disponibilidad:** No requerida en esta fase (sistema no-crítico en tiempo real).

### 8.3 Capacidad

| Dimensión | Valor |
|-----------|-------|
| Profesores activos | ~300 |
| Documentos por profesor | ~40 |
| Total documentos | ~12 000 |
| Carga inicial (ritmo) | 400 documentos/día |
| Tiempo estimado de carga inicial | 15–30 días |
| Usuarios concurrentes esperados | < 20 |

### 8.4 Seguridad

- Autenticación obligatoria para toda acción sobre datos.
- Tokens de sesión nunca expuestos al navegador (solo cookies `httpOnly`).
- JWT firmados con clave privada RS256; validados con clave pública sin compartir el secreto.
- Sin exposición de servicios de IA y OCR a la red externa.

### 8.5 Compatibilidad

- **Navegadores:** Chrome 120+, Firefox 120+, Edge 120+ (no requiere IE11).
- **Dispositivos:** Desktop/laptop (no se optimiza para móvil en esta fase).
- **Tamaño máximo de archivo:** 50 MB por documento.
- **Formatos de entrada:** PDF, PNG, JPG, TIFF, BMP, DOCX, XLSX.

### 8.6 Mantenibilidad

- Todos los servicios deben tener health checks funcionales.
- Los logs deben ser consultables con `docker compose logs`.
- El sistema debe poder reiniciarse sin pérdida de datos (volúmenes Docker persistentes).

---

## 9. Restricciones y Decisiones de Diseño

> **Por qué estas restricciones existen y qué implican para el desarrollo.**

| Restricción | Descripción | Implicación para el equipo |
|-------------|-------------|---------------------------|
| **Solo red interna** | La IP de producción (172.16.234.52) no está expuesta a Internet | No configurar CORS permisivo para dominios externos |
| **Sin HTTPS en esta fase** | La comunicación es HTTP. HTTPS está planificado pero depende de la OTIC-ESAP | No enviar credenciales sensibles en query params; usar cookies httpOnly |
| **Sin GPU** | El servidor de producción no tiene GPU; todo el procesamiento de IA es en CPU | Los tiempos de inferencia son mayores; no usar modelos que requieran GPU |
| **OpenKM como único DMS** | El sistema usa OpenKM CE como repositorio; migración no planificada | Todo el almacenamiento de documentos pasa por la API de OpenKM |
| **PHP para el backend principal** | El conocimiento del equipo estaba en PHP cuando se inició el proyecto | No mezclar lógica de negocio entre rund-api (PHP) y rund-ai (Python) |
| **Cédulas deben tener 6–10 dígitos** | Validación específica para documentos colombianos | Los esquemas de extracción incluyen esta regla; no eliminarla |
| **LDAP de la ESAP solo en red interna** | El servidor LDAP `ldap://esap.edu.int:389` solo es accesible desde la red institucional | El entorno de desarrollo necesita `DEV_FAKE_LOGIN=true` para funcionar sin VPN |

---

## 10. Glosario de Negocio

| Término | Definición |
|---------|-----------|
| **RUND** | Registro Único Nacional Docente — nombre del sistema |
| **ESAP** | Escuela Superior de Administración Pública — entidad propietaria del sistema |
| **Hoja de vida profesoral** | Conjunto de documentos que acreditan la formación y experiencia de un profesor de la ESAP |
| **Profesor** | Docente de la ESAP identificado por su cédula de ciudadanía |
| **OpenKM** | Repositorio de documentos empresarial (Document Management System) donde se almacenan físicamente todos los archivos |
| **Extracción estructurada** | Proceso de convertir el texto de un documento en campos de datos con nombre y valor (ej. `cargo: Profesor Asociado`) |
| **OCR** | Reconocimiento óptico de caracteres — tecnología que convierte imágenes de texto en texto editable |
| **Cédula de ciudadanía** | Documento de identidad colombiano de 6 a 10 dígitos |
| **Certificado laboral** | Documento emitido por una entidad que certifica que un profesor trabajó allí durante un período |
| **Resolución de nombramiento** | Acto administrativo de la ESAP que formaliza el vínculo laboral de un docente |
| **Acta de evaluación docente** | Documento que registra el resultado de la evaluación de desempeño de un profesor |
| **BFF** | Backend-for-Frontend — patrón donde la API (`rund-api`) actúa como intermediario entre el frontend y los servicios internos |
| **JWT** | Token de autenticación firmado digitalmente con el que el sistema verifica la identidad del usuario |
| **LDAP / Active Directory** | Directorio corporativo de la ESAP donde están almacenadas las cuentas de los funcionarios |
| **UAT** | User Acceptance Testing — fase de pruebas con usuarios reales antes del despliegue oficial |
| **Rol** | Nivel de acceso asignado a un usuario: `admin`, `gestor`, `directivo` o `usuario` |
| **Procesamiento asíncrono** | El sistema recibe una solicitud, la pone en cola y la procesa en segundo plano sin bloquear la interfaz |
| **Confianza (confidence)** | Porcentaje que indica qué tan seguro está el modelo de IA de que la información extraída es correcta |
| **Schema de extracción** | Plantilla que define qué campos debe extraer la IA de un tipo de documento específico |
| **Whitelist** | Lista de usuarios autorizados con su rol asignado en cada aplicación del ecosistema RUND |
| **MCER** | Marco Común Europeo de Referencia para las Lenguas (A1-C2) — niveles de certificación de idiomas |
| **OTIC** | Oficina de Tecnologías de la Información y Comunicaciones de la ESAP |
