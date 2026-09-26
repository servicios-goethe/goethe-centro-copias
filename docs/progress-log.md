# Registro de avances y despliegues

Este documento registra cada corte verificable del proyecto. Un despliegue en desarrollo no implica aprobación para producción.

## 2026-09-26 — Escudo local en el header

- El header del rediseño usa `docs/Rediseno/escudo.png` embebido como PNG inline en GAS.
- Se eliminó la dependencia de carga del SVG externo para la marca visual.
- Commit: `92ce74d` (`style(rediseno): use local Goethe shield logo`).
- GAS de desarrollo: versión 52, `Rediseno - escudo local Goethe`.
- Producción y `main` no fueron modificadas; el cambio quedó sólo en `rediseno-pedidos-grafica`.

## 2026-09-26 — Nuevo pedido: grilla de productos para usuario común

- La pantalla de materiales incorpora la grilla de referencia con columnas de producto, ID, disponibilidad y cantidad.
- Las categorías ahora tienen indicador visual de expansión y las filas de productos ofrecen control rápido menos/más junto al campo numérico.
- Se ajustaron tipografía, densidad de filas y jerarquía visual para mejorar la carga en escritorio y móvil.
- Commit: `207a6db` (`feat(rediseno): improve user materials order grid`).
- GAS de desarrollo: versión 53, `Rediseno usuario - grilla nuevo pedido`.
- Producción y `main` no fueron modificadas; el cambio quedó sólo en `rediseno-pedidos-grafica`.

## 2026-09-26 — Ajuste final de grilla de usuario y móvil

- ID, disponibilidad y detalle de stock quedan reservados para perfiles administrativos.
- Se corrigió el fallback de stock para evitar valores `undefined` en vistas operativas.
- Categorías y productos usan una escala tipográfica uniforme y las categorías agregan etiqueta bilingüe.
- El control de cantidad admite tres dígitos y la grilla se adapta mejor a pantallas angostas.
- Commit: `f1b23f1` (`fix(rediseno): refine user order mobile grid`).
- GAS de desarrollo: versión 54, `Rediseno usuario - móvil y etiquetas`.
- Producción y `main` no fueron modificadas; el cambio quedó sólo en `rediseno-pedidos-grafica`.

## 2026-09-26 — Corrección de ancho y alineación de cantidades

- El campo de cantidad queda fijo en 66 px para mostrar tres dígitos sin recorte.
- El título de cada categoría se alinea a la izquierda, igual que los productos; el contador permanece a la derecha.
- Se ampliaron traducciones de categorías frecuentes (adhesivo, bibliorato y aros metálicos).
- Commit: `16c4f09` (`fix(rediseno): align categories and fit three digit quantities`).
- GAS de desarrollo: versión 55, `Rediseno usuario - cantidades y alineación`.
- Producción y `main` no fueron modificadas; el cambio quedó sólo en `rediseno-pedidos-grafica`.

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
- El deployment de desarrollo vigente para la rama funcional es la versión 38, `Desarrollo - filtro de copias autorizadas por defecto`; el rediseño se prueba por separado en la versión 39.
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
- Commit: `9f0a33a` (`style(ui): align user form sections with admin`).
- Sincronizado con GAS de desarrollo a las 23:43 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 30 creada y deployment de desarrollo actualizado.

## 2026-09-03 — Selector de solicitantes para terminal de copias

- La terminal `copias@goethemail.net` consulta la hoja `Solicitantes` por apellido y muestra hasta 20 coincidencias activas con nombre y `EmailProfesional`.
- La selección completa los datos del pedido; otras cuentas generales conservan la carga manual.
- El backend valida nuevamente que el email y nombre correspondan a un registro activo antes de guardar.
- La estructura esperada es `Apellido`, `Nombre`, `EmailProfesional`, `Estado`.
- Commit: `92f9631` (`feat(copias): add requester directory lookup`).
- Sincronizado con GAS de desarrollo a las 00:49 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 31 creada y deployment de desarrollo actualizado a las 00:54 UTC.

## 2026-09-07 — Mejoras del módulo de copias

- Las solicitudes de usuarios logueados toman nombre y email del directorio `Solicitantes`; la terminal `copias@goethemail.net` selecciona al solicitante por apellido y guarda su `EmailProfesional`.
- La validación server-side impide registrar personas inexistentes o inactivas.
- La hoja `Usuarios_Copias` queda documentada como fuente de autorizadores por nivel (también se admite `Autorizados_Copias`); el error de EP ahora indica las columnas y valores requeridos.
- Los controles de doble faz y copia color se mantienen en una sola línea mediante estilos responsivos.
- El error de Drive de ES se transforma en un mensaje operativo explícito: la cuenta desplegadora debe tener acceso a la carpeta y autorizar el scope de Drive.
- Commit: `f07288a` (`feat(copias): resolve requester and authorization data`).
- Sincronizado con GAS de desarrollo a las 15:48 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 32 creada y deployment de desarrollo actualizado a las 15:52 UTC.

## 2026-09-25 — Organización visual y PDF en copias

- Las tarjetas operativas ya no muestran el código interno `COP-...`.
- El nombre del solicitante se muestra destacado, sin la etiqueta redundante “Solicitante”.
- Las solicitudes administrativas se agrupan por Jardín (`KG`), Primaria (`EP`) y Secundaria (`ES`), con tratamiento cromático diferenciado.
- Las secciones administrativas se identifican explícitamente como solicitudes de materiales de librería y solicitudes de copias.
- La carga de archivos de copias queda restringida a PDF en cliente y servidor.
- Commit: `4c01bb8` (`feat(copias): group requests and restrict pdf uploads`).
- Sincronizado con GAS de desarrollo a las 15:41 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 35 creada y deployment de desarrollo actualizado.
- Se agrega `verificarAccesoDriveCopias()`, una comprobación de solo lectura para disparar la autorización OAuth y confirmar el acceso efectivo a la carpeta configurada.
- Commit: `1300f2b` (`fix(copias): add drive authorization check`).
- Sincronizado con GAS de desarrollo a las 16:47 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 33 creada y deployment de desarrollo actualizado.
- El error posterior en `Folder.createFolder` confirma que falta comprobar permiso de escritura; se agrega `verificarEscrituraDriveCopias()` para crear una carpeta temporal y enviarla a papelera.
- Commit: `9cdf0f9` (`fix(copias): probe Drive folder write access`).
- Sincronizado con GAS de desarrollo a las 16:56 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 34 creada y deployment de desarrollo actualizado.

## 2026-09-25 — Refresco automático de copias pendientes

- Las ventanas de administración y operación consultan silenciosamente las copias pendientes cada cinco minutos mientras permanecen visibles.
- El refresco no reinicia los campos del formulario ni muestra un indicador intrusivo; se evita otra consulta si ya hay una carga en curso.
- La ventana que registra una nueva solicitud continúa actualizando su propia lista inmediatamente después del alta; las demás ventanas la incorporan en el siguiente ciclo.
- Commit: `4a6b067` (`feat(copias): refresh operator queue automatically`).
- Sincronizado con GAS de desarrollo a las 15:51 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 36 creada y deployment de desarrollo actualizado a las 15:51 UTC.

## 2026-09-25 — Remitente central y modales internos

- Los correos de pedidos, compras y copias se centralizan en `GmailApp` usando el alias autorizado `l.aristu@goethe.edu.ar`.
- La confirmación de finalización de copias y el ingreso del motivo para deshacer preparación dejaron de usar diálogos nativos del navegador; ambos usan el modal visual de la aplicación.
- No quedan llamadas a `alert`, `confirm` ni `prompt` en el código GAS.
- Commit: `08bf426` (`feat(mail-ui): centralize sender and replace native dialogs`).
- Sincronizado con GAS de desarrollo a las 16:54 UTC, preservando `AppConfig.js` de desarrollo.
- Versión GAS 37 creada y deployment de desarrollo actualizado.

## 2026-09-25 — Filtro operativo de copias autorizado por defecto

- La vista administrativa/operativa de copias inicia filtrada en estado `AUTORIZADO`.
- Los demás estados continúan disponibles desde el selector, sin alterar la consulta ni los datos almacenados.
- Commit: `e2c9612` (`fix(copias): default operator filter to authorized`).
- Sincronizado con GAS de desarrollo y publicado como versión 38.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 1

- Se incorporó el paquete de diseño en `docs/Rediseno` y se publicó exclusivamente en la rama `rediseno-pedidos-grafica`.
- Se agregó el shell visual inicial: módulos Materiales/Copias, solapas según rol y persistencia de selección en `sessionStorage`.
- Las secciones existentes se reutilizan sin modificar endpoints ni código de servidor; la navegación solo controla su visibilidad.
- Commit del paquete: `c48e44a`; commit del Hito 1: `bb3d409`.
- GAS de desarrollo: versión 39, `Rediseno Hito 1 - shell y navegacion por rol`.
- Producción y `main` no fueron modificadas.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 2

- `Nuevo pedido` y `Mis pedidos` adoptan tarjetas, encabezados, buscador, resumen y barra de envío con el lenguaje visual del rediseño.
- La navegación deja visible una sola solapa de materiales por vez y fuerza la apertura del contenido activo sin alterar sus funciones existentes.
- Se conservaron los contratos actuales de carga de productos, selección de cantidades, pedidos no listados, edición y eliminación de pedidos propios.
- Commit: `1ed722f` (`feat(rediseno): style material request and own orders`).
- GAS de desarrollo: versión 40, `Rediseno Hito 2 - nuevo pedido y mis pedidos`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Rediseño Pedidos Gráfica: Hito 8 y cierre visual

- Se ajustó el responsive para 390 px y escritorio: header compacto, grillas de una columna, tablas sin stock en móvil y barra de envío sticky.
- Los avisos temporales se ubican como toast superior y se unificó el fondo cálido del nuevo shell.
- El título de la web app pasa a `Pedidos Gráfica`.
- Commit: `651f8d9` (`feat(rediseno): polish responsive shell and branding`).
- GAS de desarrollo: versión 51, `Rediseno Hito 8 - responsive y cierre visual`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Rediseño Pedidos Gráfica: Hito 7

- La pantalla `Nueva solicitud · Neuer Auftrag` de copias incorpora resumen dinámico de páginas, cantidad, especificación y autorización.
- Doble faz y color adoptan controles segmentados visuales sin modificar los nombres de formulario ni el contrato de envío.
- Se mantienen PDF, validaciones, solicitante, niveles, modalidades, comentarios y carga existente.
- Commit: `92e99a4` (`feat(rediseno): redesign copy request form`).
- GAS de desarrollo: versión 50, `Rediseno Hito 7 - solicitud de copias`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Separación de módulos administrativos

- Materiales separa `Compras · Einkauf` y `Recepción · Wareneingang` en solapas independientes.
- Copias diferencia `Autorizaciones · Freigaben` (estado `SOLICITADO`) de `Trabajos · Druckaufträge` (estado `AUTORIZADO`).
- El selector de estado de copias se bloquea en esas solapas para evitar que ambas vistas vuelvan a mostrar el mismo conjunto.
- Commit: `1bcbe73` (`fix(rediseno): split admin materials and copy tabs`).
- GAS de desarrollo: versión 49, `Rediseno admin - compras recepcion y copias separadas`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Logo oficial en el header del rediseño

- El header usa el logo oficial Goethe Schule desde `https://goethe.edu.ar/wp-content/uploads/2020/03/goethe-schule.svg`.
- Se agregó un fallback visual con la inicial `G` si el recurso externo no estuviera disponible.
- Commit: `8f0c9c9` (`style(rediseno): use official Goethe logo`).
- GAS de desarrollo: versión 48, `Rediseno - logo oficial Goethe`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Corrección de solapas de copias

- `Nueva solicitud · Neuer Auftrag` ahora muestra solamente el formulario de carga.
- `Mis solicitudes · Meine Aufträge` ahora muestra solamente el listado propio y su actualización.
- Se mantuvo una única fuente de datos y los contratos actuales de envío y consulta.
- El paquete conserva las 9 capturas disponibles; `Screenshot 2026-09-25 145657.png` no está incluido en la carpeta local.
- Commit: `bfac2c3` (`fix(rediseno): separate copy request tabs`).
- GAS de desarrollo: versión 47, `Rediseno copias - nuevas y mis solicitudes separadas`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-26 — Corrección de pantalla Nuevo pedido

- Se corrigió la navegación para ocultar todos los paneles no pertenecientes al módulo/solapa activa; `Solicitud de copias` ya no aparece dentro de Materiales.
- La grilla de `Nuevo pedido` se ajustó con encabezado, categorías, filas seleccionadas, inputs de cantidad y espaciado del diseño de referencia.
- La captura `Screenshot 2026-09-25 145657.png` no está incluida en el paquete local actual; se tomó como referencia la pantalla equivalente disponible.
- Commit: `8aa4db1` (`fix(rediseno): isolate active panel and refine new order`).
- GAS de desarrollo: versión 46, `Rediseno pantalla nuevo pedido - paneles aislados`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-25 — Ajuste transversal del rediseño

- Se reemplazó el navbar heredado por el header de `Pedidos Gráfica · Grafik-Bestellungen`, con marca, avatar, correo, rol e instructivo.
- Se ocultó el bloque administrativo heredado con navegación y KPI duplicados; se conservaron sus IDs para no romper funciones existentes.
- Se ajustó la presentación responsive del header para móvil.
- Commit: `ecdf186` (`feat(rediseno): align header and remove legacy navigation`).
- GAS de desarrollo: versión 45, `Rediseno ajuste transversal - header y limpieza`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 6

- `Productos y stock · Produkte & Bestand` adopta tarjetas, campos bilingües y barra de acción para alta de productos.
- `Actividad reciente · Letzte Aktivität` adopta la misma superficie visual y conserva su listado actual.
- Se mantienen `crearProductoDesdeAdmin()`, el ajuste de stock existente y la carga de actividad desde el dashboard.
- Commit: `194ee0b` (`feat(rediseno): style products and activity`).
- GAS de desarrollo: versión 44, `Rediseno Hito 6 - productos y actividad`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 5

- `Compras y recepción · Einkauf & Eingang` adopta tarjetas de lote, filtros bilingües y jerarquía visual para solicitado, recibido y saldo.
- Se conservan recepción parcial/completa, selección de producto recibido, cancelación de saldo con motivo y actualización de stock.
- La sección de nueva reposición mantiene el flujo de compra para administración y el modo ingreso para operador.
- Commit: `3625135` (`feat(rediseno): style purchases and receiving`).
- GAS de desarrollo: versión 43, `Rediseno Hito 5 - compras y recepcion`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 4

- La vista de operador `Ingreso de stock · Wareneingang` adopta la grilla, filtros, campos y barra de acción del nuevo lenguaje visual.
- Se mantienen referencias, selección de cantidades, resumen y registro inmediato mediante `registrarCompraMasiva`.
- Commit: `87523bb` (`feat(rediseno): style stock entry workspace`).
- GAS de desarrollo: versión 42, `Rediseno Hito 4 - ingreso de stock`.
- Producción, `main` y la rama funcional no fueron modificadas.

## 2026-09-25 — Rediseño Pedidos Gráfica: Hito 3

- La solapa `Entregas · Ausgaben` adopta tarjetas operativas, buscador bilingüe, filtro de faltantes y jerarquía visual de solicitante, estado y líneas.
- Se conservaron las acciones actuales de preparar, procesar, entregar completa/parcial, cancelar saldo, deshacer preparación, corregir cantidades y ajustar stock.
- Commit: `c85209f` (`feat(rediseno): style deliveries workspace`).
- GAS de desarrollo: versión 41, `Rediseno Hito 3 - entregas operativas`.
- Producción, `main` y la rama funcional no fueron modificadas.
