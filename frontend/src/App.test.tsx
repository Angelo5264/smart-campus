import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, type AxiosResponse } from "axios";
import { App } from "./App";
import { client, errorMessage } from "./api/client";
import * as validate from "./api/validate";
import { PredictionResult } from "./components/common/Results";
import { featureGroups } from "./utils/features";
import health from "../tests/fixtures/health.json";
import summary from "../tests/fixtures/summary.json";
import students from "../tests/fixtures/students.json";
import page2 from "../tests/fixtures/students_page2.json";
import student from "../tests/fixtures/student.json";
import prediction from "../tests/fixtures/prediction.json";
import assignment from "../tests/fixtures/assignment.json";
import clusters from "../tests/fixtures/clusters.json";
import models from "../tests/fixtures/models.json";
// Charts are exercised in the real browser suite; avoid layout emulation in jsdom.
vi.mock("./components/charts/Charts", () => ({
  DistributionChart: () => <div>Distribución</div>,
  ClusterChart: () => <div>Clusters</div>,
  MetricBars: () => <div>Métricas</div>,
}));
const response = (data: unknown) => ({ data }) as AxiosResponse;
function mount(route: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.spyOn(client, "get").mockImplementation(async (url, config) => {
    const data: Record<string, unknown> = {
      "/health": health,
      "/analytics/summary": summary,
      "/models/metrics": models,
      "/clusters": clusters,
      "/students/1": student,
      "/predictions/1": prediction,
    };
    if (url === "/students")
      return response(
        (config?.params as { page?: number })?.page === 2 ? page2 : students,
      );
    return response(data[url]);
  });
  vi.spyOn(client, "post").mockImplementation(async (url) =>
    response(url === "/predictions" ? prediction : assignment),
  );
});
describe("contratos reales y presentación", () => {
  it("acepta los contratos capturados y rechaza respuestas inesperadas", () => {
    expect(validate.models(models).random_forest.model).toBe("random_forest");
    expect(validate.student(student).id).toBe(1);
    expect(validate.clusters(clusters).profiles.length).toBeGreaterThan(0);
    expect(() => validate.summary({ students: "4424" })).toThrow(
      "Respuesta inesperada",
    );
    expect(() =>
      validate.prediction({ ...prediction, dropout_probability: null }),
    ).toThrow("Respuesta inesperada");
    expect(() =>
      validate.prediction({ ...prediction, risk_level: "CRITICAL" }),
    ).toThrow("Respuesta inesperada");
  });
  it("presenta las 36 variables reales exactamente una vez", () => {
    const keys = featureGroups.flatMap((g) => Object.keys(g.fields));
    expect(new Set(keys).size).toBe(36);
    expect(keys.sort()).toEqual(Object.keys(student.features).sort());
  });
  it("respeta el riesgo de la API sin recalcularlo a partir de la probabilidad", () => {
    render(
      <PredictionResult
        data={validate.prediction({ ...prediction, risk_level: "LOW" })}
      />,
    );
    expect(screen.getByText("LOW · Bajo")).toBeInTheDocument();
    expect(screen.queryByText("HIGH · Alto")).not.toBeInTheDocument();
  });
  it.each([400, 404, 415, 503])("traduce el error HTTP %i", (code) => {
    const error = new AxiosError("http", undefined, undefined, undefined, {
      status: code,
      data: { error: { message: "Detalle API" } },
    } as AxiosResponse);
    expect(errorMessage(error)).toContain("Detalle API");
  });
});
describe("flujos de la interfaz", () => {
  it("navega desde dashboard y pagina con el servidor sin descargar detalles", async () => {
    const user = userEvent.setup();
    mount("/dashboard");
    await screen.findByText("Estudiantes importados");
    await user.click(screen.getByRole("link", { name: "Estudiantes" }));
    await screen.findByRole("link", { name: "Estudiante #1" });
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByRole("link", { name: "Estudiante #21" });
    expect(client.get).toHaveBeenCalledWith("/students", {
      params: { page: 2, per_page: 20 },
    });
    expect(client.get).not.toHaveBeenCalledWith("/students/1");
    expect(client.post).not.toHaveBeenCalled();
  });
  it("calcula predicción y cluster exclusivamente por student_id", async () => {
    const user = userEvent.setup();
    mount("/students/1");
    await screen.findByRole("heading", { name: "Estudiante #1" });
    await user.click(
      screen.getByRole("button", { name: "Calcular riesgo de deserción" }),
    );
    await waitFor(() =>
      expect(client.post).toHaveBeenCalledWith("/predictions", {
        student_id: 1,
      }),
    );
    await screen.findByText("HIGH · Alto");
    await user.click(
      screen.getByRole("button", { name: "Identificar perfil académico" }),
    );
    await screen.findByRole("heading", { name: "Perfil asignado" });
    expect(client.post).toHaveBeenCalledWith("/clusters/predict", {
      student_id: 1,
    });
  });
  it("valida ID y no muestra predicciones inexistentes", async () => {
    vi.mocked(client.get).mockImplementation(async (url) => {
      if (url === "/health") return response(health);
      throw new AxiosError("missing", undefined, undefined, undefined, {
        status: 404,
        data: { error: { message: "Sin predicción" } },
      } as AxiosResponse);
    });
    const user = userEvent.setup();
    mount("/predictions");
    await user.type(screen.getByLabelText("ID de estudiante"), "-3");
    await user.click(
      screen.getByRole("button", { name: "Consultar estudiante" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("entero positivo");
    await user.clear(screen.getByLabelText("ID de estudiante"));
    await user.type(screen.getByLabelText("ID de estudiante"), "1");
    await user.click(
      screen.getByRole("button", { name: "Consultar estudiante" }),
    );
    await screen.findByText(
      /No hay una predicción almacenada o el estudiante no existe/,
    );
    expect(screen.queryByText("HIGH · Alto")).not.toBeInTheDocument();
    expect(client.post).not.toHaveBeenCalled();
  });
  it("informa la desconexión sin eliminar navegación", async () => {
    vi.mocked(client.get).mockRejectedValue(new AxiosError("Network Error"));
    mount("/students");
    await screen.findByText("API sin conexión");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo conectar con Flask",
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
  it("muestra estado pendiente y deshabilita cálculos duplicados", async () => {
    let finish!: (data: AxiosResponse) => void;
    vi.mocked(client.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    mount("/students/1");
    await user.click(
      await screen.findByRole("button", {
        name: "Calcular riesgo de deserción",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Calculando riesgo…" }),
    ).toBeDisabled();
    finish(response(prediction));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Calcular riesgo de deserción" }),
      ).toBeEnabled(),
    );
  });
});
