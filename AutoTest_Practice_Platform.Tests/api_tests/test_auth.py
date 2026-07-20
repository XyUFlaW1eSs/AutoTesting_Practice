import os
import json
import pytest
import requests
import allure
from core.config import settings

# ==========================================
# 1. 测试数据加载辅助函数
# ==========================================
def load_test_data(module_name: str) -> list:
  """
  从 JSON 文件中读取指定模块的测试数据，并转换为 pytest.mark.parametrize 支持的列表格式
  返回格式: [("TC_AUTH_LOG_001", { payload: {...}, expected_status: 200 }), ...]
  """
  data_file = os.path.join(os.path.dirname(__file__), "..", "data", "auth_api_test_data.json")
  with open(data_file, "r", encoding="utf-8") as f:
    full_data = json.load(f)

  module_data = full_data.get(module_name, {})
  # 将字典转换为元组列表
  return [(case_id, case_info) for case_id, case_info in module_data.items()]

# ==========================================
# 2. 动态环境准备 Fixture (用于需要真实 Token 的前置条件)
# ==========================================

@pytest.fixture(scope="module")
def real_auth_context():
  """
  在执行 GetMe 和 Logout 测试前，临时注册/登录一个真实用户，
  以获取真实的有效 Token 和 UserId，避免写死在 JSON 中导致过期失效。
  """
  base_url = settings.BASE_API_URL

  # 1. 执行一次真实登录 (使用 config 中的默认账户)
  # 如果系统没有默认账户，这里可以先调 register 接口注册一个临时账户
  login_payload = {
    "identity": settings.ADMIN_USER,
    "password": settings.ADMIN_PASS
  }
  res = requests.post(f"{base_url}/api/auth/login", json=login_payload)

  #确保环境正常，否则跳过依赖真实 Token 的测试
  if not res.ok:
    pytest.skip("无法获取真实 Token，测试环境登录失败！请检查系统或数据库。")

  data = res.json()
  return {
    "token": data.get("token"),
    "refreshToken": data.get("refreshToken"),
    "userId": data.get("userId"),
  }


# ==========================================
# 3. 核心测试用例区 (数据驱动)
# ==========================================
@allure.feature("Auth认证模块测试")
class TestAuthAPI:
  # ----------------------------------------
  # 场景 1: 用户注册 (Register)
  # ----------------------------------------
  @pytest.mark.order(1)
  @allure.story("用户注册接口")
  @pytest.mark.parametrize("case_id, case_data", load_test_data("Register"))
  def test_register(self, case_id, case_data):
    allure.dynamic.title(f"注册测试 - {case_id}")
    url = f"{settings.BASE_API_URL}/api/auth/register"

    payload = dict(case_data["payload"])
    
    with allure.step("发送注册 POST 请求"):
      response = requests.post(url, json=payload, timeout=1000)

    with allure.step(f"断言状态码是否为 {case_data['expected_status']}"):
      assert response.status_code == case_data["expected_status"], \
        f"预期返回 {case_data['expected_status']}, 实际返回 {response.status_code}, 响应: {response.text}"
      
  # ----------------------------------------
  # 场景 2: 用户登录 (Login)
  # ----------------------------------------
  @pytest.mark.order(2)
  @allure.story("用户登录接口")
  @pytest.mark.parametrize("case_id, case_data", load_test_data("Login"))
  def test_login(self, case_id, case_data):
    allure.dynamic.title(f"登录测试 - {case_id}")
    url = f"{settings.BASE_API_URL}/api/auth/login"

    with allure.step("发送登录 POST 请求"):
      response = requests.post(url, json=case_data["payload"], timeout=1000)

    with allure.step(f"断言状态码是否为 {case_data['expected_status']}"):
      assert response.status_code == case_data["expected_status"], \
        f"预期返回 {case_data['expected_status']}, 实际返回 {response.status_code}, 响应: {response.text}"
      
    # P0 正向用例特殊断言
    if case_data["expected_status"] == 200:
      with allure.step("断言响应体包含有效 Token"):
        json_res = response.json()
        assert "token" in json_res
        assert "refreshToken" in json_res

  # ----------------------------------------
  # 场景 3: 刷新令牌 (Refresh Token)
  # ----------------------------------------
  @pytest.mark.order(3)
  @allure.story("刷新 Token 接口")
  @pytest.mark.parametrize("case_id, case_data", load_test_data("Refresh"))
  def test_refresh_token(self, case_id, case_data, real_auth_context):
    allure.dynamic.title(f"刷新令牌测试 - {case_id}")
    url = f"{settings.BASE_API_URL}/api/auth/refresh"

    payload = dict(case_data["payload"])

    # 如果是正向测试用例，用 fixture 里刚刚生成的【真实有效数据】替换掉 JSON 里的占位符
    if case_data["expected_status"] == 200:
      payload["userId"] = real_auth_context["userId"]
      payload["refreshToken"] = real_auth_context["refreshToken"]

    with allure.step("发送刷新 Token 请求"):
      response = requests.post(url, json=payload, timeout=1000)

    with allure.step(f"断言状态码是否为 {case_data['expected_status']}"):
      assert response.status_code == case_data["expected_status"]

  # ----------------------------------------
  # 场景 4: 获取当前用户信息 (GetMe)
  # ----------------------------------------
  @pytest.mark.order(4)
  @allure.story("获取当前用户信息接口")
  @pytest.mark.parametrize("case_id, case_data", load_test_data("AuthHeaders"))
  def test_get_me_exceptions(self, case_id, case_data):
    """仅执行异常头部的验证 (无 Token, 假 Token)"""
    allure.dynamic.title(f"身份拦截测试 - {case_id}")
    url = f"{settings.BASE_API_URL}/api/auth/me"

    with allure.step(f"携带特定 Header 访问: {case_data['headers']}"):
      response = requests.get(url, headers=case_data["headers"], timeout=1000)
                
    with allure.step("断言系统成功拦截，返回 401"):
      assert response.status_code == case_data["expected_status"]

  @allure.story("获取当前用户信息接口")
  def test_get_me_success(self, real_auth_context):
    """使用真实的 Token 获取信息"""
    allure.dynamic.title("身份验证通过测试 - 携带真实 Token 获取信息")
    url = f"{settings.BASE_API_URL}/api/auth/me"

    headers = {
      "Authorization": f"Bearer {real_auth_context['token']}"
    }

    with allure.step("携带有效的 Authorization 访问"):
      response = requests.get(url, headers=headers, timeout=1000)

    with allure.step("断言返回 200 OK 及当前用户信息"):
      assert response.status_code == 200
      json_res = response.json()
      assert "userName" in json_res
      assert "id" in json_res

  # ----------------------------------------
  # 场景 5: 用户注销 (Logout)
  # ----------------------------------------
  @pytest.mark.order(5)
  @allure.story("用户注销接口")
  def test_logout(self, real_auth_context):
    allure.dynamic.title("注销测试 - 正常登出系统")
    url = f"{settings.BASE_API_URL}/api/auth/logout"
    
    headers = {
        "Authorization": f"Bearer {real_auth_context['token']}"
    }
    
    with allure.step("发送注销 POST 请求"):
      response = requests.post(url, headers=headers, timeout=1000)
        
    with allure.step("断言状态码返回 204"):
      assert response.status_code == 204