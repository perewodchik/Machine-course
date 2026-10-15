// Микроопрос в конце урока и отчёт пилота (S2.10). Ответ — событие SurveyEvent в журнале; «Скачать отчёт» —
// файл с журналом и отметками «знаю» (формат — src/lib/pilot/report.ts, сводка — scripts/pilot-report.ts).
import type { SurveyEvent } from "../lib/exercises/types";
import { REPORT_KIND, REPORT_VERSION, type PilotReport } from "../lib/pilot/report";
import { $journal, logEvent } from "../lib/state/journal";
import { $marks } from "../lib/state/marks";

/** Случайный ID браузера: отличает участников в сводке, не раскрывая, кто они. */
function participant(): string {
  try {
    const known = localStorage.getItem("mlf:participant");
    if (known) return known;
    const id = crypto.randomUUID();
    localStorage.setItem("mlf:participant", id);
    return id;
  } catch {
    return "без-id";
  }
}

export function downloadReport(): void {
  const report: PilotReport = {
    kind: REPORT_KIND,
    version: REPORT_VERSION,
    participant: participant(),
    exportedAt: new Date().toISOString(),
    journal: $journal.get(),
    marks: $marks.get(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 1)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mlf-otchet-${report.exportedAt.slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setup(box: HTMLElement): void {
  const form = box.querySelector("form")!;
  const status = box.querySelector<HTMLElement>("[data-survey-status]")!;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const clarity = Number([...data.entries()].find(([k]) => k.endsWith("-clarity"))?.[1]);
    if (!clarity) {
      status.textContent = "Выберите оценку от 1 до 5.";
      return;
    }
    const stuck = String(data.get("stuck") ?? "");
    const comment = String(data.get("comment") ?? "").trim();
    const e: SurveyEvent = { type: "survey", lesson: box.dataset.lesson!, clarity: clarity as SurveyEvent["clarity"], at: new Date().toISOString() };
    if (stuck) e.stuck = stuck;
    if (comment) e.comment = comment.slice(0, 500);
    logEvent(e);
    status.textContent = "Спасибо! Ответ сохранён в этом браузере.";
  });
}

document.querySelectorAll<HTMLElement>("[data-survey]").forEach(setup);
document.querySelectorAll<HTMLButtonElement>("[data-report-download]").forEach((b) => b.addEventListener("click", downloadReport));
