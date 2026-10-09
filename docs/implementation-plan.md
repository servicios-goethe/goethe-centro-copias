# Plan de implementación del feedback de usuarios

## Plan adicional — 2026-10-09

### A. Corrección controlada de entregas mal cargadas

**Diagnóstico:** no conviene borrar filas directamente del Spreadsheet. Las filas de `Pedidos_Retiro` sostienen el historial, las reservas, los movimientos de stock y la auditoría. Un borrado manual puede dejar stock comprometido o movimientos sin correlación.

**Implementación propuesta:** agregar una acción administrativa de **Anular pedido** (baja lógica) que exija confirmación y motivo, marque las líneas como `Cancelado`, ponga en cero únicamente los saldos todavía no retirados y registre usuario, fecha, pedido y motivo en `Log_Auditoria`. Los IDs recibidos para revisión son `RET-1791464629604` y `RET-1786559018968`; no se modificaron.

**Reglas de integridad:**

- Si el pedido no tiene cantidades retiradas, se puede anular completo de forma segura.
- Si ya hubo retiro, no se anula automáticamente: requiere una operación de reversión de stock separada y auditada.
- No se elimina ninguna fila física.
- Para las dos entregas actuales, primero se deben identificar `ID_Pedido`, producto, estado y cantidades; luego aplicar la acción controlada o corregirlas con el procedimiento de reversión.

### B. BO, permisos y feedback de trabajos

**Estado actual:** `BO` ingresa automáticamente como `AUTORIZADO`, mientras `KG` y `EP` requieren autorización. Esto contradice parcialmente el pedido de “poder autorizar Back Office”.

**Decisión funcional pendiente:**

- Opción recomendada: mantener BO automático y permitir que operador/administrador lo procese y finalice.
- Opción alternativa: agregar una configuración `BO_REQUIERE_AUTORIZACION`; cuando esté activa, BO pasa a `SOLICITADO` y los usuarios autorizados pueden decidirlo.

**Feedback propuesto:**

- Materiales: conservar el aviso `Listo para retirar` y agregar correo al completar una entrega, además de correo específico para entrega parcial con saldo pendiente.
- Copias: conservar la notificación de finalización; verificar que BO automático llegue a la bandeja de trabajos y pueda finalizarse.
- En todos los casos, el correo se envía sólo ante una transición real y una falla de correo se devuelve como advertencia sin deshacer la operación.

### C. Refresco automático cada 5 segundos

**Estado actual:** copias administrativas refresca cada 5 minutos; el dashboard de materiales no tiene temporizador periódico.

**Implementación adoptada:**

- No se activa refresco automático: reemplazar la grilla mientras se opera podría perder datos no guardados.
- Agregar botones manuales `Refrescar pedidos` y `Refrescar solicitudes` en los paneles operativos.
- Mantener guardas de solicitud en curso para no solapar llamadas `google.script.run`.
- Actualizar las listas propias después de una mutación; el usuario también dispone de `Refrescar solicitudes`.

**Criterios de aceptación:** una entrega o autorización realizada desde otra sesión aparece al pulsar el botón correspondiente; durante una edición no se pierde ningún valor, no se duplican solicitudes y los filtros permanecen aplicados.

### Orden de ejecución

1. Identificar y corregir las dos entregas actuales con baja lógica o procedimiento de reversión.
2. Implementar feedback de entrega completa/parcial.
3. Implementar refresco protegido de materiales y copias.
4. Resolver la decisión de autorización BO y, si corresponde, activar la configuración alternativa.
5. Validar en desarrollo y recién después publicar en producción.

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

**Estado:** Completado y validado localmente.

**Objetivo:** registrar descripción y enlace opcional con validación cliente/servidor, sin confundir una solicitud informativa con stock físico inexistente.

**Archivos afectados:** `GAS/UiPedidos.html`, `GAS/Pedidos.js`.

**Criterio de aceptación/prueba:** se admite un pedido solo con material no listado; el enlace requiere descripción y esquema HTTP(S); el operador puede identificar la línea y no se habilitan acciones de stock incompatibles.

## Hito 3 — Stock visible y edición del operador

**Estado:** Completado y validado localmente.

**Objetivo:** mostrar stock inicial disponible, cantidad solicitada y stock actual disponible, y permitir correcciones auditadas antes de preparar o retirar.

**Archivos afectados:** `GAS/Pedidos.js`, `GAS/UiAdmin.html`.

**Criterio de aceptación/prueba:** las tres métricas coinciden con las reservas del resto de pedidos; solo líneas pendientes sin preparación/retiro son editables; dos pedidos con el mismo producto usan controles DOM distintos; una corrección actualiza cantidades, auditoría y tarjeta.

## Hito 4 — Tarjetas operativas sin superposición

**Estado:** Completado y validado localmente.

**Objetivo:** corregir el layout responsivo y simplificar el texto del perfil operador.

**Archivos afectados:** `GAS/Estilos.html`, `GAS/UiBase.html`.

**Criterio de aceptación/prueba:** tarjetas, métricas, botones y campos no se superponen ni quedan recortados en escritorio y móvil; el texto operativo describe las métricas visibles.

## Hito 5 — Datos del solicitante de copias

**Estado:** Completado y validado localmente.

**Objetivo:** persistir el nombre con compatibilidad hacia filas históricas y mantener la decisión estructural documentada.

**Archivos afectados:** `GAS/Copias.js`, `docs/adr/ADR-001-copias-solicitante-nombre.md`.

**Criterio de aceptación/prueba:** una hoja nueva crea `Solicitante_Nombre`; una hoja existente agrega el encabezado sin reordenar columnas; las solicitudes nuevas exigen nombre y las históricas usan email como respaldo.

## Hito 6 — Vista simplificada de copias

**Estado:** Completado y validado localmente.

**Objetivo:** capturar nombre y mostrar solicitante y fecha/hora con menor densidad visual.

**Archivos afectados:** `GAS/Index.html`, `GAS/UiCopias.html`.

**Criterio de aceptación/prueba:** el formulario envía `solicitanteNombre`; las tarjetas muestran nombre, fecha/hora y un resumen compacto; búsqueda por nombre y fallback por email funcionan.

## Hito 7 — Correo solo al quedar listo

**Estado:** Completado y validado localmente.

**Objetivo:** eliminar notificaciones de creación y retiro de pedidos y conservar únicamente la transición efectiva a `Listo para retirar`.

**Archivos afectados:** `GAS/Pedidos.js`, `GAS/MailTemplates.js`.

**Criterio de aceptación/prueba:** crear, editar, retirar o entregar no invoca `MailApp`; pasar una línea de otro estado a `Listo para retirar` envía una notificación; repetir una acción sin transición no duplica el correo.

## Hito 8 — Documentación y verificación final

**Estado:** Completado y validado localmente.

**Objetivo:** sincronizar reglas y arquitectura, eliminar contradicciones y ejecutar las puertas de calidad disponibles.

**Archivos afectados:** `docs/business-rules.md`, `docs/gas-architecture.md`.

**Criterio de aceptación/prueba:** documentación consistente con el código; `git diff --check` limpio; sintaxis de todos los `.js` y bloques `Ui*.html` válida; checklist manual preparado para GAS sin desplegar ni modificar recursos remotos.
