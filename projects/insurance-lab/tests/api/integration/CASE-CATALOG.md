# 集成测试用例设计（Integration）

目标：验证 API Handler、EF Core、PostgreSQL 约束、事务与实体关联协作。必须使用独立 insurance_lab_test 测试数据库。数据库直连仅用于约束/事务验证。

| ID | 优先级 | 前置条件与步骤 | 预期结果/重点 |
|---|---|---|---|
| IT-DB-001 | P0 | API 创建合法申请，按 ID 查询数据库 | 仅新增一条 applications；字段一致，初始 Pending |
| IT-DB-002 | P1 | 创建姓名/产品代码含首尾空格、产品代码小写的申请 | 持久化值按当前规则 Trim/大写 |
| IT-DB-003 | P1 | 创建后 GET /api/applications | 查询结果与创建响应一致 |
| IT-DB-004 | P0 | Pending 核保通过 | DB 状态 Approved，updated_at 更新 |
| IT-DB-005 | P0 | Pending 核保拒绝 | DB 状态 Rejected |
| IT-DB-006 | P0 | Pending 申请支付 | HTTP 409；申请仍 Pending；无 payment/policy |
| IT-DB-007 | P0 | Rejected 申请支付 | HTTP 409；状态不变；无 payment/policy |
| IT-DB-008 | P0 | Approved 申请支付成功 | 申请 Paid；一笔 Succeeded payment，金额等于 premium；一张 Active policy |
| IT-DB-009 | P0 | 在专用库通过可控故障触发保存失败 | 事务回滚，不留下半成品 payment/policy，申请状态不被部分更新 |
| IT-DB-010 | P0 | 同一申请、相同幂等键连续支付两次 | paymentId/policyNumber 相同；仅一笔支付和一张保单；第二次 duplicate=true |
| IT-DB-011 | P0 | 申请 A 使用键成功支付后，申请 B 复用该键 | B 返回 409；不泄露 A 结果；B 不新增支付/保单 |
| IT-DB-012 | P0 | 并发请求对同一 Approved 申请、同一键支付 | 最终最多一笔支付/一张保单；响应符合并发契约，无未处理 500 |
| IT-DB-013 | P0 | 并发请求对同一申请使用不同幂等键支付 | 不得重复签发；验证唯一约束竞争与事务行为 |
| IT-DB-014 | P1 | 直接插入不存在的 application_id 到 payments | 外键拒绝 |
| IT-DB-015 | P1 | 直接插入重复 idempotency_key | 唯一约束拒绝 |
| IT-DB-016 | P0 | 同一申请插入第二张保单 | policies.application_id 唯一约束拒绝 |
| IT-DB-017 | P1 | 插入重复 policy_number | 唯一约束拒绝 |
| IT-DB-018 | P1 | 直接插入年龄 17/61 或 premium <= 0 | CHECK 约束拒绝 |
| IT-DB-019 | P1 | GET /api/policies 查询新保单 | 申请人、保费与关联申请一致 |
| IT-DB-020 | P1 | GET /api/policies/{policyId} 查已存在保单 | 返回正确保单；区分 policyId 与 applicationId |
| IT-DB-021 | P1 | 查询不存在保单 ID | HTTP 404，无 SQL/堆栈信息泄露 |
| IT-DB-022 | P2 | 创建多个时间不同的申请后查询列表 | CreatedAt 降序 |
| IT-DB-023 | P2 | 创建多个保单后查询列表 | IssuedAt 降序 |
| IT-DB-024 | P1 | 中文/Unicode 姓名及产品代码 | 持久化和读取不乱码，长度规则一致 |
| IT-DB-025 | P1 | 完整创建→核保→支付→查单流程 | 多接口与数据库最终状态一致 |

## 数据管理与并发要求

- 使用唯一测试数据，按本次创建的 application ID 断言，不依赖固定 ID 或全表总数。
- 所有拒绝操作都验证“无副作用”，不能只断言状态码。
- SQL 直连只允许专用测试库；使用事务或 finally 清理。
- 并发用例关注最终数据不变量，不要假定所有竞争请求必须返回同一个状态码。
- IT-DB-009 应使用可控测试故障，不要破坏共享数据库来制造失败。