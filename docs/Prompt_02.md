# Preguntas Aclaratorias

## Sobre el destinatario y tono:

* ¿Cuál es el nivel de conocimiento técnico de la Jefa de OTIC? ¿Debemos usar un lenguaje más técnico o más ejecutivo?
  * Debemos usar un lenguaje ejecutivo, pero sin miedo a incluir términos técnicos.
* ¿Cuál es la relación actual con OTIC? ¿Han sido colaborativos o ha habido fricciones?
  * Han habido fricciones con algunos miembros de la OTIC, por falta de respuesta de ellos. Nosotros pertenecemos a una dirección de la ESAP llamada Dirección de Entornos y Servicios Virtuales, DESV, y sentimos que la OTIC quiere "quitarnos" nuestros proyectos. Por eso, con este documento (y algunos otros) queremos justificar nuestra idoneidad frente a la Jefa de la OTIC y, de paso, crear un ambiente favorable para que respondan más rápidamente a nuestros requerimientos.

## Sobre logros y métricas:

* ¿Cuántos endpoints tiene actualmente RUND-API? (mencionas 27 en README_API.md, ¿es correcto?)
  * Si, actualmente tiene 27 pero, como verás en la documentación correspondiente a RUND-MGP, crearemos algunos más.
* ¿Cuántos profesores están actualmente usando o van a usar el sistema? (mencionas ~256 profesores en PTA)
  * Si, son 256 profesores en este momento, pero esa cifra puede ampliarse hasta unos ~300.
* ¿Hay alguna métrica de líneas de código, componentes desarrollados, o horas invertidas que podamos incluir?
  * No, no tenemos ninguna métrica; seguramente debimos incluirlas desde el principio, pero no lo hicimos. Como verás, solo RUND-PTA ha tenido una documentación técnica juiciosa, precisamente por esto.


## Sobre solicitudes específicas:

* ¿Qué extensión de tiempo específica necesitas solicitar? ¿Semanas, meses?
  * No queremos extensión de tiempo, sino que se consideren los tiempos propuestos en los planes de trabajo de RUND-PTA y RUND-AUTH (acabo de añadir un documento adicional a la biblioteca de documentos, Plan_de_Trabajo_RUND-AUTH_ESAP.pdf), que son los proyectos más detallados en ese sentido.
* ¿Hay fechas límite críticas que debamos mencionar o evitar?
  * Solo hay que tener en cuenta que tendremos un paro contractual entre el 17 de diciembre de 2025 y el 15 de enero de 2026 (si nos vuelven a contratar, finalmente).
* ¿Necesitas solicitar algo adicional además de tiempo? (¿más desarrolladores, infraestructura, recursos?)
  * Nos gustaría, es deseable que nos asignen un servidor de pruebas (que luego se vuelva de producción) más robusto para poder experimentar con los módulos de IA y extracción de datos que proponemos: RUND-AI y RUND-OCR.


## Sobre el contexto institucional:

* ¿Hay algún hito o logro reciente que debamos destacar para demostrar avance tangible?
  * RUND-MGP, RUND-API y RUND-CORE están en funcionamiento en este momento en un servidor de pruebas, con acceso altamente limitado, en http://172.16.234.52. Pero solo RUND-MGP (en el puerto 4000) es visible para los usuarios y, tal vez por eso mismo, pareciera que nuestro trabajo es menor, porque el _backend_ no es visible y no es mostrable para personas que no tengan el alcance técnico.
* ¿Existe algún compromiso previo con GGP o directivas que debamos mencionar?
  * Nuestro compromiso, como verás en los Planes de trabajo, es tener versiones de prueba a inicios de diciembre de este año.
* ¿Ha habido cambios de alcance significativos durante el proyecto que justifiquen retrasos?
  * Con RUND-MGP fuimos un poco `con palos de ciego`, entendiendo lo que buscaba el GGP y construyendo el componente a medida que realizábamos el análisis de requerimientos. Fue un desarrollo un poco _sui generis_ y por eso, nuestros alcances iniciales han sido superados.


## Sobre el enfoque del documento:

* ¿Prefieres enfatizar más en: a) la complejidad técnica, b) el valor institucional del proyecto, o c) ambos por igual?
  * Creo que para Sandra Patricia Contreras, la Jefe de la OTIC, el valor institucional del proyecto ya es muy claro. Prefiero enfatizar en la complejidad técnica.
* ¿Hay algún aspecto sensible que debamos manejar con especial cuidado?
  * No quiero que suene de forma obvia a una queja, así haya algo de queja en el documento. Tampoco que parezca que le `echamos el agua sucia` a los ingenieros de la OTIC; solo queremos que ellos se vuelvan nuestros aliados en este proyecto y nos ayuden de forma decidida y franca a sacarlo adelante.