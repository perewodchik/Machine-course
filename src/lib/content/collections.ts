// Загрузка каталога из коллекций Astro (только для сборки: страницы и раскладки).
import { getCollection, type CollectionEntry } from "astro:content";
import { buildCourseTree, sortCourses, type CourseTree } from "./catalog";
import type { Module } from "./types";

let cached: Promise<CourseTree[]> | undefined;

/** Все курсы в порядке каталога; результат кешируется на время сборки. */
export function loadCatalog(): Promise<CourseTree[]> {
  cached ??= (async () => {
    const modules = new Map<string, Module>((await getCollection("modules")).map((e) => [e.id, e.data]));
    const courses = sortCourses((await getCollection("courses")).map((e) => e.data));
    return courses.map((c) => buildCourseTree(c, modules));
  })();
  return cached;
}

export async function loadCourse(id: string): Promise<CourseTree> {
  const course = (await loadCatalog()).find((c) => c.id === id);
  if (!course) throw new Error(`нет курса ${id} (content/courses/${id}/course.yaml)`);
  return course;
}

let texts: Promise<Map<string, CollectionEntry<"lessons">>> | undefined;

/** Текст урока (MDX) по ключу или undefined, если урок ещё не написан: без предупреждений getEntry о пропусках. */
export async function lessonText(key: string): Promise<CollectionEntry<"lessons"> | undefined> {
  texts ??= getCollection("lessons").then((all) => new Map(all.map((e) => [e.id, e])));
  return (await texts).get(key);
}
