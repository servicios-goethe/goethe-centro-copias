# Registro de avances y despliegues

Este documento registra cada corte verificable del proyecto. Un despliegue en desarrollo no implica aprobación para producción.

## 2026-08-27 — Hito 1 y corte de prueba en desarrollo

### Alcance completado

- Hito 1: formulario de nuevo pedido simplificado.
- Nombre completo y email alineados en escritorio y apilados hasta 900 px.
- Tipografía e inputs de cantidad con mayor legibilidad y resaltado visual.
- Grilla protegida contra recortes en pantallas angostas.
- Texto de ayuda de la cuenta general sincronizado con el formulario.

### Validaciones ejecutadas

- `git diff --check`: correcto.
- Sintaxis de todos los archivos `.js`: correcta con Node.js.
- Sintaxis de los bloques JavaScript de `Ui*.html`: correcta con Node.js.
- Sin referencias activas a los campos anteriores `solicitante-nombre` y `solicitante-apellido`.
- Validación visual en navegador: pendiente de ejecutar en el entorno GAS de desarrollo.

### Corte de integración

- Rama Git: `feat/feedback-usuarios-dev`.
- Proyecto GAS de desarrollo: `1ISG1EqFAsTqPsuKP8QstbflRLcQ7mKOm88HsZYSrSbWIjpB-NGOqO38N`.
- Commit del corte: `6b709cd` (`feat(gas): prepare user feedback development snapshot`).
- Estado de push GitHub: rama publicada en `origin/feat/feedback-usuarios-dev`.
- Estado de sincronización GAS: 25 archivos sincronizados el 2026-08-27 a las 00:17 UTC.
- Verificación posterior: clonación limpia sin diferencias de código respecto del corte local, excluyendo la configuración específica del ambiente.
- Deployment de prueba `@HEAD`: `AKfycbyEv1OEyjeFhDkZsNRQLm8ZqqgUnyVI6yMtNVWCS98`.
- Configuración preservada: `ENVIRONMENT = "DESARROLLO"` y Spreadsheet de desarrollo `1QDlVdMC9GSrUeysk9RHDAyz-YhbYTz8H3s9kHmUgD9k`.
- No se modifica ni despliega el proyecto GAS productivo.

### Restricciones de la prueba

- La carpeta Drive de copias y los destinatarios de correo siguen compartidos con la configuración productiva.
- Este corte debe probar únicamente el formulario de pedidos del Hito 1.
- No crear compras ni solicitudes de copias hasta separar esos recursos por ambiente.

### Diagnóstico de terminal de copias

- La autenticación de producción y desarrollo usa el mismo código (`Auth.js`). El perfil efectivo se toma de la hoja `Usuarios_Admin` del Spreadsheet configurado en cada ambiente.
- Producción resuelve `copias@goethemail.net` como cuenta general; desarrollo la resuelve como usuario sin perfil. La diferencia está en los datos de `Usuarios_Admin` del Spreadsheet de desarrollo, no en el código desplegado.
- Corrección requerida en desarrollo: agregar o corregir la fila con `Email = copias@goethemail.net` y `Perfil = general`. También se aceptan los alias `terminal` o `cuenta general`.
- El rol se mantiene en caché hasta 300 segundos. Después de corregir la fila, esperar hasta cinco minutos y recargar la aplicación.
- El deployment de desarrollo vigente es la versión 29, `Desarrollo - avisos sin diálogo y secciones de usuario`; usar ese deployment y no un enlace anterior.
- La ejecución remota administrativa no está disponible para la cuenta actual, por lo que esta modificación de datos requiere acceso directo al Spreadsheet de desarrollo o habilitar la ejecución de Apps Script para la cuenta técnica.

### Hito 2 — Material no listado

- Commit: `c18bef4` (`fix(pedidos): treat unlisted material as informational`).
- Sincronizado con GAS de desarrollo el 2026-08-27 a las 00:45 UTC, preservando `AppConfig.js` de desarrollo.
- Las líneas de material no listado se identifican explícitamente como solicitudes informativas.
- La interfaz oculta las acciones de preparar, retirar y ajustar stock para esas líneas.
- El servidor rechaza las mismas acciones incluso si se invocan fuera de la interfaz; cancelar el saldo sigue permitido.

### Hito 3 — Stock visible y edición del operador

- Commit: `81607c0` (`fix(operador): isolate order quantity controls`).
- Sincronizado con GAS de desarrollo el 2026-09-01 a las 21:47 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 27 creada y deployment de desarrollo actualizado el 2026-09-01; el enlace `/exec` ya usa los Hitos 1 a 3.
- La vista del operador muestra stock disponible antes de la reserva del pedido, cantidad solicitada y stock disponible actual.
- La corrección de cantidad queda limitada en servidor a líneas pendientes sin preparación ni retiro, y conserva auditoría.
- La clave DOM del control incorpora pedido y producto, evitando colisiones cuando dos pedidos contienen el mismo material.

### Hito 4 — Tarjetas operativas sin superposición

- Commit: `5afa996` (`fix(ui): harden operator card layout`).
- Sincronizado con GAS de desarrollo el 2026-09-01 a las 22:18 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 28 creada y deployment de desarrollo actualizado el 2026-09-01 a las 22:24 UTC; el enlace `/exec` ya usa los Hitos 1 a 4.
- Las tarjetas operativas usan grillas de una columna hasta 900 px y los controles se apilan en móvil.
- Métricas, correcciones y acciones rápidas conservan separación visual; textos largos se quiebran dentro de la tarjeta.
- El texto del perfil operador describe las métricas visibles: stock inicial, solicitado y disponible.

### Hito 5 — Datos del solicitante de copias

- Implementación presente desde el corte `6b709cd` (`feat(gas): prepare user feedback development snapshot`) y, por lo tanto, incluida en el deployment de desarrollo versión 28.
- `COPIAS_HEADERS` incorpora `Solicitante_Nombre`; al inicializar una hoja existente, el encabezado faltante se agrega al final sin reordenar las columnas previas.
- Las nuevas solicitudes validan y persisten el nombre; la serialización de registros históricos usa el email cuando ese dato aún no existe.
- La decisión estructural y sus consecuencias están registradas en `docs/adr/ADR-001-copias-solicitante-nombre.md`.

### Hito 6 — Vista simplificada de copias

- Implementación presente desde el corte `6b709cd` y, por lo tanto, incluida en el deployment de desarrollo versión 28.
- El formulario de copias envía `solicitanteNombre` junto con el archivo y los datos del trabajo.
- Cada tarjeta muestra solicitante, fecha/hora, estado, nivel y un resumen compacto del trabajo; el nombre usa el email como respaldo si la fila es histórica.
- La búsqueda operativa incluye ID, nivel, nombre, email y nombre de archivo; en móvil la tarjeta y sus acciones se apilan para conservar legibilidad.

### Hito 7 — Correo solo al quedar listo

- Implementación presente desde el corte `6b709cd` y, por lo tanto, incluida en el deployment de desarrollo versión 28.
- En `Pedidos.js`, la única invocación a `MailApp` para pedidos está centralizada en `enviarMailRetiroListo_`.
- Las acciones simples y masivas notifican solo ante una transición real desde otro estado a `Listo para retirar`; una acción repetida sin transición no duplica el correo.
- Registrar, editar, retirar o entregar no invoca ese helper. Los correos de compras y de copias permanecen fuera de este alcance.

### Hito 8 — Documentación y verificación final

- `docs/business-rules.md` y `docs/gas-architecture.md` reflejan el nombre persistido del solicitante de copias, la compatibilidad de encabezados y la política de correo de pedidos.
- Se ejecutaron `git diff --check`, la validación sintáctica con Node.js de todos los `GAS/*.js` y de los bloques JavaScript de `GAS/Ui*.html`, sin errores.
- El checklist manual de cierre está disponible en `docs/manual-validation-checklist.md`; no requiere publicar una nueva versión GAS porque este hito solo modifica documentación.
- Los ocho hitos del plan están completados. Permanecen únicamente decisiones de arquitectura fuera del alcance del plan (DWH, threat model, separación de recursos por entorno y retención de archivos), ya registradas en arquitectura y reglas de negocio.

### Pendientes conocidos incluidos en este corte

No quedan hitos funcionales pendientes en este plan. Las decisiones de arquitectura fuera de alcance se mantienen registradas y requieren definición del propietario antes de abordarlas.

## 2026-09-01 — Planificación de decisiones de arquitectura

- Se agregó `docs/architecture-decision-plan.md` con fases, dependencias y estimaciones para aislar desarrollo, externalizar configuración, establecer seguridad mínima y preparar el ADR de DWH.
- El alcance rápido es viable en 2–3 días hábiles si se resuelven las decisiones de entorno, embedding, retención y propietario de DWH.
- La integración DWH no se inicia sin contrato aprobado; queda como iniciativa separada tras su ADR.

## 2026-09-01 — Ajustes de experiencia de usuario posteriores al cierre

- Los avisos nativos de validación y éxito al registrar pedidos se reemplazan por notificaciones internas temporales, sin botón de confirmación.
- La sección `Mis pedidos` se muestra debajo de `Solicitud de copias` y se oculta únicamente para la terminal `copias@goethemail.net`.
- Commit: `2055fbe` (`fix(ui): streamline request notices and sections`).
- Sincronizado con GAS de desarrollo a las 23:33 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 29 creada y deployment de desarrollo actualizado a las 23:35 UTC.

## 2026-09-01 — Encabezados de formularios de usuario

- `Nuevo pedido` y `Solicitud de copias` adoptan la jerarquía visual de las secciones administrativas: borde lateral ancho, fondo suave, título destacado y descripción.
- Se elimina el chip informativo de perfil de la vista de usuario; se mantienen los avisos necesarios para cuentas generales y accesos externos.
