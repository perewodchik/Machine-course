// Перетаскивание на рисунке (S7.07): точка запроса LWR в уроке 1.3, граница решений в 1.4, стрелки θⱼ в 1.5.
// Тянем ручку мышью — меняется тот же параметр, что у ползунка (ползунок — путь для клавиатуры и скринридера).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

async function drag(page: Page, handle: Locator, dx: number, dy: number) {
  await handle.scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island[ssr]:has(.kit-handle)")).toHaveCount(0); // остров client:visible ожил
  const box = (await handle.locator(".kit-handle__ring").boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) await page.mouse.move(x + (dx * i) / 5, y + (dy * i) / 5);
  await page.mouse.up();
}

const value = (slider: Locator) => slider.inputValue().then(Number);

/** Прокрутить к виджету и дождаться, пока его остров client:visible оживёт: до этого клики по кнопкам теряются. */
async function hydrated(page: Page, selector: string): Promise<Locator> {
  const w = page.locator(selector).first();
  await w.scrollIntoViewIfNeeded();
  await expect(page.locator(`astro-island[ssr]:has(${selector})`)).toHaveCount(0);
  return w;
}

test("1.3: точку запроса LWR тянут по рисунку", async ({ page }) => {
  await page.goto("/ml-basics/linear-models/features-lwr/");
  const w = await hydrated(page, ".flexibility");
  await w.getByRole("button", { name: "локально взвешенная" }).click();
  const q = w.getByRole("slider", { name: "запрос x" });
  const before = await value(q);
  await drag(page, w.locator(".kit-handle"), 120, 0);
  await expect.poll(() => value(q)).toBeGreaterThan(before);
  await expectNoAxeViolations(page);
});

test("1.4: границу решений тянут за точку на ней", async ({ page }) => {
  await page.goto("/ml-basics/linear-models/logistic-regression/");
  const w = await hydrated(page, ".logistic-plane");
  const phi = w.getByRole("slider", { name: "направление, °" });
  const before = await value(phi);
  await expect(w.locator(".kit-handle")).toHaveCount(2);
  await drag(page, w.locator(".kit-handle").first(), 90, 0);
  await expect.poll(() => value(phi)).not.toBe(before);
});

test("1.5: конец стрелки θ₂ тянут — меняются направление и длина, выбран класс", async ({ page }) => {
  await page.goto("/ml-basics/linear-models/perceptron-softmax/");
  const w = await hydrated(page, ".class-regions");
  const before = await value(w.getByRole("slider", { name: "длина" }));
  await drag(page, w.locator(".kit-handle").nth(1), 60, 40);
  await expect(w.getByRole("button", { name: /θ₂/ })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => value(w.getByRole("slider", { name: "длина" }))).not.toBe(before);
});
