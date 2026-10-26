// Карта курсов (S7.01): content/catalog.yaml согласован с курсами и с docs/program/catalog.md; рёбра не пересекают узлы.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { edgePath, mapSize, NODE, nodeXY, type CatalogMap } from "./catalog-map";

const root = path.resolve(__dirname, "../../..");
const map = parse(readFileSync(path.join(root, "content/catalog.yaml"), "utf8")) as CatalogMap;
const courses = readdirSync(path.join(root, "content/courses"));
const doc = readFileSync(path.join(root, "docs/program/catalog.md"), "utf8");
const names: Record<string, string> = {
  Математика: "foundations",
  Основы: "ml-basics",
  "Классические методы": "ml-classic",
  "Табличные данные": "ml-tabular",
  "Глубокое обучение": "deep-learning",
  "Без учителя": "unsupervised",
  LLM: "llm",
  RL: "rl",
  Практикум: "ml-project",
};

describe("карта курсов", () => {
  it("узел на каждый курс, ссылки на существующие курсы, клетки не повторяются", () => {
    expect(map.nodes.map((n) => n.course).sort()).toEqual([...courses].sort());
    for (const e of map.edges) for (const c of e.slice(0, 2)) expect(courses, String(c)).toContain(c);
    for (const r of map.routes) for (const c of r.courses) expect(courses).toContain(c);
    expect(new Set(map.nodes.map((n) => `${n.col},${n.row}`)).size).toBe(map.nodes.length);
  });

  it("маршруты совпадают с таблицей «Маршруты» в docs/program/catalog.md", () => {
    const rows = [...doc.matchAll(/^\| (Пройти CS229 целиком|ML-инженер в продукте с табличными данными|Нейросети и LLM) \| ([^|]+) \|$/gm)];
    expect(rows).toHaveLength(3);
    const fromDoc = rows.map((m) => m[2]!.split("→").map((s) => names[s.trim()]));
    expect(map.routes.map((r) => r.courses)).toEqual(fromDoc);
  });

  it("рёбра графа совпадают со схемой mermaid в docs/program/catalog.md", () => {
    const ids: Record<string, string> = { M: "foundations", B: "ml-basics", C: "ml-classic", T: "ml-tabular", D: "deep-learning", U: "unsupervised", R: "rl", L: "llm", P: "ml-project" };
    const fromDoc = [...doc.matchAll(/^\s+([A-Z])(?:\["[^"]*"\])? (-->|-\.->) ([A-Z])/gm)].map((m) => `${ids[m[1]!]}>${ids[m[3]!]}${m[2] === "-.->" ? " soft" : ""}`);
    expect(map.edges.map((e) => `${e[0]}>${e[1]}${e[2] ? " soft" : ""}`).sort()).toEqual(fromDoc.sort());
  });

  it("геометрия: холст вмещает узлы, ребро начинается у края источника", () => {
    const { w, h } = mapSize(map.nodes);
    for (const n of map.nodes) {
      const { x, y } = nodeXY(n);
      expect(x + NODE.w).toBeLessThanOrEqual(w);
      expect(y + NODE.h).toBeLessThanOrEqual(h);
    }
    const byId = new Map(map.nodes.map((n) => [n.course, n]));
    expect(edgePath(byId.get("foundations")!, byId.get("ml-basics")!)).toBe("M168 168 H200");
    expect(edgePath(byId.get("ml-basics")!, byId.get("ml-project")!)).toMatch(/^M279 194 V/);
    // через узел «Без учителя» стрелка не идёт: дуга от правого края «Глубокого обучения» к правому краю RL
    expect(edgePath(byId.get("deep-learning")!, byId.get("rl")!)).toMatch(/^M548 168 C /);
  });
});
