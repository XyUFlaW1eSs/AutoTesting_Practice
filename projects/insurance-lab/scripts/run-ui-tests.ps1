$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$testDir = Join-Path $root "tests/ui"
Push-Location $testDir
try {
  if (-not (Test-Path ".venv")) { python -m venv .venv }
  $python = Join-Path $testDir ".venv/Scripts/python.exe"
  & $python -m pip install -r requirements.txt
  & $python -m playwright install chromium
  & $python -m pytest -v --junitxml=ui-pytest-report.xml
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }
