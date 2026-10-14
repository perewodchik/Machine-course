// ESLint (flat config). Правила слоёв — src/README.md, «Правила зависимостей».
// Фикстуры-нарушения в tests/fixtures/lint проверяет tests/unit/lint.test.ts.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import boundaries from "eslint-plugin-boundaries";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import globals from "globals";

// Слои кода. Шаблоны начинаются с **/src, чтобы те же правила работали на фикстурах в tests/fixtures/lint/src.
const elements = [
  { type: "ds-primitives", pattern: "**/src/design-system/primitives" },
  { type: "design-system", pattern: "**/src/design-system" },
  { type: "kit", pattern: "**/src/widgets/_kit" },
  { type: "widget", pattern: "**/src/widgets/*", capture: ["root", "name"] },
  { type: "engine", pattern: "**/src/games/_engine" },
  { type: "game", pattern: "**/src/games/*", capture: ["root", "name"] },
  { type: "python", pattern: "**/src/python" },
  { type: "lib-math", pattern: "**/src/lib/math" },
  { type: "lib-state", pattern: "**/src/lib/state" },
  { type: "lib-build", pattern: ["**/src/lib/content", "**/src/lib/katex", "**/src/markdown"] },
  { type: "lib", pattern: "**/src/lib/*" },
  { type: "client", pattern: "**/src/client" },
  { type: "components", pattern: "**/src/components" },
  { type: "styles", pattern: "**/src/styles" },
  { type: "app", pattern: ["**/src/pages", "**/src/layouts"] },
];


const anyOf = (...types) => ({ element: { types: { anyOf: types } } });
const projectTypes = elements.map((e) => e.type);
const except = (...allowed) => anyOf(...projectTypes.filter((t) => !allowed.includes(t)));

const layerPolicies = [
  // lib/math — чистая математика: ничего из проекта
  { from: anyOf("lib-math"), disallow: { to: except("lib-math") } },
  // дизайн-система ни от чего в проекте не зависит
  { from: anyOf("design-system", "ds-primitives"), disallow: { to: except("design-system", "ds-primitives") } },
  // виджет: только _kit, lib/math, lib/state, примитивы дизайн-системы и свои файлы
  { from: anyOf("widget"), disallow: { to: except("kit", "lib-math", "lib-state", "ds-primitives", "widget") } },
  // виджет не импортирует другие виджеты
  {
    from: anyOf("widget"),
    disallow: { to: { element: { type: "widget", captured: { name: "!{{ from.element.captured.name }}" } } } },
  },
  // игра: движок, _kit, lib/math, lib/state и только модели виджетов (model.ts)
  { from: anyOf("game"), disallow: { to: except("engine", "kit", "widget", "lib-math", "lib-state", "game") } },
  { from: anyOf("game"), disallow: { to: { element: { type: "widget" }, file: { path: "**/!(model).{ts,tsx}" } } } },
  // Python в браузере: только состояние и примитивы
  { from: anyOf("python"), disallow: { to: except("python", "lib-state", "ds-primitives") } },
  // сборочные модули (граф, KaTeX, Markdown) не попадают в браузерный код
  { from: anyOf("client", "widget", "game", "engine", "kit", "python"), disallow: { to: anyOf("lib-build") } },
];

export default tseslint.config(
  {
    ignores: [
      "dist/**", ".astro/**", "node_modules/**", ".venv/**",
      "prototype/**", "code/**", "notebooks/**", "docs/**",
      "tests/fixtures/**", "test-results/**", "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.{ts,tsx,astro,js,mjs}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": elements,
      "import/resolver": { node: { extensions: [".ts", ".tsx", ".js", ".mjs", ".astro"] } },
    },
    rules: {
      "boundaries/dependencies": ["error", { default: "allow", policies: layerPolicies }],
    },
  },
  {
    // .tsx (острова React) не импортируют сборочные модули
    files: ["**/*.tsx"],
    plugins: { boundaries },
    rules: {
      "boundaries/dependencies": ["error", { default: "allow", policies: [...layerPolicies, { disallow: { to: anyOf("lib-build") } }] }],
    },
  },
  {
    // Классы Tailwind — только из нашей темы: дефолтная палитра, тени и градиенты запрещены
    files: ["**/*.{astro,tsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: { "better-tailwindcss": { entryPoint: "src/styles/global.css" } },
    rules: {
      "better-tailwindcss/no-restricted-classes": ["error", {
        restrict: [
          {
            pattern: "^(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|accent|caret|divide|placeholder|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\\d+)?(?:\\/\\d+)?$",
            message: "Цвета — только из токенов дизайн-системы (bg-paper, text-ink, text-pen…), не из дефолтной палитры Tailwind.",
          },
          { pattern: "^(?:[a-z-]+:)*shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)$", message: "Тени — только токен shadow-popover." },
          { pattern: "^(?:[a-z-]+:)*bg-(?:linear|radial|conic|gradient)-.*$", message: "Градиенты в интерфейсе запрещены дизайн-системой." },
        ],
      }],
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
    },
  },
);
