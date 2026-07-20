import requests
import logging
from typing import Any, Dict, Optional
from core.config import settings

# 配置基础日志，方便 Allure 报告和终端捕获请求明细
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class APIClient:
  def __init__(self, base_url: str = settings.BASE_API_URL):
    self.base_url = base_url
    self.session = requests.Session()
    self.token: Optional[str] = None
    self.user_info: Optional[Dict[str, Any]] = None

  def login(self, username: str = settings.ADMIN_USER, password: str = settings.ADMIN_PASS) -> str:
    """
      调用后端登录接口，获取 JWT Token 并将其存入 Session Headers 中
    """
    url = f"{self.base_url}/api/auth/login"
    payload = {
      "username": username,
      "password": password
    }

    logger.info(f"正在尝试登录账户: {username} ...")
    response = self.session.post(url, json=payload, timeout=10)

    if response.status_code != 200:
      logger.error(f"登录失败! 状态码: {response.status_code}, 响应: {response.text}")
      raise Exception(f"Authentication failed: {response.text}")
  
    data = response.json()
    self.token = data.get("token")
    self.user_info = data
    
    # 核心：后续所有发送的请求，session 都会自动带上 Bearer Token
    self.session.headers.update({
        "Authorization": f"Bearer {self.token}",
        "Content-Type": "application/json"
    })
    logger.info("登录成功，Token 已自动注入 Headers！")
    return self.token
  
  def request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
    """
    统一请求分发器，支持自动补全基础路径和拦截报错
    """
    # 如果未登录且请求的不是免检接口，主动触发一次登录
    if not self.token and "/api/auth/login" not in endpoint:
        self.login()

    url = f"{self.base_url}{endpoint}" if endpoint.startswith("/") else f"{self.base_url}/{endpoint}"
    logger.info(f"发起 HTTP 请求 -> {method.upper()} {url} | 参数: {kwargs.get('json', kwargs.get('params'))}")
    
    try:
        response = self.session.request(method, url, timeout=15, **kwargs)
        logger.info(f"接收 HTTP 响应 <- 状态码: {response.status_code}")
        return response
    except requests.RequestException as e:
        logger.error(f"网络层发生异常: {e}")
        raise e
  
  # 便捷包装方法
  def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, **kwargs) -> requests.Response:
      return self.request("GET", endpoint, params=params, **kwargs)

  def post(self, endpoint: str, json: Optional[Dict[str, Any]] = None, **kwargs) -> requests.Response:
      return self.request("POST", endpoint, json=json, **kwargs)

  def put(self, endpoint: str, json: Optional[Dict[str, Any]] = None, **kwargs) -> requests.Response:
      return self.request("PUT", endpoint, json=json, **kwargs)

  def patch(self, endpoint: str, json: Optional[Dict[str, Any]] = None, **kwargs) -> requests.Response:
      return self.request("PATCH", endpoint, json=json, **kwargs)

  def delete(self, endpoint: str, **kwargs) -> requests.Response:
      return self.request("DELETE", endpoint, **kwargs)