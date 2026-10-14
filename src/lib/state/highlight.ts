// Подсвеченный символ формул: имя из \sym{name}{…} или null. Пишет клиентский скрипт подсветки,
// читают формулы, легенды и виджеты (через @nanostores/react).
import { atom } from "nanostores";

export const $activeSym = atom<string | null>(null);
