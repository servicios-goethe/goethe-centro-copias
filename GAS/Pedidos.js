function construirSolicitantePedido_(solicitanteMail) {
  return String(solicitanteMail || "").trim();
}

function construirSolicitanteVisible_(user, pedido, solicitanteMail, role) {
  if (role && role.isCuentaGeneral) {
    const nombre = String(pedido.nombreSolicitante || "").trim();
    const apellido = String(pedido.apellidoSolicitante || "").trim();
    const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ").trim();
    return nombreCompleto ? `${nombreCompleto} <${solicitanteMail}>` : construirSolicitantePedido_(solicitanteMail);
  }

  return construirSolicitantePedido_(solicitanteMail);
}

function esMailValido_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function agregarObservacionPedido_(observaciones, mensaje) {
  const base = String(observaciones || "").trim();
  const detalle = String(mensaje || "").trim();
  if (!detalle) return base;
  return base ? `${base} | ${detalle}` : detalle;
}

function construirItemsMailPedido_(items, stockMap) {
  return (items || []).map(function(item) {
    const producto = stockMap[item.id];
    return {
      producto: producto ? obtenerNombreProducto_(producto) : String(item.id || ""),
      cantidad: item.cantidad
    };
  });
}

function calcularEstadoRetiro_(retiro) {
  if (retiro.cantidadPendiente <= 0 && retiro.cantidadLista <= 0 && retiro.cantidadRetirada <= 0) {
    return ESTADOS.RETIRO_CANCELADO;
  }

  if (retiro.cantidadLista > 0) {
    return ESTADOS.RETIRO_LISTO;
  }

  if (retiro.cantidadPendiente <= 0 && retiro.cantidadLista <= 0 && retiro.cantidadRetirada > 0) {
    return ESTADOS.RETIRO_RETIRADO;
  }

  if (retiro.cantidadRetirada >= retiro.cantidadSolicitada && retiro.cantidadSolicitada > 0) {
    return ESTADOS.RETIRO_RETIRADO;
  }

  if (retiro.cantidadRetirada > 0) {
    return ESTADOS.RETIRO_RETIRADO_PARCIAL;
  }

  return ESTADOS.RETIRO_PENDIENTE;
}

function registrarPedidoMasivo(payload) {
  return withScriptLock_(() => {
    const ss = getSpreadsheet_();
    const pedido = Array.isArray(payload) ? { items: payload } : (payload || {});
    const items = consolidarArticulosPorId_(pedido.items);
    if (!items.length) {
      throw new Error("Carga al menos un producto valido.");
    }

    const retirosCtx = obtenerContextoRetiros_(ss);
    const stockMap = obtenerMapaStockPorId_(ss);
    const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
    const user = role.email;
    const solicitanteMail = role.isCuentaGeneral
      ? String(pedido.solicitanteMail || "").trim()
      : user;
    const solicitanteVisible = construirSolicitanteVisible_(user, pedido, solicitanteMail, role);

    if (!solicitanteMail) {
      throw new Error("Ingresa el mail del solicitante.");
    }

    if (role.isCuentaGeneral && !esMailValido_(solicitanteMail)) {
      throw new Error("Ingresa un mail valido para el solicitante.");
    }

    if (role.isCuentaGeneral && (!String(pedido.nombreSolicitante || "").trim() || !String(pedido.apellidoSolicitante || "").trim())) {
      throw new Error("Ingresa nombre y apellido del solicitante.");
    }
    const idPedido = "RET-" + new Date().getTime();
    const filasPedido = [];

    items.forEach(item => {
      const producto = stockMap[item.id];
      if (!producto) {
        throw new Error(`No se encontro el producto con ID ${item.id}.`);
      }

      filasPedido.push(crearFilaRetiroNueva_(retirosCtx.indices, {
        ID_PEDIDO: idPedido,
        FECHA: new Date(),
        SOLICITANTE: solicitanteVisible,
        PRODUCTO: producto.nombre,
        CANTIDAD: item.cantidad,
        ESTADO: ESTADOS.RETIRO_PENDIENTE,
        AUTORIZADOR: "",
        ENTREGADO_POR: "",
        SOLICITANTE_MAIL: solicitanteMail,
        PRODUCTO_ID: item.id,
        CANTIDAD_SOLICITADA: item.cantidad,
        CANTIDAD_LISTA: 0,
        CANTIDAD_RETIRADA: 0,
        CANTIDAD_PENDIENTE: item.cantidad,
        OBSERVACIONES: ""
      }));
    });
    appendRows_(retirosCtx.sheet, filasPedido);

    registrarAuditoria_(ss, "pedido_registrado", {
      loteId: idPedido,
      solicitanteMail: solicitanteMail,
      items: items
    });
    bumpDataVersion_();
    const mailWarning = enviarMailPedidoRegistrado_(solicitanteMail, idPedido, construirItemsMailPedido_(items, stockMap));

    return agregarAdvertenciaMail_("Pedido registrado correctamente.", mailWarning);
  });
}

function obtenerPedidosParaGestion() {
  asegurarAdmin_();
  const ss = getSpreadsheet_();
  return obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
}

function obtenerPedidosParaGestionDesdeSpreadsheet_(ss) {
  const retirosCtx = obtenerContextoRetiros_(ss);
  const productosMap = obtenerMapaProductos_(ss);
  const stockMap = obtenerMapaStockPorId_(ss);
  const stockComprometido = consolidarPedidosPendientesPorId_(retirosCtx.rows, retirosCtx.indices);
  const stockComprometidoPorLote = consolidarPedidosPendientesPorProductoYLote_(retirosCtx.rows, retirosCtx.indices);
  const agrupados = {};

  for (let i = 1; i < retirosCtx.rows.length; i++) {
    const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
    if (retiro.estado === ESTADOS.RETIRO_RETIRADO || retiro.estado === ESTADOS.RETIRO_CANCELADO) continue;

    if (!agrupados[retiro.pedidoId]) {
      agrupados[retiro.pedidoId] = {
        id: retiro.pedidoId,
        fecha: Utilities.formatDate(new Date(retiro.fecha), CONFIG.TIMEZONE, "dd/MM HH:mm"),
        usuario: retiro.solicitante || retiro.solicitanteMail,
        solicitanteMail: retiro.solicitanteMail,
        items: []
      };
    }

    const producto = retiro.productoId ? productosMap[retiro.productoId] : obtenerProductoPorNombreHistorico_(retiro.productoNombre, productosMap);
    const productoId = producto ? producto.id : retiro.productoId;
    const stockFisico = productoId && stockMap[productoId] ? stockMap[productoId].stock : 0;
    const comprometidoTotal = productoId ? (stockComprometido[productoId] || 0) : 0;
    const comprometidoLote = productoId && stockComprometidoPorLote[productoId]
      ? (stockComprometidoPorLote[productoId][retiro.pedidoId] || 0)
      : 0;
    const requiereRevision = retiro.estado === ESTADOS.RETIRO_RETIRADO_PARCIAL
      && retiro.cantidadPendiente <= 0
      && retiro.cantidadLista <= 0;

    agrupados[retiro.pedidoId].items.push({
      producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
      productoId: productoId,
      solicitante: retiro.solicitante || retiro.solicitanteMail,
      solicitanteMail: retiro.solicitanteMail,
      estado: retiro.estado,
      cantidadSolicitada: retiro.cantidadSolicitada,
      cantidadLista: retiro.cantidadLista,
      cantidadRetirada: retiro.cantidadRetirada,
      cantidadPendiente: retiro.cantidadPendiente,
      stockActual: stockFisico,
      stockDisponible: calcularStockDisponible_(stockFisico, comprometidoTotal),
      stockDisponibleLote: calcularStockDisponible_(stockFisico, comprometidoTotal - comprometidoLote),
      faltante: Math.max(retiro.cantidadPendiente - calcularStockDisponible_(stockFisico, comprometidoTotal), 0),
      observaciones: retiro.observaciones || "",
      requiereRevision: requiereRevision
    });
  }

  return Object.values(agrupados).reverse();
}

function itemPedidoEditablePorSolicitante_(retiro) {
  return retiro.estado === ESTADOS.RETIRO_PENDIENTE
    && normalizarCantidad_(retiro.cantidadLista) === 0
    && normalizarCantidad_(retiro.cantidadRetirada) === 0;
}

function obtenerMisPedidosEditables() {
  const ss = getSpreadsheet_();
  const user = Session.getActiveUser().getEmail();
  const retirosCtx = obtenerContextoRetiros_(ss);
  const productosMap = obtenerMapaProductos_(ss);
  const agrupados = {};

  for (let i = 1; i < retirosCtx.rows.length; i++) {
    const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
    if (retiro.solicitanteMail !== user) continue;
    if (retiro.estado === ESTADOS.RETIRO_RETIRADO || retiro.estado === ESTADOS.RETIRO_CANCELADO) continue;

    if (!agrupados[retiro.pedidoId]) {
      agrupados[retiro.pedidoId] = {
        id: retiro.pedidoId,
        fecha: Utilities.formatDate(new Date(retiro.fecha), CONFIG.TIMEZONE, "dd/MM HH:mm"),
        items: []
      };
    }

    const producto = retiro.productoId ? productosMap[retiro.productoId] : obtenerProductoPorNombreHistorico_(retiro.productoNombre, productosMap);
    agrupados[retiro.pedidoId].items.push({
      producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
      productoId: producto ? producto.id : retiro.productoId,
      estado: retiro.estado,
      cantidadSolicitada: retiro.cantidadSolicitada,
      cantidadLista: retiro.cantidadLista,
      cantidadRetirada: retiro.cantidadRetirada,
      cantidadPendiente: retiro.cantidadPendiente,
      editable: itemPedidoEditablePorSolicitante_(retiro),
      motivoBloqueo: itemPedidoEditablePorSolicitante_(retiro) ? "" : "El item ya fue preparado o entregado. Si necesita cambiarlo, solicite revision a administracion."
    });
  }

  return Object.values(agrupados).reverse();
}

function actualizarItemPedidoPropio(idPedido, productoId, nuevaCantidad) {
  return withScriptLock_(() => {
    const ss = getSpreadsheet_();
    const user = Session.getActiveUser().getEmail();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const cantidad = normalizarCantidad_(nuevaCantidad);

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido || String(retiro.productoId) !== String(productoId)) continue;

      if (retiro.solicitanteMail !== user) {
        throw new Error("Solo podes editar tus propios pedidos.");
      }

      if (!itemPedidoEditablePorSolicitante_(retiro)) {
        throw new Error("Este item ya fue preparado o entregado. Solicita revision a administracion.");
      }

      const cantidadAnterior = retiro.cantidadSolicitada;
      retiro.cantidadSolicitada = cantidad;
      retiro.cantidadPendiente = cantidad;
      retiro.estado = calcularEstadoRetiro_(retiro);
      retiro.observaciones = cantidad > 0
        ? agregarObservacionPedido_(retiro.observaciones, `Editado por solicitante: ${cantidadAnterior} -> ${cantidad}`)
        : agregarObservacionPedido_(retiro.observaciones, `Eliminado por solicitante. Cantidad anterior: ${cantidadAnterior}`);

      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        CANTIDAD: cantidad,
        CANTIDAD_SOLICITADA: cantidad,
        CANTIDAD_PENDIENTE: cantidad,
        ESTADO: retiro.estado,
        OBSERVACIONES: retiro.observaciones
      });

      registrarAuditoria_(ss, cantidad > 0 ? "pedido_item_editado_solicitante" : "pedido_item_eliminado_solicitante", {
        loteId: idPedido,
        productoId: String(productoId),
        solicitanteMail: user,
        cantidadAnterior: cantidadAnterior,
        cantidadNueva: cantidad
      });
      bumpDataVersion_();

      return {
        mensaje: cantidad > 0 ? "Item actualizado." : "Item eliminado del pedido.",
        pedidos: obtenerMisPedidosEditables()
      };
    }

    throw new Error("No se encontro el item del pedido.");
  });
}

function deshacerPreparacionItemPedido(idPedido, productoId, motivo) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const motivoNormalizado = String(motivo || "").trim();

    if (!motivoNormalizado) {
      throw new Error("Ingresa un motivo para deshacer la preparacion.");
    }

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido || String(retiro.productoId) !== String(productoId)) continue;

      if (normalizarCantidad_(retiro.cantidadRetirada) > 0) {
        throw new Error("No se puede deshacer preparacion si ya hubo retiro.");
      }

      if (normalizarCantidad_(retiro.cantidadLista) <= 0) {
        throw new Error("Este item no tiene cantidad preparada para deshacer.");
      }

      const cantidadListaAnterior = retiro.cantidadLista;
      retiro.cantidadPendiente += retiro.cantidadLista;
      retiro.cantidadLista = 0;
      retiro.estado = calcularEstadoRetiro_(retiro);
      retiro.observaciones = agregarObservacionPedido_(retiro.observaciones, `Preparacion deshecha: ${motivoNormalizado}`);

      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        CANTIDAD_LISTA: 0,
        CANTIDAD_PENDIENTE: retiro.cantidadPendiente,
        OBSERVACIONES: retiro.observaciones
      });

      registrarAuditoria_(ss, "pedido_preparacion_deshecha", {
        loteId: idPedido,
        productoId: String(productoId),
        cantidadListaAnterior: cantidadListaAnterior,
        motivo: motivoNormalizado,
        admin: admin.email
      });
      bumpDataVersion_();

      const pedidosActualizados = obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
      return {
        mensaje: "Preparacion deshecha. El item vuelve a quedar editable si pertenece al solicitante.",
        pedido: pedidosActualizados.find(function(pedido) { return pedido.id === idPedido; }) || null,
        actividad: admin.isOperadorEntrega ? [] : obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
        resumen: {
          pedidos: pedidosActualizados.length,
          compras: admin.isOperadorEntrega ? 0 : obtenerComprasPendientesDesdeSpreadsheet_(ss).length
        }
      };
    }

    throw new Error("No se encontro la linea del pedido.");
  });
}

function marcarCantidadLista(idPedido, productoId, cantidadListaAccion) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const cantidad = normalizarCantidad_(cantidadListaAccion);
    if (cantidad <= 0) {
      throw new Error("Ingresa una cantidad valida para marcar lista.");
    }

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido || retiro.productoId !== String(productoId)) continue;

      const cantidadAListar = Math.min(cantidad, retiro.cantidadPendiente);
      if (cantidadAListar <= 0) {
        throw new Error("No hay saldo pendiente para marcar como listo.");
      }

      retiro.cantidadLista += cantidadAListar;
      retiro.cantidadPendiente -= cantidadAListar;
      retiro.estado = calcularEstadoRetiro_(retiro);

      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        CANTIDAD_LISTA: retiro.cantidadLista,
        CANTIDAD_PENDIENTE: retiro.cantidadPendiente
      });

      const producto = productosMap[retiro.productoId];
      const mailWarning = enviarMailRetiroListo_(retiro.solicitanteMail, idPedido, [{
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidad: cantidadAListar
      }], retiro.cantidadPendiente > 0);

      registrarAuditoria_(ss, "pedido_listo_retirar", {
        loteId: idPedido,
        productoId: retiro.productoId,
        cantidad: cantidadAListar
      });
      bumpDataVersion_();
      return agregarAdvertenciaMail_("Cantidad marcada como lista para retirar.", mailWarning);
    }

    throw new Error("No se encontro la linea del pedido.");
  });
}

function marcarCantidadRetirada(idPedido, productoId, cantidadRetiradaAccion) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const cantidad = normalizarCantidad_(cantidadRetiradaAccion);
    if (cantidad <= 0) {
      throw new Error("Ingresa una cantidad valida para marcar retirada.");
    }

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido || retiro.productoId !== String(productoId)) continue;

      const cantidadARetirar = Math.min(cantidad, retiro.cantidadLista);
      if (cantidadARetirar <= 0) {
        throw new Error("No hay cantidad lista disponible para retirar.");
      }

      const stockItem = stockMap[retiro.productoId];
      if (!stockItem || stockItem.stock < cantidadARetirar) {
        throw new Error("No hay stock fisico suficiente para registrar este retiro.");
      }

      const restanteLista = retiro.cantidadLista - cantidadARetirar;
      retiro.cantidadRetirada += cantidadARetirar;
      retiro.cantidadLista = 0;
      retiro.cantidadPendiente += restanteLista;
      retiro.estado = calcularEstadoRetiro_(retiro);

      const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, stockItem.stock - cantidadARetirar);
      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        ENTREGADO_POR: admin.email,
        CANTIDAD_LISTA: 0,
        CANTIDAD_RETIRADA: retiro.cantidadRetirada,
        CANTIDAD_PENDIENTE: retiro.cantidadPendiente
      });

      const producto = productosMap[retiro.productoId];
      const mailWarning = enviarMailRetiroRetirado_(retiro.solicitanteMail, idPedido, [{
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidad: cantidadARetirar
      }]);

      registrarAuditoria_(ss, "pedido_retirado", {
        loteId: idPedido,
        productoId: retiro.productoId,
        cantidad: cantidadARetirar
      });
      registrarMovimientoStock_(ss, {
        tipo: "retiro",
        idRelacionado: idPedido,
        productoId: retiro.productoId,
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidadDelta: movimientoStock.cantidadDelta,
        stockAnterior: movimientoStock.stockAnterior,
        stockNuevo: movimientoStock.stockNuevo,
        observacion: `Retiro registrado por ${admin.email}`
      });
      bumpDataVersion_();
      return agregarAdvertenciaMail_("Retiro registrado correctamente.", mailWarning);
    }

    throw new Error("No se encontro la linea del pedido.");
  });
}

function cancelarSaldoPedido(idPedido, productoId, motivo) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const motivoNormalizado = String(motivo || "").trim();

    if (!motivoNormalizado) {
      throw new Error("Ingresa un motivo para cancelar el saldo.");
    }

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido || retiro.productoId !== String(productoId)) continue;

      retiro.cantidadPendiente = 0;
      retiro.cantidadLista = 0;
      retiro.observaciones = agregarObservacionPedido_(retiro.observaciones, `Saldo cancelado: ${motivoNormalizado}`);
      retiro.estado = calcularEstadoRetiro_(retiro);

      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        CANTIDAD_LISTA: 0,
        CANTIDAD_PENDIENTE: 0,
        OBSERVACIONES: retiro.observaciones
      });

      registrarAuditoria_(ss, "pedido_saldo_cancelado", {
        loteId: idPedido,
        productoId: retiro.productoId,
        motivo: motivoNormalizado
      });
      bumpDataVersion_();
      return "Saldo cancelado.";
    }

    throw new Error("No se encontro la linea del pedido.");
  });
}

function procesarCambiosPedido(idPedido, cambios) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const cambiosPorProducto = {};
    const listosMail = [];
    const retiradosMail = [];
    let cambiosAplicados = 0;

    (cambios || []).forEach(function(cambio) {
      if (cambio && cambio.productoId) {
        cambiosPorProducto[String(cambio.productoId)] = cambio;
      }
    });

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido) continue;

      const cambio = cambiosPorProducto[String(retiro.productoId)];
      if (!cambio) continue;

      let huboCambio = false;

      const cantidadLista = normalizarCantidad_(cambio.cantidadLista);
      if (cantidadLista > 0) {
        const cantidadAListar = Math.min(cantidadLista, retiro.cantidadPendiente);
        if (cantidadAListar > 0) {
          retiro.cantidadLista += cantidadAListar;
          retiro.cantidadPendiente -= cantidadAListar;
          listosMail.push({
            producto: productosMap[retiro.productoId] ? obtenerNombreProducto_(productosMap[retiro.productoId]) : retiro.productoNombre,
            cantidad: cantidadAListar
          });
          huboCambio = true;
        }
      }

      const cantidadRetirada = normalizarCantidad_(cambio.cantidadRetirada);
      if (cantidadRetirada > 0) {
        const cantidadARetirar = Math.min(cantidadRetirada, retiro.cantidadLista);
        if (cantidadARetirar > 0) {
          const stockItem = stockMap[retiro.productoId];
          if (!stockItem || stockItem.stock < cantidadARetirar) {
            throw new Error(`No hay stock fisico suficiente para ${retiro.productoNombre}.`);
          }

          const restanteLista = retiro.cantidadLista - cantidadARetirar;
          retiro.cantidadRetirada += cantidadARetirar;
          retiro.cantidadLista = 0;
          retiro.cantidadPendiente += restanteLista;
          const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, stockItem.stock - cantidadARetirar);
          retiradosMail.push({
            producto: productosMap[retiro.productoId] ? obtenerNombreProducto_(productosMap[retiro.productoId]) : retiro.productoNombre,
            cantidad: cantidadARetirar
          });
          registrarMovimientoStock_(ss, {
            tipo: "retiro",
            idRelacionado: idPedido,
            productoId: retiro.productoId,
            producto: productosMap[retiro.productoId] ? obtenerNombreProducto_(productosMap[retiro.productoId]) : retiro.productoNombre,
            cantidadDelta: movimientoStock.cantidadDelta,
            stockAnterior: movimientoStock.stockAnterior,
            stockNuevo: movimientoStock.stockNuevo,
            observacion: `Retiro procesado por ${admin.email}`
          });
          huboCambio = true;
        }
      }

      if (cambio.cancelarSaldo) {
        const motivoCancelacion = String(cambio.motivoCancelacion || "").trim();
        if (!motivoCancelacion) {
          throw new Error(`Ingresa un motivo para cancelar el saldo de ${retiro.productoNombre}.`);
        }
        retiro.cantidadPendiente = 0;
        retiro.cantidadLista = 0;
        retiro.observaciones = agregarObservacionPedido_(retiro.observaciones, `Saldo cancelado: ${motivoCancelacion}`);
        huboCambio = true;
      }

      if (!huboCambio) continue;

      retiro.estado = calcularEstadoRetiro_(retiro);
      escribirFilaRetiro_(retirosCtx.sheet, i + 1, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        ENTREGADO_POR: retiro.cantidadRetirada > 0 ? admin.email : retiro.entregadoPor,
        CANTIDAD_LISTA: retiro.cantidadLista,
        CANTIDAD_RETIRADA: retiro.cantidadRetirada,
        CANTIDAD_PENDIENTE: retiro.cantidadPendiente,
        OBSERVACIONES: retiro.observaciones
      });
      cambiosAplicados += 1;
    }

    if (!cambiosAplicados) {
      throw new Error("No se aplicaron cambios en el pedido.");
    }

    const pedidosActualizados = obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
    const pedidoActualizado = pedidosActualizados.find(function(pedido) {
      return pedido.id === idPedido;
    });

    const mailWarnings = [];

    if (pedidoActualizado && listosMail.length) {
      const tienePendiente = pedidoActualizado.items.some(function(item) {
        return item.cantidadPendiente > 0;
      });
      const warning = enviarMailRetiroListo_(pedidoActualizado.solicitanteMail, idPedido, listosMail, tienePendiente);
      if (warning) mailWarnings.push(warning);
      registrarAuditoria_(ss, "pedido_listo_retirar", {
        loteId: idPedido,
        lineas: listosMail.length,
        items: listosMail
      });
    }

    if (pedidoActualizado && retiradosMail.length) {
      const warning = enviarMailRetiroRetirado_(pedidoActualizado.solicitanteMail, idPedido, retiradosMail);
      if (warning) mailWarnings.push(warning);
      registrarAuditoria_(ss, "pedido_retirado", {
        loteId: idPedido,
        lineas: retiradosMail.length,
        items: retiradosMail
      });
    }

    registrarAuditoria_(ss, "pedido_procesado_masivo", {
      loteId: idPedido,
      lineas: cambiosAplicados
    });
    bumpDataVersion_();
    return {
      mensaje: agregarAdvertenciaMail_(`Pedido procesado. Lineas actualizadas: ${cambiosAplicados}.`, mailWarnings.join("")),
      pedido: pedidoActualizado || null,
      actividad: obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
      resumen: {
        pedidos: pedidosActualizados.length,
        compras: obtenerComprasPendientesDesdeSpreadsheet_(ss).length
      }
    };
  });
}

function entregarPedidoCompleto(idPedido) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const lineas = [];
    const faltantes = [];
    const retiradosMail = [];
    let solicitanteMail = "";

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido) continue;
      if (retiro.estado === ESTADOS.RETIRO_RETIRADO || retiro.estado === ESTADOS.RETIRO_CANCELADO) continue;

      const cantidadAEntregar = normalizarCantidad_(retiro.cantidadPendiente) + normalizarCantidad_(retiro.cantidadLista);
      if (cantidadAEntregar <= 0) continue;

      const stockItem = stockMap[String(retiro.productoId)];
      if (!stockItem || stockItem.stock < cantidadAEntregar) {
        faltantes.push(`${retiro.productoNombre}: faltan ${cantidadAEntregar - (stockItem ? stockItem.stock : 0)}`);
      }

      lineas.push({
        row: i + 1,
        retiro: retiro,
        cantidad: cantidadAEntregar,
        stockItem: stockItem
      });
      if (!solicitanteMail) solicitanteMail = retiro.solicitanteMail;
    }

    if (!lineas.length) {
      throw new Error("No hay lineas pendientes para entregar en este pedido.");
    }

    if (faltantes.length) {
      throw new Error(`No hay stock suficiente para entregar el pedido completo. ${faltantes.join(" | ")}`);
    }

    lineas.forEach(function(linea) {
      const retiro = linea.retiro;
      const producto = productosMap[retiro.productoId];
      const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, linea.stockItem, linea.stockItem.stock - linea.cantidad);

      retiro.cantidadRetirada += linea.cantidad;
      retiro.cantidadLista = 0;
      retiro.cantidadPendiente = 0;
      retiro.estado = calcularEstadoRetiro_(retiro);

      escribirFilaRetiro_(retirosCtx.sheet, linea.row, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        ENTREGADO_POR: admin.email,
        CANTIDAD_LISTA: 0,
        CANTIDAD_RETIRADA: retiro.cantidadRetirada,
        CANTIDAD_PENDIENTE: 0
      });

      registrarMovimientoStock_(ss, {
        tipo: "retiro",
        idRelacionado: idPedido,
        productoId: retiro.productoId,
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidadDelta: movimientoStock.cantidadDelta,
        stockAnterior: movimientoStock.stockAnterior,
        stockNuevo: movimientoStock.stockNuevo,
        observacion: `Entrega completa registrada por ${admin.email}`
      });
      retiradosMail.push({
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidad: linea.cantidad
      });
    });

    registrarAuditoria_(ss, "pedido_entregado_completo", {
      loteId: idPedido,
      admin: admin.email,
      lineas: lineas.length
    });
    registrarAuditoria_(ss, "pedido_retirado", {
      loteId: idPedido,
      admin: admin.email,
      lineas: retiradosMail.length,
      items: retiradosMail,
      modo: "entrega_completa"
    });
    bumpDataVersion_();
    const mailWarning = enviarMailRetiroRetirado_(solicitanteMail, idPedido, retiradosMail);

    const pedidosActualizados = obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
    return {
      mensaje: agregarAdvertenciaMail_(`Pedido entregado completo. Lineas entregadas: ${lineas.length}.`, mailWarning),
      pedido: pedidosActualizados.find(function(pedido) { return pedido.id === idPedido; }) || null,
      actividad: admin.isOperadorEntrega ? [] : obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
      resumen: {
        pedidos: pedidosActualizados.length,
        compras: admin.isOperadorEntrega ? 0 : obtenerComprasPendientesDesdeSpreadsheet_(ss).length
      }
    };
  });
}

function entregarPedidoParcialDisponible(idPedido) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const retirosCtx = obtenerContextoRetiros_(ss);
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const lineas = [];
    const retiradosMail = [];
    let solicitanteMail = "";

    for (let i = 1; i < retirosCtx.rows.length; i++) {
      const retiro = leerFilaRetiro_(retirosCtx.rows[i], retirosCtx.indices);
      if (retiro.pedidoId !== idPedido) continue;
      if (retiro.estado === ESTADOS.RETIRO_RETIRADO || retiro.estado === ESTADOS.RETIRO_CANCELADO) continue;

      const cantidadPendienteTotal = normalizarCantidad_(retiro.cantidadPendiente) + normalizarCantidad_(retiro.cantidadLista);
      if (cantidadPendienteTotal <= 0) continue;

      const stockItem = stockMap[String(retiro.productoId)];
      const cantidadDisponible = stockItem ? normalizarCantidad_(stockItem.stock) : 0;
      const cantidadAEntregar = Math.min(cantidadPendienteTotal, cantidadDisponible);
      if (cantidadAEntregar <= 0) continue;

      lineas.push({
        row: i + 1,
        retiro: retiro,
        cantidad: cantidadAEntregar,
        stockItem: stockItem
      });
      if (!solicitanteMail) solicitanteMail = retiro.solicitanteMail;
    }

    if (!lineas.length) {
      throw new Error("No hay stock disponible para registrar una entrega parcial en este pedido.");
    }

    lineas.forEach(function(linea) {
      const retiro = linea.retiro;
      const producto = productosMap[retiro.productoId];
      const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, linea.stockItem, linea.stockItem.stock - linea.cantidad);
      const cantidadDesdeLista = Math.min(normalizarCantidad_(retiro.cantidadLista), linea.cantidad);
      const cantidadDesdePendiente = linea.cantidad - cantidadDesdeLista;

      retiro.cantidadRetirada += linea.cantidad;
      retiro.cantidadLista = Math.max(normalizarCantidad_(retiro.cantidadLista) - cantidadDesdeLista, 0);
      retiro.cantidadPendiente = Math.max(normalizarCantidad_(retiro.cantidadPendiente) - cantidadDesdePendiente, 0);
      retiro.estado = calcularEstadoRetiro_(retiro);

      escribirFilaRetiro_(retirosCtx.sheet, linea.row, retirosCtx.indices, {
        ESTADO: retiro.estado,
        AUTORIZADOR: admin.email,
        ENTREGADO_POR: admin.email,
        CANTIDAD_LISTA: retiro.cantidadLista,
        CANTIDAD_RETIRADA: retiro.cantidadRetirada,
        CANTIDAD_PENDIENTE: retiro.cantidadPendiente
      });

      registrarMovimientoStock_(ss, {
        tipo: "retiro",
        idRelacionado: idPedido,
        productoId: retiro.productoId,
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidadDelta: movimientoStock.cantidadDelta,
        stockAnterior: movimientoStock.stockAnterior,
        stockNuevo: movimientoStock.stockNuevo,
        observacion: `Entrega parcial registrada por ${admin.email}`
      });
      retiradosMail.push({
        producto: producto ? obtenerNombreProducto_(producto) : retiro.productoNombre,
        cantidad: linea.cantidad
      });
    });

    registrarAuditoria_(ss, "pedido_entregado_parcial", {
      loteId: idPedido,
      admin: admin.email,
      lineas: lineas.length
    });
    registrarAuditoria_(ss, "pedido_retirado", {
      loteId: idPedido,
      admin: admin.email,
      lineas: retiradosMail.length,
      items: retiradosMail,
      modo: "entrega_parcial"
    });
    bumpDataVersion_();
    const mailWarning = enviarMailRetiroRetirado_(solicitanteMail, idPedido, retiradosMail);

    const pedidosActualizados = obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
    return {
      mensaje: agregarAdvertenciaMail_(`Entrega parcial registrada. Lineas entregadas: ${lineas.length}.`, mailWarning),
      pedido: pedidosActualizados.find(function(pedido) { return pedido.id === idPedido; }) || null,
      actividad: admin.isOperadorEntrega ? [] : obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
      resumen: {
        pedidos: pedidosActualizados.length,
        compras: admin.isOperadorEntrega ? 0 : obtenerComprasPendientesDesdeSpreadsheet_(ss).length
      }
    };
  });
}

function ajustarStockDesdePedido(idPedido, productoId, nuevoStockReal, motivo) {
  return withScriptLock_(() => {
    const admin = asegurarAdmin_();
    const ss = getSpreadsheet_();
    const stockSheet = getSheetOrThrow_(ss, TABS.STOCK);
    const stockIndices = obtenerIndicesStock_(stockSheet);
    const stockMap = obtenerMapaStockPorId_(ss);
    const productosMap = obtenerMapaProductos_(ss);
    const stockItem = stockMap[String(productoId)];
    const nuevoStock = normalizarCantidad_(nuevoStockReal);

    if (!stockItem) {
      throw new Error("No se encontro el producto para ajustar stock.");
    }

    if (nuevoStock < 0) {
      throw new Error("Ingresa un stock real valido.");
    }

    const stockAnterior = normalizarCantidad_(stockItem.stock);
    const movimientoStock = actualizarStockEnHoja_(stockSheet, stockIndices, stockItem, nuevoStock);

    registrarAuditoria_(ss, "stock_ajustado", {
      loteId: idPedido,
      productoId: String(productoId),
      producto: productosMap[String(productoId)] ? obtenerNombreProducto_(productosMap[String(productoId)]) : stockItem.nombre,
      stockAnterior: stockAnterior,
      stockNuevo: nuevoStock,
      diferencia: nuevoStock - stockAnterior,
      motivo: String(motivo || "").trim(),
      admin: admin.email
    });
    registrarMovimientoStock_(ss, {
      tipo: "ajuste_manual",
      idRelacionado: idPedido,
      productoId: String(productoId),
      producto: productosMap[String(productoId)] ? obtenerNombreProducto_(productosMap[String(productoId)]) : stockItem.nombre,
      cantidadDelta: movimientoStock.cantidadDelta,
      stockAnterior: movimientoStock.stockAnterior,
      stockNuevo: movimientoStock.stockNuevo,
      observacion: String(motivo || "").trim() || `Ajuste manual por ${admin.email}`
    });
    bumpDataVersion_();

    const pedidosActualizados = obtenerPedidosParaGestionDesdeSpreadsheet_(ss);
    const pedidoActualizado = pedidosActualizados.find(function(pedido) {
      return pedido.id === idPedido;
    });

    return {
      mensaje: `Stock ajustado a ${nuevoStock} unidades.`,
      pedido: pedidoActualizado || null,
      actividad: obtenerActividadRecienteDesdeSpreadsheet_(ss, 12),
      resumen: {
        pedidos: pedidosActualizados.length,
        compras: obtenerComprasPendientesDesdeSpreadsheet_(ss).length
      }
    };
  });
}

function enviarMailRetiroListo_(to, pedidoId, items, tienePendiente) {
  if (!to) return "";

  return ejecutarEnvioMailSeguro_(`pedido listo ${pedidoId}`, function() {
    MailApp.sendEmail({
      to: to,
      subject: `Pedido listo para retirar - ${pedidoId}`,
      htmlBody: buildMailPedidoListo_(pedidoId, items, tienePendiente),
      name: "Goethe Schule Inventario"
    });
  });
}

function enviarMailRetiroRetirado_(to, pedidoId, items) {
  if (!to) return "";

  return ejecutarEnvioMailSeguro_(`pedido retirado ${pedidoId}`, function() {
    MailApp.sendEmail({
      to: to,
      subject: `Pedido retirado - ${pedidoId}`,
      htmlBody: buildMailPedidoRetirado_(pedidoId, items),
      name: "Goethe Schule Inventario"
    });
  });
}

function enviarMailPedidoRegistrado_(to, pedidoId, items) {
  if (!to) return "";

  return ejecutarEnvioMailSeguro_(`pedido recibido ${pedidoId}`, function() {
    MailApp.sendEmail({
      to: to,
      subject: `Pedido recibido - ${pedidoId}`,
      htmlBody: buildMailPedidoRegistrado_(pedidoId, to, items),
      name: "Goethe Schule Inventario"
    });
  });
}
