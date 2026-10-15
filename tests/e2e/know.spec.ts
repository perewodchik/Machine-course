// Галочка «знаю» (S2.04): все чекбоксы урока синхронны, счётчики в шапке, модулях и на главной, уроки ★ не в счётчике,
// итоговая проверка ставит отметку сама, прогресс переживает перезагрузку и переносится файлом. axe — в layout.spec.ts.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { layoutPages } from "./support";

const I8 = "Знаю: I.8 Ортогональность и проекции";

async function toc(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole("button", { name: "Оглавление курса" }).click();
  const nav = page.getByRole("navigation", { name: "Оглавление курса" });
  const head = nav.locator("button[aria-controls='toc-linear-algebra']");
  if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
  return nav;
}

test("галочка в оглавлении ставит галочку в «Опирается на» и меняет счётчики", async ({ page }, info) => {
  await page.goto(layoutPages.demo);
  const known = page.locator(".header-progress [data-known-total]").first();
  await expect(known).toHaveText("0");
  const nav = await toc(page, info.project.name === "mobile");
  await nav.getByRole("checkbox", { name: I8 }).check();
  if (info.project.name === "mobile") await page.keyboard.press("Escape");
  await expect(page.locator(".prereqs").getByRole("checkbox", { name: I8 })).toBeChecked();
  await expect(known).toHaveText("1");
  await expect(page.locator(".toc__part:has(#toc-linear-algebra) [data-known-count]").first()).toHaveText("1");
  // после перезагрузки отметка на месте
  await page.reload();
  await expect(page.locator(".prereqs").getByRole("checkbox", { name: I8 })).toBeChecked();
  await expect(page.locator(".header-progress [data-known-total]").first()).toHaveText("1");
  // снять можно всегда
  await page.locator(".prereqs").getByRole("checkbox", { name: I8 }).uncheck();
  await expect(page.locator(".header-progress [data-known-total]").first()).toHaveText("0");
});

test("урок ★ отмечается, но в счётчик не входит; модуль целиком — зелёная галочка", async ({ page }) => {
  await page.goto(layoutPages.course);
  const known = page.locator(".header-progress [data-known-total]").first();
  await page.getByRole("checkbox", { name: /^Знаю: II\.9 .*★$/ }).check();
  await expect(known).toHaveText("0");
  await page.getByRole("checkbox", { name: /^Знаю: V\.1 / }).check();
  await page.getByRole("checkbox", { name: /^Знаю: V\.2 / }).check();
  await expect(known).toHaveText("2");
  await page.goto(layoutPages.demo);
  const part = page.locator(".toc__part:has(#toc-bridge)");
  await expect(part.locator("[data-module-done]")).not.toHaveAttribute("hidden", "");
  await expect(part.locator(".toc__part-head .count")).toHaveAttribute("hidden", "");
  await page.goto("/");
  await expect(page.locator(".course-progress").first()).toContainText(/Знаю 2 из\s52 уроков/);
});

test("верная итоговая проверка урока ставит галочку сама", async ({ page }) => {
  await page.goto(layoutPages.demo);
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.slope3").make(1);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.getByRole("status")).toContainText("Урок отмечен: «знаю».");
  await expect(page.getByRole("checkbox", { name: "Знаю эту тему" })).toBeChecked();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:marks") ?? "{}"));
  expect(stored.marks["foundations/bridge/linear-regression"]).toMatchObject({ known: true, by: "lesson-check" });
});

test("прогресс сохраняется в файл и загружается из него", async ({ page }, info) => {
  await page.goto(layoutPages.course);
  await page.getByRole("checkbox", { name: /^Знаю: I\.3 / }).check();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Сохранить прогресс" }).click()]);
  const path = info.outputPath("progress.json");
  await download.saveAs(path);
  expect(JSON.parse(readFileSync(path, "utf8"))).toMatchObject({ schemaVersion: 2 });
  // чистый браузер: отметок нет, загружаем файл
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Знаю: I\.3 / })).not.toBeChecked();
  // буфером, а не путём: Playwright не передаёт файл из папки с кириллицей в имени (папка теста названа по-русски)
  await page.locator("[data-marks-import]").setInputFiles({ name: "progress.json", mimeType: "application/json", buffer: readFileSync(path) });
  await expect(page.locator("[data-marks-status]")).toHaveText("Загружено отметок: 1.");
  await expect(page.getByRole("checkbox", { name: /^Знаю: I\.3 / })).toBeChecked();
  // чужой файл — понятная ошибка
  await page.locator("[data-marks-import]").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from("{не json") });
  await expect(page.locator("[data-marks-status]")).toContainText("не читается как JSON");
});
