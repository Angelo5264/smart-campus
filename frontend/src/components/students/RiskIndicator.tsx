import type { Prediction, Risk } from "../../types";
import { dateTime, percent } from "../../utils/format";
const riskNames: Record<Risk, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
};
export function RiskIndicator({ prediction }: { prediction: Prediction }) {
  const level = prediction.risk_level;
  return (
    <div className={`risk-indicator level-${level.toLowerCase()}`}>
      <div className="risk-heading">
        <div>
          <p className="eyebrow">RIESGO ESTIMADO</p>
          <span className={`badge risk-${level.toLowerCase()}`}>
            {level} · {riskNames[level]}
          </span>
        </div>
        <div className="traffic-light" aria-hidden="true">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((risk) => (
            <span
              key={risk}
              className={`light light-${risk.toLowerCase()} ${risk === level ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
      <div className="risk-probability">
        <strong>{percent(prediction.dropout_probability)}</strong>
        <span>Probabilidad experimental de abandono</span>
      </div>
      <div
        className="risk-meter"
        role="progressbar"
        aria-label="Probabilidad experimental de abandono"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={prediction.dropout_probability * 100}
        aria-valuetext={percent(prediction.dropout_probability)}
      >
        <span style={{ width: `${prediction.dropout_probability * 100}%` }} />
      </div>
      <dl className="metadata">
        <div>
          <dt>Modelo</dt>
          <dd>
            {prediction.model === "random_forest"
              ? "Random Forest"
              : prediction.model}
          </dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd className="mono">{prediction.model_version}</dd>
        </div>
        <div>
          <dt>Fecha de cálculo · hora local</dt>
          <dd>{dateTime(prediction.created_at)}</dd>
        </div>
        <div>
          <dt>Procedencia</dt>
          <dd>{prediction.prediction_mode}</dd>
        </div>
      </dl>
      <p className="small muted">
        Umbrales {prediction.thresholds.status}: LOW &lt;{" "}
        {percent(prediction.thresholds.low)} · MEDIUM desde{" "}
        {percent(prediction.thresholds.low)} hasta menos de{" "}
        {percent(prediction.thresholds.high)} · HIGH ≥{" "}
        {percent(prediction.thresholds.high)}. Nivel recibido de Flask.
      </p>
    </div>
  );
}
