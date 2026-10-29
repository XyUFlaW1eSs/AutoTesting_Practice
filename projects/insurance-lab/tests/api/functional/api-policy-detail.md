# GET /api/policies/{id} — API 测试用例

## 接口契约基线

路径中的 id 是 policyId，不是 applicationId。当前存在保单返回 HTTP 200 和保单字段；不存在返回 HTTP 404 与 message。字段包含 id、applicationId、policyNumber、status、issuedAt、applicantName、premium。

## 用例

### FT-POLDETAIL-001 — 查询已存在保单详情

- 优先级：P0
- 类型：功能 / 契约
- 前置条件：创建申请、核保通过并支付成功；记录返回的 policyNumber 和 applicationId。
- 数据：真实存在的 policyId。
- 步骤：GET /api/policies/{policyId}。
- 预期结果：HTTP 200；响应字段齐全且类型正确；id 等于 policyId；applicationId 等于原申请 ID；policyNumber、status、applicantName、premium 与列表结果一致。
- 状态：现状可验证。

### FT-POLDETAIL-002 — 查询不存在的正整数保单 ID

- 优先级：P1
- 类型：负向 / 资源不存在
- 前置条件：确认目标 ID 在测试库不存在。
- 数据：不存在的正整数 policyId。
- 步骤：请求保单详情。
- 预期结果：HTTP 404；错误 JSON 包含 message；不返回其他保单信息，不泄露内部异常。
- 状态：现状可验证。

### FT-POLDETAIL-003 — applicationId 不得误当作 policyId

- 优先级：P1
- 类型：业务语义 / 数据关联
- 前置条件：创建申请并支付，确认 applicationId 与 policyId 不相等；如当前序列恰好相等，应继续创建数据直至可区分。
- 数据：applicationId、policyId。
- 步骤：
  1. 使用 policyId 请求详情。
  2. 使用 applicationId 请求详情。
- 预期结果：第一步返回对应保单；第二步应根据该数值是否恰好是另一张保单的 ID 来判断，不能假定 applicationId 必定返回 404。验证客户端和测试数据始终把两类 ID 分开使用。
- 状态：现状可验证；用例用于防止测试脚本把两个不同语义的 ID 混用。

### FT-POLDETAIL-004 — ID 为零或负数

- 优先级：P1
- 类型：边界 / 路由健壮性
- 前置条件：API 可用。
- 数据：id=0、id=-1。
- 步骤：分别请求详情。
- 预期结果：不返回 500；按当前路由约束通常返回 404；不返回无关保单。
- 状态：待运行验证。

### FT-POLDETAIL-005 — 极大 ID

- 优先级：P2
- 类型：边界 / 模型绑定
- 前置条件：API 可用。
- 数据：超过 Int64 范围的数字字符串、非数字字符串。
- 步骤：请求对应路径。
- 预期结果：返回明确的 4xx/404；不返回 500；不泄露框架异常。
- 状态：待运行验证。

### FT-POLDETAIL-006 — 详情与列表一致

- 优先级：P0
- 类型：跨接口一致性
- 前置条件：已签发测试保单。
- 数据：policyId。
- 步骤：分别请求 GET /api/policies 和 GET /api/policies/{policyId}。
- 预期结果：同一保单的 id、applicationId、policyNumber、status、issuedAt、applicantName、premium 一致。
- 状态：现状可验证。
