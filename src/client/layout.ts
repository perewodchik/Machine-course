// Поведение раскладки без фреймворка: тема, поля и заметки, выдвижное оглавление, раскрытие модулей.
// Начальные data-theme и data-margins ставит инлайн-скрипт в <head> (BaseLayout), здесь — только переключение.

const root = document.documentElement;

function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* приватный режим: состояние живёт до перезагрузки */
  }
}

function isDark(): boolean {
  return root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}

function initTheme(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  const sync = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(isDark())));
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      store("theme", root.dataset.theme);
      sync();
    }),
  );
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", sync);
  sync();
}

/* Поля: показать или скрыть. В свёрнутом режиме подпись заметки — кнопка раскрытия. */
function initMargins(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-margin-toggle]");
  const labels = document.querySelectorAll<HTMLElement>(".note > .label");
  const sync = () => {
    const hidden = root.dataset.margins === "hidden";
    buttons.forEach((b) => {
      const label = b.querySelector("[data-label]");
      if (label) label.textContent = hidden ? "Показать поля" : "Скрыть поля";
    });
    labels.forEach((label) => {
      if (hidden) {
        label.setAttribute("role", "button");
        label.tabIndex = 0;
        label.setAttribute("aria-expanded", String(label.parentElement?.classList.contains("is-open") ?? false));
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
      store("margins", root.dataset.margins);
      sync();
    }),
  );
  const toggleNote = (label: HTMLElement) => {
    if (root.dataset.margins !== "hidden") return;
    const open = label.parentElement?.classList.toggle("is-open") ?? false;
    label.setAttribute("aria-expanded", String(open));
  };
  labels.forEach((label) => {
    label.addEventListener("click", () => toggleNote(label));
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleNote(label);
      }
    });
  });
  sync();
}

/* Оглавление на узком экране — выдвижная панель под шапкой; Escape закрывает и возвращает фокус на кнопку. */
function initToc(): void {
  const toc = document.getElementById("toc");
  const toggle = document.querySelector<HTMLButtonElement>("[data-toc-toggle]");
  if (!toc || !toggle) return;
  const content = document.getElementById("content");
  const setOpen = (open: boolean) => {
    toc.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    // панель закрывает текст целиком: текст под ней недоступен ни мыши, ни клавиатуре
    content?.toggleAttribute("inert", open);
    if (open) {
      revealCurrent();
      toc.querySelector<HTMLElement>("[aria-current='page']")?.focus();
    }
  };
  // текущий урок виден в оглавлении без прокрутки вручную. Не scrollIntoView: в Chromium он сдвигает
  // стартовую точку Tab, и клавиатура пропустила бы «К содержимому» и шапку.
  const revealCurrent = () => {
    const link = toc.querySelector<HTMLElement>("[aria-current='page']");
    if (!link) return;
    const top = link.getBoundingClientRect().top - toc.getBoundingClientRect().top + toc.scrollTop;
    if (top + link.offsetHeight > toc.scrollTop + toc.clientHeight) toc.scrollTop = top - toc.clientHeight / 3;
  };
  toggle.addEventListener("click", () => setOpen(!toc.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toc.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  // переход по разделу урока закрывает панель
  toc.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest("a") && toc.classList.contains("is-open")) setOpen(false);
  });
  // панель открыта, а окно расширили до двух колонок: снять блокировку прокрутки
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });

  // Модули раскрываются кнопкой; открыт модуль текущего урока
  toc.querySelectorAll<HTMLButtonElement>(".toc__part-head[aria-controls]").forEach((b) =>
    b.addEventListener("click", () => {
      const list = document.getElementById(b.getAttribute("aria-controls") ?? "");
      const open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open));
      if (list) list.hidden = !open;
    }),
  );
  revealCurrent();
}

initTheme();
initMargins();
initToc();
