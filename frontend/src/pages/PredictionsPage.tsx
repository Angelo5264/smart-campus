import { useSearchParams } from "react-router-dom";
import { ChartNoAxesCombined } from "lucide-react";
import { useInference, usePrediction } from "../hooks/queries";
import {
  Card,
  Empty,
  ErrorState,
  Loading,
  PageHeading,
  Warning,
} from "../components/common/UI";
import { StudentPicker } from "../components/common/StudentPicker";
import { PredictionResult } from "../components/common/Results";
import { isNotFound } from "../api/client";
import { validId } from "../utils/format";
export function PredictionsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("student_id") || "";
  const id = validId(raw) ? Number(raw) : 0;
  return (
    <>
      <PageHeading
        eyebrow="ANÁLISIS SUPERVISADO"
        title="Predicciones de abandono"
        description="Consulta el último resultado guardado o solicita un nuevo cálculo a Random Forest."
      />
      <Warning />
      <Card>
        <h2>Seleccionar estudiante</h2>
        <StudentPicker
          key={raw}
          initialValue={raw}
          onSelect={(value) => setParams({ student_id: String(value) })}
        />
      </Card>
      {id ? (
        <PredictionWorkspace key={id} id={id} />
      ) : (
        <Card>
          <Empty>
            Ingresa un ID para consultar su última predicción. No se calcula
            ningún resultado al abrir esta pantalla.
          </Empty>
        </Card>
      )}
    </>
  );
}
function PredictionWorkspace({ id }: { id: number }) {
  const query = usePrediction(id);
  const { prediction } = useInference();
  return (
    <>
      <Card>
        <div className="section-title">
          <div>
            <h2>Estudiante #{id}</h2>
            <p className="small muted">
              Cada cálculo nuevo se almacena en el backend.
            </p>
          </div>
          <button
            className="btn"
            disabled={prediction.isPending}
            onClick={() => prediction.mutate(id)}
          >
            <ChartNoAxesCombined size={17} />
            {prediction.isPending ? "Calculando…" : "Calcular predicción"}
          </button>
        </div>
        {prediction.isError && <ErrorState error={prediction.error} />}
      </Card>
      {query.isPending ? (
        <Loading />
      ) : query.data ? (
        <PredictionResult data={query.data} />
      ) : isNotFound(query.error) ? (
        <Card>
          <Empty>
            No hay una predicción almacenada o el estudiante no existe. Puedes
            verificar el ID en Estudiantes.
          </Empty>
        </Card>
      ) : (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      )}
    </>
  );
}
