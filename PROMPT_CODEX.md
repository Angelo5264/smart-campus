# Prompt para pegar directamente en Codex

Necesito que IMPLEMENTES, no solo planifiques, un MVP funcional de SmartCampus en este repositorio. Lee primero `AGENTS.md` y `SPEC.md` completos y síguelos como criterios de aceptación.

Contexto: proyecto académico sobre detección temprana de riesgo de deserción estudiantil. Soy un solo desarrollador y tenemos dos días para demostrar aproximadamente la mitad del producto. Prioriza una demostración vertical real que funcione localmente. Quiero React + TypeScript + Vite, Spring Boot Java 21, PostgreSQL y FastAPI Python con scikit-learn; utiliza Docker Compose. Los estudiantes deben ser ficticios y pertenecer a 3 aulas piloto.

Procede de inmediato en este orden:
1. Inspecciona los archivos y crea la estructura del monorepo (`frontend/`, `backend/`, `ml-service/`, `docker-compose.yml`).
2. Implementa entidades, repositorios, seed ficticio, endpoints y dashboard funcional con tabla y detalle.
3. Implementa motor de evaluación: ML si se consigue un dataset etiquetado adecuado y reproducible; si no, reglas simuladas identificadas como SIMULATED con probabilidad nula y sin pretender precisión estadística. Asegúrate de comunicarte mediante HTTP entre Spring y FastAPI.
4. Implementa semáforo en UI y registro de intervención. Incluye historial y alertas.
5. Ejecuta compilaciones/tests y corrige errores; deja comandos exactos en README y estado de avance en `PROGRESS.md`.

No gastes tiempo en funcionalidades P2, autenticación empresarial, nube o integraciones LMS reales. No entregues solamente mockups: el frontend debe consumir endpoints reales y los datos deben persistirse en PostgreSQL.

Si te encuentras con problemas, avanza con una solución más pequeña que sea ejecutable. No inventes métricas científicas, validación ni predicciones reales. Deja claramente la diferencia entre simulación y Machine Learning experimental. Al terminar informa archivos modificados, pruebas realmente ejecutadas, funciones pendientes y comandos para ejecutar la demo.
