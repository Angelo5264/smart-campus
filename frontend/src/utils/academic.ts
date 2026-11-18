import { decimal } from "./format";
export type AcademicFeatures = Record<string, number | null | undefined>;
export const semesters = [
  { key: "1st", label: "Primer semestre", short: "1.er semestre" },
  { key: "2nd", label: "Segundo semestre", short: "2.º semestre" },
] as const;
export type Semester = (typeof semesters)[number];
export const curricularMeasures = [
  { key: "enrolled", label: "Unidades matriculadas" },
  { key: "approved", label: "Unidades aprobadas" },
  { key: "credited", label: "Unidades acreditadas" },
  { key: "evaluations", label: "Evaluaciones registradas" },
  { key: "without evaluations", label: "Unidades sin evaluación" },
] as const;
export const semesterKey = (semester: Semester["key"], measure: string) =>
  `Curricular units ${semester} sem (${measure})`;
export function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function gradeValue(value: unknown): number | null {
  const number = numericValue(value);
  return number !== null && number >= 0 && number <= 20 ? number : null;
}
export const formatGrade = (value: unknown) => {
  const grade = gradeValue(value);
  return grade === null ? "No disponible" : `${grade.toFixed(2)} / 20`;
};
export function semesterContext(
  features: AcademicFeatures,
  semester: Semester["key"],
) {
  const grade = gradeValue(features[semesterKey(semester, "grade")]);
  if (grade === null)
    return "Promedio no disponible. No se reemplaza por cero.";
  if (grade !== 0) return "Promedio original del dataset · escala de 0 a 20.";
  const evaluations = numericValue(
    features[semesterKey(semester, "evaluations")],
  );
  const approved = numericValue(features[semesterKey(semester, "approved")]);
  return `Valor original: 0. Evaluaciones: ${evaluations === null ? "no disponibles" : decimal(evaluations)}; unidades aprobadas: ${approved === null ? "no disponibles" : decimal(approved)}. El cero por sí solo no determina desaprobación.`;
}
// Descriptions translated from data/raw/variables.json, downloaded from UCI 697.
export const featureNotes: Record<string, string> = {
  "Admission grade": "Escala original de admisión: 0 a 200.",
  "Previous qualification (grade)":
    "Escala original de la calificación previa: 0 a 200.",
  "Application order":
    "Orden de preferencia: 0 (primera opción) a 9 (última opción).",
  "Age at enrollment": "Edad en años al matricularse.",
  "Unemployment rate": "Tasa de desempleo, expresada en porcentaje.",
  "Inflation rate": "Tasa de inflación, expresada en porcentaje.",
  GDP: "PIB. El diccionario UCI no especifica una unidad.",
  "Daytime/evening attendance":
    "1: diurno · 0: nocturno. No mide asistencia diaria.",
  Gender: "Codificación original UCI: 1: masculino · 0: femenino.",
  "Marital Status":
    "1: soltero · 2: casado · 3: viudo · 4: divorciado · 5: unión de hecho · 6: separado legalmente.",
};
for (const field of [
  "International",
  "Displaced",
  "Educational special needs",
  "Debtor",
  "Tuition fees up to date",
  "Scholarship holder",
]) {
  featureNotes[field] = "Codificación original UCI: 1: sí · 0: no.";
}
export function attributeValue(key: string, value: unknown) {
  const numeric = numericValue(value);
  if (numeric === null) return "No disponible";
  if (key === "Admission grade" || key === "Previous qualification (grade)")
    return `${numeric.toFixed(2)} / 200`;
  if (key === "Unemployment rate" || key === "Inflation rate")
    return `${decimal(numeric)} %`;
  if (key === "Age at enrollment") return `${decimal(numeric)} años`;
  return decimal(numeric);
}
