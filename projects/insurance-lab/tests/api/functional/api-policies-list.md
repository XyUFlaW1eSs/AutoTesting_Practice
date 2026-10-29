# GET /api/policies — API 测试用例

## 接口契约基线

当前实现返回 HTTP 200 和保单 JSON 数组，按 IssuedAt 降序；每条记录包含 id、applicationId、policyNumber、status、issuedAt、applicantName、premium。当前没有分页、筛选或认证。

## 用例

### FT-POLLIST-001 — 查询保单列表成功

- 优先级：P0
- 类型：功能 / 契约
- 前置条件：API 可用；至少有一张测试保单。
- 数据：已有保单。
- 步骤：发送 GET /api/policies。
- 预期结果：HTTP 200；响应为 JSON 数组；每项包含 id、applicationId、policyNumber、status、issuedAt、applicantName、premium；字段类型正确；status 为有效状态。
- 状态：现状可验证。

### FT-POLLIST-002 — 空保单列表

- 优先级：P1
- 类型：边界
- 前置条件：专用测试数据库中没有保单。
- 数据：无。
- 步骤：发送 GET /api/policies。
- 预期结果：HTTP 200，响应为 []。
- 状态：现状可验证；不得清空共享数据库。

### FT-POLLIST-003 — 支付成功后列表出现一张保单

- 优先级：P0
- 类型：跨接口一致性
- 前置条件：已创建申请并核保通过。
- 数据：本次 applicationId。
- 步骤：支付成功后查询保单列表，按 applicationId 过滤。
- 预期结果：恰好一条保单；policyNumber 非空；状态 Active；applicantName 和 premium 与申请一致。
- 状态：现状可验证。

### FT-POLLIST-004 — 列表按签发时间降序

- 优先级：P1
- 类型：排序
- 前置条件：能创建多条申请并分别完成支付。
- 数据：至少三张签发时间可区分的保单。
- 步骤：按顺序签发保单，再查询列表。
- 预期结果：issuedAt 按降序排列，最新签发记录排在前面。
- 状态：现状可验证；相同时间戳之间的顺序未定义。

### FT-POLLIST-005 — 列表关联申请字段正确

- 优先级：P0
- 类型：数据关联
- 前置条件：已签发测试保单。
- 数据：记录该申请的 applicantName、premium 和 applicationId。
- 步骤：查询保单列表，找到对应保单。
- 预期结果：applicationId、applicantName、premium 与关联申请一致；不串到其他申请。
- 状态：现状可验证。

### FT-POLLIST-006 — 列表不存在重复保单

- 优先级：P0
- 类型：数据完整性
- 前置条件：一条申请完成支付并重复请求同一幂等键。
- 数据：本次 applicationId。
- 步骤：查询保单列表并统计该 applicationId 的保单数。
- 预期结果：保单数为 1。
- 状态：现状可验证。

### FT-POLLIST-007 — 未知查询参数处理

- 优先级：P2
- 类型：健壮性 / 需求确认
- 前置条件：API 可用。
- 数据：GET /api/policies?unexpected=value。
- 步骤：发送请求并与无查询参数结果比较。
- 预期结果：按契约忽略或拒绝未知参数；不得返回 500。当前 handler 不读取该参数。
- 状态：需求确认。
