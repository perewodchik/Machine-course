// Валидатор контента (npm run validate): всё, что не видно из одного файла, — ссылки между файлами, граф понятий,
// компиляция каждого TeX, символы с ролями, подписи заметок. Схемы отдельных файлов — ./schemas.ts.
// Каждая проблема — строка «файл: где: что не так»; пустой список — контент корректен.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import katex from "katex";
import type { Root as MdastRoot } from "mdast";
import type { MdxJsxAttribute } from "mdast-util-mdx-jsx";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { MACROS, TRUSTED_COMMANDS } from "../../markdown/core/katex";
import { ContentError, parseYaml, validate, validateList } from "./files";
import { loadSnippet } from "./snippets";
import * as s from "./schemas";
import type { Concept, Course, Formula, LessonFrontmatter, LessonRef, Localized, Module, Redirects, Rule, SymbolSpec } from "./types";

interface Entry<T> {
  file: string;
  data: T;
}

export interface ValidationResult {
  problems: string[];
  stats: { courses: number; lessons: number; mdx: number; concepts: number; rules: number; formulas: number; tex: number };
}

const COLORED = new Set(["data", "param", "target"]);

export function validateContent(root: string): ValidationResult {
  const problems: string[] = [];
  const rel = (path: string) => relative(root, path);
  const report = (file: string, message: string) => problems.push(`${file}: ${message}`);
  /** Выполняет проверку схемой; ошибки — в общий список (с приставкой prefix), результат — undefined. */
  const guard = <T>(run: () => T, prefix = ""): T | undefined => {
    try {
      return run();
    } catch (e) {
      if (e instanceof ContentError) problems.push(...e.problems.map((p) => prefix + p));
      else throw e;
      return undefined;
    }
  };
  const listDir = (dir: string, filter: (name: string) => boolean = () => true) =>
    existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => filter(d.name)).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const readYamlFile = (path: string) => guard(() => parseYaml(readFileSync(path, "utf8"), rel(path)));

  // ───────── курсы, модули, уроки ─────────
  const coursesDir = join(root, "content/courses");
  const courses = new Map<string, Entry<Course>>();
  const modules = new Map<string, Entry<Module>>(); // «курс/модуль»
  const lessons = new Map<string, LessonRef & { course: string; module: string; file: string }>(); // LessonKey
  const slugs = new Set<string>();

  for (const dir of listDir(coursesDir).filter((d) => d.isDirectory())) {
    const file = join(coursesDir, dir.name, "course.yaml");
    if (!existsSync(file)) {
      report(rel(join(coursesDir, dir.name)), "нет course.yaml");
      continue;
    }
    const raw = readYamlFile(file);
    const course = raw === undefined ? undefined : guard(() => validate(s.course, raw, rel(file)));
    if (!course) continue;
    if (course.id !== dir.name) report(rel(file), `id «${course.id}» не совпадает с папкой «${dir.name}»`);
    courses.set(course.id, { file: rel(file), data: course });
  }

  for (const [cid, { file: cfile, data: course }] of courses) {
    for (const r of course.requires ?? []) if (!courses.has(r)) report(cfile, `requires: нет курса «${r}»`);
    const listed = new Set(course.modules);
    for (const d of listDir(join(coursesDir, cid)).filter((d) => d.isDirectory())) {
      if (!listed.has(d.name)) report(rel(join(coursesDir, cid, d.name)), `модуль не подключён: его нет в modules файла ${cfile}`);
    }
    const numbers = new Map<string, string>();
    for (const mid of course.modules) {
      const mfile = join(coursesDir, cid, mid, "module.yaml");
      if (!existsSync(mfile)) {
        report(cfile, `modules: нет файла ${rel(mfile)}`);
        continue;
      }
      const raw = readYamlFile(mfile);
      const m = raw === undefined ? undefined : guard(() => validate(s.module, raw, rel(mfile)));
      if (!m) continue;
      if (m.id !== mid) report(rel(mfile), `id «${m.id}» не совпадает с папкой «${mid}»`);
      modules.set(`${cid}/${mid}`, { file: rel(mfile), data: m });
      m.lessons.forEach((l, i) => {
        const key = `${cid}/${mid}/${l.slug}`;
        if (lessons.has(key)) report(rel(mfile), `lessons[${i}].slug: урок «${l.slug}» повторяется в модуле`);
        const prev = numbers.get(l.number);
        if (prev) report(rel(mfile), `lessons[${i}].number: номер «${l.number}» уже занят уроком ${prev}`);
        numbers.set(l.number, key);
        lessons.set(key, { ...l, course: cid, module: mid, file: rel(mfile) });
        slugs.add(l.slug);
      });
    }
  }

  // ───────── MDX уроков: frontmatter и тело ─────────
  interface Mdx {
    file: string;
    key: string;
    frontmatter?: LessonFrontmatter;
    body: string;
    bodyLine: number;
  }
  const mdx: Mdx[] = [];
  for (const [mkey] of modules) {
    for (const f of listDir(join(coursesDir, mkey), (n) => n.endsWith(".mdx"))) {
      const path = join(coursesDir, mkey, f.name);
      const file = rel(path);
      const slug = f.name.replace(/\.mdx$/, "");
      const key = `${mkey}/${slug}`;
      const text = readFileSync(path, "utf8");
      const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
      if (!m) {
        report(file, "нет frontmatter (--- … ---) в начале файла");
        continue;
      }
      const raw = guard(() => parseYaml(m[1]!, file));
      const fm = raw === undefined ? undefined : (guard(() => validate(s.lessonFrontmatter, raw, file)) as LessonFrontmatter | undefined);
      const entry: Mdx = { file, key, frontmatter: fm, body: text.slice(m[0].length), bodyLine: m[0].split("\n").length - 1 };
      mdx.push(entry);
      const ref = lessons.get(key);
      if (!ref) {
        report(file, `урока «${slug}» нет в module.yaml модуля — добавьте его туда (порядок уроков задаётся там)`);
        continue;
      }
      if (fm) {
        if (fm.id !== slug) report(file, `id: «${fm.id}» не совпадает с именем файла «${slug}»`);
        if (fm.number !== ref.number) report(file, `number: «${fm.number}», а в ${ref.file} — «${ref.number}»`);
        if (fm.title !== ref.title) report(file, `title: «${fm.title}», а в ${ref.file} — «${ref.title}»`);
      }
    }
  }

  // ───────── понятия ─────────
  const conceptsDir = join(root, "content/concepts");
  const concepts = new Map<string, Entry<Concept>>();
  for (const f of listDir(conceptsDir, (n) => n.endsWith(".yaml"))) {
    const path = join(conceptsDir, f.name);
    const raw = readYamlFile(path);
    const list = raw === undefined ? undefined : guard(() => validateList(s.concept, raw, rel(path)));
    for (const c of list ?? []) {
      const prev = concepts.get(c.id);
      if (prev) report(rel(path), `понятие «${c.id}» уже объявлено в ${prev.file}`);
      else concepts.set(c.id, { file: rel(path), data: c as Concept });
    }
  }
  for (const [id, { file, data }] of concepts) {
    for (const p of data.prerequisites) if (!concepts.has(p)) report(file, `${id}.prerequisites: нет понятия «${p}»`);
    if (!slugs.has(data.lesson)) report(file, `${id}.lesson: нет урока «${data.lesson}» ни в одном module.yaml`);
  }
  // граф без циклов: обход в глубину с цветами
  const state = new Map<string, 1 | 2>(); // 1 — в стеке, 2 — пройдено
  const stack: string[] = [];
  const dfs = (id: string): boolean => {
    state.set(id, 1);
    stack.push(id);
    for (const p of concepts.get(id)?.data.prerequisites ?? []) {
      if (!concepts.has(p)) continue;
      if (state.get(p) === 1) {
        const cycle = [...stack.slice(stack.indexOf(p)), p];
        report(concepts.get(p)!.file, `граф понятий: цикл ${cycle.join(" → ")}`);
        return true;
      }
      if (!state.has(p) && dfs(p)) return true;
    }
    stack.pop();
    state.set(id, 2);
    return false;
  };
  for (const id of concepts.keys()) if (!state.has(id) && dfs(id)) break;

  // ───────── правила и формулы ─────────
  const formulasDir = join(root, "content/formulas");
  const rules = new Map<string, Entry<Rule>>();
  const formulas = new Map<string, Entry<Formula>>();
  const walkYaml = (dir: string): string[] =>
    listDir(dir).flatMap((d) => (d.isDirectory() ? walkYaml(join(dir, d.name)) : d.name.endsWith(".yaml") ? [join(dir, d.name)] : []));
  for (const path of walkYaml(formulasDir)) {
    const isRule = rel(path).startsWith(join("content", "formulas", "rules"));
    const raw = readYamlFile(path);
    if (raw === undefined) continue;
    const data = isRule ? guard(() => validate(s.rule, raw, rel(path))) : guard(() => validate(s.formula, raw, rel(path)));
    if (!data) continue;
    const prev = rules.get(data.id) ?? formulas.get(data.id);
    if (prev) report(rel(path), `id «${data.id}» уже есть в ${prev.file}`);
    else if (isRule) rules.set(data.id, { file: rel(path), data: data as Rule });
    else formulas.set(data.id, { file: rel(path), data: data as Formula });
  }
  const needConcept = (file: string, where: string, id: string) => {
    if (!concepts.has(id)) report(file, `${where}: нет понятия «${id}»`);
  };
  for (const { file, data } of rules.values()) needConcept(file, "concept", data.concept);
  for (const { file, data } of formulas.values()) {
    data.dependsOn.concepts.forEach((c, i) => needConcept(file, `dependsOn.concepts[${i}]`, c));
    data.dependsOn.rules.forEach((r, i) => {
      if (!rules.has(r)) report(file, `dependsOn.rules[${i}]: нет правила «${r}»`);
    });
    data.conditions?.forEach((c, i) => c.concept && needConcept(file, `conditions[${i}].concept`, c.concept));
    data.derivation?.steps.forEach((st, i) =>
      st.by.forEach((b, j) => {
        const ok = b.startsWith("rule.") ? rules.has(b) : concepts.has(b);
        if (!ok) report(file, `derivation.steps[${i}].by[${j}]: нет ${b.startsWith("rule.") ? "правила" : "понятия"} «${b}»`);
      }),
    );
    data.usedIn?.forEach((u, i) => {
      if (!concepts.has(u) && !lessons.has(u)) report(file, `usedIn[${i}]: «${u}» — не понятие и не ключ урока`);
    });
  }
  for (const m of mdx) m.frontmatter?.concepts.forEach((c, i) => needConcept(m.file, `concepts[${i}]`, c));

  // ───────── символы: одно имя — одна роль ─────────
  const roleOf = new Map<string, { role: string; file: string }>();
  const declare = (file: string, symbols: readonly SymbolSpec[] = []) => {
    for (const sym of symbols) {
      if (!sym.role) continue;
      const prev = roleOf.get(sym.name);
      if (prev && prev.role !== sym.role) {
        report(file, `символ «${sym.name}»: роль ${sym.role}, а в ${prev.file} — ${prev.role}; цвет символа закреплён за ролью, разные роли у одного имени запутают`);
      } else if (!prev) roleOf.set(sym.name, { role: sym.role, file });
    }
  };
  for (const { file, data } of [...rules.values(), ...formulas.values()]) declare(file, data.symbols);
  for (const m of mdx) declare(m.file, m.frontmatter?.symbols);

  // ───────── TeX: компиляция, \sym, роли ─────────
  let texCount = 0;
  const checkTex = (tex: string, file: string, where: string, symbols: readonly SymbolSpec[] = []) => {
    texCount++;
    const at = `${file}: ${where}`;
    try {
      katex.renderToString(tex, {
        macros: { ...MACROS },
        throwOnError: true,
        trust: (ctx) => {
          if (TRUSTED_COMMANDS.has(ctx.command)) return true;
          problems.push(`${at}: команда ${ctx.command} запрещена (KaTeX trust): разрешены только \\htmlData и \\htmlClass через \\sym`);
          return false;
        },
        strict: (code: string, msg: string) => {
          if (code !== "htmlExtension") problems.push(`${at}: KaTeX (strict, ${code}): ${msg}`);
          return "ignore";
        },
      });
    } catch (e) {
      problems.push(`${at}: KaTeX не разобрал «${tex}»: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const declared = new Map(symbols.map((x) => [x.name, x]));
    const used = [...tex.matchAll(/\\sym\{([^{}]*)\}/g)].map((m) => m[1]!);
    for (const name of new Set(used)) {
      if (!declared.has(name)) problems.push(`${at}: символ «${name}» в \\sym не объявлен в symbols`);
    }
    if (!used.length) return; // формула без ролей — без подсветки, голые символы допустимы
    const rest = stripSym(tex);
    for (const sym of symbols) {
      if (sym.role && containsBare(rest, sym.tex)) {
        problems.push(`${at}: символ «${sym.tex}» (роль ${sym.role}) написан без \\sym — в формуле с ролями пишите \\sym{${sym.name}}{${sym.tex}}`);
      }
    }
    const colored = new Set(used.map((n) => declared.get(n)?.role).filter((r): r is NonNullable<typeof r> => !!r && COLORED.has(r)));
    if (colored.size > 3) problems.push(`${at}: больше трёх цветных ролей в одной формуле`);
  };

  // Текстовые поля формул и правил: формулы в них — только в $…$ (renderInline), иначе на странице сырой TeX
  // («B_k») или символы шрифтом текста (Literata рисует курсивную θ как ϑ)
  const checkProse = (text: Localized | undefined, file: string, where: string, symbols: readonly SymbolSpec[]) => {
    if (text === undefined) return;
    const source = typeof text === "string" ? text : text.ru;
    const outside = source.replace(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+?)\$/g, (_m, display: string | undefined, inline: string | undefined) => {
      checkTex(display ?? inline ?? "", file, where, symbols);
      return " ";
    });
    const bad = PROSE_MATH.exec(outside);
    if (bad) report(file, `${where}: «${bad[0]}» вне формулы — пишите математику в $…$`);
  };
  for (const { file, data } of [...rules.values(), ...formulas.values()]) {
    data.symbols.forEach((x, i) => checkProse(x.meaning, file, `symbols[${i}].meaning`, data.symbols));
    checkProse(data.pitfall, file, "pitfall", data.symbols);
    if (data.kind === "rule") checkProse(data.corollary, file, "corollary", data.symbols);
    if (data.kind === "formula") {
      data.conditions?.forEach((c, i) => checkProse(c.why, file, `conditions[${i}].why`, data.symbols));
      data.derivation?.plan.forEach((g, i) => checkProse(g, file, `derivation.plan[${i}]`, data.symbols));
      data.derivation?.steps.forEach((st, i) => {
        checkProse(st.note, file, `derivation.steps[${i}].note`, data.symbols);
        checkProse(st.why, file, `derivation.steps[${i}].why`, data.symbols);
      });
      data.pitfalls?.forEach((p, i) => checkProse(p, file, `pitfalls[${i}]`, data.symbols));
    }
  }

  for (const { file, data } of [...rules.values(), ...formulas.values()]) {
    checkTex(data.statement, file, "statement", data.symbols);
    data.symbols.forEach((x, i) => checkTex(x.tex, file, `symbols[${i}].tex`));
    if (data.kind === "formula") {
      data.conditions?.forEach((c, i) => checkTex(c.tex, file, `conditions[${i}].tex`, data.symbols));
      data.derivation?.steps.forEach((st, i) => checkTex(st.tex, file, `derivation.steps[${i}].tex`, data.symbols));
    }
  }

  const mdxParser = unified().use(remarkParse).use(remarkMdx).use(remarkMath);
  for (const m of mdx) {
    m.frontmatter?.symbols?.forEach((x, i) => {
      checkTex(x.tex, m.file, `symbols[${i}].tex`);
      checkProse(x.meaning, m.file, `symbols[${i}].meaning`, m.frontmatter?.symbols ?? []);
    });
    for (const f of m.frontmatter?.lead?.matchAll(/\$((?:\\.|[^$\\])+?)\$/g) ?? []) checkTex(f[1]!, m.file, "lead", m.frontmatter?.symbols);
    let tree: MdastRoot;
    try {
      tree = mdxParser.parse(m.body);
    } catch (e) {
      report(m.file, `MDX не разбирается: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const line = (n: { position?: { start: { line: number } } }) => (n.position ? m.bodyLine + n.position.start.line : "?");
    visit(tree, (node) => {
      if (node.type === "math" || node.type === "inlineMath") {
        checkTex(node.value, m.file, `строка ${line(node)}`, m.frontmatter?.symbols);
      }
      if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && (node.name === "PyCode" || node.name === "OpenIn")) {
        // ссылки на код и лабораторные: PyCode и OpenIn уронят сборку — валидатор говорит об этом раньше и с номером строки
        const attr = (name: string) => {
          const a = node.attributes.find((x): x is MdxJsxAttribute => x.type === "mdxJsxAttribute" && x.name === name);
          return typeof a?.value === "string" ? a.value : undefined;
        };
        const src = attr("src");
        if (src !== undefined) guard(() => loadSnippet(src, root), `${m.file}: строка ${line(node)}: `);
        const lab = attr(node.name === "PyCode" ? "lab" : "notebook");
        if (lab !== undefined && !existsSync(join(root, "notebooks", `${lab}.ipynb`))) {
          report(m.file, `строка ${line(node)}: лабораторной notebooks/${lab}.ipynb нет`);
        }
      }
      if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name === "Note") {
        const label = node.attributes.find((a): a is MdxJsxAttribute => a.type === "mdxJsxAttribute" && a.name === "label");
        if (!label || typeof label.value !== "string" || !label.value.trim()) {
          report(m.file, `строка ${line(node)}: заметка <Note> без подписи label — в свёрнутых полях от неё останется пустая строка`);
        }
      }
    });
  }

  // ───────── переименования ─────────
  const rfile = join(root, "content/redirects.yaml");
  if (existsSync(rfile)) {
    const raw = readYamlFile(rfile);
    const red: Redirects | undefined = raw === undefined ? undefined : guard(() => validate(s.redirects, raw, rel(rfile)) as Redirects);
    const f = rel(rfile);
    for (const [from, to] of Object.entries(red?.lessons ?? {})) {
      if (!lessons.has(to)) report(f, `lessons.${from}: цели «${to}» нет среди уроков`);
      if (lessons.has(from)) report(f, `lessons.${from}: старый ключ всё ещё занят уроком`);
    }
    for (const [from, to] of Object.entries(red?.concepts ?? {})) {
      if (!concepts.has(to)) report(f, `concepts.${from}: цели «${to}» нет среди понятий`);
      if (concepts.has(from)) report(f, `concepts.${from}: старый ID всё ещё занят понятием`);
    }
    for (const [from, to] of Object.entries(red?.formulas ?? {})) {
      if (!rules.has(to) && !formulas.has(to)) report(f, `formulas.${from}: цели «${to}» нет среди правил и формул`);
    }
  }

  // ───────── глоссарий ─────────
  const gfile = join(root, "content/glossary.yaml");
  if (existsSync(gfile)) {
    const raw = readYamlFile(gfile);
    if (raw !== undefined) guard(() => validateList(s.glossaryEntry, raw, rel(gfile)));
  }

  return {
    problems,
    stats: { courses: courses.size, lessons: lessons.size, mdx: mdx.length, concepts: concepts.size, rules: rules.size, formulas: formulas.size, tex: texCount },
  };
}

/** Математика в тексте вне $…$: индекс, степень, команда TeX, греческая буква, надстрочные знаки, знаки операций. */
const PROSE_MATH = /[_^]|\\[A-Za-z]+|[\u0370-\u03ff]|[\u1d40-\u1d7f\u2070-\u209f]|[∑∏∩∪∈∉⊂⊆≤≥≠⊤∣√∞∇]/u;

/** Убирает вызовы \sym{name}{…} целиком (с вложенными скобками во втором аргументе). */
export function stripSym(tex: string): string {
  let out = "";
  let i = 0;
  while (i < tex.length) {
    const m = /\\sym\{[^{}]*\}\{/y;
    m.lastIndex = i;
    if (m.test(tex)) {
      let depth = 1;
      let j = m.lastIndex;
      while (j < tex.length && depth > 0) {
        if (tex[j] === "\\") j++; // экранированная скобка
        else if (tex[j] === "{") depth++;
        else if (tex[j] === "}") depth--;
        j++;
      }
      i = j;
    } else {
      out += tex[i];
      i++;
    }
  }
  return out;
}

/** Есть ли в TeX «голое» вхождение символа (без \sym). Аргументы текстовых команд и имена команд не считаются. */
export function containsBare(tex: string, symTex: string): boolean {
  if (/^\\[A-Za-z]+$/.test(symTex)) return new RegExp(`${symTex.replace(/\\/g, "\\\\")}(?![A-Za-z])`).test(tex);
  if (/^[A-Za-z]$/.test(symTex)) {
    const plain = tex
      .replace(/\\(?:operatorname\*?|text|textrm|mathrm|mathbb|mathcal|mathsf|mathfrak|htmlClass|htmlData|tag|label)\{[^{}]*\}/g, " ")
      .replace(/\\[A-Za-z]+/g, " ");
    return new RegExp(`(?<![A-Za-z])${symTex}(?![A-Za-z])`).test(plain);
  }
  return tex.includes(symTex);
}
