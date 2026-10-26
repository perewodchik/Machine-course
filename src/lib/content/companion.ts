// Компаньон к конспекту CS229 (S5.03, идея B3): страница на раздел конспекта — уроки всех курсов, где раздел назван в
// поле cs229, формулы реестра со ссылкой на раздел и разминка из итоговых проверок уроков математики. Чистая логика.
import type { LessonEntry } from "./catalog";
import type { Formula } from "./types";

export interface Section {
  name: string;
  slug: string;
  lessons: LessonEntry[];
}

/** «Classification and logistic regression» → «classification-and-logistic-regression». */
export const sectionSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Разделы в порядке первого появления (порядок курсов и уроков), у каждого — уроки, которые его называют. */
export function sections(lessons: readonly LessonEntry[]): Section[] {
  const map = new Map<string, Section>();
  for (const l of lessons)
    for (const name of l.cs229 ?? []) {
      const s = map.get(name) ?? { name, slug: sectionSlug(name), lessons: [] };
      s.lessons.push(l);
      map.set(name, s);
    }
  const slugs = new Set<string>();
  for (const s of map.values()) {
    if (slugs.has(s.slug)) throw new Error(`разделы CS229 с одинаковым адресом: ${s.slug}`);
    slugs.add(s.slug);
  }
  return [...map.values()];
}

/** Формулы, у которых раздел ссылки CS229 — этот раздел или его подраздел («Linear regression / The normal equations»). */
export const formulasFor = (name: string, formulas: readonly Formula[]) =>
  formulas.filter((f) => (f.cs229 ?? []).some((r) => r.section.split(" / ")[0]!.trim() === name));

/** Генератор итоговой проверки урока: <Exercise gen="…" … final />; задачи без генератора в разминку не идут. */
export function finalGen(mdx: string): string | undefined {
  for (const m of mdx.matchAll(/<Exercise\b([^>]*?)\/>/gs)) if (/\bfinal\b/.test(m[1]!)) return /\bgen="([^"]+)"/.exec(m[1]!)?.[1];
  return undefined;
}
