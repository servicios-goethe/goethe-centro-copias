# Checklist manual de validación — cierre de feedback

Este checklist se ejecuta sobre el deployment `/exec` de desarrollo. No requiere crear compras, solicitudes de copias ni otros registros que afecten recursos compartidos. Los controles que cambian el estado de un pedido o envían correo se ejecutan únicamente sobre un pedido de prueba acordado; no usar pedidos reales para esa comprobación.

## Pedidos

- [ ] Con la cuenta terminal `copias@goethemail.net`, se solicitan nombre, apellido y email del solicitante real.
- [ ] El formulario de pedido se mantiene legible en escritorio y en una ventana de hasta 900 px de ancho.
- [ ] Un material no listado se muestra como solicitud informativa y no ofrece acciones de preparar, retirar o ajustar stock.
- [ ] Una línea pendiente muestra disponible inicial, solicitado y disponible actual; puede editarse solo antes de preparación o retiro.
- [ ] Las tarjetas operativas no superponen textos, métricas ni controles en escritorio o móvil.

## Copias

- [ ] El formulario requiere nombre del solicitante antes de enviar.
- [ ] Una solicitud existente muestra solicitante y fecha/hora; si la fila histórica no tiene nombre, muestra el email.
- [ ] La búsqueda operativa encuentra por nombre y por email.

## Notificaciones

- [ ] Marcar una línea pendiente como lista produce una única notificación al solicitante.
- [ ] Repetir la acción sin una nueva transición a `Listo para retirar` no produce otro correo.
- [ ] Crear, editar, retirar o entregar un pedido no produce correo de pedido.

## Alcance del cierre

- [ ] La validación se realiza en desarrollo, no en producción.
- [ ] No se crean solicitudes de copias ni compras de prueba mientras Drive y destinatarios continúen compartidos con producción.
