// Коллекции контента. Типы — src/lib/content/types.ts, схемы повторяют их.
// S1.05: курсы и модули (нужны маршрутам и оглавлению); уроки, понятия, формулы и глоссарий — S1.06.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "латиница в нижнем регистре, цифры и дефисы");
const localized = z.union([z.string(), z.object({ ru: z.string().min(1), en: z.string().optional() })]);

const courses = defineCollection({
  loader: glob({ pattern: "*/course.yaml", base: "./content/courses", generateId: ({ data }) => String(data.id) }),
  schema: z.strictObject({
    id: slug,
    number: z.number().int().positive().optional(),
    title: localized,
    summary: localized,
    cs229Edition: z.string(),
    requires: z.array(slug).optional(),
    throughline: z.string().optional(),
    modules: z.array(slug).min(1),
  }),
});

const modules = defineCollection({
  // id записи — «<курс>/<модуль>»: модули разных курсов могут называться одинаково
  loader: glob({
    pattern: "*/*/module.yaml",
    base: "./content/courses",
    generateId: ({ entry }) => entry.replace(/\/module\.yaml$/, ""),
  }),
  schema: z.strictObject({
    id: slug,
    number: z.string().min(1),
    title: localized,
    hours: z.tuple([z.number().positive(), z.number().positive()]),
    lessons: z
      .array(
        z.strictObject({
          slug,
          number: z.string().min(1),
          title: z.string().min(1),
          optional: z.boolean().optional(),
        }),
      )
      .min(1),
  }),
});

export const collections = { courses, modules };
