function escapeHtmlMail_(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateMail_(fecha) {
  return Utilities.formatDate(new Date(fecha || new Date()), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm");
}

function buildMailListItems_(items) {
  return (items || []).map(function(item) {
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e7ece9;color:#243129;">${escapeHtmlMail_(item.producto || "-")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e7ece9;color:#243129;text-align:right;font-weight:700;">${escapeHtmlMail_(item.cantidad)}</td>
      </tr>`;
  }).join("");
}

function buildMailCompraItems_(items) {
  return (items || []).map(function(item) {
    const referencia = String(item.referencia || item.link || "").trim();
    const referenciaHtml = !referencia
      ? `<span style="color:#6b7b71;">Sin referencia</span>`
      : /^https?:\/\//i.test(referencia)
        ? `<a href="${escapeHtmlMail_(referencia)}" style="color:${MAIL_BRAND.ACCENT};text-decoration:none;">Ver referencia</a>`
        : `<span>${escapeHtmlMail_(referencia)}</span>`;

    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e7ece9;color:#243129;">${escapeHtmlMail_(item.producto || "-")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e7ece9;color:#243129;text-align:right;font-weight:700;">${escapeHtmlMail_(item.cantidad)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e7ece9;color:#243129;">${referenciaHtml}</td>
      </tr>`;
  }).join("");
}

function buildMailMetaRows_(rows) {
  return (rows || []).map(function(row) {
    return `
      <tr>
        <td style="padding:4px 0;color:#6b7b71;width:132px;vertical-align:top;">${escapeHtmlMail_(row.label)}</td>
        <td style="padding:4px 0;color:#243129;font-weight:600;">${escapeHtmlMail_(row.value)}</td>
      </tr>`;
  }).join("");
}

function buildMailShell_(options) {
  const title = escapeHtmlMail_(options.title || "Notificacion");
  const intro = options.introHtml || "";
  const meta = options.metaRows && options.metaRows.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 18px;">${buildMailMetaRows_(options.metaRows)}</table>`
    : "";
  const body = options.bodyHtml || "";
  const note = options.noteHtml
    ? `<div style="margin-top:18px;padding:12px 14px;border-radius:10px;background:${options.noteTone === "warning" ? "#fff4d6" : "#edf5fb"};border:1px solid ${options.noteTone === "warning" ? "#f1d7a2" : "#d6e4f5"};color:${options.noteTone === "warning" ? "#7a4d10" : "#245b84"};line-height:1.5;">${options.noteHtml}</div>`
    : "";

  return `
    <div style="margin:0;padding:24px;background:#f4f7f6;font-family:Arial,sans-serif;color:#243129;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dde6e0;border-radius:18px;overflow:hidden;">
        <div style="background:${MAIL_BRAND.PRIMARY};padding:18px 22px;border-bottom:6px solid ${MAIL_BRAND.ACCENT};">
          <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#d6e9de;margin-bottom:8px;">Sistema de Inventario</div>
          <div style="font-size:32px;line-height:1;color:#ffffff;font-weight:700;">Goethe Schule</div>
        </div>
        <div style="padding:24px 24px 26px;">
          <h2 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:${MAIL_BRAND.PRIMARY};">${title}</h2>
          ${intro}
          ${meta}
          ${body}
          ${note}
        </div>
      </div>
    </div>`;
}

function buildMailPedidoRegistrado_(pedidoId, solicitanteMail, items) {
  return buildMailShell_({
    title: "Pedido recibido",
    metaRows: [
      { label: "Pedido", value: pedidoId },
      { label: "Solicitante", value: solicitanteMail },
      { label: "Fecha", value: formatDateMail_(new Date()) }
    ],
    bodyHtml: `
      <p style="margin:0 0 16px;color:#4f6157;line-height:1.6;">
        Recibimos tu pedido y ya fue registrado en el sistema.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e7ece9;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f7f9f8;">
            <th style="padding:10px 12px;text-align:left;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Producto</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Solicitado</th>
          </tr>
        </thead>
        <tbody>${buildMailListItems_(items)}</tbody>
      </table>`,
    noteHtml: "Si algun producto no estuviera disponible de inmediato, te avisaremos cuando quede listo para retirar."
  });
}

function buildMailPedidoListo_(pedidoId, items, tienePendiente) {
  return buildMailShell_({
    title: "Pedido listo para retirar",
    metaRows: [
      { label: "Pedido", value: pedidoId },
      { label: "Fecha", value: formatDateMail_(new Date()) }
    ],
    bodyHtml: `
      <p style="margin:0 0 16px;color:#4f6157;line-height:1.6;">
        Ya podes retirar los siguientes productos. Este mail incluye solo lo marcado como listo en esta gestion.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e7ece9;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f7f9f8;">
            <th style="padding:10px 12px;text-align:left;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Producto</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Listo</th>
          </tr>
        </thead>
        <tbody>${buildMailListItems_(items)}</tbody>
      </table>`,
    noteHtml: tienePendiente
      ? "Aun falta recibir algunos productos. Les avisaremos cuando esten disponibles."
      : "Podes acercarte a retirar el pedido cuando te resulte conveniente.",
    noteTone: tienePendiente ? "warning" : "info"
  });
}

function buildMailPedidoRetirado_(pedidoId, items) {
  return buildMailShell_({
    title: "Retiro registrado",
    metaRows: [
      { label: "Pedido", value: pedidoId },
      { label: "Fecha", value: formatDateMail_(new Date()) }
    ],
    bodyHtml: `
      <p style="margin:0 0 16px;color:#4f6157;line-height:1.6;">
        Se registro correctamente el retiro de los siguientes productos.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e7ece9;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f7f9f8;">
            <th style="padding:10px 12px;text-align:left;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Producto</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Retirado</th>
          </tr>
        </thead>
        <tbody>${buildMailListItems_(items)}</tbody>
      </table>`
  });
}

function buildMailCompraRegistrada_(compraId, solicitante, items) {
  return buildMailShell_({
    title: "Nueva solicitud de compra",
    metaRows: [
      { label: "Solicitud", value: compraId },
      { label: "Generada por", value: solicitante },
      { label: "Fecha", value: formatDateMail_(new Date()) }
    ],
    bodyHtml: `
      <p style="margin:0 0 16px;color:#4f6157;line-height:1.6;">
        Se genero una nueva solicitud de compra desde el sistema de inventario.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e7ece9;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f7f9f8;">
            <th style="padding:10px 12px;text-align:left;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Producto</th>
            <th style="padding:10px 12px;text-align:right;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Cantidad</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7b71;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Referencia</th>
          </tr>
        </thead>
        <tbody>${buildMailCompraItems_(items)}</tbody>
      </table>`,
    noteHtml: "Revisar la solicitud y avanzar con la gestion de compra correspondiente."
  });
}
