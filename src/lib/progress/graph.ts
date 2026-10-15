// Граф уроков (requires из module.yaml): кто на урок опирается, какие уроки можно начинать, путь «зачем это мне».
// Чистые функции: карта курса (src/client/map.ts) и страницы понятий (сборка).

export interface GraphLesson {
  key: string;
  requires: readonly string[];
}

/** Обратные рёбра: урок → уроки, которые на него опираются (в порядке списка). */
export function dependents(lessons: readonly GraphLesson[]): Map<string, string[]> {
  const out = new Map<string, string[]>(lessons.map((l) => [l.key, []]));
  for (const l of lessons) for (const r of l.requires) out.get(r)?.push(l.key);
  return out;
}

/** Можно начинать: урок без галочки, у которого все уроки из requires отмечены «знаю». */
export function available(lessons: readonly GraphLesson[], known: (key: string) => boolean): string[] {
  return lessons.filter((l) => !known(l.key) && l.requires.every(known)).map((l) => l.key);
}

/**
 * Кратчайший путь от урока вперёд по графу до первого урока-цели (у которого есть раздел CS229):
 * [start, …, goal]. Сам start — тоже цель, если подходит. null — пути нет.
 */
export function pathForward(start: string, lessons: readonly GraphLesson[], isGoal: (key: string) => boolean): string[] | null {
  const next = dependents(lessons);
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  while (queue.length) {
    const key = queue.shift()!;
    if (isGoal(key)) {
      const path: string[] = [];
      for (let k: string | null = key; k !== null; k = prev.get(k) ?? null) path.unshift(k);
      return path;
    }
    for (const d of next.get(key) ?? []) {
      if (prev.has(d)) continue;
      prev.set(d, key);
      queue.push(d);
    }
  }
  return null;
}
