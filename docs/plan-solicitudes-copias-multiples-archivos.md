# Plan: hasta 10 archivos por solicitud de copias

## Objetivo

Permitir que una persona adjunte hasta 10 PDF a una sola solicitud de copias. El operador y el autorizador deben encontrar un único trabajo con todos sus archivos, en lugar de recibir una solicitud independiente por cada PDF.

Este documento describe el plan; no implementa el cambio.

## Propuesta funcional

- Una solicitud puede incluir de 1 a 10 PDF.
- La solicitud conserva un único solicitante, nivel, estado y decisión de autorización.
- Los ajustes generales de impresión se comparten entre todos los archivos: cantidad de copias, tamaño, modalidad, doble faz y color.
- Cada archivo conserva nombre, enlace de Drive, tamaño y cantidad de páginas del original.
- El comentario se aplica al trabajo completo.
- Los archivos aparecen juntos en las pantallas del solicitante, autorización y trabajos del operador.
- El resumen muestra los documentos y el total de páginas a imprimir, calculado como la suma de páginas originales por la cantidad de copias.
- Se mantiene el ciclo actual de notificaciones: mail al crear la solicitud y mail cuando el operador la finaliza/lista para retirar. No se envían mails al autorizar.

### Supuesto que requiere validación funcional

La propuesta trata los 10 PDF como partes de un mismo trabajo y usa los mismos ajustes de impresión para todos. Las páginas originales se cargan por archivo. Si cada PDF puede tener diferente cantidad de copias, tamaño, modalidad, doble faz o color, se necesitaría una pantalla de configuración por archivo y el alcance aumentaría.

## Selección y carga de archivos

### Desde la computadora

- Cambiar el selector actual a `multiple`.
- Aceptar únicamente PDF.
- Validar cantidad máxima, tipo y tamaño antes de enviar.
- Mostrar nombre y tamaño de cada archivo, con opción para quitarlo de la selección.
- Mantener el envío local rápido para archivos pequeños.

El límite actual es de 25 MB por archivo para la carga local. Para varias cargas, también hay que fijar un máximo combinado que evite superar los límites de envío de Apps Script. Propuesta inicial: hasta 80 MB combinados por solicitud desde Windows; si excede ese total, indicar que se seleccionen los PDF desde Drive.

### Desde Google Drive Picker

- Habilitar la selección múltiple del Picker.
- Limitar la vista a PDF.
- Mostrar en la selección qué archivos se eligieron y permitir quitar alguno antes de confirmar.
- Registrar los IDs de Drive seleccionados sin retransmitir los archivos por el navegador.
- Mantener el límite general de 10 archivos.

Los archivos locales no se convierten automáticamente en archivos de Drive para el Picker: son dos formas de adjuntar archivos a la misma solicitud. El usuario puede combinar selecciones locales y de Drive, siempre que no supere los límites.

## Modelo de datos

Mantener `Solicitudes_Copias` como cabecera para conservar estado, autorización y compatibilidad histórica. Agregar una hoja hija, por ejemplo `Solicitudes_Copias_Archivos`, con una fila por PDF:

| Campo | Uso |
| --- | --- |
| `ID_Archivo_Copia` | Identificador único del adjunto |
| `ID_Solicitud` | Referencia a la solicitud principal |
| `Orden` | Orden elegido por el solicitante |
| `Archivo_Nombre` | Nombre visible del PDF |
| `Archivo_ID` | ID del archivo en Drive |
| `Archivo_URL` | Enlace para abrirlo |
| `Archivo_Tamano_Bytes` | Tamaño validado |
| `Paginas_Original` | Páginas de ese documento |
| `Fecha_Creacion` | Fecha de registro |

Para mantener la compatibilidad con solicitudes existentes, sus columnas actuales se conservan. La migración puede ser gradual: las solicitudes antiguas se serializan como si tuvieran un único archivo, usando sus columnas actuales; las nuevas usan la hoja hija.

## Flujo propuesto

1. El usuario selecciona de 1 a 10 archivos.
2. La interfaz valida PDF, cantidad y límites de tamaño, y permite revisar la lista.
3. El usuario completa nivel y opciones comunes de impresión; carga las páginas por archivo.
4. El backend valida nuevamente usuario, permisos, archivos, tamaños y páginas.
5. Se crean o localizan las carpetas de Drive de la solicitud.
6. Se guardan los archivos locales o se mueven los seleccionados desde Picker.
7. Se registra una cabecera y las filas de adjuntos.
8. Se envía un único mail de recepción con el identificador de la solicitud y el listado de PDFs.
9. La autorización, si corresponde, se hace una sola vez para toda la solicitud.
10. El operador ve un solo trabajo con acceso a todos los archivos.
11. Al finalizar, se envía un único mail de retiro.

## Autorización y estados

- `KG` y `EP`: una sola autorización cubre todos los adjuntos.
- `ES` y `BO`: conservan la aprobación automática actual.
- Rechazar la solicitud rechaza el conjunto completo.
- Finalizar el trabajo finaliza la solicitud completa.
- No se deben permitir decisiones distintas por PDF dentro de una misma solicitud en esta primera versión.

## Validaciones y manejo de fallos

- Máximo estricto de 10 archivos por solicitud, validado en cliente y servidor.
- Cada archivo debe tener extensión y MIME PDF.
- Validar archivo vacío, tamaño individual y tamaño total.
- Cada archivo Picker debe existir, ser accesible por la cuenta ejecutora y coincidir con sus metadatos esperados.
- Registrar la solicitud solo después de validar y guardar todos los archivos.
- Si falla una parte del proceso, evitar dejar una solicitud visible incompleta. El backend debe limpiar los adjuntos creados o marcar la operación para recuperación.
- Registrar en logs el error y el archivo afectado, sin guardar tokens OAuth ni contenido del archivo.
- Evitar duplicar solicitudes si el navegador reintenta después de una respuesta demorada; usar una clave/idempotencia para el envío agrupado.

## Interfaz del solicitante

- Lista de archivos seleccionados con nombre, tamaño y páginas originales.
- Acción para quitar archivos individualmente.
- Indicador `N de 10 archivos`.
- Resumen: páginas originales totales, cantidad de copias y total de páginas impresas.
- Instrucción clara para archivos grandes o lotes que superen el límite local: seleccionarlos desde Google Drive.
- Mostrar estado de carga por archivo cuando haya carga desde Windows.

## Interfaz de autorización y operación

- Una tarjeta por solicitud, no una tarjeta por archivo.
- Mostrar cantidad de PDFs y el resumen del trabajo.
- Acción para abrir cada PDF en una pestaña nueva.
- La lista debe mostrar claramente qué adjunto se está abriendo.
- La autorización masiva futura debe operar sobre solicitudes principales, no multiplicarse por cantidad de archivos.
- La finalización es única y envía una sola notificación.

## Plan de implementación

### Etapa 1 — definición y compatibilidad

- Confirmar que las opciones de impresión son comunes a los archivos.
- Confirmar límite de tamaño combinado.
- Definir comportamiento ante fallo parcial e idempotencia.
- Acordar cómo se presentan documentos en el listado operativo.

Estimación: medio día.

### Etapa 2 — almacenamiento y backend

- Crear la hoja hija y su estructura automática.
- Añadir lectura y serialización de solicitudes con varios adjuntos.
- Admitir varios archivos locales y varios IDs de Picker.
- Validar permisos, formato, tamaños y páginas en el servidor.
- Guardar todos los adjuntos y crear una sola cabecera.
- Mantener compatibilidad con filas históricas de un único archivo.

Estimación: 1,5–2 días.

### Etapa 3 — formulario y Google Picker

- Admitir selección local múltiple.
- Habilitar selección múltiple en Picker.
- Mostrar lista editable de archivos y páginas por PDF.
- Calcular y mostrar el resumen conjunto.
- Informar avance y errores por archivo.

Estimación: 1,5–2 días.

### Etapa 4 — autorización, operador y mails

- Adaptar autorizaciones para que actúen sobre la solicitud principal.
- Mostrar todos los enlaces en autorización y trabajos.
- Actualizar el mail de recepción para listar los archivos.
- Mantener un único mail de finalización.
- Verificar que no se envíen mails en decisiones de autorización.

Estimación: 1 día.

### Etapa 5 — pruebas en desarrollo

- Un archivo local pequeño.
- Diez archivos locales pequeños dentro del máximo combinado.
- Uno y diez archivos seleccionados por Picker.
- Combinación de archivos locales y Picker.
- Límites 0, 1, 10 y 11 archivos.
- PDF inválido, archivo vacío, archivo demasiado grande y selección inaccesible.
- Solicitudes KG, EP, ES y BO.
- Autorización, rechazo, finalización, mails y solicitudes históricas.
- Fallo durante el guardado de un adjunto y reintento del formulario.

Estimación: 1–1,5 días.

## Estimación total

Entre **5 y 7 días de desarrollo y pruebas**, suponiendo que todas las opciones de impresión son compartidas por los documentos. Si las opciones deben variar por archivo, estimar **1–2 días adicionales**.

## Criterios de aceptación

- El usuario puede presentar hasta 10 PDF en una sola solicitud.
- Puede combinar archivos locales y archivos de Picker.
- La interfaz muestra la lista completa y permite quitar elementos antes del envío.
- Cada PDF conserva su propia cantidad de páginas originales.
- Una solicitud produce una única autorización, un único trabajo operativo y las notificaciones acordadas.
- El operador puede abrir cada archivo por separado.
- Solicitudes antiguas de un solo archivo siguen mostrándose y operándose correctamente.
- El backend bloquea el archivo número 11 y rechaza tipos o tamaños inválidos.
- Un fallo parcial no deja una solicitud aparentemente completa.
