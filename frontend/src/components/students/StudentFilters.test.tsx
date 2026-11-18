import { beforeEach, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { AxiosResponse } from "axios";
import { App } from "../../App";
import { client } from "../../api/client";
import students from "../../../tests/fixtures/students.json";
import health from "../../../tests/fixtures/health.json";
const counts = { total: 4424, complete: 4424, partial: 0, none: 0 };
function mount(route = "/students") {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
    const params = config?.params as
      Record<string, string | number> | undefined;
    return {
      data:
        url === "/health"
          ? health
          : {
              ...students,
              page: params?.page || 1,
              per_page: params?.per_page || 20,
              ...(params?.academic_data === "partial"
                ? { total: 0, items: [] }
                : {}),
              academic_summary: counts,
            },
    } as AxiosResponse;
  });
});
it("combina filtros, conserva parámetros al paginar y reinicia página al cambiar filtros", async () => {
  const user = userEvent.setup();
  mount();
  await screen.findByRole("link", { name: "Estudiante #1" });
  await user.selectOptions(
    screen.getByLabelText("Disponibilidad académica"),
    "complete",
  );
  await user.selectOptions(
    screen.getByLabelText("Semestres con información"),
    "both",
  );
  await user.selectOptions(
    screen.getByLabelText("Evaluaciones registradas"),
    "with",
  );
  await user.selectOptions(
    screen.getByLabelText("Semestre de evaluaciones"),
    "second",
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  await waitFor(() =>
    expect(client.get).toHaveBeenLastCalledWith("/students", {
      params: {
        page: 2,
        per_page: 20,
        academic_data: "complete",
        semester_availability: "both",
        evaluation_status: "with",
        evaluation_semester: "second",
      },
    }),
  );
  await user.selectOptions(
    screen.getByLabelText("Unidades curriculares aprobadas"),
    "without",
  );
  await waitFor(() =>
    expect(client.get).toHaveBeenLastCalledWith("/students", {
      params: {
        page: 1,
        per_page: 20,
        academic_data: "complete",
        semester_availability: "both",
        evaluation_status: "with",
        evaluation_semester: "second",
        approval_status: "without",
      },
    }),
  );
});
it("muestra conteos globales, estado vacío, filtros activos y limpia sin inventar datos", async () => {
  const user = userEvent.setup();
  mount("/students?academic_data=partial");
  await screen.findByText(
    "No hay coincidencias en esta página para los filtros seleccionados.",
  );
  expect(
    screen.getByRole("region", { name: "Disponibilidad académica global" }),
  ).toHaveTextContent("4,424");
  expect(
    screen.getByRole("button", {
      name: "Quitar filtro Disponibilidad académica",
    }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  await screen.findByRole("link", { name: "Estudiante #1" });
  expect(screen.getByText("Sin filtros activos")).toBeInTheDocument();
  expect(client.get).toHaveBeenLastCalledWith("/students", {
    params: { page: 1, per_page: 20 },
  });
});
it("cambia tamaño de página sin perder los filtros de semestre", async () => {
  const user = userEvent.setup();
  mount("/students?page=2&semester_availability=both");
  await screen.findByRole("link", { name: "Estudiante #1" });
  await user.selectOptions(screen.getByLabelText("Por página"), "50");
  await waitFor(() =>
    expect(client.get).toHaveBeenLastCalledWith("/students", {
      params: { page: 1, per_page: 50, semester_availability: "both" },
    }),
  );
});
