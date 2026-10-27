# Python 语言基础完整课程

课程以 [Python Tutorial](https://docs.python.org/3/tutorial/)、[内置函数](https://docs.python.org/3/library/functions.html)、[语言参考](https://docs.python.org/3/reference/index.html) 为主线，重点练习测试工程常用能力。每课应创建脚本运行，不只阅读代码。

## 课 0：解释器、脚本与环境
学习解释器、REPL、终端、工作目录、PATH、缩进、文件编码、模块导入。运行 python --version、python -m pip --version、where python。避免把文件命名为 json.py、requests.py 等，以免遮蔽第三方库。
练习：创建 hello_qa.py 输出项目名、学习阶段和一条测试原则；从终端运行并解释当前工作目录。

## 课 1：变量与基本类型
学习对象绑定、int、float、str、bool、None、type、isinstance、类型转换、真值判断、可变与不可变对象。
    age_text = "35"
    age = int(age_text)
    eligible = 18 <= age <= 60
    assert eligible is True
注意 input() 返回字符串；字符串 "False" 仍是真值；不要把非法输入静默转换成 0。
练习：写年龄解析函数，处理空值、非数字和边界。

## 课 2：字符串
学习索引、切片、转义、原始字符串、f-string、strip、split、join、大小写、Unicode、日志脱敏。明确业务是否允许大小写和空格差异。
    policy_id = " POL-TEST-001 "
    normalized = policy_id.strip().upper()
    assert normalized == "POL-TEST-001"
练习：处理测试报告标题和虚构 ID；解释简单替换为何不能代替完整的秘密信息管理。

## 课 3：数字与金额
学习算术、比较、逻辑运算、优先级、短路、round 与浮点精度。金额使用 Decimal 并明确舍入规则。
    from decimal import Decimal, ROUND_HALF_UP
    premium = Decimal("1200.005")
    rounded = premium.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    assert rounded == Decimal("1200.01")
练习：测试 0、负数、0.01、1200.00、非法字符串，先写业务规则再实现。

## 课 4：条件分支
学习 if/elif/else、复合条件、早返回、分支覆盖、规则与 I/O 分离。
    def validate_age(age: int) -> tuple[bool, str]:
        if age < 18:
            return False, "age_below_minimum"
        if age > 60:
            return False, "age_above_maximum"
        return True, "eligible"
练习：覆盖 17、18、60、61；增加职业类别规则并保持逻辑可读。

## 课 5：循环
学习 for、while、range、enumerate、zip、break、continue、循环 else；遍历期间修改列表的风险；重试循环必须有上限。
    results = [{"case": "TC-01", "status": "passed"},
               {"case": "TC-02", "status": "failed"}]
    failed = [item["case"] for item in results if item["status"] != "passed"]
    assert failed == ["TC-02"]
练习：统计通过、失败、阻塞数量；空输入不应导致除零。

## 课 6：容器
学习 list、tuple、set、dict、切片、排序、推导式、嵌套数据、get、in、items、浅拷贝、缺失键与 None 的区别。
    case = {"id": "TC-INS-001", "priority": "P1", "tags": ["api", "regression"]}
    assert "api" in case["tags"]
练习：用字典列表保存 10 条用例，按优先级筛选，统计模块数量，并校验必需字段。

## 课 7：函数
学习参数、返回值、默认参数、关键字参数、作用域、文档字符串、类型提示、纯函数、异常边界。避免可变默认参数，例如 def add_case(case, cases=[])。
    def normalize_status(status: str) -> str:
        return status.strip().lower()
    assert normalize_status(" Approved ") == "approved"
练习：把年龄、金额、状态规则拆成独立函数，每个函数至少 4 个输入。

## 课 8：模块与包
学习模块、包、__name__ == "__main__"、绝对/相对导入、模块搜索路径、循环导入。导入模块时不应自动发 HTTP 请求、写数据库或执行全套测试。
练习：将规则函数放入独立模块，从测试文件导入并运行。

## 课 9：异常与资源清理
学习语法错误与运行时异常、try/except/else/finally、raise、自定义异常、异常链、with。捕获具体异常，不用裸 except，不把失败伪装成默认成功值。
    from decimal import Decimal, InvalidOperation
    def parse_premium(raw: str) -> Decimal:
        try:
            value = Decimal(raw)
        except InvalidOperation as exc:
            raise ValueError("premium must be a decimal number") from exc
        if not value.is_finite() or value <= 0:
            raise ValueError("premium must be finite and positive")
        return value
练习：处理缺失字段、格式错误和非正金额，并验证调用方能看到明确原因。

## 课 10：文件、JSON 与 CSV
学习 pathlib、相对路径、with open、UTF-8、JSON 加载/序列化、CSV DictReader/DictWriter、文件不存在和格式错误。
    import json
    from pathlib import Path
    payload = {"application_id": "APP-TEST-001", "premium": "1200.00"}
    path = Path("test-data.json")
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded["premium"] == "1200.00"
练习：读取投保测试数据并校验必填字段、类型、枚举；为坏文件给出有用错误信息。

## 课 11：类与数据模型
学习类、实例、方法、实例/类属性、组合与继承、dataclass、不可变模型。不要为简单测试数据过度设计继承。
    from dataclasses import dataclass
    from decimal import Decimal
    @dataclass(frozen=True)
    class Application:
        application_id: str
        age: int
        premium: Decimal
练习：为投保申请建模，并比较字典与 dataclass 的可读性。

## 课 12：标准库与调试
学习 datetime、pathlib、json、csv、logging、re、collections、itertools；日志级别、traceback、断点、最小复现。正则表达式适合文本模式，不应替代 HTML 解析器。
    import logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logger = logging.getLogger(__name__)
    logger.info("Starting test case_id=%s", "TC-INS-001")
练习：日志记录用例 ID、虚构申请 ID、步骤和异常堆栈，不记录 Token/密码。

## 课 13：依赖与代码质量
学习 venv、pip、依赖清单、pip check、格式化、静态检查、类型提示、命名和函数职责。环境应可从 README 重建。
练习：建立虚拟环境和依赖文件，在全新环境按文档安装并运行。

## Python 基础阶段总作业
实现投保规则模块：年龄边界、保费解析、申请状态校验、JSON 测试数据加载、明确异常和日志，至少 15 个输入场景。验收：无隐藏 I/O 副作用；非法输入不被静默接受；金额不使用 float 精确比较；规则可被 pytest 导入。