import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChartNoAxesCombined, Network } from "lucide-react";
import { getStudent } from "../api/students";
import { useInference, usePrediction } from "../hooks/queries";
import { isNotFound } from "../api/client";
import {
  Card,
  Empty,
  ErrorState,
  Experimental,
  Loading,
  PageHeading,
} from "../components/common/UI";
import { ClusterResult, PredictionResult } from "../components/common/Results";
import { featureGroups } from "../utils/features";
import { decimal, targetLabel, validId } from "../utils/format";
export function StudentDetailPage() {
  const { id = "" } = useParams();
  return validId(id) ? (
    <StudentDetail key={id} id={Number(id)} />
  ) : (
    <ErrorState error={new Error("El ID debe ser un entero positivo.")} />
  );
}
function StudentDetail({ id }: { id: number }) {
  const student = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id),
  });
  const latest = usePrediction(student.data ? id : 0);
  const { prediction, cluster } = useInference();
  if (student.isPending) return <Loading />;
  if (student.isError)
    return (
      <ErrorState error={student.error} retry={() => void student.refetch()} />
    );
  return (
    <>
      <Link className="text-link" to="/students">
        <ArrowLeft size={16} />
        Volver a estudiantes
      </Link>
      <PageHeading
        eyebrow="REGISTRO ANÓNIMO · UCI 697"
        title={`Estudiante #${id}`}
        description="Variables originales del dataset, sin identidad institucional asociada."
        action={<Experimental />}
      />
      <Card>
        <div className="section-title">
          <h2>Resultado histórico observado</h2>
          <span className="badge observed">
            {targetLabel[student.data.observed_target]} ·{" "}
            {student.data.observed_target}
          </span>
        </div>
        <p className="muted small">
          Esta etiqueta pertenece al dataset. No es una predicción del modelo ni
          se envía como variable de entrada.
        </p>
        <div className="action-bar">
          <button
            className="btn"
            disabled={prediction.isPending}
            onClick={() => prediction.mutate(id)}
          >
            <ChartNoAxesCombined size={17} />
            {prediction.isPending
              ? "Calculando riesgo…"
              : "Calcular riesgo de deserción"}
          </button>
          <button
            className="btn secondary"
            disabled={cluster.isPending}
            onClick={() => cluster.mutate(id)}
          >
            <Network size={17} />
            {cluster.isPending
              ? "Identificando…"
              : "Identificar perfil académico"}
          </button>
        </div>
        {prediction.isError && <ErrorState error={prediction.error} />}{" "}
        {cluster.isError && <ErrorState error={cluster.error} />}
      </Card>
      <div className="two-columns">
        <div>
          {latest.isPending ? (
            <Loading label="Consultando última predicción…" />
          ) : latest.data ? (
            <PredictionResult data={latest.data} />
          ) : isNotFound(latest.error) ? (
            <Card>
              <Empty>
                Aún no hay una predicción almacenada para este estudiante.
              </Empty>
            </Card>
          ) : (
            <ErrorState
              error={latest.error}
              retry={() => void latest.refetch()}
            />
          )}
        </div>
        <div>
          {cluster.data ? (
            <ClusterResult data={cluster.data} />
          ) : (
            <Card>
              <h2>Perfil académico</h2>
              <Empty>
                Selecciona «Identificar perfil académico» para solicitar una
                asignación a K-Means.
              </Empty>
              <p className="muted small">
                Los clusters son agrupaciones exploratorias; no equivalen a
                niveles de riesgo.
              </p>
            </Card>
          )}
        </div>
      </div>
      <div className="section-title">
        <h2>Las 36 variables de entrada</h2>
        <span className="subtle-tag">Valores originales</span>
      </div>
      <p className="muted small">
        Los campos categóricos conservan su código UCI. Las variables de segundo
        semestre requieren que ese periodo ya esté disponible.
      </p>
      <div className="feature-grid">
        {featureGroups.map((group) => (
          <Card key={group.title}>
            <h2>{group.title}</h2>
            <dl className="feature-list">
              {Object.entries(group.fields).map(([key, label]) => (
                <div key={key}>
                  <dt>
                    {label}
                    <small>{key}</small>
                  </dt>
                  <dd>
                    {student.data.features[key] === undefined
                      ? "No disponible"
                      : decimal(student.data.features[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}
