$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $root "tests/api")
try {
  if(-not(Test-Path ".venv")){python -m venv .venv}
  & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  & .\.venv\Scripts\python.exe -m pytest -v --junitxml=pytest-report.xml
  if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
} finally {Pop-Location}
