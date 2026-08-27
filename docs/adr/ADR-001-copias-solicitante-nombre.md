# ADR-001: Persistir el nombre del solicitante de copias

- Estado: Aceptado
- Fecha: 2026-08-18
- Responsables: Goethe-Schule Buenos Aires

## Contexto

La bandeja operativa de copias necesita identificar al solicitante por nombre, además del correo autenticado. El modelo existente solo conserva `Solicitante_Email`.

## Decisión

Agregar `Solicitante_Nombre` a `Solicitudes_Copias`, capturarlo como dato obligatorio al crear la solicitud y mantener `Solicitante_Email` como identidad y clave de trazabilidad local. La inicialización de Copias agrega de forma compatible cualquier encabezado faltante sin reordenar columnas existentes.

## Consecuencias

- Las solicitudes nuevas muestran nombre y fecha/hora en la bandeja.
- Las filas históricas continúan siendo válidas y usan el correo como nombre de respaldo.
- No se introduce integración DWH. Si se incorpora, deberá definirse otro ADR con claves de correlación, auditoría UTC, idempotencia y sincronización.
