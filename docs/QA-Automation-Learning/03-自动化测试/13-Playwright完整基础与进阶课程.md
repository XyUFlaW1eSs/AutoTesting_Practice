# Playwright Python 完整基础与进阶课程

官方参考：[Playwright Python](https://playwright.dev/python/docs/intro)、[Locators](https://playwright.dev/python/docs/locators)、[Auto-waiting](https://playwright.dev/python/docs/actionability)、[Assertions](https://playwright.dev/python/docs/test-assertions)、[Network](https://playwright.dev/python/docs/network)、[Trace Viewer](https://playwright.dev/python/docs/trace-viewer)。

## 课 1：安装与同步 API
安装 playwright 包并执行 python -m playwright install。先学同步 API，理解后再扩展异步 API。
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://example.com")
        assert "Example" in page.title()
        browser.close()
实际工作优先在本地练习应用或授权 QA 环境运行。

## 课 2：Browser、Context、Page
Browser 是浏览器进程，BrowserContext 是隔离会话，Page 是标签页。用独立 Context 隔离 Cookie 和存储；用 fixture 管理生命周期；避免共享登录状态和业务数据。

## 课 3：Locator 与语义化定位
优先 get_by_role、get_by_label、get_by_text、get_by_placeholder、get_by_test_id。CSS/XPath 可用，但不应默认使用。Locator 会在操作时重新解析，不等于一次性缓存 DOM 节点。
    from playwright.sync_api import Page, expect

    def test_application_form(page: Page):
        page.goto("http://127.0.0.1:8000/application")
        page.get_by_label("Applicant age").fill("18")
        page.get_by_label("Premium").fill("1200.00")
        page.get_by_role("button", name="Submit application").click()
        expect(page.get_by_text("Application submitted")).to_be_visible()
示例页面需由本地练习项目提供。

## 课 4：自动等待与重试断言
Playwright 会在操作前检查可见、稳定、可接收事件、启用等条件；expect 断言会在超时前重试。不要为让测试通过而盲目设置长超时或使用 force click。
练习：延迟提示、遮挡层场景，观察点击失败并解释 force 可能掩盖的问题。

## 课 5：表单、列表和业务状态
覆盖输入、选择、复选框、上传、表格行、分页、过滤和状态变化。按唯一业务标识定位行，不依赖“第 3 个按钮”。
练习：按申请号定位行并打开详情，断言申请状态和标题。

## 课 6：弹窗、多标签页、frame、文件
学习新页面事件、弹窗、对话框、frame、下载和上传。新页面应验证 URL/标题/关键内容，结束后关闭资源。

## 课 7：API 与网络
学习 APIRequestContext、监听请求/响应、等待特定响应和模拟网络异常。拦截适合模拟失败或隔离第三方依赖，但不要意外 mock 掉正在验证的核心业务。
练习：在授权本地应用模拟支付服务失败，确认页面提示错误且不出现有效保单。

## 课 8：Fixtures 与数据隔离
将登录态、页面初始化、数据准备和清理封装为 fixtures。不要把 fixture 写成隐藏整个业务流程的黑盒；前置条件要能从代码和报告中看清。

## 课 9：截图、视频与 Trace
截图记录最终页面；Trace 可用于分析操作、DOM 快照和网络。产物应与用例/构建关联，避免上传秘密凭据和敏感数据。
练习：制造断言失败，保存截图/trace 并写诊断结论。

## 课 10：多浏览器与响应式
根据支持矩阵选择 Chromium、Firefox、WebKit，不是每个项目都必须全量运行。将 PR 快速冒烟与夜间兼容性回归分层。

## 课 11：可访问性与稳定定位
语义 locator 更贴近用户操作，也能暴露缺少 label 的问题；但 UI 自动化不等于完整无障碍审计。推动应用提供可访问 label、role 和明确测试属性。

## 课 12：Flaky 测试治理
检查定位器唯一性、页面状态、测试数据冲突、等待条件、网络依赖、前置条件和 Context 隔离。不要只提高 timeout 或重跑掩盖不稳定。

## 课 13：Playwright 与 Selenium 的选择
Playwright 的自动等待、重试断言、BrowserContext、trace 和网络控制较完整；Selenium 生态成熟、基于 WebDriver，适合已有团队资产与兼容性需求。选择取决于团队技术栈、浏览器矩阵和维护成本。

## 结业任务
实现投保成功/失败、核保状态、支付失败和保单查询关键路径；使用语义定位、断言、fixtures、截图/trace 与 CI 产物。每条 UI 测试都要说明为何不能在 API 或单元层完成同样验证。