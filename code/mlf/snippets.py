"""Регионы сниппетов (code/snippets/**/*.py) — те же правила, что у сайта (src/lib/content/snippets.ts).

Регион — строки между ``# region имя`` и ``# endregion``; отступ региона снимается, пустые строки по краям — тоже.
Ссылка: ``la/normal_equations.py#data`` или несколько регионов подряд: ``…#data+solve``.
Неразрешённая ссылка — ``SnippetError``: сборка лабораторных падает с именем файла и списком регионов.
"""

from __future__ import annotations

import re
import textwrap
from pathlib import Path

SNIPPETS = Path(__file__).resolve().parents[1] / "snippets"
_START = re.compile(r"^\s*# region ([\w-]+)\s*$")
_END = re.compile(r"^\s*# endregion\b")


class SnippetError(ValueError):
    pass


def parse_regions(text: str, file: str) -> dict[str, str]:
    regions: dict[str, str] = {}
    problems: list[str] = []
    open_name: str | None = None
    open_line = 0
    body: list[str] = []
    for i, line in enumerate(text.split("\n"), 1):
        start = _START.match(line)
        if start:
            if open_name:
                problems.append(f"{file}:{i}: регион «{start[1]}» внутри незакрытого «{open_name}» (строка {open_line})")
            elif start[1] in regions:
                problems.append(f"{file}:{i}: регион «{start[1]}» повторяется")
            open_name, open_line, body = start[1], i, []
        elif _END.match(line):
            if not open_name:
                problems.append(f"{file}:{i}: # endregion без # region")
            else:
                regions[open_name] = textwrap.dedent("\n".join(body)).strip("\n")
                open_name = None
        elif open_name:
            body.append(line)
    if open_name:
        problems.append(f"{file}:{open_line}: регион «{open_name}» не закрыт (# endregion)")
    if problems:
        raise SnippetError("\n".join(problems))
    return regions


def load_snippet(ref: str, root: Path = SNIPPETS) -> str:
    """Код регионов по ссылке «путь#регион[+регион…]», через пустую строку."""
    file, _, spec = ref.partition("#")
    names = [n for n in spec.split("+") if n]
    if not file.endswith(".py") or ".." in file:
        raise SnippetError(f"сниппет «{ref}»: ожидается путь к .py внутри code/snippets")
    if not names:
        raise SnippetError(f"сниппет «{ref}»: после # укажите регион: {file}#имя")
    path = root / file
    if not path.exists():
        raise SnippetError(f"сниппет «{ref}»: файла code/snippets/{file} нет")
    regions = parse_regions(path.read_text(encoding="utf-8"), f"code/snippets/{file}")
    unknown = [n for n in names if n not in regions]
    if unknown:
        raise SnippetError(f"сниппет «{ref}»: нет региона {', '.join(f'«{n}»' for n in unknown)}; в файле есть: {', '.join(regions) or 'ни одного'}")
    return "\n\n".join(regions[n] for n in names)


_DIRECTIVE = re.compile(r"^(?P<indent>[ \t]*)# snippet: (?P<ref>\S+)[ \t]*$", re.M)


def expand(source: str, root: Path = SNIPPETS) -> str:
    """Заменяет строки ``# snippet: путь#регион`` кодом региона (с отступом строки и пометкой, откуда код)."""

    def repl(m: re.Match) -> str:
        indent = m["indent"]
        code = load_snippet(m["ref"], root)
        lines = [f"# из code/snippets/{m['ref'].replace('#', ', регион ')}"] + code.split("\n")
        return "\n".join(indent + line if line else line for line in lines)

    return _DIRECTIVE.sub(repl, source)
