// Карта готовности (/ready/, S5.02): итог по курсу пересчитывается от галочек «знаю», отметка общая для курсов,
// задачи урока V.2 по фрагментам курса попадают в сводку; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("карта готовности: галочки дают «готов», V.2 считается по первой попытке", async ({ page }) => {
  await page.goto("/ready/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Готовность к курсам ML");
  const llm = page.locator("[data-ready]").filter({ has: page.getByRole("heading", { name: "Языковые модели и LLM" }) });
  await expect(llm.locator("[data-ready-verdict]")).toHaveText("Освежить 2 урока из 2.");
  for (const box of await llm.locator("input[data-know]").all()) await box.check();
  await expect(llm.locator("[data-ready-verdict]")).toHaveText("Готов: отмечены все нужные уроки — 2.");
  // I.2 нужен и «Классическим методам»: отметка общая
  const classic = page.locator("[data-ready]").filter({ has: page.getByRole("heading", { name: /Классические методы/ }) });
  await expect(classic.locator("[data-ready-verdict]")).toHaveText("Освежить 8 уроков из 9.");
  await expectNoAxeViolations(page);

  // задача V.2 по PCA решена неверно с первой попытки — сводка «Без учителя»
  await page.goto("/foundations/bridge/math-in-ml/");
  const pca = page.locator("[data-exercise][data-item='f.pca-eigen:error:2']");
  await pca.locator("[data-option]").filter({ hasText: "Строка 1" }).click();
  await page.goto("/ready/");
  const uns = page.locator("[data-ready]").filter({ has: page.getByRole("heading", { name: /Обучение без учителя/ }) });
  await expect(uns.locator("[data-ready-v2]")).toHaveText("Урок V.2: с первой попытки верно 0 из 1 задачи по этому курсу.");
});
