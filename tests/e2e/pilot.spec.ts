// Пилот (S2.10): задания «до урока» только с ?pilot=1, микроопрос пишет ответ в журнал, шаги вывода — тоже,
// «Скачать отчёт» отдаёт файл, который читает сводка (src/lib/pilot/report.ts).
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parseReport, summarize } from "../../src/lib/pilot/report";
import { layoutPages } from "./support";

const url = layoutPages.lesson;
const journal = (page: import("@playwright/test").Page) => page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));

test("режим пилота: задание «до урока» видно только с ?pilot=1 и выключается ?pilot=0", async ({ page }) => {
  await page.goto(url);
  const pre = page.locator(".pilot");
  await expect(pre).toBeHidden();
  await page.goto(`${url}?pilot=1`);
  await expect(pre).toBeVisible();
  await expect(pre.locator("[data-variant]:not([hidden]) .block__title, .block__title").first()).toHaveText(/^До урока\./);
  await page.goto(url); // флаг запомнился
  await expect(pre).toBeVisible();
  await page.goto(`${url}?pilot=0`);
  await expect(pre).toBeHidden();
});

test("микроопрос и шаги вывода пишутся в журнал; отчёт скачивается и читается сводкой", async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-formula="f.normal-equations"]').getByRole("button", { name: "Следующий шаг" }).click();
  const survey = page.locator("[data-survey]");
  await survey.getByRole("button", { name: "Сохранить ответ" }).click();
  await expect(survey.getByRole("radio").first()).toBeFocused(); // required: браузер просит выбрать оценку
  await survey.getByRole("radio", { name: /^4/ }).check();
  await survey.getByRole("combobox", { name: "Где споткнулись?" }).selectOption("Способ 3. Максимум правдоподобия");
  await survey.getByRole("textbox", { name: /Комментарий/ }).fill("Не понял, откуда квадрат");
  await survey.getByRole("button", { name: "Сохранить ответ" }).click();
  await expect(survey.getByRole("status")).toHaveText("Спасибо! Ответ сохранён в этом браузере.");

  const events = await journal(page);
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "step", formula: "f.normal-equations", step: 1, lesson: "foundations/bridge/linear-regression" }),
      expect.objectContaining({ type: "survey", clarity: 4, stuck: "Способ 3. Максимум правдоподобия", comment: "Не понял, откуда квадрат" }),
    ]),
  );

  const [download] = await Promise.all([page.waitForEvent("download"), survey.getByRole("button", { name: "Скачать отчёт" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^mlf-otchet-\d{4}-\d{2}-\d{2}\.json$/);
  const report = parseReport(readFileSync((await download.path())!, "utf8"));
  const summary = summarize([report]);
  expect(summary.survey[0]).toMatchObject({ lesson: "foundations/bridge/linear-regression", answers: 1, clarity: 4 });
  expect(summary.steps[0]).toMatchObject({ formula: "f.normal-equations", reached: [1, 1] });
});
