const MOVIMIENTOS_STOCK_HEADERS = [
  "Timestamp",
  "Usuario",
  "Tipo",
  "ID_Relacionado",
  "Producto_ID",
  "Producto",
  "Cantidad_Delta",
  "Stock_Anterior",
  "Stock_Nuevo",
  "Observacion"
];

function getMovimientosStockSheet_(ss) {
  let sheet = ss.getSheetByName(TABS.MOVIMIENTOS_STOCK);
  if (!sheet) {
    sheet = ss.insertSheet(TABS.MOVIMIENTOS_STOCK);
  }

  const lastColumn = sheet.getLastColumn();
  const existingHeaders = lastColumn > 0
    ? sheet.getRange(1, 1, 1, Math.max(lastColumn, MOVIMIENTOS_STOCK_HEADERS.length)).getValues()[0]
    : [];
  const faltaEncabezado = MOVIMIENTOS_STOCK_HEADERS.some(function(header, index) {
    return String(existingHeaders[index] || "").trim() !== header;
  });

  if (faltaEncabezado) {
    sheet.getRange(1, 1, 1, MOVIMIENTOS_STOCK_HEADERS.length).setValues([MOVIMIENTOS_STOCK_HEADERS]);
  }

  return sheet;
}

function registrarMovimientoStock_(ss, movimiento) {
  if (!movimiento) return;

  const sheet = getMovimientosStockSheet_(ss);
  const user = Session.getActiveUser().getEmail();
  appendRows_(sheet, [[
    new Date(),
    user,
    movimiento.tipo || "",
    movimiento.idRelacionado || "",
    movimiento.productoId || "",
    movimiento.producto || "",
    normalizarCantidad_(movimiento.cantidadDelta),
    normalizarCantidad_(movimiento.stockAnterior),
    normalizarCantidad_(movimiento.stockNuevo),
    movimiento.observacion || ""
  ]]);
}
