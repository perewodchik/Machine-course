// Отчёт пилота (S2.10): ученик скачивает файл с журналом и отметками «знаю», организатор сводит файлы скриптом
// scripts/pilot-report.ts. Здесь — формат файла и чистая сводка: по заданиям, тестам «до и после», шагам выводов, опросу.
import type { LessonMarks } from "../content/types";
import type { JournalEvent } from "../state/journal";

export const REPORT_KIND = "mlf-pilot-report";
export const REPORT_VERSION = 1;

export interface PilotReport {
  kind: typeof REPORT_KIND;
  version: number;
  /** Случайный ID браузера: отличает участников, не раскрывая, кто они. */
  participant: string;
  exportedAt: string;
  journal: JournalEvent[];
  marks: LessonMarks;
}

export class ReportFormatError extends Error {}

export function parseReport(text: string, name = "файл"): PilotReport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ReportFormatError(`${name}: это не JSON`);
  }
  const r = data as Partial<PilotReport>;
  if (r?.kind !== REPORT_KIND) throw new ReportFormatError(`${name}: это не отчёт пилота (нет kind: "${REPORT_KIND}")`);
  if (r.version !== REPORT_VERSION) throw new ReportFormatError(`${name}: версия отчёта ${r.version}, ожидается ${REPORT_VERSION}`);
  if (!Array.isArray(r.journal) || typeof r.participant !== "string") throw new ReportFormatError(`${name}: нет журнала или ID участника`);
  return r as PilotReport;
}

export interface ItemStats {
  lesson: string;
  item: string;
  /** Участников, которые пробовали задание. */
  learners: number;
  /** Доля верных с первой попытки. */
  firstTry: number;
  /** Доля решивших в итоге. */
  solved: number;
  /** Средние попытки до верного ответа (по решившим) и подсказки. */
  attempts: number;
  hints: number;
}

export interface PrePost {
  lesson: string;
  learners: number;
  pre: number;
  post: number;
}

export interface Summary {
  participants: number;
  items: ItemStats[];
  /** Тест «до и после»: задания pre.<урок> и post.<урок>, верно с первой попытки. */
  prePost: PrePost[];
  /** Вывод: доля участников, дошедших до каждого шага (по тем, кто открыл хотя бы один). */
  steps: { lesson: string; formula: string; reached: number[] }[];
  survey: { lesson: string; answers: number; clarity: number; stuck: Record<string, number>; comments: string[] }[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round = (v: number) => Math.round(v * 100) / 100;

export function summarize(reports: readonly PilotReport[]): Summary {
  // попытки: участник → задание → попытки по порядку
  const tries = new Map<string, Map<string, { correct: boolean; hints: number }[]>>();
  const steps = new Map<string, Map<string, number>>(); // «урок|формула» → участник → максимальный шаг
  const survey = new Map<string, { clarity: number[]; stuck: Record<string, number>; comments: string[] }>();
  for (const r of reports) {
    for (const e of r.journal) {
      if (e.type === "attempt") {
        const key = `${e.lesson}|${e.item}`;
        const byLearner = tries.get(key) ?? new Map();
        const list = byLearner.get(r.participant) ?? [];
        list.push({ correct: e.correct, hints: e.hints });
        byLearner.set(r.participant, list);
        tries.set(key, byLearner);
      } else if (e.type === "step") {
        const key = `${e.lesson}|${e.formula}`;
        const byLearner = steps.get(key) ?? new Map();
        byLearner.set(r.participant, Math.max(byLearner.get(r.participant) ?? 0, e.step));
        steps.set(key, byLearner);
      } else if (e.type === "survey") {
        const s = survey.get(e.lesson) ?? { clarity: [], stuck: {}, comments: [] };
        s.clarity.push(e.clarity);
        if (e.stuck) s.stuck[e.stuck] = (s.stuck[e.stuck] ?? 0) + 1;
        if (e.comment) s.comments.push(e.comment);
        survey.set(e.lesson, s);
      }
    }
  }

  const items: ItemStats[] = [...tries].map(([key, byLearner]) => {
    const [lesson, item] = key.split("|") as [string, string];
    const lists = [...byLearner.values()];
    const solvedLists = lists.filter((l) => l.some((a) => a.correct));
    return {
      lesson,
      item,
      learners: lists.length,
      firstTry: round(mean(lists.map((l) => (l[0]!.correct ? 1 : 0)))),
      solved: round(solvedLists.length / lists.length),
      attempts: round(mean(solvedLists.map((l) => l.findIndex((a) => a.correct) + 1))),
      hints: round(mean(lists.map((l) => Math.max(...l.map((a) => a.hints))))),
    };
  });

  const prePost: PrePost[] = [];
  for (const it of items.filter((i) => i.item.startsWith("pre."))) {
    const post = items.find((i) => i.lesson === it.lesson && i.item === `post.${it.item.slice(4)}`);
    if (post) prePost.push({ lesson: it.lesson, learners: Math.min(it.learners, post.learners), pre: it.firstTry, post: post.firstTry });
  }

  return {
    participants: new Set(reports.map((r) => r.participant)).size,
    items: items.sort((a, b) => a.lesson.localeCompare(b.lesson) || a.item.localeCompare(b.item)),
    prePost,
    steps: [...steps].map(([key, byLearner]) => {
      const [lesson, formula] = key.split("|") as [string, string];
      const max = Math.max(...byLearner.values());
      const reached = Array.from({ length: max + 1 }, (_, k) => round([...byLearner.values()].filter((m) => m >= k).length / byLearner.size));
      return { lesson, formula, reached };
    }),
    survey: [...survey].map(([lesson, s]) => ({ lesson, answers: s.clarity.length, clarity: round(mean(s.clarity)), stuck: s.stuck, comments: s.comments })),
  };
}

/** Сводка Markdown-таблицами — для организатора пилота. */
export function toMarkdown(s: Summary): string {
  const pct = (v: number) => `${Math.round(v * 100)} %`;
  const out = [`# Сводка пилота`, ``, `Участников: ${s.participants}.`, ``, `## Тест до и после урока`, ``];
  out.push("| Урок | Участников | До (верно с 1-й попытки) | После |", "|---|---|---|---|");
  for (const p of s.prePost) out.push(`| ${p.lesson} | ${p.learners} | ${pct(p.pre)} | ${pct(p.post)} |`);
  out.push("", "## Задания", "", "| Урок | Задание | Участников | С 1-й попытки | Решили | Попыток до верного | Подсказок |", "|---|---|---|---|---|---|---|");
  for (const i of s.items) out.push(`| ${i.lesson} | ${i.item} | ${i.learners} | ${pct(i.firstTry)} | ${pct(i.solved)} | ${i.attempts} | ${i.hints} |`);
  out.push("", "## Выводы: сколько дошли до шага", "", "| Урок | Формула | Шаги 1, 2, … |", "|---|---|---|");
  for (const d of s.steps) out.push(`| ${d.lesson} | ${d.formula} | ${d.reached.map(pct).join(", ")} |`);
  out.push("", "## Опрос", "", "| Урок | Ответов | Понятность (1–5) | Где споткнулись |", "|---|---|---|---|");
  for (const q of s.survey) out.push(`| ${q.lesson} | ${q.answers} | ${q.clarity} | ${Object.entries(q.stuck).map(([k, v]) => `${k}: ${v}`).join("; ") || "—"} |`);
  const comments = s.survey.flatMap((q) => q.comments.map((c) => `- ${q.lesson}: ${c}`));
  if (comments.length) out.push("", "### Комментарии", "", ...comments);
  return out.join("\n") + "\n";
}
