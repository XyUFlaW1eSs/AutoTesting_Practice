# pytest 完整工程课程

官方参考：[完整文档](https://docs.pytest.org/en/stable/contents.html)、[Good Practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html)、[Fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)。

## 课 1：安装、测试发现与执行
学习测试文件/函数命名、收集机制、运行目录/文件/单个测试、-k、-m、-q、-v、--collect-only 和退出码。
    def test_health_check():
        assert 200 == 200
练习：运行单个文件、单个函数和按名称筛选的测试；解释为何测试未被收集。

## 课 2：断言与异常
使用 assert 让 pytest 展示断言差异；用 raises 检查预期异常类型和消息；浮点数用 approx，精确金额用 Decimal。
    import pytest
    def parse_age(raw):
        if not raw.isdigit():
            raise ValueError("age must be numeric")
        return int(raw)
    def test_invalid_age():
        with pytest.raises(ValueError, match="numeric"):
            parse_age("unknown")
练习：为缺失参数、错误类型和边界写断言。

## 课 3：参数化
学习 parametrize、参数名、参数组、ID、边界数据驱动。不同流程不应硬塞进一个巨大参数化函数。
    import pytest
    @pytest.mark.parametrize(
        ("age", "expected"),
        [(17, False), (18, True), (60, True), (61, False)],
        ids=["below-min", "min", "max", "above-max"],
    )
    def test_age_eligibility(age, expected):
        assert (18 <= age <= 60) is expected
练习：金额、状态、角色各建一组参数化用例。

## 课 4：Fixture 与依赖
fixture 通过函数参数注入，集中管理 setup。fixture 应职责明确，不应偷偷做大量不可见工作。
    import pytest
    @pytest.fixture
    def approved_application():
        return {"id": "APP-TEST-01", "status": "approved"}
    def test_can_pay_only_approved(approved_application):
        assert approved_application["status"] == "approved"
练习：建立申请、核保通过、支付成功 fixture，并明确依赖。

## 课 5：作用域与清理
学习 function/class/module/session 作用域、yield teardown、资源清理顺序。作用域越大越需要谨慎共享状态。
    import pytest
    @pytest.fixture
    def temporary_record():
        record = {"id": "APP-TEST-02", "deleted": False}
        yield record
        record["deleted"] = True
此例只演示生命周期；真实数据库清理应通过隔离测试库、事务或测试 API 实现。
练习：创建临时文件、触发断言失败、验证文件仍被清理。

## 课 6：conftest、配置和标记
学习 conftest.py 可见范围、pytest.ini/pyproject.toml、注册 marker、smoke/regression/api/ui/slow 分组。练习：分别运行冒烟集和回归集，检查未知 marker。

## 课 7：测试隔离与数据管理
测试不能依赖运行顺序；避免可变全局变量；每条测试使用独立或可重复的数据；明确清理策略；隔离同时涉及浏览器状态、服务端数据和外部依赖。
练习：先故意让两条测试共享可变列表，再修复顺序依赖。

## 课 8：Monkeypatch 与 Mock
适合替换环境变量、时间、网络边界或外部服务；检查调用次数、参数、返回值与异常。不要 mock 被测核心逻辑本身。
    def load_mode():
        import os
        return os.getenv("APP_MODE", "test")
    def test_load_mode(monkeypatch):
        monkeypatch.setenv("APP_MODE", "qa")
        assert load_mode() == "qa"
练习：模拟支付网关超时，验证系统进入明确待确认状态；不要把 mock 测试误认为真实集成测试。

## 课 9：临时文件与数据驱动
学习 tmp_path、tmp_path_factory、JSON/CSV 测试数据、数据工厂、失败时最小化复现。练习：测试合法 JSON 和损坏 JSON。

## 课 10：skip、xfail 与条件执行
理解 skip、skipif、xfail。不要为了 CI 变绿随意跳过测试；预期失败必须写原因和移除条件。
练习：对依赖外部环境的集成测试做条件跳过，并确认报告可见。

## 课 11：插件与报告
理解插件的能力与维护成本；JUnit XML 用于 CI 汇总；截图、日志、请求/响应要关联用例 ID。运行：
    python -m pytest -q --junitxml=artifacts/junit.xml
练习：生成报告并解释 failed、error、skipped 的区别。

## 课 12：并行、重试与不稳定测试
并行可能暴露共享数据竞争；唯一测试数据和隔离至关重要。重试只能辅助诊断，不能掩盖 flaky。区分产品缺陷、测试代码缺陷、环境故障和数据污染。

## 课 13：项目结构
    tests/
      unit/
      api/
      integration/
      ui/
      conftest.py
    src/
      rules/
      clients/
      services/
    test-data/
    pytest.ini
按测试层级或业务能力组织；共享代码放在明确模块，避免复制请求、认证和断言逻辑。

## 课 14：失败诊断
常用命令：python -m pytest -q；python -m pytest -x；python -m pytest --lf；python -m pytest --collect-only；python -m pytest -vv --tb=long。
排查顺序：重现 → 阅读断言差异 → 检查输入和 fixture → 检查环境依赖 → 最小化测试 → 分类根因。

## 结业任务
规则模块至少 25 条测试，含参数化、fixture、异常、临时文件和 marker；生成 JUnit XML；证明单独运行时不依赖其他测试；提交一份失败分析记录，包含现象、根因分类、修复和回归范围。