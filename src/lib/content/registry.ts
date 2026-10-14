// Реестр для компонентов урока (только сборка): формулы, правила, понятия и уроки по ID.
// Ссылки на понятия и правила ведут на урок, где понятие вводится (страниц понятий пока нет).
import { getCollection } from "astro:content";
import { loadCatalog } from "./collections";
import type { LessonEntry } from "./catalog";
import type { Concept, Formula, Rule } from "./types";

interface Registry {
  formulas: Map<string, Formula>;
  rules: Map<string, Rule>;
  concepts: Map<string, Concept>;
  lessonsByKey: Map<string, LessonEntry>;
  lessonsBySlug: Map<string, LessonEntry>;
  courseTitles: Map<string, string>;
}

let cached: Promise<Registry> | undefined;

export function loadRegistry(): Promise<Registry> {
  cached ??= (async () => {
    const catalog = await loadCatalog();
    const lessons = catalog.flatMap((c) => c.lessons);
    return {
      formulas: new Map((await getCollection("formulas")).map((e) => [e.id, e.data as Formula])),
      rules: new Map((await getCollection("rules")).map((e) => [e.id, e.data as Rule])),
      concepts: new Map((await getCollection("concepts")).map((e) => [e.id, e.data as Concept])),
      lessonsByKey: new Map(lessons.map((l) => [l.key, l])),
      lessonsBySlug: new Map(lessons.map((l) => [l.slug, l])),
      courseTitles: new Map(catalog.map((c) => [c.id, c.title])),
    };
  })();
  return cached;
}

export interface RefLink {
  title: string;
  href?: string;
  /** Номер урока, где вводится: «I.8». */
  lesson?: string;
}

/** Ссылка на понятие или правило: название и урок, где оно вводится. */
export function refLink(reg: Registry, id: string): RefLink {
  if (id.startsWith("rule.")) {
    const rule = reg.rules.get(id);
    if (!rule) throw new Error(`нет правила ${id}`);
    const lesson = reg.lessonsBySlug.get(reg.concepts.get(rule.concept)?.lesson ?? "");
    return { title: rule.title.ru, href: lesson?.href, lesson: lesson?.number };
  }
  const concept = reg.concepts.get(id);
  if (!concept) throw new Error(`нет понятия ${id}`);
  const lesson = reg.lessonsBySlug.get(concept.lesson);
  return { title: concept.title.ru, href: lesson?.href, lesson: lesson?.number };
}
