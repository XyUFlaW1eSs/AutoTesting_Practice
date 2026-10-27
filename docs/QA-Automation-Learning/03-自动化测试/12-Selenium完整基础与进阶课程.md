# Selenium 完整基础与进阶课程

官方参考：[Selenium Documentation](https://www.selenium.dev/documentation/)、[WebDriver](https://www.selenium.dev/documentation/webdriver/)、[Waits](https://www.selenium.dev/documentation/webdriver/waits/)、[Page Objects](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)。

## 课 1：WebDriver 与环境
理解浏览器自动化、WebDriver、驱动管理和浏览器版本兼容。安装 Selenium 后，打开本地练习页、读取标题、关闭浏览器。优先使用本地练习应用或授权 QA 环境。

## 课 2：定位器
学习 ID、name、CSS selector、XPath、多个元素和动态列表。优先稳定属性；避免过长且依赖 DOM 层级的选择器。练习同一表单使用不同定位方式，并说明哪种最稳。

## 课 3：常用操作与断言
学习 click、send_keys、clear、submit、下拉框、复选框、键盘操作、属性、文本和可见性。操作后断言用户可观察到的结果，而非仅验证 click 没抛异常。

## 课 4：显式等待
页面加载完成不代表业务数据已加载。使用 WebDriverWait 和 expected_conditions；避免固定 sleep；谨慎混用隐式和显式等待。等待条件应对应业务状态，例如元素可见、可点击、URL 改变。
练习：比较固定 sleep 与显式等待，并模拟延迟加载。

## 课 5：表单校验
覆盖必填、空格、超长、非法字符、边界、错误提示、重复提交和提交状态。为投保申请页建立字段级校验矩阵。

## 课 6：窗口、iframe、弹窗
学习窗口句柄、标签页切换、frame、alert/confirm/prompt、上传下载常见处理。切换上下文后验证页面状态，完成后恢复。

## 课 7：导航与网络边界
学习前进/后退、刷新、URL 等待、文件上传下载、浏览器控制台与网络请求。Selenium 控制浏览器，不应把所有 API 验证都放在 UI 层。

## 课 8：Page Object Model
页面对象封装定位和页面操作；测试层描述业务流程并断言结果。避免页面对象成为包含全部测试逻辑的巨型类。
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    class LoginPage:
        def __init__(self, driver):
            self.driver = driver

        def login(self, username, password):
            self.driver.find_element(By.ID, "username").send_keys(username)
            self.driver.find_element(By.ID, "password").send_keys(password)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            return WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "welcome"))
            )
练习：为登录、投保申请和保单详情分别建模；页面对象提供动作，测试负责业务断言。

## 课 9：pytest 集成
使用 fixture 创建和关闭 WebDriver；失败时保留截图和页面 URL；确保失败后仍关闭浏览器。测试数据应独立或通过受控测试工厂创建。

## 课 10：配置与数据
base URL、浏览器、超时等从配置读取；账号密码不硬编码；测试数据唯一化，避免并行覆盖；明确残留数据清理。

## 课 11：稳定性诊断
处理定位器失效、元素遮挡、stale element、异步渲染、弹窗、环境慢和驱动变化。排查顺序：截图/DOM → 定位器 → 等待条件 → 测试数据 → 环境。不要通过不断加 sleep 掩盖根因。

## 课 12：选择 Selenium 的场景
适合已有 Selenium 生态、WebDriver 标准兼容需求或团队已有大量资产的项目。新项目应比较 Playwright 的自动等待、trace 和 Context 隔离能力，按团队技术栈和维护成本选型。

## 结业任务
实现模拟登录、投保申请、错误提示和保单查询等 3–5 条关键路径；使用显式等待、Page Object、pytest fixture、截图和 JUnit 报告。故意制造一次定位器错误并记录诊断过程。