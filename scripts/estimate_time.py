"""Оценка времени уроков по фактическому объёму (S7.11, решение пользователя 19.11.2026: «честные часы»).

Запуск: python scripts/estimate_time.py            (таблица: урок, слова, задачи, виджеты, ячейки, оценка и minutes)
        python scripts/estimate_time.py --write    (переписать minutes в уроках, hours в module.yaml и «Время:» в карточках)
        python scripts/estimate_time.py --check    (minutes и hours совпадают с оценкой — вызывает check_consistency.py)

Модель времени (минуты; темп рефрешера: текст с формулами читается медленнее прозы):
- текст: слова прозы / 110 в минуту, плюс 0.1 мин на каждую строчную формулу $…$;
- выключная формула или вывод <Formula>: 3; блок (определение, ловушка) входит в текст;
- упражнение <Exercise>: 4, итоговая проверка урока (final): 3; задача из <ExerciseSet>: 2;
- виджет (любой другой компонент с n={…}): 6; ячейка Python с запуском: 5, листинг без запуска: 1.5;
- лабораторная (PyCode lab=… или OpenIn notebook=…): 45; диагностика <Diagnostic>: по её бюджету, 25.
Урок округляется до 5 минут. Модуль: hours = [⌊0.85·Σ/60⌋, ⌈1.2·Σ/60⌉] — разброс темпа учеников.
Курсы без написанных уроков (только программа) не трогаются: их часы — план, а не объём.
"""

from __future__ import annotations

import argparse
import math
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
COURSES = ROOT / "content" / "courses"

WPM = 110
PER = {"formula": 3.0, "exercise": 4.0, "final": 3.0, "set_item": 2.0, "widget": 6.0, "cell": 5.0, "listing": 1.5, "lab": 45.0, "diagnostic": 25.0, "inline": 0.1}
PEDAGOGY = {"Exercise", "ExerciseSet", "Note", "Block", "Formula", "Prereqs", "PyCode", "PyCell", "OpenIn", "Diagnostic", "Pilot", "Derivation", "SymbolLegend"}


def _tags(text: str) -> list[tuple[str, str]]:
    """Теги компонентов MDX с атрибутами (атрибуты могут занимать несколько строк и содержать {…})."""
    out = []
    for m in re.finditer(r"<([A-Z][A-Za-z]+)", text):
        i, depth = m.end(), 0
        while i < len(text):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            elif ch == ">" and depth == 0:
                break
            i += 1
        out.append((m.group(1), text[m.end() : i]))
    return out


def _prose(text: str) -> str:
    """Текст для чтения: без frontmatter, комментариев, кода, формул и JSX-атрибутов."""
    text = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.S)
    text = re.sub(r"\{/\*.*?\*/\}", " ", text, flags=re.S)
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.S)
    text = re.sub(r"\$[^$\n]+\$", " ", text)
    # содержимое задач и наборов задач считается временем задач, а не чтения
    text = re.sub(r"<(Exercise|ExerciseSet|Prereqs|PyCode|OpenIn|Diagnostic|Formula)\b.*?(/>|</\1>)", " ", text, flags=re.S)
    text = re.sub(r"<[^>]*>", " ", text)
    text = text.replace("&nbsp;", " ")
    return text


def estimate(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    words = len(re.findall(r"[A-Za-zА-Яа-яЁё0-9]+", _prose(text)))
    body = re.sub(r"\{/\*.*?\*/\}", " ", text, flags=re.S)
    inline = len(re.findall(r"(?<!\$)\$[^$\n]+\$(?!\$)", re.sub(r"<(Exercise|ExerciseSet)\b.*?(/>|</\1>)", " ", body, flags=re.S)))
    c = {"formula": 0, "exercise": 0, "final": 0, "set_item": 0, "widget": 0, "cell": 0, "listing": 0, "lab": 0, "diagnostic": 0}
    for name, attrs in _tags(body):
        if name == "Formula":
            c["formula"] += 1
        elif name == "Exercise":
            c["final" if re.search(r"\bfinal\b", attrs) else "exercise"] += 1
        elif name == "ExerciseSet":
            m = re.search(r"count=\{(\d+)\}", attrs)
            c["set_item"] += int(m.group(1)) if m else len(re.findall(r"\bgen:|\bkind:", attrs)) or 10
        elif name == "PyCode":
            c["cell" if re.search(r"\brun\b", attrs) else "listing"] += 1
            if "lab=" in attrs:
                c["lab"] += 1
        elif name == "OpenIn" and "notebook=" in attrs:
            c["lab"] += 1
        elif name == "Diagnostic":
            c["diagnostic"] += 1
        elif name not in PEDAGOGY and re.search(r"\bn=\{", attrs):
            c["widget"] += 1
    total = words / WPM + inline * PER["inline"] + sum(c[k] * PER[k] for k in c)
    fm = yaml.safe_load(text.split("---", 2)[1])
    return {"words": words, "inline": inline, **c, "estimate": max(15, 5 * round(total / 5)), "minutes": fm.get("minutes")}


def written_courses() -> list[Path]:
    return [c for c in sorted(COURSES.iterdir()) if any(c.glob("*/*.mdx"))]


def module_hours(minutes: list[int]) -> list[int]:
    s = sum(minutes) / 60
    return [max(1, math.floor(0.85 * s)), math.ceil(1.2 * s)]


def survey() -> list[tuple[Path, list[tuple[Path, dict]]]]:
    out = []
    for course in written_courses():
        for mod in sorted(p.parent for p in course.glob("*/module.yaml")):
            meta = yaml.safe_load((mod / "module.yaml").read_text(encoding="utf-8"))
            paths = [mod / f"{les['slug']}.mdx" for les in meta["lessons"]]
            lessons = [(path, estimate(path)) for path in paths if path.exists()]
            out.append((mod, lessons))
    return out


PROGRAM = {"foundations": sorted((ROOT / "docs" / "program").glob("0*.md")), "ml-basics": sorted((ROOT / "docs" / "program" / "ml-basics").glob("0*.md"))}
CARD_TIME = r"(^### {num}\. [^\n]*\n\n\*\*Время:\*\* )[^.]*?( ?(?:ч|мин))?\."


def card_time(minutes: int) -> str:
    """«Время:» в карточке программы — те же минуты, что у урока: «45 мин», «1 ч 10 мин», «2 ч»."""
    h, m = divmod(minutes, 60)
    return f"{minutes} мин" if h == 0 else f"{h} ч" if m == 0 else f"{h} ч {m} мин"


def _cards(apply: bool) -> list[str]:
    """Сверить (или переписать) «**Время:** …» в карточках docs/program с minutes уроков."""
    errs = []
    nums = {}
    for mod, lessons in survey():
        meta = yaml.safe_load((mod / "module.yaml").read_text(encoding="utf-8"))
        by_slug = {path.stem: e["estimate"] for path, e in lessons}
        for les in meta["lessons"]:
            if les["slug"] in by_slug:
                nums[(mod.parent.name, str(les["number"]))] = by_slug[les["slug"]]
    for (course, num), minutes in nums.items():
        for card in PROGRAM.get(course, []):
            text = card.read_text(encoding="utf-8")
            rx = re.compile(CARD_TIME.format(num=re.escape(num)), flags=re.M)
            m = rx.search(text)
            if not m:
                continue
            want = f"{m.group(1)}{card_time(minutes)}."
            if m.group(0) != want:
                if apply:
                    card.write_text(text[: m.start()] + want + text[m.end() :], encoding="utf-8")
                else:
                    errs.append(f"{card.relative_to(ROOT)}: у карточки {num} «Время» не совпадает с minutes урока ({card_time(minutes)})")
    return errs


def write() -> None:
    for mod, lessons in survey():
        for path, e in lessons:
            text = path.read_text(encoding="utf-8")
            path.write_text(re.sub(r"^minutes: \d+$", f"minutes: {e['estimate']}", text, count=1, flags=re.M), encoding="utf-8")
        y = mod / "module.yaml"
        h = module_hours([e["estimate"] for _, e in lessons])
        y.write_text(re.sub(r"^hours: \[\d+, \d+\]$", f"hours: [{h[0]}, {h[1]}]", y.read_text(encoding="utf-8"), count=1, flags=re.M), encoding="utf-8")
    _cards(apply=True)


def problems() -> list[str]:
    errs = []
    for mod, lessons in survey():
        for path, e in lessons:
            if e["minutes"] != e["estimate"]:
                errs.append(f"{path.relative_to(ROOT)}: minutes {e['minutes']}, по объёму {e['estimate']} (python scripts/estimate_time.py --write)")
        meta = yaml.safe_load((mod / "module.yaml").read_text(encoding="utf-8"))
        h = module_hours([e["estimate"] for _, e in lessons])
        if list(meta["hours"]) != h:
            errs.append(f"{(mod / 'module.yaml').relative_to(ROOT)}: hours {meta['hours']}, по объёму {h}")
    return errs + _cards(apply=False)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.write:
        write()
    if args.check:
        errs = problems()
        print("\n".join(errs) or "время уроков совпадает с объёмом")
        return 1 if errs else 0
    for mod, lessons in survey():
        total = sum(e["estimate"] for _, e in lessons)
        print(f"\n{mod.relative_to(COURSES)}: {total} мин, hours {module_hours([e['estimate'] for _, e in lessons])}")
        for path, e in lessons:
            print(f"  {path.stem:32} слов {e['words']:5} задач {e['exercise']:2}+{e['final']} набор {e['set_item']:2} виджетов {e['widget']} ячеек {e['cell']} лаб {e['lab']} → {e['estimate']:4} (было {e['minutes']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
