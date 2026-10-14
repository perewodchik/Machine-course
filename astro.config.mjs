// Конфигурация сайта курсов. Решения — docs/adr/0001-site-stack.md.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { rehypePlugins, remarkPlugins } from "./src/markdown/core/plugins.ts";

export default defineConfig({
  site: "https://example.invalid", // настоящий домен — при подключении Cloudflare Pages (S1.13)
  integrations: [react(), mdx()],
  markdown: {
    // Явный unified (не Sätteri по умолчанию): remark-math, KaTeX и типограф из общего ядра src/markdown/core.
    // smartypants выключен: кавычки «ёлочки» ставит типограф, а не английские “лапки”.
    processor: unified({ remarkPlugins, rehypePlugins: [...rehypePlugins], gfm: true, smartypants: false }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
