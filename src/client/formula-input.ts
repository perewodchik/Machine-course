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
