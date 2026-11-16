import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  UserMinus,
  Users,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useClusters,
  useHealth,
  useModels,
  useSummary,
} from "../hooks/queries";
import {
  Card,
  Empty,
  ErrorState,
  Experimental,
  Loading,
  PageHeading,
} from "../components/common/UI";
import {
  ClusterChart,
  DistributionChart,
  MetricBars,
} from "../components/charts/Charts";
import { count, targetLabel } from "../utils/format";
import type { Target } from "../types";
export function DashboardPage() {
  const summary = useSummary(),
    clusters = useClusters(),
    models = useModels(),
    health = useHealth();
  return (
    <>
      <PageHeading
        eyebrow="PANORAMA ACADÉMICO"
        title="Una mirada a las trayectorias estudiantiles"
        description="Explora los datos observados y los modelos de análisis en un solo lugar."
        action={
          <button
            className="btn secondary"
            disabled={[summary, clusters, models, health].some(
              (q) => q.isFetching,
            )}
            onClick={() => {
              void summary.refetch();
              void clusters.refetch();
              void models.refetch();
              void health.refetch();
            }}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        }
      />
      <div className="research-banner">
        <div className="research-icon">
          <GraduationCap size={25} />
        </div>
        <div>
          <strong>
            Información para comprender, no para decidir automáticamente.
          </strong>
          <p>
            Dataset de educación superior portuguesa. Los modelos requieren
            revisión humana y no están validados para Piura.
          </p>
        </div>
        <Experimental />
      </div>
      {summary.isPending ? (
        <Loading />
      ) : summary.isError ? (
        <ErrorState
          error={summary.error}
          retry={() => void summary.refetch()}
        />
      ) : (
        <div className="stats-grid">
          {[
            {
              label: "Estudiantes importados",
              value: summary.data.students,
              icon: Users,
              tone: "blue",
              detail: "Registros anónimos · UCI 697",
            },
            {
              label: "Abandonos observados",
              value: summary.data.observed_targets.Dropout ?? 0,
              icon: UserMinus,
              tone: "rose",
              detail: "Etiqueta histórica · Dropout",
            },
            {
              label: "Graduados",
              value: summary.data.observed_targets.Graduate ?? 0,
              icon: GraduationCap,
              tone: "teal",
              detail: "Etiqueta histórica · Graduate",
            },
            {
              label: "Matriculados",
              value: summary.data.observed_targets.Enrolled ?? 0,
              icon: BookOpen,
              tone: "amber",
              detail: "Etiqueta histórica · Enrolled",
            },
          ].map(({ label, value, icon: Icon, tone, detail }) => (
            <Card key={label} className="stat-card">
              <div>
                <span>{label}</span>
                <span className={`stat-icon ${tone}`}>
                  <Icon size={20} />
                </span>
              </div>
              <strong>{count(value)}</strong>
              <p>{detail}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="dashboard-charts">
        <Card>
          <div className="section-title">
            <h2>Trayectorias observadas</h2>
            <span className="subtle-tag">Datos históricos</span>
          </div>
          <p className="muted small">
            Distribución de las etiquetas del dataset
          </p>
          {summary.isPending ? (
            <Loading />
          ) : summary.isError ? (
            <ErrorState error={summary.error} />
          ) : summary.data.students === 0 ? (
            <Empty>No hay estudiantes importados.</Empty>
          ) : (
            <DistributionChart
              data={(Object.keys(targetLabel) as Target[]).map((key) => ({
                name: targetLabel[key],
                value: summary.data.observed_targets[key] ?? 0,
              }))}
            />
          )}
        </Card>
        <Card>
          <div className="section-title">
            <h2>Perfiles académicos</h2>
            <span className="subtle-tag">K-Means</span>
          </div>
          <p className="muted small">
            Agrupaciones exploratorias del entrenamiento
          </p>
          {clusters.isPending ? (
            <Loading />
          ) : clusters.isError ? (
            <ErrorState
              error={clusters.error}
              retry={() => void clusters.refetch()}
            />
          ) : clusters.data.profiles.length ? (
            <ClusterChart profiles={clusters.data.profiles} />
          ) : (
            <Empty>No hay perfiles disponibles.</Empty>
          )}
        </Card>
        <Card>
          <div className="section-title">
            <h2>Desempeño experimental</h2>
          </div>
          <p className="muted small">Random Forest · conjunto de prueba</p>
          {models.isPending ? (
            <Loading />
          ) : models.isError ? (
            <ErrorState
              error={models.error}
              retry={() => void models.refetch()}
            />
          ) : (
            <>
              <MetricBars metrics={models.data.random_forest.metrics} />
              <Link className="text-link" to="/models">
                Explorar los modelos <ArrowRight size={16} />
              </Link>
            </>
          )}
        </Card>
      </div>
      <div className="grid-bottom">
        <Card>
          <div className="section-title">
            <h2>Estado del entorno</h2>
            <span className="subtle-tag">Servicios locales</span>
          </div>
          <div className="system-grid">
            <div>
              <span className="muted small">API REST · Flask</span>
              <strong
                className={health.isError ? "text-red-700" : "text-emerald-700"}
              >
                {health.isPending
                  ? "Comprobando…"
                  : health.isError
                    ? "No disponible"
                    : health.data.status === "UP"
                      ? "Conectada"
                      : "No disponible"}
              </strong>
            </div>
            <div>
              <span className="muted small">Modelos de análisis</span>
              <strong>
                {models.isPending
                  ? "Comprobando…"
                  : models.isError
                    ? "No disponibles"
                    : "Artefactos disponibles"}
              </strong>
            </div>
            <div>
              <span className="muted small">Origen de la información</span>
              <strong>UCI 697 · Portugal</strong>
            </div>
          </div>
          {models.data && (
            <div className="versions">
              <span>
                RF <code>{models.data.random_forest.model_version}</code>
              </span>
              <span>
                K-Means <code>{models.data.kmeans.model_version}</code>
              </span>
            </div>
          )}
        </Card>
        <Card className="explore-card">
          <CheckCircle2 size={23} />
          <h2>Del dato a la exploración</h2>
          <p>
            Consulta un registro, examina sus variables y solicita una
            predicción experimental.
          </p>
          <Link to="/students" className="text-link">
            Explorar estudiantes <ArrowRight size={16} />
          </Link>
        </Card>
      </div>
    </>
  );
}
