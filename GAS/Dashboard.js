function getAdminDashboardData() {
  const ss = getSpreadsheet_();
  const user = obtenerUsuarioActualDesdeSpreadsheet_(ss);

  if (!user.isAdmin) {
    throw new Error("No ten\u00e9s permisos para realizar esta acci\u00f3n.");
  }

  return {
    pedidos: obtenerPedidosParaGestionDesdeSpreadsheet_(ss),
    compras: user.isOperadorEntrega ? [] : obtenerComprasPendientesDesdeSpreadsheet_(ss),
    actividad: user.isOperadorEntrega ? [] : obtenerActividadRecienteDesdeSpreadsheet_(ss, 12)
  };
}
