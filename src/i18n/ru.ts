// Русские формы слов при числах.

/** Форма при числе: 1 урок, 2 урока, 5 уроков. */
export function plural(n: number, one: string, few: string, many: string): string {
  const d = Math.abs(n) % 100;
  if (d >= 11 && d <= 14) return many;
  if (d % 10 === 1) return one;
  if (d % 10 >= 2 && d % 10 <= 4) return few;
  return many;
}

/** Родительный падеж после «из»: «из 21 урока», «из 52 уроков». */
export function ofLessons(n: number): string {
  const d = Math.abs(n) % 100;
  return d % 10 === 1 && d !== 11 ? "урока" : "уроков";
}

/** Диапазон часов: «12–15 часов». */
export function hoursRange([a, b]: readonly [number, number]): string {
  return a === b ? `${a}\u00a0${plural(a, "час", "часа", "часов")}` : `${a}–${b}\u00a0${plural(b, "час", "часа", "часов")}`;
}
