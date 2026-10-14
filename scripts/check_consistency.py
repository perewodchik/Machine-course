"""Согласованность курсов, программы и плана реализации.

Проверяет:
- уроки в content/courses/*/ — ключи <курс>/<модуль>/<slug> уникальны, requires существуют;
- карточки программы совпадают с module.yaml (номер и название), где карточки уже есть;
- в docs/implementation/PLAN.md каждый урок встречается ровно один раз с верными номером, названием и ключом;
- задачи плана: ID уникальны, зависимости существуют и идут раньше, пакеты из «Контекста» существуют;
- ссылки на ID задач в документах существуют; цели content/redirects.yaml существуют;
- относительные ссылки в Markdown не битые.

Запуск: python scripts/check_consistency.py  (код выхода 1 при ошибках)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


# ───────── курсы ─────────
courses: dict[str, dict] = {}
lessons: dict[str, dict] = {}  # ключ урока → {course, module, number, title, optional}
for cfile in sorted((ROOT / "content/courses").glob("*/course.yaml")):
    c = yaml.safe_load(cfile.read_text())
    cid = c["id"]
    if cid != cfile.parent.name:
        err(f"{cfile}: id {cid} не совпадает с каталогом")
    courses[cid] = c
    for mid in c["modules"]:
        m = yaml.safe_load((cfile.parent / mid / "module.yaml").read_text())
        for le in m["lessons"]:
            key = f"{cid}/{mid}/{le['slug']}"
            if key in lessons:
                err(f"дубль ключа урока {key}")
            lessons[key] = {"course": cid, "module": mid, "number": str(le["number"]),
                            "title": le["title"], "optional": bool(le.get("optional"))}
for cid, c in courses.items():
    for r in c.get("requires", []) or []:
        if r not in courses:
            err(f"курс {cid}: requires {r} — нет такого курса")


def course_lessons(cid: str) -> list[dict]:
    return [v for v in lessons.values() if v["course"] == cid]


# ───────── карточки программы ─────────
def check_cards(cid: str, files: list[Path]) -> None:
    text = "".join(f.read_text() for f in files)
    found = re.findall(r"^### ([\dIVX]+\.\d+)\. (?:★ )?(.+)$", text, flags=re.M)
    expected = [(v["number"], v["title"]) for v in course_lessons(cid)]
    if cid == "foundations":
        # в курсе математики заголовки карточек короче названий в YAML: сверяем только номера
        if [n for n, _ in found] != [n for n, _ in expected]:
            err(f"{cid}: номера карточек не совпадают с module.yaml")
        return
    if found != expected:
        missing = [e for e in expected if e not in found]
        extra = [f for f in found if f not in expected]
        err(f"{cid}: карточки ≠ module.yaml; нет: {missing[:3]}; лишние: {extra[:3]}")


check_cards("foundations", sorted((ROOT / "docs/program").glob("0*.md")))
for cid in courses:
    if cid == "foundations":
        continue
    cards = sorted((ROOT / "docs/program" / cid).glob("0*.md"))
    if cards:
        check_cards(cid, cards)
    readme = ROOT / "docs/program" / cid / "README.md"
    if not readme.exists():
        err(f"{cid}: нет программы {readme.relative_to(ROOT)}")
        continue
    rows = re.findall(r"^\| (\d+\.\d+) ", readme.read_text(), flags=re.M)
    if rows != [v["number"] for v in course_lessons(cid)]:
        err(f"{cid}: таблица уроков в README ≠ module.yaml")

# ───────── план ─────────
plan_path = ROOT / "docs/implementation/PLAN.md"
plan = plan_path.read_text()
seen: dict[str, int] = {}
for course, num, title, key in re.findall(
    r"^- \[[ x~!u]\] L-(?:([a-z][a-z-]*[a-z])-)?([\dIVX]+\.\d+)\. (.*?) — `([\w/-]+)`", plan, flags=re.M
):
    full = key if course else f"foundations/{key}"
    seen[full] = seen.get(full, 0) + 1
    le = lessons.get(full)
    if not le:
        err(f"план: урок {key} не найден в content/courses")
        continue
    if le["number"] != num or le["title"] != title.removesuffix(" ★"):
        err(f"план: {full} — номер или название не совпадают с module.yaml")
for key in lessons:
    if seen.get(key, 0) != 1:
        err(f"план: урок {key} встречается {seen.get(key, 0)} раз")

ids = re.findall(r"^### (S\d\.(?:\d\d|L[A-Z0-9]))\.", plan, flags=re.M)
for d in {i for i in ids if ids.count(i) > 1}:
    err(f"план: дубль ID {d}")
order = {t: i for i, t in enumerate(ids)}
for m in re.finditer(r"^### (S\d\.(?:\d\d|L[A-Z0-9]))\..*?(?=^### |^## |\Z)", plan, flags=re.M | re.S):
    tid, body = m.group(1), m.group(0)
    dep = re.search(r"\*\*Зависит от:\*\* ([^·\n]*)", body)
    if not dep:
        err(f"{tid}: нет «Зависит от»")
        continue
    for d in re.findall(r"S\d\.(?:\d\d|L[A-Z0-9])", dep.group(1)):
        if d not in order:
            err(f"{tid}: зависимость {d} не существует")
        elif order[d] >= order[tid]:
            err(f"{tid}: зависимость {d} идёт позже")
    if not re.search(r"\*\*Статус:\*\* \[[ x~!u]\]", body):
        err(f"{tid}: нет статуса")
    ctx = re.search(r"\*\*Контекст[^:]*:\*\* ([^\n]*)", body)
    if ctx:
        for c in re.findall(r"context/([\w-]+\.md)", ctx.group(1)):
            if not (ROOT / "docs/implementation/context" / c).exists():
                err(f"{tid}: нет пакета {c}")
        for f in re.findall(r"`((?:docs|src|prototype|code|content|scripts|notebooks)/[\w./-]+\.\w+)`", ctx.group(1)):
            if not (ROOT / f).exists():
                err(f"{tid}: в «Контексте» нет файла {f}")
now = re.search(r"\*\*Задача:\*\* (S\d\.\d\d)", plan)
if not now or now.group(1) not in order:
    err("план: в блоке «Сейчас» задача не найдена")

# ───────── ссылки на ID задач ─────────
docs = list((ROOT / "docs").rglob("*.md")) + list((ROOT / ".claude/skills").rglob("*.md")) + [ROOT / "CLAUDE.md"]
for p in docs:
    if p.name in ("PLAN.md", "LOG.md"):  # журнал — история, там бывают удалённые задачи
        continue
    for d in set(re.findall(r"\bS\d\.(?:\d\d|L[A-Z0-9])\b", p.read_text())):
        if d not in order:
            err(f"{p.relative_to(ROOT)}: задачи {d} нет в плане")

# ───────── переименования ─────────
redirects = yaml.safe_load((ROOT / "content/redirects.yaml").read_text()) or {}
for old, new in (redirects.get("lessons") or {}).items():
    if new not in lessons:
        err(f"redirects: цель {new} не существует")
    if old in lessons:
        err(f"redirects: старый ключ {old} всё ещё занят уроком")

# ───────── ссылки в Markdown ─────────
SKIP = ("node_modules", ".git", "venv", "frontend-design", "design-critique", "design-system",
        "accessibility-review", "ux-copy")
for p in ROOT.rglob("*.md"):
    if any(s in p.parts for s in SKIP):
        continue
    for href in re.findall(r"\]\(([^)#\s]+)(?:#[^)]*)?\)", p.read_text()):
        if re.match(r"[a-z]+:", href):
            continue
        if not (p.parent / href).exists():
            err(f"битая ссылка {p.relative_to(ROOT)}: {href}")

n_req = sum(not v["optional"] for v in lessons.values())
print(f"курсов: {len(courses)} · уроков: {len(lessons)} ({n_req} обязательных) · задач: {len(ids)}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("ошибок нет")
