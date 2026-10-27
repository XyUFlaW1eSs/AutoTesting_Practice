# 第 5 课：requests 接口自动化

## 目标
发送 HTTP 请求，验证状态码、响应结构、业务字段、关联流程和异常路径。

## 安装
```powershell
python -m pip install requests pytest
```

## 基础示例
```python
import requests

def test_httpbin_json():
    response = requests.get("https://httpbin.org/json", timeout=10)
    assert response.status_code == 200
    assert "slideshow" in response.json()
```
需要网络连接；更完整练习应使用本地模拟 API 或获准使用的测试环境。

## 可复用客户端
```python
import requests

class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def get_policy(self, policy_id: str):
        return self.session.get(
            f"{self.base_url}/policies/{policy_id}", timeout=10
        )
```
正式项目还应统一鉴权、超时、日志脱敏、环境配置与错误处理。

## API 测试维度
必填/选填、类型、格式、边界、错误码、权限、Token 过期、分页、排序、超时、重试、重复提交和幂等性。HTTP 2xx 不一定意味着业务成功。

## 关联测试
创建投保申请 → 从响应提取 application_id → 查询申请 → 验证状态 → 重复提交相同业务请求 → 检查是否重复创建记录。具体行为必须以接口契约为准。

## 练习
- 成功、缺字段、非法类型、未授权各写一条用例。
- 从创建响应提取 ID 并用于后续查询。
- 将 base URL 放入环境变量，不能散落在代码中。
- 为超时和失败响应设计清晰断言。

## 验收标准
能发请求、验证响应、管理配置和数据，能说明传输层成功与业务成功的区别。

下一课：[Selenium 基础与 UI 测试](06-Selenium基础与UI测试.md)
