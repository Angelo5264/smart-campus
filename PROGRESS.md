# Progreso SmartCampus — 2026-11-16 (America/Lima)

## Alcance adoptado

La solicitud adjunta «Desarrollo de SmartCampus — Flask + Machine Learning» reemplaza explícitamente el stack/funciones del SPEC previo. En A–C se implementó el monolito Flask solicitado, sin Spring Boot, FastAPI, datos ficticios ni variables LMS/asistencia inventadas. La Entrega D al final de este registro incorpora el frontend React. AGENTS.md y SPEC.md originales se conservaron como antecedentes; el contrato vigente y las instrucciones ejecutables están en README.md.

## Entrega A — verificada

- Factory Flask, configuración por entorno, Blueprints, SQLAlchemy y PostgreSQL 16.
- Tablas de estudiantes, versiones/modelos, predicciones y asignaciones de clusters.
- Downloader con ucimlrepo y auditoría de nombres originales, tipos, faltantes y duplicados.
- UCI 697 descargado: 4,424 registros, 36 variables, 0 duplicados, 0 faltantes.
- Importación PostgreSQL: primera ejecución 4,424 nuevos; segunda 0.
- Dockerfile y Compose construidos y ejecutados; base y API healthy.
- Puerto 5432 ocupado en el entorno: puerto de host configurable, por defecto 55432.

## Entrega B — verificada

- Random Forest de 200 árboles con pipeline: nominales one-hot y numéricas escaladas; transformación ajustada exclusivamente al train.
- Split 80/20 estratificado, semilla 42; 2,904 train / 726 test; 794 Enrolled excluidos.
- Accuracy 0.9214876033, precision 0.9283018868, recall 0.8661971831, F1 0.8961748634, ROC-AUC 0.9710781658.
- Matriz Graduate/Dropout: [[423,19],[38,246]].
- K-Means con 14 características académicas, sin Target; K=2…6; mejor K=2, silueta 0.5486580347; grupos de 4,144 y 280 registros.
- Entrenamiento completado tanto localmente como en Python 3.11 del contenedor, con iguales métricas.
- Artefactos versionados joblib, metadatos y esquema generados en ml/artifacts; copia revisable de métricas/auditoría en reports.
- Todo etiquetado EXPERIMENTAL; probabilidades no calibradas, segundo semestre requerido, ninguna validación para Piura.

## Entrega C — verificada

Los nueve endpoints del README respondieron en HTTP real: GET 200, POST de predicción y cluster 201. Última predicción coincide con el resultado persistido. Las pruebas verificaron integridad, registro de versiones, idempotencia, paginación, validación, límites de umbrales y respuestas 503 sin probabilidades inventadas.

- Suite local (Python 3.14 / SQLite aislado): **15 passed**, sin omisiones.
- Suite Docker (Python 3.11 / PostgreSQL 16, esquema temporal aislado): **15 passed**, sin omisiones.
- compileall sobre app, ml, tests y run.py: correcto.
- scripts/smoke.py: flujo HTTP de los nueve endpoints completo.
- API disponible en http://localhost:5000/api/v1/health; PostgreSQL en 127.0.0.1:55432.

## Comandos ejecutados

Se creó un venv local y se instalaron requirements.txt. El entorno no tenía Compose; se descargó v2.39.4 a /tmp/smartcampus-docker/cli-plugins/docker-compose, sin cambiar la instalación del sistema. Para los comandos siguientes se utilizó `docker --config /tmp/smartcampus-docker compose` como prefijo `docker compose`.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m ml.download_dataset
.venv/bin/python -m ml.train_classifier
.venv/bin/python -m ml.train_clustering
.venv/bin/pytest -q
docker compose up --build -d
docker compose exec -T api flask --app run init-db
docker compose exec -T api flask --app run import-dataset
# Repetido para comprobar idempotencia:
docker compose exec -T api flask --app run import-dataset
docker compose exec -T api python -m ml.train_classifier
docker compose exec -T api python -m ml.train_clustering
docker compose restart api
docker compose exec -T api sh -c 'TEST_DATABASE_URL="$DATABASE_URL" pytest -q'
docker compose exec -T api python - < scripts/smoke.py
docker compose exec -T api python -m compileall -q app ml tests run.py
docker compose ps
```

Obstáculos resueltos: DNS/red del sandbox (descargas autorizadas fuera del sandbox), acceso Docker, ausencia del plugin Compose, puerto 5432 ocupado y un error en el logger del smoke (`Request.get_method()` corregido y flujo repetido con éxito).

## Archivos entregados

- app/: factory/configuración, cinco Blueprints, cuatro entidades, esquema de validación, servicios de importación/inferencia/cache y repositorio de estudiantes.
- ml/: descarga/auditoría, esquema original, preprocesamiento, dos entrenamientos, evaluación y publicación de artefactos.
- tests/: fixtures aislados y pruebas unitarias/integración; scripts/smoke.py para HTTP real.
- Dockerfile, docker-compose.yml, requirements.txt, run.py, pytest.ini, .env.example, .gitignore, .dockerignore.
- README.md, PROGRESS.md y reports/*.json.
- .env local generado con contraseña aleatoria; excluido de Git y del build. No se realizaron commits.

## Pendiente fuera del MVP solicitado

No quedan flujos funcionales A/B/C pendientes. Antes de un piloto institucional faltan datos autorizados locales, validación externa/temporal, calibración, evaluación de sesgos, aprobación de umbrales y controles de producción. Al cerrar A–C no se habían implementado interfaz web, autenticación, intervenciones, push, LMS ni migraciones evolutivas; la web se entrega posteriormente en D. La instalación persistente de Compose queda a cargo del entorno; el binario de verificación en /tmp es temporal. Los artefactos y CSV se regeneran con los comandos documentados y no se versionan en Git. Las versiones se registran en PostgreSQL al usarse por primera vez, no automáticamente al entrenar offline.

## Entrega D — frontend React verificado (2026-11-16)

La solicitud de Entrega D amplía A–C con una interfaz web; sustituye las referencias anteriores a «sin frontend». Se mantuvo intacto el código Flask, los modelos, el entrenamiento y las pruebas del backend.

### D1 — base e integración

- frontend/ con React 19, TypeScript estricto, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Recharts y Lucide.
- Layout institucional con navegación lateral, cabecera, estado API, diseño móvil y acceso por teclado.
- VITE_API_BASE_URL configurable; proxy de desarrollo a Flask y proxy Nginx en Docker.
- Contratos construidos después de leer Blueprints/servicios/esquemas y consultar JSON real de los nueve endpoints.
- Validación de respuestas en tiempo de ejecución; manejo de 400/404/415/503, desconexión y contratos inesperados.

### D2 — dashboard y estudiantes

- Dashboard con total importado y etiquetas observadas Dropout/Graduate/Enrolled; gráficos interactivos y métricas servidas por la API.
- Estado de API, disponibilidad de artefactos, versiones y origen del dataset.
- Paginación real de 10/20/50 filas; búsqueda por ID. Sin descarga masiva de detalles ni nombres inventados.
- Detalle con las 36 variables originales en seis grupos; diccionario de etiquetas de presentación y códigos explícitos.
- Los resultados históricos y los resultados inferidos se presentan por separado.

### D3 — inferencia y transparencia

- Predicción real por student_id; riesgo tomado de Flask, umbrales devueltos por la API, versión, fecha local y naturaleza EXPERIMENTAL.
- Consulta de última predicción almacenada; no se presenta como historial. La navegación no dispara POST.
- Asignación real K-Means, distribución del entrenamiento, medias y frecuencias por código de programa. Sin equivalencia inventada entre cluster y riesgo.
- Métricas reales de RF, matriz de confusión, siluetas por K, tamaños, versiones, fechas, variables y límites.
- Solicitudes pendientes deshabilitan su botón, sin reintentos automáticos de POST; estados vacíos y errores independientes por sección.

### D4 — pruebas y ejecución final

- `npm run build --prefix frontend`: TypeScript y build Vite aprobados. JS separado en chunks de aplicación/framework/gráficos, sin aviso de chunk >500 kB.
- `npm test --prefix frontend`: **12 passed**, contratos y componentes críticos, navegación, paginación, inferencia, ID inválido, ausencia de resultado, riesgo tomado del servidor, errores y bloqueo de solicitudes repetidas.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers npm run test:e2e --prefix frontend`: **3 passed** sobre Vite y nuevamente **3 passed** sobre Docker/Nginx. Chromium real, Flask y PostgreSQL reales.
- E2E cubren seis pantallas, paginación ida/vuelta, 36 variables, cálculo de riesgo, consulta almacenada, asignación de cluster desde detalle y clustering, métricas, recarga de ruta SPA, desconexión total, ausencia de modelos parcial y móvil de 390 px sin desbordamiento horizontal.
- `docker compose exec -T api sh -c 'TEST_DATABASE_URL="$DATABASE_URL" pytest -q'`: **15 passed**, pruebas originales sin modificar.
- `docker compose build web` y `docker compose up -d web`: correctos; Nginx sirve la aplicación de producción y proxy a Flask. Vite temporal se detuvo para liberar 5173.
- Revisión de capturas de escritorio/móvil: reports/frontend-dashboard.png y reports/frontend-mobile.png. Donut completo, valores reales, leyendas, navegación y tarjetas sin recortes.
- Se corrigió el nombre accesible de los enlaces de estudiante (avatar decorativo), errores de tipos en pruebas y un cierre JSX durante la compilación. Se desactivó la animación inicial de los gráficos para captura estable.
- La instalación detectó vulnerabilidades en la versión inicial de Vitest; se actualizó a 5.1.0 y la instalación final reportó **0 vulnerabilidades**. package-lock.json fija las dependencias reproducibles.

### Comandos de esta entrega

```bash
npm install --prefix frontend
npm run dev --prefix frontend
npm run build --prefix frontend
npm test --prefix frontend
PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers frontend/node_modules/.bin/playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers npm run test:e2e --prefix frontend
docker --config /tmp/smartcampus-docker compose build web
docker --config /tmp/smartcampus-docker compose up -d web
docker --config /tmp/smartcampus-docker compose exec -T api sh -c 'TEST_DATABASE_URL="$DATABASE_URL" pytest -q'
PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers npm run test:e2e --prefix frontend
PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers node frontend/tests/visual-check.mjs
```

### Estado y límites pendientes

Entrega D1–D4 funcional y verificada. Acceso: **http://localhost:5173/dashboard**. Solo loopback; no publicación externa. Se añadieron frontend/, servicio web en docker-compose.yml y exclusión del frontend en el build de Python; README principal y frontend/README.md actualizados. No se añadieron servicios externos ni autenticación.

Persisten las limitaciones científicas de A–C y el alcance solicitado: sin validación para Piura, sin calibración, datos de segundo semestre, sin historial completo ni estadística global de riesgo, sin autenticación, roles, LMS, push, intervenciones o reentrenamiento web. Los códigos categóricos se muestran como códigos; no hay filtro por nombres o instituciones inexistentes. La asignación de cluster se persiste por Flask pero la API no ofrece consulta de última asignación: la UI solo muestra la respuesta del cálculo actual. Los E2E generan registros reales adicionales de predicción/asignación; los fallos se simulan solo en el navegador de pruebas. Las capturas y fixtures corresponden a registros públicos anónimos UCI, nunca datos institucionales de personas identificadas.

## Diagnóstico de arranque solicitado por el usuario

Se reprodujeron los errores: `docker compose` no disponible en la instalación estándar; `.venv/bin/python run.py` falla porque Docker ya ocupa 5000; `npm run dev --prefix frontend` falla porque Docker ya ocupa 5173. Se confirmó que db/api/web están healthy y que `/api/v1/health` y `/api/v1/students?per_page=1` responden desde el proxy web con 4,424 registros. Se dejaron los contenedores activos y se documentaron los modos Docker y Python/Vite, mutuamente excluyentes en esos puertos, al inicio de frontend/README.md.

## Ajuste del aviso de predicción

A petición del usuario se retiró el aviso largo «Esta predicción es experimental… Requiere evaluación humana» de Predicciones y de la tarjeta compartida de resultados. Se conserva EXPERIMENTAL y la sección de limitaciones de modelos. No se modificaron datos, artefactos ni lógica de inferencia. Se reconstruye la web local para aplicar el cambio.

Revisión del cambio de dataset: la auditoría actual exige UCI 697 (4,424 filas, 36 variables y Target); el importador rechaza un CSV distinto cuando ya existe otra versión en la base. Otro dataset requiere adaptar el contrato y la auditoría, entrenar/evaluar nuevos modelos y separar o migrar la cohorte. No se borraron datos.

Verificación final del aviso: build local y Docker aprobados. El contenedor web reconstruido no se inició porque 5173 está ocupado por Vite del usuario; se conservó esa sesión. Se confirmó por HTTP que Vite sirve el componente actualizado sin Warning y que el proxy `/api/v1/health` responde UP para Flask y base de datos. No es necesario iniciar Docker web mientras se utiliza Vite. No se borró ni reemplazó el dataset.

## Simplificación de avisos en la interfaz

Por solicitud del usuario se retiró el banner del dashboard sobre revisión humana/validación, la tarjeta de limitaciones de Modelos y los párrafos scope/probability_scope en resultados. Las limitaciones permanecen en los README; se mantiene la procedencia EXPERIMENTAL, las métricas y las distinciones entre etiquetas observadas, predicción y perfiles. Build TypeScript/Vite aprobado y módulos activos de Vite verificados por HTTP. No se modificaron modelos ni datos.

## Entrega E — ficha académica y semáforo predictivo

Implementada sobre `/students/:id`, conservando Flask, PostgreSQL, RF, K-Means, dataset y endpoints. La instrucción más reciente de Entrega E exige nuevamente una advertencia científica visible: se incluye en la tarjeta predictiva, sin restaurar el banner del dashboard.

### Implementación

- Encabezado académico con ID interno, fuente UCI 697, etiqueta histórica y registro EXPERIMENTAL; sin identidad inventada.
- Dos promedios con dos decimales en escala nativa 0–20. Contexto explícito para ceros (evaluaciones/aprobaciones); faltantes/nulos no se convierten a cero. Gráfico con eje 0–20, sin dibujar una comparación si falta un promedio.
- Actividad curricular de ambos semestres: matriculadas, aprobadas, acreditadas, evaluaciones y sin evaluación. No se equiparan unidades UCI a cursos peruanos.
- Cuatro desplegables accesibles con 24 variables complementarias; todas las 36 variables siguen presentes. Admisión/calificación previa sobre 200, tasas en porcentaje y edad en años según el diccionario local descargado de UCI. PIB conserva valor sin unidad inventada.
- `RiskIndicator`: semáforo LOW/MEDIUM/HIGH tomado de Flask, porcentaje, barra con atributos ARIA, modelo, versión, fecha, umbrales provisionales y alcance científico.
- `PredictionCard`: consulta por GET, POST solo bajo acción, botón bloqueado durante petición, actualización de caché, invalidación de última predicción y confirmación de guardado. Se cancela una consulta pendiente antes del POST para evitar que sobrescriba la respuesta. 404 muestra ausencia; 503 no genera probabilidades. Si falla un recálculo, se identifica el último resultado como anterior.
- Skeleton, navegación interna, regreso al listado, diseño responsive, agrupamiento K-Means existente conservado.
- Campos ausentes/nulos se toleran en la capa de presentación, manteniendo rechazo de tipos inesperados y claves desconocidas. La API/inferencia siguen validando los datos originales; no se completan ni alteran registros.

### Archivos

Nuevos componentes en frontend/src/components/students/: StudentProfileHeader, AcademicSummary, SemesterPerformance, AcademicProgressChart, StudentAttributes, RiskIndicator, PredictionCard y StudentProfileSkeleton. Nueva utilidad academic.ts y pruebas StudentProfile.test.tsx/profile.spec.ts; fixture student2.json capturado de Flask, sin inventar notas. Modificados StudentDetailPage.tsx, hooks/queries.ts, types/index.ts, api/validate.ts, utils/features.ts, styles.css y documentación. Capturas verificadas: reports/frontend-profile-desktop.png y reports/frontend-profile-mobile.png.

### Verificación ejecutada

- Lectura de README, PROGRESS, instrucciones, código existente y diccionario data/raw/variables.json; GET reales de estudiante y última predicción por proxy Vite.
- `npm run build --prefix frontend`: TypeScript estricto y Vite aprobados.
- `npm test --prefix frontend`: **24 passed** (12 anteriores + 12 nuevas), sin eliminar pruebas previas. Cobertura de notas reales sobre 20, ceros/faltantes, escala de admisión, LOW/MEDIUM/HIGH, Graduate observado frente a HIGH estimado, POST por ID, invalidación, confirmación, 404/503 y skeleton.
- `.venv/bin/pytest -q`: **15 passed**, pruebas originales del backend sin modificar.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers npm run test:e2e --prefix frontend`: **5 passed**. Conserva tres recorridos previos y añade persistencia tras recarga, teclado en los cuatro desplegables, 36 variables, notas originales y fallos 404/503.
- Se corrigió una carrera de sincronización del E2E anterior: al navegar entre formularios con el mismo label, llenaba el campo de la pantalla anterior antes de completar la transición. Se añadió la espera explícita por el encabezado de destino, manteniendo todas las aserciones. No se ocultó un fallo de producto ni se aumentaron timeouts.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers node frontend/tests/profile-visual.mjs`: revisión escritorio 1440 px/móvil 390 px; estudiante 2 real (14.00 y 13.67 sobre 20), sin desbordamiento. El cálculo mostrado fue solicitado a Flask, no fijado en código.

### Estado final y límites

Ficha activa en Vite: http://localhost:5173/students/1. No se detuvo la sesión de desarrollo del usuario ni se intentó iniciar otra web en el mismo puerto. Build estático actualizado en frontend/dist. No se reentrenaron modelos, no se alteraron datos UCI, no se reconstruyó la base, no se añadieron dependencias ni se cambiaron endpoints. Los recorridos de integración crean las predicciones/asignaciones reales que verifican.

Sin pendientes funcionales de Entrega E. Se mantienen los límites científicos, autenticación fuera de alcance y ausencia de endpoint de consulta de cluster individual anterior: se muestra la respuesta de la asignación actual, sin simular una recuperación. La adaptación a terminología peruana es exclusivamente visual.

## Filtros de disponibilidad académica — estudiantes

- `GET /api/v1/students` mantiene el listado anterior y ahora filtra en SQL antes de paginar con `academic_data`, `semester_availability`, `evaluation_status`, `approval_status` y sus alcances de semestre.
- Los ocho valores curriculares reales distinguen número (incluido cero), `NULL`, clave ausente, vacío y tipo no numérico. Completa = ocho números; parcial = uno a siete; sin información = ninguno. La disponibilidad de un semestre no se interpreta como etapa académica.
- La pantalla `/students` incluye selectores combinables, chips activos, limpieza, URL persistente, mensaje vacío y cuatro tarjetas globales calculadas por la API. La fuente importada actual tiene 4,424 registros completos, 0 parciales y 0 sin información con este criterio.
- Se retiró el aviso de revisión/validación de la ficha, como pidió el usuario; el semáforo, la persistencia y sus datos no cambiaron.
- Verificación: `.venv/bin/pytest -q` **39 passed** (SQLite y PostgreSQL, casos cero/NULL/ausente/vacío/no numérico, combinaciones y tres consultas SQL fijas) y `npm run build --prefix frontend && npm test --prefix frontend -- --run` (**27 passed**).
