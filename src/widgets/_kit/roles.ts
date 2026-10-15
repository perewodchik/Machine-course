// Роль на рисунке → класс цвета: те же роли, что у символов в формулах (data → бирюза, param → оранжевый,
// target → пурпур, aux → карандаш пунктиром). Ручки интерфейса рисунок не красят.
export type Role = "data" | "param" | "target" | "aux";

const SLOT: Record<Role, 1 | 2 | 3 | 4> = { data: 1, param: 2, target: 3, aux: 4 };

export const roleClass = (role: Role = "aux") => `r${SLOT[role]}`;
