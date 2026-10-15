# Деформация сетки (урок I.4)

Матрица $A$ 2 × 2 переводит клетку плоскости в сетку параллелограммов. Неподвижная клетка — исходная плоскость,
карандашные линии — её образ, синий параллелограмм — образ единичного квадрата (площадь $\lvert\det A\rvert$),
стрелки $Ae_1$, $Ae_2$ — столбцы $A$ тех же цветов, что бегунки столбцов.

| Пропс | Что |
|---|---|
| `initial` | начальная матрица (по умолчанию единичная) |
| `presets` | id готовых матриц из `PRESETS`: `identity`, `stretch`, `shear`, `rotation`, `reflection`, `singular`; `[]` — без кнопок |
| `lock` | только кнопки, без бегунков |
| `compose` | `{ A, B, nameA, nameB }`: выбор порядка «сначала B, потом A» (AB) или наоборот |

В уроке: `<GridMap n={1} presets={["stretch", "shear", "rotation"]}>Подпись…</GridMap>` (обёртка `src/components/widgets/GridMap.astro`).
Модель — `model.ts` (`gridImage`, `unitSquare`, `compose`, `describe`), тесты — `model.test.ts`.
