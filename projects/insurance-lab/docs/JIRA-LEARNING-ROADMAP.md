# Jira 缺陷管理与测试协作学习路线

Jira 的界面、计划和权限会因 Cloud/产品版本及组织配置不同而变化。本路线使用通用概念，不要求购买特定付费功能。请在个人练习项目或获授权的 Jira 项目中操作。

## 阶段 1：项目与工作项基础
学习 Jira project、issue/work item、key、summary、description、assignee、reporter、priority、labels、components、fix version、affected version、sprint、epic、story、task、bug。练习为保险平台创建 Epic：投保流程、核保、支付与保单、测试自动化、发布质量。

## 阶段 2：缺陷报告
每个 Bug 至少记录：
- Summary：模块 + 条件 + 实际错误，不写“系统有问题”。
- Environment：QA、构建号、浏览器、OS、API 版本、数据库版本。
- Preconditions：账号角色、申请状态、测试数据 ID。
- Steps to reproduce：编号步骤，可由其他人独立复现。
- Expected result：引用需求 ID，描述业务状态与数据副作用。
- Actual result：客观事实、状态码、UI 文案、数据库证据。
- Severity / Priority：影响程度与修复紧急度分开说明。
- Attachments：脱敏截图、HAR、日志、请求关联 ID、SQL 结果。
- Requirement / test case / release links：关联需求、测试用例和版本。
不要在描述或附件中放真实个人数据、密码、Token、银行卡信息。

## 阶段 3：工作流
建议练习工作流：Open → In Progress → Code Review/Ready for QA → Reopened（失败时）→ Resolved → Closed。状态名称以团队配置为准。
关闭条件：修复版本已部署到测试环境；复测通过；相关回归通过；证据已记录。若业务规则变更或无法修复，应按团队流程标记 Won't Fix/Deferred 并记录风险接受者，不要静默关闭。

## 阶段 4：严重程度与优先级
Severity 描述技术/业务影响；Priority 描述修复顺序。示例：
- 支付失败仍生成有效保单：严重程度高，通常 P0/P1，需根据发布窗口与影响面评估。
- 非关键页面文案标点错误：严重程度低，优先级可低。
不要把 P0 定义成所有团队通用标准；先约定本项目的分级标准。

## 阶段 5：搜索与过滤
学习 JQL 的 project、issuetype、status、priority、assignee、labels、fixVersion、created、updated。练习查询：
- 当前项目所有未关闭 Bug
- 本版本高优先级 Bug
- 已解决但尚未复测的 Bug（根据项目状态配置）
- 某需求关联的缺陷
字段和状态名称必须按实际 Jira 配置调整。

## 阶段 6：测试周期与报告
学习版本、发布、冲刺、看板、过滤器、仪表盘和报告。每个测试周期维护：
- 测试计划与范围
- 测试用例/测试执行链接（若组织使用测试管理插件）
- 缺陷列表与趋势
- 执行统计、阻塞项、未覆盖风险
- 发布建议与业务风险接受记录
Jira 本身的测试用例管理能力会因产品与插件不同而不同；也可以先将用例放在仓库 Markdown/pytest，再用 Jira 缺陷关联代码和测试证据。

## 阶段 7：保险实战工作流
1. 从 REQUIREMENTS.md 选 BR-07（仅核保通过可支付）。
2. 建立测试用例 TC-PAY-001：Pending 申请尝试支付。
3. 若发现系统接受支付，创建 Bug，记录申请 ID、请求体、响应、预期/实际和证据。
4. 分配开发人员并进入 In Progress。
5. 修复后部署测试环境，转 Ready for QA。
6. 复测原缺陷，再跑 Approved 正向支付、Rejected 负向支付、重复请求回归。
7. 上传脱敏证据，关联修复版本和 PR。
8. 关闭缺陷并更新测试总结。

## 阶段验收
- 能独立写一份无需口头补充即可复现的缺陷。
- 能解释严重程度与优先级差异。
- 能用过滤器快速得到版本缺陷清单。
- 能追踪 Open → 修复 → QA 复测 → 关闭全过程。
- 能把需求、测试用例、缺陷、PR/提交和发布版本串联起来。

## 官方资源
- [Atlassian Jira Cloud documentation](https://support.atlassian.com/jira-software-cloud/)
- [Jira issue search / JQL](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira/)
- [Atlassian bug reporting guidance](https://www.atlassian.com/agile/software-development/bug-tracking)
