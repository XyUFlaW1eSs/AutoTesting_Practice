# Insurance Lab｜保险业务综合实战平台

这是用于软件测试学习的轻量级全栈保险业务平台，业务与数据均为虚构。当前版本提供可运行的投保、核保、模拟支付、保单查询 API 与 Vue 前端，并预留测试和 Jira 实战路线。

## 技术栈
- Frontend: Vue 3 + TypeScript + Vite
- Backend: ASP.NET Core Web API / C# / EF Core
- Database: PostgreSQL
- API tests: Python + pytest + requests
- UI tests: Playwright Python（扩展阶段）
- CI: GitHub Actions
- Defect management training: Jira

## 功能范围
1. 申请列表与申请创建
2. 核保批准/拒绝
3. 模拟支付：仅核保批准的申请可支付；重复支付不得创建重复保单
4. 保单列表与详情查询
5. API 健康检查与 Swagger
6. SQL 约束、自动化测试和可复现缺陷练习

## 重要说明
这是教学系统，不是真实保险产品；不提供真实支付、真实承保、生产级身份认证或监管合规能力。不要用于真实个人信息。当前基础版本的保单查询仅适合本机练习，部署到共享网络前必须先完成认证和对象级授权模块。

## 快速开始（Windows 11）
先安装 .NET 10 SDK、Node.js LTS、Python 3.11+、Git 和 PostgreSQL 16+。数据库连接配置见 `backend/Insurance.Api/appsettings.Development.json`，请按本机 PostgreSQL 用户名和密码修改，勿提交真实凭据。

1. 创建本地数据库：在 PostgreSQL 中执行 `database/001-init.sql`。
2. 后端：运行 `scripts/run-backend.ps1`。
3. 前端：另开终端运行 `scripts/run-frontend.ps1`。
4. API 文档：打开 `http://localhost:5080/swagger`。
5. 前端：打开 `http://localhost:5173`。
6. API 测试：`scripts/run-api-tests.ps1`。\n7. Jira 缺陷模板与路线：`docs/JIRA-DEFECT-TEMPLATES.md`、`docs/JIRA-LEARNING-ROADMAP.md`。

## 环境
- Development: 本机热重载，连接本地 PostgreSQL。
- Test: pytest 使用 `INSURANCE_API_BASE_URL` 指向独立测试服务；请使用专门测试数据库。
- Production-like: 仅用于演练构建与配置，不代表可直接上线。部署前必须补齐认证、授权、HTTPS、迁移、日志脱敏、备份与监控。

## 目录
- `backend/`: ASP.NET Core API
- `frontend/`: Vue UI
- `database/`: SQL 初始化与检查脚本
- `tests/api/`: API 自动化
- `tests/ui/`: UI 自动化练习
- `scripts/`: PowerShell 环境、运行、测试、打包脚本
- `docs/`: 需求、测试策略、Jira 实战与发布流程

## 已知教学限制
- 数据库初始化脚本适用于全新学习库；不要在有价值的数据上直接执行 DROP。
- 基础版本不包含真实登录系统，查询接口不做生产级用户隔离。
- 业务状态和保费规则仅为练习规则，需通过需求追踪矩阵验证。
\n## 重要文档\n- [需求规格与验收标准](docs/REQUIREMENTS.md)\n- [测试策略与风险矩阵](docs/TEST-STRATEGY.md)\n- [环境隔离](docs/ENVIRONMENTS.md)\n- [发布检查表](docs/RELEASE-CHECKLIST.md)\n- [Jira 缺陷报告模板](docs/JIRA-DEFECT-TEMPLATES.md)\n- [Jira 学习路线](docs/JIRA-LEARNING-ROADMAP.md)\n