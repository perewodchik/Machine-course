// Данные шпаргалок (S5.04): по модулю курса математики и по разделу CS229 — уроки с формулами и типичными ошибками.
// Только сборка: читает MDX уроков и реестр формул.
import { existsSync, readFileSync } from "node:fs";
import { lessonFormulas, lessonPitfalls } from "./cheatsheet";
import { loadCourse } from "./collections";
import { companion } from "./companion-data";
import type { LessonEntry } from "./catalog";
import { ru } from "./catalog";
import { loadRegistry } from "./registry";

export interface SheetLesson {
  key: string;
  number: string;
  title: string;
  href: string;
  formulas: { id: string; title: string; statement: string; pitfalls: string[] }[];
  pitfalls: string[];
}

export interface Sheet {
  id: string;
  title: string;
  kind: "module" | "cs229";
  lessons: SheetLesson[];
}

async function sheetLessons(lessons: readonly LessonEntry[]): Promise<SheetLesson[]> {
  const reg = await loadRegistry();
  return lessons.flatMap((l) => {
    const path = `content/courses/${l.course}/${l.module}/${l.slug}.mdx`;
    if (!existsSync(path)) return [];
    const mdx = readFileSync(path, "utf8");
    const formulas = lessonFormulas(mdx).flatMap((id) => {
      const f = reg.formulas.get(id);
      return f ? [{ id, title: f.title.ru, statement: f.statement, pitfalls: (f.pitfalls ?? []).map(ru) }] : [];
    });
    // короткие ошибки формул и развёрнутые блоки урока часто об одном — блоки урока берём, только если у формул ошибок нет
    const pitfalls = formulas.some((f) => f.pitfalls.length) ? [] : lessonPitfalls(mdx);
    return formulas.length || pitfalls.length ? [{ key: l.key, number: l.number, title: l.title, href: l.href, formulas, pitfalls }] : [];
  });
}

export async function sheets(): Promise<Sheet[]> {
  const math = await loadCourse("foundations");
  const modules = await Promise.all(
    math.modules.map(async (m) => ({ id: m.id, title: `Модуль ${m.number}. ${m.title}`, kind: "module" as const, lessons: await sheetLessons(m.lessons) })),
  );
  const sections = await Promise.all(
    (await companion()).map(async (s) => ({ id: `cs229-${s.slug}`, title: `CS229: ${s.name}`, kind: "cs229" as const, lessons: await sheetLessons(s.lessons.filter((l) => l.course === "foundations")) })),
  );
  return [...modules, ...sections].filter((s) => s.lessons.length);
}
