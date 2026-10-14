import numpy as np
import pytest

from mlf import check


def test_shape_hint_for_column_vector():
    with pytest.raises(check.CheckFailed, match=r"\(n,\) и \(n, 1\)"):
        check.shape(np.zeros((3, 1)), (3,))


def test_close_passes_and_fails():
    check.close([1.0, 2.0], [1.0, 2.0])
    with pytest.raises(check.CheckFailed):
        check.close([1.0, 2.1], [1.0, 2.0])
