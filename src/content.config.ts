// Коллекции контента (content/). Схемы — src/lib/content/schemas.ts, типы — src/lib/content/types.ts.
// ID записей: курс — «foundations»; модуль — «<курс>/<модуль>»; урок — LessonKey «<курс>/<модуль>/<slug>»;
// понятие, правило, формула, термин — свой id.
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { defineCollection } from "astro:content";
import type { Loader } from "astro/loaders";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { ContentError, readYaml, validate, validateList } from "./lib/content/files";
import * as s from "./lib/content/schemas";

const root = process.cwd();
const byDataId = ({ data }: { data: Record<string, unknown> }) => String(data.id);

/** Понятия: несколько YAML-файлов со списками (content/concepts/*.yaml); ID уникальны во всех файлах. */
function conceptsLoader(dir: string): Loader {
  return {
    name: "concepts-loader",
    load: async ({ store, parseData, watcher, logger }) => {
      const load = async () => {
        store.clear();
        const owner = new Map<string, string>();
        for (const name of readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort()) {
          const path = join(dir, name);
          const rel = relative(root, path);
          for (const item of validateList(s.concept, readYaml(path, rel), rel)) {
            const prev = owner.get(item.id);
            if (prev) throw new ContentError([`${rel}: понятие «${item.id}» уже объявлено в ${prev}`]);
            owner.set(item.id, rel);
            store.set({ id: item.id, data: await parseData({ id: item.id, data: item, filePath: rel }), filePath: rel });
          }
        }
      };
      await load();
      watcher?.on("all", async (_event, changed) => {
        if (!changed.startsWith(dir)) return;
        try {
          await load();
        } catch (e) {
          logger.error(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };
}

const courses = defineCollection({
  loader: glob({ pattern: "*/course.yaml", base: "./content/courses", generateId: byDataId }),
  schema: s.course,
});

const modules = defineCollection({
  // модули разных курсов могут называться одинаково
  loader: glob({ pattern: "*/*/module.yaml", base: "./content/courses", generateId: ({ entry }) => entry.replace(/\/module\.yaml$/, "") }),
  schema: s.module,
});

const lessons = defineCollection({
  loader: glob({ pattern: "*/*/*.mdx", base: "./content/courses", generateId: ({ entry }) => entry.replace(/\.mdx$/, "") }),
  schema: s.lessonFrontmatter,
});

const concepts = defineCollection({
  loader: conceptsLoader(join(root, "content/concepts")),
  schema: s.concept,
});

const rules = defineCollection({
  loader: glob({ pattern: "rules/*.yaml", base: "./content/formulas", generateId: byDataId }),
  schema: s.rule,
});

const formulas = defineCollection({
  loader: glob({ pattern: ["**/*.yaml", "!rules/**"], base: "./content/formulas", generateId: byDataId }),
  schema: s.formula,
});

const glossary = defineCollection({
  loader: file("content/glossary.yaml"),
  schema: s.glossaryEntry,
});

/** Переименования: файл целиком проверяется схемой redirects, записи «concepts», «lessons», «formulas» — словари «старый → новый». */
function redirectsLoader(path: string): Loader {
  return {
    name: "redirects-loader",
    load: async ({ store, parseData }) => {
      const rel = relative(root, path);
      const data = validate(s.redirects, readYaml(path, rel), rel);
      store.clear();
      for (const [id, map] of Object.entries(data)) {
        store.set({ id, data: await parseData({ id, data: { ...map }, filePath: rel }), filePath: rel });
      }
    },
  };
}

const redirects = defineCollection({
  loader: redirectsLoader(join(root, "content/redirects.yaml")),
  schema: z.record(z.string(), z.string()),
});

export const collections = { courses, modules, lessons, concepts, rules, formulas, glossary, redirects };
