// Сводка пилота (S2.10): читает отчёты участников (JSON из кнопки «Скачать отчёт») и печатает Markdown.
//
//   npx tsx scripts/pilot-report.ts отчёты/            — все *.json в папке
//   npx tsx scripts/pilot-report.ts a.json b.json --out сводка.md
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseReport, ReportFormatError, summarize, toMarkdown, type PilotReport } from "../src/lib/pilot/report";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args[outIdx + 1] : undefined;
const inputs = args.filter((a, i) => a !== "--out" && i !== outIdx + 1);
if (inputs.length === 0) {
  console.error("Укажите файлы отчётов или папку: npx tsx scripts/pilot-report.ts отчёты/");
  process.exit(1);
}

const files = inputs.flatMap((p) => (statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith(".json")).map((f) => path.join(p, f)) : [p]));
const reports: PilotReport[] = [];
for (const file of files) {
  try {
    reports.push(parseReport(readFileSync(file, "utf8"), file));
  } catch (err) {
    if (err instanceof ReportFormatError) console.error(`пропущен: ${err.message}`);
    else throw err;
  }
}
const md = toMarkdown(summarize(reports));
if (out) {
  writeFileSync(out, md);
  console.log(`Сводка по ${reports.length} отчётам: ${out}`);
} else process.stdout.write(md);
