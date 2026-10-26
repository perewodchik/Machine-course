// Шпаргалки (S5.04): формулы и типичные ошибки извлекаются из MDX урока.
import { describe, expect, it } from "vitest";
import { lessonFormulas, lessonPitfalls } from "./cheatsheet";

const mdx = `Текст.

<Formula formula="f.a" n={1} />

<Block kind="pitfall">

Первая строка
продолжается.

Второй абзац.

</Block>

<Formula formula="f.b" n={2} />
<Formula formula="f.a" n={3} />

<Block kind="pitfall" title="Ловушка">

Ещё одна.

</Block>`;

describe("шпаргалка урока", () => {
  it("формулы — по порядку и без повторов", () => expect(lessonFormulas(mdx)).toEqual(["f.a", "f.b"]));
  it("типичные ошибки — абзацы блока одной строкой", () => expect(lessonPitfalls(mdx)).toEqual(["Первая строка продолжается. Второй абзац.", "Ещё одна."]));
});
