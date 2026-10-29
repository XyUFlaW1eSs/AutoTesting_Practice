# GET /api/applications — API 测试用例

## 接口契约基线

- 方法/路径：GET /api/applications
- 当前实现：返回 HTTP 200 和 JSON 数组；字段为 id、applicantName、age、productCode、premium、status、createdAt；按 CreatedAt 降序。
- 当前接口无分页、筛选和认证逻辑。
- 需要关注：列表数据量增长后的分页需求属于待确认项，不应将不存在的分页参数当作现有功能。

## 用例

### FT-APPLIST-001 — 查询申请列表成功

- 优先级：P0
- 类型：功能 / 契约
- 前置条件：API 可用。
- 数据：至少存在一条测试申请。
- 步骤：发送 GET /api/applications。
- 预期结果：
  1. 返回 HTTP 200，响应体为 JSON 数组。
  2. 每个元素包含 id、applicantName、age、productCode、premium、status、createdAt。
  3. id 为正整数；age 为整数；premium 为数值；createdAt 为可解析时间。
  4. status 属于 Pending、Approved、Rejected、Paid 中的有效状态。
  5. 不包含内部数据库字段或异常堆栈。
- 状态：现状可验证。

### FT-APPLIST-002 — 空列表响应

- 优先级：P1
- 类型：功能 / 边界
- 前置条件：使用隔离测试库，确认其中没有申请记录。
- 数据：无。
- 步骤：发送 GET /api/applications。
- 预期结果：HTTP 200，响应体为 []，不是 null、HTML 或错误页面。
- 状态：现状可验证。
- 注意：不得为了制造空表而清空共享数据库。

### FT-APPLIST-003 — 新建申请后列表可见且字段一致

- 优先级：P0
- 类型：功能 / 数据一致性
- 前置条件：API 可用。
- 数据：创建一条带唯一 applicantName 的有效申请。
- 步骤：
  1. POST /api/applications 创建申请。
  2. 记录返回的 id 和字段。
  3. GET /api/applications。
  4. 按 id 查找本次申请。
- 预期结果：列表中恰好存在该 id；姓名、年龄、产品代码、保费和状态与创建结果一致；初始状态为 Pending。
- 状态：现状可验证。

### FT-APPLIST-004 — 列表按创建时间降序

- 优先级：P1
- 类型：功能 / 排序
- 前置条件：测试环境允许创建多条申请。
- 数据：依次创建 A、B、C 三条申请，间隔足以区分 CreatedAt。
- 步骤：
  1. 按顺序创建 A、B、C。
  2. 请求 GET /api/applications。
  3. 比较返回结果的 createdAt。
- 预期结果：createdAt 按降序排列；最新创建记录排在前面。
- 状态：现状可验证。
- 注意：若时间戳可能相同，应避免只依赖 ID 推断排序；当前实现只按 CreatedAt 排序，同时间戳的次序未定义。

### FT-APPLIST-005 — 状态变更后列表反映最新状态

- 优先级：P0
- 类型：功能 / 跨接口一致性
- 前置条件：创建一条 Pending 申请。
- 数据：本次创建的 applicationId。
- 步骤：
  1. POST /api/applications/{id}/underwrite，approve=true。
  2. 再次 GET /api/applications。
  3. 按 id 定位记录。
- 预期结果：记录状态为 Approved；不能仍显示 Pending。
- 状态：现状可验证。

### FT-APPLIST-006 — 列表中不存在重复申请行

- 优先级：P1
- 类型：数据一致性
- 前置条件：创建一条测试申请。
- 数据：本次 applicationId。
- 步骤：请求 GET /api/applications，并统计该 id 出现次数。
- 预期结果：该 id 只出现一次。
- 状态：现状可验证。

### FT-APPLIST-007 — 未知查询参数的处理

- 优先级：P2
- 类型：接口健壮性 / 需求确认
- 前置条件：API 可用。
- 数据：GET /api/applications?unexpected=value。
- 步骤：发送带未知查询参数的 GET 请求。
- 预期结果：记录实际行为；若接口契约规定忽略未知参数则应返回与不带参数相同的数据，否则按契约返回明确的 4xx。不得出现 500。
- 状态：需求确认；当前 handler 未读取查询参数。
