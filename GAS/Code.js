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
