# Insurance Lab API 测试用例与自动化测试

## 1. 测试资产结构

| 路径 | 用途 | 当前性质 |
|---|---|---|
| functional/CASE-CATALOG.md | API 功能用例总索引 | 导航索引 |
| functional/api-health.md | GET /health | 按接口拆分的详细 Case |
| functional/api-applications-list.md | GET /api/applications | 按接口拆分的详细 Case |
| functional/api-applications-create.md | POST /api/applications | 按接口拆分的详细 Case |
| functional/api-underwriting.md | POST /api/applications/{id}/underwrite | 按接口拆分的详细 Case |
| functional/api-payment.md | POST /api/applications/{id}/pay | 按接口拆分的详细 Case |
| functional/api-policies-list.md | GET /api/policies | 按接口拆分的详细 Case |
| functional/api-policy-detail.md | GET /api/policies/{id} | 按接口拆分的详细 Case |
| functional/api-insurance-workflows.md | 跨接口业务流程 | 端到端 Case |
| unit/CASE-CATALOG.md | 纯业务规则与状态机测试设计 | 设计清单；需要规则抽取后由后端单元测试执行 |
| integration/CASE-CATALOG.md | EF Core、PostgreSQL、事务、约束和并发 | 集成测试设计清单 |
| test_insurance_api.py | 当前已有 pytest API 回归脚本 | 可执行自动化测试 |

## 2. 测试分类原则

| 分类 | 测试目标 | 验证对象 | 推荐方式 |
|---|---|---|---|
| Unit（单元测试） | 独立规则正确性，不依赖 HTTP 或真实数据库 | Validator、状态转换、幂等键规则 | 后端 C# 单元测试（建议 xUnit） |
| Integration（集成测试） | 验证多个技术组件协同正确 | API、EF Core、PostgreSQL、事务、唯一/外键约束 | pytest + requests + 专用测试库；必要时后端集成测试 |
| Functional API（接口功能测试） | 从调用方角度验证每个接口契约和业务结果 | HTTP 状态码、请求校验、响应字段、业务状态和副作用 | pytest + requests 调用真实 API |
| Workflow（端到端业务流） | 验证跨接口组合后业务不变量 | 创建→核保→支付→保单查询 | pytest + requests |

注意：当前业务规则直接写在 Program.cs 的 Minimal API Handler 中。unit 目录是设计清单，不要把 HTTP 请求测试改名为单元测试。

## 3. Case 编写标准

每条测试用例至少明确以下信息：

1. 唯一编号和标题；
2. 优先级（P0/P1/P2）与测试类型；
3. 前置条件；
4. 明确、可复现的测试数据；
5. 有序执行步骤；
6. 可判定的预期结果，包含状态码、关键响应字段、状态变化和数据副作用；
7. 当前实现状态：现状可验证、需求确认、实现风险或安全阻断；
8. 执行时记录 Pass / Fail / Blocked / Not Run，并关联缺陷编号。

优先级定义：
- P0：核心业务正确性、资金/保单一致性、状态机和安全上线阻断。
- P1：主要校验、接口契约、常见异常和数据一致性。
- P2：健壮性、极端输入、排序和补充回归。

## 4. 需求基线与判定原则

- 设计时结合需求/验收标准、Swagger/OpenAPI、后端实现和数据库约束。
- 需求与 Swagger 或代码不一致时，登记差异并澄清，不自动将当前代码行为视为正确需求。
- 文档中标注“实现风险”的用例，目的是暴露当前代码可能缺失的校验或异常处理；需运行验证并按已批准的需求判定缺陷。
- 没有实现的分页、筛选、保单撤销等能力不作为当前接口的既有能力测试。
- 当前代码未配置认证和对象级授权。真实业务数据上线前，必须确认安全需求并评估未授权访问风险。

## 5. 运行现有 pytest API 自动化

先启动 API，并确认配置指向专用测试数据库：

```powershell
python -m pip install -r projects/insurance-lab/tests/api/requirements.txt
$env:INSURANCE_API_BASE_URL = "http://localhost:5080"
python -m pytest projects/insurance-lab/tests/api/test_insurance_api.py -v
```

先检查用例能否被收集：

```powershell
python -m pytest projects/insurance-lab/tests/api --collect-only
```

不要对生产库或含个人数据的开发库运行写入型测试。使用 UUID/唯一幂等键；断言只针对本次创建的申请 ID，避免依赖固定 ID 或全表数量。

## 6. 当前 API 基线

- GET /health
- GET /api/applications
- POST /api/applications
- POST /api/applications/{id}/underwrite
- POST /api/applications/{id}/pay
- GET /api/policies
- GET /api/policies/{id}

以上接口清单根据当前后端 Program.cs 整理。实际执行前应再次核对 Swagger/OpenAPI 与最新代码。
