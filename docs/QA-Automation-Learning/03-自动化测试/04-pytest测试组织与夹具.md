# 第 4 课：pytest 测试组织与夹具

## 目标
使用 fixture、conftest、标记、参数化和清理逻辑组织可维护测试。

## 推荐结构
```text
insurance-tests/
  tests/
    conftest.py
    test_policy_rules.py
  data/
    applicants.json
  requirements.txt
  pytest.ini
```

## fixture 示例
```python
# tests/conftest.py
import pytest

@pytest.fixture
def valid_applicant():
    return {"name": "Lin", "age": 30, "premium": "1280.50"}
```
```python
# tests/test_applicant.py
def test_applicant_age_is_valid(valid_applicant):
    assert 18 <= valid_applicant["age"] <= 60
```
fixture 是可复用准备逻辑。函数作用域通常有助于隔离状态；更宽作用域需谨慎，以免测试互相影响。

## yield 清理
```python
import pytest

@pytest.fixture
def temporary_record():
    record = {"id": "TEMP-001", "status": "draft"}
    yield record
    # 正式项目在这里清理临时文件或测试记录
```
yield 前执行准备，yield 后执行清理。

## pytest.ini
```ini
[pytest]
testpaths = tests
python_files = test_*.py
addopts = -ra
markers =
    smoke: 核心冒烟测试
    regression: 回归测试
    integration: 依赖外部服务的集成测试
```
执行 `python -m pytest -m smoke` 只选择 smoke 标记用例。

## 常见反模式
测试通过全局变量传递结果；用例依赖执行顺序；fixture 隐藏太多业务动作；捕获所有异常后仍报告成功。

## 练习
用 fixture 生成有效申请；参数化年龄边界；模拟临时文件创建/清理；分组执行冒烟和回归。

## 验收标准
能解释 fixture 的作用域、准备与清理；能按标记选择测试；用例之间尽量独立。

下一课：[requests 接口自动化](05-接口自动化requests.md)
