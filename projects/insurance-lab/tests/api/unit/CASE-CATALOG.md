# 单元测试用例设计（Unit）

范围：单一纯函数、Validator、Domain Service。当前校验与状态转换写在 Program.cs Handler 中，因此此清单需要在规则抽取后用后端 C# 单元测试（建议 xUnit）执行，不访问网络或真实 PostgreSQL。

## 建议抽取组件

- ApplicationValidator：姓名、年龄、产品代码、保费。
- ApplicationStateRules：核保/支付状态转换。
- PaymentRules：幂等键规范化、跨申请键冲突判断、支付金额来源。
- PolicyNumberGenerator：保单号格式生成（如将来抽离）。

## 用例清单

| ID | 优先级 | 场景/输入 | 预期结果 |
|---|---|---|---|
| UT-APP-001 | P1 | 普通非空姓名 | 通过 |
| UT-APP-002 | P1 | 姓名 null、空串、全空格 | 失败，字段 applicantName |
| UT-APP-003 | P1 | 姓名长度 100 | 通过 |
| UT-APP-004 | P1 | 姓名长度 101 | 失败；当前规则按 Trim 后长度 |
| UT-APP-005 | P1 | 年龄 18、60 | 均通过，边界包含 |
| UT-APP-006 | P1 | 年龄 17、61、0、负数 | 失败 |
| UT-APP-007 | P1 | 产品代码 null、空串、全空格 | 失败 |
| UT-APP-008 | P2 | 产品代码有首尾空格、小写字母 | Trim 并转大写 |
| UT-APP-009 | P2 | 产品代码超过数据库 30 字符 | 规则层拒绝或明确交由持久层；当前 API 未显式校验，需确认/补齐 |
| UT-APP-010 | P1 | 保费 0、负数 | 失败 |
| UT-APP-011 | P1 | 保费 0.01、1250.00 | 通过 |
| UT-APP-012 | P1 | 保费 0.001 | 失败，最多两位小数 |
| UT-APP-013 | P1 | 保费接近/超过 NUMERIC(12,2) 上限 | 符合明确的精度范围规则；当前 Handler 未显式检查上限 |
| UT-STATE-001 | P0 | Pending + approve=true | 转为 Approved |
| UT-STATE-002 | P0 | Pending + approve=false | 转为 Rejected |
| UT-STATE-003 | P0 | Approved/Rejected/Paid 再次核保 | 拒绝转换 |
| UT-STATE-004 | P0 | Pending/Rejected/Paid 尝试支付 | 拒绝支付 |
| UT-STATE-005 | P0 | Approved 尝试支付 | 允许进入支付流程 |
| UT-PAY-001 | P1 | 幂等键 null/空/空白 | 当前实现生成 application-{id}-payment；需确认需求 |
| UT-PAY-002 | P1 | 幂等键首尾有空格 | Trim 后使用 |
| UT-PAY-003 | P0 | 同一键、同一申请重复请求 | 判为重复，不重复创建支付/保单 |
| UT-PAY-004 | P0 | 同一键用于不同申请 | 冲突，不能返回其他申请支付结果 |
| UT-PAY-005 | P0 | 已支付申请再次支付 | 保单仍唯一，申请仍为 Paid |
| UT-PAY-006 | P1 | 幂等键超过数据库 100 字符 | 规则应拒绝或明确处理；当前 API 未显式校验 |
| UT-POL-001 | P2 | 申请 ID 为 42 | 保单号符合 LAB-00000042 格式 |
| UT-POL-002 | P1 | 同一申请重复签发 | 业务规则拒绝；数据库唯一约束由集成测试验证 |

## 单元测试质量标准

- 不访问网络、数据库；不依赖真实系统时间或固定 ID。
- 参数化测试覆盖边界值和等价类，断言具体返回值/错误字段。
- 状态机覆盖合法转换和所有非法来源状态。
- 纯规则与数据库唯一约束、事务回滚分开测试。
- 没有需求基线的最大值、产品目录等规则先标为待确认，不直接视为现有功能缺陷。