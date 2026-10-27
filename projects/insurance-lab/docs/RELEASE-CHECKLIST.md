# 环境、构建、打包与发布检查表

## Development
- [ ] 已安装 .NET 10 SDK、Node.js LTS、Python、PostgreSQL、Git。
- [ ] 执行 scripts/check-prerequisites.ps1。
- [ ] 在本机初始化专用数据库：scripts/init-database.ps1。
- [ ] 将数据库密码放在本地用户配置或环境变量中，不提交配置文件。
- [ ] 启动 API，检查 /health 与 Swagger。
- [ ] 启动 Vue 前端，完成投保→核保→模拟支付→保单查询。
- [ ] 执行 API 自动化并保存 JUnit 报告。

## Test
- [ ] 使用独立测试数据库，不连接开发者个人数据或生产库。
- [ ] 每次测试使用唯一数据和幂等键。
- [ ] 执行正向、负向、边界、状态迁移、重复请求用例。
- [ ] 检查 SQL 异常查询，评估误报。
- [ ] 缺陷在 Jira 中关联需求、用例、证据和修复版本。

## Build / package
- [ ] dotnet build backend/Insurance.Api/Insurance.Api.csproj -c Release
- [ ] npm install && npm run build
- [ ] scripts/build-release.ps1 生成 artifacts ZIP。
- [ ] 检查发布包没有 .env、密码、测试个人信息、node_modules。
- [ ] CI 通过且报告已上传。

## 发布前限制
本版本尚未实现生产级认证授权、审计日志、限流、完整迁移策略、密钥管理、备份恢复和监控。只能用于本机或受控学习环境，不能直接公开部署。
