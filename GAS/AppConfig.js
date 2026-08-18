const SS_ID = "14o0hqNiSn1BcDvIMAPXRb0R5T9lKP5FNl3A2j81U7hs";

const CONFIG = {
  SPREADSHEET_ID: SS_ID,
  ENVIRONMENT: "PRODUCCION",
  COPIAS_DRIVE_FOLDER_ID: "1j-9aqOnXGtAi6jRnzfdz2gAzv9LQgA10",
  RELEASE_FALLBACK: {
    VERSION: "HEAD",
    DEPLOYED_AT: "",
    SOURCE: "config"
  },
  TIMEZONE: "GMT-3",
  CACHE_TTL_BOOTSTRAP: 45,
  CACHE_TTL_PRODUCTOS: 45,
  CACHE_TTL_ROLE: 300,
  CACHE_TTL_APP_INFO: 60,
  CACHE_MAX_VALUE_CHARS: 90000,
  COPIAS_MAX_FILE_BYTES: 80 * 1024 * 1024,
  COPIAS_TOKEN_DAYS: 14
};

const TABS = {
  PRODUCTOS: "Productos",
  STOCK: "Stock",
  ADMINS: "Usuarios_Admin",
  COMPRAS: "Solicitudes_Compra",
  RETIROS: "Pedidos_Retiro",
  LOG: "Log_Auditoria",
  MOVIMIENTOS_STOCK: "Movimientos_Stock",
  COPIAS: "Solicitudes_Copias",
  COPIAS_USUARIOS: "Usuarios_Copias",
  COPIAS_LOG: "Log_Copias"
};

const RESPONSABLES = {
  COMPRAS: "l.aristu@goethe.edu.ar",
  COPIAS: "copias@goethe.edu.ar",
  ADMINISTRACION: "administracion@goethe.edu.ar"
};

const MAIL_BRAND = {
  PRIMARY: "#006225",
  ACCENT: "#9A8348"
};

const ESTADOS = {
  RETIRO_PENDIENTE: "Pendiente",
  RETIRO_LISTO: "Listo para retirar",
  RETIRO_RETIRADO_PARCIAL: "Retirado parcial",
  RETIRO_RETIRADO: "Retirado",
  RETIRO_CANCELADO: "Cancelado",
  COMPRA_PENDIENTE: "Pendiente",
  COMPRA_RECIBIDA_PARCIAL: "Recibido parcial",
  COMPRA_RECIBIDA: "Recibido",
  COMPRA_CANCELADA: "Cancelado",
  COPIAS_SOLICITADO: "SOLICITADO",
  COPIAS_AUTORIZADO: "AUTORIZADO",
  COPIAS_RECHAZADO: "RECHAZADO",
  COPIAS_FINALIZADO: "FINALIZADO"
};

const COLUMNAS = {
  PRODUCTOS: {
    ID: ["ID_Producto"],
    NOMBRE_ES: ["NombreES"],
    NOMBRE_DE: ["NombreDE"],
    CATEGORIA: ["Categor\u00eda", "Categor\u00c3\u00ada"],
    STOCK_MINIMO: ["Stock_Minimo"],
    UNIDAD_MEDIDA: ["Unidad_Medida"]
  },
  STOCK: {
    ID: ["ID_Producto"],
    CANTIDAD_ACTUAL: ["Cantidad_Actual"],
    ULTIMA_ACTUALIZACION: ["Ultima_Actualizacion"]
  },
  RETIROS: {
    ID_LOTE: 0,
    FECHA: 1,
    USUARIO: 2,
    PRODUCTO: 3,
    CANTIDAD: 4,
    ESTADO: 5,
    OBSERVACIONES: 6,
    GESTIONADO_POR: 7,
    PRODUCTO_ID: 8
  },
  COMPRAS: {
    ID_LOTE: 0,
    FECHA: 1,
    USUARIO: 2,
    PRODUCTO: 3,
    CANTIDAD: 4,
    ESTADO: 5,
    OBSERVACIONES: 6,
    LINK: 7,
    PRODUCTO_ID: 8
  }
};

const COLUMNAS_OPERATIVAS = {
  RETIROS: {
    ID_PEDIDO: ["ID_Pedido"],
    FECHA: ["Fecha"],
    SOLICITANTE: ["Solicitante"],
    PRODUCTO: ["Producto"],
    CANTIDAD: ["Cantidad"],
    ESTADO: ["Estado"],
    AUTORIZADOR: ["Autorizador"],
    ENTREGADO_POR: ["Entregado_Por"],
    SOLICITANTE_MAIL: ["Solicitante_Mail"],
    PRODUCTO_ID: ["Producto_ID"],
    CANTIDAD_SOLICITADA: ["Cantidad_Solicitada"],
    CANTIDAD_LISTA: ["Cantidad_Lista"],
    CANTIDAD_RETIRADA: ["Cantidad_Retirada"],
    CANTIDAD_PENDIENTE: ["Cantidad_Pendiente"],
    OBSERVACIONES: ["Observaciones"]
  },
  COMPRAS: {
    ID_COMPRA: ["ID_Compra"],
    FECHA: ["Fecha"],
    SOLICITANTE: ["Solicitante"],
    PRODUCTO: ["Producto"],
    CANTIDAD: ["Cantidad"],
    ESTADO: ["Estado"],
    AUTORIZADOR: ["Autorizador"],
    URL_REFERENCIA: ["URL_Referencia"],
    SOLICITANTE_MAIL: ["Solicitante_Mail"],
    PRODUCTO_SOLICITADO_ID: ["Producto_Solicitado_ID"],
    CANTIDAD_SOLICITADA: ["Cantidad_Solicitada"],
    PRODUCTO_RECIBIDO_ID: ["Producto_Recibido_ID"],
    PRODUCTO_RECIBIDO: ["Producto_Recibido"],
    CANTIDAD_RECIBIDA: ["Cantidad_Recibida"],
    CANTIDAD_PENDIENTE: ["Cantidad_Pendiente"],
    OBSERVACIONES: ["Observaciones"]
  }
};

function getSpreadsheet_() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheetOrThrow_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`No se encontr\u00f3 la hoja "${sheetName}".`);
  }

  return sheet;
}

function getRows_(sheet) {
  return sheet.getDataRange().getValues();
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getScriptCache_() {
  return CacheService.getScriptCache();
}

function getDataVersion_() {
  const props = PropertiesService.getScriptProperties();
  const version = props.getProperty("DATA_VERSION");

  if (version) return version;

  const nuevaVersion = String(Date.now());
  props.setProperty("DATA_VERSION", nuevaVersion);
  return nuevaVersion;
}

function bumpDataVersion_() {
  const nuevaVersion = String(Date.now());
  PropertiesService.getScriptProperties().setProperty("DATA_VERSION", nuevaVersion);
  return nuevaVersion;
}

function buildCacheKey_(prefix, suffix) {
  const version = getDataVersion_();
  return `${prefix}:v${version}:${suffix || "default"}`;
}

function getCachedJson_(key) {
  const raw = getScriptCache_().get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function putCachedJson_(key, value, ttlSeconds) {
  const serialized = JSON.stringify(value);
  if (serialized.length > CONFIG.CACHE_MAX_VALUE_CHARS) {
    return value;
  }

  try {
    getScriptCache_().put(key, serialized, ttlSeconds);
  } catch (error) {
    return value;
  }

  return value;
}

function ejecutarEnvioMailSeguro_(descripcion, callback) {
  try {
    callback();
    return "";
  } catch (error) {
    try {
      registrarAuditoria_(getSpreadsheet_(), "mail_error", {
        descripcion: descripcion,
        error: error && error.message ? error.message : String(error)
      });
    } catch (auditError) {
      // No bloquea la operacion principal si tambien falla la auditoria.
    }

    return ` Operacion guardada, pero no se pudo enviar el mail: ${descripcion}.`;
  }
}

function agregarAdvertenciaMail_(mensaje, advertencia) {
  return advertencia ? `${mensaje}${advertencia}` : mensaje;
}
