# 环境配置与隔离

## Development（本机开发）
- API：ASP.NET Core Development，端口 5080。
- UI：Vite dev server，端口 5173。
- DB：本机 PostgreSQL 的 insurance_lab。
- 配置：appsettings.Development.json 仅保留本机占位符；更安全的做法是 dotnet user-secrets 或环境变量。
- 允许 Swagger 只在 Development 开启。

## Test（自动化测试）
建议建立独立数据库 insurance_lab_test，执行 database/001-init.sql。测试服务使用环境变量 ConnectionStrings__InsuranceDb 指向测试库，pytest 使用 INSURANCE_API_BASE_URL。
不要让测试直接访问开发者个人数据或生产数据库。若 CI 并行运行，应使用独立数据库/schema 或唯一数据键。

## Release / production-like（发布演练）
运行 Release 构建与打包脚本，使用与开发不同的配置文件/环境变量；禁止将开发密码打入包内。当前项目缺少生产级认证授权、审计、密钥管理、迁移、HTTPS 终止和监控，不可直接公开部署。

## 配置优先级与秘密
ASP.NET Core 默认会读取 appsettings、环境特定 appsettings 和环境变量。建议使用 ConnectionStrings__InsuranceDb 作为环境变量覆盖连接字符串。真实密码不要提交 Git；示例密码也应在本机替换。
