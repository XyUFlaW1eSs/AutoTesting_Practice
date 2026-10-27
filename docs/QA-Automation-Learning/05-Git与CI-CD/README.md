# Git 与 CI/CD 实操

## 目标
掌握版本管理、分支协作、提交、Pull Request、GitHub Actions 和自动化测试报告。重点练 CI（持续集成）；部署/CD 概念只在安全练习环境讨论。

## Git 基础命令
```powershell
git status
git switch -c feature/add-policy-tests
git add .
git diff --cached
git commit -m "test: add policy age boundary cases"
git push -u origin feature/add-policy-tests
```
提交前检查 diff；不要提交密钥、.env、真实个人数据或生成文件。一个提交尽量只包含一个逻辑变更。

## 工作流
更新 main → 新建 feature 分支 → 本地测试 → 检查 diff → commit/push → 创建 PR → CI 执行 → 根据日志修复 → Review 通过后合并。

## GitHub Actions 示例
将工作流放在仓库根目录的 `.github/workflows/python-tests.yml`。GitHub 只会自动识别该目录中的工作流文件。
```yaml
name: Python Tests
on:
  push:
    paths:
      - 'tests/learning_examples/**'
      - '.github/workflows/python-tests.yml'
  pull_request:
    paths:
      - 'tests/learning_examples/**'
      - '.github/workflows/python-tests.yml'
  workflow_dispatch:
jobs:
  pytest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: python -m pip install --upgrade pip pytest
      - run: python -m pytest tests/learning_examples -q --junitxml=pytest-report.xml
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pytest-report
          path: pytest-report.xml
          if-no-files-found: ignore
```
该工作流适合不依赖外部服务的教学用例。不要直接将本地数据库、个人凭证或未启动服务的测试塞入 CI。

## 失败排查
1. 阅读失败用例名和 traceback。
2. 检查 Python 版本、依赖、环境变量和服务状态。
3. 使用同一命令在本地复现。
4. 区分产品缺陷、脚本缺陷、环境问题和测试数据问题。
5. 修复后执行受影响用例与相关回归。

## CI/CD 概念
CI：频繁集成代码并自动构建/测试。持续交付：软件保持可发布状态，发布通常需批准。持续部署：通过验证的变更自动发布。练习阶段不要将示例流水线用于生产部署。

## 练习与验收
- [ ] 创建 feature 分支并提交用例
- [ ] 推送并在 Actions 中看到执行记录
- [ ] 故意让断言失败，查看 CI 日志
- [ ] 修复后重新运行
- [ ] 解释分支、commit、PR 和 CI 的关系
- [ ] 确认仓库没有密钥和真实数据
