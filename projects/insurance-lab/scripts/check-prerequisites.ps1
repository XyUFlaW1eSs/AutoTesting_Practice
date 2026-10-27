$ErrorActionPreference = "Continue"
$checks = @(
  @{ Name = ".NET SDK"; Command = "dotnet" },
  @{ Name = "Node.js"; Command = "node" },
  @{ Name = "npm"; Command = "npm" },
  @{ Name = "Python"; Command = "python" },
  @{ Name = "PostgreSQL client"; Command = "psql" },
  @{ Name = "Git"; Command = "git" }
)
$failed = $false
foreach ($check in $checks) {
  if (Get-Command $check.Command -ErrorAction SilentlyContinue) {
    $output = & $check.Command --version 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) { Write-Host "[OK] $($check.Name): $output" -ForegroundColor Green }
    else { Write-Host "[WARN] $($check.Name): command exists but version check failed" -ForegroundColor Yellow }
  } else {
    Write-Host "[MISSING] $($check.Name): command '$($check.Command)' not found in PATH" -ForegroundColor Yellow
    $failed = $true
  }
}
if ($failed) {
  Write-Host "Install missing prerequisites, reopen terminal and rerun." -ForegroundColor Yellow
  exit 1
}
