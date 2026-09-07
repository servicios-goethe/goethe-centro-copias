function doGet() {
  return HtmlService.createTemplateFromFile("Index").evaluate()
    .setTitle("Inventario Goethe")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Verifica acceso OAuth y acceso efectivo de la cuenta desplegadora a la
 * carpeta de copias, sin crear ni modificar archivos.
 * Ejecutar manualmente desde el editor de Apps Script cuando se agrega el
 * scope de Drive o se cambia la carpeta configurada.
 */
function verificarAccesoDriveCopias() {
  const folder = DriveApp.getFolderById(CONFIG.COPIAS_DRIVE_FOLDER_ID);
  return {
    ok: true,
    folderId: folder.getId(),
    folderName: folder.getName()
  };
}

/**
 * Comprueba el permiso de escritura requerido por el flujo de copias.
 * Crea una carpeta temporal dentro de la carpeta configurada y la envía a
 * la papelera inmediatamente; no deja contenido operativo.
 */
function verificarEscrituraDriveCopias() {
  const parent = DriveApp.getFolderById(CONFIG.COPIAS_DRIVE_FOLDER_ID);
  const probe = parent.createFolder(`_verificacion_copias_${new Date().getTime()}`);
  const result = { ok: true, folderId: parent.getId(), probeId: probe.getId() };
  probe.setTrashed(true);
  return result;
}
