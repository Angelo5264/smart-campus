import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AxiosError, type AxiosResponse } from "axios";
import { StudentDetailPage } from "../../pages/StudentDetailPage";
import { client } from "../../api/client";
import * as validate from "../../api/validate";
import { AcademicSummary } from "./AcademicSummary";
import { RiskIndicator } from "./RiskIndicator";
import { StudentAttributes } from "./StudentAttributes";
import { formatGrade, semesterKey, semesters } from "../../utils/academic";
import student from "../../../tests/fixtures/student.json";
import student2 from "../../../tests/fixtures/student2.json";
import prediction from "../../../tests/fixtures/prediction.json";
const response = (data: unknown) => ({ data }) as AxiosResponse;
const httpError = (status: number) =>
  new AxiosError("http", undefined, undefined, undefined, {
    status,
    data: {
      error: {
        message:
          status === 404 ? "Sin predicción registrada" : "Modelo no disponible",
      },
    },
  } as AxiosResponse);
function mount() {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const spy = vi.spyOn(cache, "invalidateQueries");
  render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={["/students/1"]}>
        <Routes>
          <Route path="/students/:id" element={<StudentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { cache, spy };
}
beforeEach(() => {
  vi.spyOn(client, "get").mockImplementation(async (url) =>
    response(url.startsWith("/students/") ? student : prediction),
  );
  vi.spyOn(client, "post").mockResolvedValue(response(prediction));
});
describe("notas y atributos académicos", () => {
  it("muestra los promedios reales sobre 20 sin dividir ni convertir", () => {
    render(<AcademicSummary features={student2.features} />);
    for (const sem of semesters) {
      const value =
        student2.features[
          semesterKey(sem.key, "grade") as keyof typeof student2.features
        ];
      expect(screen.getByTestId(`grade-${sem.key}`)).toHaveTextContent(
        `${value.toFixed(2)} / 20`,
      );
      expect(value).toBeGreaterThan(0);
    }
  });
  it("conserva ceros y presenta sus evaluaciones y aprobaciones, sin etiquetar desaprobación", () => {
    render(<AcademicSummary features={student.features} />);
    expect(screen.getByTestId("grade-1st")).toHaveTextContent("0.00 / 20");
    expect(
      screen.getAllByText(/Evaluaciones: 0; unidades aprobadas: 0/),
    ).toHaveLength(2);
    expect(screen.queryByText(/^Desaprobado$/i)).not.toBeInTheDocument();
  });
  it("distingue campos ausentes/nulos de cero sin imputar valores", () => {
    const { ["Curricular units 1st sem (grade)"]: omitted, ...features } =
      student.features;
    const missing = validate.student({
      ...student,
      features: { ...features, "Curricular units 2nd sem (grade)": null },
    });
    render(<AcademicSummary features={missing.features} />);
    expect(screen.getByTestId("grade-1st")).toHaveTextContent("No disponible");
    expect(screen.getByTestId("grade-2nd")).toHaveTextContent("No disponible");
    expect(formatGrade(NaN)).toBe("No disponible");
    expect(formatGrade(21)).toBe("No disponible");
    expect(() =>
      validate.student({
        ...student,
        features: { ...student.features, "Admission grade": "127" },
      }),
    ).toThrow();
  });
  it("mantiene escalas 0–200 en admisión y calificación previa y muestra el diccionario", async () => {
    const user = userEvent.setup();
    render(<StudentAttributes features={student.features} />);
    await user.click(screen.getByText("Información de admisión"));
    expect(screen.getByText("127.30 / 200")).toBeVisible();
    expect(screen.getByText("122.00 / 200")).toBeVisible();
    expect(
      screen.getByText("Escala original de admisión: 0 a 200."),
    ).toBeVisible();
  });
});
describe("semáforo y persistencia de consultas", () => {
  it.each([
    ["LOW", "Bajo"],
    ["MEDIUM", "Medio"],
    ["HIGH", "Alto"],
  ] as const)("renderiza %s según Flask, sin recalcularlo", (level, label) => {
    const data = validate.prediction({ ...prediction, risk_level: level });
    render(<RiskIndicator prediction={data} />);
    expect(screen.getByText(`${level} · ${label}`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(data.dropout_probability * 100),
    );
    expect(screen.getByText(data.model_version)).toBeInTheDocument();
    expect(screen.queryByLabelText("Alcance experimental")).not.toBeInTheDocument();
  });
  it("separa Graduate observado del riesgo HIGH y no ejecuta POST al abrir", async () => {
    vi.mocked(client.get).mockImplementation(async (url) =>
      response(
        url.startsWith("/students/")
          ? { ...student, observed_target: "Graduate" }
          : prediction,
      ),
    );
    mount();
    expect(await screen.findByText("Graduado · Graduate")).toBeInTheDocument();
    expect(await screen.findByText("HIGH · Alto")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Estado académico observado" }),
    ).toBeInTheDocument();
    expect(client.post).not.toHaveBeenCalled();
  });
  it("trata 404 de predicción como ausencia, calcula por ID, invalida y actualiza sin recargar", async () => {
    let stored = false;
    vi.mocked(client.get).mockImplementation(async (url) => {
      if (url.startsWith("/students/")) return response(student);
      if (!stored) throw httpError(404);
      return response(prediction);
    });
    vi.mocked(client.post).mockImplementation(async () => {
      stored = true;
      return response(prediction);
    });
    const { spy } = mount();
    expect(
      await screen.findByText(
        "Este estudiante todavía no tiene una predicción registrada.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(
        screen.getByRole("button", { name: "Calcular riesgo de deserción" }),
      );
    expect(
      await screen.findByText("Predicción guardada correctamente."),
    ).toBeInTheDocument();
    expect(await screen.findByText("HIGH · Alto")).toBeInTheDocument();
    expect(client.post).toHaveBeenCalledWith("/predictions", { student_id: 1 });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["prediction", 1] });
    await waitFor(() =>
      expect(
        vi
          .mocked(client.get)
          .mock.calls.filter(([url]) => url === "/predictions/1"),
      ).toHaveLength(2),
    );
  });
  it("ante 503 no crea probabilidad y conserva la ficha disponible", async () => {
    vi.mocked(client.get).mockImplementation(async (url) => {
      if (url.startsWith("/students/")) return response(student);
      throw httpError(404);
    });
    vi.mocked(client.post).mockRejectedValue(httpError(503));
    mount();
    await screen.findByText(
      "Este estudiante todavía no tiene una predicción registrada.",
    );
    await userEvent
      .setup()
      .click(
        screen.getByRole("button", { name: "Calcular riesgo de deserción" }),
      );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Predicción no disponible",
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resumen académico" }),
    ).toBeInTheDocument();
  });
  it("conserva y distingue la predicción anterior si falla un nuevo cálculo", async () => {
    vi.mocked(client.post).mockRejectedValue(httpError(503));
    mount();
    await screen.findByText("HIGH · Alto");
    await userEvent
      .setup()
      .click(
        screen.getByRole("button", { name: "Calcular riesgo de deserción" }),
      );
    await screen.findByRole("alert");
    expect(
      screen.getByText(
        "Se conserva la predicción anterior; el nuevo cálculo no se completó.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.queryByText("Predicción guardada correctamente."),
    ).not.toBeInTheDocument();
  });
  it("presenta skeleton al cargar y error si el estudiante no existe", async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(client.get).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    mount();
    expect(
      screen.getByRole("status", { name: "Cargando ficha académica" }),
    ).toBeInTheDocument();
    reject(httpError(404));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se encontró el estudiante",
    );
    expect(
      screen.queryByRole("button", { name: "Calcular riesgo de deserción" }),
    ).not.toBeInTheDocument();
  });
});
