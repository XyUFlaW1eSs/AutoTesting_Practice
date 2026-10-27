# 第 3 课：pytest 入门

## 目标
能创建和执行测试，使用断言、参数化、标记并阅读失败报告。

## 安装与运行
```powershell
python -m pip install pytest
python -m pytest -q
python -m pytest tests/test_policy_rules.py -v
```
默认按命名规则发现测试文件和函数。

## 第一个测试
```python
def is_eligible(age: int) -> bool:
    return 18 <= age <= 60

def test_minimum_age_is_allowed():
    assert is_eligible(18) is True

def test_underage_is_rejected():
    assert is_eligible(17) is False
```

## 参数化：把边界值转成自动化用例
```python
import pytest

@pytest.mark.parametrize(
    ("age", "expected"),
    [(17, False), (18, True), (30, True), (60, True), (61, False)],
)
def test_age_boundaries(age, expected):
    assert is_eligible(age) is expected
```
参数化让同一逻辑使用多组数据，适合边界、等价类和业务规则。

## 跳过用例
```python
import pytest

@pytest.mark.skip(reason="外部服务尚未准备")
def test_external_service():
    pass
```
不要为让流水线显示绿色而随意跳过失败用例；必须记录原因和恢复条件。

## 练习
为保费正数校验写 6 个参数化用例；故意改错预期值观察失败；学习只运行单个文件或单个测试。

## 验收标准
能独立创建 pytest 测试、执行、阅读 traceback，并说明断言验证的业务行为。

下一课：[pytest 测试组织与夹具](04-pytest测试组织与夹具.md)
