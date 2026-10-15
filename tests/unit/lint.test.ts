// Линтеры ловят нарушения правил: на каждое правило — фикстура в tests/fixtures/lint (S1.04).
import path from "node:path";
import { ESLint } from "eslint";
import stylelint from "stylelint";
import { beforeAll, describe, expect, it } from "vitest";
import stylelintConfig from "../../stylelint.config.js";

const root = path.resolve(import.meta.dirname, "../..");
const fx = (p: string) => path.join(root, "tests/fixtures/lint/src", p);

describe("ESLint", () => {
  let rules: Map<string, string[]>;

  beforeAll(async () => {
    const eslint = new ESLint({ cwd: root, ignore: false });
    const results = await eslint.lintFiles([path.join(root, "tests/fixtures/lint/src")]);
    rules = new Map(results.map((r) => [path.relative(fx(""), r.filePath), r.messages.map((m) => m.ruleId ?? "")]));
  }, 60_000);

  const expectRule = (file: string, rule: string) => expect(rules.get(file)).toContain(rule);
  const expectClean = (file: string) => expect(rules.get(file)).toEqual([]);

  it("lib/math не зависит от проекта", () => expectRule("lib/math/bad-imports-state.ts", "boundaries/dependencies"));
  it("дизайн-система не зависит от проекта", () => expectRule("design-system/primitives/bad-imports-lib.ts", "boundaries/dependencies"));
  it("виджет не импортирует другой виджет", () => expectRule("widgets/beta/bad-imports-other-widget.ts", "boundaries/dependencies"));
  it("игра берёт у виджета только модель", () => {
    expectRule("games/puzzle/bad-imports-widget-view.ts", "boundaries/dependencies");
    expectClean("games/puzzle/ok-imports-model.ts");
  });
  it("клиентский код не импортирует сборочные модули, кроме типов", () => {
    expectRule("client/bad-imports-build.ts", "boundaries/dependencies");
    expectClean("client/ok-type-import-build.ts");
  });
  it("разрешённые зависимости не ругаются", () => {
    expectClean("widgets/beta/ok-imports-kit.ts");
    expectClean("lib/math/ok-pure.ts");
  });
  it("классы Tailwind — только из темы", () => {
    expectRule("components/BadPalette.astro", "better-tailwindcss/no-restricted-classes");
    expectClean("components/OkTokens.astro");
  });
  it("TypeScript: any запрещён", () => expectRule("lib/math/bad-any.ts", "@typescript-eslint/no-explicit-any"));
});

describe("Stylelint", () => {
  const lint = async (file: string) => {
    const { results } = await stylelint.lint({ files: [fx(file)], config: { ...stylelintConfig, ignoreFiles: [] }, cwd: root });
    return results[0].warnings.map((w) => w.rule);
  };

  it("сырые цвета, градиенты и тени вне токенов запрещены", async () => {
    const found = await lint("styles/bad-raw-colors.css");
    expect(found).toEqual(expect.arrayContaining(["color-no-hex", "function-disallowed-list", "declaration-property-value-allowed-list"]));
  });

  it("стили на токенах проходят", async () => {
    expect(await lint("styles/ok-tokens.css")).toEqual([]);
  });
});
