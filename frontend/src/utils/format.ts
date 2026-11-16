export const count = (value: number) =>
  new Intl.NumberFormat("es-PE").format(value);
export const percent = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
export const decimal = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const targetLabel = {
  Dropout: "Abandono observado",
  Graduate: "Graduado",
  Enrolled: "Matriculado",
};
export const validId = (value: string) =>
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;
