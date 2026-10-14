/**
 * Контракт мини-игры. Игра — это виджет с целью: чистая модель + тонкое представление.
 * Модель детерминирована: случайность только из rng с seed, время приходит действием tick.
 * Партия = seed + журнал действий, поэтому её можно воспроизвести в тесте и по ссылке.
 */

export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number;
}

export type GameStatus = "playing" | "solved" | "failed";

export interface GameSpec<State, Action, Params = void> {
  id: string; // «la.matrix-puzzle»
  version: number; // меняется при изменении правил: старые журналы партий не смешиваются с новыми
  concepts: string[]; // какие понятия тренирует (ConceptId)
  init(params: Params, rng: Rng): State;
  step(state: State, action: Action): State; // чистый редьюсер
  status(state: State): GameStatus;
  score(state: State): number; // метрика самого понятия: точность, число ходов, правило Брайера…
  describe(state: State): string; // текстовое описание для aria-live и скринридеров
  hint?(state: State): string;
  generate(rng: Rng, difficulty: number): Params; // генератор уровней
}

/** Что игра сообщает в прогресс: практика, но не «подтверждение» усвоения. */
export interface GameResult {
  gameId: string;
  version: number;
  seed: number;
  level: number;
  solved: boolean;
  hints: number;
  actions: number;
}
