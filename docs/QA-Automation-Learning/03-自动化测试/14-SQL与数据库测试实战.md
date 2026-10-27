# SQL 与数据库测试实战

目标：能使用 SQL 验证业务数据、发现重复/缺失/不一致，理解事务和测试数据隔离。请仅在本地或获授权的测试数据库操作。

## 课 1：关系型数据库基础
理解数据库、schema、table、row、column、primary key、foreign key、unique、not null、check constraint。认识一对一、一对多、多对多关系。练习为申请、支付、保单建立关系图。

## 课 2：查询基础
SELECT、WHERE、ORDER BY、LIMIT、DISTINCT、NULL 的处理。理解 NULL 不是空字符串，比较要使用 IS NULL / IS NOT NULL。
    SELECT application_id, status, premium
    FROM applications
    WHERE status = 'approved'
    ORDER BY created_at DESC
    LIMIT 20;

## 课 3：聚合与分组
COUNT、SUM、AVG、MIN、MAX、GROUP BY、HAVING。练习按状态统计申请数量，并核对测试执行报告中的数量口径。

## 课 4：JOIN
学习 INNER JOIN、LEFT JOIN、关联键、重复行风险和连接条件。练习连接申请、支付和保单表，核对某申请关联的成功支付与有效保单。

## 课 5：重复与数据一致性检查
    SELECT application_id, COUNT(*) AS active_policy_count
    FROM policies
    WHERE status = 'active'
    GROUP BY application_id
    HAVING COUNT(*) > 1;
该查询用于发现同一申请多份有效保单。实际表名和状态值必须以项目 schema 为准。

    SELECT a.application_id
    FROM applications a
    LEFT JOIN payments p
      ON p.application_id = a.application_id AND p.status = 'success'
    WHERE a.status = 'approved' AND p.payment_id IS NULL;
第二条查询只是示例：需要先确认业务是否允许已核保申请暂时未支付，否则结果可能包含正常记录。

## 课 6：金额和汇总校验
比较申请保费、支付金额和保单记录时，先确认币种、折扣、税费、舍入和状态口径。不要只用浮点近似比较金额。对同一业务 ID 按状态和时间过滤，避免把失败支付与成功支付一起汇总。

## 课 7：事务与隔离
理解 BEGIN、COMMIT、ROLLBACK、事务原子性和并发更新。测试时要知道系统在哪个边界提交事务；API 已返回成功但异步任务尚未完成时，需要定义最终一致性等待条件。
不要在共享测试环境执行未经批准的全表更新或删除。

## 课 8：测试数据准备与清理
- 使用唯一的虚构业务 ID。
- 准备数据应可重复执行；清理范围必须限定到本次测试数据。
- 避免依赖固定顺序 ID。
- 并行执行时避免测试数据碰撞。
- 清理失败要留痕并可安全重试。

## 课 9：UI/API/DB 三层定位
UI 显示错误：检查页面请求与展示逻辑；API 响应错误：检查请求、响应和业务规则；DB 状态错误：检查事务、异步任务、重复记录和数据约束。三层证据应通过业务 ID、请求关联 ID或时间线连接。

## 课 10：数据库测试报告
记录数据库类型/版本、测试 schema、执行时间、只读查询、测试数据 ID、预期和实际行数、证据位置。SQL 查询应尽量只读；生产环境操作遵循组织权限与审批。

## 结业任务
为虚构保险业务编写至少 8 条只读 SQL 检查：重复有效保单、成功支付缺少保单、失败支付却有有效保单、金额不一致、无效状态、孤立记录、重复业务键和状态时间异常。每条 SQL 说明业务假设与可能误报。