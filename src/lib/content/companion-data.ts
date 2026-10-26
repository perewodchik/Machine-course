// Данные компаньона CS229 для страниц /cs229/ (S5.03): разделы, формулы и разминка. Только сборка (fs, реестр).
import { existsSync, readFileSync } from "node:fs";
import { loadCatalog } from "./collections";
import { finalGen, formulasFor, sections } from "./companion";
import { loadRegistry } from "./registry";

/** Сколько задач в разминке: около пяти минут. */
const WARMUP = 4;

export async function companion() {
  const catalog = await loadCatalog();
  const reg = await loadRegistry();
  const formulas = [...reg.formulas.values()];
  return sections(catalog.flatMap((c) => c.lessons)).map((s) => {
    const warmup = s.lessons
      .filter((l) => l.course === "foundations")
      .flatMap((l) => {
        const path = `content/courses/${l.course}/${l.module}/${l.slug}.mdx`;
        const gen = existsSync(path) ? finalGen(readFileSync(path, "utf8")) : undefined;
        return gen ? [{ lesson: l.key, gen, seed: 61 }] : [];
      })
      .slice(-WARMUP);
    return { ...s, formulas: formulasFor(s.name, formulas).map((f) => f.id), warmup, courseTitles: reg.courseTitles };
  });
}
