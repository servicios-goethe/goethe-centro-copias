# Registro de avances y despliegues

Este documento registra cada corte verificable del proyecto. Un despliegue en desarrollo no implica aprobación para producción.

## 2026-08-27 — Hito 1 y corte de prueba en desarrollo

### Alcance completado

- Hito 1: formulario de nuevo pedido simplificado.
- Nombre completo y email alineados en escritorio y apilados hasta 900 px.
- Tipografía e inputs de cantidad con mayor legibilidad y resaltado visual.
- Grilla protegida contra recortes en pantallas angostas.
- Texto de ayuda de la cuenta general sincronizado con el formulario.

### Validaciones ejecutadas

- `git diff --check`: correcto.
- Sintaxis de todos los archivos `.js`: correcta con Node.js.
- Sintaxis de los bloques JavaScript de `Ui*.html`: correcta con Node.js.
- Sin referencias activas a los campos anteriores `solicitante-nombre` y `solicitante-apellido`.
- Validación visual en navegador: pendiente de ejecutar en el entorno GAS de desarrollo.

### Corte de integración

- Rama Git: `feat/feedback-usuarios-dev`.
- Proyecto GAS de desarrollo: `1ISG1EqFAsTqPsuKP8QstbflRLcQ7mKOm88HsZYSrSbWIjpB-NGOqO38N`.
- Estado de push GitHub: pendiente.
- Estado de sincronización GAS: pendiente.
- No se modifica ni despliega el proyecto GAS productivo.

### Pendientes conocidos incluidos en este corte

El árbol contiene avances de hitos posteriores que todavía deben corregirse y validarse:

- Hito 2: impedir acciones de stock sobre líneas de material no listado.
- Hito 3: incluir el ID del pedido en la clave DOM de edición del operador.
- Hitos 4 a 8: completar su validación individual antes de considerar un release productivo.

