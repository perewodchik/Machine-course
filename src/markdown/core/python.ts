// Подсветка Python при сборке — «карандашом», как в прототипе: ключевые слова цветом текста,
// строки и числа — --code-literal, комментарии — --code-comment. Без Shiki: его темы красят мимо токенов.
const KEYWORDS = new Set(
  ("False None True and as assert async await break class continue def del elif else except finally for from global " +
    "if import in is lambda nonlocal not or pass raise return try while with yield match case print").split(" "),
);

const TOKEN =
  /(#[^\n]*)|((?:\b[rRbBuUfF]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?\b|\.\d+\b)|\b([A-Za-z_]\w*)\b/g;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const span = (cls: string, s: string) => `<span class="${cls}">${escape(s)}</span>`;

/** HTML для <pre><code>: текст экранирован, токены — в <span class="tok-…">. */
export function highlightPython(code: string): string {
  let out = "";
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    out += escape(code.slice(last, m.index));
    const [text, comment, string, number, word] = m;
    if (comment) out += span("tok-c", text);
    else if (string) out += span("tok-s", text);
    else if (number) out += span("tok-n", text);
    else if (word && KEYWORDS.has(word)) out += span("tok-k", text);
    else out += escape(text);
    last = m.index + text.length;
  }
  return out + escape(code.slice(last));
}
