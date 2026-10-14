// Вывод по шагам: «Назад», «Следующий шаг», «Показать все шаги», режим «Сначала предсказать шаг».
// Начальное состояние уже в разметке (Derivation.astro), здесь — только переходы.
const NEXT = "Какой шаг дальше? Запишите сами, затем откройте его.";
const LATER = "Откроется после предыдущего шага.";

function init(box: HTMLElement): void {
  const steps = [...box.querySelectorAll<HTMLElement>(".step")];
  const goals = [...box.querySelectorAll<HTMLElement>(".plan li")];
  const prev = box.querySelector<HTMLButtonElement>("[data-prev]")!;
  const next = box.querySelector<HTMLButtonElement>("[data-next]")!;
  const all = box.querySelector<HTMLButtonElement>("[data-all]")!;
  const predict = box.querySelector<HTMLInputElement>("[data-predict-toggle]")!;
  const pos = box.querySelector<HTMLElement>("[data-pos]")!;
  let current = Number(box.dataset.start ?? 0);

  const render = () => {
    steps.forEach((s, i) => {
      s.classList.toggle("is-current", i === current);
      s.classList.toggle("is-pending", i > current);
      s.classList.toggle("is-masked", i > current && predict.checked);
      const placeholder = s.querySelector(".step__placeholder");
      if (placeholder) placeholder.textContent = i === current + 1 ? NEXT : LATER;
    });
    const goal = Number(steps[current]?.dataset.goal ?? 0);
    goals.forEach((g, i) => g.classList.toggle("is-current", i === goal));
    const atEnd = current === steps.length - 1;
    // кнопка в фокусе становится неактивной — фокус переходит на «Назад», а не теряется
    if (atEnd && (document.activeElement === next || document.activeElement === all)) prev.focus();
    prev.disabled = current === 0;
    next.disabled = atEnd;
    all.disabled = atEnd;
    if (current === 0 && document.activeElement === prev) next.focus();
    pos.textContent = `Шаг ${current + 1} из ${steps.length}`;
  };

  prev.addEventListener("click", () => {
    current = Math.max(0, current - 1);
    render();
  });
  next.addEventListener("click", () => {
    current = Math.min(steps.length - 1, current + 1);
    render();
  });
  all.addEventListener("click", () => {
    current = steps.length - 1;
    render();
  });
  predict.addEventListener("change", render);
}

document.querySelectorAll<HTMLElement>("[data-derivation]").forEach(init);
