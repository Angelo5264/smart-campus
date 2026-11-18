import { Card } from "../common/UI";
import {
  curricularMeasures,
  numericValue,
  semesterKey,
  type AcademicFeatures,
  type Semester,
} from "../../utils/academic";
import { decimal } from "../../utils/format";
export function SemesterPerformance({
  features,
  semester,
}: {
  features: AcademicFeatures;
  semester: Semester;
}) {
  return (
    <Card>
      <div className="section-title">
        <h3 className="semester-title">{semester.label}</h3>
        <span className="subtle-tag">Actividad curricular</span>
      </div>
      <dl className="feature-list">
        {curricularMeasures.map((measure) => {
          const key = semesterKey(semester.key, measure.key);
          const value = numericValue(features[key]);
          return (
            <div key={key}>
              <dt>
                {measure.label}
                <small>{key}</small>
              </dt>
              <dd>{value === null ? "No disponible" : decimal(value)}</dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
