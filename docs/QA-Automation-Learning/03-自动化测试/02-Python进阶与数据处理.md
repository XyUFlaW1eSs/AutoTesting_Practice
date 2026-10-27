# 第 2 课：Python 进阶与数据处理

## 目标
处理 JSON、文件、模块、Decimal、环境配置；理解类型标注与基础数据类。

## JSON 读写
```python
import json

raw = '{"applicant": {"name": "Lin", "age": 30}, "premium": "1280.50"}'
data = json.loads(raw)
assert data["applicant"]["age"] == 30
print(json.dumps(data, ensure_ascii=False, indent=2))
```
API 数据常用 JSON 表达。要测试字段缺失、null、错误类型和编码情况。

## 文件测试数据
```python
import json
from pathlib import Path

records = json.loads(Path("data/applicants.json").read_text(encoding="utf-8"))
for record in records:
    print(record["case_id"], record["age"], record["expected"])
```
data/applicants.json 示例：
```json
[
  {"case_id":"AGE-01","age":18,"expected":true},
  {"case_id":"AGE-02","age":17,"expected":false}
]
```

## 金额精度
```python
from decimal import Decimal
premium = Decimal("1280.50")
fee = Decimal("20.00")
assert premium + fee == Decimal("1300.50")
```
使用字符串创建 Decimal，避免 float 转换带来的精度问题。

## 数据类
```python
from dataclasses import dataclass

@dataclass
class Applicant:
    name: str
    age: int

applicant = Applicant("Lin", 30)
assert applicant.age == 30
```
类适合把相关数据和行为组织起来；简单场景不必过度面向对象化。

## 虚拟环境
```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install pytest requests
```
不要把 .venv 提交到 Git。依赖可记录在 requirements.txt。

## 练习
读取 JSON 中 5 条投保数据；用 Decimal 检查金额；把校验函数拆到独立模块；处理缺字段、错误类型和非法 JSON。

## 验收标准
能读写 JSON、管理依赖、组织模块，并说明数据与代码分离的好处。

下一课：[pytest 入门](03-pytest入门.md)
