// Хостинг (S1.12, ADR 0005): с COEP require-corp чужие ресурсы без CORP не загрузятся,
// поэтому страницы берут всё только со своего origin. Сами заголовки отдаёт Cloudflare (public/_headers), не astro preview.
import { expect, test } from "@playwright/test";
import { layoutPages } from "./support";

for (const [name, path] of Object.entries(layoutPages)) {
  test(`${name}: все запросы на свой origin`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.protocol !== "data:" && url.protocol !== "blob:" && url.origin !== origin) foreign.push(req.url());
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    expect(foreign).toEqual([]);
  });
}
