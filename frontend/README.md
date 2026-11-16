# SmartCampus · Frontend (Entrega D)

Interfaz local de analítica académica sobre la API Flask existente. React + TypeScript + Vite, Tailwind CSS, React Router, TanStack Query, Axios, Recharts y Lucide. No contiene datos simulados ni lógica de Machine Learning.

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
| `/students` | Listado con 10/20/50 registros por página y búsqueda por ID | students?page=&per_page= |
| `/students/:id` | 36 variables agrupadas, etiqueta observada, última predicción y acciones | students/:id, predictions/:id; POST solo al pulsar |
| `/predictions` | Selección por ID, consulta y nuevo cálculo | predictions/:id, POST predictions |
| `/clusters` | Distribución, medias por perfil, códigos de programas, asignación por ID | clusters, POST clusters/predict |
| `/models` | Métricas reales, matriz de confusión, siluetas por K, versiones y variables | models/metrics |

Los POST envían exclusivamente `{"student_id": id}`. Las acciones del listado abren el detalle o la pantalla de predicción/perfil para solicitar el cálculo; no generan escrituras al navegar. El estado observado está en el detalle, ya que el listado no lo incluye: no se hacen consultas masivas adicionales por fila.

El semáforo usa `risk_level` devuelto por Flask, sin recalcularlo; los umbrales se muestran desde `thresholds`. La pantalla presenta únicamente la última predicción, no un historial. La asignación de cluster recién calculada se muestra en la sesión de la pantalla; queda almacenada por el backend, pero no hay endpoint para recuperarla posteriormente y no se simula uno.

Se validan los contratos JSON en `src/api/validate.ts` antes de renderizar. Errores HTTP 400/404/415/503, desconexión, datos inesperados, estados pendientes y resultados vacíos tienen presentación explícita. Las consultas usan caché de 30 segundos, sin reintentos automáticos; los POST nunca se reintentan automáticamente y deshabilitan su botón durante la solicitud. Las nuevas predicciones actualizan la caché y los conteos. No se usa localStorage ni se envía Target al modelo.

Los nombres de variables y sus valores no se alteran en el contrato. `src/utils/features.ts` traduce etiquetas; los campos categóricos permanecen identificados como códigos UCI. No se inventan nombres de estudiantes ni interpretaciones institucionales. Fechas en la zona horaria local del navegador.

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

- 12 pruebas de componentes/contratos: navegación, paginación, esquema de 36 variables, semáforo de la API, validación de ID, ausencia de predicción, POST, bloqueo de duplicados y errores.
- 3 recorridos Chromium: flujo completo con backend real, desconexión/503 parcial, navegación móvil a 390 px y ausencia de desbordamiento horizontal.
- Fixtures JSON capturados de la API UCI real en `tests/fixtures/`, exclusivos para tests; no se importan en la aplicación de producción.
- `tests/visual-check.mjs` captura dashboard escritorio/móvil en `/tmp`; ejecutar con `node tests/visual-check.mjs` y el servidor iniciado.

En esta máquina los navegadores de prueba se descargaron en `/tmp/smartcampus-browsers`; anteponer `PLAYWRIGHT_BROWSERS_PATH=/tmp/smartcampus-browsers` a los comandos Playwright si se reutiliza esa instalación. La carpeta temporal no forma parte del repositorio.

## Límites

Resultados **EXPERIMENTAL**: dataset portugués, sin validación en Piura, probabilidades no calibradas y variables de segundo semestre. Los clusters no son categorías de riesgo. No hay estadísticas globales de riesgo, historial completo, filtros por nombre/carrera, autenticación, recomendaciones automáticas, Moodle, push ni intervenciones. El endpoint de métricas requiere ambos artefactos; si falta uno, la UI informa que las métricas no están disponibles, mientras conserva las demás secciones. Esta demo no debe exponerse públicamente.
