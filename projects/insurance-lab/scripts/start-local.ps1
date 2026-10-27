$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $PSScriptRoot "run-backend.ps1"
$frontend = Join-Path $PSScriptRoot "run-frontend.ps1"
Write-Host "Starting API and Vue frontend in separate PowerShell windows..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList @("-NoExit","-ExecutionPolicy","Bypass","-File",$backend) -WorkingDirectory $root
Start-Sleep -Seconds 2
Start-Process powershell.exe -ArgumentList @("-NoExit","-ExecutionPolicy","Bypass","-File",$frontend) -WorkingDirectory $root
Write-Host "API: http://localhost:5080/swagger" -ForegroundColor Green
Write-Host "UI : http://localhost:5173" -ForegroundColor Green
Write-Host "Close the two launched terminal windows to stop the processes."
