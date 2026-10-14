// Раскладка: шапка, оглавление, поля, тема (S1.05). Критерии — docs/implementation/PLAN.md, S1.05.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, layoutPages, setMode } from "./support";

const isDesktop = (name: string) => name === "desktop";

test.describe("нет горизонтальной прокрутки", () => {
  for (const [name, path] of Object.entries(layoutPages)) {
    test(name, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("поля", () => {
  test("широкие блоки не заходят за линию полей, заметки — за ней", async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), "поля справа — только на широком экране");
    await page.goto(layoutPages.demo);
    const m = await page.evaluate(() => {
      const marginLine = document.querySelector<HTMLElement>(".margin-line")!;
      const line = marginLine.getBoundingClientRect().left;
      const right = (sel: string) => [...document.querySelectorAll(sel)].map((el) => el.getBoundingClientRect().right);
      const left = (sel: string) => [...document.querySelectorAll(sel)].map((el) => el.getBoundingClientRect().left);
      return { display: getComputedStyle(marginLine).display, line, wide: right(".article > .wide"), text: right(".article > p"), notes: left(".article > .note") };
    });
    expect(m.display).not.toBe("none");
    expect(m.wide.length).toBeGreaterThan(0);
    for (const r of [...m.wide, ...m.text]) expect(r).toBeLessThanOrEqual(m.line + 0.5);
    expect(m.notes.length).toBeGreaterThan(0);
    for (const l of m.notes) expect(l).toBeGreaterThan(m.line);
  });

  test("при скрытых полях колонка по центру, широкие блоки шире текста", async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), "центрирование между оглавлением и краем — на широком экране");
    await setMode(page, { margins: "hidden" });
    await page.goto(layoutPages.demo);
    const m = await page.evaluate(() => {
      const wrap = document.querySelector<HTMLElement>(".article-wrap")!;
      const cs = getComputedStyle(wrap);
      const w = wrap.getBoundingClientRect();
      const wrapCenter = (w.left + parseFloat(cs.paddingLeft) + w.right - parseFloat(cs.paddingRight)) / 2;
      const center = (el: Element) => {
        const r = el.getBoundingClientRect();
        return (r.left + r.right) / 2;
      };
      const p = document.querySelector(".article > p")!;
      const wide = document.querySelector(".article > .wide")!;
      return {
        wrapCenter,
        text: center(p),
        wide: center(wide),
        textWidth: p.getBoundingClientRect().width,
        wideWidth: wide.getBoundingClientRect().width,
        line: getComputedStyle(document.querySelector(".margin-line")!).display,
      };
    });
    expect(Math.abs(m.text - m.wrapCenter)).toBeLessThan(1);
    expect(Math.abs(m.wide - m.wrapCenter)).toBeLessThan(1);
    expect(m.wideWidth).toBeGreaterThan(m.textWidth);
    expect(m.line).toBe("none");
  });

  test("кнопка «Скрыть поля» сворачивает заметки и запоминает выбор", async ({ page }) => {
    await page.goto(layoutPages.demo);
    const toggle = page.getByRole("button", { name: "Скрыть поля" });
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-margins", "hidden");
    await expect(page.getByRole("button", { name: "Показать поля" })).toBeVisible();
    const note = page.locator(".article > .note").nth(1);
    await expect(note.locator(".note__body")).toBeHidden();
    const label = note.getByRole("button", { name: "Термин" });
    await expect(label).toHaveAttribute("aria-expanded", "false");
    await label.press("Enter");
    await expect(note.locator(".note__body")).toBeVisible();
    await expect(label).toHaveAttribute("aria-expanded", "true");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-margins", "hidden");
    await page.getByRole("button", { name: "Показать поля" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-margins", "visible");
    await expect(note.locator(".note__body")).toBeVisible();
  });
});

test.describe("оглавление", () => {
  test("модуль текущего урока раскрыт, урок отмечен как текущий", async ({ page }, info) => {
    await page.goto(layoutPages.demo);
    if (!isDesktop(info.project.name)) await page.getByRole("button", { name: "Оглавление курса" }).click();
    const toc = page.getByRole("navigation", { name: "Оглавление курса" });
    await expect(toc.locator("a[aria-current='page']")).toHaveText(/V\.1/);
    await expect(toc.locator("#toc-bridge")).toBeVisible();
    await expect(toc.locator("#toc-start")).toBeHidden();
    const head = toc.locator("button[aria-controls='toc-start']");
    await head.click();
    await expect(head).toHaveAttribute("aria-expanded", "true");
    await expect(toc.locator("#toc-start")).toBeVisible();
    await expect(toc.getByRole("checkbox", { name: "Знаю: 0.1 Регрессия руками за 15 минут" })).toBeVisible();
  });

  test("на 390 px панель открывается под шапкой и закрывается Escape", async ({ page }, info) => {
    test.skip(isDesktop(info.project.name), "выдвижная панель — только на узком экране");
    await page.goto(layoutPages.demo);
    const toc = page.locator("#toc");
    const toggle = page.getByRole("button", { name: "Оглавление курса" });
    await expect(toc).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toc).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const header = await page.locator(".site-header").boundingBox();
    const panel = await toc.boundingBox();
    expect(panel!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    expect(panel!.x).toBe(0);
    expect(panel!.width).toBe(390);
    // фокус — в панели на текущем уроке; текст под панелью недоступен
    await expect(toc.locator("a[aria-current='page']")).toBeFocused();
    await expect(page.locator("#content")).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(toc).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(page.locator("#content")).not.toHaveAttribute("inert", "");
  });

  test("первая остановка Tab — «К содержимому», ссылка ведёт к тексту", async ({ page }) => {
    await page.goto(layoutPages.demo);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "К содержимому" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#content$/);
  });

  test("на широком экране кнопки оглавления нет", async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), "только широкий экран");
    await page.goto(layoutPages.demo);
    await expect(page.getByRole("button", { name: "Оглавление курса" })).toBeHidden();
    await expect(page.locator("#toc")).toBeVisible();
  });
});

test.describe("тема", () => {
  test("тема из localStorage стоит до отрисовки страницы", async ({ page }) => {
    await setMode(page, { theme: "dark" });
    // фиксируем тему в момент, когда парсер дошёл до <body>: раньше этого ничего не рисуется
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        document.documentElement.setAttribute("data-theme-at-body", document.documentElement.dataset.theme ?? "none");
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(layoutPages.demo);
    await expect(page.locator("html")).toHaveAttribute("data-theme-at-body", "dark");
  });

  test("переключатель меняет тему и запоминает её", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(layoutPages.course);
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const light = await bg();
    const toggle = page.getByRole("button", { name: "Тёмная тема" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await bg()).not.toBe(light);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await bg()).not.toBe(light);
  });
});

test.describe("шапка", () => {
  test("показывает курс и прогресс «знаю» без уроков ★", async ({ page }) => {
    await page.goto(layoutPages.lesson);
    await expect(page.locator(".course-name")).toHaveText("Математика для машинного обучения");
    await expect(page.locator(".header-progress [data-known-of]")).toHaveText("52");
    await expect(page.getByRole("link", { name: "Курсы ML" })).toHaveAttribute("href", "/");
  });
});

test.describe("доступность (axe)", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const [name, path] of Object.entries(layoutPages)) {
      test(`${name}, тема ${theme}`, async ({ page }) => {
        await setMode(page, { theme });
        await page.goto(path);
        await expectNoAxeViolations(page);
      });
    }
    test(`демо-урок со скрытыми полями, тема ${theme}`, async ({ page }) => {
      await setMode(page, { theme, margins: "hidden" });
      await page.goto(layoutPages.demo);
      await expectNoAxeViolations(page);
    });
  }

  test("открытое оглавление на узком экране", async ({ page }, info) => {
    test.skip(isDesktop(info.project.name), "только узкий экран");
    await page.goto(layoutPages.demo);
    await page.getByRole("button", { name: "Оглавление курса" }).click();
    await expectNoAxeViolations(page);
  });
});
