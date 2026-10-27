import os
import uuid
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("INSURANCE_FRONTEND_URL", "http://localhost:5173")

@pytest.mark.e2e
def test_create_underwrite_pay_and_find_policy(page: Page):
    applicant = f"UI-{uuid.uuid4().hex[:8]}"
    page.goto(FRONTEND_URL, wait_until="domcontentloaded")
    expect(page.get_by_role("heading", name="保险业务综合实战平台")).to_be_visible()
    page.get_by_label("投保人名称").fill(applicant)
    page.get_by_label("年龄").fill("32")
    page.get_by_label("产品代码").fill("LIFE-BASIC")
    page.get_by_label("保费（元）").fill("888.88")
    page.get_by_role("button", name="提交投保申请").click()

    row = page.get_by_role("row").filter(has_text=applicant)
    expect(row).to_contain_text("Pending")
    row.get_by_role("button", name="核保通过").click()
    expect(row).to_contain_text("Approved")
    row.get_by_role("button", name="模拟支付").click()
    expect(page.get_by_role("status")).to_contain_text("模拟支付成功")

    page.get_by_role("button", name="保单查询").click()
    policy_row = page.get_by_role("row").filter(has_text=applicant)
    expect(policy_row).to_contain_text(f"LAB-")
    expect(policy_row).to_contain_text("Active")
