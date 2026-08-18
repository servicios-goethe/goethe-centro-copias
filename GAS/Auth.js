function obtenerUsuarioActual_() {
  const ss = getSpreadsheet_();
  return obtenerUsuarioActualDesdeSpreadsheet_(ss);
}

function asegurarAdmin_() {
  const user = obtenerUsuarioActual_();
  if (!user.isAdmin) {
    throw new Error("No ten\u00e9s permisos para realizar esta acci\u00f3n.");
  }

  return user;
}

function getUserRole() {
  return obtenerUsuarioActual_();
}

function getBootstrapData() {
  const ss = getSpreadsheet_();
  const role = obtenerUsuarioActualDesdeSpreadsheet_(ss);
  const cacheKey = buildCacheKey_("bootstrap_v3", role.email || "anon");
  const cached = getCachedJson_(cacheKey);
  if (cached) {
    if (!cached.appInfo) cached.appInfo = getAppInfo_();
    if (!role.isAdmin) cached.productos = ocultarStockParaSolicitante_(cached.productos || []);
    return cached;
  }

  const productos = obtenerProductosConStockDesdeSpreadsheet_(ss);

  return putCachedJson_(cacheKey, {
    role: role,
    productos: role.isAdmin ? productos : ocultarStockParaSolicitante_(productos),
    appInfo: getAppInfo_(),
    catalogDiagnostics: role.isAdmin ? obtenerDiagnosticoCatalogo_(ss, productos) : null
  }, CONFIG.CACHE_TTL_BOOTSTRAP);
}

function obtenerUsuarioActualDesdeSpreadsheet_(ss) {
  const email = Session.getActiveUser().getEmail();
  const cacheKey = `role:${email || "anon"}`;
  const cached = getCachedJson_(cacheKey);
  if (cached) return cached;

  const adminsSheet = getSheetOrThrow_(ss, TABS.ADMINS);
  const perfiles = obtenerPerfilesAdminDesdeSheet_(adminsSheet);
  const perfil = perfiles[email] || "";
  const isOperadorEntrega = perfil === "operador";
  const isCuentaGeneral = perfil === "general";

  return putCachedJson_(cacheKey, {
    email: email,
    perfil: perfil || "usuario",
    isAdmin: perfil === "admin" || isOperadorEntrega,
    isOperadorEntrega: isOperadorEntrega,
    isCuentaGeneral: isCuentaGeneral,
    isGoethe: email.endsWith("@goethe.edu.ar")
  }, CONFIG.CACHE_TTL_ROLE);
}

function normalizarPerfilAdmin_(valor) {
  const perfil = String(valor || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ");

  if (perfil === "operador" || perfil === "operador entrega" || perfil === "entrega") {
    return "operador";
  }

  if (perfil === "general" || perfil === "terminal" || perfil === "cuenta general") {
    return "general";
  }

  if (perfil === "admin" || perfil === "administrador" || perfil === "administrator") {
    return "admin";
  }

  return "";
}

function normalizarEncabezadoAdmin_(valor) {
  return String(valor || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}

function obtenerPerfilesAdminDesdeSheet_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return {};

  const headers = values[0].map(normalizarEncabezadoAdmin_);
  const idxEmail = headers.findIndex(function(header) {
    return header === "email" || header === "mail" || header === "usuario";
  });
  const idxPerfil = headers.findIndex(function(header) {
    return header === "perfil" || header === "rol" || header === "role";
  });
  const perfiles = {};

  if (idxEmail >= 0 && idxPerfil >= 0) {
    values.slice(1).forEach(function(row) {
      const email = String(row[idxEmail] || "").trim();
      const perfil = normalizarPerfilAdmin_(row[idxPerfil]);
      if (email && perfil) perfiles[email] = perfil;
    });
    return perfiles;
  }

  values.forEach(function(row) {
    row.forEach(function(valor) {
      const email = String(valor || "").trim();
      if (email && email.includes("@")) perfiles[email] = "admin";
    });
  });
  return perfiles;
}
