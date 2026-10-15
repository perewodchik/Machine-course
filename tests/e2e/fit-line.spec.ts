// Виджет «Подгонка прямой» (S2.02) на демо-уроке: числа совпадают с Python, крайние значения не выводят
// рисунок за оси, «Показать минимум» и «Сбросить», подсветка общая с формулой. axe — в layout.spec.ts.
import { expect, test, type Page } from "@playwright/test";
import { layoutPages } from "./support";

async function open(page: Page) {
  await page.goto(layoutPages.demo);
  const widget = page.locator(".fit-line");
  await widget.scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island", { has: widget })).not.toHaveAttribute("ssr", "");
  return widget;
}

test("начальные веса и J как в уроке: J(2.5, 0.25) = 5.23", async ({ page }) => {
  const w = await open(page);
  await expect(w.getByRole("slider", { name: "θ0" })).toHaveAttribute("aria-valuetext", "θ0 = 2.500");
  await expect(w.getByRole("slider", { name: "θ1" })).toHaveAttribute("aria-valuetext", "θ1 = 0.250");
  await expect(w.locator(".kit-readout__value")).toHaveText("5.23");
});

test("«Показать минимум» ведёт к θ* = (0.798, 0.548), «Сбросить» возвращает", async ({ page }) => {
  const w = await open(page);
  await w.getByRole("button", { name: "Показать минимум" }).click();
  await expect(w.getByRole("slider", { name: "θ0" })).toHaveAttribute("aria-valuetext", "θ0 = 0.798");
  await expect(w.getByRole("slider", { name: "θ1" })).toHaveAttribute("aria-valuetext", "θ1 = 0.548");
  await expect(w.locator(".kit-readout__value")).toHaveText("1.47");
  await w.getByRole("button", { name: "Сбросить" }).click();
  await expect(w.locator(".kit-readout__value")).toHaveText("5.23");
});

test("при крайних значениях ползунков ничего не выходит за оси", async ({ page }) => {
  const w = await open(page);
  const plot = w.locator("clipPath rect");
  const box = (await plot.boundingBox())!;
  for (const [t0, t1] of [["End", "End"], ["Home", "Home"], ["End", "Home"], ["Home", "End"]] as const) {
    await w.getByRole("slider", { name: "θ0" }).focus();
    await page.keyboard.press(t0);
    await w.getByRole("slider", { name: "θ1" }).focus();
    await page.keyboard.press(t1);
    // прямая и остатки — внутри группы с clipPath области графика
    await expect(w.locator("svg > g[clip-path] .kit-line")).toHaveCount(13);
    await expect(w.locator("svg > .kit-line, svg > g:not([clip-path]) .kit-line")).toHaveCount(0);
    // подписи (если видны) — внутри области графика
    for (const label of await w.locator("svg > g[clip-path] .kit-label").all()) {
      const b = (await label.boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(box.y - 1);
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 1);
    }
  }
});

test("наведение на θ в формуле подсвечивает прямую", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "наведение — только с мышью");
  const w = await open(page);
  await page.locator('[data-formula="f.normal-equations"] .formula-card__statement [data-sym="theta"] .sym').first().hover();
  await expect(w.locator("svg > g[clip-path] > .kit-line[data-sym='theta']")).toHaveClass(/is-lit/);
});
