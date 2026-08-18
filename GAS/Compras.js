function calcularEstadoCompra_(compra) {
  if (compra.cantidadPendiente <= 0 && compra.cantidadRecibida <= 0) {
    return ESTADOS.COMPRA_CANCELADA;
  }

  if (compra.cantidadPendiente > 0 && compra.cantidadRecibida > 0) {
    return ESTADOS.COMPRA_RECIBIDA_PARCIAL;
  }

  if (compra.cantidadPendiente <= 0 && compra.cantidadRecibida > 0) {
    return ESTADOS.COMPRA_RECIBIDA;
  }

  return ESTADOS.COMPRA_PENDIENTE;
}

function registrarCompraMasiva(listaCompras) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    if (admin.isOperadorEntrega) {
      return registrarIngresoStockDirecto_(ss, admin, listaCompras);
    }

    const comprasCtx = obtenerContextoCompras_(ss);
    const productos = obtenerMapaProductos_(ss);
    const idCompra = "COM-" + new Date().getTime();
    const items = consolidarArticulosPorId_(listaCompras);
    const itemsMail = [];
    const filasCompra = [];

    if (!items.length) {
      throw new Error("Carga al menos un producto valido para la compra.");
    }

    items.forEach(item => {
      const producto = productos[String(item.id)];
      if (!producto) {
        throw new Error(`No se encontro el producto con ID ${item.id}.`);
      }

      const itemOriginal = (listaCompras || []).find(compra => String(compra.id || "").trim() === String(item.id));
      const referencia = itemOriginal ? String(itemOriginal.referencia || itemOriginal.link || "").trim() : "";
      itemsMail.push({
        producto: obtenerNombreProducto_(producto),
        cantidad: item.cantidad,
        referencia: referencia,
        link: referencia
      });

      filasCompra.push(crearFilaCompraNueva_(comprasCtx.indices, {
        ID_COMPRA: idCompra,
        FECHA: new Date(),
        SOLICITANTE: admin.email,
        PRODUCTO: obtenerNombreProducto_(producto),
        CANTIDAD: item.cantidad,
        ESTADO: ESTADOS.COMPRA_PENDIENTE,
        AUTORIZADOR: admin.email,
        URL_REFERENCIA: referencia,
        SOLICITANTE_MAIL: admin.email,
        PRODUCTO_SOLICITADO_ID: producto.id,
        CANTIDAD_SOLICITADA: item.cantidad,
        PRODUCTO_RECIBIDO_ID: "",
        PRODUCTO_RECIBIDO: "",
        CANTIDAD_RECIBIDA: 0,
        CANTIDAD_PENDIENTE: item.cantidad,
        OBSERVACIONES: ""
      }));
    });
    appendRows_(comprasCtx.sheet, filasCompra);

    registrarAuditoria_(ss, "compra_registrada", {
      loteId: idCompra,
      items: items
    });
    bumpDataVersion_();

    const mailWarning = ejecutarEnvioMailSeguro_(`solicitud de compra ${idCompra}`, function() {
      MailApp.sendEmail({
        to: RESPONSABLES.COMPRAS,
        subject: `Solicitud de compra - ${idCompra}`,
        htmlBody: buildMailCompraRegistrada_(idCompra, admin.email, itemsMail),
        name: "Goethe Schule Inventario"
      });
    });

    return agregarAdvertenciaMail_("Solicitud registrada.", mailWarning);
  });
}

function registrarIngresoStockDirecto_(ss, admin, listaCompras) {
  const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
  const stockIndices = obtenerIndicesStock_(stockSheet);
  const stockMap = obtenerMapaStockPorId_(ss);
  const productos = obtenerMapaProductos_(ss);
  const items = consolidarArticulosPorId_(listaCompras);
  const idIngreso = "ING-" + new Date().getTime();

  if (!items.length) {
    throw new Error("Carga al menos un producto valido para el ingreso.");
  }

  items.forEach(function(item) {
    const producto = productos[String(item.id)];
    const stockItem = stockMap[String(item.id)];

    if (!producto || !stockItem) {
      throw new Error(`No se encontro el producto con ID ${item.id}.`);
    }

    const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, stockItem.stock + item.cantidad);
    registrarMovimientoStock_(ss, {
      tipo: "ingreso_reposicion",
      idRelacionado: idIngreso,
      productoId: producto.id,
      producto: obtenerNombreProducto_(producto),
      cantidadDelta: movimientoStock.cantidadDelta,
      stockAnterior: movimientoStock.stockAnterior,
      stockNuevo: movimientoStock.stockNuevo,
      observacion: `Ingreso directo por ${admin.email}`
    });
  });

  registrarAuditoria_(ss, "stock_ingreso_directo", {
    loteId: idIngreso,
    admin: admin.email,
    items: items
  });
  bumpDataVersion_();

  return `Ingreso de stock registrado. Lineas actualizadas: ${items.length}.`;
}

function obtenerComprasPendientes() {
  asegurarAdmin_();
  const ss = getSpreadsheet_();
  return obtenerComprasPendientesDesdeSpreadsheet_(ss);
}

function obtenerComprasPendientesDesdeSpreadsheet_(ss) {
  const comprasCtx = obtenerContextoCompras_(ss);
  const productosMap = obtenerMapaProductos_(ss);

  return comprasCtx.rows.slice(1).map(fila => {
    const compra = leerFilaCompra_(fila, comprasCtx.indices);
    const productoSolicitado = compra.productoSolicitadoId ? productosMap[compra.productoSolicitadoId] : null;
    const productoRecibido = compra.productoRecibidoId ? productosMap[compra.productoRecibidoId] : null;

    return {
      id: compra.compraId,
      fecha: Utilities.formatDate(new Date(compra.fecha), CONFIG.TIMEZONE, "dd/MM"),
      producto: productoSolicitado ? obtenerNombreProducto_(productoSolicitado) : compra.productoSolicitado,
      productoId: compra.productoSolicitadoId,
      productoRecibido: productoRecibido ? obtenerNombreProducto_(productoRecibido) : compra.productoRecibido,
      productoRecibidoId: compra.productoRecibidoId,
      cantidadSolicitada: compra.cantidadSolicitada,
      cantidadRecibida: compra.cantidadRecibida,
      cantidadPendiente: compra.cantidadPendiente,
      estado: compra.estado,
      referencia: compra.urlReferencia,
      link: compra.urlReferencia
    };
  }).filter(compra => compra.estado !== ESTADOS.COMPRA_RECIBIDA && compra.estado !== ESTADOS.COMPRA_CANCELADA);
}

function recibirLineaCompra(idCompra, productoSolicitadoId, productoRecibidoId, cantidadRecibidaAccion) {
  return withScriptLock_(() => {
    asegurarAdmin_();

    const ss = getSpreadsheet_();
    const comprasCtx = obtenerContextoCompras_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const cantidad = normalizarCantidad_(cantidadRecibidaAccion);

    if (cantidad <= 0) {
      throw new Error("Ingresa una cantidad valida para recepcionar.");
    }

    if (!productoRecibidoId || !productosMap[String(productoRecibidoId)]) {
      throw new Error("Selecciona un producto recibido valido.");
    }

    for (let i = 1; i < comprasCtx.rows.length; i++) {
      const compra = leerFilaCompra_(comprasCtx.rows[i], comprasCtx.indices);
      if (compra.compraId !== idCompra || compra.productoSolicitadoId !== String(productoSolicitadoId)) continue;

      compra.cantidadRecibida += cantidad;
      compra.cantidadPendiente = Math.max(compra.cantidadSolicitada - compra.cantidadRecibida, 0);
      compra.productoRecibidoId = String(productoRecibidoId);
      compra.productoRecibido = obtenerNombreProducto_(productosMap[compra.productoRecibidoId]);
      compra.estado = calcularEstadoCompra_(compra);

      const stockItem = stockMap[compra.productoRecibidoId];
      if (!stockItem) {
        throw new Error("No existe stock para el producto recibido.");
      }

      const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, stockItem.stock + cantidad);
      escribirFilaCompra_(comprasCtx.sheet, i + 1, comprasCtx.indices, {
        ESTADO: compra.estado,
        AUTORIZADOR: Session.getActiveUser().getEmail(),
        PRODUCTO_RECIBIDO_ID: compra.productoRecibidoId,
        PRODUCTO_RECIBIDO: compra.productoRecibido,
        CANTIDAD_RECIBIDA: compra.cantidadRecibida,
        CANTIDAD_PENDIENTE: compra.cantidadPendiente
      });

      registrarAuditoria_(ss, "compra_recibida", {
        loteId: idCompra,
        productoSolicitadoId: compra.productoSolicitadoId,
        productoRecibidoId: compra.productoRecibidoId,
        cantidad: cantidad
      });
      registrarMovimientoStock_(ss, {
        tipo: "recepcion_compra",
        idRelacionado: idCompra,
        productoId: compra.productoRecibidoId,
        producto: compra.productoRecibido,
        cantidadDelta: movimientoStock.cantidadDelta,
        stockAnterior: movimientoStock.stockAnterior,
        stockNuevo: movimientoStock.stockNuevo,
        observacion: `Recepcion de compra ${idCompra}`
      });
      bumpDataVersion_();
      return "Recepcion registrada.";
    }

    throw new Error("No se encontro la linea de compra.");
  });
}

function cancelarSaldoCompra(idCompra, productoSolicitadoId, motivo) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const comprasCtx = obtenerContextoCompras_(ss);
    const motivoNormalizado = String(motivo || "").trim();
    if (!motivoNormalizado) {
      throw new Error("Ingresa un motivo para cancelar el saldo de compra.");
    }

    for (let i = 1; i < comprasCtx.rows.length; i++) {
      const compra = leerFilaCompra_(comprasCtx.rows[i], comprasCtx.indices);
      if (compra.compraId !== idCompra || compra.productoSolicitadoId !== String(productoSolicitadoId)) continue;

      compra.cantidadPendiente = 0;
      compra.estado = calcularEstadoCompra_(compra);

      escribirFilaCompra_(comprasCtx.sheet, i + 1, comprasCtx.indices, {
        ESTADO: compra.estado,
        AUTORIZADOR: admin.email,
        OBSERVACIONES: motivoNormalizado ? `Cancelado: ${motivoNormalizado}` : compra.observaciones,
        CANTIDAD_PENDIENTE: 0
      });

      registrarAuditoria_(ss, "compra_saldo_cancelado", {
        loteId: idCompra,
        productoSolicitadoId: compra.productoSolicitadoId,
        motivo: motivoNormalizado
      });
      bumpDataVersion_();
      return "Saldo de compra cancelado.";
    }

    throw new Error("No se encontro la linea de compra.");
  });
}

function procesarRecepcionLote(idCompra, cambios) {
  return withScriptLock_(() => {
    asegurarAdmin_();

    const ss = getSpreadsheet_();
    const comprasCtx = obtenerContextoCompras_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const cambiosPorProducto = {};
    let cambiosAplicados = 0;

    (cambios || []).forEach(function(cambio) {
      if (cambio && cambio.productoSolicitadoId) {
        cambiosPorProducto[String(cambio.productoSolicitadoId)] = cambio;
      }
    });

    for (let i = 1; i < comprasCtx.rows.length; i++) {
      const compra = leerFilaCompra_(comprasCtx.rows[i], comprasCtx.indices);
      if (compra.compraId !== idCompra) continue;

      const cambio = cambiosPorProducto[String(compra.productoSolicitadoId)];
      if (!cambio) continue;

      let huboCambio = false;
      const cantidad = normalizarCantidad_(cambio.cantidadRecibida);

      if (cantidad > 0) {
        if (!cambio.productoRecibidoId || !productosMap[String(cambio.productoRecibidoId)]) {
          throw new Error(`Selecciona un producto recibido valido para ${compra.productoSolicitado}.`);
        }

        compra.cantidadRecibida += cantidad;
        compra.cantidadPendiente = Math.max(compra.cantidadSolicitada - compra.cantidadRecibida, 0);
        compra.productoRecibidoId = String(cambio.productoRecibidoId);
        compra.productoRecibido = obtenerNombreProducto_(productosMap[compra.productoRecibidoId]);

        const stockItem = stockMap[compra.productoRecibidoId];
        if (!stockItem) {
          throw new Error("No existe stock para el producto recibido.");
        }

        const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, stockItem.stock + cantidad);
        registrarMovimientoStock_(ss, {
          tipo: "recepcion_compra",
          idRelacionado: idCompra,
          productoId: compra.productoRecibidoId,
          producto: compra.productoRecibido,
          cantidadDelta: movimientoStock.cantidadDelta,
          stockAnterior: movimientoStock.stockAnterior,
          stockNuevo: movimientoStock.stockNuevo,
          observacion: `Recepcion de lote ${idCompra}`
        });
        huboCambio = true;
      }

      if (cambio.cancelarSaldo) {
        const motivoCancelacion = String(cambio.motivo || "").trim();
        if (!motivoCancelacion) {
          throw new Error(`Ingresa un motivo para cancelar el saldo de ${compra.productoSolicitado}.`);
        }
        compra.cantidadPendiente = 0;
        compra.observaciones = `Cancelado: ${motivoCancelacion}`;
        huboCambio = true;
      }

      if (!huboCambio) continue;

      compra.estado = calcularEstadoCompra_(compra);
      escribirFilaCompra_(comprasCtx.sheet, i + 1, comprasCtx.indices, {
        ESTADO: compra.estado,
        AUTORIZADOR: Session.getActiveUser().getEmail(),
        PRODUCTO_RECIBIDO_ID: compra.productoRecibidoId,
        PRODUCTO_RECIBIDO: compra.productoRecibido,
        CANTIDAD_RECIBIDA: compra.cantidadRecibida,
        CANTIDAD_PENDIENTE: compra.cantidadPendiente,
        OBSERVACIONES: compra.observaciones
      });
      cambiosAplicados += 1;
    }

    if (!cambiosAplicados) {
      throw new Error("No se aplicaron cambios en el lote.");
    }

    const comprasActualizadas = obtenerComprasPendientesDesdeSpreadsheet_(ss);
    const loteActualizado = comprasActualizadas.filter(function(item) {
      return item.id === idCompra;
    });

    registrarAuditoria_(ss, "compra_procesada_masiva", {
      loteId: idCompra,
      lineas: cambiosAplicados
    });
    bumpDataVersion_();
    return {
      mensaje: `Lote procesado. Lineas actualizadas: ${cambiosAplicados}.`,
      compraId: idCompra,
      lote: loteActualizado,
      actividad: obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
      resumen: {
        pedidos: obtenerPedidosParaGestionDesdeSpreadsheet_(ss).length,
        compras: comprasActualizadas.length
      }
    };
  });
}
