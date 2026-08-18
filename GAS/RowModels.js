function obtenerIndicesOperativos_(sheet, schema, sheetName) {
  const indices = obtenerIndicesPorEncabezado_(sheet);
  const resolved = {};

  Object.keys(schema).forEach(key => {
    resolved[key] = obtenerIndiceEncabezado_(indices, schema[key], sheetName);
  });

  return resolved;
}

function obtenerContextoRetiros_(ss) {
  const sheet = getSheetOrThrow_(ss, TABS.RETIROS);
  return {
    sheet: sheet,
    rows: getRows_(sheet),
    indices: obtenerIndicesOperativos_(sheet, COLUMNAS_OPERATIVAS.RETIROS, TABS.RETIROS)
  };
}

function obtenerContextoCompras_(ss) {
  const sheet = getSheetOrThrow_(ss, TABS.COMPRAS);
  return {
    sheet: sheet,
    rows: getRows_(sheet),
    indices: obtenerIndicesOperativos_(sheet, COLUMNAS_OPERATIVAS.COMPRAS, TABS.COMPRAS)
  };
}

function leerFilaRetiro_(fila, indices) {
  return {
    pedidoId: fila[indices.ID_PEDIDO],
    fecha: fila[indices.FECHA],
    solicitante: fila[indices.SOLICITANTE],
    productoNombre: fila[indices.PRODUCTO],
    cantidadLegacy: normalizarCantidad_(fila[indices.CANTIDAD]),
    estado: fila[indices.ESTADO],
    autorizador: fila[indices.AUTORIZADOR],
    entregadoPor: fila[indices.ENTREGADO_POR],
    solicitanteMail: String(fila[indices.SOLICITANTE_MAIL] || "").trim(),
    productoId: String(fila[indices.PRODUCTO_ID] || "").trim(),
    cantidadSolicitada: normalizarCantidad_(fila[indices.CANTIDAD_SOLICITADA]),
    cantidadLista: normalizarCantidad_(fila[indices.CANTIDAD_LISTA]),
    cantidadRetirada: normalizarCantidad_(fila[indices.CANTIDAD_RETIRADA]),
    cantidadPendiente: normalizarCantidad_(fila[indices.CANTIDAD_PENDIENTE]),
    observaciones: fila[indices.OBSERVACIONES] || ""
  };
}

function leerFilaCompra_(fila, indices) {
  return {
    compraId: fila[indices.ID_COMPRA],
    fecha: fila[indices.FECHA],
    solicitante: fila[indices.SOLICITANTE],
    productoSolicitado: fila[indices.PRODUCTO],
    cantidadLegacy: normalizarCantidad_(fila[indices.CANTIDAD]),
    estado: fila[indices.ESTADO],
    autorizador: fila[indices.AUTORIZADOR],
    urlReferencia: fila[indices.URL_REFERENCIA] || "",
    solicitanteMail: String(fila[indices.SOLICITANTE_MAIL] || "").trim(),
    productoSolicitadoId: String(fila[indices.PRODUCTO_SOLICITADO_ID] || "").trim(),
    cantidadSolicitada: normalizarCantidad_(fila[indices.CANTIDAD_SOLICITADA]),
    productoRecibidoId: String(fila[indices.PRODUCTO_RECIBIDO_ID] || "").trim(),
    productoRecibido: fila[indices.PRODUCTO_RECIBIDO] || "",
    cantidadRecibida: normalizarCantidad_(fila[indices.CANTIDAD_RECIBIDA]),
    cantidadPendiente: normalizarCantidad_(fila[indices.CANTIDAD_PENDIENTE]),
    observaciones: fila[indices.OBSERVACIONES] || ""
  };
}

function escribirFilaRetiro_(sheet, rowNumber, indices, data) {
  setValoresPorIndices_(sheet, rowNumber, indices, data);
}

function escribirFilaCompra_(sheet, rowNumber, indices, data) {
  setValoresPorIndices_(sheet, rowNumber, indices, data);
}

function setValoresPorIndices_(sheet, rowNumber, indices, data, filaBase) {
  const maxIndex = Math.max.apply(null, Object.values(indices));
  const fila = (filaBase || sheet.getRange(rowNumber, 1, 1, maxIndex + 1).getValues()[0]).slice();

  while (fila.length <= maxIndex) {
    fila.push("");
  }

  Object.keys(data).forEach(key => {
    if (indices[key] === undefined) return;
    fila[indices[key]] = data[key];
  });

  sheet.getRange(rowNumber, 1, 1, maxIndex + 1).setValues([fila]);
}

function appendRows_(sheet, rows) {
  if (!rows || !rows.length) return;
  const startRow = sheet.getLastRow() + 1;
  const width = rows.reduce(function(max, row) {
    return Math.max(max, row.length);
  }, 0);
  const normalizedRows = rows.map(function(row) {
    const copy = row.slice();
    while (copy.length < width) {
      copy.push("");
    }
    return copy;
  });

  sheet.getRange(startRow, 1, normalizedRows.length, width).setValues(normalizedRows);
}

function crearFilaRetiroNueva_(indices, values) {
  const maxIndex = Math.max.apply(null, Object.values(indices));
  const fila = new Array(maxIndex + 1).fill("");

  Object.keys(values).forEach(key => {
    if (indices[key] === undefined) return;
    fila[indices[key]] = values[key];
  });

  return fila;
}

function crearFilaCompraNueva_(indices, values) {
  const maxIndex = Math.max.apply(null, Object.values(indices));
  const fila = new Array(maxIndex + 1).fill("");

  Object.keys(values).forEach(key => {
    if (indices[key] === undefined) return;
    fila[indices[key]] = values[key];
  });

  return fila;
}
