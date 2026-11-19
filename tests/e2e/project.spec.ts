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

// Проекты P1 и P2 (S7.05, S7.06): ссылка со страницы курса, этапы, ноутбук, длительность в часах
for (const p of [
  { link: "P1 «Цена квартиры»", h1: "Проект P1. Цена квартиры", nb: "p1_house_prices", hours: "7 часов" },
  { link: /P2 «Отклик на\s*предложение банка»/, h1: "Проект P2. Отклик на предложение банка", nb: "p2_bank_marketing", hours: "9 часов" },
]) {
  test(`${p.h1}: этапы, рубрика, ссылки`, async ({ page }) => {
    await page.goto("/ml-basics/");
    await page.getByRole("link", { name: p.link }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
    await expect(page.locator(".lead")).toContainText(`Около ${p.hours.replace(" ", " ")}`);
    await expect(page.locator(".project__stages li")).toHaveCount(5);
    await expect(page.getByRole("link", { name: /Открыть в\s*Colab/ })).toHaveAttribute("href", new RegExp(`notebooks/projects/${p.nb}\\.ipynb$`));
    await expectNoAxeViolations(page);
  });
}
