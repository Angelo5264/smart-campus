import { BookOpen } from "lucide-react";
import { Card } from "../common/UI";
import {
  formatGrade,
  semesterContext,
  semesterKey,
  semesters,
  type AcademicFeatures,
} from "../../utils/academic";
export function AcademicSummary({ features }: { features: AcademicFeatures }) {
  return (
    <section id="academic-summary" aria-labelledby="academic-title">
      <div className="section-title">
        <h2 id="academic-title">Resumen académico</h2>
        <span className="subtle-tag">Escala original · 0 a 20</span>
      </div>
      <div className="semester-summary-grid">
        {semesters.map((semester) => (
          <Card key={semester.key} className="semester-grade">
            <dl className="feature-list">
              <div>
                <dt>
                  <BookOpen size={17} aria-hidden="true" />
                  Promedio del {semester.label.toLowerCase()}
                  <small>{semesterKey(semester.key, "grade")}</small>
                </dt>
                <dd data-testid={`grade-${semester.key}`}>
                  {formatGrade(features[semesterKey(semester.key, "grade")])}
                </dd>
              </div>
            </dl>
            <p className="small muted grade-context">
              {semesterContext(features, semester.key)}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
