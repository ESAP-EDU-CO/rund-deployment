# Fase de Pruebas de Aceptación de Usuario (UAT)
## Sistema RUND — Registro Único Nacional Docente
### Documento Introductorio · Versión 1.0

---

**Institución:** Escuela Superior de Administración Pública — ESAP  
**Dependencia responsable:** Dirección de Entornos y Servicios Virtuales — DESV  
**Dirigido a:** Grupo de Gestión Profesoral — GGP  
**Fecha de emisión:** 27 de febrero de 2026  
**Estado:** Activo — Fase de ejecución  

---

## 1. Introducción

La Dirección de Entornos y Servicios Virtuales (DESV) de la Escuela Superior de Administración Pública (ESAP) presenta el presente documento como punto de partida formal para la **Fase de Pruebas de Aceptación de Usuario (UAT, por sus siglas en inglés: *User Acceptance Testing*)** del sistema **RUND — Registro Único Nacional Docente**.

Esta fase representa un hito estratégico en el ciclo de vida del sistema: es el momento en que el software, luego de un riguroso proceso de desarrollo y mejora continua, es validado directamente por los actores institucionales que lo operarán. No se trata únicamente de una verificación técnica, sino de un ejercicio de apropiación institucional que garantiza que el sistema responde con fidelidad a la realidad operativa del profesorado de la ESAP.

La ejecución de estas pruebas se lleva a cabo con el **Grupo de Gestión Profesoral (GGP)** en su rol de usuarios validadores, usuarios con acceso de gestión y administración sobre el sistema. Los resultados de esta fase constituirán la evidencia formal que respaldará las solicitudes de despliegue del sistema en el entorno de producción institucional.

---

## 2. Antecedentes y Contexto

El sistema RUND ha sido desarrollado de forma progresiva desde julio de 2024 por el equipo de la DESV, conformado por el Desarrollador Senior Oliver Castelblanco Martínez y el Desarrollador Junior Duván Pedroza. El sistema nació como respuesta a la necesidad de digitalizar, centralizar y automatizar los procesos de gestión docente de la ESAP, los cuales abarcaban desde el registro y gestión documental de los profesores hasta la planeación y aprobación de sus actividades académicas.

A lo largo de su desarrollo, el sistema ha atravesado múltiples fases de refinamiento técnico y funcional, incluyendo:

- Refactorización completa de la API bajo estándares **PSR-4** y **PSR-12** (PHP 8.3).
- Actualización del frontend a **Angular 21.1.5 con SSR**, con cobertura de pruebas unitarias que supera el **97%** en los módulos core.
- Implementación de arquitectura de microservicios en contenedores Docker.
- Integración con **OpenKM** como sistema de gestión documental institucional.
- Diseño e implementación de un sistema de autenticación modular (RUND-AUTH).

El sistema se encuentra actualmente desplegado en un entorno de tipo *sandbox* sobre la infraestructura de la ESAP, accesible a través de la red local institucional o mediante VPN, en la dirección `http://172.16.234.52/`. Este entorno reúne todas las condiciones necesarias para ejecutar una fase UAT completa, representativa y documentada.

---

## 3. Objetivos

### 3.1 Objetivo General

Validar de forma sistemática, completa y documentada el comportamiento funcional y la experiencia de usuario del sistema RUND en todos sus componentes activos, mediante la participación directa del Grupo de Gestión Profesoral en un entorno controlado, con el fin de certificar su aptitud para el despliegue en producción.

### 3.2 Objetivos Específicos

**OE-01 — Cobertura funcional:** Verificar que la totalidad de los requisitos funcionales definidos en las especificaciones del sistema sea ejecutada y validada por usuarios del perfil Gestor/Administrador, con trazabilidad completa de resultados.

**OE-02 — Detección y registro de desviaciones:** Identificar, clasificar y registrar formalmente cualquier comportamiento del sistema que no se ajuste a las especificaciones funcionales o a las expectativas razonables del usuario, de acuerdo con los protocolos de gestión de defectos establecidos.

**OE-03 — Validación de integraciones:** Confirmar el correcto funcionamiento de las integraciones entre los componentes del ecosistema RUND, particularmente entre el frontend (RUND-MGP), la API (RUND-API), el módulo de autenticación (RUND-AUTH) y el gestor documental (RUND-CORE / OpenKM).

**OE-04 — Evaluación de usabilidad:** Recoger información cualitativa sobre la experiencia de usuario, la claridad de los flujos de trabajo y la idoneidad de la interfaz para las tareas propias del perfil Gestor/Administrador.

**OE-05 — Generación de evidencia formal:** Producir un conjunto de evidencias documentales —incluyendo registros de ejecución de casos de prueba, reportes de defectos y actas de sesión— que soporten formalmente la solicitud de despliegue del sistema ante las instancias correspondientes.

---

## 4. Alcance

### 4.1 Componentes en Prueba

La presente fase UAT abarca los siguientes componentes del ecosistema RUND, todos bajo responsabilidad directa de la DESV:

| Componente | Descripción | Tecnología | URL en entorno UAT |
|---|---|---|---|
| **RUND-MGP** | Frontend del sistema — interfaz de usuario | Angular 21.1.5 SSR | `http://172.16.234.52:4000/` |
| **RUND-API** | Backend y lógica de negocio — API REST v2 | PHP 8.3 / PSR-4 | `http://172.16.234.52:3000/api/v2/` |
| **RUND-AUTH** | Módulo de autenticación y control de acceso | Node.js / JWT | `http://172.16.234.52:8081/` |
| **RUND-CORE** | Gestión documental — OpenKM | Java / OpenKM 6.x | `http://172.16.234.52:8080/OpenKM` |

### 4.2 Perfil de Usuarios Participantes

Las pruebas UAT de esta fase serán ejecutadas por **usuarios del perfil Gestor y Administrador** del sistema, los cuales tienen acceso al conjunto más amplio de funcionalidades. Este perfil es el más representativo para efectos de validación, ya que su rol engloba las responsabilidades de configuración, supervisión y administración del sistema.

Las funcionalidades validadas en esta fase incluyen, entre otras:

- Gestión de períodos académicos (apertura, configuración y cierre).
- Administración de catálogos (tipos de actividad, CETAPs, territoriales, cargos, categorías).
- Gestión de usuarios y asignación de roles.
- Gestión de novedades administrativas.
- Supervisión del estado general de los Planes de Trabajo Académico (PTAs).
- Generación de reportes y dashboards ejecutivos.
- Administración y consulta del repositorio documental (RUND-CORE / OpenKM).
- Auditoría y trazabilidad de acciones en el sistema.

### 4.3 Fuera del Alcance

Las siguientes funcionalidades **no** serán objeto de validación en esta fase, ya sea porque requieren perfiles de usuario adicionales o porque se encuentran condicionadas a integraciones pendientes:

- Integración con Microsoft 365 / Microsoft Entra ID (pendiente de habilitación por parte de OTIC).
- Funcionalidades de los módulos experimentales RUND-AI y RUND-OCR.

---

## 5. Entorno de Pruebas

### 5.1 Descripción del Entorno

El entorno UAT corresponde a una instancia de tipo *sandbox* desplegada sobre la infraestructura de la ESAP. Se trata de un ambiente de integración completa, donde todos los componentes del ecosistema RUND operan de forma coordinada, con datos de prueba representativos de la realidad operativa de la institución.

**Acceso al entorno:** El entorno es accesible exclusivamente a través de la red local de la ESAP o mediante conexión VPN institucional, lo que garantiza un canal seguro y controlado para la ejecución de las pruebas.

| Parámetro | Valor |
|---|---|
| **URL principal (RUND-MGP)** | `http://172.16.234.52:4000/` |
| **Tipo de entorno** | Sandbox / UAT |
| **Acceso** | Red local ESAP o VPN institucional |
| **Estado del entorno** | Operativo y disponible |

### 5.2 Condiciones Técnicas Conocidas

En aras de la transparencia técnica y con el propósito de contextualizar adecuadamente los resultados de las pruebas, se declaran las siguientes condiciones del entorno UAT que serán atendidas previamente al despliegue en producción:

- Las credenciales de acceso a OpenKM (RUND-CORE) están configuradas con valores fijos para el entorno de pruebas. Este ajuste será parametrizado correctamente antes de la salida a producción.
- La política de CORS se encuentra en configuración permisiva para facilitar las pruebas de integración. Será restringida al dominio de producción antes del despliegue definitivo.
- La integración OAuth 2.0 con Microsoft Entra ID está planificada pero pendiente de habilitación, por lo que la autenticación en el entorno UAT opera bajo mecanismo JWT local.

Ninguna de estas condiciones afecta la validez de las pruebas funcionales que se ejecutarán en esta fase.

---

## 6. Herramientas del Proceso UAT

### 6.1 Herramientas de Planificación y Documentación

| Herramienta | Propósito |
|---|---|
| **Documentos de especificaciones funcionales RUND** | Fuente de referencia para los casos de prueba |
| **Matriz de Trazabilidad de Requisitos (RTM)** | Vinculación entre requisitos, casos de prueba y resultados |
| **Fichas de casos de prueba (TC)** | Descripción estructurada de cada escenario a validar |
| **Registro de defectos** | Reporte formal de desviaciones identificadas durante las pruebas |
| **Actas de sesión UAT** | Registro firmado de cada jornada de pruebas |

### 6.2 Herramientas de Ejecución y Validación Técnica

| Herramienta | Propósito | Uso |
|---|---|---|
| **Navegador web (Chrome / Edge)** | Ejecución de pruebas sobre RUND-MGP | Acceso a `http://172.16.234.52:4000/` desde la red ESAP o VPN |
| **Swagger UI (RUND-API)** | Validación directa de endpoints de la API | `http://172.16.234.52:3000/api/v2/system/swagger-ui` |
| **OpenKM Web Client** | Validación del repositorio documental | `http://172.16.234.52:8080/OpenKM` |
| **Postman / Bruno** | Pruebas de contrato de la API REST v2 | Colección de endpoints RUND-API v2 |
| **DevTools (F12)** | Observación de respuestas HTTP y comportamiento del cliente | Uso complementario durante las sesiones |

### 6.3 Herramientas de Registro de Evidencias

| Herramienta | Propósito |
|---|---|
| **Capturas de pantalla** | Evidencia visual de comportamientos observados |
| **Grabación de pantalla** | Evidencia de flujos completos (opcional, sesiones críticas) |
| **Formularios de reporte de defectos** | Registro estructurado conforme al formato TDFO |
| **Hojas de cálculo de resultados** | Consolidación de resultados por módulo y caso de prueba |

---

## 7. Metodología de Pruebas

### 7.1 Tipos de Pruebas a Ejecutar

**Pruebas funcionales:** Verificación de que cada funcionalidad del sistema cumple con los requisitos definidos. Se ejecutarán siguiendo los casos de prueba documentados, cubriendo flujos exitosos (*happy path*) y flujos alternativos y de error.

**Pruebas de integración de componentes:** Validación del correcto intercambio de datos entre RUND-MGP, RUND-API, RUND-AUTH y RUND-CORE, verificando que las integraciones producen los resultados esperados de extremo a extremo.

**Pruebas de usabilidad:** Evaluación cualitativa de la experiencia de usuario, orientada a identificar puntos de fricción, inconsistencias en la interfaz o flujos que puedan mejorarse antes del despliegue en producción.

**Pruebas de regresión básica:** Verificación de que las mejoras implementadas en el último ciclo de desarrollo no han introducido regresiones en funcionalidades previamente validadas.

### 7.2 Estructura de los Casos de Prueba

Cada caso de prueba seguirá la siguiente estructura estandarizada:

| Campo | Descripción |
|---|---|
| **ID** | Identificador único (ej. TC-MGP-001) |
| **Módulo** | Componente RUND al que pertenece |
| **Requisito relacionado** | Referencia al requisito funcional validado |
| **Descripción** | Descripción del escenario de prueba |
| **Precondiciones** | Condiciones requeridas antes de ejecutar la prueba |
| **Pasos de ejecución** | Secuencia detallada de acciones a realizar |
| **Resultado esperado** | Comportamiento correcto del sistema |
| **Resultado obtenido** | Comportamiento real observado |
| **Estado** | Aprobado / Fallido / Bloqueado / No ejecutado |
| **Evidencias** | Capturas u otros registros adjuntos |

### 7.3 Clasificación de Defectos

Los defectos identificados serán clasificados conforme a los siguientes niveles de severidad:

| Nivel | Criterio | Acción requerida |
|---|---|---|
| **Crítico** | El sistema no puede operar; funcionalidad principal bloqueada | Corrección inmediata antes de continuar |
| **Alto** | Funcionalidad importante no opera correctamente, sin alternativa | Corrección prioritaria antes del despliegue |
| **Medio** | Funcionalidad opera con limitaciones o inconsistencias | Corrección antes del despliegue |
| **Bajo** | Aspectos menores de usabilidad o presentación | Corrección planificada en próxima iteración |

---

## 8. Criterios de Éxito y Aceptación

La fase UAT se considerará exitosa cuando se cumplan los siguientes criterios:

- El **95% o más** de los casos de prueba ejecutados obtengan el estado **Aprobado**.
- La totalidad de los defectos clasificados como **Crítico** o **Alto** hayan sido corregidos y re-validados.
- Todos los flujos de trabajo del perfil Gestor/Administrador hayan sido ejecutados y validados sin bloqueos.
- Las integraciones entre los cuatro componentes del ecosistema RUND operen de forma consistente durante la totalidad de las sesiones.
- Se cuente con un registro completo de evidencias que permita generar el **Acta de Aceptación UAT**.

---

## 9. Plan de Comunicación y Entregables

### 9.1 Entregables del Proceso UAT

| Entregable | Descripción | Destinatario |
|---|---|---|
| **Matriz de Trazabilidad de Requisitos** | Vinculación requisitos ↔ casos de prueba ↔ resultados | GGP / DESV |
| **Casos de prueba por módulo** | Fichas detalladas de cada escenario | GGP / DESV |
| **Reporte de defectos** | Registro formal de desviaciones identificadas | DESV / OTIC |
| **Actas de sesión UAT** | Registro firmado de cada jornada de pruebas | GGP / DESV |
| **Informe consolidado de resultados** | Documento ejecutivo con métricas y conclusiones | GGP / OTIC / Dirección ESAP |
| **Acta de Aceptación UAT** | Documento formal de validación y aceptación del sistema | Todos los actores |

### 9.2 Canales de Comunicación

Durante la ejecución de la fase UAT, la comunicación entre el equipo DESV y el GGP se realizará a través de los canales institucionales habituales. Cualquier defecto identificado durante las sesiones será registrado en el formato correspondiente y comunicado al equipo de desarrollo para su análisis y atención.

---

## 10. Equipo Responsable

| Rol | Nombre | Dependencia |
|---|---|---|
| **Líder técnico UAT / Coordinador** | Oliver Castelblanco Martínez | DESV — ESAP |
| **Desarrollador de apoyo** | Duván Pedroza | DESV — ESAP |
| **Usuarios validadores** | Grupo de Gestión Profesoral (GGP) | ESAP |

---

## 11. Consideraciones Finales

La presente fase UAT es el resultado de un proceso de desarrollo riguroso, orientado a la calidad y alineado con los lineamientos del **Modelo Estándar de Control Interno (MECI)** y las políticas de aseguramiento de calidad del software en el sector público colombiano. El sistema RUND, en su estado actual, ha superado todas las etapas de pruebas internas previas, incluyendo pruebas unitarias con cobertura superior al 97%, pruebas de integración de componentes y revisiones de seguridad.

La participación activa y comprometida del Grupo de Gestión Profesoral en esta etapa es fundamental. Su conocimiento profundo de los procesos de gestión profesoral de la ESAP es, precisamente, el criterio de validación más valioso e irremplazable que puede recibir el sistema. Los resultados de esta fase no solo confirmarán la aptitud técnica del sistema para su despliegue en producción, sino que también reflejarán el esfuerzo conjunto de la DESV y el GGP por dotar a la institución de una herramienta robusta, eficiente y verdaderamente útil para la gestión del profesorado.

El equipo de la DESV se pone a disposición del GGP para atender cualquier consulta, facilitar el acceso al entorno de pruebas o proporcionar el acompañamiento técnico que sea necesario durante el desarrollo de esta fase.

---

*Documento elaborado por la Dirección de Entornos y Servicios Virtuales — DESV*  
*Escuela Superior de Administración Pública — ESAP*  
*Bogotá D.C., febrero de 2026*
