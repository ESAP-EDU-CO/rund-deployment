# Refinación de datos Cédula de ciudadanía
## Problema
Luego de realizar el flujo de extracción, la información que se obtuvo de las cédulas de ciudadanía no es correcta. Parece que el diseño de la Cédula de ciudadanía colombiana tiene ciertos elementos que limitan la capacidad de lectura OCR de los datos

## Instrucciones
Quiero que pruebes con los siguientes documentos, que deberían generar los siguientes datos:

|Archivo|Número de cédula|Nombres|Apellidos|
|-------|----------------|-------|---------|
|1996_1_CEDULA_CIUDADANÍA.pdf|71776491|GUSTAVO ADOLFO|MUÑOZ GAVIRIA|
|1998_1_CEDULA_DE_CIUDADANIA.pdf|71799891|HERWIN EDUARDO|CARDONA QUITIAN|
|1999_1_CEDULA.pdf|10292684|OSCAR EDUARDO|VALENCIA MESA|
|1995_1_CEDULA.pdf|33333865|SILVIA MARGARITA|BALDIRIS NAVARRO|

**NOTA 1:** La cédula del último caso es un ejemplo de un nuevo formato de cédula.
**NOTA 2:** Todos los documentos ejemplo están en la carpeta `./pruebas`.

### Registro de resultados
Registra los resultados en una tabla, en un documento markdown llamado `./pruebas/resultados_extraccion_cedula-2025-10-06.md`, en una tabla como la siguiente:

|Archivo|Número cedula|Payload OCR|Respuesta OCR|Payload AI|Respuesta AI|Payload Ollama|Respuesta Ollama|Observaciones|
|-------|-------------|-----------|-------------|----------|------------|--------------|----------------|-------------| 

## Propuestas de mejora
En el mismo documento `./pruebas/resultados_extraccion_cedula-2025-10-06.md` indícame de qué manera podemos mejorar las respuestas del proceso de extracción.