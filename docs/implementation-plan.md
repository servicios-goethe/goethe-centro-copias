# Plan de implementación del feedback de usuarios

## Estado de partida

- Rama `main` sincronizada con `origin/main`, con cambios locales previos en once archivos versionados y un ADR nuevo.
- `git diff --check` no reporta errores de espacios y los archivos JavaScript, incluidos los bloques de `Ui*.html`, superan validación sintáctica con Node.js.
- El formulario se compone en `Index.html`; `UiPedidos.html` contiene su comportamiento cliente. Ambos son una dependencia necesaria aunque el requerimiento nombre solo al segundo.
- No están versionados `knowledge/architecture/`, `knowledge/security/threat-model.md`, `CLAUDE.md`, `permissions.md` ni los skills indicados. Se usa como referencia disponible `CONVENTIONS.md`, `docs/gas-architecture.md` y `docs/business-rules.md`.

## Hito 1 — Formulario de nuevo pedido

**Estado:** Completado y validado localmente.

**Objetivo:** validar y completar el encabezado simplificado, la fila de identidad, la tipografía y el resaltado verde de cantidades.

**Archivos afectados:** `GAS/Index.html`, `GAS/Estilos.html`.

**Criterio de aceptación/prueba:** sin banners redundantes; nombre completo y email en una fila de escritorio y una columna móvil; inputs de cantidad con borde verde, legibles y sin desbordes a 900 px o menos.

## Hito 2 — Material no listado

**Objetivo:** registrar descripción y enlace opcional con validación cliente/servidor, sin confundir una solicitud informativa con stock físico inexistente.

**Archivos afectados:** `GAS/UiPedidos.html`, `GAS/Pedidos.js`.

**Criterio de aceptación/prueba:** se admite un pedido solo con material no listado; el enlace requiere descripción y esquema HTTP(S); el operador puede identificar la línea y no se habilitan acciones de stock incompatibles.

## Hito 3 — Stock visible y edición del operador

**Objetivo:** mostrar stock inicial disponible, cantidad solicitada y stock actual disponible, y permitir correcciones auditadas antes de preparar o retirar.

**Archivos afectados:** `GAS/Pedidos.js`, `GAS/UiAdmin.html`.

**Criterio de aceptación/prueba:** las tres métricas coinciden con las reservas del resto de pedidos; solo líneas pendientes sin preparación/retiro son editables; dos pedidos con el mismo producto usan controles DOM distintos; una corrección actualiza cantidades, auditoría y tarjeta.

## Hito 4 — Tarjetas operativas sin superposición

**Objetivo:** corregir el layout responsivo y simplificar el texto del perfil operador.

**Archivos afectados:** `GAS/Estilos.html`, `GAS/UiBase.html`.

**Criterio de aceptación/prueba:** tarjetas, métricas, botones y campos no se superponen ni quedan recortados en escritorio y móvil; el texto operativo describe las métricas visibles.

## Hito 5 — Datos del solicitante de copias

**Objetivo:** persistir el nombre con compatibilidad hacia filas históricas y mantener la decisión estructural documentada.

**Archivos afectados:** `GAS/Copias.js`, `docs/adr/ADR-001-copias-solicitante-nombre.md`.

**Criterio de aceptación/prueba:** una hoja nueva crea `Solicitante_Nombre`; una hoja existente agrega el encabezado sin reordenar columnas; las solicitudes nuevas exigen nombre y las históricas usan email como respaldo.

## Hito 6 — Vista simplificada de copias

**Objetivo:** capturar nombre y mostrar solicitante y fecha/hora con menor densidad visual.

**Archivos afectados:** `GAS/Index.html`, `GAS/UiCopias.html`.

**Criterio de aceptación/prueba:** el formulario envía `solicitanteNombre`; las tarjetas muestran nombre, fecha/hora y un resumen compacto; búsqueda por nombre y fallback por email funcionan.

## Hito 7 — Correo solo al quedar listo

**Objetivo:** eliminar notificaciones de creación y retiro de pedidos y conservar únicamente la transición efectiva a `Listo para retirar`.

**Archivos afectados:** `GAS/Pedidos.js`, `GAS/MailTemplates.js`.

**Criterio de aceptación/prueba:** crear, editar, retirar o entregar no invoca `MailApp`; pasar una línea de otro estado a `Listo para retirar` envía una notificación; repetir una acción sin transición no duplica el correo.

## Hito 8 — Documentación y verificación final

**Objetivo:** sincronizar reglas y arquitectura, eliminar contradicciones y ejecutar las puertas de calidad disponibles.

**Archivos afectados:** `docs/business-rules.md`, `docs/gas-architecture.md`.

**Criterio de aceptación/prueba:** documentación consistente con el código; `git diff --check` limpio; sintaxis de todos los `.js` y bloques `Ui*.html` válida; checklist manual preparado para GAS sin desplegar ni modificar recursos remotos.
