// Шпаргалки (S5.04, идея B7): из текста урока — формулы реестра (<Formula formula="…">) и блоки типичных ошибок
// (<Block kind="pitfall">). Печатная страница собирает их по модулю или по разделу CS229. Чистая логика.

/** Формулы урока в порядке появления, без повторов. */
export const lessonFormulas = (mdx: string) => [...new Set([...mdx.matchAll(/<Formula\s+formula="([^"]+)"/g)].map((m) => m[1]!))];

/** Тексты блоков «типичная ошибка»: абзацы между <Block kind="pitfall"> и </Block>, без пустых строк. */
export const lessonPitfalls = (mdx: string) =>
  [...mdx.matchAll(/<Block kind="pitfall"[^>]*>([\s\S]*?)<\/Block>/g)].map((m) =>
    m[1]!
      .split(/\n\s*\n/)
      .map((p) => p.trim().replace(/\s*\n\s*/g, " "))
      .filter(Boolean)
      .join(" "),
  );
