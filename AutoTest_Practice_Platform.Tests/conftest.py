import pytest
from playwright.sync_api import sync_playwright, BrowserContext, Page
from core.api_client import APIClient
from core.config import settings

# =====================================================================
# 1. 接口测试 Fixtures
# =====================================================================

@pytest.fixture(scope="session")
def api_client() -> APIClient:
  """
  全局 Session 级别的 API 客户端，自动登录并持有会话 Token
  """
  client = APIClient()
  client.login()  # 启动测试时仅登录一次，全局复用
  return client

# =====================================================================
# 2. UI / E2E 测试 Fixtures (Playwright 提速黑科技)
# =====================================================================

@pytest.fixture(scope="session")
def browser():
    """
    全局共享浏览器实例，避免每个用例重复开闭浏览器
    """
    with sync_playwright() as p:
        # headless=False 方便本地调试看效果，CI 流程可以设为 True
        browser_instance = p.chromium.launch(headless=False, args=["--start-maximized"])
        yield browser_instance
        browser_instance.close()

@pytest.fixture(scope="function")
def authenticated_page(browser, api_client) -> Page:
  """
  生成一个已经自动注入 Token 并越过登录页、直达后台系统的 Playwright Page 实例
  """
  # 1. 新建浏览器上下文（不使用共享的默认视口，采用最大化）
  context: BrowserContext = browser.new_context(no_viewport=True)
  page: Page = context.new_page()

  # 2. Playwright 规定：注入 localStorage 前，必须先访问一次该域名的网页
  page.goto(settings.BASE_UI_URL)

  # 3. 核心：将 api_client 里获取的真实 JWT Token 直接强行塞进浏览器
  # 假设你的前端是用 localStorage.setItem("token", ...) 存的（如果存Cookie，可以使用 context.add_cookies）
  token_js = f"localStorage.setItem('token', '{api_client.token}');"
  user_js = f"localStorage.setItem('user', JSON.stringify({api_client.user_info}));"
  
  page.evaluate(token_js)
  page.evaluate(user_js)

  # 4. 刷新页面或导航到任务页，此时系统会识别到登录态，直接越过 Login
  page.goto(f"{settings.BASE_UI_URL}/tasks")
  page.wait_for_load_state("networkidle") # 等待页面网络静默，确保完全加载

  yield page

  # 5. 测试结束后，销毁当前 Context，保持环境完全隔离
  context.close()