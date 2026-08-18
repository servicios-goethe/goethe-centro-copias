function normalizarCantidad_(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function obtenerIndicesPorEncabezado_(sheet) {
  const encabezados = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const indices = {};

  encabezados.forEach((encabezado, index) => {
    indices[String(encabezado).trim()] = index;
  });

  return indices;
}

function normalizarEncabezadoHoja_(valor) {
  return String(valor || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function obtenerIndiceEncabezado_(indices, aliases, sheetName) {
  for (let i = 0; i < aliases.length; i++) {
    if (Object.prototype.hasOwnProperty.call(indices, aliases[i])) {
      return indices[aliases[i]];
    }
  }

  const normalizados = {};
  Object.keys(indices).forEach(function(encabezado) {
    normalizados[normalizarEncabezadoHoja_(encabezado)] = indices[encabezado];
  });

  for (let i = 0; i < aliases.length; i++) {
    const aliasNormalizado = normalizarEncabezadoHoja_(aliases[i]);
    if (Object.prototype.hasOwnProperty.call(normalizados, aliasNormalizado)) {
      return normalizados[aliasNormalizado];
    }
  }

  throw new Error(`Falta una columna esperada en la hoja "${sheetName}": ${aliases.join(" / ")}.`);
}

function obtenerNombreProducto_(producto) {
  const nombreEs = String(producto.nombreEs || "").trim();
  const nombreDe = String(producto.nombreDe || "").trim();

  if (nombreEs && nombreDe) return `${nombreEs} / ${nombreDe}`;
  return nombreEs || nombreDe || `Producto ${producto.id}`;
}

function obtenerMapaProductos_(ss) {
  const sheet = getSheetOrThrow_(ss, TABS.PRODUCTOS);
  const indices = obtenerIndicesPorEncabezado_(sheet);
  const data = getRows_(sheet);
  const idxId = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.ID, TABS.PRODUCTOS);
  const idxNombreEs = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_ES, TABS.PRODUCTOS);
  const idxNombreDe = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_DE, TABS.PRODUCTOS);
  const idxCategoria = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.CATEGORIA, TABS.PRODUCTOS);
  const idxStockMinimo = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.STOCK_MINIMO, TABS.PRODUCTOS);
  const idxUnidadMedida = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.UNIDAD_MEDIDA, TABS.PRODUCTOS);
  const mapa = {};

  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    const id = String(fila[idxId] || "").trim();
    if (!id) continue;

    mapa[id] = {
      id: id,
      nombreEs: fila[idxNombreEs] || "",
      nombreDe: fila[idxNombreDe] || "",
      categoria: fila[idxCategoria] || "",
      stockMinimo: normalizarCantidad_(fila[idxStockMinimo]),
      unidadMedida: fila[idxUnidadMedida] || ""
    };
  }

  return mapa;
}

function obtenerDiagnosticoCatalogo_(ss, productosConStock) {
  const sheet = getSheetOrThrow_(ss, TABS.PRODUCTOS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(header) {
    return String(header || "").trim();
  });
  const indices = obtenerIndicesPorEncabezado_(sheet);
  const idxCategoria = obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.CATEGORIA, TABS.PRODUCTOS);
  const data = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), sheet.getLastColumn()).getValues();
  const categoriasHoja = {};
  const categoriasCatalogo = {};

  data.forEach(function(row) {
    const categoria = String(row[idxCategoria] || "").trim();
    if (categoria) categoriasHoja[categoria] = (categoriasHoja[categoria] || 0) + 1;
  });

  (productosConStock || []).forEach(function(producto) {
    const categoria = String(producto.categoria || "").trim() || "Sin categoria";
    categoriasCatalogo[categoria] = (categoriasCatalogo[categoria] || 0) + 1;
  });

  return {
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    productosSheet: TABS.PRODUCTOS,
    headers: headers,
    categoriaHeaderIndex: idxCategoria + 1,
    categoriasHoja: categoriasHoja,
    categoriasCatalogo: categoriasCatalogo
  };
}

function obtenerMapaStockPorId_(ss) {
  const productos = obtenerMapaProductos_(ss);
  const sheet = getSheetOrThrow_(ss, TABS.STOCK);
  const indices = obtenerIndicesPorEncabezado_(sheet);
  const data = getRows_(sheet);
  const idxId = obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ID, TABS.STOCK);
  const idxCantidadActual = obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.CANTIDAD_ACTUAL, TABS.STOCK);
  const idxUltimaActualizacion = obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ULTIMA_ACTUALIZACION, TABS.STOCK);
  const mapa = {};

  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    const id = String(fila[idxId] || "").trim();
    if (!id) continue;

    const producto = productos[id] || { id: id, nombreEs: "", nombreDe: "", categoria: "", unidadMedida: "" };
    mapa[id] = {
      fila: i + 1,
      id: id,
      nombreEs: producto.nombreEs,
      nombreDe: producto.nombreDe,
      nombre: obtenerNombreProducto_(producto),
      categoria: producto.categoria,
      unidadMedida: producto.unidadMedida,
      stock: normalizarCantidad_(fila[idxCantidadActual]),
      ultimaActualizacion: fila[idxUltimaActualizacion] || ""
    };
  }

  return mapa;
}

function obtenerProductoPorNombreHistorico_(nombreGuardado, productosMap) {
  const nombreNormalizado = String(nombreGuardado || "").trim().toLowerCase();
  const productos = Object.values(productosMap);

  return productos.find(producto => {
    const display = obtenerNombreProducto_(producto).toLowerCase();
    const es = String(producto.nombreEs || "").trim().toLowerCase();
    const de = String(producto.nombreDe || "").trim().toLowerCase();
    return nombreNormalizado === display || nombreNormalizado === es || nombreNormalizado === de;
  }) || null;
}

function obtenerProductoDeFila_(fila, productosMap, columnaId, columnaNombre) {
  const idProducto = String(fila[columnaId] || "").trim();
  const producto = idProducto ? productosMap[idProducto] : obtenerProductoPorNombreHistorico_(fila[columnaNombre], productosMap);

  return {
    idProducto: idProducto,
    producto: producto
  };
}

function consolidarArticulosPorId_(listaArticulos) {
  const acumulado = {};

  (listaArticulos || []).forEach(art => {
    const id = String(art.id || "").trim();
    const cantidad = normalizarCantidad_(art.cantidad);
    if (!id || cantidad <= 0) return;

    if (!acumulado[id]) {
      acumulado[id] = { id: id, cantidad: 0 };
    }

    acumulado[id].cantidad += cantidad;
  });

  return Object.values(acumulado);
}

function consolidarPedidosPendientesPorId_(rows, indices) {
  const pendientes = {};
  const idx = indices || COLUMNAS.RETIROS;

  for (let i = 1; i < rows.length; i++) {
    const fila = rows[i];
    const estado = indices ? fila[idx.ESTADO] : fila[idx.ESTADO];
    if (estado !== ESTADOS.RETIRO_PENDIENTE && estado !== ESTADOS.RETIRO_LISTO && estado !== ESTADOS.RETIRO_RETIRADO_PARCIAL) continue;

    const idProducto = String(fila[indices ? idx.PRODUCTO_ID : idx.PRODUCTO_ID] || "").trim();
    if (!idProducto) continue;

    const cantidad = indices
      ? normalizarCantidad_(fila[idx.CANTIDAD_PENDIENTE]) + normalizarCantidad_(fila[idx.CANTIDAD_LISTA])
      : normalizarCantidad_(fila[idx.CANTIDAD]);
    pendientes[idProducto] = (pendientes[idProducto] || 0) + cantidad;
  }

  return pendientes;
}

function consolidarPedidosPendientesPorProductoYLote_(rows, indices) {
  const pendientes = {};
  const idx = indices || COLUMNAS.RETIROS;

  for (let i = 1; i < rows.length; i++) {
    const fila = rows[i];
    const estado = fila[indices ? idx.ESTADO : idx.ESTADO];
    if (estado !== ESTADOS.RETIRO_PENDIENTE && estado !== ESTADOS.RETIRO_LISTO && estado !== ESTADOS.RETIRO_RETIRADO_PARCIAL) continue;

    const idProducto = String(fila[indices ? idx.PRODUCTO_ID : idx.PRODUCTO_ID] || "").trim();
    const idLote = String(fila[indices ? idx.ID_PEDIDO : idx.ID_LOTE] || "").trim();
    if (!idProducto || !idLote) continue;

    if (!pendientes[idProducto]) {
      pendientes[idProducto] = {};
    }

    const cantidad = indices
      ? normalizarCantidad_(fila[idx.CANTIDAD_PENDIENTE]) + normalizarCantidad_(fila[idx.CANTIDAD_LISTA])
      : normalizarCantidad_(fila[idx.CANTIDAD]);
    pendientes[idProducto][idLote] = (pendientes[idProducto][idLote] || 0) + cantidad;
  }

  return pendientes;
}

function calcularStockDisponible_(stockFisico, stockComprometido) {
  return Math.max(normalizarCantidad_(stockFisico) - normalizarCantidad_(stockComprometido), 0);
}

function normalizarClaveProducto_(valor) {
  return String(valor || "")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ");
}

function normalizarPrefijoProducto_(categoria) {
  const base = String(categoria || "PROD")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "");
  return (base || "PROD").slice(0, 4);
}

function generarIdProducto_(productosMap, categoria) {
  const prefijo = normalizarPrefijoProducto_(categoria);
  let maximo = 0;

  Object.keys(productosMap || {}).forEach(function(id) {
    const match = String(id || "").match(new RegExp(`^${prefijo}[-_ ]?(\\d+)$`, "i"));
    if (match) {
      maximo = Math.max(maximo, normalizarCantidad_(match[1]));
    }
  });

  return `${prefijo}-${String(maximo + 1).padStart(3, "0")}`;
}

function crearFilaProductoNueva_(indices, values) {
  const maxIndex = Math.max.apply(null, [
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.ID, TABS.PRODUCTOS),
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_ES, TABS.PRODUCTOS),
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_DE, TABS.PRODUCTOS),
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.CATEGORIA, TABS.PRODUCTOS),
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.STOCK_MINIMO, TABS.PRODUCTOS),
    obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.UNIDAD_MEDIDA, TABS.PRODUCTOS)
  ]);
  const fila = new Array(maxIndex + 1).fill("");

  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.ID, TABS.PRODUCTOS)] = values.ID;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_ES, TABS.PRODUCTOS)] = values.NOMBRE_ES;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.NOMBRE_DE, TABS.PRODUCTOS)] = values.NOMBRE_DE;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.CATEGORIA, TABS.PRODUCTOS)] = values.CATEGORIA;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.STOCK_MINIMO, TABS.PRODUCTOS)] = values.STOCK_MINIMO;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.PRODUCTOS.UNIDAD_MEDIDA, TABS.PRODUCTOS)] = values.UNIDAD_MEDIDA;

  return fila;
}

function crearFilaStockNueva_(indices, values) {
  const maxIndex = Math.max.apply(null, [
    obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ID, TABS.STOCK),
    obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.CANTIDAD_ACTUAL, TABS.STOCK),
    obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ULTIMA_ACTUALIZACION, TABS.STOCK)
  ]);
  const fila = new Array(maxIndex + 1).fill("");

  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ID, TABS.STOCK)] = values.ID;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.CANTIDAD_ACTUAL, TABS.STOCK)] = values.CANTIDAD_ACTUAL;
  fila[obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ULTIMA_ACTUALIZACION, TABS.STOCK)] = values.ULTIMA_ACTUALIZACION;

  return fila;
}

function altaProductoDesdeApp(payload) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const productosSheet = getSheetOrThrow_(ss, TABS.PRODUCTOS);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const productosIndices = obtenerIndicesPorEncabezado_(productosSheet);
    const stockIndices = obtenerIndicesPorEncabezado_(stockSheet);
    const productosMap = obtenerMapaProductos_(ss);
    const stockMap = obtenerMapaStockPorId_(ss);
    const data = payload || {};
    const categoria = String(data.categoria || "").trim();
    const nombreEs = String(data.nombreEs || "").trim();
    const nombreDe = String(data.nombreDe || "").trim();
    const unidadMedida = String(data.unidadMedida || "unidad").trim() || "unidad";
    const stockMinimo = Math.max(normalizarCantidad_(data.stockMinimo), 0);
    const stockInicial = Math.max(normalizarCantidad_(data.stockInicial), 0);
    const idProducto = String(data.id || "").trim() || generarIdProducto_(productosMap, categoria);

    if (!categoria) {
      throw new Error("Ingresa una categoria para el producto.");
    }
    if (!nombreEs && !nombreDe) {
      throw new Error("Ingresa al menos un nombre para el producto.");
    }
    if (productosMap[idProducto] || stockMap[idProducto]) {
      throw new Error(`Ya existe un producto con ID ${idProducto}.`);
    }

    const nombreEsKey = normalizarClaveProducto_(nombreEs);
    const nombreDeKey = normalizarClaveProducto_(nombreDe);
    const duplicado = Object.values(productosMap).find(function(producto) {
      const existenteEs = normalizarClaveProducto_(producto.nombreEs);
      const existenteDe = normalizarClaveProducto_(producto.nombreDe);
      return (nombreEsKey && (nombreEsKey === existenteEs || nombreEsKey === existenteDe))
        || (nombreDeKey && (nombreDeKey === existenteEs || nombreDeKey === existenteDe));
    });

    if (duplicado) {
      throw new Error(`Ya existe un producto similar: ${obtenerNombreProducto_(duplicado)}.`);
    }

    appendRows_(productosSheet, [crearFilaProductoNueva_(productosIndices, {
      ID: idProducto,
      NOMBRE_ES: nombreEs,
      NOMBRE_DE: nombreDe,
      CATEGORIA: categoria,
      STOCK_MINIMO: stockMinimo,
      UNIDAD_MEDIDA: unidadMedida
    })]);
    appendRows_(stockSheet, [crearFilaStockNueva_(stockIndices, {
      ID: idProducto,
      CANTIDAD_ACTUAL: stockInicial,
      ULTIMA_ACTUALIZACION: new Date()
    })]);

    registrarAuditoria_(ss, "producto_alta", {
      productoId: idProducto,
      nombreEs: nombreEs,
      nombreDe: nombreDe,
      categoria: categoria,
      stockInicial: stockInicial,
      admin: admin.email
    });

    if (stockInicial > 0) {
      registrarMovimientoStock_(ss, {
        tipo: "alta_producto",
        idRelacionado: idProducto,
        productoId: idProducto,
        producto: obtenerNombreProducto_({ id: idProducto, nombreEs: nombreEs, nombreDe: nombreDe }),
        cantidadDelta: stockInicial,
        stockAnterior: 0,
        stockNuevo: stockInicial,
        observacion: `Alta de producto por ${admin.email}`
      });
    }

    bumpDataVersion_();
    return {
      mensaje: `Producto ${idProducto} creado correctamente.`,
      producto: {
        id: idProducto,
        nombre: obtenerNombreProducto_({ id: idProducto, nombreEs: nombreEs, nombreDe: nombreDe }),
        nombreEs: nombreEs,
        nombreDe: nombreDe,
        categoria: categoria,
        stock: stockInicial,
        stockFisico: stockInicial,
        stockComprometido: 0,
        unidadMedida: unidadMedida
      }
    };
  });
}

function validarStockDisponible_(items, stockMap, stockComprometidoMap) {
  const errores = [];

  items.forEach(item => {
    const stockItem = stockMap[item.id];

    if (!stockItem) {
      errores.push(`El producto con ID ${item.id} no existe en Stock.`);
      return;
    }

    const comprometido = stockComprometidoMap && stockComprometidoMap[item.id] ? stockComprometidoMap[item.id] : 0;
    const disponible = stockItem.stock - comprometido;

    if (item.cantidad > disponible) {
      errores.push(`${stockItem.nombre}: solicitado ${item.cantidad}, disponible ${disponible}.`);
    }
  });

  return errores;
}

function actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, nuevoStock) {
  const stockAnterior = normalizarCantidad_(stockItem.stock);
  const minIndex = Math.min(stockIndices.cantidadActual, stockIndices.ultimaActualizacion);
  const maxIndex = Math.max(stockIndices.cantidadActual, stockIndices.ultimaActualizacion);
  const width = maxIndex - minIndex + 1;
  const values = stockSheet.getRange(stockItem.fila, minIndex + 1, 1, width).getValues()[0];

  values[stockIndices.cantidadActual - minIndex] = nuevoStock;
  values[stockIndices.ultimaActualizacion - minIndex] = new Date();
  stockSheet.getRange(stockItem.fila, minIndex + 1, 1, width).setValues([values]);
  stockItem.stock = nuevoStock;

  return {
    stockAnterior: stockAnterior,
    stockNuevo: nuevoStock,
    cantidadDelta: nuevoStock - stockAnterior
  };
}

function obtenerIndicesStock_(sheet) {
  const indices = obtenerIndicesPorEncabezado_(sheet);

  return {
    cantidadActual: obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.CANTIDAD_ACTUAL, TABS.STOCK),
    ultimaActualizacion: obtenerIndiceEncabezado_(indices, COLUMNAS.STOCK.ULTIMA_ACTUALIZACION, TABS.STOCK)
  };
}

function obtenerProductosConStock() {
  const ss = getSpreadsheet_();
  const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
  const productos = obtenerProductosConStockDesdeSpreadsheet_(ss);
  return role.isAdmin ? productos : ocultarStockParaSolicitante_(productos);
}

function obtenerProductosConStockDesdeSpreadsheet_(ss) {
  const cacheKey = buildCacheKey_("productos_stock_v3");
  const cached = getCachedJson_(cacheKey);
  if (cached) return cached;

  const stockMap = obtenerMapaStockPorId_(ss);
  const retirosCtx = obtenerContextoRetiros_(ss);
  const stockComprometido = consolidarPedidosPendientesPorId_(retirosCtx.rows, retirosCtx.indices);

  return putCachedJson_(cacheKey, Object.values(stockMap).map(producto => ({
    id: producto.id,
    nombre: producto.nombre,
    nombreEs: producto.nombreEs,
    nombreDe: producto.nombreDe,
    categoria: producto.categoria,
    unidadMedida: producto.unidadMedida,
    stock: calcularStockDisponible_(producto.stock, stockComprometido[producto.id] || 0),
    stockFisico: producto.stock,
    stockComprometido: stockComprometido[producto.id] || 0
  })), CONFIG.CACHE_TTL_PRODUCTOS);
}

function ocultarStockParaSolicitante_(productos) {
  return (productos || []).map(producto => ({
    id: producto.id,
    nombre: producto.nombre,
    nombreEs: producto.nombreEs,
    nombreDe: producto.nombreDe,
    categoria: producto.categoria,
    unidadMedida: producto.unidadMedida
  }));
}
