// Ввод формул (упражнения kind: "formula"): поле для TeX заменяется редактором MathLive. MathLive грузится только
// на страницах с таким полем; шрифты — те же KaTeX_*, что уже подключены со своего домена (COEP), звуки выключены.
const inputs = [...document.querySelectorAll<HTMLInputElement>("input[data-formula-input]")];

if (inputs.length) {
  void import("mathlive")
    .then(({ MathfieldElement }) => {
      MathfieldElement.fontsDirectory = null;
      MathfieldElement.soundsDirectory = null;
      for (const input of inputs) {
        const field = new MathfieldElement();
        field.id = input.id;
        field.className = "formula-input";
        field.dataset.formulaInput = "";
        field.setAttribute("aria-label", input.getAttribute("aria-label") ?? "Формула");
        field.setAttribute("math-virtual-keyboard-policy", "auto");
        field.value = input.value;
        input.replaceWith(field);
      }
    })
    .catch(() => {
      // без MathLive остаётся поле для TeX: проверка работает так же
    });
}

// Форма выражения по ходу ввода (S3.06, идея A6): «форма 3 × 1» под полем, а если формы не сходятся — где.
// Формы символов — из данных проверки задачи; модуль разбора грузится при первом вводе.
const timers = new WeakMap<Element, number>();
document.addEventListener("input", (e) => {
  const field = e.target instanceof Element ? e.target.closest<HTMLElement & { value: string }>("[data-formula-input]") : null;
  if (!field) return;
  clearTimeout(timers.get(field));
  timers.set(
    field,
    window.setTimeout(() => void showShape(field), 400),
  );
});

async function showShape(field: HTMLElement & { value: string }): Promise<void> {
  const row = field.closest("[data-step-row]");
  const variant = field.closest("[data-variant]");
  const out = (row ?? variant)?.querySelector<HTMLElement>("[data-shape]");
  const data = variant?.querySelector("script[data-answer]")?.textContent;
  if (!out || !data) return;
  const { symbols } = JSON.parse(data) as { symbols?: { name: string; shape?: (number | string)[] }[] };
  const { lineShape, shapeOf } = await import("../lib/symbolic/shape");
  const note = (row ? lineShape : shapeOf)(field.value ?? "", symbols ?? []);
  out.textContent = note ? note.text : "";
  out.classList.toggle("is-bad", !!note && !note.ok);
}

