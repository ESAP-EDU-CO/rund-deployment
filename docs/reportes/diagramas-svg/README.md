# Diagramas de Arquitectura RUND - Exportados a SVG

Este directorio contiene todos los diagramas de arquitectura del documento **RUND-Arquitectura-Seguridad.md** exportados a formato SVG.

**Fecha de exportación:** 27 de noviembre de 2025
**Total de diagramas:** 12

---

## 📋 Listado de Diagramas

### 1. Diagramas de Contexto (C4 - Nivel 1)

#### 01-contexto-c4.svg
- **Tipo:** C4 Context Diagram
- **Descripción:** Diagrama de contexto del sistema RUND mostrando actores (Profesor, Gestor, Administrador) e interacciones con servicios externos (Microsoft Entra ID, VPN, Red ESAP)
- **Archivos:** `01-contexto-c4.mmd`, `01-contexto-c4.svg`

#### 02-contexto-flujo.svg
- **Tipo:** Flowchart
- **Descripción:** Versión alternativa del diagrama de contexto con flujo visual usando emojis, mostrando canales de acceso y componentes principales del sistema
- **Archivos:** `02-contexto-flujo.mmd`, `02-contexto-flujo.svg`

---

### 2. Diagramas de Contenedores (C4 - Nivel 2)

#### 03-contenedores-c4.svg
- **Tipo:** C4 Container Diagram
- **Descripción:** Diagrama de contenedores Docker del sistema RUND en ambiente UAT (172.16.234.52), mostrando todos los servicios: RUND-MGP, RUND-AUTH, RUND-API, RUND-CORE, RUND-AI, RUND-OCR, RUND-OLLAMA
- **Archivos:** `03-contenedores-c4.mmd`, `03-contenedores-c4.svg`

#### 04-contenedores-detallado.svg
- **Tipo:** Flowchart Detallado
- **Descripción:** Versión detallada de contenedores mostrando:
  - Componentes funcionales (✅)
  - Componentes experimentales (🧪)
  - Almacenamiento persistente (💾)
  - Especificaciones técnicas (tecnología, puertos)
- **Archivos:** `04-contenedores-detallado.mmd`, `04-contenedores-detallado.svg`

---

### 3. Diagramas de Red e Infraestructura

#### 05-topologia-red.svg
- **Tipo:** Flowchart de Topología de Red
- **Descripción:** Topología de red completa mostrando:
  - Internet y usuarios externos
  - Zona DMZ (VPN)
  - Red interna ESAP (172.16.x.x)
  - Red Docker bridge (rund-network)
  - Conexión con Microsoft Azure (Entra ID)
- **Archivos:** `05-topologia-red.mmd`, `05-topologia-red.svg`

#### 06-puertos-protocolos.svg
- **Tipo:** Flowchart de Puertos
- **Descripción:** Matriz de puertos expuestos al host con niveles de acceso recomendados:
  - ✅ Acceso usuario (4000, 4100, 3000)
  - 🔧 Solo admin (8080)
  - ⛔ Solo interno (8001, 8000, 11434)
- **Archivos:** `06-puertos-protocolos.mmd`, `06-puertos-protocolos.svg`

---

### 4. Diagramas de Flujo de Datos (DFD)

#### 07-dfd-nivel0.svg
- **Tipo:** Data Flow Diagram - Nivel 0 (Contexto)
- **Descripción:** DFD de alto nivel mostrando flujos entre:
  - Usuario
  - Sistema RUND
  - Repositorio documental
  - Proveedor de identidad
- **Archivos:** `07-dfd-nivel0.mmd`, `07-dfd-nivel0.svg`

#### 08-dfd-nivel1.svg
- **Tipo:** Data Flow Diagram - Nivel 1 (Procesos Principales)
- **Descripción:** DFD detallado mostrando:
  - Límite de confianza (Red ESAP)
  - 5 procesos principales (Portal, Auth, API, AI, OCR)
  - Flujos de datos numerados (F1-F11)
  - Almacenamiento de datos (OpenKM, ChromaDB)
- **Archivos:** `08-dfd-nivel1.mmd`, `08-dfd-nivel1.svg`

---

### 5. Diagramas de Flujo de Autenticación

#### 09-auth-actual.svg
- **Tipo:** Sequence Diagram
- **Descripción:** Estado actual del flujo de autenticación (⚠️ sin implementar):
  - Muestra bypass del AuthMiddleware
  - Credenciales hardcoded a OpenKM
  - Acceso sin restricciones
- **Archivos:** `09-auth-actual.mmd`, `09-auth-actual.svg`

#### 10-auth-planificado.svg
- **Tipo:** Sequence Diagram
- **Descripción:** Flujo de autenticación planificado con OAuth 2.0 + JWT:
  - 22 pasos del flujo completo
  - Integración con Microsoft Entra ID
  - Generación y validación de JWT
  - Refresh token cada 15 minutos
- **Archivos:** `10-auth-planificado.mmd`, `10-auth-planificado.svg`

#### 11-estructura-jwt.svg
- **Tipo:** Flowchart
- **Descripción:** Estructura del JSON Web Token (JWT) planificado:
  - Header (alg, typ)
  - Payload (sub, name, roles, cedula, territorial, iat, exp, aud, iss)
  - Signature (RS256)
- **Archivos:** `11-estructura-jwt.mmd`, `11-estructura-jwt.svg`

---

### 6. Matriz de Comunicaciones

#### 12-matriz-comunicaciones.svg
- **Tipo:** Flowchart
- **Descripción:** Matriz de comunicaciones entre servicios con niveles de autenticación:
  - 🟢 Autenticado (RUND-AUTH)
  - 🟡 Autenticación pendiente (RUND-MGP, RUND-CORE)
  - 🔴 Sin autenticación (RUND-AI, RUND-OCR, RUND-OLLAMA)
- **Archivos:** `12-matriz-comunicaciones.mmd`, `12-matriz-comunicaciones.svg`

---

## 🛠️ Herramientas Utilizadas

- **Mermaid CLI** v11.x
- **Comando de exportación:**
  ```bash
  mmdc -i <diagrama>.mmd -o <diagrama>.svg -t default -b transparent
  ```

## 📝 Notas

- Los archivos `.mmd` son los archivos fuente en formato Mermaid
- Los archivos `.svg` son las imágenes vectoriales exportadas
- Todos los diagramas usan fondo transparente para mejor integración en documentos
- Los diagramas con emojis pueden tener ligeras variaciones de visualización dependiendo del visor SVG

---

## 📄 Licencia y Uso

**Clasificación:** Confidencial - Uso Interno ESAP
**Autor:** Dirección de Entornos y Servicios Virtuales (DESV)
**Contacto:** ocastelblanco@esap.edu.co

Estos diagramas son parte de la documentación oficial de arquitectura de seguridad del sistema RUND.
