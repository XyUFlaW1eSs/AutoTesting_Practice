# UI 自动化练习

安装：`python -m pip install playwright pytest`，再运行 `python -m playwright install chromium`。确认 API 和前端均已运行后，练习新建投保申请、核保通过、模拟支付、保单列表可见、非法输入提示、服务异常提示。优先使用 role、label、text 等稳定定位方式，避免依赖脆弱的 CSS 层级。后续可在此目录添加 Playwright 测试并接入 CI。
