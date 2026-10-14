/*
 * Поведение прототипа. В проекте эта логика станет React-островами
 * (components/pedagogy, widgets/*) и чистыми моделями (lib/math).
 */

/* ───────── Тема ───────── */
(function initTheme() {
  const params = new URLSearchParams(location.search);
  let theme = params.get("theme");
  try { theme = theme || localStorage.getItem("theme"); } catch (_) { /* приватный режим */ }
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  let margins = params.get("margins");
  try { margins = margins || localStorage.getItem("margins"); } catch (_) { /* приватный режим */ }
  if (margins === "hidden") document.documentElement.dataset.margins = "hidden";
})();

/* ───────── Поля: показать или скрыть ───────── */
function initMargins() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll("[data-margin-toggle]");
  const sync = () => {
    const hidden = root.dataset.margins === "hidden";
    buttons.forEach((b) => {
      b.setAttribute("aria-pressed", String(hidden));
      b.querySelector("[data-label]").textContent = hidden ? "Показать поля" : "Скрыть поля";
    });
    // В свёрнутом режиме подпись заметки — кнопка раскрытия
    document.querySelectorAll(".note > .label").forEach((label) => {
      if (hidden) {
        label.setAttribute("role", "button");
        label.setAttribute("tabindex", "0");
        label.setAttribute("aria-expanded", String(label.parentElement.classList.contains("is-open")));
      } else {
        label.removeAttribute("role");
        label.removeAttribute("tabindex");
        label.removeAttribute("aria-expanded");
      }
    });
  };
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      root.dataset.margins = root.dataset.margins === "hidden" ? "visible" : "hidden";
      try { localStorage.setItem("margins", root.dataset.margins); } catch (_) { /* приватный режим */ }
      sync();
    }),
  );
  const toggleNote = (label) => {
    if (root.dataset.margins !== "hidden") return;
    const open = label.parentElement.classList.toggle("is-open");
    label.setAttribute("aria-expanded", String(open));
  };
  document.querySelectorAll(".note > .label").forEach((label) => {
    label.addEventListener("click", () => toggleNote(label));
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleNote(label); }
    });
  });
  sync();
}

function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = isDark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (_) { /* приватный режим */ }
}

/* ───────── Формулы: макросы курса и «живые» символы ───────── */
const sym = (slot, name, tex) => `\\htmlData{sym=${name}}{\\htmlClass{sym s${slot}}{${tex}}}`;
const MACROS = {
  "\\X": sym(1, "X", "X"),
  "\\xx": sym(1, "x", "x"),
  "\\th": sym(2, "theta", "\\theta"),
  "\\y": sym(3, "y", "y"),
  "\\res": sym(4, "eps", "\\varepsilon"), // слот 4 — карандаш (нейтральный)
  "\\eone": sym(1, "e1", "e_1"),
  "\\etwo": sym(2, "e2", "e_2"),
  "\\changed": "\\htmlClass{changed}{#1}",
  "\\T": "^{\\top}",
};

/* Словарь символов урока: смысл и размерность (в проекте — из реестра формул) */
const SYMBOLS = {
  X: { tex: "X", slot: 1, meaning: "Матрица признаков: строка — объект, столбец — признак (первый — единицы)", shape: "n × d" },
  x: { tex: "x", slot: 1, meaning: "Признак одного объекта", shape: "число" },
  theta: { tex: "\\theta", slot: 2, meaning: "Вектор весов модели — то, что мы ищем", shape: "d × 1" },
  y: { tex: "y", slot: 3, meaning: "Вектор правильных ответов", shape: "n × 1" },
  eps: { tex: "\\varepsilon", slot: 4, meaning: "Остатки: ответ минус предсказание", shape: "n × 1" },
};

const TRUSTED = new Set(["\\htmlClass", "\\htmlData"]);
function renderMath(root = document.body) {
  if (!window.renderMathInElement) return;
  window.renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    macros: MACROS,
    trust: (ctx) => TRUSTED.has(ctx.command),
    // KaTeX ≥ 0.19 предупреждает о \htmlData, если strict не вернул ответ явно
    strict: (code) => (code === "htmlExtension" ? "ignore" : "warn"),
    throwOnError: false,
  });
}

function initSymbols() {
  const pop = document.createElement("div");
  pop.className = "sym-pop";
  pop.setAttribute("role", "tooltip");
  document.body.append(pop);

  const all = (name) => document.querySelectorAll(`[data-sym="${name}"] .sym`);
  const open = (host) => {
    const name = host.dataset.symKey || host.closest("[data-sym]")?.dataset.sym;
    const info = SYMBOLS[name];
    if (!info) return;
    all(name).forEach((el) => el.classList.add("is-lit"));
    pop.innerHTML = `<div class="sym-pop__head"><span class="s${info.slot}">\\(${info.tex}\\)</span><span class="sym-pop__shape">${info.shape}</span></div><div>${info.meaning}</div>`;
    renderMath(pop);
    const range = document.createRange();
    range.selectNodeContents(host);
    const r = host.dataset.symKey ? host.getBoundingClientRect() : range.getBoundingClientRect();
    // У выключной формулы подсказка встаёт под всей формулой, чтобы не закрывать её
    const display = host.closest(".katex-display");
    const bottom = display ? display.getBoundingClientRect().bottom : r.bottom;
    pop.style.left = `${Math.max(12, r.left + scrollX - 8)}px`;
    pop.style.top = `${bottom + scrollY + 8}px`;
    pop.classList.add("is-open");
  };
  const close = () => {
    document.querySelectorAll(".sym.is-lit").forEach((el) => el.classList.remove("is-lit"));
    pop.classList.remove("is-open");
  };
  document.querySelectorAll(".sym").forEach((el) => {
    el.addEventListener("mouseenter", () => open(el));
    el.addEventListener("mouseleave", close);
  });
  // Легенда символов: кнопки для клавиатуры и скринридеров (HTML-часть KaTeX скрыта через aria-hidden)
  document.querySelectorAll(".sym-key").forEach((el) => {
    el.addEventListener("mouseenter", () => open(el));
    el.addEventListener("focus", () => open(el));
    el.addEventListener("mouseleave", close);
    el.addEventListener("blur", close);
  });
  return { open, close };
}

/* ───────── Рисунок: подгонка прямой ───────── */
// Данные — из ячейки кода ниже (seed=7), чтобы рисунок и код показывали одно и то же.
const DATA_X = [6.126, 8.575, 7.481, 2.527, 3.201, 8.362, 0.547, 7.891, 7.674, 4.711, 3.227, 3.006];
const DATA_Y = [4.632, 5.358, 5.297, 3.007, 2.154, 5.525, 0.36, 4.766, 4.315, 3.65, 2.215, 3.016];

function leastSquares(xs, ys) {
  const n = xs.length;
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const det = n * sxx - sx * sx;
  return [(sxx * sy - sx * sxy) / det, (n * sxy - sx * sy) / det];
}
const loss = (t0, t1) => 0.5 * DATA_X.reduce((a, x, i) => a + (t0 + t1 * x - DATA_Y[i]) ** 2, 0);
const fmt = (v, d = 2) => v.toFixed(d).replace("-", "−"); // десятичная точка, как в коде и CS229

function initRegression(svg) {
  const NS = "http://www.w3.org/2000/svg";
  const X_MAX = 10, Y_MAX = 7, L = 40, T = 20, R = 20, B = 40;
  const fig = svg.closest(".figure");
  const s0 = fig.querySelector("#t0"), s1 = fig.querySelector("#t1");
  const v0 = fig.querySelector("#t0v"), v1 = fig.querySelector("#t1v");
  const jv = fig.querySelector("#jv"), meter = fig.querySelector(".meter > span"), best = fig.querySelector(".meter > i");
  const live = fig.querySelector("[aria-live]");
  const [o0, o1] = leastSquares(DATA_X, DATA_Y);
  const J_MAX = 12, jMin = loss(o0, o1);
  best.style.left = `${(jMin / J_MAX) * 100}%`;
  let W, H, sx, sy, fit, lines, fitLabel, residLabel;

  const el = (tag, attrs, parent = svg) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent.append(node);
    return node;
  };
  // Подпись в начертании формул: основа и индексы меньшим кеглем
  const label = (node, parts) => {
    node.replaceChildren(...parts.map(([text, sub], i) => {
      const t = document.createElementNS(NS, "tspan");
      t.textContent = text;
      if (sub) { t.setAttribute("class", "sub"); t.setAttribute("dy", "4"); }
      else if (i > 0) t.setAttribute("dy", "-4");
      return t;
    }));
  };

  // viewBox подстраивается под ширину рисунка: на телефоне подписи не сжимаются вдвое.
  // Шаг клетки — делитель единицы оси, поэтому деления всегда совпадают с клеткой.
  function layout() {
    const width = Math.max(300, Math.round(svg.getBoundingClientRect().width || 660));
    W = width - L - R;
    H = Math.round(Math.min(280, Math.max(200, W * 0.47)));
    svg.setAttribute("viewBox", `0 0 ${width} ${H + T + B}`);
    svg.replaceChildren();
    sx = (x) => L + (x / X_MAX) * W;
    sy = (y) => T + H - (y / Y_MAX) * H;
    const ux = W / X_MAX, uy = H / Y_MAX;
    const cx = ux / Math.max(1, Math.round(ux / 20)), cy = uy / Math.max(1, Math.round(uy / 20));
    const grid = el("g", {});
    for (let gx = L; gx <= L + W + 0.5; gx += cx) el("line", { class: "grid-line", x1: gx, y1: T, x2: gx, y2: T + H }, grid);
    for (let gy = T + H; gy >= T - 0.5; gy -= cy) el("line", { class: "grid-line", x1: L, y1: gy, x2: L + W, y2: gy }, grid);
    el("line", { class: "axis", x1: L, y1: T + H, x2: L + W, y2: T + H });
    el("line", { class: "axis", x1: L, y1: T, x2: L, y2: T + H });
    for (let i = 0; i <= X_MAX; i += 2) el("text", { class: "tick", x: sx(i), y: T + H + 18, "text-anchor": "middle" }).textContent = i;
    for (let j = 0; j <= Y_MAX; j += 2) el("text", { class: "tick", x: L - 10, y: sy(j) + 4, "text-anchor": "end" }).textContent = j;
    el("text", { class: "axis-label", x: L + W - 4, y: T + H - 8, "text-anchor": "end" }).textContent = "x";
    el("text", { class: "axis-label", x: L + 8, y: T + 16 }).textContent = "y";
    // Всё, что зависит от θ, обрезается областью графика: прямая не «улетает» за оси
    const clipId = `plot-clip-${Math.random().toString(36).slice(2, 8)}`;
    const clip = el("clipPath", { id: clipId }, el("defs", {}));
    el("rect", { x: L, y: T, width: W, height: H }, clip);
    const resid = el("g", { "clip-path": `url(#${clipId})` });
    lines = DATA_X.map(() => el("line", { class: "resid" }, resid));
    fit = el("line", { class: "fit", "clip-path": `url(#${clipId})` });
    DATA_X.forEach((x, i) => el("circle", { class: "pt", cx: sx(x), cy: sy(DATA_Y[i]), r: 5 }));
    fitLabel = el("text", { class: "direct-label", "text-anchor": "end" });
    residLabel = el("text", { class: "direct-label direct-label--resid" });
    label(fitLabel, [["ŷ = θ"], ["0", true], [" + θ"], ["1", true], [" x"]]);
    label(residLabel, [["ε"], ["i", true]]);
    draw();
  }

  function draw() {
    const t0 = +s0.value, t1 = +s1.value;
    fit.setAttribute("x1", sx(0)); fit.setAttribute("y1", sy(t0));
    fit.setAttribute("x2", sx(X_MAX)); fit.setAttribute("y2", sy(t0 + t1 * X_MAX));
    DATA_X.forEach((x, i) => {
      const ln = lines[i];
      ln.setAttribute("x1", sx(x)); ln.setAttribute("x2", sx(x));
      ln.setAttribute("y1", sy(DATA_Y[i])); ln.setAttribute("y2", sy(t0 + t1 * x));
    });
    // Подпись прямой — у её видимого конца, внутри области графика
    let xl = 9.7;
    const yAt = (x) => t0 + t1 * x;
    if (yAt(xl) > Y_MAX - 0.6 && t1 > 0) xl = (Y_MAX - 0.6 - t0) / t1;
    if (yAt(xl) < 0.6 && t1 < 0) xl = (0.6 - t0) / t1;
    xl = Math.min(9.7, Math.max(3, xl));
    // по умолчанию под прямой (точки в основном над ней); у нижнего края — над прямой
    let yl = sy(yAt(xl)) + 26;
    if (yl > T + H - 8) yl = sy(yAt(xl)) - 12;
    fitLabel.setAttribute("x", sx(xl));
    fitLabel.setAttribute("y", Math.max(T + 16, yl));
    // прямая целиком вне графика — подпись не показываем
    fitLabel.style.display = yAt(xl) < 0 || yAt(xl) > Y_MAX ? "none" : "";
    const clampY = (v) => Math.min(T + H - 8, Math.max(T + 16, v));
    residLabel.setAttribute("x", sx(0.547) + 9);
    residLabel.setAttribute("y", clampY((sy(DATA_Y[6]) + sy(t0 + t1 * 0.547)) / 2 + 5));
    const J = loss(t0, t1);
    v0.textContent = fmt(t0); v1.textContent = fmt(t1);
    jv.textContent = fmt(J);
    meter.style.width = `${Math.min(100, (J / J_MAX) * 100)}%`;
    live.textContent = `θ₀ = ${fmt(t0)}, θ₁ = ${fmt(t1)}, J = ${fmt(J)}; минимум ${fmt(jMin)}`;
  }
  s0.addEventListener("input", draw);
  s1.addEventListener("input", draw);
  fig.querySelector("[data-solve]").addEventListener("click", () => {
    const from = [+s0.value, +s1.value], start = performance.now();
    const dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
    const tick = (now) => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1;
      const e = 1 - (1 - k) ** 3;
      s0.value = from[0] + (o0 - from[0]) * e;
      s1.value = from[1] + (o1 - from[1]) * e;
      draw();
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (Math.abs(w - lastWidth) > 4) { lastWidth = w; layout(); }
  }).observe(svg);
  layout();
}

/* ───────── Вывод по шагам ───────── */
function initDerivation(card) {
  const steps = [...card.querySelectorAll(".step")];
  const goals = [...card.querySelectorAll(".plan li")];
  let current = +card.dataset.start || 0;
  const render = () => {
    steps.forEach((s, i) => {
      s.classList.toggle("is-current", i === current);
      s.classList.toggle("is-pending", i > current);
      s.querySelectorAll("[data-reveal]").forEach((n) => (n.hidden = i > current));
      s.querySelectorAll("[data-placeholder]").forEach((n) => (n.hidden = i <= current));
    });
    const goal = +steps[current].dataset.goal;
    goals.forEach((g, i) => g.classList.toggle("is-current", i === goal));
    card.querySelector("[data-prev]").disabled = current === 0;
    card.querySelector("[data-next]").disabled = current === steps.length - 1;
    card.querySelector("[data-pos]").textContent = `Шаг ${current + 1} из ${steps.length}`;
  };
  card.querySelector("[data-prev]").addEventListener("click", () => { current = Math.max(0, current - 1); render(); });
  card.querySelector("[data-next]").addEventListener("click", () => { current = Math.min(steps.length - 1, current + 1); render(); });
  card.querySelector("[data-all]").addEventListener("click", () => { current = steps.length - 1; render(); });
  card.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      card.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      card.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== tab.getAttribute("aria-controls")));
    }),
  );
  render();
}

/* ───────── Упражнения ───────── */
function initExercises() {
  document.querySelectorAll("[data-exercise]").forEach((ex) => {
    const input = ex.querySelector("input"), out = ex.querySelector("[data-feedback]");
    const answer = +ex.dataset.answer;
    ex.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = parseFloat(input.value.replace(",", ".").replace("−", "-"));
      const ok = Math.abs(v - answer) < 1e-3;
      input.classList.toggle("is-right", ok);
      input.classList.toggle("is-wrong", !ok);
      out.hidden = false;
      out.className = `feedback ${ok ? "feedback--right" : "feedback--wrong"}`;
      out.querySelector("b").textContent = ok ? "Верно." : "Пока нет.";
      out.querySelector("span").textContent = ok ? ex.dataset.right : ex.dataset.wrong;
      renderMath(out);
    });
  });
  document.querySelectorAll("[data-choice]").forEach((q) => {
    q.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        q.querySelectorAll("button").forEach((x) => x.classList.remove("is-right", "is-wrong"));
        b.classList.add(b.dataset.ok ? "is-right" : "is-wrong");
        const fb = q.querySelector("[data-feedback]");
        fb.hidden = false;
        fb.className = `feedback ${b.dataset.ok ? "feedback--right" : "feedback--wrong"}`;
        fb.querySelector("b").textContent = b.dataset.ok ? "Верно." : "Не совсем.";
        fb.querySelector("span").textContent = b.dataset.why;
        renderMath(fb);
      }),
    );
  });
}

/* ───────── Запуск ───────── */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));
  initMargins();
  document.querySelectorAll("[data-toc-toggle]").forEach((b) =>
    b.addEventListener("click", () => {
      const toc = document.querySelector(".toc");
      const open = toc?.classList.toggle("is-open");
      b.setAttribute("aria-expanded", String(Boolean(open)));
    }),
  );
  renderMath();
  const symbols = initSymbols();
  document.querySelectorAll("svg[data-regression]").forEach(initRegression);
  document.querySelectorAll("[data-derivation]").forEach(initDerivation);
  initExercises();

  // Для скриншотов: ?demo=1 показывает подсветку символа и подсказку
  if (new URLSearchParams(location.search).get("demo") === "1") {
    const target = document.querySelector("#lead-formula [data-sym='theta'] .sym");
    if (target) symbols.open(target);
    document.querySelectorAll("[data-demo-click]").forEach((b) => b.click());
  }
  document.documentElement.classList.add("is-ready");
});
