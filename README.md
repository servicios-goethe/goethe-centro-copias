# Centro de Copias e Inventario Goethe

Aplicación web interna de Goethe-Schule Buenos Aires construida con Google Apps Script. Centraliza el catálogo y stock de insumos, pedidos y retiros, compras y recepción de mercadería, y solicitudes de trabajos de copias.

## Funcionalidad

- Catálogo bilingüe de productos y cálculo de stock físico, comprometido y disponible.
- Pedidos de insumos con edición previa a la preparación, entregas completas o parciales y notificaciones.
- Solicitudes de compra, recepción contra un producto real e ingreso de stock.
- Flujo de copias con archivos en Drive, autorización por nivel y finalización operativa.
- Perfiles de usuario, cuenta general, operador y administrador.
- Auditoría funcional, libro de movimientos de stock y caché invalidada por versión.

## Arquitectura y reglas

- [Arquitectura GAS](docs/gas-architecture.md)
- [Reglas de negocio](docs/business-rules.md)
- [Registro de avances y despliegues](docs/progress-log.md)
- [Estándar de ingeniería](CONVENTIONS.md)

La solución es un monolito modular de Google Apps Script. Usa Google Spreadsheet como fuente de verdad, Google Drive para archivos de copias y Google Mail para notificaciones. No existe actualmente una integración con el DWH central; cualquier diseño de esa integración requiere un ADR.

## Estructura

```text
.
├── CONVENTIONS.md
├── README.md
├── docs/
│   ├── business-rules.md
│   └── gas-architecture.md
└── GAS/
    ├── appsscript.json       # manifiesto, scopes y configuración de web app
    ├── .clasp.json           # vínculo con el proyecto Apps Script
    ├── AppConfig.js          # configuración y utilidades compartidas
    ├── Auth.js               # identidad y autorización
    ├── CatalogoStock.js      # catálogo y stock
    ├── Pedidos.js            # pedidos y retiros
    ├── Compras.js            # compras y recepciones
    ├── Copias.js             # flujo de copias
    ├── Audit.js              # auditoría general
    ├── MovimientosStock.js   # libro de stock
    ├── RowModels.js          # adaptación de filas
    ├── MailTemplates.js      # emails HTML
    ├── Dashboard.js          # datos administrativos
    ├── AppInfo.js            # información del deployment
    ├── Code.js               # entrada web
    └── *.html                # interfaz, estilos y scripts de cliente
```

## Requisitos

- Una cuenta Google Workspace del dominio Goethe con acceso a los recursos configurados.
- Un proyecto Google Apps Script con runtime V8.
- Node.js y `clasp` para sincronizar desde la línea de comandos.
- Un Spreadsheet con las hojas y encabezados esperados.
- Una carpeta de Drive para los archivos de copias.
- Permisos para enviar correo y consultar deployments de Apps Script.

La versión de Node.js y de `clasp` no está fijada en el repositorio. Para garantizar builds reproducibles, debe agregarse y versionarse esa definición antes de automatizar despliegues.

## Configuración

La configuración vigente está en `GAS/AppConfig.js`:

- ID del Spreadsheet;
- entorno y fallback de versión;
- ID de la carpeta Drive para copias;
- responsables de compras, copias y administración;
- TTL de cachés, tamaño máximo de archivos y vigencia de tokens.

Los IDs de recursos no son credenciales, pero son específicos del ambiente. Para nuevos ambientes se recomienda migrarlos a Script Properties. Las credenciales y secretos nunca deben guardarse en Git.

### Hojas requeridas

La aplicación espera estas hojas:

| Hoja | Creación automática |
|---|---|
| `Productos` | No |
| `Stock` | No |
| `Usuarios_Admin` | No |
| `Solicitudes_Compra` | No |
| `Pedidos_Retiro` | No |
| `Log_Auditoria` | No; si falta, la auditoría general se omite |
| `Movimientos_Stock` | Sí |
| `Solicitudes_Copias` | Sí |
| `Usuarios_Copias` | Sí |
| `Log_Copias` | Sí |

Las responsabilidades y claves de correlación de cada hoja están documentadas en [Arquitectura GAS](docs/gas-architecture.md). Los encabezados normativos se definen en `AppConfig.js`, `Copias.js` y `MovimientosStock.js`; el backend resuelve la mayoría de las columnas por nombre y falla explícitamente cuando falta una columna obligatoria.

## Instalación y despliegue

El repositorio ya contiene `GAS/.clasp.json`, vinculado a un proyecto Apps Script existente. Antes de ejecutar comandos, confirme que ese proyecto y los recursos configurados corresponden al ambiente deseado.

```bash
npm install --global @google/clasp
clasp login
cd GAS
clasp status
clasp push
```

`clasp push` modifica el proyecto remoto. Revise primero `clasp status` y use una cuenta autorizada. La publicación de una nueva versión o deployment debe seguir el proceso operativo de la institución; dicho proceso todavía no está versionado en este repositorio.

Para desarrollo local no existe un servidor equivalente: las APIs `SpreadsheetApp`, `DriveApp`, `MailApp`, `Session`, `CacheService` y `PropertiesService` requieren el runtime de Apps Script.

## Verificación mínima

No hay pruebas automatizadas versionadas. Antes de un despliegue, verifique en un ambiente no productivo:

1. acceso con usuario, cuenta general, operador y administrador;
2. ocultamiento de stock para solicitantes;
3. alta de producto y movimiento de stock inicial;
4. creación, edición, preparación, entrega parcial/completa y cancelación de pedido;
5. solicitud, recepción parcial/completa y cancelación de compra;
6. solicitud de copias para KG/EP y autorización por enlace;
7. autorización automática de ES y finalización por operador/admin;
8. rechazo de archivos inválidos, vacíos o mayores a 80 MB;
9. auditoría, movimientos, invalidación de caché y comportamiento ante falla de correo;
10. identidad mostrada por `Session.getActiveUser()` en el deployment real.

## Seguridad

- La web app está restringida al dominio, pero ejecuta con la identidad del desplegador.
- Los permisos sensibles se vuelven a validar en servidor.
- Los tokens de autorización de copias se almacenan como hash y vencen a los 14 días.
- El manifiesto solicita acceso a Spreadsheet, Drive, correo, identidad, almacenamiento, requests externos y lectura de deployments.

Debe aplicarse mínimo privilegio a la cuenta desplegadora y a los recursos compartidos. `XFrameOptionsMode.ALLOWALL`, los archivos cargados y la ausencia del threat model versionado son riesgos pendientes; consulte la sección de seguridad de [Arquitectura GAS](docs/gas-architecture.md).

## Operación y diagnóstico

- Los errores no controlados se envían a Cloud Logging mediante `exceptionLogging: STACKDRIVER`.
- `Log_Auditoria` contiene eventos funcionales generales.
- `Movimientos_Stock` permite reconciliar cada cambio de existencias.
- `Log_Copias` registra el flujo y los resultados de correo de copias.
- `AppInfo.js` consulta el deployment GAS más reciente y usa el fallback de configuración si esa consulta falla.
- Los correos fallidos no revierten la operación principal.

Ante datos desactualizados, confirme `DATA_VERSION` en Script Properties y espere el TTL correspondiente. Ante errores de esquema, compare los encabezados reales con los definidos en `AppConfig.js`, `Copias.js` y `MovimientosStock.js`; no reordene o renombre columnas en producción sin validar compatibilidad.

## Gobierno y contribución

Todo cambio debe cumplir [CONVENTIONS.md](CONVENTIONS.md), mantener documentación y código sincronizados y evitar secretos en el repositorio. Las decisiones estructurales deben documentarse con un ADR, en especial:

- integración con el DWH;
- cambio de fuente de verdad;
- separación en servicios;
- modificación del modelo de identidad o permisos;
- cambios en la exposición web o almacenamiento de archivos.

Todo nuevo modelo satélite debe incluir auditoría, clave estable de origen y trazabilidad hacia el DWH central. El contrato concreto aún debe definirse y aprobarse.

## Limitaciones documentales actuales

No están presentes en este repositorio `knowledge/architecture/`, `knowledge/security/threat-model.md`, `CLAUDE.md` ni `permissions.md`. Los skills citados en la solicitud (`governance/mcp-tool-wrapper.json` y `dotnet/dotnet10-clean-api.json`) tampoco están disponibles en el árbol ni cargados en la sesión. Estos documentos se basan por ello en el código de `GAS/` y en `CONVENTIONS.md`, y deberán reconciliarse cuando se incorporen las fuentes faltantes.
