// lib/math не зависит от проекта: импорт состояния запрещён
import { store } from "../state/store";
export const twice = store.value * 2;
