# Arquitectura de Seguridad del Sistema RUND
## Escuela Superior de Administración Pública (ESAP)

**Versión:** 1.0  
**Fecha:** 27 de noviembre de 2025  
**Clasificación:** Confidencial - Uso Interno  
**Ambiente documentado:** UAT (Pruebas de Aceptación de Usuario)  
**Autor:** Dirección de Entornos y Servicios Virtuales (DESV)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Diagrama de Contexto (C4 - Nivel 1)](#2-diagrama-de-contexto-c4---nivel-1)
3. [Diagrama de Contenedores (C4 - Nivel 2)](#3-diagrama-de-contenedores-c4---nivel-2)
4. [Diagrama de Red e Infraestructura](#4-diagrama-de-red-e-infraestructura)
5. [Diagrama de Flujo de Datos (DFD)](#5-diagrama-de-flujo-de-datos-dfd)
6. [Flujo de Autenticación](#6-flujo-de-autenticación)
7. [Matriz de Comunicaciones](#7-matriz-de-comunicaciones)
8. [Inventario de Componentes](#8-inventario-de-componentes)
9. [Consideraciones de Seguridad](#9-consideraciones-de-seguridad)
10. [Anexos](#10-anexos)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Sistema

RUND (Registro Único Nacional Docente) es un sistema de gestión documental para la administración de hojas de vida académicas de los profesores de la ESAP. El sistema permite:

- Almacenamiento y gestión de documentos académicos
- Generación de certificados laborales
- Consulta de información profesoral
- Procesamiento inteligente de documentos (OCR e IA)

### 1.2 Componentes del Ecosistema

| Categoría | Componentes | Estado |
|-----------|-------------|--------|
| **Funcionales (Producción)** | RUND-CORE, RUND-API, RUND-MGP, RUND-AUTH | Activos |
| **Experimentales** | RUND-AI, RUND-OCR, RUND-OLLAMA | En desarrollo |
| **Descontinuados** | RUND-PTA | Transferido a OTIC |

### 1.3 Infraestructura

- **Tipo:** On-premise (Centro de datos ESAP)
- **Servidor UAT:** 172.16.234.52
- **Acceso:** Solo red interna ESAP o VPN institucional
- **Containerización:** Docker con red bridge interna

### 1.4 Datos Sensibles Manejados

- Números de cédula de ciudadanía
- Nombres completos de profesores
- Información laboral y académica
- Hojas de vida académicas
- Documentos de soporte (futuro)

---

## 2. Diagrama de Contexto (C4 - Nivel 1)

Este diagrama muestra el sistema RUND y sus interacciones con actores externos.

```mermaid
C4Context
    title Sistema RUND - Diagrama de Contexto

    Person(profesor, "Profesor ESAP", "Consulta su información académica y documentos")
    Person(gestor, "Gestor Profesoral", "Administra información de profesores")
    Person(admin, "Administrador", "Configura y mantiene el sistema")

    System_Boundary(rund, "Sistema RUND") {
        System(rund_system, "RUND", "Sistema de Gestión Documental Profesoral")
    }

    System_Ext(entra_id, "Microsoft Entra ID", "Servicio de autenticación corporativo")
    System_Ext(vpn, "VPN ESAP", "Acceso remoto seguro")
    System_Ext(red_interna, "Red Interna ESAP", "Infraestructura de red institucional")

    Rel(profesor, rund_system, "Consulta información", "HTTPS")
    Rel(gestor, rund_system, "Gestiona profesores", "HTTPS")
    Rel(admin, rund_system, "Administra sistema", "HTTPS")
    
    Rel(rund_system, entra_id, "Autentica usuarios", "OAuth 2.0 / OIDC")
    Rel(profesor, vpn, "Acceso remoto")
    Rel(vpn, red_interna, "Conecta a")
    Rel(red_interna, rund_system, "Acceso interno")
```

### Diagrama de Contexto (Versión Alternativa - Flujo)

```mermaid
flowchart TB
    subgraph Usuarios["👥 Usuarios"]
        P[("👨‍🏫 Profesor")]
        G[("👔 Gestor Profesoral")]
        A[("🔧 Administrador")]
    end

    subgraph Acceso["🌐 Canales de Acceso"]
        RI["🏢 Red Interna ESAP"]
        VPN["🔐 VPN Institucional"]
    end

    subgraph RUND["📦 Sistema RUND"]
        MGP["🖥️ Portal Web<br/>(RUND-MGP)"]
        API["⚙️ API Backend<br/>(RUND-API)"]
        CORE["📁 Repositorio<br/>(RUND-CORE)"]
        AUTH["🔑 Autenticación<br/>(RUND-AUTH)"]
    end

    subgraph Externos["☁️ Servicios Externos"]
        ENTRA["🔷 Microsoft<br/>Entra ID"]
    end

    P --> RI
    P --> VPN
    G --> RI
    A --> RI

    VPN --> RI
    RI --> MGP

    MGP <--> API
    API <--> CORE
    MGP <--> AUTH
    AUTH <--> ENTRA

    classDef usuario fill:#e1f5fe,stroke:#01579b
    classDef acceso fill:#fff3e0,stroke:#e65100
    classDef sistema fill:#e8f5e9,stroke:#2e7d32
    classDef externo fill:#fce4ec,stroke:#c2185b

    class P,G,A usuario
    class RI,VPN acceso
    class MGP,API,CORE,AUTH sistema
    class ENTRA externo
```

---

## 3. Diagrama de Contenedores (C4 - Nivel 2)

Este diagrama detalla los contenedores Docker que componen el sistema RUND.

```mermaid
C4Container
    title Sistema RUND - Diagrama de Contenedores (Ambiente UAT)

    Person(usuario, "Usuario ESAP", "Profesor, Gestor o Administrador")

    System_Boundary(docker, "Servidor Docker - 172.16.234.52") {
        Container(mgp, "RUND-MGP", "Angular 20 + SSR", "Portal web principal<br/>Puerto: 4000")
        Container(auth, "RUND-AUTH", "Node.js + Express", "Servicio de autenticación<br/>Puerto: 4100")
        Container(api, "RUND-API", "PHP 8.3 + Apache", "API REST Backend<br/>Puerto: 3000")
        Container(core, "RUND-CORE", "OpenKM CE (Java)", "Repositorio documental<br/>Puerto: 8080")
        
        Container(ai, "RUND-AI", "Python + Flask", "Procesamiento IA<br/>Puerto: 8001", $tags="experimental")
        Container(ocr, "RUND-OCR", "Python + PaddleOCR", "Extracción de texto<br/>Puerto: 8000", $tags="experimental")
        Container(ollama, "RUND-OLLAMA", "Ollama Engine", "Modelos LLM<br/>Puerto: 11434", $tags="experimental")
    }

    System_Ext(entra, "Microsoft Entra ID", "Proveedor de identidad")

    Rel(usuario, mgp, "Accede via navegador", "HTTP :4000")
    Rel(mgp, api, "Consume API", "HTTP :3000")
    Rel(mgp, auth, "Solicita autenticación", "HTTP :4100")
    Rel(auth, entra, "Valida credenciales", "OAuth 2.0")
    Rel(api, core, "Gestiona documentos", "HTTP :8080")
    Rel(api, ai, "Procesamiento IA", "HTTP :8001")
    Rel(api, ocr, "Extracción OCR", "HTTP :8000")
    Rel(ai, ollama, "Inferencia LLM", "HTTP :11434")
    Rel(ai, ocr, "Pipeline OCR", "HTTP :8000")
```

### Diagrama de Contenedores (Versión Detallada)

```mermaid
flowchart TB
    subgraph Internet["🌐 Acceso de Red"]
        Usuario["👤 Usuario ESAP"]
    end

    subgraph Server["🖥️ Servidor Docker - 172.16.234.52"]
        subgraph Funcionales["✅ Componentes Funcionales"]
            MGP["🖥️ RUND-MGP<br/>━━━━━━━━━━━━<br/>Angular 20 + SSR<br/>Node.js 20.x<br/>━━━━━━━━━━━━<br/>📍 Puerto: 4000"]
            
            AUTH["🔑 RUND-AUTH<br/>━━━━━━━━━━━━<br/>Node.js + Express<br/>JWT + MSAL<br/>━━━━━━━━━━━━<br/>📍 Puerto: 4100"]
            
            API["⚙️ RUND-API<br/>━━━━━━━━━━━━<br/>PHP 8.3 + Apache<br/>LibreOffice<br/>━━━━━━━━━━━━<br/>📍 Puerto: 3000"]
            
            CORE["📁 RUND-CORE<br/>━━━━━━━━━━━━<br/>OpenKM CE<br/>Java + Tomcat<br/>━━━━━━━━━━━━<br/>📍 Puerto: 8080"]
        end

        subgraph Experimentales["🧪 Componentes Experimentales"]
            AI["🤖 RUND-AI<br/>━━━━━━━━━━━━<br/>Python + Flask<br/>ChromaDB<br/>━━━━━━━━━━━━<br/>📍 Puerto: 8001"]
            
            OCR["📄 RUND-OCR<br/>━━━━━━━━━━━━<br/>Python + PaddleOCR<br/>ES/EN<br/>━━━━━━━━━━━━<br/>📍 Puerto: 8000"]
            
            OLLAMA["🧠 RUND-OLLAMA<br/>━━━━━━━━━━━━<br/>Ollama Engine<br/>nuextract, gemma2<br/>━━━━━━━━━━━━<br/>📍 Puerto: 11434"]
        end

        subgraph Storage["💾 Almacenamiento Persistente"]
            V1[("openkm-data<br/>10-50 GB")]
            V2[("ollama-data<br/>6 GB")]
            V3[("ai-cache<br/>1-2 GB")]
        end
    end

    subgraph External["☁️ Servicios Externos"]
        ENTRA["🔷 Microsoft Entra ID"]
    end

    Usuario -->|"HTTP :4000"| MGP
    MGP -->|"HTTP :3000"| API
    MGP -->|"HTTP :4100"| AUTH
    AUTH <-->|"OAuth 2.0 / OIDC"| ENTRA
    API -->|"HTTP :8080<br/>Basic Auth"| CORE
    API -->|"HTTP :8001"| AI
    API -->|"HTTP :8000"| OCR
    AI -->|"HTTP :11434"| OLLAMA
    AI -->|"HTTP :8000"| OCR
    AI -->|"HTTP :3000"| API

    CORE --- V1
    OLLAMA --- V2
    AI --- V3

    classDef funcional fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef experimental fill:#fff9c4,stroke:#f9a825,stroke-width:2px,stroke-dasharray: 5 5
    classDef storage fill:#e3f2fd,stroke:#1565c0
    classDef externo fill:#fce4ec,stroke:#c2185b

    class MGP,AUTH,API,CORE funcional
    class AI,OCR,OLLAMA experimental
    class V1,V2,V3 storage
    class ENTRA externo
```

---

## 4. Diagrama de Red e Infraestructura

### 4.1 Topología de Red

```mermaid
flowchart TB
    subgraph Internet["☁️ Internet"]
        ExtUser["👤 Usuario Externo"]
    end

    subgraph ESAP["🏛️ Red ESAP"]
        subgraph DMZ["🛡️ Zona DMZ"]
            VPN["🔐 Servidor VPN"]
        end

        subgraph Internal["🔒 Red Interna (172.16.x.x)"]
            IntUser["👤 Usuario Interno"]
            
            subgraph DockerHost["🖥️ Servidor Docker<br/>172.16.234.52"]
                subgraph DockerNet["🐳 rund-network (bridge)"]
                    direction TB
                    C1["rund-mgp<br/>:4000"]
                    C2["rund-auth<br/>:4100"]
                    C3["rund-api<br/>:3000"]
                    C4["rund-core<br/>:8080"]
                    C5["rund-ai<br/>:8001"]
                    C6["rund-ocr<br/>:8000"]
                    C7["rund-ollama<br/>:11434"]
                end
            end
        end
    end

    subgraph Azure["☁️ Microsoft Azure"]
        EntraID["🔷 Entra ID"]
    end

    ExtUser -->|"VPN Connection"| VPN
    VPN -->|"Tunnel"| Internal
    IntUser -->|"HTTP"| DockerHost

    C1 <--> C2
    C1 <--> C3
    C3 <--> C4
    C3 <--> C5
    C3 <--> C6
    C5 <--> C6
    C5 <--> C7
    C2 <-->|"HTTPS :443"| EntraID

    classDef internet fill:#ffcdd2,stroke:#c62828
    classDef dmz fill:#fff3e0,stroke:#ef6c00
    classDef internal fill:#e8f5e9,stroke:#2e7d32
    classDef docker fill:#e3f2fd,stroke:#1565c0
    classDef azure fill:#e1f5fe,stroke:#0277bd

    class ExtUser internet
    class VPN dmz
    class IntUser,DockerHost internal
    class C1,C2,C3,C4,C5,C6,C7 docker
    class EntraID azure
```

### 4.2 Puertos y Protocolos

```mermaid
flowchart LR
    subgraph Exposed["🌐 Puertos Expuestos al Host"]
        P4000["📍 4000<br/>RUND-MGP<br/>Frontend"]
        P4100["📍 4100<br/>RUND-AUTH<br/>Autenticación"]
        P3000["📍 3000<br/>RUND-API<br/>Backend"]
        P8080["📍 8080<br/>RUND-CORE<br/>OpenKM Admin"]
        P8001["📍 8001<br/>RUND-AI<br/>⚠️ Interno"]
        P8000["📍 8000<br/>RUND-OCR<br/>⚠️ Interno"]
        P11434["📍 11434<br/>RUND-OLLAMA<br/>⚠️ Interno"]
    end

    subgraph Access["🔐 Nivel de Acceso Recomendado"]
        Public["✅ Acceso Usuario"]
        Admin["🔧 Solo Admin"]
        Internal["⛔ Solo Interno"]
    end

    P4000 --> Public
    P4100 --> Public
    P3000 --> Public
    P8080 --> Admin
    P8001 --> Internal
    P8000 --> Internal
    P11434 --> Internal

    classDef public fill:#c8e6c9,stroke:#2e7d32
    classDef admin fill:#fff9c4,stroke:#f9a825
    classDef internal fill:#ffcdd2,stroke:#c62828

    class P4000,P4100,P3000 public
    class P8080 admin
    class P8001,P8000,P11434 internal
```

---

## 5. Diagrama de Flujo de Datos (DFD)

Este diagrama es fundamental para el análisis de amenazas (Threat Modeling).

### 5.1 DFD Nivel 0 - Contexto

```mermaid
flowchart LR
    U["👤 Usuario"]
    
    RUND(("📦 Sistema<br/>RUND"))
    
    DB[("💾 Repositorio<br/>Documental")]
    IDP["🔷 Proveedor<br/>de Identidad"]

    U -->|"1. Solicita acceso"| RUND
    RUND -->|"2. Valida identidad"| IDP
    IDP -->|"3. Token de sesión"| RUND
    RUND -->|"4. Respuesta"| U
    
    U -->|"5. Consulta/Gestiona datos"| RUND
    RUND <-->|"6. Lee/Escribe documentos"| DB
```

### 5.2 DFD Nivel 1 - Procesos Principales

```mermaid
flowchart TB
    subgraph Actores["👥 Actores"]
        U["👤 Usuario"]
    end

    subgraph Trust_Boundary["🔒 Límite de Confianza - Red ESAP"]
        subgraph Frontend["Capa de Presentación"]
            P1(("1.0<br/>Portal Web<br/>RUND-MGP"))
        end

        subgraph Auth["Capa de Autenticación"]
            P2(("2.0<br/>Autenticación<br/>RUND-AUTH"))
        end

        subgraph Backend["Capa de Negocio"]
            P3(("3.0<br/>API REST<br/>RUND-API"))
        end

        subgraph AI_Layer["Capa de IA (Experimental)"]
            P4(("4.0<br/>Procesamiento<br/>RUND-AI"))
            P5(("5.0<br/>OCR<br/>RUND-OCR"))
        end

        subgraph Storage["Capa de Datos"]
            DB1[("📁 OpenKM<br/>Documentos")]
            DB2[("🧠 ChromaDB<br/>Vectores")]
        end
    end

    subgraph External["☁️ Externos"]
        IDP["🔷 Microsoft<br/>Entra ID"]
    end

    %% Flujos de datos
    U -->|"F1: HTTP Request"| P1
    P1 -->|"F2: Auth Request"| P2
    P2 <-->|"F3: OAuth 2.0"| IDP
    P2 -->|"F4: JWT Token"| P1
    P1 -->|"F5: API Call + JWT"| P3
    P3 -->|"F6: CRUD Docs"| DB1
    P3 -->|"F7: Extract Request"| P4
    P4 -->|"F8: OCR Request"| P5
    P4 -->|"F9: Store Vectors"| DB2
    P3 -->|"F10: Response"| P1
    P1 -->|"F11: HTML/JSON"| U

    classDef proceso fill:#bbdefb,stroke:#1976d2,stroke-width:2px
    classDef storage fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    classDef externo fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px

    class P1,P2,P3,P4,P5 proceso
    class DB1,DB2 storage
    class IDP externo
```

### 5.3 Flujos de Datos Detallados

| ID | Origen | Destino | Datos | Protocolo | Autenticación | Cifrado |
|----|--------|---------|-------|-----------|---------------|---------|
| F1 | Usuario | RUND-MGP | Peticiones HTTP, credenciales | HTTP | No (pendiente) | No (pendiente) |
| F2 | RUND-MGP | RUND-AUTH | Solicitud de token | HTTP | No | No |
| F3 | RUND-AUTH | Entra ID | Credenciales Microsoft | HTTPS | OAuth 2.0 | TLS 1.3 |
| F4 | RUND-AUTH | RUND-MGP | JWT Token | HTTP | N/A | No |
| F5 | RUND-MGP | RUND-API | Datos profesor, archivos | HTTP | JWT (pendiente) | No |
| F6 | RUND-API | RUND-CORE | Documentos, metadatos | HTTP | Basic Auth | No |
| F7 | RUND-API | RUND-AI | Documentos para procesar | HTTP | No | No |
| F8 | RUND-AI | RUND-OCR | Imágenes/PDFs | HTTP | No | No |
| F9 | RUND-AI | ChromaDB | Vectores de embeddings | Internal | No | No |
| F10 | RUND-API | RUND-MGP | Respuestas JSON | HTTP | No | No |
| F11 | RUND-MGP | Usuario | HTML, JSON, archivos | HTTP | No | No |

---

## 6. Flujo de Autenticación

### 6.1 Estado Actual (Sin Autenticación Implementada)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuario
    participant MGP as 🖥️ RUND-MGP
    participant API as ⚙️ RUND-API
    participant CORE as 📁 RUND-CORE

    Note over U,CORE: ⚠️ ESTADO ACTUAL: Sin autenticación

    U->>MGP: Accede al portal
    MGP->>API: GET /api/v2/profesores/{cedula}
    Note right of API: AuthMiddleware.authenticate()<br/>return true; // ⚠️ Bypass
    API->>CORE: GET /OpenKM/...<br/>Authorization: Basic okmAdmin:admin
    Note right of CORE: ⚠️ Credenciales hardcoded
    CORE-->>API: Datos del profesor
    API-->>MGP: JSON Response
    MGP-->>U: Muestra información

    Note over U,CORE: ❌ Cualquier usuario puede acceder a cualquier dato
```

### 6.2 Flujo Planificado (Con RUND-AUTH Integrado)

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuario
    participant MGP as 🖥️ RUND-MGP
    participant AUTH as 🔑 RUND-AUTH
    participant ENTRA as 🔷 Microsoft Entra ID
    participant API as ⚙️ RUND-API
    participant CORE as 📁 RUND-CORE

    Note over U,CORE: ✅ FLUJO PLANIFICADO: OAuth 2.0 + JWT

    U->>MGP: 1. Accede al portal
    MGP->>AUTH: 2. Verificar sesión
    AUTH-->>MGP: 3. No hay sesión válida
    MGP->>U: 4. Redirige a login

    U->>AUTH: 5. Inicia login
    AUTH->>ENTRA: 6. Authorization Request
    ENTRA->>U: 7. Página de login Microsoft
    U->>ENTRA: 8. Credenciales corporativas
    ENTRA->>AUTH: 9. Authorization Code
    AUTH->>ENTRA: 10. Token Request
    ENTRA-->>AUTH: 11. ID Token + Access Token
    
    AUTH->>AUTH: 12. Genera JWT interno
    Note right of AUTH: JWT incluye:<br/>- sub (email)<br/>- roles<br/>- exp (expiración)<br/>- aud (rund-api)
    
    AUTH-->>MGP: 13. JWT Token
    MGP->>MGP: 14. Almacena token (memoria)
    MGP-->>U: 15. Sesión iniciada

    U->>MGP: 16. Solicita datos
    MGP->>API: 17. GET /api/v2/profesores/{cedula}<br/>Authorization: Bearer {JWT}
    
    API->>API: 18. Valida JWT
    Note right of API: Verifica:<br/>- Firma (RS256)<br/>- Expiración<br/>- Audiencia<br/>- Roles
    
    API->>CORE: 19. GET /OpenKM/...<br/>Authorization: Basic {env vars}
    CORE-->>API: 20. Datos
    API-->>MGP: 21. JSON Response
    MGP-->>U: 22. Muestra información

    Note over U,CORE: 🔄 Refresh Token cada 15 min
```

### 6.3 Estructura del JWT Planificado

```mermaid
flowchart LR
    subgraph JWT["🔐 JSON Web Token"]
        subgraph Header["Header"]
            H1["alg: RS256"]
            H2["typ: JWT"]
        end
        
        subgraph Payload["Payload"]
            P1["sub: usuario@esap.edu.co"]
            P2["name: Nombre Completo"]
            P3["roles: ['profesor', 'gestor']"]
            P4["cedula: 12345678"]
            P5["territorial: BOGOTA"]
            P6["iat: 1732712400"]
            P7["exp: 1732716000"]
            P8["aud: rund-api"]
            P9["iss: rund-auth"]
        end
        
        subgraph Signature["Signature"]
            S1["RS256(<br/>header + payload,<br/>private_key<br/>)"]
        end
    end
```

---

## 7. Matriz de Comunicaciones

### 7.1 Comunicaciones Internas (Red Docker)

| # | Origen | Destino | Puerto | Protocolo | Autenticación | Datos Transmitidos |
|---|--------|---------|--------|-----------|---------------|-------------------|
| 1 | rund-mgp | rund-api | 3000 | HTTP | JWT (pendiente) | Peticiones API, archivos |
| 2 | rund-mgp | rund-auth | 4100 | HTTP | N/A | Tokens, solicitudes auth |
| 3 | rund-api | rund-core | 8080 | HTTP | Basic Auth* | Documentos, metadatos |
| 4 | rund-api | rund-ai | 8001 | HTTP | No | Documentos para IA |
| 5 | rund-api | rund-ocr | 8000 | HTTP | No | Imágenes, PDFs |
| 6 | rund-api | rund-ollama | 11434 | HTTP | No | Prompts LLM |
| 7 | rund-ai | rund-ollama | 11434 | HTTP | No | Inferencia LLM |
| 8 | rund-ai | rund-ocr | 8000 | HTTP | No | Pipeline OCR |
| 9 | rund-ai | rund-api | 3000 | HTTP | No | Upload resultados |

*Credenciales actualmente hardcoded (a migrar a variables de entorno)

### 7.2 Comunicaciones Externas

| # | Origen | Destino | Puerto | Protocolo | Autenticación | Propósito |
|---|--------|---------|--------|-----------|---------------|-----------|
| 1 | Usuario | 172.16.234.52 | 4000 | HTTP | N/A (pendiente) | Acceso frontend |
| 2 | Usuario | 172.16.234.52 | 3000 | HTTP | N/A (pendiente) | API directa |
| 3 | rund-auth | login.microsoftonline.com | 443 | HTTPS | OAuth 2.0 | Autenticación |

### 7.3 Diagrama de Matriz de Comunicaciones

```mermaid
flowchart TB
    subgraph Legend["📋 Leyenda"]
        L1["🟢 Autenticado"]
        L2["🟡 Auth Pendiente"]
        L3["🔴 Sin Auth"]
    end

    subgraph Matrix["📊 Matriz de Comunicaciones"]
        MGP["rund-mgp<br/>:4000"]
        AUTH["rund-auth<br/>:4100"]
        API["rund-api<br/>:3000"]
        CORE["rund-core<br/>:8080"]
        AI["rund-ai<br/>:8001"]
        OCR["rund-ocr<br/>:8000"]
        OLLAMA["rund-ollama<br/>:11434"]
    end

    MGP -->|"🟡 JWT pendiente"| API
    MGP -->|"🟢 OAuth flow"| AUTH
    API -->|"🟢 Basic Auth*"| CORE
    API -->|"🔴 Sin auth"| AI
    API -->|"🔴 Sin auth"| OCR
    API -->|"🔴 Sin auth"| OLLAMA
    AI -->|"🔴 Sin auth"| OLLAMA
    AI -->|"🔴 Sin auth"| OCR
    AI -->|"🔴 Sin auth"| API

    classDef green fill:#c8e6c9,stroke:#2e7d32
    classDef yellow fill:#fff9c4,stroke:#f9a825
    classDef red fill:#ffcdd2,stroke:#c62828

    class AUTH green
    class MGP,CORE yellow
    class AI,OCR,OLLAMA red
```

---

## 8. Inventario de Componentes

### 8.1 Componentes Funcionales

| Componente | Versión | Tecnología | Puerto | Imagen Docker | RAM | CPU |
|------------|---------|------------|--------|---------------|-----|-----|
| **RUND-CORE** | CE 6.3.x | OpenKM (Java/Tomcat) | 8080 | openkm/openkm-ce:latest | 2-3 GB | Bajo |
| **RUND-API** | 3.0 | PHP 8.3 + Apache | 3000 | ocastelblanco/rund-api:latest | 512 MB | Medio |
| **RUND-MGP** | 3.0 | Angular 20 + SSR | 4000 | ocastelblanco/rund-mgp:latest | 512 MB | Bajo |
| **RUND-AUTH** | 1.0 | Node.js 22 + Express | 4100 | En desarrollo | 256 MB | Bajo |

### 8.2 Componentes Experimentales

| Componente | Versión | Tecnología | Puerto | Imagen Docker | RAM | CPU |
|------------|---------|------------|--------|---------------|-----|-----|
| **RUND-AI** | 1.0 | Python 3.9 + Flask | 8001 | ocastelblanco/rund-ai:latest | 2 GB | Medio |
| **RUND-OCR** | 1.0 | Python 3.9 + PaddleOCR | 8000 | ocastelblanco/rund-ocr:latest | 1-2 GB | Alto |
| **RUND-OLLAMA** | Latest | Ollama Engine | 11434 | ollama/ollama:latest | 4-6 GB | Alto |

### 8.3 Volúmenes de Datos

| Volumen | Componente | Propósito | Tamaño Est. | Sensibilidad |
|---------|------------|-----------|-------------|--------------|
| openkm-data | RUND-CORE | Documentos y BD | 10-50 GB | **Alta** |
| ollama-data | RUND-OLLAMA | Modelos LLM | 6 GB | Baja |
| ai-models | RUND-AI | Embeddings | 500 MB | Baja |
| ai-cache | RUND-AI | ChromaDB | 1-2 GB | Media |
| ocr-temp | RUND-OCR | Temporales | 1 GB | Media |

---

## 9. Consideraciones de Seguridad

### 9.1 Estado Actual vs. Planificado

| Aspecto | Estado Actual | Estado Planificado | Prioridad |
|---------|---------------|-------------------|-----------|
| Autenticación usuarios | ❌ Sin implementar | ✅ OAuth 2.0 + JWT | **Crítica** |
| Autorización (RBAC) | ❌ Sin implementar | ✅ Roles en JWT | **Crítica** |
| Credenciales OpenKM | ⚠️ Hardcoded | ✅ Variables de entorno | **Crítica** |
| CORS | ⚠️ Abierto (*) | ✅ Lista blanca | **Alta** |
| TLS/HTTPS | ❌ HTTP plano | ✅ TLS en producción | **Alta** |
| Rate Limiting | ❌ Sin implementar | ✅ Por IP/usuario | Media |
| Headers de seguridad | ❌ Ausentes | ✅ CSP, HSTS, etc. | Media |
| Logging de auditoría | ⚠️ Básico | ✅ Completo con alertas | Media |

### 9.2 Vulnerabilidades Conocidas (Ambiente UAT)

| ID | Descripción | Severidad | Mitigación Planificada |
|----|-------------|-----------|------------------------|
| V1 | Credenciales OpenKM hardcoded | **Crítica** | Migrar a env vars |
| V2 | Sin autenticación en API | **Crítica** | Integrar RUND-AUTH |
| V3 | CORS permisivo | **Crítica** | Configurar whitelist |
| V4 | Servicios AI/OCR expuestos | **Alta** | Remover puertos públicos |
| V5 | Comunicación HTTP plano | **Alta** | Implementar TLS |

### 9.3 Notas para la Oficial de Seguridad

1. **Ambiente documentado:** Este documento refleja el ambiente UAT, no producción.
2. **Autenticación pendiente:** La integración con Microsoft Entra ID está pendiente de recibir credenciales de aplicación por parte de OTIC.
3. **Vulnerabilidades conocidas:** Las fallas V1 y V3 son temporales y serán corregidas antes del paso a producción.
4. **Componentes experimentales:** RUND-AI, RUND-OCR y RUND-OLLAMA no están destinados a producción en esta fase.
5. **Acceso restringido:** El servidor UAT solo es accesible desde la red interna de la ESAP o vía VPN.

---

## 10. Anexos

### Anexo A: Endpoints Críticos

| Endpoint | Método | Datos Sensibles | Nivel de Riesgo |
|----------|--------|-----------------|-----------------|
| `/api/v2/profesores/{cedula}` | GET | PII completo | **Crítico** |
| `/api/v2/profesores/{cedula}/archivos` | GET | Documentos privados | **Crítico** |
| `/api/v2/certificados/generar` | POST | Datos para certificados | **Alto** |
| `/api/v2/archivos/subir` | POST | Documentos | **Alto** |
| `/api/v2/archivos/{uuid}` | DELETE | N/A (destrucción) | **Crítico** |

### Anexo B: Variables de Entorno Requeridas

```bash
# RUND-API (a implementar)
OPENKM_HOST=rund-core
OPENKM_PORT=8080
OPENKM_USER=<rotativo>
OPENKM_PASS=<rotativo>
CORS_ALLOWED_ORIGINS=http://172.16.234.52:4000

# RUND-AUTH (a implementar)
AZURE_TENANT_ID=<pendiente-otic>
AZURE_CLIENT_ID=<pendiente-otic>
AZURE_CLIENT_SECRET=<pendiente-otic>
JWT_PRIVATE_KEY_PATH=/keys/private.pem
JWT_PUBLIC_KEY_PATH=/keys/public.pem
JWT_EXPIRATION=3600
```

### Anexo C: Checklist de Seguridad Pre-Producción

- [ ] Credenciales de OpenKM en variables de entorno
- [ ] RUND-AUTH integrado con Entra ID
- [ ] CORS configurado con whitelist
- [ ] Puertos de AI/OCR/Ollama no expuestos
- [ ] TLS/HTTPS habilitado
- [ ] Rate limiting implementado
- [ ] Headers de seguridad configurados
- [ ] Logging de auditoría completo
- [ ] Pruebas de penetración básicas realizadas

---

**Documento preparado por:**  
Dirección de Entornos y Servicios Virtuales (DESV)  
Escuela Superior de Administración Pública  

**Contacto técnico:**  
ocastelblanco@esap.edu.co

---

*Este documento contiene información confidencial de la ESAP. Su distribución está restringida al personal autorizado.*
