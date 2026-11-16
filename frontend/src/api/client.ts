import axios from "axios";
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "No se pudo conectar con Flask. Comprueba que la API esté disponible e inténtalo de nuevo.";
    const messages: Record<number, string> = {
      400: "Solicitud inválida. Revisa el ID del estudiante.",
      404: "No se encontró el estudiante o aún no tiene una predicción almacenada.",
      415: "El servicio no aceptó el formato de la solicitud.",
      503: "Predicción no disponible. El servicio o los modelos no están disponibles.",
    };
    const detail = error.response.data?.error?.message;
    return messages[error.response.status]
      ? `${messages[error.response.status]}${typeof detail === "string" ? ` ${detail}` : ""}`
      : "El servicio no pudo completar la solicitud. Inténtalo de nuevo.";
  }
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}
export function isNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
