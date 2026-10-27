# 第 1 课：Python 基础

## 目标
掌握变量、类型、条件、循环、函数、容器和异常，能写简单测试数据校验程序。

## 变量与类型
```python
age = 30
premium_text = "1280.50"
applicant = {"name": "Lin", "age": age}
print(applicant["name"], type(age))
```
字典常用于表示 API JSON；金额计算建议用 Decimal，而不是 float。

## 条件与函数
```python
def is_eligible(age: int) -> bool:
    """本练习假设投保年龄为 18–60 周岁，含边界。"""
    return 18 <= age <= 60

assert is_eligible(18)
assert is_eligible(60)
assert not is_eligible(17)
```
函数将可复用规则封装。assert 适合入门演示，正式项目可由 pytest 收集并报告失败。

## 列表、字典和循环
```python
applicants = [
    {"name": "Lin", "age": 30},
    {"name": "Qin", "age": 17},
]
for item in applicants:
    print(item["name"], is_eligible(item["age"]))
```

## 异常处理
```python
def parse_age(raw: str) -> int:
    try:
        age = int(raw)
    except ValueError as exc:
        raise ValueError("年龄必须是整数") from exc
    if age < 0:
        raise ValueError("年龄不能为负数")
    return age
```
不要用宽泛的 `except:` 吞掉错误；只捕获预期异常并保留上下文。

## 学习步骤
1. 安装 Python 3.11+，确认 `python --version`。
2. 逐个运行示例，修改输入观察结果。
3. 编写 `validate_premium`，检查金额是否为正。
4. 为空值、字母、负数设计输入校验。

## 验收标准
能独立写函数、循环、字典和异常处理；能解释错误信息并调试语法问题。

下一课：[Python 进阶与数据处理](02-Python进阶与数据处理.md)
