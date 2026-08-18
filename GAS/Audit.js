function registrarAuditoria_(ss, accion, detalle) {
  const hojaLog = ss.getSheetByName(TABS.LOG);
  if (!hojaLog) return;

  const user = Session.getActiveUser().getEmail();
  appendRows_(hojaLog, [[
    new Date(),
    user,
    accion,
    JSON.stringify(detalle || {})
  ]]);
}

function parsearDetalleAuditoria_(valor) {
  if (!valor) return {};

  try {
    return JSON.parse(valor);
  } catch (error) {
    return { raw: String(valor) };
  }
}

function describirAccionAuditoria_(accion, detalle) {
  const loteId = detalle && detalle.loteId ? detalle.loteId : "";

  switch (accion) {
    case "pedido_registrado":
      return `Pedido registrado${loteId ? ` (${loteId})` : ""}.`;
    case "pedido_listo_retirar":
      return `Pedido listo para retirar${loteId ? ` (${loteId})` : ""}.`;
    case "pedido_retirado":
      return `Pedido retirado${loteId ? ` (${loteId})` : ""}.`;
    case "pedido_entregado_completo":
      return `Pedido entregado completo${loteId ? ` (${loteId})` : ""}.`;
    case "pedido_cancelado":
      return `Pedido cancelado${loteId ? ` (${loteId})` : ""}.`;
    case "pedido_saldo_cancelado":
      return `Saldo cancelado${loteId ? ` en ${loteId}` : ""}.`;
    case "pedido_item_actualizado":
      return `Cantidad actualizada${loteId ? ` en ${loteId}` : ""}: ${detalle.producto || "producto"}.`;
    case "compra_registrada":
      return `Compra registrada${loteId ? ` (${loteId})` : ""}.`;
    case "compra_recibida":
      return `Compra recepcionada${loteId ? ` (${loteId})` : ""}.`;
    case "compra_saldo_cancelado":
      return `Saldo de compra cancelado${loteId ? ` (${loteId})` : ""}.`;
    case "stock_ajustado":
      return `Stock ajustado${detalle && detalle.producto ? `: ${detalle.producto}` : ""}${loteId ? ` en ${loteId}` : ""}.`;
    default:
      return accion;
  }
}

function obtenerActividadReciente(limite) {
  asegurarAdmin_();

  const ss = getSpreadsheet_();
  return obtenerActividadRecienteDesdeSpreadsheet_(ss, limite);
}

function obtenerActividadRecienteDesdeSpreadsheet_(ss, limite) {
  const hojaLog = ss.getSheetByName(TABS.LOG);
  if (!hojaLog) return [];

  const cantidad = Math.max(1, Math.min(normalizarCantidad_(limite) || 12, 30));
  const lastRow = hojaLog.getLastRow();
  if (lastRow <= 0) return [];

  const lastColumn = Math.max(hojaLog.getLastColumn(), 4);
  const header = hojaLog.getRange(1, 1, 1, lastColumn).getValues()[0];
  const tieneEncabezado = String(header[2] || "").toLowerCase() === "accion";
  const primeraFilaDatos = tieneEncabezado ? 2 : 1;
  if (lastRow < primeraFilaDatos) return [];

  const startRow = Math.max(primeraFilaDatos, lastRow - cantidad + 1);
  const filas = hojaLog.getRange(startRow, 1, lastRow - startRow + 1, lastColumn).getValues();

  return filas
    .filter(fila => fila[0] || fila[1] || fila[2] || fila[3])
    .reverse()
    .slice(0, cantidad)
    .map(fila => {
      const detalle = parsearDetalleAuditoria_(fila[3]);

      return {
        fecha: fila[0] ? Utilities.formatDate(new Date(fila[0]), CONFIG.TIMEZONE, "dd/MM HH:mm") : "",
        usuario: fila[1] || "",
        accion: fila[2] || "",
        detalle: detalle,
        descripcion: describirAccionAuditoria_(fila[2], detalle)
      };
    });
}
