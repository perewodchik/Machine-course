"""Собирает лабораторные из notebooks/src/**/*.py (Jupytext, формат percent).

- notebooks/<путь>.ipynb — версия для ученика: блоки решений заменены на заглушки, выходы пустые;
- --solutions DIR — версия с решениями для проверки в CI (pytest --nbmake).

Решение в исходнике размечается строками «# BEGIN SOLUTION» и «# END SOLUTION».
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import jupytext

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "notebooks" / "src"
SOLUTION = re.compile(r"^(?P<indent>[ \t]*)# BEGIN SOLUTION\n.*?^[ \t]*# END SOLUTION\n?", re.M | re.S)


def strip_solutions(source: str) -> str:
    def stub(match: re.Match) -> str:
        indent = match.group("indent")
        return f"{indent}# Ваш код здесь\n{indent}raise NotImplementedError\n"
    return SOLUTION.sub(stub, source)


def keep_solutions(source: str) -> str:
    return re.sub(r"^[ \t]*# (BEGIN|END) SOLUTION\n", "", source, flags=re.M)


def build(out_dir: Path, transform) -> list[Path]:
    written = []
    for src in sorted(SRC.rglob("*.py")):
        nb = jupytext.read(src)
        for cell in nb.cells:
            if cell.cell_type == "code":
                cell.source = transform(cell.source + "\n").rstrip("\n")
                cell.outputs, cell.execution_count = [], None
        target = out_dir / src.relative_to(SRC).with_suffix(".ipynb")
        target.parent.mkdir(parents=True, exist_ok=True)
        jupytext.write(nb, target)
        written.append(target)
    return written


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--solutions", type=Path, help="куда сложить версию с решениями (для CI)")
    args = parser.parse_args()
    for path in build(ROOT / "notebooks", strip_solutions):
        print("ученик:", path.relative_to(ROOT))
    if args.solutions:
        for path in build(args.solutions, keep_solutions):
            print("решения:", path)
