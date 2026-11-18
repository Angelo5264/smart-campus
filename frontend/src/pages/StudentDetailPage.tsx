import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Network } from "lucide-react";
import { useInference, useStudent } from "../hooks/queries";
import { Card, Empty, ErrorState } from "../components/common/UI";
import { ClusterResult } from "../components/common/Results";
import { validId } from "../utils/format";
import { semesters } from "../utils/academic";
import { StudentProfileHeader } from "../components/students/StudentProfileHeader";
import { AcademicSummary } from "../components/students/AcademicSummary";
import { SemesterPerformance } from "../components/students/SemesterPerformance";
import { AcademicProgressChart } from "../components/students/AcademicProgressChart";
import { StudentAttributes } from "../components/students/StudentAttributes";
import { PredictionCard } from "../components/students/PredictionCard";
import { StudentProfileSkeleton } from "../components/students/StudentProfileSkeleton";
export function StudentDetailPage() {
  const { id = "" } = useParams();
  return validId(id) ? (
    <StudentDetail key={id} id={Number(id)} />
  ) : (
    <ErrorState error={new Error("El ID debe ser un entero positivo.")} />
  );
}
function StudentDetail({ id }: { id: number }) {
  const student = useStudent(id);
  const { cluster } = useInference();
  return (
    <>
      <Link className="text-link" to="/students">
        <ArrowLeft size={16} />
        Volver a estudiantes
      </Link>
      {student.isPending ? (
        <StudentProfileSkeleton />
      ) : student.isError ? (
        <ErrorState
          error={student.error}
          retry={() => void student.refetch()}
        />
      ) : (
        <>
          <StudentProfileHeader student={student.data} />
          <div className="section-title variable-overview">
            <h2>Las 36 variables de entrada</h2>
            <span className="small muted">
              12 indicadores semestrales · 24 datos complementarios
            </span>
          </div>
          <div className="profile-columns">
            <div className="academic-column">
              <AcademicSummary features={student.data.features} />
              <AcademicProgressChart features={student.data.features} />
              <section aria-labelledby="curricular-title">
                <div className="section-title">
                  <h2 id="curricular-title">
                    Actividad curricular por semestre
                  </h2>
                </div>
                <p className="small muted curricular-description">
                  Conteos originales de unidades curriculares y evaluaciones.
                  Las unidades no se equiparan automáticamente con asignaturas
                  peruanas.
                </p>
                <div className="semester-summary-grid">
                  {semesters.map((semester) => (
                    <SemesterPerformance
                      key={semester.key}
                      semester={semester}
                      features={student.data.features}
                    />
                  ))}
                </div>
              </section>
            </div>
            <div className="predictive-column">
              <PredictionCard studentId={id} />
              <Card>
                <div className="section-title">
                  <h2>Perfil académico · K-Means</h2>
                </div>
                <p className="small muted">
                  Agrupación por características académicas, independiente del
                  riesgo de abandono.
                </p>
                <button
                  className="btn secondary predict-button"
                  disabled={cluster.isPending}
                  onClick={() => cluster.mutate(id)}
                >
                  <Network size={17} />
                  {cluster.isPending
                    ? "Identificando…"
                    : "Identificar perfil académico"}
                </button>
                {cluster.isError && <ErrorState error={cluster.error} />}{" "}
                {cluster.data ? (
                  <div className="mt-5">
                    <ClusterResult data={cluster.data} />
                  </div>
                ) : (
                  <Empty>
                    Solicita una asignación para consultar el perfil de este
                    estudiante.
                  </Empty>
                )}
              </Card>
            </div>
          </div>
          <StudentAttributes features={student.data.features} />
        </>
      )}
    </>
  );
}
