# SmartCampus · Frontend (Entregas D y E)

Interfaz local de analítica académica sobre la API Flask existente. React + TypeScript + Vite, Tailwind CSS, React Router, TanStack Query, Axios, Recharts y Lucide. No contiene datos simulados ni lógica de Machine Learning.


## Arranque en esta máquina y errores de puertos

Si Docker ya está ejecutando SmartCampus, abra **http://localhost:5173/dashboard** sin iniciar otra copia de Python o Vite.

En este entorno `docker compose` no está instalado en su ubicación estándar. Mientras exista el plugin temporal, ejecute desde la raíz del proyecto:

```bash
docker --config /tmp/smartcampus-docker compose up -d
```

Si quiere ejecutar Python y React directamente, primero libere sus puertos y conserve PostgreSQL:

```bash
# Desde la raíz del proyecto:
docker --config /tmp/smartcampus-docker compose stop web api
docker --config /tmp/smartcampus-docker compose up -d db
```

Luego abra dos terminales en la raíz:

```bash
# Terminal 1: backend con sus dependencias del entorno virtual
.venv/bin/python run.py
```

```bash
# Terminal 2: frontend
npm run dev --prefix frontend
```

Mantenga ambas terminales abiertas y visite http://localhost:5173. Para volver a Docker, detenga Python y Vite con Ctrl+C y ejecute el comando `compose up -d` anterior. `Port 5173 is already in use` y `Port 5000 is in use` indican que ya hay otro servidor ocupando esos puertos; no son errores del modelo. El plugin en `/tmp` es temporal y debe instalarse de forma permanente si desaparece tras un reinicio.

## Ejecutar localmente

Requisitos: Node.js 24 LTS, npm y la API preparada con el dataset/modelos de las entregas A–C. Desde la raíz, puede iniciar solo el backend con `docker compose up -d db api`.

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. Vite escucha solo en loopback y reenvía `/api` a `http://127.0.0.1:5000`. No ejecute simultáneamente Vite y el contenedor web: ambos usan 5173. Para desarrollo local, detenga únicamente la web con `docker compose stop web`.

La variable `VITE_API_BASE_URL` controla la base de Axios. Por defecto es `/api/v1`; puede copiar `.env.example` a `.env.local`. La alternativa `http://localhost:5000/api/v1` utiliza el CORS ya existente de Flask para `http://localhost:5173`. Reinicie Vite después de cambiar variables. Vite incorpora las variables en el build: no coloque secretos en ellas.

## Docker integrado

Desde la raíz del repositorio:

```bash
docker compose up --build -d
```

Abra http://localhost:5173/dashboard. El servicio `web` compila el frontend y sirve archivos estáticos mediante Nginx, con proxy `/api` al servicio `api:5000`. El fallback SPA permite recargar rutas como `/students/1`. Los servicios Flask y PostgreSQL se conservan; no se cambió su código ni sus modelos. Los puertos publicados se limitan a `127.0.0.1`.

Si la base es nueva, ejecute los comandos de inicialización, descarga, importación y entrenamiento del README principal. El frontend muestra estados vacíos/no disponibles hasta que existan datos y modelos. El healthcheck de web verifica la entrega de HTML; el estado de API se consulta por separado.

## Pantallas y contratos

| Ruta | Contenido | Consultas |
|---|---|---|
| `/dashboard` | Conteos observados, gráficos, métricas y estado | health, analytics/summary, clusters, models/metrics |
| `/students` | Listado con filtros combinables de disponibilidad, 10/20/50 registros por página y búsqueda por ID | students?page=&per_page=&academic_data=… |
| `/students/:id` | 36 variables agrupadas, etiqueta observada, última predicción y acciones | students/:id, predictions/:id; POST solo al pulsar |
| `/predictions` | Selección por ID, consulta y nuevo cálculo | predictions/:id, POST predictions |
| `/clusters` | Distribución, medias por perfil, códigos de programas, asignación por ID | clusters, POST clusters/predict |
| `/models` | Métricas reales, matriz de confusión, siluetas por K, versiones y variables | models/metrics |

Los POST envían exclusivamente `{"student_id": id}`. Las acciones del listado abren el detalle o la pantalla de predicción/perfil para solicitar el cálculo; no generan escrituras al navegar. El estado observado está en el detalle, ya que el listado no lo incluye: no se hacen consultas masivas adicionales por fila.

El semáforo usa `risk_level` devuelto por Flask, sin recalcularlo; los umbrales se muestran desde `thresholds`. La pantalla presenta únicamente la última predicción, no un historial. La asignación de cluster recién calculada se muestra en la sesión de la pantalla; queda almacenada por el backend, pero no hay endpoint para recuperarla posteriormente y no se simula uno.

Se validan los contratos JSON en `src/api/validate.ts` antes de renderizar. Errores HTTP 400/404/415/503, desconexión, datos inesperados, estados pendientes y resultados vacíos tienen presentación explícita. Las consultas usan caché de 30 segundos, sin reintentos automáticos; los POST nunca se reintentan automáticamente y deshabilitan su botón durante la solicitud. Las nuevas predicciones actualizan la caché y los conteos. No se usa localStorage ni se envía Target al modelo.

Los nombres de variables y sus valores no se alteran en el contrato. `src/utils/features.ts` traduce etiquetas; los campos categóricos permanecen identificados como códigos UCI. No se inventan nombres de estudiantes ni interpretaciones institucionales. Fechas en la zona horaria local del navegador.

## Filtros de disponibilidad en estudiantes

La pantalla `/students` combina filtros y conserva su estado en la URL. La API filtra antes de paginar y devuelve cuatro tarjetas globales: total, información completa, parcial y sin información. Los conteos globales son independientes de los filtros activos.

Los ocho campos considerados son matrícula, aprobaciones, evaluaciones y nota de ambos semestres. Cero es un valor registrado; `NULL`, una clave ausente, vacío y valores no numéricos no son disponibilidad. Información completa requiere ocho números; parcial, uno a siete; sin información, ninguno. «Con evaluaciones/aprobaciones» requiere algún conteo positivo en el semestre seleccionado; «sin» no tiene positivos, mientras que las opciones adicionales separan ceros conocidos y datos no disponibles. Disponibilidad de semestre indica que hay algún valor registrado, no un ciclo o condición de ingreso.

## Pruebas reproducibles

```bash
cd frontend
npm ci
npm run build     # TypeScript estricto + Vite producción
npm test          # Vitest + Testing Library; sin backend necesario
npx playwright install chromium
# Con Vite o Docker web funcionando, y Flask preparado:
npm run test:e2e
```

`E2E_BASE_URL` permite cambiar la URL del navegador de pruebas (por defecto `http://127.0.0.1:5173`). Los E2E requieren UCI completo con 4,424 registros y estudiante ID 1, y **crean predicciones y asignaciones reales**. Las pruebas de fallos interceptan únicamente solicitudes del navegador de prueba; no detienen Flask ni modifican sus datos.

- 27 pruebas de componentes/contratos: navegación, ficha, filtros combinados, paginación filtrada, valores cero/NULL, resultados vacíos, esquema de 36 variables, semáforo de la API, validación de ID, ausencia de predicción, POST, bloqueo de duplicados y errores.
- 5 recorridos Chromium (incluida Entrega E): flujo completo con backend real, desconexión/503 parcial, navegación móvil a 390 px y ausencia de desbordamiento horizontal.
- Fixtures JSON capturados de la API UCI real en `tests/fixtures/`, exclusivos para tests; no se importan en la aplicación de producción.
- `tests/visual-check.mjs` captura dashboard escritorio/móvil en `/tmp`; ejecutar con `node tests/visual-check.mjs` y el servidor iniciado.

En esta máquina los navegadores de prueba se descargaron en `/tmp/smartcampus-browsers`; anteponer `PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers` a los comandos Playwright si se reutiliza esa instalación. La carpeta temporal no forma parte del repositorio.

## Límites

Resultados **EXPERIMENTAL**: dataset portugués, sin validación en Piura, probabilidades no calibradas y variables de segundo semestre. Los clusters no son categorías de riesgo. No hay estadísticas globales de riesgo, historial completo, filtros por nombre/carrera, autenticación, recomendaciones automáticas, Moodle, push ni intervenciones. El endpoint de métricas requiere ambos artefactos; si falta uno, la UI informa que las métricas no están disponibles, mientras conserva las demás secciones. Esta demo no debe exponerse públicamente.

Los avisos generales no se muestran en la interfaz; se conserva la etiqueta de procedencia EXPERIMENTAL junto al resultado.

## Ficha académica — Entrega E

Abra `/students/1` (incluye ceros originales) o `/students/2` (promedios distintos de cero). La ficha utiliza los datos reales de Flask y distingue la etiqueta histórica de la evaluación predictiva.

- Encabezado con ID interno, fuente y estado observado, sin identidad inventada.
- Promedios semestrales nativos de 0–20 con dos decimales. No se dividen entre diez. Los ceros conservan el contexto de evaluaciones y unidades aprobadas; no se clasifican automáticamente como desaprobación.
- Evolución en Recharts con eje fijo 0–20. Si falta uno de los promedios, no se dibuja una comparación incompleta. Valores ausentes/nulos se muestran como «No disponible», sin imputarlos ni alterar el contrato de inferencia.
- Diez conteos curriculares, separados por semestre, y 24 atributos complementarios en cuatro desplegables accesibles con teclado. Las 36 variables permanecen disponibles.
- Admisión y calificación previa conservan la escala 0–200; desempleo/inflación se expresan como porcentaje, de acuerdo con el diccionario UCI. No se convierten unidades curriculares en asignaturas peruanas.
- `RiskIndicator` muestra el nivel LOW/MEDIUM/HIGH devuelto por Flask, semáforo, porcentaje, barra accesible, fecha, modelo y versión. No calcula categorías de riesgo en React.
- `PredictionCard` consulta la última evaluación; el POST ocurre solo al pulsar. La mutación cancela una consulta previa pendiente, actualiza caché, invalida la última predicción y muestra confirmación. Un fallo de recálculo conserva y etiqueta el resultado anterior, sin inventar otro.

Componentes en `src/components/students/`: StudentProfileHeader, AcademicSummary, SemesterPerformance, AcademicProgressChart, StudentAttributes, PredictionCard, RiskIndicator y StudentProfileSkeleton. Presentación/escala/contexto en `src/utils/academic.ts`.

La ausencia de datos se tolera únicamente para presentación de un registro: el backend mantiene sus validaciones de las 36 entradas y el frontend sigue enviando solo student_id. No se añadieron endpoints, ni recuperación ficticia de clusters anteriores. No se reentrenaron modelos ni se alteraron registros UCI.

`tests/profile.spec.ts` amplía la suite de navegador con persistencia al recargar, navegación por teclado en desplegables y manejo de 404/503. `node tests/profile-visual.mjs` captura escritorio/móvil del registro UCI 2 y genera una predicción real. Las capturas se guardan en `/tmp/smartcampus-profile-*.png`.
