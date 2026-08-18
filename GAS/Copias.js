const COPIAS_HEADERS = [
  "ID_Solicitud", "Fecha_Solicitud", "Solicitante_Email", "Nivel",
  "Archivo_Nombre", "Archivo_ID", "Archivo_URL", "Paginas_Original",
  "Comentario", "Tamano", "Cantidad_Copias", "Modalidad", "Doble_Faz",
  "Color", "Estado", "Autorizado_Por", "Fecha_Decision", "Motivo_Rechazo",
  "Finalizado_Por", "Fecha_Finalizacion", "Token_Hash", "Token_Vence",
  "Ultima_Actualizacion"
];

const COPIAS_USUARIOS_HEADERS = ["Email", "Nivel", "Puede_Autorizar", "Activo"];
const COPIAS_LOG_HEADERS = ["Fecha", "Usuario", "ID_Solicitud", "Accion", "Detalle"];
const COPIAS_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "png", "txt", "zip"];

function asegurarEstructuraCopias_(ss) {
  asegurarHojaCopias_(ss, TABS.COPIAS, COPIAS_HEADERS);
  asegurarHojaCopias_(ss, TABS.COPIAS_USUARIOS, COPIAS_USUARIOS_HEADERS);
  asegurarHojaCopias_(ss, TABS.COPIAS_LOG, COPIAS_LOG_HEADERS);
}

function asegurarHojaCopias_(ss, nombre, headers) {
  let sheet = ss.getSheetByName(nombre);
  if (!sheet) sheet = ss.insertSheet(nombre);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizarNivelCopias_(value) {
  const nivel = String(value || "").trim().toUpperCase();
  return ["KG", "EP", "ES"].includes(nivel) ? nivel : "";
}

function normalizarSiNoCopias_(value) {
  const texto = String(value || "").trim().toLowerCase();
  return ["si", "s", "true", "1", "ja"].includes(texto) ? "SI" : "NO";
}

function extensionArchivoCopias_(nombre) {
  const match = String(nombre || "").trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function validarDatosSolicitudCopias_(data) {
  const nivel = normalizarNivelCopias_(data.nivel);
  const paginas = Number.parseInt(data.paginasOriginal, 10);
  const cantidad = Number.parseInt(data.cantidadCopias, 10);
  const tamano = String(data.tamano || "").trim().toUpperCase();
  const modalidad = String(data.modalidad || "").trim().toUpperCase();

  if (!nivel) throw new Error("Selecciona un nivel valido: KG, EP o ES.");
  if (!Number.isFinite(paginas) || paginas < 1) throw new Error("La cantidad de paginas debe ser mayor a cero.");
  if (!Number.isFinite(cantidad) || cantidad < 1) throw new Error("La cantidad de copias debe ser mayor a cero.");
  if (!["A4", "A3", "OFICIO"].includes(tamano)) throw new Error("Selecciona un tamano valido.");
  if (!["ARMADAS", "APILADAS"].includes(modalidad)) throw new Error("Selecciona la modalidad de las copias.");

  return {
    nivel: nivel,
    paginasOriginal: paginas,
    cantidadCopias: cantidad,
    tamano: tamano,
    modalidad: modalidad,
    dobleFaz: normalizarSiNoCopias_(data.dobleFaz),
    color: normalizarSiNoCopias_(data.color),
    comentario: String(data.comentario || "").trim().slice(0, 500)
  };
}

function obtenerIndicesCopias_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const indices = {};
  headers.forEach(function(header, index) {
    indices[String(header || "").trim()] = index;
  });
  COPIAS_HEADERS.forEach(function(header) {
    if (indices[header] === undefined) throw new Error(`Falta la columna ${header} en ${TABS.COPIAS}.`);
  });
  return indices;
}

function valorCopias_(row, indices, header) {
  return row[indices[header]];
}

function leerSolicitudCopias_(row, indices, rowNumber) {
  return {
    rowNumber: rowNumber,
    id: String(valorCopias_(row, indices, "ID_Solicitud") || ""),
    fecha: valorCopias_(row, indices, "Fecha_Solicitud"),
    solicitante: String(valorCopias_(row, indices, "Solicitante_Email") || "").trim(),
    nivel: String(valorCopias_(row, indices, "Nivel") || ""),
    archivoNombre: String(valorCopias_(row, indices, "Archivo_Nombre") || ""),
    archivoId: String(valorCopias_(row, indices, "Archivo_ID") || ""),
    archivoUrl: String(valorCopias_(row, indices, "Archivo_URL") || ""),
    paginasOriginal: Number(valorCopias_(row, indices, "Paginas_Original") || 0),
    comentario: String(valorCopias_(row, indices, "Comentario") || ""),
    tamano: String(valorCopias_(row, indices, "Tamano") || ""),
    cantidadCopias: Number(valorCopias_(row, indices, "Cantidad_Copias") || 0),
    modalidad: String(valorCopias_(row, indices, "Modalidad") || ""),
    dobleFaz: String(valorCopias_(row, indices, "Doble_Faz") || ""),
    color: String(valorCopias_(row, indices, "Color") || ""),
    estado: String(valorCopias_(row, indices, "Estado") || ""),
    decididoPor: String(valorCopias_(row, indices, "Autorizado_Por") || ""),
    fechaDecision: valorCopias_(row, indices, "Fecha_Decision"),
    motivoRechazo: String(valorCopias_(row, indices, "Motivo_Rechazo") || ""),
    finalizadoPor: String(valorCopias_(row, indices, "Finalizado_Por") || ""),
    fechaFinalizacion: valorCopias_(row, indices, "Fecha_Finalizacion"),
    tokenHash: String(valorCopias_(row, indices, "Token_Hash") || ""),
    tokenVence: valorCopias_(row, indices, "Token_Vence")
  };
}

function serializarSolicitudCopias_(solicitud) {
  return {
    id: solicitud.id,
    fecha: solicitud.fecha ? Utilities.formatDate(new Date(solicitud.fecha), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm") : "",
    solicitante: solicitud.solicitante,
    nivel: solicitud.nivel,
    archivoNombre: solicitud.archivoNombre,
    archivoUrl: solicitud.archivoUrl,
    paginasOriginal: solicitud.paginasOriginal,
    comentario: solicitud.comentario,
    tamano: solicitud.tamano,
    cantidadCopias: solicitud.cantidadCopias,
    modalidad: solicitud.modalidad,
    dobleFaz: solicitud.dobleFaz,
    color: solicitud.color,
    estado: solicitud.estado,
    decididoPor: solicitud.decididoPor,
    fechaDecision: solicitud.fechaDecision ? Utilities.formatDate(new Date(solicitud.fechaDecision), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm") : "",
    motivoRechazo: solicitud.motivoRechazo,
    finalizadoPor: solicitud.finalizadoPor,
    fechaFinalizacion: solicitud.fechaFinalizacion ? Utilities.formatDate(new Date(solicitud.fechaFinalizacion), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm") : ""
  };
}

function listarSolicitudesCopias_(ss) {
  asegurarEstructuraCopias_(ss);
  const sheet = getSheetOrThrow_(ss, TABS.COPIAS);
  if (sheet.getLastRow() < 2) return [];
  const indices = obtenerIndicesCopias_(sheet);
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function(row, index) {
    return leerSolicitudCopias_(row, indices, index + 2);
  }).filter(function(item) { return item.id; });
}

function getCopiasPanelData() {
  const ss = getSpreadsheet_();
  const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
  asegurarEstructuraCopias_(ss);
  const solicitudes = listarSolicitudesCopias_(ss);
  const propias = solicitudes.filter(function(item) { return item.solicitante === role.email; });
  const operativas = role.isAdmin ? solicitudes : [];
  return {
    role: role,
    propias: propias.sort(ordenarSolicitudesCopias_).map(serializarSolicitudCopias_),
    operativas: operativas.sort(ordenarSolicitudesCopias_).map(serializarSolicitudCopias_)
  };
}

function ordenarSolicitudesCopias_(a, b) {
  return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
}

function obtenerAutorizadoresCopias_(ss, nivel, excluirEmail) {
  asegurarEstructuraCopias_(ss);
  const sheet = getSheetOrThrow_(ss, TABS.COPIAS_USUARIOS);
  if (sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(normalizarEncabezadoAdmin_);
  const idxEmail = headers.indexOf("email");
  const idxNivel = headers.indexOf("nivel");
  const idxAutoriza = headers.indexOf("puedeautorizar");
  const idxActivo = headers.indexOf("activo");
  if ([idxEmail, idxNivel, idxAutoriza, idxActivo].some(function(index) { return index < 0; })) return [];

  return rows.slice(1).filter(function(row) {
    const email = String(row[idxEmail] || "").trim().toLowerCase();
    const nivelFila = String(row[idxNivel] || "").trim().toUpperCase();
    return email && email !== String(excluirEmail || "").toLowerCase()
      && (nivelFila === nivel || nivelFila === "TODOS")
      && normalizarSiNoCopias_(row[idxAutoriza]) === "SI"
      && normalizarSiNoCopias_(row[idxActivo]) === "SI";
  }).map(function(row) { return String(row[idxEmail]).trim().toLowerCase(); });
}

function generarIdSolicitudCopias_() {
  const props = PropertiesService.getScriptProperties();
  const hoy = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd");
  const key = `COPIAS_SEQ_${hoy}`;
  const seq = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(seq));
  return `COP-${hoy}-${String(seq).padStart(4, "0")}`;
}

function hashTokenCopias_(token) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token || ""));
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, "");
}

function obtenerOCrearSubcarpetaCopias_(parent, nombre) {
  const folders = parent.getFoldersByName(nombre);
  return folders.hasNext() ? folders.next() : parent.createFolder(nombre);
}

function guardarArchivoCopias_(blob, solicitudId, nivel) {
  const root = DriveApp.getFolderById(CONFIG.COPIAS_DRIVE_FOLDER_ID);
  const year = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy");
  const yearFolder = obtenerOCrearSubcarpetaCopias_(root, year);
  const levelFolder = obtenerOCrearSubcarpetaCopias_(yearFolder, nivel);
  const requestFolder = obtenerOCrearSubcarpetaCopias_(levelFolder, solicitudId);
  const originalName = String(blob.getName() || "archivo").replace(/[\\/:*?"<>|]+/g, "-");
  blob.setName(`${solicitudId}_${originalName}`);
  return requestFolder.createFile(blob);
}

function registrarSolicitudCopias(form) {
  return withScriptLock_(function() {
    const ss = getSpreadsheet_();
    const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
    if (!role.isGoethe) throw new Error("Solo se admiten solicitudes de cuentas @goethe.edu.ar.");
    asegurarEstructuraCopias_(ss);

    const data = validarDatosSolicitudCopias_(form || {});
    const blob = form && form.archivo;
    if (!blob || typeof blob.getName !== "function") throw new Error("Selecciona un archivo para copiar.");
    const archivoNombre = String(blob.getName() || "").trim();
    const extension = extensionArchivoCopias_(archivoNombre);
    if (!COPIAS_EXTENSIONS.includes(extension)) throw new Error("Formato no admitido. Usa PDF, DOC, DOCX, JPG, PNG, TXT o ZIP.");
    const archivoBytes = blob.getBytes().length;
    if (archivoBytes < 1) throw new Error("El archivo esta vacio.");
    if (archivoBytes > CONFIG.COPIAS_MAX_FILE_BYTES) throw new Error("El archivo supera el maximo de 80 MB.");

    const requiereAutorizacion = data.nivel !== "ES";
    const autorizadores = requiereAutorizacion ? obtenerAutorizadoresCopias_(ss, data.nivel, role.email) : [];
    if (requiereAutorizacion && !autorizadores.length) {
      throw new Error(`No hay autorizadores activos configurados para ${data.nivel}.`);
    }

    const id = generarIdSolicitudCopias_();
    const token = requiereAutorizacion ? Utilities.getUuid() + Utilities.getUuid() : "";
    const now = new Date();
    const vence = requiereAutorizacion ? new Date(now.getTime() + CONFIG.COPIAS_TOKEN_DAYS * 86400000) : "";
    const estado = requiereAutorizacion ? ESTADOS.COPIAS_SOLICITADO : ESTADOS.COPIAS_AUTORIZADO;
    const file = guardarArchivoCopias_(blob, id, data.nivel);
    const sheet = getSheetOrThrow_(ss, TABS.COPIAS);
    const indices = obtenerIndicesCopias_(sheet);
    const row = new Array(COPIAS_HEADERS.length).fill("");
    const values = {
      ID_Solicitud: id,
      Fecha_Solicitud: now,
      Solicitante_Email: role.email,
      Nivel: data.nivel,
      Archivo_Nombre: archivoNombre,
      Archivo_ID: file.getId(),
      Archivo_URL: file.getUrl(),
      Paginas_Original: data.paginasOriginal,
      Comentario: data.comentario,
      Tamano: data.tamano,
      Cantidad_Copias: data.cantidadCopias,
      Modalidad: data.modalidad,
      Doble_Faz: data.dobleFaz,
      Color: data.color,
      Estado: estado,
      Autorizado_Por: requiereAutorizacion ? "" : "AUTOMATICO_ES",
      Fecha_Decision: requiereAutorizacion ? "" : now,
      Motivo_Rechazo: "",
      Finalizado_Por: "",
      Fecha_Finalizacion: "",
      Token_Hash: token ? hashTokenCopias_(token) : "",
      Token_Vence: vence,
      Ultima_Actualizacion: now
    };
    Object.keys(values).forEach(function(header) { row[indices[header]] = values[header]; });
    appendRows_(sheet, [row]);
    registrarLogCopias_(ss, id, "solicitud_creada", { nivel: data.nivel, estado: estado, archivoBytes: archivoBytes });
    registrarAuditoria_(ss, "copias_solicitud_creada", { solicitudId: id, nivel: data.nivel, estado: estado });

    enviarMailCopiasSeguro_(ss, id, "solicitud_recibida", [role.email], function() {
      return buildMailCopiasRecibida_(id, data, estado);
    });
    if (requiereAutorizacion) {
      enviarMailCopiasSeguro_(ss, id, "autorizacion_solicitada", autorizadores, function() {
        return buildMailCopiasAutorizar_(id, role.email, data, token);
      });
    } else {
      enviarMailCopiasSeguro_(ss, id, "solicitud_es_autorizada", [RESPONSABLES.COPIAS], function() {
        return buildMailCopiasOperador_(id, role.email, data);
      });
    }
    bumpDataVersion_();
    return { ok: true, id: id, estado: estado, message: `Solicitud ${id} registrada.` };
  });
}

function buscarSolicitudCopiasPorToken_(ss, token) {
  const hash = hashTokenCopias_(token);
  const solicitudes = listarSolicitudesCopias_(ss);
  return solicitudes.find(function(item) { return item.tokenHash === hash; }) || null;
}

function usuarioPuedeAutorizarCopias_(ss, role, solicitud) {
  if (!role.email || role.email === solicitud.solicitante) return false;
  if (role.perfil === "admin") return true;
  return obtenerAutorizadoresCopias_(ss, solicitud.nivel, solicitud.solicitante).includes(role.email.toLowerCase());
}

function getDecisionCopiasData(token) {
  const ss = getSpreadsheet_();
  const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
  const solicitud = buscarSolicitudCopiasPorToken_(ss, token);
  if (!solicitud) throw new Error("El enlace de autorizacion no es valido.");
  if (!usuarioPuedeAutorizarCopias_(ss, role, solicitud)) {
    if (role.email === solicitud.solicitante) throw new Error("No podes autorizar tu propia solicitud.");
    throw new Error("No tenes permisos para decidir esta solicitud.");
  }
  if (solicitud.estado === ESTADOS.COPIAS_SOLICITADO && solicitud.tokenVence && new Date(solicitud.tokenVence) < new Date()) {
    throw new Error("El enlace de autorizacion vencio.");
  }
  return serializarSolicitudCopias_(solicitud);
}

function decidirSolicitudCopias(token, decision, motivo) {
  return withScriptLock_(function() {
    const ss = getSpreadsheet_();
    const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
    const solicitud = buscarSolicitudCopiasPorToken_(ss, token);
    if (!solicitud) throw new Error("El enlace de autorizacion no es valido.");
    if (!usuarioPuedeAutorizarCopias_(ss, role, solicitud)) {
      if (role.email === solicitud.solicitante) throw new Error("No podes autorizar tu propia solicitud.");
      throw new Error("No tenes permisos para decidir esta solicitud.");
    }
    if (solicitud.estado !== ESTADOS.COPIAS_SOLICITADO) {
      return {
        ok: true,
        alreadyProcessed: true,
        estado: solicitud.estado,
        message: `La solicitud ya fue ${solicitud.estado.toLowerCase()} por ${solicitud.decididoPor || "otro usuario"}.`
      };
    }
    if (solicitud.tokenVence && new Date(solicitud.tokenVence) < new Date()) throw new Error("El enlace de autorizacion vencio.");

    const normalizedDecision = String(decision || "").trim().toUpperCase();
    if (!["AUTORIZAR", "RECHAZAR"].includes(normalizedDecision)) throw new Error("Decision invalida.");
    const rechazo = normalizedDecision === "RECHAZAR";
    const motivoLimpio = String(motivo || "").trim().slice(0, 500);
    if (rechazo && !motivoLimpio) throw new Error("Ingresa el motivo del rechazo.");
    const estado = rechazo ? ESTADOS.COPIAS_RECHAZADO : ESTADOS.COPIAS_AUTORIZADO;
    const now = new Date();
    const sheet = getSheetOrThrow_(ss, TABS.COPIAS);
    const indices = obtenerIndicesCopias_(sheet);
    const row = sheet.getRange(solicitud.rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    row[indices.Estado] = estado;
    row[indices.Autorizado_Por] = role.email;
    row[indices.Fecha_Decision] = now;
    row[indices.Motivo_Rechazo] = rechazo ? motivoLimpio : "";
    row[indices.Ultima_Actualizacion] = now;
    sheet.getRange(solicitud.rowNumber, 1, 1, row.length).setValues([row]);
    registrarLogCopias_(ss, solicitud.id, rechazo ? "solicitud_rechazada" : "solicitud_autorizada", { usuario: role.email, motivo: motivoLimpio });
    registrarAuditoria_(ss, rechazo ? "copias_rechazada" : "copias_autorizada", { solicitudId: solicitud.id, usuario: role.email });

    enviarMailCopiasSeguro_(ss, solicitud.id, rechazo ? "rechazo_notificado" : "autorizacion_notificada", [solicitud.solicitante], function() {
      return buildMailCopiasDecision_(solicitud.id, estado, role.email, motivoLimpio);
    });
    if (!rechazo) {
      enviarMailCopiasSeguro_(ss, solicitud.id, "operador_notificado", [RESPONSABLES.COPIAS], function() {
        return buildMailCopiasOperador_(solicitud.id, solicitud.solicitante, solicitud);
      });
    }
    bumpDataVersion_();
    return { ok: true, estado: estado, message: `Solicitud ${estado.toLowerCase()} correctamente.` };
  });
}

function finalizarSolicitudCopias(id) {
  return withScriptLock_(function() {
    const ss = getSpreadsheet_();
    const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
    if (!role.isAdmin) throw new Error("No tenes permisos para finalizar solicitudes de copias.");
    const solicitud = listarSolicitudesCopias_(ss).find(function(item) { return item.id === String(id || ""); });
    if (!solicitud) throw new Error("No se encontro la solicitud.");
    if (solicitud.estado !== ESTADOS.COPIAS_AUTORIZADO) throw new Error("Solo se pueden finalizar solicitudes autorizadas.");
    const now = new Date();
    const sheet = getSheetOrThrow_(ss, TABS.COPIAS);
    const indices = obtenerIndicesCopias_(sheet);
    const row = sheet.getRange(solicitud.rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    row[indices.Estado] = ESTADOS.COPIAS_FINALIZADO;
    row[indices.Finalizado_Por] = role.email;
    row[indices.Fecha_Finalizacion] = now;
    row[indices.Ultima_Actualizacion] = now;
    sheet.getRange(solicitud.rowNumber, 1, 1, row.length).setValues([row]);
    registrarLogCopias_(ss, solicitud.id, "solicitud_finalizada", { usuario: role.email });
    registrarAuditoria_(ss, "copias_finalizada", { solicitudId: solicitud.id, usuario: role.email });
    enviarMailCopiasSeguro_(ss, solicitud.id, "finalizacion_notificada", [solicitud.solicitante], function() {
      return buildMailCopiasFinalizada_(solicitud.id);
    });
    bumpDataVersion_();
    return { ok: true, message: `Solicitud ${solicitud.id} finalizada y notificada.` };
  });
}

function registrarLogCopias_(ss, solicitudId, accion, detalle) {
  const sheet = asegurarHojaCopias_(ss, TABS.COPIAS_LOG, COPIAS_LOG_HEADERS);
  appendRows_(sheet, [[new Date(), Session.getActiveUser().getEmail(), solicitudId, accion, JSON.stringify(detalle || {})]]);
}

function enviarMailCopiasSeguro_(ss, solicitudId, etapa, destinatarios, buildBody) {
  const to = (destinatarios || []).filter(Boolean).join(",");
  if (!to) return;
  try {
    MailApp.sendEmail({
      to: to,
      subject: `Copias Goethe - ${solicitudId}`,
      htmlBody: buildBody()
    });
    registrarLogCopias_(ss, solicitudId, "mail_enviado", { etapa: etapa, destinatarios: destinatarios });
  } catch (error) {
    registrarLogCopias_(ss, solicitudId, "mail_error", { etapa: etapa, destinatarios: destinatarios, error: error.message || String(error) });
  }
}

function urlAccionCopias_(token, decision) {
  const base = ScriptApp.getService().getUrl();
  return `${base}?copiasAccion=${encodeURIComponent(decision)}&copiasToken=${encodeURIComponent(token)}`;
}

function buildMailCopiasRecibida_(id, data, estado) {
  return buildMailShell_({
    title: "Solicitud de copias recibida",
    metaRows: [
      { label: "Solicitud", value: id },
      { label: "Nivel", value: data.nivel },
      { label: "Estado", value: estado }
    ],
    bodyHtml: `<p style="color:#4f6157;line-height:1.6;">La solicitud fue registrada correctamente.</p>`
  });
}

function buildMailCopiasAutorizar_(id, solicitante, data, token) {
  const autorizar = urlAccionCopias_(token, "autorizar");
  const rechazar = urlAccionCopias_(token, "rechazar");
  return buildMailShell_({
    title: "Solicitud de copias pendiente",
    metaRows: [
      { label: "Solicitud", value: id },
      { label: "Solicitante", value: solicitante },
      { label: "Nivel", value: data.nivel },
      { label: "Copias", value: `${data.cantidadCopias} x ${data.paginasOriginal} pagina(s)` }
    ],
    bodyHtml: `<p style="color:#4f6157;line-height:1.6;">Revisa la solicitud y confirma una decision.</p>
      <p style="margin:22px 0 0;">
        <a href="${autorizar}" style="display:inline-block;padding:12px 18px;background:#006225;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-right:8px;">Autorizar</a>
        <a href="${rechazar}" style="display:inline-block;padding:12px 18px;background:#a83b32;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Rechazar</a>
      </p>`,
    noteHtml: "La decision se confirma dentro del sistema. El solicitante no puede autorizar su propio pedido.",
    noteTone: "warning"
  });
}

function buildMailCopiasDecision_(id, estado, usuario, motivo) {
  return buildMailShell_({
    title: estado === ESTADOS.COPIAS_AUTORIZADO ? "Solicitud autorizada" : "Solicitud rechazada",
    metaRows: [
      { label: "Solicitud", value: id },
      { label: "Estado", value: estado },
      { label: "Decidido por", value: usuario }
    ],
    bodyHtml: motivo ? `<p style="color:#4f6157;line-height:1.6;"><strong>Motivo:</strong> ${escapeHtmlMail_(motivo)}</p>` : ""
  });
}

function buildMailCopiasOperador_(id, solicitante, data) {
  return buildMailShell_({
    title: "Trabajo de copias autorizado",
    metaRows: [
      { label: "Solicitud", value: id },
      { label: "Solicitante", value: solicitante },
      { label: "Nivel", value: data.nivel },
      { label: "Tamano", value: data.tamano },
      { label: "Cantidad", value: data.cantidadCopias }
    ],
    bodyHtml: `<p style="color:#4f6157;line-height:1.6;">La solicitud ya puede ser procesada desde la bandeja de copias.</p>`
  });
}

function buildMailCopiasFinalizada_(id) {
  return buildMailShell_({
    title: "Copias listas para retirar",
    metaRows: [
      { label: "Solicitud", value: id },
      { label: "Estado", value: ESTADOS.COPIAS_FINALIZADO }
    ],
    bodyHtml: `<p style="color:#4f6157;line-height:1.6;">El trabajo esta finalizado y listo para retirar.</p>`
  });
}
