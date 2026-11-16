// Validate the JSON boundary; TypeScript alone cannot validate an HTTP response.
import type {
  Assignment,
  Clusters,
  Health,
  Models,
  Prediction,
  Student,
  StudentList,
  Summary,
} from "../types";
type Check = (value: unknown) => boolean;
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const number: Check = (v) => typeof v === "number" && Number.isFinite(v);
const integer: Check = (v) =>
  number(v) && Number.isSafeInteger(v) && Number(v) >= 0;
const string: Check = (v) => typeof v === "string";
const date: Check = (v) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));
const array =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check);
const record =
  (check: Check): Check =>
  (v) =>
    object(v) && Object.values(v).every(check);
const shape =
  (fields: Record<string, Check>): Check =>
  (v) =>
    object(v) && Object.entries(fields).every(([key, check]) => check(v[key]));
const unit: Check = (v) => number(v) && Number(v) >= 0 && Number(v) <= 1;
const oneOf =
  (...values: string[]): Check =>
  (v) =>
    typeof v === "string" && values.includes(v);
const profile = shape({
  cluster: integer,
  count: integer,
  numeric_means: record(number),
  course_counts: record(integer),
});
const result = {
  id: integer,
  student_id: (v: unknown) => v === null || integer(v),
  model: string,
  model_version: string,
  created_at: date,
  prediction_mode: string,
  prediction_type: string,
  scope: string,
};
const model = (metrics: Check) =>
  shape({
    model: string,
    model_version: string,
    created_at: date,
    prediction_mode: string,
    dataset: string,
    features: array(string),
    metrics,
    seed: integer,
    sklearn_version: string,
  });
function decoder<T>(check: Check) {
  return (value: unknown): T => {
    if (!check(value))
      throw new Error(
        "Respuesta inesperada de la API. No se pudo interpretar la información.",
      );
    return value as T;
  };
}
export const health = decoder<Health>(
  shape({ status: string, database: string, prediction_mode: string }),
);
export const students = decoder<StudentList>(
  shape({
    items: array(shape({ id: integer, source: string })),
    page: integer,
    per_page: integer,
    total: integer,
  }),
);
export const student = decoder<Student>(
  shape({
    id: integer,
    source: string,
    identity: string,
    observed_target: oneOf("Dropout", "Enrolled", "Graduate"),
    features: (v) =>
      record(number)(v) && Object.keys(v as object).length === 36,
  }),
);
export const summary = decoder<Summary>(
  shape({
    students: integer,
    observed_targets: record(integer),
    predictions: integer,
    cluster_assignments: integer,
    prediction_mode: string,
  }),
);
export const prediction = decoder<Prediction>(
  shape({
    ...result,
    dropout_probability: unit,
    risk_level: oneOf("LOW", "MEDIUM", "HIGH"),
    probability_scope: string,
    thresholds: shape({ low: unit, high: unit, status: string }),
  }),
);
export const assignment = decoder<Assignment>(
  shape({ ...result, cluster: integer, interpretation: string }),
);
export const clusters = decoder<Clusters>(
  shape({
    model_version: string,
    prediction_mode: string,
    profiles: array(profile),
    interpretation: string,
  }),
);
export const models = decoder<Models>(
  shape({
    random_forest: model(
      shape({
        accuracy: unit,
        precision: unit,
        recall: unit,
        f1: unit,
        roc_auc: unit,
        train_rows: integer,
        test_rows: integer,
        excluded_enrolled: integer,
        evaluation: string,
        confusion_matrix: (v) =>
          v === undefined ||
          (Array.isArray(v) &&
            v.length === 2 &&
            v.every(
              (row) =>
                Array.isArray(row) && row.length === 2 && row.every(integer),
            )),
        confusion_matrix_labels: (v) =>
          v === undefined ||
          (Array.isArray(v) && v.length === 2 && v.every(string)),
      }),
    ),
    kmeans: model(
      shape({
        selected_k: integer,
        silhouette_by_k: record(number),
        profiles: array(profile),
        rows: integer,
        interpretation: string,
      }),
    ),
  }),
);
