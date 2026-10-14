// Конфигурация сайта курсов. Решения — docs/adr/0001-site-stack.md.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://example.invalid", // настоящий домен — при подключении Cloudflare Pages (S1.13)
  integrations: [react(), mdx()],
});
