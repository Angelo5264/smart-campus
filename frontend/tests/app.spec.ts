import { test, expect } from "@playwright/test";

test("navegación, paginación, predicción y cluster reales", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", {
      name: "Una mirada a las trayectorias estudiantiles",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Estudiantes importados", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".stat-card").first()).toContainText("4,424");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Estudiantes", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Estudiante #1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(
    page.getByRole("link", { name: "Estudiante #21", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Anterior" }).click();
  await page.getByRole("link", { name: "Estudiante #1", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Las 36 variables de entrada" }),
  ).toBeVisible();
  await expect(page.locator(".feature-list dd")).toHaveCount(36);
  const predictionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/predictions") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Calcular riesgo de deserción" })
    .click();
  const prediction = await (await predictionResponse).json();
  await expect(
    page.getByText(
      prediction.risk_level +
        " · " +
        (
          { LOW: "Bajo", MEDIUM: "Medio", HIGH: "Alto" } as Record<
            string,
            string
          >
        )[prediction.risk_level],
      { exact: true },
    ),
  ).toBeVisible();
  const assignmentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/clusters/predict") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Identificar perfil académico", exact: true })
    .click();
  const assignment = await (await assignmentResponse).json();
  await expect(
    page.getByText(`Cluster ${assignment.cluster}`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Predicciones", exact: true })
    .click();
  // Wait for the destination before filling an input also present on the previous route.
  await expect(page.getByRole("heading", { name: "Predicciones de abandono", exact: true })).toBeVisible();
  await page.getByLabel("ID de estudiante").fill("1");
  await page.getByRole("button", { name: "Consultar estudiante" }).click();
  await expect(
    page.getByRole("heading", { name: "Última predicción almacenada" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Calcular predicción", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Calcular predicción", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Perfiles académicos", exact: true })
    .click();
  // Wait for the destination before filling an input also present on the previous route.
  await expect(page.getByRole("heading", { name: "Perfiles académicos", exact: true })).toBeVisible();
  await page.getByLabel("ID de estudiante").fill("1");
  await page.getByRole("button", { name: "Seleccionar", exact: true }).click();
  await page
    .getByRole("button", { name: "Identificar perfil · #1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Perfil asignado" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Modelos de ML" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Matriz de confusión" }),
  ).toBeVisible();
  await expect(page.getByText("Silueta del K seleccionado")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Modelos de Machine Learning" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("Flask desconectado y modelos no disponibles conservan la interfaz", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) => route.abort("failed"));
  await page.goto("/dashboard");
  await expect(page.getByText("API sin conexión")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Una mirada a las trayectorias estudiantiles",
    }),
  ).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText(
    "No se pudo conectar con Flask",
  );
  await page.unroute("**/api/v1/**");
  await page.route("**/api/v1/models/metrics", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: 503, message: "Modelo ausente" } }),
    }),
  );
  await page.reload();
  await expect(page.locator(".stat-card").first()).toContainText("4,424");
  await expect(page.getByRole("alert").first()).toContainText(
    "Predicción no disponible",
  );
});

test("navegación móvil y diseño sin desbordamiento", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.locator(".stat-card").first()).toContainText("4,424");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Estudiantes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Estudiantes", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Estudiante #1", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Las 36 variables de entrada" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
