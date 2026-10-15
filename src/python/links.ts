// Где открыть лабораторную (docs/conventions/python.md): Colab — основная кнопка, JupyterLite — без аккаунта.
// Colab берёт ноутбук из публичного репозитория по тегу релиза (S2.09: тег и публичность — решение пользователя).
export const NOTEBOOKS = { repo: "perewodchik/Machine-course", ref: "main", dir: "notebooks" } as const;

/** Своя сборка JupyterLite (этап 3, notebooks/README.md); пока её нет, кнопка «Открыть в браузере» не показывается. */
export const JUPYTERLITE_BASE: string | null = null;

/** notebook — путь от notebooks/ без расширения: «la/normal_equations». */
export const colabUrl = (notebook: string) =>
  `https://colab.research.google.com/github/${NOTEBOOKS.repo}/blob/${NOTEBOOKS.ref}/${NOTEBOOKS.dir}/${notebook}.ipynb`;

export const liteUrl = (notebook: string) =>
  JUPYTERLITE_BASE ? `${JUPYTERLITE_BASE}notebooks/index.html?path=${encodeURIComponent(`${notebook}.ipynb`)}` : null;
