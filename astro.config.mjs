// Конфигурация сайта курсов. Решения — docs/adr/0001-site-stack.md.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { rehypePlugins, remarkPlugins } from "./src/markdown/core/plugins.ts";

export default defineConfig({
  site: "https://example.invalid", // настоящий домен — после первого деплоя в Cloudflare (S1.13)
  integrations: [react(), mdx()],
  markdown: {
    // Явный unified (не Sätteri по умолчанию): remark-math, KaTeX и типограф из общего ядра src/markdown/core.
    // smartypants выключен: кавычки «ёлочки» ставит типограф, а не английские “лапки”.
    processor: unified({ remarkPlugins, rehypePlugins: [...rehypePlugins], gfm: true, smartypants: false }),
    // Блоки кода подсвечивает rehypeHighlightPython токенами дизайн-системы, а не Shiki
    syntaxHighlight: false,
  },
  // Те же COOP/COEP, что отдаёт Cloudflare (public/_headers): в dev и preview работает SharedArrayBuffer,
  // и «Стоп» в ячейке Python прерывает выполнение так же, как на сайте (S2.05).
  server: {
    headers: { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" },
  },
  vite: {
    plugins: [tailwindcss()],
    // MathLive (~800 КБ) и парсер формул (~420 КБ) — отдельные чанки, грузятся только на страницах с вводом формул
    build: { chunkSizeWarningLimit: 900 },
  },
});
