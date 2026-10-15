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

/** Код по кускам: у токена — класс tok-c (комментарий), tok-s (строка), tok-n (число), tok-k (ключевое слово). */
export function pythonTokens(code: string): { text: string; cls?: string }[] {
  const out: { text: string; cls?: string }[] = [];
  let last = 0;
  const plain = (text: string) => text && out.push({ text });
  for (const m of code.matchAll(TOKEN)) {
    plain(code.slice(last, m.index));
    const [text, comment, string, number, word] = m;
    const cls = comment ? "tok-c" : string ? "tok-s" : number ? "tok-n" : word && KEYWORDS.has(word) ? "tok-k" : undefined;
    out.push(cls ? { text, cls } : { text });
    last = m.index + text.length;
  }
  plain(code.slice(last));
  return out;
}

/** HTML для <pre><code>: текст экранирован, токены — в <span class="tok-…">. */
export function highlightPython(code: string): string {
  return pythonTokens(code)
    .map((t) => (t.cls ? span(t.cls, t.text) : escape(t.text)))
    .join("");
}
