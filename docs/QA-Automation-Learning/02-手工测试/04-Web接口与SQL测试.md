# 第 4 课：Web、接口与 SQL 测试

## 目标
通过浏览器 Network、API 客户端和 SQL 交叉验证业务结果。

## Network 分析步骤
1. 打开开发者工具 Network，清空请求记录。
2. 执行一个业务操作，过滤 Fetch/XHR。
3. 检查 URL、方法、状态码、请求头、请求体和响应。
4. 检查请求是否重复、参数是否正确、响应是否符合契约。
5. 记录时间、请求 ID 和脱敏证据。

## HTTP/API 知识点
GET 通常读取，POST 常用于创建/提交，PUT/PATCH 更新，DELETE 删除。2xx 只表示 HTTP 层成功，不保证业务成功；4xx 常见于请求/身份/权限问题，5xx 常见于服务端问题。测试必填项、类型、边界、错误码、权限、Token 过期、分页、超时、重试和幂等性。

## SQL 示例（教学用 PostgreSQL 表结构）
假设存在 policy_application(id, status, premium)、policy(id, application_id, status)、payment(id, application_id, amount, status)：
```sql
SELECT id, status, premium
FROM policy_application
ORDER BY id DESC
LIMIT 20;

-- 检查重复保单
SELECT application_id, COUNT(*) AS cnt
FROM policy
GROUP BY application_id
HAVING COUNT(*) > 1;

-- 检查成功支付金额与申请保费是否一致
SELECT a.id, a.premium, p.amount
FROM policy_application a
JOIN payment p ON p.application_id = a.id
WHERE p.status = 'SUCCESS'
  AND a.premium <> p.amount;
```
字段需按真实 schema 调整。学习阶段优先执行只读查询，不在生产数据库执行修改语句。

## 三层验证
页面显示已生效 → API 返回正确状态 → 数据库保单和支付记录一致。若不一致，确认环境和数据时间，再沿请求、日志、服务和事务定位。

## 练习
- 为登录、投保提交、保单查询各写 5 个 API 测试点。
- 写 SQL 找出没有支付记录的已生效保单。
- 页面显示成功但无数据库记录时，写出排查顺序。

## 验收标准
能说明 HTTP 成功与业务成功的区别；能用 SQL 只读核验；能以证据排查问题。

下一课：[UAT 全流程验收测试](05-UAT全流程验收测试.md)
