# Plan de autorizaciones múltiples de solicitudes de copias

## Objetivo

Permitir que un autorizador apruebe varias solicitudes de copias en una sola operación, reduciendo el tiempo necesario para procesar tandas grandes —por ejemplo, 50 solicitudes— sin perder validaciones, auditoría ni control de concurrencia.

## Situación actual

Cada autorización individual realiza una llamada independiente al servidor. La operación actual:

1. Abre el Spreadsheet.
2. Obtiene y valida el usuario actual.
3. Busca la solicitud.
4. Valida que el usuario pueda autorizar el nivel correspondiente.
5. Lee y actualiza una fila.
6. Escribe el log de copias.
7. Escribe la auditoría.
8. Actualiza la versión de datos.

El costo aproximado actual es de 5 segundos por solicitud. Con 50 solicitudes, el procesamiento manual puede superar los cuatro minutos.

## Diseño recomendado

### Interfaz

Agregar selección múltiple en la solapa **Autorizaciones**:

- Checkbox por solicitud pendiente.
- Checkbox o acción para seleccionar todas las solicitudes visibles.
- Acción para seleccionar todas las solicitudes de un nivel.
- Contador de solicitudes seleccionadas.
- Botón **Autorizar seleccionadas**.
- Botón **Limpiar selección**.
- Confirmación antes de ejecutar, mostrando el total y los niveles involucrados.

La autorización individual debe mantenerse para casos puntuales.

### Backend

Crear una función específica, por ejemplo:

```text
autorizarSolicitudesCopiasMasivo(ids, rowNumbers)
```

La función debe:

1. Adquirir un único lock de script.
2. Obtener una sola vez el Spreadsheet, la hoja y los índices de columnas.
3. Obtener una sola vez el rol del usuario y sus niveles autorizables.
4. Leer las filas necesarias en una única operación.
5. Validar cada solicitud:
   - existencia;
   - estado `SOLICITADO`;
   - vencimiento del token;
   - nivel permitido para el autorizador;
   - que el autorizador no sea el solicitante.
6. Cambiar las filas válidas a `AUTORIZADO` en bloque.
7. Escribir los logs en bloque.
8. Escribir la auditoría en bloque.
9. Ejecutar `bumpDataVersion_()` una sola vez.
10. Devolver un resumen de resultados.

No se deben enviar mails durante la autorización, respetando el flujo acordado de notificaciones:

- mail al crear la solicitud;
- mail cuando el operador la marca como finalizada/lista para retirar.

## Resultado de la operación

La respuesta del backend debe informar:

- cantidad autorizada;
- solicitudes ya procesadas y omitidas;
- solicitudes sin permiso;
- solicitudes inexistentes o inválidas;
- mensaje general para mostrar en pantalla.

Ejemplo:

```json
{
  "autorizadas": 47,
  "omitidas": 2,
  "sinPermiso": 1,
  "errores": 0
}
```

Una solicitud inválida no debe impedir que se procesen las demás válidas.

## Seguridad y permisos

La operación masiva no debe confiar únicamente en los checkboxes del navegador. El servidor debe volver a validar cada solicitud.

La autorización efectiva requiere las dos configuraciones actuales:

### `Usuarios_Admin`

El usuario debe tener el perfil:

```text
autorizarcopias
```

Esto habilita la solapa de autorizaciones.

### `Usuarios_Copias`

Debe existir una fila con:

- email exacto;
- nivel `KG`, `EP`, `ES`, `BO` o `TODOS`;
- `Puede_Autorizar = SI`;
- `Activo = SI`.

La autorización masiva debe aplicar exactamente estas mismas reglas de permisos que la autorización individual.

## Concurrencia

Si dos autorizadores procesan simultáneamente la misma solicitud:

- el primero que confirme la operación la autoriza;
- el segundo debe recibirla como `omitida` porque ya no está en estado `SOLICITADO`;
- no se debe sobrescribir la decisión previa.

El lock único del backend y la validación de estado deben proteger este caso.

## Experiencia de usuario

Durante la operación se debe mostrar:

- estado “Autorizando X solicitudes…”;
- botón deshabilitado para evitar doble envío;
- resultado final con cantidades autorizadas y omitidas;
- actualización de la lista después de finalizar.

Si hay más de 50 solicitudes, la operación debe seguir ejecutándose como una única llamada, sin lanzar 50 llamadas independientes desde el navegador.

## Etapas de implementación

### Etapa 1 — diagnóstico y permisos

- Revisar usuarios reales de producción.
- Agregar diagnóstico visible del rol y niveles autorizables.
- Reducir problemas de caché al modificar perfiles.
- Confirmar que `ES` y `BO` no aparezcan como pendientes de autorización.

Estimación: medio día a 1 día.

### Etapa 2 — backend masivo

- Implementar `autorizarSolicitudesCopiasMasivo`.
- Validar permisos por solicitud.
- Actualizar filas en bloque.
- Registrar logs y auditoría en bloque.
- Implementar respuesta parcial con autorizadas, omitidas y errores.

Estimación: 1 día.

### Etapa 3 — interfaz

- Agregar checkboxes.
- Agregar selección global y por nivel.
- Agregar contador y confirmación.
- Agregar botón de autorización masiva.
- Mantener autorización individual.

Estimación: 1 día.

### Etapa 4 — pruebas

Probar en desarrollo:

- 1, 10 y 50 solicitudes.
- Solicitudes de KG, EP y ES.
- Solicitudes de BO, que deben entrar autorizadas automáticamente.
- Usuarios con nivel específico y con `TODOS`.
- Usuarios sin permiso.
- Dos autorizadores actuando al mismo tiempo.
- Solicitudes que ya cambiaron de estado.
- Rechazos y autorizaciones individuales mezcladas con una autorización masiva.

Estimación: medio día a 1 día.

## Estimación total

Entre **2 y 3 días de desarrollo y pruebas**.

El objetivo de rendimiento es procesar 50 solicitudes en pocos segundos, en lugar de aproximadamente cuatro minutos.

## Criterios de aceptación

- El autorizador puede seleccionar varias solicitudes visibles.
- Puede seleccionar por nivel o todas las visibles.
- Una única acción procesa el lote.
- El servidor revalida permisos y estados.
- Las filas se actualizan en bloque.
- Los logs y la auditoría quedan registrados.
- No se envían mails al autorizar.
- Las solicitudes concurrentes no se pisan.
- La autorización individual continúa funcionando.
- 50 solicitudes se procesan en menos de 10 segundos en condiciones normales.
