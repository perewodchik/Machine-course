// Схемы Zod для content/: повторяют типы из ./types.ts (источник истины).
// Используются коллекциями Astro (src/content.config.ts), тестами схем и валидатором контента.
// Без astro:content — модуль импортируется и из Vitest.
import { z } from "astro/zod";

// Сообщения об ошибках по-русски: их читают авторы контента
z.config(z.locales.ru());

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slug = z.string().regex(kebab, "латиница в нижнем регистре, цифры и дефисы, например «normal-equations»");
export const conceptId = z
  .string()
  .regex(/^(?:nota|la|calc|prob|stat|ml)\.[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID понятия: «раздел.имя», раздел — nota, la, calc, prob, stat или ml");
export const ruleId = z.string().regex(/^rule\.[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID правила начинается с «rule.»");
export const formulaId = z.string().regex(/^f\.[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID формулы начинается с «f.»");
export const lessonKey = z
  .string()
  .regex(/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/, "ключ урока: «<курс>/<модуль>/<slug>»");

/** TeX: «"\theta"» в двойных кавычках YAML превращается в табуляцию и «heta» — такие управляющие символы запрещены. */
export const tex = z
  .string()
  .min(1)
  .refine((v) => !/[\t\f\b\v\r]/.test(v), "в TeX управляющий символ (\\t, \\f, \\b…): похоже, TeX в двойных кавычках — пишите в одинарных '…' или блоком |");

export const localized = z.union([z.string().min(1), z.strictObject({ ru: z.string().min(1), en: z.string().optional() })]);
const titleRuEn = z.strictObject({ ru: z.string().min(1), en: z.string().optional() });

export const cs229Ref = z.strictObject({
  edition: z.string().min(1),
  section: z.string().min(1),
});

export const symbolSpec = z.strictObject({
  name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, "имя символа — идентификатор Python: латиница, цифры, «_»"),
  tex,
  meaning: localized.optional(),
  shape: z.array(z.union([z.string(), z.number().int().positive()])).optional(),
  role: z.enum(["data", "param", "target", "aux"]).optional(),
  sample: z.enum(["normal", "invertible", "spd", "positive"]).optional(),
});

export const check = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("identity"), lhs: z.string().min(1), rhs: z.string().min(1) }),
  z.strictObject({ kind: z.literal("gradient"), f: z.string().min(1), grad: z.string().min(1), wrt: z.string().min(1) }),
]);

export const stepCheck = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("same"), py: z.string().min(1) }),
  z.strictObject({ kind: z.literal("gradient"), py: z.string().min(1), wrt: z.string().min(1) }),
  z.strictObject({ kind: z.literal("stationary"), lhs: z.string().min(1), rhs: z.string().min(1) }),
  z.strictObject({ kind: z.literal("solution"), py: z.string().min(1), wrt: z.string().min(1) }),
]);

export const derivationStep = z.strictObject({
  goal: z.number().int().nonnegative(),
  tex,
  by: z.array(z.union([ruleId, conceptId])),
  note: localized.optional(),
  why: localized.optional(),
  check: stepCheck.optional(),
});

const formulaBase = {
  title: titleRuEn,
  statement: tex,
  symbols: z.array(symbolSpec),
  pitfall: localized.optional(),
};

export const rule = z.strictObject({
  id: ruleId,
  kind: z.literal("rule"),
  ...formulaBase,
  concept: conceptId,
  corollary: localized.optional(),
  checks: z.array(check).min(1, "у правила нужна хотя бы одна численная проверка"),
});

export const formula = z
  .strictObject({
    id: formulaId,
    kind: z.literal("formula"),
    ...formulaBase,
    dependsOn: z.strictObject({ concepts: z.array(conceptId), rules: z.array(ruleId) }),
    conditions: z.array(z.strictObject({ tex, why: localized, concept: conceptId.optional() })).optional(),
    derivation: z
      .strictObject({ plan: z.array(z.string().min(1)).min(1), steps: z.array(derivationStep).min(1) })
      .optional(),
    pitfalls: z.array(localized).optional(),
    cs229: z.array(cs229Ref).optional(),
    usedIn: z.array(z.string()).optional(),
  })
  .superRefine((f, ctx) => {
    const plan = f.derivation?.plan.length ?? 0;
    f.derivation?.steps.forEach((s, i) => {
      if (s.goal >= plan) {
        ctx.addIssue({
          code: "custom",
          path: ["derivation", "steps", i, "goal"],
          message: `подцель ${s.goal} не существует: в плане ${plan} подцели (нумерация с 0)`,
        });
      }
      if (!s.check) {
        ctx.addIssue({ code: "custom", path: ["derivation", "steps", i, "check"], message: "у шага вывода нужна численная проверка check" });
      }
    });
  });

export const concept = z.strictObject({
  id: conceptId,
  title: z.strictObject({ ru: z.string().min(1), en: z.string().min(1) }),
  summary: localized,
  lesson: slug,
  prerequisites: z.array(conceptId),
  core: z.boolean(),
  cs229: z.array(cs229Ref).optional(),
});

export const course = z.strictObject({
  id: slug,
  number: z.number().int().positive().optional(),
  title: localized,
  summary: localized,
  cs229Edition: z.string().min(1),
  requires: z.array(slug).optional(),
  throughline: z.string().optional(),
  modules: z.array(slug).min(1),
});

export const lessonRef = z.strictObject({
  slug,
  number: z.string().min(1),
  title: z.string().min(1),
  optional: z.boolean().optional(),
});

export const module = z.strictObject({
  id: slug,
  number: z.string().min(1),
  title: localized,
  hours: z.tuple([z.number().positive(), z.number().positive()]),
  lessons: z.array(lessonRef).min(1),
});

/** Frontmatter урока (MDX): docs/conventions/authoring.md, раздел «MDX». */
export const lessonFrontmatter = z.strictObject({
  id: slug,
  title: z.string().min(1),
  number: z.string().min(1),
  concepts: z.array(conceptId),
  minutes: z.number().int().positive(),
  /** Вводный абзац под заголовком («зачем»): текст с $…$, до строки «Знаю эту тему». */
  lead: z.string().min(1).optional(),
  cs229: z.array(cs229Ref).optional(),
  symbols: z.array(symbolSpec).optional(),
});

export const glossaryEntry = z.strictObject({
  id: slug,
  ru: z.string().min(1),
  en: z.string().min(1),
  note: localized.optional(),
});

/** content/redirects.yaml: старый ID или ключ → новый. Записи не удаляются. */
// Ключи словаря проверяются отдельно: у z.record сообщение о ключе безликое («Неверный ключ в record»)
const renames = (id: z.ZodType<string>) =>
  z.record(z.string(), id).superRefine((map, ctx) => {
    for (const key of Object.keys(map)) {
      const r = id.safeParse(key);
      if (!r.success) ctx.addIssue({ code: "custom", path: [key], message: `старое имя: ${r.error.issues[0]?.message}` });
    }
  });

export const redirects = z.strictObject({
  concepts: renames(conceptId).optional(),
  lessons: renames(lessonKey).optional(),
  formulas: renames(z.union([ruleId, formulaId])).optional(),
});
