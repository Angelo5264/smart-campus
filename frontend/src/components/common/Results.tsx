import type { Assignment, Prediction } from "../../types";
import { Card, Experimental, Warning } from "./UI";
import { dateTime, percent } from "../../utils/format";
export function PredictionResult({ data }: { data: Prediction }) {
  return (
    <Card>
      <div className="section-title">
        <h2>Última predicción almacenada</h2>
        <Experimental />
      </div>
      <p className="muted">
        Estudiante #{data.student_id} · No representa un historial completo
      </p>
      <div className="prediction-value">
        <strong>{percent(data.dropout_probability)}</strong>
        <span className={`badge risk-${data.risk_level.toLowerCase()}`}>
          {data.risk_level} ·{" "}
          {{ LOW: "Bajo", MEDIUM: "Medio", HIGH: "Alto" }[data.risk_level]}
        </span>
      </div>
      <p>Probabilidad experimental de abandono</p>
      <dl className="metadata">
        <div>
          <dt>Modelo</dt>
          <dd>{data.model}</dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd className="mono">{data.model_version}</dd>
        </div>
        <div>
          <dt>Fecha de cálculo · hora local</dt>
          <dd>{dateTime(data.created_at)}</dd>
        </div>
        <div>
          <dt>Procedencia</dt>
          <dd>{data.prediction_mode}</dd>
        </div>
      </dl>
      <p className="small muted">
        Umbrales {data.thresholds.status}: LOW &lt;{" "}
        {percent(data.thresholds.low)} · MEDIUM entre{" "}
        {percent(data.thresholds.low)} y menos de{" "}
        {percent(data.thresholds.high)} · HIGH ≥ {percent(data.thresholds.high)}
        . Nivel calculado por la API.
      </p>
      <p className="small muted mt-3">
        {data.probability_scope}. {data.scope}.
      </p>
      <Warning />
    </Card>
  );
}
export function ClusterResult({ data }: { data: Assignment }) {
  return (
    <Card>
      <div className="section-title">
        <h2>Perfil asignado</h2>
        <Experimental />
      </div>
      <div className="prediction-value">
        <strong>Cluster {data.cluster}</strong>
      </div>
      <p>
        Estudiante #{data.student_id} · {data.interpretation}
      </p>
      <dl className="metadata">
        <div>
          <dt>Modelo</dt>
          <dd>{data.model}</dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd className="mono">{data.model_version}</dd>
        </div>
        <div>
          <dt>Fecha · hora local</dt>
          <dd>{dateTime(data.created_at)}</dd>
        </div>
      </dl>
      <p className="small muted">
        Agrupación exploratoria, sin equivalencia automática con riesgo de
        abandono. {data.scope}.
      </p>
    </Card>
  );
}
