export const filterDefinitions = [
  {
    key: "academic_data",
    label: "Disponibilidad académica",
    defaultValue: "all",
    options: [
      ["all", "Todos"],
      ["complete", "Con información académica"],
      ["none", "Sin información académica"],
      ["partial", "Información académica parcial"],
    ],
  },
  {
    key: "semester_availability",
    label: "Semestres con información",
    defaultValue: "all",
    options: [
      ["all", "Todos los semestres"],
      ["first_only", "Solo primer semestre disponible"],
      ["both", "Primer y segundo semestre disponibles"],
      ["none", "Sin información de ambos semestres"],
      ["second_only", "Solo segundo semestre disponible"],
    ],
  },
  {
    key: "evaluation_status",
    label: "Evaluaciones registradas",
    defaultValue: "all",
    options: [
      ["all", "Todas"],
      ["with", "Con evaluaciones registradas"],
      ["without", "Sin evaluaciones registradas"],
      ["zero", "Conteo cero conocido"],
      ["unknown", "Conteo no disponible"],
    ],
  },
  {
    key: "evaluation_semester",
    label: "Semestre de evaluaciones",
    defaultValue: "any",
    options: [
      ["any", "Ambos semestres"],
      ["first", "Primer semestre"],
      ["second", "Segundo semestre"],
    ],
  },
  {
    key: "approval_status",
    label: "Unidades curriculares aprobadas",
    defaultValue: "all",
    options: [
      ["all", "Todas"],
      ["with", "Con unidades aprobadas"],
      ["without", "Sin unidades aprobadas"],
      ["zero", "Conteo cero conocido"],
      ["unknown", "Conteo no disponible"],
    ],
  },
  {
    key: "approval_semester",
    label: "Semestre de aprobaciones",
    defaultValue: "any",
    options: [
      ["any", "Ambos semestres"],
      ["first", "Primer semestre"],
      ["second", "Segundo semestre"],
    ],
  },
] as const;
export type FilterKey = (typeof filterDefinitions)[number]["key"];
export type StudentFilters = Partial<Record<FilterKey, string>>;
export function readStudentFilters(params: URLSearchParams): StudentFilters {
  return Object.fromEntries(
    filterDefinitions.flatMap((filter) => {
      const value = params.get(filter.key);
      return value && value !== filter.defaultValue
        ? [[filter.key, value]]
        : [];
    }),
  );
}
