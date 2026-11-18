import { ChartNoAxesCombined, CheckCircle2 } from "lucide-react";
import { useInference, usePrediction } from "../../hooks/queries";
import { isNotFound } from "../../api/client";
import { Card, Empty, ErrorState, Experimental, Loading } from "../common/UI";
import { RiskIndicator } from "./RiskIndicator";
export function PredictionCard({ studentId }: { studentId: number }) {
  const latest = usePrediction(studentId);
  const { prediction } = useInference();
  return (
    <Card className="prediction-card">
      <div id="risk-evaluation" className="section-title">
        <h2>Evaluación predictiva</h2>
        <Experimental />
      </div>
      <p className="small muted">
        Última predicción almacenada · Random Forest
      </p>
      <button
        className="btn predict-button"
        disabled={prediction.isPending}
        onClick={() => prediction.mutate(studentId)}
      >
        <ChartNoAxesCombined size={17} />
        {prediction.isPending
          ? "Calculando riesgo…"
          : "Calcular riesgo de deserción"}
      </button>
      {prediction.isPending && (
        <p role="status" className="small muted">
          Calculando y guardando la evaluación…
        </p>
      )}
      {prediction.isSuccess && (
        <p className="success-message" role="status">
          <CheckCircle2 size={16} />
          Predicción guardada correctamente.
        </p>
      )}
      {prediction.isError && <ErrorState error={prediction.error} />}{" "}
      {latest.isPending ? (
        <Loading label="Consultando última predicción…" />
      ) : latest.data ? (
        <>
          <p className="small muted result-status">
            {latest.isError
              ? "Se muestra el último resultado conocido; no se pudo confirmar la consulta."
              : prediction.isError
                ? "Se conserva la predicción anterior; el nuevo cálculo no se completó."
                : "Riesgo estimado, distinto del estado académico observado."}
          </p>
          <RiskIndicator prediction={latest.data} />
          {latest.isError && (
            <ErrorState
              error={latest.error}
              retry={() => void latest.refetch()}
            />
          )}
        </>
      ) : isNotFound(latest.error) ? (
        <Empty>Este estudiante todavía no tiene una predicción registrada.</Empty>
      ) : (
        <ErrorState error={latest.error} retry={() => void latest.refetch()} />
      )}
    </Card>
  );
}
