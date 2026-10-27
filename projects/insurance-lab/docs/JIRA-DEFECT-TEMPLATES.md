# Jira 缺陷报告模板与示例

## 可复制的缺陷模板

**Summary**  
[模块] 在[前置状态/操作]时，[实际错误行为]

**Environment**  
- 环境/构建：
- OS/浏览器：
- API 版本：
- 测试数据 ID：
- 时间/请求关联 ID：

**Preconditions**
1. …
2. …

**Steps to reproduce**
1. …
2. …

**Expected result**
- 业务预期（关联需求 ID）：
- API 预期：
- 数据库预期：

**Actual result**
- 实际响应/页面表现：
- 数据库实际状态：
- 发生频率：

**Impact / Severity / Priority**
- 影响范围：
- 严重程度：
- 优先级及原因：

**Evidence**
- 截图/请求响应/日志/SQL 查询结果（必须脱敏）：

**Regression scope**
- 关联用例：
- 修复后回归项：

## 示例 BUG-INS-001：待核保申请可以支付

- Summary：[支付] Pending 状态的投保申请调用支付接口后被接受
- Environment：QA，本地 Insurance Lab，API v1，PostgreSQL 测试库
- Preconditions：存在状态为 Pending 的申请（实际执行时使用新生成 ID）。
- Steps：
  1. 创建一条合法投保申请。
  2. 不执行核保。
  3. POST /api/applications/{id}/pay，请求体包含唯一 idempotencyKey。
- Expected：
  1. API 返回 409 Conflict。
  2. 申请仍为 Pending。
  3. payments 与 policies 均无该申请的新记录。
- Actual：填写真实执行结果；不得将示例预期当成真实缺陷结果。
- Severity：若支付被实际接受并生成有效保单，属于高风险业务状态缺陷。
- Priority：按当前迭代和发布风险由团队确认，建议阻断发布。
- Evidence：脱敏 HTTP 请求/响应、申请 ID、只读 SQL 查询结果。
- Regression：BR-07；Approved 正向支付；Rejected 负向支付；重复支付幂等；DB 不一致查询。

## 示例 BUG-INS-002：重复支付请求创建重复保单
- Summary：[支付] 对同一申请重复提交支付请求后出现多份有效保单
- Preconditions：申请已核保通过，支付服务已成功处理第一次请求。
- Steps：对同一申请再次发送相同幂等键的支付请求，再查询保单列表与数据库。
- Expected：返回已有支付结果或明确冲突；无重复支付/保单记录。
- Actual：记录实际状态码、响应体和 SQL 证据。
- Severity/Priority：按重复签发的业务影响评估，通常为高风险。
- Regression：重复点击、重复请求、并发请求、不同申请复用同一幂等键。
