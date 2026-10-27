"""Small, isolated examples used by the QA learning CI workflow."""


def is_eligible(age: int) -> bool:
    """Practice-only rule: eligibility age is 18 through 60 inclusive."""
    return 18 <= age <= 60


def premium_is_valid(premium: str) -> bool:
    """Keep this tiny example dependency-free; production money uses Decimal."""
    try:
        return float(premium) > 0
    except (TypeError, ValueError):
        return False


def test_age_lower_boundary():
    assert is_eligible(18) is True


def test_age_upper_boundary():
    assert is_eligible(60) is True


def test_age_below_range_is_rejected():
    assert is_eligible(17) is False


def test_age_above_range_is_rejected():
    assert is_eligible(61) is False


def test_positive_premium_is_valid():
    assert premium_is_valid("1280.50") is True


def test_zero_premium_is_invalid():
    assert premium_is_valid("0") is False


def test_non_numeric_premium_is_invalid():
    assert premium_is_valid("invalid") is False
