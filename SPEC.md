# SmartCampus — Especificación de MVP (2 días)

## 1. Contexto y objetivo
Proyecto académico: SmartCampus, detección temprana de estudiantes con posible riesgo de deserción en instituciones de educación superior de Piura. La propuesta original plantea integración de notas, asistencia y LMS, análisis predictivo, semáforo de riesgo, alertas para tutores y seguimiento humano. El primer piloto previsto es de tres aulas y con revisión semanal. El sistema no sanciona automáticamente y no sustituye al tutor.

**Objetivo MVP:** demostrar en un navegador el flujo completo **datos ficticios -> indicadores -> API -> motor ML o simulación identificada -> semáforo -> revisión y registro de intervención del tutor**.

**No incluido ahora:** Moodle real, ERP universitario, notificaciones push reales, acceso a datos institucionales, chatbot, SHAP, clustering, MLOps automatizado, control de acceso en producción, despliegue a nube.

## 2. Decisiones propuestas para implementación (no están fijadas en el informe académico)
- **Frontend:** React, TypeScript, Vite, React Router opcional; CSS simple y responsive (sin librerías UI pesadas obligatorias).
- **Backend principal:** Java 21, Spring Boot 3.x, Spring Web, Spring Data JPA, Validation, PostgreSQL Driver.
- **Motor ML:** Python 3.11+, FastAPI, scikit-learn, pandas, joblib.
- **BD:** PostgreSQL 16 (Docker), Flyway opcional (si acelera la implementación usar `schema.sql` / migración simple fiable).
- **Orquestación local:** `docker-compose.yml` con `db`, `api`, `ml`, `web`; healthchecks y `.env.example`.
- **Predicción:** baseline de regresión logística + Random Forest como candidato principal; elegir uno con evaluación documentada cuando exista un dataset etiquetado adecuado. No usar la muestra de encuesta del informe como dataset supervisado de abandono.

## 3. Modelo de datos mínimo
- `classroom` (`id`, `name`, `term`)
- `student` (`id`, `code`, `display_name`, `classroom_id`, `active`) — nombres ficticios para demo
- `academic_snapshot` (`id`, `student_id`, `term`, `recorded_at`, `attendance_rate`, `failed_courses`, `earned_credits`, `lms_activity_count`, `gpa` opcional)
- `risk_assessment` (`id`, `student_id`, `snapshot_id`, `risk_probability` nullable, `risk_level`, `prediction_mode`, `model_version`, `created_at`, `explanation` nullable)
- `intervention` (`id`, `student_id`, `tutor_name`, `type`, `notes`, `created_at`, `next_action_date` nullable)

Enums:
- riesgo: `LOW`, `MEDIUM`, `HIGH`, `UNAVAILABLE`.
- procedencia: `SIMULATED` (reglas para demo), `EXPERIMENTAL` (ML con dataset sin validación institucional), `VALIDATED` (solo si existe evidencia de validación real autorizada; nunca asignar por defecto).

Evitar almacenar datos sensibles económicos o de salud en fixtures; no usar nombres reales.

## 4. Contrato HTTP Spring Boot
Prefijo `/api`.
- `GET /api/health` -> `{ "status": "UP" }`
- `GET /api/classrooms` -> aulas piloto.
- `GET /api/students?classroomId=&riskLevel=` -> listado con último snapshot y último riesgo (paginación opcional).
- `GET /api/students/{id}` -> detalle + historial pequeño de evaluaciones e intervenciones.
- `POST /api/students/{id}/assess` -> lee último snapshot, llama al motor ML, persiste resultado y devuelve evaluación; si ML falla responder 503 claro, no inventar resultados.
- `GET /api/alerts` -> alumnos con último riesgo HIGH o MEDIUM, agrupables por clase.
- `POST /api/students/{id}/interventions` -> `{ "tutorName": "Tutor Demo", "type": "CALL|MEETING|ACADEMIC_SUPPORT|OTHER", "notes": "...", "nextActionDate": "2026-11-20" }`.
- `GET /api/students/{id}/interventions` -> intervenciones.
- `POST /api/assessments/run-demo` opcional -> calcula predicciones para snapshots ficticios sin tener que pulsar por alumno. Protegerlo como ruta solo de demo.

Validar entradas, CORS para entorno local, respuestas de error estructuradas.

## 5. Contrato HTTP FastAPI
- `GET /health` -> `{ "status": "UP", "model_loaded": true|false, "model_version": "..." }`
- `POST /predict` entrada:
```json
{
  "attendance_rate": 0.55,
  "failed_courses": 3,
  "earned_credits": 65,
  "lms_activity_count": 4,
  "gpa": 11.5
}
```
Salida ML (cuando hay modelo realmente entrenado):
```json
{
  "risk_probability": 0.82,
  "risk_level": "HIGH",
  "prediction_mode": "EXPERIMENTAL",
  "model_version": "rf-demo-v1",
  "explanation": "Resultado experimental; no validado con datos institucionales"
}
```
El ejemplo es ilustrativo, **no una predicción real**. Si no hay modelo/dataset listo, crear endpoint de reglas como `/simulate` que retorne `SIMULATED` y `risk_probability: null` (riesgo por reglas, no probabilidad estadística). No etiquetar umbrales arbitrarios como científicos; configurarlos y documentarlos como heurísticos de demostración.

## 6. Datos de demostración y entrenamiento
- Sembrar 3 aulas, aprox. 24 estudiantes inventados, snapshots distintos, con perfiles de asistencia/actividad/rendimiento contrastados.
- Prohibido inventar etiquetas reales de deserción para sostener una afirmación de precisión científica.
- Ruta preferida: si se dispone de un dataset público etiquetado con licencia adecuada, documentar fuente, definición de abandono, variables efectivamente disponibles, proceso de adaptación y resultados de evaluación (split temporal si existe tiempo académico). No usar columnas que revelen el resultado futuro ni métricas de evaluación infladas.
- Ruta fallback para la demo en 2 días: heurísticas transparentes de riesgo, marcadas como `SIMULATED`, mientras se deja implementado el adaptador a FastAPI para un modelo experimental posterior.
- Si se logra entrenar, incluir scripts reproducibles `train.py`, `evaluate.py`, modelo serializado y `metrics.json` junto con README indicando limitaciones y procedencia del dataset. Comparar baseline con Random Forest si es viable.
- El informe propone evaluar recall, precision y AUC, con recall >=70% como **criterio objetivo propuesto**, nunca como logro no medido.

## 7. Frontend: pantallas mínimas
1. **Dashboard**: conteo de alumnos por nivel (bajo/medio/alto/no disponible), últimas alertas, aulas del piloto, aviso de modo demostración.
2. **Estudiantes**: tabla con búsqueda/filtro por aula; columnas código, nombre, asistencia, cursos desaprobados, actividad LMS, riesgo, fecha.
3. **Detalle estudiante**: indicadores, última evaluación, origen/versión del modelo, historial, botón "Calcular riesgo" y formulario "Registrar seguimiento".
4. **Alertas**: lista ordenada por nivel de riesgo, acceso rápido al detalle.

Diseño sobrio, responsive, etiquetas accesibles. Mostrar las categorías de riesgo con texto además de color. El aviso debe ir al tutor (no al alumno). No mostrar información sensible en notificaciones.

## 8. Seguridad y límites
- Solo datos ficticios locales. Modo demo claramente marcado y sin acceso a datos reales.
- La autenticación RBAC, cifrado y auditoría se describen como requisitos de producción, no como implementados si no lo están.
- Variables socioeconómicas excluidas del MVP.
- No habilitar accesos públicos a la demo sin seguridad apropiada.
- Consentimiento, reglas institucionales y aplicación de normativa deben revisarse antes de un piloto real.

## 9. Tests y verificación
- Tests Python sobre `/health`, predicción/modelo o simulación, entrada inválida.
- Tests Spring sobre servicio/controlador de estudiantes y manejo de servicio ML no disponible.
- Al menos un smoke test end-to-end manual: `docker compose up --build` -> abrir dashboard -> ver 3 aulas -> entrar estudiante -> calcular evaluación -> ver semáforo -> crear intervención -> consultar historial.
- Evitar que se genere una evaluación nueva por cada `GET`.
- Timestamps en UTC en backend y renderizados en zona local del cliente.

## 10. Resultado que Codex debe entregar
- Repositorio completo compilable y ejecutable.
- README con prerequisitos, un comando principal, puertos, screenshots opcionales y limitaciones.
- `.env.example`, seed reproducible, migraciones y comandos de pruebas.
- `PROGRESS.md` con entregado/pending.
- Demostración funcional sin datos personales reales.

## 11. Prioridades en caso de falta de tiempo
**P0:** repo, levantar 4 servicios, seed, tabla estudiantes, API, dashboard, motor de riesgo (simulado o experimental con etiqueta correcta), detalle y botón calcular.
**P1:** registrar intervención, alertas filtradas, pruebas esenciales.
**P2:** modelo adicional, SHAP, clustering, exportación CSV, notificaciones push, login/RBAC, infraestructura nube.
Nunca sacrificar P0 por P2.

## 12. Correspondencia con informe APF3
- Secciones 1.4–1.5: objetivos, alcance y variables.
- Sección 2.1.2: MVP reducido, 3 aulas piloto, alertas móviles como meta; recall >=70% propuesto como validación posterior.
- Secciones 2.2.1–2.2.2: backlog HU01–HU10 y sprints propuestos.
- Sección 2.3: arquitectura fuentes -> ETL -> repositorio -> riesgo -> alerta; seguridad transversal.
- Secciones 3.2–3.5: integración semanal, clasificación supervisada (regresión logística/árbol/Random Forest/Gradient Boosting), clustering K-Means/DBSCAN, SHAP, Cloud/DevOps/MLOps, canal tutor.
- Sección 3.8: falta de datos, falsos positivos, predicción != prueba de reducción real de deserción.
