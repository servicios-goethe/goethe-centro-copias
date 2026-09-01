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
- El deployment de desarrollo vigente es la versión 27, `Desarrollo - Hitos 1 a 3`; usar ese deployment y no un enlace anterior.
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

- Las tarjetas operativas usan grillas de una columna hasta 900 px y los controles se apilan en móvil.
- Métricas, correcciones y acciones rápidas conservan separación visual; textos largos se quiebran dentro de la tarjeta.
- El texto del perfil operador describe las métricas visibles: stock inicial, solicitado y disponible.

### Pendientes conocidos incluidos en este corte

El árbol contiene avances de hitos posteriores que todavía deben corregirse y validarse:

- Hitos 5 a 8: completar su validación individual antes de considerar un release productivo.
