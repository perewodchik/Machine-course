// Страница проекта (S7.03): этапы, порог, рубрика и ссылки на ноутбук; ссылка со страницы «Основ ML»; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("демонстрационный проект: этапы, рубрика, ссылки", async ({ page }) => {
  await page.goto("/ml-basics/");
  await page.getByRole("link", { name: "демонстрационный проект" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Демонстрационный проект: цена квартиры");
  await expect(page.locator(".project__stages li")).toHaveCount(5);
  await expect(page.locator(".project__rubric dt")).toHaveText(["Зачтено", "Хорошо", "Отлично"]);
  await expect(page.getByRole("link", { name: /Открыть в\s*Colab/ })).toHaveAttribute("href", /notebooks\/projects\/demo_apartments\.ipynb$/);
  await expectNoAxeViolations(page);
});
