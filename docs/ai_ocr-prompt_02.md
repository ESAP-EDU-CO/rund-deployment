# Preguntas Clave
## Casos de uso de IA específicos: ¿Qué funcionalidades de IA necesitas exactamente?
### ¿Resumen automático de documentos?
- Si
### ¿Clasificación/categorización automática?
- Si
### ¿Extracción de entidades (nombres, fechas, números de radicado)?
- Si
### ¿Búsqueda semántica en los documentos?
- Si, aunque no sería crítico al inicio.
### ¿Generación de respuestas sobre el contenido?
- No, por lo menos inicialmente.
### ¿Otros?
- Determinación de tendencias en la información y otros procesos complejos sobre la información ya extraída; algo cercano al "minado de datos".
---
## Tipo de documentos: ¿Qué tipo de documentos procesarás principalmente?
### Formatos oficiales colombianos (radicados, oficios, actas)
- Si, básicamente documentos de identidad (cédulas de ciudadanía) de los profesores y resoluciones (actas y oficios) de la ESAP.
### Contratos, facturas
- No, por lo menos inicialmente.
### Documentos escaneados vs digitales
- En general no espero que se requiera: no habría duplicidad de información entre escaneados y digitales.
### Idioma: ¿solo español o también inglés?
- Principalmente en español, pero también en inglés.
### Otros tipos de documentos
- Inicialmente el RUND se plantea para el almacenamiento de la documentación que conforma la hoja de vida profesoral de, al menos, 300 docentes. Esta hoja de vida está conformada, generalmente, de:
  - Documentos de identidad.
  - Resoluciones, actas y oficios sobre nombramiento, clasificación y evaluación docente.
  - Certificados laborales, expedidos por entidades públicas y privadas, nacionales o internacionales.
  - Certificados académicos, expedidos por entidades educativas públicas y privadas, nacionales o internacionales.
  - Certificados de docencia, expedidos por entidades educativas públicas y privadas, nacionales o internacionales.
  - Evidencias de procesos investigativos, tales como artículos, _papers_, capítulos de libros, etc. Publicados en español o inglés.
  - Certificados de idiomas.
---
## Volumen y latencia:
### ¿Cuántos documentos procesarás al día/mes?
- Planteo dos etapas principales en el uso del sistema:
  - **Carga inicial:** podrán ser unos 40 documentos por cada uno de los 300 profesores; dicha carga se hará durante el primer mes de producción del sistema. Se usará, principalmente, el OCR para extraer la información de la documentación escaneada y el AI para la validación de la información: que los nombres coincidan, que los números de cédula correspondan, que los documentos que se cargan como de una categoría (cerficiado laboral, por ejemplo) correspondan efectivamente a esa categoría.
  - **Procesamiento posterior:** luego de la carga inicial, se solicitarán requerimientos de extracción, clasificación y validación general de la documentación almacenada; el sistema puede funcionar en un segundo plano, con procesos automatizados.
### ¿Es aceptable que OCR tarde 30-60 segundos por documento?
- Si.
### ¿Es aceptable que el AI tarde 10-20 segundos en generar respuestas?
- Si.
## Prioridad de funcionalidades: ¿Qué es más crítico para el inicio?
- Un sistema con respuestas rápidas y efectivas, para una demostración funcional lo antes posible.
---
## Pregunta adicional
¿Crees que es necesario plantear un proceso de entrenamiento de alguno de los modelos que se proponen? Entrenamiento en la documentación básica (todas las cédulas de ciudadanía son iguales) o algo similar.