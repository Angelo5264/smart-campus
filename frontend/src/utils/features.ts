// Presentation only. Codes remain codes; no institutional identities are inferred.
export const featureGroups: {
  title: string;
  fields: Record<string, string>;
}[] = [
  {
    title: "Información demográfica",
    fields: {
      "Marital Status": "Estado civil (código)",
      Gender: "Género (código)",
      "Age at enrollment": "Edad al matricularse",
      Nacionality: "Nacionalidad (código)",
      International: "Estudiante internacional (código)",
      Displaced: "Desplazamiento (código)",
      "Educational special needs": "Necesidades educativas especiales (código)",
    },
  },
  {
    title: "Información de ingreso",
    fields: {
      "Application mode": "Modalidad de admisión (código)",
      "Application order": "Orden de preferencia",
      "Previous qualification": "Titulación previa (código)",
      "Previous qualification (grade)": "Nota de titulación previa",
      "Admission grade": "Nota de admisión",
    },
  },
  {
    title: "Información académica",
    fields: {
      Course: "Programa de estudios (código)",
      "Daytime/evening attendance": "Turno diurno / nocturno (código)",
      "Mother's qualification": "Nivel educativo de la madre (código)",
      "Father's qualification": "Nivel educativo del padre (código)",
    },
  },
  {
    title: "Variables económicas y familiares",
    fields: {
      "Mother's occupation": "Ocupación de la madre (código)",
      "Father's occupation": "Ocupación del padre (código)",
      Debtor: "Deudor (código)",
      "Tuition fees up to date": "Pagos de matrícula al día (código)",
      "Scholarship holder": "Becario (código)",
      "Unemployment rate": "Tasa de desempleo",
      "Inflation rate": "Tasa de inflación",
      GDP: "PIB",
    },
  },
  ...(["1st", "2nd"] as const).map((sem, i) => ({
    title: `Indicadores del ${i === 0 ? "primer" : "segundo"} semestre`,
    fields: Object.fromEntries(
      Object.entries({
        credited: "Unidades acreditadas",
        enrolled: "Unidades matriculadas",
        evaluations: "Evaluaciones",
        approved: "Unidades aprobadas",
        grade: "Calificación media",
        "without evaluations": "Unidades sin evaluación",
      }).map(([key, label]) => [`Curricular units ${sem} sem (${key})`, label]),
    ),
  })),
];
export const featureLabel = (name: string) =>
  featureGroups
    .flatMap((group) => Object.entries(group.fields))
    .find(([key]) => key === name)?.[1] || name;
