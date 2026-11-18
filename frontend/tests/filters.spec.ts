import { test, expect } from "@playwright/test";

test("disponibilidad real, combinaciones y limpieza de filtros", async ({
  page,
}) => {
  const unfiltered = await (await page.request.get("/api/v1/students")).json();
  expect(
    unfiltered.academic_summary.complete +
      unfiltered.academic_summary.partial +
      unfiltered.academic_summary.none,
  ).toBe(unfiltered.academic_summary.total);
  await page.goto("/students");
  await expect(
    page.getByRole("region", { name: "Disponibilidad académica global" }),
  ).toBeVisible();
  await page
    .getByLabel("Disponibilidad académica", { exact: true })
    .selectOption("partial");
  await expect(
    page.getByText(
      "No hay coincidencias en esta página para los filtros seleccionados.",
    ),
  ).toBeVisible();
  await page.getByLabel("Semestres con información").selectOption("first_only");
  await page.getByLabel("Evaluaciones registradas").selectOption("without");
  await page.getByLabel("Semestre de evaluaciones").selectOption("second");
  await page.reload();
  await expect(page.getByLabel("Semestres con información")).toHaveValue(
    "first_only",
  );
  await expect(
    page.getByText(
      "No hay coincidencias en esta página para los filtros seleccionados.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(
    page.getByRole("link", { name: "Estudiante #1", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sin filtros activos")).toBeVisible();
});

test("paginación filtrada coincide con SQL y funciona en móvil", async ({
  page,
}) => {
  const url =
    "/api/v1/students?academic_data=complete&semester_availability=both&evaluation_status=with&evaluation_semester=first&page=2&per_page=20";
  const expected = await (await page.request.get(url)).json();
  expect(expected.items.length).toBeGreaterThan(0);
  await page.goto(
    "/students?academic_data=complete&semester_availability=both&evaluation_status=with&evaluation_semester=first",
  );
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(
    page.getByRole("link", {
      name: `Estudiante #${expected.items[0].id}`,
      exact: true,
    }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("evaluation_semester")).toBe(
    "first",
  );
  await expect(page.locator(".table-heading .subtle-tag")).toHaveText(
    new Intl.NumberFormat("es-PE").format(expected.total),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Por página").selectOption("10");
  await expect(page).toHaveURL(/page=1/);
  await expect(
    page.getByLabel("Disponibilidad académica", { exact: true }),
  ).toHaveValue("complete");
});
