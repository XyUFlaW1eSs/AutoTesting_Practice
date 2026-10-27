# 第 7 课：Playwright 基础与 UI 测试

## 目标
掌握浏览器操作、定位器、自动等待、断言、截图和关键 UI 流程。

## 安装
```powershell
python -m pip install playwright pytest-playwright
python -m playwright install
```
第二条命令下载浏览器，首次运行需要网络和磁盘空间。

## 基础测试
```python
from playwright.sync_api import Page, expect

def test_login_form_is_visible(page: Page):
    page.goto("http://127.0.0.1:8000/login")
    expect(page.get_by_label("用户名")).to_be_visible()
    expect(page.get_by_role("button", name="登录")).to_be_enabled()
```
示例页面应有匹配的 label 和按钮。page fixture 由 pytest-playwright 提供。

## 交互与断言
```python
def test_invalid_login_message(page):
    page.goto("http://127.0.0.1:8000/login")
    page.get_by_label("用户名").fill("wrong-user")
    page.get_by_label("密码").fill("wrong-password")
    page.get_by_role("button", name="登录").click()
    expect(page.get_by_text("用户名或密码错误")).to_be_visible()
```
实际文案以练习页面为准。优先使用 get_by_role、get_by_label 等语义定位器。

## 截图
```python
def test_policy_page(page):
    page.goto("http://127.0.0.1:8000/policies")
    page.screenshot(path="artifacts/policies.png", full_page=True)
```
避免截图中出现真实个人信息。实际项目可在失败钩子保存截图、日志和追踪文件。

## Selenium 与 Playwright
Playwright 提供方便的自动等待、浏览器上下文隔离与追踪；Selenium 在企业既有框架中仍常见。按团队技术栈和维护成本选型，不应绝对化。

## 练习
登录成功/失败；投保表单必填与边界；提交后断言申请编号/状态；制造失败并查看报告/截图。

## 验收标准
能写稳定交互和断言，解释定位器、等待、隔离的意义。

下一课：[框架、报告与持续集成](08-框架报告与持续集成.md)
