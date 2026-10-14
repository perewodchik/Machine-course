// Валидатор контента: npm run validate. Логика — src/lib/content/validate.ts, тесты — validate.test.ts.
import { validateContent } from "../src/lib/content/validate";

const { problems, stats } = validateContent(process.cwd());
const summary = `курсов ${stats.courses}, уроков ${stats.lessons} (текстов MDX ${stats.mdx}), понятий ${stats.concepts}, правил ${stats.rules}, формул ${stats.formulas}, TeX проверено ${stats.tex}`;
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\nКонтент: ошибок ${problems.length}. ${summary}.`);
  process.exit(1);
}
console.log(`Контент: ошибок нет. ${summary}.`);
