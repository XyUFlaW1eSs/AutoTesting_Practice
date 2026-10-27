# HTTP 与 requests 接口自动化进阶

官方参考：[Requests Quickstart](https://requests.readthedocs.io/en/latest/user/quickstart/)、[Advanced Usage](https://requests.readthedocs.io/en/latest/user/advanced/)、[HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)。

## 课 1：HTTP 请求与响应
掌握 method、URL、path/query、headers、body、status code、响应头、JSON、Content-Type、编码、缓存和重定向。练习：记录登录、查询、创建请求的组成；不要把 Cookie/Authorization 复制到笔记。

## 课 2：方法与状态码
理解 GET、POST、PUT、PATCH、DELETE 的常见语义，具体行为以 API 合同为准。2xx、3xx、4xx、5xx 分类之外，还要检查业务错误码和响应结构。401 通常表示未认证，403 通常表示已认证但不允许访问，仍需以服务端规范为准。

## 课 3：Requests 基础
    import requests
    def test_health_endpoint(base_url):
        response = requests.get(f"{base_url}/health", timeout=(3, 10))
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
示例要求本地或授权测试服务提供该端点。超时包括连接超时和读取超时，不应无限等待。

## 课 4：Session 与认证
学习 requests.Session、连接复用、Bearer token、Cookie、API key。凭据从环境变量或 CI Secrets 注入，不提交仓库。测试未登录、过期 Token、错误角色和无权限对象。
练习：实现集中管理 base URL、默认 headers 和 timeout 的 API client，并为敏感字段脱敏。

## 课 5：超时、连接错误与重试
区分连接超时、读取超时、连接失败和 HTTP 错误。只有操作语义允许时才重试；对支付、创建等非幂等操作盲目重试可能产生副作用。重试应限制次数并使用幂等键或服务端去重。客户端超时不代表服务端一定未处理。

## 课 6：响应断言清单
每个接口检查状态码、Content-Type、JSON 结构、必需字段、类型、枚举、业务错误码、边界、分页、合理的响应时间预算及数据副作用。不能只断言状态码为 200。

## 课 7：参数化与数据驱动
使用 pytest 对年龄、保费、状态、角色、缺失字段和无效类型参数化。测试数据应有描述性 ID。练习：18/60 边界、17/61 非法值、空值、字符串、负数和超大值。

## 课 8：业务链路与状态机
模拟创建申请 → 核保 → 支付 → 查询保单。每一步验证响应和状态；把上一步返回的业务 ID 传给下一步；失败时按规则清理测试数据或使用隔离环境。

## 课 9：接口安全与权限
在授权环境验证未认证、错误/过期 Token、不同角色、对象级授权、客户端越权字段和错误信息泄露。只使用虚构账号和数据，不扫描未经授权的系统。

## 课 10：契约与 Schema
理解 OpenAPI/JSON Schema、必填字段、可空字段、枚举、范围、日期格式、错误结构和向后兼容。Schema 校验不能替代业务规则断言。

## 课 11：分页、过滤、排序与重复请求
测试页码/游标边界、空页、超大 page size、过滤组合、稳定排序、重复创建、幂等键、并发提交、软删除和状态过滤。练习保单列表分页矩阵，核对跨页重复或遗漏。

## 课 12：API + DB 一致性
在授权本地数据库验证 API 前后状态：成功创建记录、失败不产生有效记录、重复请求不生成重复数据。使用独立测试库并定义清理策略；不直接修改生产数据库。

## 可复用客户端起点
    import requests

    class ApiClient:
        def __init__(self, base_url: str, token: str | None = None, timeout=(3, 10)):
            self.base_url = base_url.rstrip("/")
            self.timeout = timeout
            self.session = requests.Session()
            self.session.headers.update({"Accept": "application/json"})
            if token:
                self.session.headers["Authorization"] = f"Bearer {token}"

        def get(self, path: str, **kwargs):
            return self.session.get(
                f"{self.base_url}{path}", timeout=self.timeout, **kwargs
            )

        def post(self, path: str, *, json: dict, **kwargs):
            return self.session.post(
                f"{self.base_url}{path}", json=json, timeout=self.timeout, **kwargs
            )
这是教学起点。真实项目还需考虑日志脱敏、异常分类、Session 生命周期、重试策略和 API 版本。

## 结业任务
构建 API 测试套件，覆盖成功、字段缺失、类型错误、边界、认证、权限、重复提交、失败状态、分页和数据库一致性；输出可读失败信息与 JUnit 报告。