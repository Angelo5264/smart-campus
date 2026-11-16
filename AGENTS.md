# AGENTS.md — SmartCampus MVP

## Misión
Implementar un MVP funcional de SmartCampus en un plazo muy corto, guiándose por `SPEC.md`. No construir el producto completo ni introducir infraestructura innecesaria. Prioridad absoluta: demo reproducible de extremo a extremo.

## Instrucciones de trabajo
1. Inspecciona el repositorio antes de modificarlo. Si está vacío, crea la estructura especificada.
2. Trabaja en vertical slices: primero base de datos + consulta API + pantalla; luego ML + predicción + semáforo; luego seguimiento y pruebas.
3. No solicites confirmación para decisiones menores; adopta opciones simples, documenta supuestos y continúa.
4. No afirmes que existe capacidad predictiva validada si solo hay datos sintéticos, reglas o datos no etiquetados. Diferencia visiblemente `SIMULATED`, `EXPERIMENTAL` y `VALIDATED`.
5. Implementa Java 21 + Spring Boot 3.x para API principal, Python 3.11+ + FastAPI/scikit-learn para ML y React + TypeScript + Vite para UI. PostgreSQL 16 en Docker Compose. No implementar autenticación compleja para la demo: usar un tutor demo bien identificado, pero NO afirmar que es seguro para producción.
6. Evita dependencias innecesarias, microservicios adicionales, Kubernetes, mensajería, OAuth, Firebase y automatizaciones cloud en este MVP.
7. No incluir datos personales reales; fixtures completamente ficticios. No copiar estudiantes reales desde el documento.
8. Nunca commitear credenciales, `.env`, archivos con datos privados ni tokens. Proveer `.env.example`.
9. Código legible y pruebas mínimas automatizadas; verificar compilación, pruebas y ejecución antes de declarar completado.
10. Mantener `README.md` con instrucciones exactas de ejecución, diagrama simple y limitaciones. Registrar en `PROGRESS.md` qué funciona, qué está pendiente y comandos ejecutados.
11. Ante bloqueo del servicio ML, la UI debe indicar claramente "Predicción no disponible"; no inventar probabilidades. Solo se permiten resultados simulados si están explícitamente etiquetados.
12. Las notificaciones push reales y la sincronización LMS quedan fuera del primer entregable. Mostrar alertas dentro de la web; diseño preparado para futuras push.

## Orden de ejecución
- Entrega A: repositorio arranca con `docker compose up --build`, datos ficticios cargados, `GET /api/students` y dashboard.
- Entrega B: microservicio ML con `/health` y `/predict`, integración Spring Boot, botón o job manual de cálculo de riesgo, semáforo y procedencia de resultados.
- Entrega C: endpoint y UI para registrar una intervención del tutor; pruebas y documentación.

## Criterios de hecho
- El usuario puede abrir la web y ver estudiantes ficticios de 3 aulas piloto.
- Puede abrir el detalle de un estudiante, ver indicadores (asistencia, cursos desaprobados, créditos, actividad LMS), el riesgo y la fecha de cálculo.
- Un endpoint Spring Boot solicita una predicción al servicio Python; se almacena con `model_version`, `prediction_mode`, `created_at` y se muestra en UI.
- Puede registrar un seguimiento básico (nota, tipo y fecha) ligado al estudiante.
- El proyecto arranca y se prueba con comandos documentados, sin configuraciones manuales secretas.
- Los resultados de modelos entrenados con datos sintéticos aparecen con etiqueta EXPERIMENTAL; los basados en reglas, SIMULATED.
