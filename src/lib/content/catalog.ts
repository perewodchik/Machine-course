// Каталог курсов: дерево «курс → модули → уроки» для маршрутов, оглавления и шапки.
// Чистые функции без astro:content — данные передаёт страница (getCollection), тесты — фикстуры.
import type { Course, LessonKey, LessonRef, Localized, Module } from "./types";

export const ru = (s: Localized): string => (typeof s === "string" ? s : s.ru);

export const courseHref = (course: string): string => `/${course}/`;
export const lessonHref = (course: string, module: string, slug: string): string => `/${course}/${module}/${slug}/`;

export interface LessonEntry extends LessonRef {
  key: LessonKey;
  href: string;
  course: string;
  module: string;
}

export interface ModuleEntry {
  id: string;
  number: string;
  title: string;
  hours: [number, number];
  lessons: LessonEntry[];
  /** Обязательных уроков (без ★): по ним считается «знаю N из M». */
  required: number;
}

export interface CourseTree {
  id: string;
  number?: number;
  title: string;
  summary: string;
  href: string;
  requires: string[];
  modules: ModuleEntry[];
  /** Все уроки курса по порядку. */
  lessons: LessonEntry[];
  required: number;
}

/** Раздел урока в оглавлении (заголовок h2). */
export interface TocHeading {
  slug: string;
  text: string;
}

/** Собирает дерево курса. Модули ищутся по ключу «<курс>/<модуль>»; пропавший модуль — ошибка сборки с путём файла. */
export function buildCourseTree(course: Course, modules: ReadonlyMap<string, Module>): CourseTree {
  const entries = course.modules.map((id): ModuleEntry => {
    const m = modules.get(`${course.id}/${id}`);
    if (!m) throw new Error(`курс ${course.id}: нет модуля ${id} (content/courses/${course.id}/${id}/module.yaml)`);
    if (m.id !== id) throw new Error(`content/courses/${course.id}/${id}/module.yaml: id «${m.id}» не совпадает с папкой «${id}»`);
    const lessons = m.lessons.map(
      (l): LessonEntry => ({
        ...l,
        key: `${course.id}/${id}/${l.slug}`,
        href: lessonHref(course.id, id, l.slug),
        course: course.id,
        module: id,
      }),
    );
    return {
      id,
      number: m.number,
      title: ru(m.title),
      hours: m.hours,
      lessons,
      required: lessons.filter((l) => !l.optional).length,
    };
  });
  const lessons = entries.flatMap((m) => m.lessons);
  const keys = new Set<string>();
  for (const l of lessons) {
    if (keys.has(l.key)) throw new Error(`курс ${course.id}: урок ${l.key} повторяется`);
    keys.add(l.key);
  }
  return {
    id: course.id,
    number: course.number,
    title: ru(course.title),
    summary: ru(course.summary),
    href: courseHref(course.id),
    requires: course.requires ?? [],
    modules: entries,
    lessons,
    required: entries.reduce((n, m) => n + m.required, 0),
  };
}

/** Порядок каталога: курс без номера (математика — предисловие) первым, затем по номеру. */
export function sortCourses<T extends Pick<Course, "id" | "number">>(courses: readonly T[]): T[] {
  return [...courses].sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || a.id.localeCompare(b.id));
}

/** Соседние уроки в пределах курса. */
export function neighbours(tree: CourseTree, key: LessonKey): { prev?: LessonEntry; next?: LessonEntry } {
  const i = tree.lessons.findIndex((l) => l.key === key);
  if (i < 0) return {};
  return { prev: tree.lessons[i - 1], next: tree.lessons[i + 1] };
}
