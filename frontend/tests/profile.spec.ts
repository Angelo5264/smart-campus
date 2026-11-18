import { test, expect } from "@playwright/test";

test("ficha con datos reales, 36 variables y predicción persistida tras recargar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const posts: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") posts.push(req.url());
  });
  const detail = await (await page.request.get("/api/v1/students/1")).json();
  await page.goto("/students/1");
  await expect(
    page.getByRole("heading", { name: "Estudiante #1", exact: true }),
  ).toBeVisible();
  expect(posts).toHaveLength(0);
  for (const sem of ["1st", "2nd"])
    await expect(page.getByTestId(`grade-${sem}`)).toHaveText(
      `${detail.features[`Curricular units ${sem} sem (grade)`].toFixed(2)} / 20`,
    );
  await expect(page.locator(".feature-list dd")).toHaveCount(36);
  for (const title of [
    "Datos sociodemográficos",
    "Información de admisión",
    "Información económica",
    "Datos académicos adicionales",
  ]) {
    const summary = page.locator("summary").filter({ hasText: title });
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  await expect(page.getByText("127.30 / 200", { exact: true })).toBeVisible();
  const waiting = page.waitForResponse(
    (r) => r.url().endsWith("/predictions") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Calcular riesgo de deserción" })
    .click();
  const response = await waiting;
  expect(response.status()).toBe(201);
  const prediction = await response.json();
  await expect(
    page.getByText("Predicción guardada correctamente."),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(prediction.dropout_probability * 100),
  );
  const stored = await (await page.request.get("/api/v1/predictions/1")).json();
  expect(stored.id).toBe(prediction.id);
  const nPosts = posts.length;
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(prediction.dropout_probability * 100),
  );
  expect(posts).toHaveLength(nPosts);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Calcular riesgo de deserción" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("404 de última predicción y 503 de cálculo no inventan resultados", async ({
  page,
}) => {
  await page.route("**/api/v1/predictions/1", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: 404, message: "Sin predicción" } }),
    }),
  );
  await page.route("**/api/v1/predictions", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: 503, message: "Modelo no disponible" },
      }),
    }),
  );
  await page.goto("/students/1");
  await expect(
    page.getByText(
      "Este estudiante todavía no tiene una predicción registrada.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Calcular riesgo de deserción" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Predicción no disponible",
  );
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Resumen académico" }),
  ).toBeVisible();
});
