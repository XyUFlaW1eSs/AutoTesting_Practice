# 功能测试用例设计（Functional）

视角：API 调用方。验证需求、接口契约、业务状态和完整流程。建议使用 pytest + requests 调用运行中的 API。

## A. 服务与查询接口

| ID | 优先级 | 场景/步骤 | 预期结果 |
|---|---|---|---|
| FT-API-001 | P0 | GET /health | 200；status=ok、service=insurance-api |
| FT-API-002 | P1 | GET /api/applications | 200；JSON 数组，含 id、applicantName、age、productCode、premium、status、createdAt |
| FT-API-003 | P1 | GET /api/policies | 200；保单字段及关联申请人姓名、保费正确 |
| FT-API-004 | P1 | GET /api/policies/{存在的policyId} | 200；返回对应保单详情 |
| FT-API-005 | P1 | GET /api/policies/{不存在的policyId} | 404；业务错误清晰，无堆栈 |
| FT-API-006 | P1 | 不存在的 applicationId 调用核保/支付 | 404；无数据变化 |

## B. 创建申请与校验

| ID | 优先级 | 场景/步骤 | 预期结果 |
|---|---|---|---|
| FT-APP-001 | P0 | 提交完整合法申请 | 201；返回 ID/字段；状态 Pending |
| FT-APP-002 | P1 | 年龄 18、60 | 均创建成功，边界包含 |
| FT-APP-003 | P1 | 年龄 17、61、0、负数 | 400；错误指向 age；无记录新增 |
| FT-APP-004 | P1 | 姓名缺失、null、空串、全空格 | 400；错误指向 applicantName |
| FT-APP-005 | P1 | 姓名长度 100 / 101 | 100 成功；101 返回 400 |
| FT-APP-006 | P1 | 产品代码缺失、null、空串、全空格 | 400；错误指向 productCode |
| FT-APP-007 | P1 | 产品代码首尾空格及小写 | 创建成功，返回值 Trim 并转大写 |
| FT-APP-008 | P1 | 保费 0、负数、0.001 | 400；错误指向 premium |
| FT-APP-009 | P1 | 保费 0.01、1250.00 | 创建成功且金额准确 |
| FT-APP-010 | P1 | 无 JSON body 或无效 JSON | 4xx 客户端错误；服务不崩溃；具体响应契约需实测确认 |
| FT-APP-011 | P1 | age/premium 类型错误，例如 "abc" | 4xx；无记录新增；不返回 500 |
| FT-APP-012 | P2 | 多传未知字段 | 按正式契约接受忽略或拒绝；记录当前行为 |
| FT-APP-013 | P2 | 产品代码超过数据库 30 字符 | 期望明确 4xx 而非 500；当前 Handler 未显式校验，重点验证并记录 |
| FT-APP-014 | P2 | 保费超过 NUMERIC(12,2) 范围 | 期望明确 4xx 而非 500；当前 Handler 未显式校验上限 |

## C. 核保状态

| ID | 优先级 | 场景/步骤 | 预期结果 |
|---|---|---|---|
| FT-UW-001 | P0 | Pending + approve=true | 200；状态 Approved |
| FT-UW-002 | P0 | Pending + approve=false | 200；状态 Rejected |
| FT-UW-003 | P0 | 先通过再尝试拒绝 | 第二次 409；状态仍 Approved |
| FT-UW-004 | P0 | 先拒绝再尝试通过 | 第二次 409；状态仍 Rejected |
| FT-UW-005 | P1 | 不存在的申请 ID 核保 | 404 |
| FT-UW-006 | P2 | note 缺失/null/中文/长文本 | 不应意外改变核保结果；当前仅回显且不持久化，需确认其业务含义 |

## D. 支付、幂等与签发

| ID | 优先级 | 场景/步骤 | 预期结果 |
|---|---|---|---|
| FT-PAY-001 | P0 | Pending 申请支付 | 409；无支付/保单生成 |
| FT-PAY-002 | P0 | Rejected 申请支付 | 409；无支付/保单生成 |
| FT-PAY-003 | P0 | Approved 申请首次支付 | 200；Succeeded、Active、duplicate=false；返回 paymentId/policyNumber |
| FT-PAY-004 | P0 | 相同申请、相同幂等键重复支付 | 200；第二次 duplicate=true；paymentId/policyNumber 一致；仅一张保单 |
| FT-PAY-005 | P0 | 申请 A 用过的键再用于申请 B | 409；不泄露 A 的结果；B 不被标记为 Paid |
| FT-PAY-006 | P1 | 同一申请使用不同键再次支付 | 不得重复签发；返回契约需明确；数据库只能有一张保单 |
| FT-PAY-007 | P1 | 支付不存在的申请 ID | 404 |
| FT-PAY-008 | P1 | 幂等键缺失/空/空白 | 当前会生成 application-{id}-payment；验证重试安全，并确认是否符合需求 |
| FT-PAY-009 | P1 | 幂等键首尾空格 | 当前 Trim 后使用；规范化键不能导致重复支付 |
| FT-PAY-010 | P1 | 幂等键超过数据库 100 字符 | 期望有意义的 4xx，不应未处理 500；当前 API 未显式校验 |
| FT-PAY-011 | P0 | 支付后查申请和保单列表/详情 | 申请 Paid；一张 Active 保单；申请人、保费一致 |
| FT-PAY-012 | P0 | 并发重复支付同一申请 | 最多一笔支付/一张保单；响应满足并发契约，无未处理 500 |

## E. 契约、健壮性和安全

| ID | 优先级 | 场景/步骤 | 预期结果/说明 |
|---|---|---|---|
| FT-CON-001 | P1 | 检查所有成功响应 | JSON Content-Type、字段命名/类型符合契约，ID 为正数 |
| FT-CON-002 | P1 | 检查 400/404/409 错误响应 | 状态码语义正确、错误体可解析、不泄露堆栈/连接串/SQL |
| FT-CON-003 | P1 | 使用零、负数、极大值 ID 查询或操作 | 不返回 500；不存在资源按约定处理 |
| FT-CON-004 | P2 | 支付请求超时后用相同键重试 | 最终最多一笔支付和一张保单 |
| FT-SEC-001 | P0 上线阻断 | 未认证访问申请/保单/支付 API | 当前没有认证/授权，记录为安全缺口；补齐前不得视为生产就绪 |
| FT-SEC-002 | P1 | 姓名/产品代码含 SQL 片段、特殊 Unicode | 不导致 SQL 注入或服务异常；展示层 XSS 另测 |
| FT-SEC-003 | P0 上线阻断 | 尝试读取其他用户的可猜测保单 ID | 当前无用户身份/对象级授权，无法证明隔离；实现授权后补正反向授权测试 |

## 必跑主流程

1. 创建申请 → 201、Pending、字段规范化。
2. 核保通过 → 200、Approved。
3. 支付 → 200、Succeeded、Active、duplicate=false。
4. 查询申请 → Paid。
5. 查询保单列表和详情 → 保单号、申请人、保费一致，仅一张保单。
6. 同键重试支付 → 不新增支付/保单。
7. 核保拒绝分支 → Rejected 后支付必须失败且无副作用。

## 执行与缺陷判定

现有 pytest 已覆盖健康检查、年龄/保费负向、支付签发、Pending/Rejected 禁止支付、重复核保、同键重复支付。新增用例执行后，需区分正式需求缺陷、需求待确认和未来功能。当前无产品目录校验、支付失败模拟、保单撤销、分页及认证授权；不要将不存在的接口当作当前自动化可直接执行的用例。