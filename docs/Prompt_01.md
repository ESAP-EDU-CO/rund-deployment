El sistema RUND (Registro Único Nacional Docente) tiene, en este momento, siete componentes:

1. RUND-CORE: un servicio basado en OpenKM, para gestionar los documentos de los profesores y profesoras de la ESAP. Actualmente es un contenedor Docker a partir de la imagen pública https://hub.docker.com/r/openkm/openkm-ce
2. RUND-API: una API basada en PHP 8.3, que sirve de middleware entre los diferentes front-end del RUND con RUND-CORE; gestiona peticiones, devuelve documentos o información sobre documentos, genera informes y reportes en Excel, Word o PDF.
3. RUND-MGP: un front-end basado en Angular 20 SSR, dirigido al Grupo de Gestión Profesoral, GGP, de la Subdirección Nacional de Servicios Académicos, que gestiona la carga de documentación profesoral al RUND, así como la generación y validación de diversos certificados referentes a la evaluación y clasificación docente.
4. RUND-AI: módulo experimental, basado en Ollama con el LLM NuExtract (https://ollama.com/library/nuextract), que prestará servicios de extracción de información de documentos.
5. RUND-OCR: módulo experimental, basado en PaddleOCR (https://github.com/PaddlePaddle/PaddleOCR), que prestará servicios de reconocimiento óptico de caracteres para documentos digitalizados.
6. RUND-AUTH: un módulo (en desarrollo), que permitirá la autenticación de todo el sistema contra Microsoft Entra ID.
7. RUND-PTA: un frontend basado en Angular 20 SSR, dirigido al GGP, para gestionar los Planes de Trabajo Académico de los profesores de carrera de la ESAP.

El proyecto inició con el desarrollo de los primeros 5 componentes, y la documentación correspondiente a esa etapa es:
* TDFO016 RUND.xlsx y TDFO029 RUND.xlsx, documentos técnicos exigidos por la OTIC para el montaje de los contenedores iniciales en un servidor de prueba.
* CLAUDE_RUND.md y README_RUND.md, documentos para Claude Code con algunas especificaciones sobre la orquestación general Docker.
* README_API.md, documento creado luego de la refactorización total del componente.
* Cronograma_RUNDMGP_2025.xlsx, con el cronograma de desarrollo propuesto para el componente RUND-MGP.

Posteriormente, iniciaron los otros dos proyectos: RUND-AUTH y RUND-PTA. Para el segundo caso, la documentación técnica creada es:
* README_PTA.md
* RUND-PTA-roadmap.md
* RUND-PTA-02-arquitectura-tecnica.md
* RUND-PTA-01-especificaciones-funcionales.md
* PlanDeTrabajo_RUND-PTA.md

Necesito crear un documento (un resumen ejecutivo de 2 a 3 hojas, máximo) dirigido a la Jefa de la OTIC (Oficina de Tecnologías de la Información y la Comunicación) en el que deje claro el proceso que hemos llevado a cabo desde julio de 2024 hasta octubre de este año (con una pausa contractual desde mediados de diciembre de 2024 a mediados de febrero de 2025, soy contratista de la ESAP) con el RUND.

El documento debe dejar entrever las siguientes ideas:
1. El proyecto tiene un alcance importante y, por lo mismo, es de gran magnitud.
2. Solo somos dos desarrolladores a cargo de todo el proyecto, lo que ha requerido un gran esfuerzo.
3. Necesitamos más tiempo para poder completar las etapas y, sobre todo, para poder presentar prototipos funcionales y de producción completos y seguros.

La documentación técnica del componente RUND-PTA se encuentra en una ubicación especial, así que me gustaría que incluyeras el vínculo (puede ser _mock_, yo me encargo de reemplazarlo luego con los _links_ correctos) en el documento, como un anexo.