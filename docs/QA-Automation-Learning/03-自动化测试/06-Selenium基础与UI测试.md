# 第 6 课：Selenium 基础与 UI 测试

## 目标
理解 WebDriver、元素定位、交互、显式等待、断言与 UI 稳定性。

## 安装
```powershell
python -m pip install selenium pytest
```
现代 Selenium 通常可通过 Selenium Manager 管理驱动；受限环境需按浏览器版本配置。

## 基础示例
替换为自己运行且有权测试的本地页面：
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login_title():
    driver = webdriver.Chrome()
    try:
        driver.get("http://127.0.0.1:8000/login")
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.NAME, "username"))
        )
        assert "Login" in driver.title
    finally:
        driver.quit()
```

## 定位器
优先稳定的 ID、name、可访问性语义或 data-testid；避免脆弱的长 XPath、变化的 CSS 层级和屏幕坐标。

## 等待
优先等待目标状态（可见、可点击、URL 变化），不要靠大量固定 sleep 掩盖竞态。操作后应断言可观察结果，而非只断言点击没有报错。

## Page Object
当多个测试重复页面定位和操作时，可把定位器与页面操作放进页面对象；业务断言保留在测试层。不要过度抽象小项目。

## 练习
自动打开本地登录页、填写账号、验证错误提示；使用显式等待；保证测试失败时浏览器也关闭。

## 验收标准
能定位元素、等待状态、断言用户可见结果，并解释 UI 自动化不稳定的常见原因。

下一课：[Playwright 基础与 UI 测试](07-Playwright基础与UI测试.md)
