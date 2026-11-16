import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import { useClusters, useInference } from "../hooks/queries";
import {
  Card,
  Empty,
  ErrorState,
  Experimental,
  Loading,
  PageHeading,
} from "../components/common/UI";
import { ClusterChart } from "../components/charts/Charts";
import { StudentPicker } from "../components/common/StudentPicker";
import { ClusterResult } from "../components/common/Results";
import { count, decimal, validId } from "../utils/format";
import { featureLabel } from "../utils/features";
export function ClustersPage() {
  const query = useClusters();
  const [params, setParams] = useSearchParams();
  const raw = params.get("student_id") || "";
  const id = validId(raw) ? Number(raw) : 0;
  return (
    <>
      <PageHeading
        eyebrow="APRENDIZAJE NO SUPERVISADO"
        title="Perfiles académicos"
        description="Agrupaciones exploratorias de estudiantes con características académicas similares."
        action={<Experimental />}
      />
      <div className="notice">
        <Network size={19} />
        <p>
          Los clusters no son niveles de riesgo. Sus identificadores son
          arbitrarios y pueden cambiar entre versiones del modelo.
        </p>
      </div>
      <div className="two-columns">
        <Card>
          <h2>Distribución de perfiles</h2>
          <p className="small muted">
            Registros del conjunto de entrenamiento de K-Means
          </p>
          {query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : query.data.profiles.length ? (
            <ClusterChart profiles={query.data.profiles} />
          ) : (
            <Empty>No hay perfiles disponibles.</Empty>
          )}
        </Card>
        <div>
          <Card>
            <h2>Identificar perfil de un estudiante</h2>
            <p className="small muted">
              Solicita una asignación real al modelo disponible.
            </p>
            <StudentPicker
              key={raw}
              initialValue={raw}
              onSelect={(value) => setParams({ student_id: String(value) })}
              label="Seleccionar"
            />
            {id > 0 && <ClusterWorkspace key={id} id={id} />}
          </Card>
        </div>
      </div>
      {query.data && (
        <>
          <div className="section-title">
            <h2>Características de los grupos</h2>
            <span className="small muted mono">
              Versión {query.data.model_version}
            </span>
          </div>
          <div className="two-columns">
            {query.data.profiles.map((profile) => (
              <Card key={profile.cluster}>
                <div className="section-title">
                  <h2>Cluster {profile.cluster}</h2>
                  <span className="badge observed">
                    {count(profile.count)} registros
                  </span>
                </div>
                <p className="small muted">Medias de las variables numéricas</p>
                <dl className="feature-list">
                  {Object.entries(profile.numeric_means).map(([key, value]) => (
                    <div key={key}>
                      <dt>
                        {featureLabel(key)}
                        <small>{key}</small>
                      </dt>
                      <dd>{decimal(value)}</dd>
                    </div>
                  ))}
                </dl>
                <details>
                  <summary>Distribución por programa (códigos UCI)</summary>
                  <dl className="course-list">
                    {Object.entries(profile.course_counts).map(
                      ([code, value]) => (
                        <div key={code}>
                          <dt>Programa {code}</dt>
                          <dd>{count(value)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </details>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
function ClusterWorkspace({ id }: { id: number }) {
  const { cluster } = useInference();
  return (
    <div className="mt-5">
      <button
        className="btn"
        disabled={cluster.isPending}
        onClick={() => cluster.mutate(id)}
      >
        <Network size={17} />
        {cluster.isPending ? "Identificando…" : `Identificar perfil · #${id}`}
      </button>
      {cluster.isError && <ErrorState error={cluster.error} />}{" "}
      {cluster.data && (
        <div className="mt-5">
          <ClusterResult data={cluster.data} />
        </div>
      )}
    </div>
  );
}
