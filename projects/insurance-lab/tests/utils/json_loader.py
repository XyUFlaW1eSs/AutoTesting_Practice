import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]

def load_json(relative_path: str) -> Any:
  """加载 JSON 测试数据。"""
  file_path = PROJECT_ROOT / relative_path

  if not file_path.exists():
    raise FileNotFoundError(
      f"Test data file not found: {file_path}"
    )

  with file_path.open("r", encoding="utf-8") as file:
    return json.load(file)

def get_test_case(data: dict, case_id: str) -> dict:
  """根据测试用例 ID 获取测试数据。"""
  if case_id not in data:
    raise KeyError(
      f"Test case not found: {case_id}"
    )

  return data[case_id]