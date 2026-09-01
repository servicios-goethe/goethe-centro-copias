# Plan rápido para decisiones de arquitectura

## Objetivo

Reducir los riesgos operativos actuales sin cambiar el comportamiento funcional validado ni promover código a producción. El plan separa decisiones institucionales de trabajo técnico reversible.

## Diagnóstico de viabilidad

| Frente | Viabilidad | Esfuerzo técnico | Dependencia principal |
|---|---|---:|---|
| Separar recursos de desarrollo | Alta | 0,5–1 día | Acceso para crear carpeta Drive, destinatarios y validar permisos. |
| Configuración por Script Properties | Alta | 1–1,5 días | Definir valores por entorno y una cuenta que los cargue. |
| Threat model y política de embedding | Alta | 0,5–1 día | Aprobación del responsable de seguridad/negocio. |
| Retención de archivos de copias | Media | 0,5 día de diseño | Política institucional de conservación y eliminación. |
| DWH | Media para diseño; baja para implementación inmediata | 1 día de ADR; 1–3 semanas de integración | Dueño del DWH, contrato, privacidad e idempotencia. |

**Conclusión:** el alcance rápido y seguro es viable en **2–3 días hábiles**, si las decisiones del primer bloque se resuelven en una reunión breve. La integración DWH debe quedar como fase posterior: no es responsable implementarla sin contrato aprobado.

## Fase 0 — Decisiones que requieren responsable

Duración estimada: 60–90 minutos. No requiere cambios de código.

1. **Entornos:** confirmar que desarrollo debe tener su propia carpeta de copias y destinatarios de correo no productivos.
2. **Embedding:** decidir si la aplicación necesita ser embebida fuera del dominio. La recomendación es **no**; en ese caso se elimina `XFrameOptionsMode.ALLOWALL`.
3. **Retención:** fijar plazo, responsable y mecanismo de eliminación para archivos y logs de copias.
4. **DWH:** nombrar dueño funcional/técnico, sistema de destino y finalidad inicial (consulta, auditoría o sincronización operativa).

Salida: acta corta con las cuatro decisiones, propietarios y valores de configuración aprobados.

## Fase 1 — Aislamiento de desarrollo

Duración estimada: 0,5–1 día. Requiere autorización para crear o seleccionar recursos externos.

1. Crear o asignar una carpeta Drive exclusiva para copias de desarrollo.
2. Definir buzones/destinatarios de desarrollo para copias, compras y administración.
3. Verificar acceso de la cuenta desplegadora de desarrollo a esos recursos, con mínimo privilegio.
4. Ejecutar una prueba controlada de archivo y correo en desarrollo.

Salida: desarrollo deja de escribir archivos o enviar correos a recursos productivos.

## Fase 2 — Configuración por entorno

Duración estimada: 1–1,5 días. Reversible mediante compatibilidad temporal con los valores actuales.

1. Incorporar un resolvedor de configuración que lea Script Properties y mantenga valores de respaldo solo durante la migración.
2. Externalizar como mínimo Spreadsheet ID, carpeta Drive, destinatarios, entorno y metadatos de release.
3. Cargar propiedades diferenciadas en desarrollo y producción; no versionar secretos ni IDs de cada entorno nuevos.
4. Validar al iniciar que existan las propiedades requeridas y mostrar el entorno efectivo en la interfaz.
5. Probar en desarrollo y documentar el procedimiento de despliegue y rollback.

Salida: el mismo código se puede desplegar en cada entorno sin editar `AppConfig.js`.

## Fase 3 — Seguridad y operación mínima

Duración estimada: 0,5–1 día.

1. Crear y aprobar un threat model proporcional para GAS: identidad del desplegador, hojas, Drive, correo, tokens de decisión, archivos y embedding.
2. Aplicar la decisión de embedding de la fase 0.
3. Definir el tratamiento mínimo de archivos: permisos de carpeta, extensiones permitidas, retención y eliminación.
4. Definir monitoreo mínimo: revisión de errores en Cloud Logging y disponibilidad de `Log_Auditoria` y `Log_Copias`.

Salida: riesgos conocidos, controles, responsables y respuesta operativa documentados.

## Fase 4 — ADR de DWH, sin integración todavía

Duración estimada: 1 día después de contar con dueño y contrato.

El ADR debe decidir: propietario de datos, fuente de verdad, entidades incluidas, identificadores de correlación, timestamps UTC, frecuencia, método de transporte, idempotencia, reintentos, privacidad, retención y reconciliación. Solo después de aprobarlo se estima la integración; una primera integración simple suele requerir 1–3 semanas según el acceso al DWH.

## Orden recomendado

1. Fase 0.
2. Fase 1 y Fase 2.
3. Fase 3.
4. Fase 4 como iniciativa separada.

No se recomienda mezclar la promoción a producción de los hitos funcionales con la migración de configuración: son cambios de riesgo diferente y deben validarse en cortes independientes.
