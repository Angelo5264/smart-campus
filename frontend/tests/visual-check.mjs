import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  deviceScaleFactor: 1,
});
await page.goto(process.env.E2E_BASE_URL || "http://127.0.0.1:5173/dashboard");
await page.getByText("Estudiantes importados", { exact: true }).waitFor();
await page.locator(".recharts-pie").waitFor();
await page.screenshot({
  path: "/tmp/smartcampus-desktop.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "/tmp/smartcampus-mobile.png",
  fullPage: true,
  animations: "disabled",
});
await browser.close();
