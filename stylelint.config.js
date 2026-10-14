// Stylelint: внешний вид — только через токены (CLAUDE.md, правило 5).
// Сырые цвета, градиенты и тени вне токенов запрещены; сами токены живут в src/design-system/tokens.
export default {
  ignoreFiles: ["dist/**", "node_modules/**", "prototype/**", "tests/fixtures/**"],
  rules: {
    "color-no-hex": [true, { message: "Цвет — через токен var(--…), не hex" }],
    "color-named": ["never", { message: "Цвет — через токен var(--…), не имя цвета" }],
    "function-disallowed-list": [
      ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color", "linear-gradient", "radial-gradient", "conic-gradient", "repeating-linear-gradient", "repeating-radial-gradient"],
      { message: "Цвета и градиенты — только через токены дизайн-системы" },
    ],
    "declaration-property-value-allowed-list": [
      // токен; рамка или боковая линия цветом токена; подчёркивание подсвеченного символа цветом его роли (currentColor)
      { "box-shadow": ["none", "/^var\\(--/", "/^inset 0 0 0 1px var\\(--/", "/^inset [0-9]+px 0 0 var\\(--/", "/^inset 0 -[0-9]+px (currentColor|var\\(--)/", "/^0 0 0 1px var\\(--/"] },
      { message: "Тень — только токеном (var(--shadow-popover)) или линией цветом токена" },
    ],
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": [true, { ignore: ["consecutive-duplicates-with-different-values"] }],
    "block-no-empty": true,
  },
  overrides: [
    {
      // Токены — единственное место, где задаются цвета
      files: ["src/design-system/tokens/**/*.css"],
      rules: { "color-no-hex": null, "function-disallowed-list": null, "declaration-property-value-allowed-list": null },
    },
  ],
};
