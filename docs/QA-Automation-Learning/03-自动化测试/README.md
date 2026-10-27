# 自动化测试课程目录

课程参考官方文档并按工作中的常见任务排序。每课应完成示例、独立练习和阶段验收；官方文档作为查阅手册，不要求机械记忆全部 API。

## 基础课程
1. [Python 基础](01-Python基础.md)：入门概念与基础语法。
2. [Python 进阶与数据处理](02-Python进阶与数据处理.md)：文件、JSON、数据结构与测试数据。
3. [pytest 入门](03-pytest入门.md)：测试发现、断言、运行。
4. [pytest 测试组织与夹具](04-pytest测试组织与夹具.md)：fixture、作用域、清理和配置。
5. [requests 接口自动化](05-接口自动化requests.md)：请求、响应和业务接口检查。
6. [Selenium 基础与 UI 测试](06-Selenium基础与UI测试.md)：WebDriver、定位、等待和页面对象。
7. [Playwright 基础与 UI 测试](07-Playwright基础与UI测试.md)：Locator、自动等待、浏览器上下文。
8. [框架、报告与持续集成](08-框架报告与持续集成.md)：测试框架与 CI 起步。

## 扩展完整课程
9. [Python 语言基础完整课程](09-Python语言基础完整课程.md)：类型、字符串、数字、分支、循环、容器、函数、模块、异常、文件、类、标准库和环境。
10. [pytest 完整工程课程](10-pytest完整工程课程.md)：断言、参数化、fixture、隔离、mock、标记、报告、并行和失败诊断。
11. [HTTP 与 requests 接口自动化进阶](11-HTTP与requests接口自动化进阶.md)：协议、认证、超时、重试、契约、分页、权限、幂等和业务链路。
12. [Selenium 完整基础与进阶课程](12-Selenium完整基础与进阶课程.md)：定位、等待、表单、窗口、iframe、Page Object、稳定性。
13. [Playwright 完整基础与进阶课程](13-Playwright完整基础与进阶课程.md)：Locator、自动等待、网络、fixtures、trace、多浏览器。
14. [SQL 与数据库测试实战](14-SQL与数据库测试实战.md)：JOIN、聚合、数据一致性、事务和测试数据。
15. [自动化框架工程化与 CI 质量门禁](15-自动化框架工程化与CI质量门禁.md)：分层、配置、日志、报告、数据隔离、GitHub Actions。

## 学习原则
- 先明确预期结果，再写脚本。
- 断言验证业务行为，不只验证请求没有报错。
- 配置、数据、客户端和测试逻辑分离。
- 用例独立、可诊断、可重复；失败证据与用例 ID 关联。
- 单元测试验证规则，API/集成测试验证业务和数据，UI 测试覆盖关键用户旅程。
- 重试不能掩盖不稳定；不要把测试环境问题误判成产品缺陷，也不要反过来。

## 官方参考
- [Python Tutorial](https://docs.python.org/3/tutorial/)
- [pytest documentation](https://docs.pytest.org/en/stable/contents.html)
- [Requests documentation](https://requests.readthedocs.io/en/latest/)
- [Selenium documentation](https://www.selenium.dev/documentation/)
- [Playwright Python documentation](https://playwright.dev/python/docs/intro)
- [GitHub Actions documentation](https://docs.github.com/en/actions)

## 课程结业要求
完成保险综合实战中的规则单测、API 自动化、数据库校验、关键 UI 路径、JUnit 报告与 CI 工作流；能解释每条用例覆盖的风险，并能诊断至少一次失败。