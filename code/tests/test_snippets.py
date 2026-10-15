"""Регионы сниппетов в Python совпадают с сайтом (src/lib/content/snippets.test.ts): та же фикстура, те же ошибки."""

from pathlib import Path

import pytest

from mlf.snippets import SnippetError, expand, load_snippet, parse_regions

FIXTURE = Path(__file__).resolve().parents[2] / "tests/fixtures/snippets/la/demo.py"


def test_region_inside_function_becomes_top_level():
    regions = parse_regions(FIXTURE.read_text(encoding="utf-8"), "demo.py")
    assert regions["show"] == 'print(X.shape)\n\nprint("ok")'
    assert regions["data"] == "X = np.ones((3, 2))"


@pytest.mark.parametrize(
    ("text", "error"),
    [
        ("# region a\n# region b\n# endregion\n", "x.py:2: регион «b» внутри незакрытого «a»"),
        ("# region a\nx = 1\n", "x.py:1: регион «a» не закрыт"),
        ("# endregion\n", "x.py:1: # endregion без # region"),
        ("# region a\n# endregion\n# region a\n# endregion\n", "x.py:3: регион «a» повторяется"),
    ],
)
def test_markup_errors(text, error):
    with pytest.raises(SnippetError, match=error):
        parse_regions(text, "x.py")


def test_unknown_region_lists_existing_ones():
    with pytest.raises(SnippetError, match="нет региона «solv»; в файле есть: data, solve, loss, demo"):
        load_snippet("la/normal_equations.py#solv")


def test_directive_expands_with_origin_comment_and_indent():
    out = expand("def f():\n    # snippet: la/normal_equations.py#solve\n")
    assert "    # из code/snippets/la/normal_equations.py, регион solve\n    def normal_equations(" in out
    assert "# snippet:" not in out
