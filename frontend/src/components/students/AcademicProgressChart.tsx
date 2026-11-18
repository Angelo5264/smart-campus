import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, Empty } from "../common/UI";
import {
  formatGrade,
  gradeValue,
  semesterKey,
  semesters,
  type AcademicFeatures,
} from "../../utils/academic";
export function AcademicProgressChart({
  features,
}: {
  features: AcademicFeatures;
}) {
  const data = semesters.map((semester) => ({
    semester: semester.short,
    grade: gradeValue(features[semesterKey(semester.key, "grade")]),
  }));
  const complete = data.every((point) => point.grade !== null);
  const zero = data.some((point) => point.grade === 0);
  return (
    <Card>
      <div className="section-title">
        <h2>Evolución de promedios</h2>
        <span className="subtle-tag">0–20</span>
      </div>
      {complete ? (
        <>
          <div
            className="chart academic-chart"
            role="img"
            aria-label={`Promedio del primer semestre: ${formatGrade(data[0].grade)}. Promedio del segundo semestre: ${formatGrade(data[1].grade)}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 18, left: 4, right: 35, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e6ebf2"
                />
                <XAxis
                  dataKey="semester"
                  padding={{ left: 28, right: 28 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 20]}
                  ticks={[0, 5, 10, 15, 20]}
                  width={32}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    formatGrade(Number(value)),
                    "Promedio académico",
                  ]}
                />
                <Line
                  type="linear"
                  dataKey="grade"
                  stroke="#3478d6"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#3478d6",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="small muted">
            {zero
              ? "La gráfica conserva los ceros originales. Consulta evaluaciones y aprobaciones para interpretar el contexto."
              : "Comparación descriptiva entre los dos promedios, sin conversión de escala."}
          </p>
        </>
      ) : (
        <Empty>
          Se necesitan ambos promedios disponibles para mostrar la evolución.
        </Empty>
      )}
    </Card>
  );
}
