# Insurance Lab API 测试用例

本目录按测试层级管理测试设计。

## 分类原则

| 分类 | 测试目标 | 验证对象 | 推荐方式 |
|---|---|---|---|
| unit | 单一规则/函数正确性，不依赖 HTTP 或真实数据库 | Validator、状态转换、金额规则、幂等键规范化 | 后端 C# 单元测试（建议 xUnit） |
| integration | API、EF Core、PostgreSQL、事务和约束协作 | 持久化、唯一/外键约束、事务回滚、并发、数据一致性 | pytest + requests + 专用测试库 |
| functional | 从 API 使用者视角验证需求与接口契约 | 状态码、响应字段、业务流程、负向场景 | pytest + requests 调用真实 API |

**重要：** 当前业务规则直接写在 Program.cs 的 Minimal API Handler 中。unit 目录目前是单元测试设计清单；要真正执行，应把规则抽取为可独立测试的 Validator/Domain Service，并在后端 C# 测试项目中测试。不要把 HTTP 请求测试改名为“单元测试”。

## 文件

- unit/CASE-CATALOG.md：纯规则、边界、状态转换。
- integration/CASE-CATALOG.md：数据库、事务、约束、并发。
- functional/CASE-CATALOG.md：接口契约、参数校验、完整业务流程。
- test_insurance_api.py：现有可执行 pytest API 回归，兼有功能/集成性质，暂时保留以免破坏 CI。

## 运行现有 API 自动化

确保 API 已启动，并且指向专用测试数据库：

```powershell
python -m pip install -r tests/api/requirements.txt
$env:INSURANCE_API_BASE_URL = "http://localhost:5080"
python -m pytest tests/api/test_insurance_api.py -v
```

禁止对生产库或含有个人数据的开发库运行测试。测试数据应使用 UUID/唯一幂等键，断言只针对本次创建的申请 ID，避免依赖固定 ID 或全表数量。

## 优先级与需求基线

P0：核心状态、支付/保单完整性、安全上线阻断项。P1：主要规则与接口契约。P2：健壮性及补充覆盖。

当前 productCode 只校验非空；幂等键为空时会生成默认键；保费最大值、产品代码长度、幂等键长度没有显式业务校验；API 尚无认证/对象级授权。相关用例应区分当前实现、需求待确认、缺陷和未来能力，不能把未确认的假设当作已批准需求。