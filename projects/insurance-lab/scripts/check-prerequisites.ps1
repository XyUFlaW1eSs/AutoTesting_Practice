$ErrorActionPreference="Continue"
$checks=@(@{Name=".NET SDK";Command="dotnet";Args=@("--version")},@{Name="Node.js";Command="node";Args=@("--version")},@{Name="npm";Command="npm";Args=@("--version")},@{Name="Python";Command="python";Args=@("--version")},@{Name="PostgreSQL client";Command="psql";Args=@("--version")},@{Name="Git";Command="git";Args=@("--version")})
$failed=$false
foreach($check in $checks){if(Get-Command $check.Command -ErrorAction SilentlyContinue){$output=& $check.Command @($check.Args) 2>&1|Select-Object -First 1;Write-Host "[OK] $($check.Name): $output" -ForegroundColor Green}else{Write-Host "[MISSING] $($check.Name): $($check.Command) not found in PATH" -ForegroundColor Yellow;$failed=$true}}
if($failed){Write-Host "Install missing prerequisites, reopen terminal and rerun." -ForegroundColor Yellow;exit 1}
