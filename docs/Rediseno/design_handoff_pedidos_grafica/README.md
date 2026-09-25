# Handoff: Pedidos Gráfica — rediseño de la UI (GAS)

Repo: `servicios-goethe/goethe-centro-copias` · rama de trabajo: la nueva rama creada para el rediseño (no `main`).

## Overview
Rediseño completo de la interfaz del sistema hoy llamado "Inventario Goethe / Centro de Copias". El sistema pasa a llamarse **Pedidos Gráfica · Grafik-Bestellungen**. Se reorganiza en **dos módulos** — *Solicitud de Materiales · Materialanfrage* y *Solicitud de Copias · Kopierauftrag* — y dentro de cada módulo, **solapas** que dependen del rol (usuario / operador / admin). Paleta de solo dos colores de marca (verde y dorado Goethe-Schule), esquinas redondeadas, todo el texto en español y alemán.

## Alcance y reglas para Claude Code
- **Tocar solo la capa de interfaz**: `GAS/Index.html`, `GAS/Estilos.html`, `GAS/UiBase.html`, `GAS/UiState.html`, `GAS/UiPedidos.html`, `GAS/UiAdmin.html`, `GAS/UiCompras.html`, `GAS/UiCopias.html`, `GAS/InstructivoPanel.html`, `GAS/Instructivo.html`.
- **No modificar** los `.js` del servidor (reglas de negocio, `google.script.run` endpoints, esquemas de hojas). Si algo de la UI nueva necesita un dato que el servidor no entrega, dejarlo anotado como TODO en vez de cambiar el backend. Excepción permitida: texto del título de la web app en `Code.js` (`setTitle`) → "Pedidos Gráfica".
- Conservar todos los IDs/funciones de cliente existentes que llaman al servidor (`registrarPedidoMasivo`, `obtenerMisPedidosEditables`, `actualizarItemPedidoPropio`, compras, recepción, copias, ajuste de stock, decisión de copias por token, etc.). Se reestructura el markup, no el contrato.
- Respetar `CONVENTIONS.md`.
- **Producción**: antes de cualquier `clasp push`, apuntar `GAS/.clasp.json` a una COPIA del proyecto Apps Script (y a una planilla de prueba) y dejar `CONFIG.ENVIRONMENT` ≠ `PRODUCCION` para que aparezca el banner de pruebas. No hacer push al scriptId productivo desde esta rama.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** (un prototipo interactivo), no código para copiar tal cual. La tarea es **recrear este diseño dentro del entorno existente** (HtmlService de Google Apps Script, HTML + CSS en `Estilos.html` + JS de cliente vanilla con `google.script.run`), usando sus patrones actuales. El prototipo usa un runtime propio (`support.js`, `.dc.html`) que NO debe llevarse al repo.

Para ver el prototipo: abrir `Pedidos Gráfica.dc.html` en un navegador desde esta carpeta (necesita `support.js`, `_ds/` y `assets/` al lado). Arriba hay controles "Ver como" (Usuario / Operador / Admin) y "Escritorio / Móvil" que son **solo de la demo** — no van en el producto; el rol real sale de `rolActual`.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, radios, espaciados y textos son finales. Recrear lo más fiel posible. Los datos (productos, pedidos, personas) son de ejemplo.

---

## Estructura global

```
┌ header (blanco, borde inferior 1px #e3dccb) ──────────────────────────────┐
│ [logo 40px] │ Pedidos Gráfica / Grafik-Bestellungen     [Instructivo] [👤] │
├───────────────────────────────────────────────────────────────────────────┤
│ [ Solicitud de Materiales ]   [ Solicitud de Copias ]   ← 2 tiles, 50/50  │
├ solapas del módulo según rol (pills, scroll horizontal) ──────────────────┤
│ [Nuevo pedido] [Mis pedidos] [Entregas 2] …                               │
├ main (padding 24px) ──────────────────────────────────────────────────────┤
│ toast de confirmación (opcional) · contenido de la solapa activa           │
└───────────────────────────────────────────────────────────────────────────┘
```
- Fondo de página `#faf8f3`. Ancho fluido; el prototipo muestra 1280px y 390px.
- El banner "ENTORNO DE PRUEBAS" existente se mantiene (cuando `ENVIRONMENT !== PRODUCCION`), arriba de todo, estilo: fondo `#13261b`, texto blanco 13px, texto bilingüe.
- Se eliminan las `collapsible-card` actuales como forma de navegación: cada sección pasa a ser una solapa. Solo se muestra el contenido de la solapa activa.

### Header
- Padding 16px 24px, fondo `#fff`, borde inferior `1px solid #e3dccb`, flex, gap 16px, align center.
- Logo `assets/goethe-logo.png` alto 40px (30px en móvil). Separador vertical 1px `#e3dccb`.
- Título "Pedidos Gráfica" Archivo 20px/800, line-height 1.1, color `#13261b`; debajo "Grafik-Bestellungen" 13px/600 color `#7a5f25`.
- Derecha (desktop): botón ghost "Instructivo · Anleitung" (radio 999px) → abre el panel de instructivo existente (`toggleInstructivo(true)`); chip de usuario: fondo `#faf8f3`, borde 1px `#e3dccb`, radio 999px, padding 6px 14px 6px 6px; avatar círculo 34px verde `#0a6334` con iniciales blancas 13px/800; email 13px/700; rol 12px/600 `#7a5f25` ("Usuario · Benutzer", "Operador · Operator", "Administrador · Administrator").
- Móvil: solo avatar 40px (ocultar Instructivo y email; Instructivo accesible desde el avatar o un menú).
- La versión GAS (`app-version-info`) pasa al pie del panel de Instructivo o a un tooltip del avatar — no en el header.

### Tiles de módulo
- Grid `minmax(0,1fr) minmax(0,1fr)`, gap 12px, padding 20px 24px 0.
- Cada tile es un `<button>`: radio 18px, borde 1.5px, padding 16px (móvil 14px 40px 14px 14px), flex, gap 14px, texto alineado a la izquierda.
  - Activo: fondo `#0a6334`, borde `#0a6334`, texto blanco; ícono en cuadrado 44px radio 14px fondo dorado `#b08d45`, ícono blanco.
  - Inactivo: fondo `#fff`, borde `#e3dccb`, texto `#13261b`; ícono fondo `#e6f1ea`, ícono verde.
  - Título ES 18px/800 (móvil 14px); DE debajo 13px, opacidad .85.
  - Íconos Lucide: `package` (Materiales), `printer` (Copias), 22px, stroke 2.
  - Badge de pendientes (si > 0): pill mín. 28×28, fondo `#b08d45`, blanco 13px/800. En móvil: posición absoluta top 8px right 8px y se oculta el ícono.
- Recordar el módulo y la solapa activos (p. ej. en `UiState.html` / `sessionStorage`).

### Solapas
- Fila flex, gap 8px, padding 16px 24px, `overflow-x:auto`, borde inferior 1px `#e3dccb`.
- Cada solapa: `<button>` radio 14px, padding 10px 16px, borde 1.5px. Dos líneas: ES 14px (600; activa 800) y DE 12px `#7a5f25`.
  - Activa: fondo `#f6efdf`, borde `#b08d45`. Inactiva: fondo `#fff`, borde `#e3dccb`.
  - Contador opcional: pill 22px, fondo `#0a6334`, blanco 12px/800.

### Solapas por rol

| Módulo | Usuario | Operador | Admin |
|---|---|---|---|
| Materiales | Nuevo pedido · Mis pedidos | + Entregas · Ingreso de stock | + Entregas · Compras y recepción · Productos y stock |
| Copias | Nueva solicitud · Mis solicitudes | + Trabajos | + Autorizaciones · Trabajos |

Mapeo de roles al cliente actual: usar `rolActual` (ver `UiBase.html` / `Auth.js`). `usuario` = sin perfil operativo; `general` (cuenta general) = mismas solapas que usuario **más** los campos Nombre / Apellido / Mail del solicitante en Nuevo pedido (no aparece en el prototipo pero debe conservarse, mismo estilo de campos); `operador` y `admin` según perfil. Si una solapa no está permitida para el rol, caer a la primera. Toda autorización sigue validándose en el servidor.

Etiquetas exactas:
- Nuevo pedido · Neue Anfrage
- Mis pedidos · Meine Anfragen
- Entregas · Ausgaben
- Ingreso de stock · Wareneingang
- Compras y recepción · Einkauf & Eingang
- Productos y stock · Produkte & Bestand
- Nueva solicitud · Neuer Auftrag
- Mis solicitudes · Meine Aufträge
- Autorizaciones · Freigaben
- Trabajos · Druckaufträge

Contadores: Mis pedidos = pedidos propios con líneas Pendiente/Listo; Entregas = pedidos Pendiente/Listo; Compras = lotes con saldo; Mis solicitudes = propias no finalizadas/rechazadas; Autorizaciones = SOLICITADO que el usuario puede decidir; Trabajos = AUTORIZADO. Badge del tile = suma de las solapas operativas del rol (para usuario, las propias).

---

## Pantallas

Encabezado común de cada solapa: `h2` 30px/800 "Título ES" + `<span>` 500 `#7a5f25` "· Titel DE"; debajo, bajada 14px `#56655b` bilingüe ("texto ES. · Text DE."). Gap 20px entre bloques del `main`.

Tarjeta estándar: fondo `#fff`, borde 1px `#e3dccb`, radio 18px, overflow hidden. Cabecera de tarjeta con fondo `#f3efe4`, padding 16px 20px. Filas separadas por borde superior 1px `#e3dccb`, padding 12px 20px.

Pill de estado: radio 999px, padding 5px 12px, 12px/700, borde 1.5px, texto "ES · DE":
| Estado | Texto | Fondo | Texto | Borde |
|---|---|---|---|---|
| Pendiente | Pendiente · Offen | #f6efdf | #5e481b | #ead9b3 |
| Listo para retirar | Listo para retirar · Abholbereit | #e6f1ea | #06421f | #c9e2d2 |
| Retirado | Retirado · Abgeholt | #0a6334 | #fff | #0a6334 |
| Retirado parcial | Retirado parcial · Teilw. abgeholt | #ead9b3 | #5e481b | #ead9b3 |
| Cancelado | Cancelado · Storniert | #fff | #56655b | #e3dccb |
| Recibido / Recibido parcial | Recibido · Erhalten / Recibido parcial · Teilw. erhalten | como Retirado / como Pendiente |
| Copias SOLICITADO | Solicitado · Beantragt | como Pendiente |
| Copias AUTORIZADO | Autorizado · Freigegeben | como Listo |
| Copias FINALIZADO | Listo para retirar · Abholbereit | como Retirado |
| Copias RECHAZADO | Rechazado · Abgelehnt | como Cancelado |

### M1 · Nuevo pedido (todos)
Reemplaza la sección `user-pedido`.
- Toolbar (flex wrap, gap 12px): buscador (flex 1, mín. 220px, borde 1.5px `#e3dccb`, radio 14px, fondo blanco, ícono Lucide `search` 18px, placeholder "Buscar por nombre o ID · Produkt suchen", input 15px padding 13px 0) + toggle "Solo seleccionados · Nur ausgewählte" dentro de caja blanca radio 14px con checkbox 18px `accent-color:#0a6334`.
- Se elimina el `helper-banner`.
- Tarjeta con la grilla:
  - Encabezado de columnas (fondo `#f3efe4`, 12px/700 `#56655b`, padding 12px 20px): "Producto · Produkt" | "ID" (solo desktop) | "Disponible · Verfügbar" (solo operador/admin — mantiene la regla actual de ocultar stock a solicitantes) | "Cantidad · Menge". Columnas: `minmax(0,1fr) 100px 130px 150px`.
  - Fila de categoría (clic = expandir/contraer, arrancan contraídas; se expanden todas al buscar o filtrar seleccionados): círculo 28px `#e6f1ea` con chevron verde que rota 90° al abrir (transition .15s); nombre ES 16px/700 + DE 12px `#7a5f25`; si hay seleccionados, pill verde "N ✓"; a la derecha "N productos · Produkte" 12px `#56655b`. Hover fondo `#f6efdf`.
  - Fila de producto: padding 10px 20px 10px 60px; nombre ES 15px (700 si tiene cantidad) + nombre DE 12px `#56655b`; ID 13px tabular; stock 14px; stepper.
  - Fila seleccionada: fondo `#e6f1ea`.
  - Stepper: contenedor pill (borde 1.5px `#e3dccb`, padding 3px, fondo blanco); botón "−" círculo 32px (móvil 40px) fondo `#f3efe4`, hover `#ead9b3`; input central 40px sin borde, 15px/800, centrado, placeholder "0"; botón "+" círculo verde `#0a6334` con ícono blanco, hover `#08532b`. El input sigue llamando `actualizarCantidadProducto`.
  - Mantener el aviso "Faltan N" (ahora "Faltan N · Fehlen N") como pill dorada (`#ead9b3`/`#5e481b`) cuando corresponda.
- Barra de envío **sticky** (bottom 16px): fondo `#13261b`, texto blanco, radio 18px, padding 14px 16px 14px 24px, sombra `0 10px 30px rgba(19,38,27,.25)`. Texto: "**N** artículos · Artikel  **N** unidades · Stück" (números 22px). Botones: "Vaciar · Leeren" (borde 1.5px rgba(255,255,255,.35), transparente, radio 12px) y "Enviar pedido · Anfrage senden" (fondo dorado `#b08d45`, hover `#7a5f25`, blanco 15px/800, radio 12px, padding 12px 20px, label alineado a la izquierda).
- Al enviar: reemplazar `alert()` por el **toast** (ver Interacciones) y refrescar Mis pedidos.

### M2 · Mis pedidos (todos)
Reemplaza `user-mis-pedidos`. Una tarjeta por pedido: cabecera con ID 16px/700 tabular + fecha 13px `#56655b`. Por línea: producto ES 15px/700 + DE 12px; "Pedido · Bestellt **N**", "Retirado · Abgeholt **N**" (13px `#56655b`, número en `#13261b`); pill de estado. Si la línea es editable (reglas actuales), mostrar el stepper (mismo estilo que M1) + botones chip "Guardar · Speichern" (primario) y "Eliminar · Entfernen" (ghost). Bloqueadas: el motivo como texto 12px `#7a5f25`.

### M3 · Entregas (operador, admin)
Reemplaza `admin-pedidos`. Arriba: buscador (mismo estilo) "Buscar por pedido, solicitante o mail · Suchen" y toggle "Solo con faltantes · Nur mit Fehlmengen". Una tarjeta por pedido:
- Cabecera (padding 16px 20px, sin fondo): avatar 40px círculo `#f6efdf` con iniciales `#5e481b` 13px/800; nombre 16px/700; "RET-… · fecha" 12px `#56655b`; pill de estado.
- Líneas (padding-left 72px): producto 15px; "**N** u. · Stock N"; pill "Faltan N · Fehlen N" si falta stock.
- Pie de acciones (fondo `#faf8f3`, padding 14px 20px, gap 8px): según estado — "Marcar listo · Bereitstellen" (primario, pendiente), "Entregar · Ausgeben" (primario, listo; entrega completa/parcial según la lógica actual — si hoy hay dos botones, mantener ambos: "Entrega completa · Vollständig" / "Entrega parcial · Teilweise"), "Cancelar saldo · Rest stornieren" (ghost; pedir motivo como hoy). "Deshacer preparación · Rückgängig" como ghost cuando aplique.
- Ajuste de stock real (modal existente `ajuste-stock-modal`): mantener, restilizar con el estilo de modal de abajo.

### M4 · Ingreso de stock (operador)
Hoy el operador usa "Nueva reposición" y el servidor lo convierte en ingreso directo. En la UI nueva esa sección se presenta como **Ingreso de stock**: reutilizar la grilla de reposición (misma que M1 pero columna "Referencia · Referenz") con título "Ingreso de stock · Wareneingang", bajada "La mercadería que registrás se suma al stock al instante. · Wird sofort zum Bestand addiert." y botón "Registrar ingreso · Eingang buchen". (El prototipo muestra una versión simplificada de un solo producto; usar la grilla real.)

### M5 · Compras y recepción (admin)
Une `admin-nueva-compra` y `admin-recepcion`. Estructura sugerida: arriba botón primario "Nueva reposición · Neue Nachbestellung" que despliega la grilla de reposición (estilo M1, botón final "Solicitar compra · Einkauf anfragen"); debajo, lista de lotes. Cada lote: tarjeta con cabecera `#f3efe4` "COM-… · fecha" + pill de estado; líneas con "Pedido · Bestellt", "Recibido · Erhalten", "Saldo · Rest"; mantener los inputs actuales de recepción por línea (producto recibido, cantidad, cancelar saldo) con el estilo de campos nuevo; pie con "Recepcionar lote · Charge einbuchen". Filtros: buscador + toggle "Solo con saldo · Nur mit Rest".

### M6 · Productos y stock (admin)
Grid `repeat(auto-fit,minmax(320px,1fr))`, gap 20px.
- Tarjeta "Alta de producto · Neues Produkt" (padding 24px, grid 2 columnas, gap 14px): Categoría · Kategorie, Unidad · Einheit, Nombre ES, Name DE, Stock mínimo · Mindestbestand, Stock inicial · Anfangsbestand; nota 12px "El ID se genera desde la categoría. · Die ID wird aus der Kategorie erzeugt."; botón "Crear producto · Produkt anlegen" → `crearProductoDesdeAdmin()`.
- Tarjeta "Stock bajo · Niedriger Bestand" / "Debajo del mínimo · Unter Mindestbestand": productos con stock < mínimo; por fila nombre 15px/700, "ID · mín. N" 12px, pill dorada con el stock, botón ghost "Ajustar · Anpassen" → abre el modal de ajuste existente. Si el cliente no tiene el mínimo en el catálogo, dejar TODO (no cambiar backend).
- "Actividad reciente · Letzte Aktivität" (hoy `admin-actividad`): agregar como tercera tarjeta en esta solapa, lista simple con el mismo estilo de filas.

### C1 · Nueva solicitud de copias (todos)
Reemplaza el formulario `copias-form`. Grid `minmax(0,1fr) 320px` (móvil 1 columna), gap 20px.
- Tarjeta formulario (padding 24px, flex column gap 20px):
  - Zona de archivo: `<label>` que envuelve el `input[type=file]` oculto; radio 16px, padding 20px, borde 1.5px `#e3dccb`, fondo `#faf8f3`; con archivo elegido → borde `#0a6334`, fondo `#e6f1ea`. Cuadrado 48px radio 14px verde con ícono Lucide `upload` blanco; texto "Elegí un archivo · Datei wählen" (o el nombre del archivo) 15px/700; debajo "PDF, DOC, DOCX, JPG, PNG, TXT, ZIP · máx. 80 MB" 12px. Mantener `validarArchivoCopiasCliente_`.
  - Los `select` y radios actuales se convierten en **botones segmentados** (radio 12px, borde 1.5px, padding 10px 18px, 14px/700; seleccionado: fondo `#0a6334`, borde verde, texto blanco; no seleccionado: blanco, borde `#e3dccb`). Implementar como radios nativos ocultos + label para no romper el `FormData`/`name` actual:
    - Nivel · Stufe: KG Kindergarten / EP Primaria / ES Secundaria
    - Tamaño · Format: A4 / A3 / Oficio Legal
    - Modalidad · Art: Armadas · Geheftet / Apiladas · Gestapelt
    - Doble faz · Beidseitig: Sí · Ja / No · Nein
    - Color · Farbe: Sí · Ja / No · Nein
  - Páginas del original · Seiten, Cantidad de copias · Kopien (2 columnas).
  - Comentario · Kommentar (textarea 3 filas, máx. 500, placeholder "Indicaciones adicionales · Zusätzliche Hinweise").
- Panel resumen (sticky top 16px): fondo `#13261b`, blanco, radio 18px, padding 24px. "Resumen · Übersicht" 13px/700 `#dcc48e`; total grande = páginas × copias, 44px/800, con "páginas impresas · gedruckte Seiten"; línea de especificación ("A4 · 4 pág. × 28 · doble faz · color"); nota de autorización en caja rgba(255,255,255,.08) radio 12px:
  - ES: "ES ingresa autorizada directamente. · ES wird automatisch freigegeben."
  - KG/EP: "KG requiere autorización antes de imprimir. · KG muss vorher freigegeben werden."
  - Sin nivel: "KG y EP requieren autorización; ES ingresa autorizada. · KG/EP brauchen Freigabe, ES nicht."
  - Botón dorado "Enviar solicitud · Auftrag senden" (mismo estilo que Enviar pedido). Al enviar con éxito: toast + ir a la solapa Mis solicitudes.

### C2 · Mis solicitudes (todos)
Tarjeta con filas: cuadrado 44px radio 12px `#e6f1ea` con el nivel (13px/800 `#06421f`); nombre de archivo 15px/700; "COP-… · especificación" 12px; pill de estado. Si fue rechazada, mostrar el motivo debajo 12px `#7a5f25`.

### C3 · Autorizaciones (admin; también autorizadores activos si el cliente lo sabe)
Grid de tarjetas `repeat(auto-fit,minmax(320px,1fr))`, gap 16px. Cada tarjeta (padding 20px, gap 14px): cuadrado nivel en dorado (`#f6efdf`/`#5e481b`), solicitante 15px/700, ID 12px; archivo 15px/700 + especificación 13px; botones "Autorizar · Freigeben" (primario) y "Rechazar · Ablehnen" (ghost → pide motivo obligatorio, máx. 500, como hoy). Vacío: "No hay solicitudes pendientes. · Keine offenen Aufträge." El flujo por enlace con token (`copias-decision-modal`) se mantiene; restilizar el modal.

### C4 · Trabajos (operador, admin)
Reemplaza `admin-copias`. Filtro de estado actual (select) → segmentado: "Por imprimir · Zu drucken" (AUTORIZADO, default), "Solicitadas · Beantragt", "Finalizadas · Fertig", "Rechazadas · Abgelehnt", "Todas · Alle". Filas: cuadrado nivel verde, archivo 15px/700, "solicitante · especificación" 12px, botón ghost "Abrir archivo · Datei öffnen" (link a Drive existente), botón primario "Listo para retirar · Abholbereit" (= finalizar). Vacío: "No hay trabajos en cola. · Keine Aufträge in der Warteschlange."

### Modales (ajuste de stock, decisión de copias)
Backdrop `rgba(19,38,27,.45)`. Tarjeta blanca radio 20px, padding 24px, sombra `0 20px 60px rgba(19,38,27,.25)`, ancho máx. 480px. Título 20px/800 + DE 13px `#7a5f25`. Pie con botones alineados a la derecha: ghost "Cancelar · Abbrechen" y primario.

---

## Interacciones y comportamiento
- **Toast de confirmación** (reemplaza todos los `alert()` de éxito y `mostrarAviso`): en la parte superior del `main`, flex, gap 12px, padding 12px 16px, radio 14px, fondo `#e6f1ea`, texto `#06421f` 14px/700, ícono Lucide `check` 20px, botón de texto "Cerrar · Schließen". Mensajes bilingües, p. ej. "Pedido RET-123456 registrado. · Anfrage gespeichert." Se limpia al cambiar de solapa. Para errores usar la misma forma con fondo `#f6efdf` y texto `#5e481b`, ícono `alert-circle`.
- **Loading** (`mostrarLoading`): overlay blanco translúcido con texto bilingüe 15px/700 verde; spinner simple verde. Mensaje inicial: "Iniciando Pedidos Gráfica… · Wird gestartet…".
- Cambiar de módulo/solapa no recarga datos si ya están en caché del cliente; el botón "Actualizar · Aktualisieren" (ghost pequeño) queda a la derecha del encabezado de cada solapa de listado.
- Hover: botones y filas clicables tiñen con `#f6efdf` (dorado claro) o el paso oscuro de su color. Focus visible: `outline:2px solid #b08d45; outline-offset:2px` en todo control.
- Deshabilitado: opacidad .45, `cursor:not-allowed`.
- **Responsive** (< 640px): header compacto; tiles en 2 columnas sin ícono; solapas con scroll horizontal; grilla sin columna ID; stepper con botones de 40px; formularios en 1 columna; el panel resumen de copias va debajo del formulario; tocar mínimo 44px.
- Validaciones: mantener todas las actuales; mensajes de error bilingües.

## Estado de cliente (en `UiState.html`)
- `moduloActivo` ('materiales' | 'copias'), `solapaActiva` por módulo; persistir en `sessionStorage`.
- Todo lo demás (`cantidadesPedido`, `categoriasPedidoExpandido`, `rolActual`, listas) se mantiene como está.
- Función `solapasPermitidas(modulo, rolActual)` según la tabla de roles, y `renderNavegacion()` que dibuja tiles + solapas y muestra/oculta los contenedores de cada solapa.

## Design tokens (reemplazar el `:root` de `Estilos.html`)
```css
:root {
  /* Marca: solo verde y dorado */
  --verde: #0a6334;        --verde-600: #08532b;  --verde-700: #06421f;
  --verde-100: #e6f1ea;    --verde-200: #c9e2d2;
  --dorado: #b08d45;       --dorado-700: #7a5f25; --dorado-800: #5e481b;
  --dorado-100: #f6efdf;   --dorado-200: #ead9b3; --dorado-300: #dcc48e;
  /* Neutros (derivados, tinte cálido/verde) */
  --tinta: #13261b;        /* texto principal, barras oscuras */
  --texto-2: #56655b;      /* texto secundario */
  --fondo: #faf8f3;        --superficie: #f3efe4;  --blanco: #ffffff;
  --linea: #e3dccb;
  /* Forma */
  --r-sm: 8px; --r-md: 12px; --r-lg: 14px; --r-xl: 18px; --r-2xl: 24px; --r-pill: 999px;
  --sombra-barra: 0 10px 30px rgba(19,38,27,.25);
  --sombra-modal: 0 20px 60px rgba(19,38,27,.25);
  /* Tipo */
  --font: "Archivo", system-ui, sans-serif;
}
```
- Tipografía: **Archivo** (Google Fonts, pesos 400/500/600/700/800). Escala usada: 12 / 13 / 14 / 15 / 16 / 18 / 20 / 22 / 30 / 44 px. Títulos 800, etiquetas 700, cuerpo 400.
- Espaciado: 4 / 8 / 12 / 16 / 20 / 24 px.
- Botón primario: fondo `--verde`, blanco, radio 12px, 14–15px/700, padding 10px 16px, hover `--verde-600`. Botón de acción principal de envío (pedido/copias): dorado. Ghost: transparente, borde 1.5px `--linea`, texto `--tinta`, hover fondo `--dorado-100`. Labels alineados a la izquierda.
- Campos: borde 1.5px `--linea`, radio 12px, padding 12px 14px, fondo blanco, 15px; focus borde `--verde` + outline dorado. Label 13px/700 arriba, gap 6px.
- Reemplazar las clases viejas (`btn-success`, `btn-light`, `status-pill status-*`, `kpi-card`, `collapsible-*`) por las nuevas; eliminar colores que no sean verde, dorado o los neutros de arriba (nada de rojo/azul).

## Assets
- `assets/goethe-logo.png` — logo apaisado Goethe-Schule (provisto por el usuario). En GAS, subirlo a Drive público del dominio o embeberlo como data URI / SVG oficial desde `https://goethe.edu.ar/wp-content/uploads/2020/03/goethe-schule.svg` si está permitido.
- Íconos: Lucide (inline SVG, stroke 2, `currentColor`): package, printer, search, chevron-right, minus, plus, upload, check, alert-circle, menu.

## Files en este paquete
- `Pedidos Gráfica.dc.html` — prototipo interactivo (abrir en navegador). Toda la maquetación está en estilos inline; la lógica de demo está en la clase `Component` al final del archivo (datos de ejemplo, tabla de solapas por rol `TABS`, etiquetas `TL`, estados `ST`).
- `support.js` — runtime del prototipo (solo para visualizarlo; no va al repo).
- `_ds/…/styles.css` — hoja base del prototipo (tokens sobreescritos en el propio archivo). No va al repo.
- `assets/goethe-logo.png` — logo.

## Checklist de verificación (en la copia de pruebas)
1. Usuario: solo ve las solapas de usuario; no ve stock.
2. Cuenta general: ve campos de solicitante en Nuevo pedido.
3. Operador: Entregas, Ingreso de stock, Trabajos.
4. Admin: todas las solapas de admin.
5. Crear, editar, preparar, entregar (parcial/completa) y cancelar un pedido.
6. Compra, recepción parcial/completa, cancelación de saldo.
7. Copia KG/EP → autorización (en la app y por enlace con token); ES → directo a Trabajos; finalizar.
8. Móvil 390px sin desbordes.
9. Ningún texto visible queda solo en un idioma.
