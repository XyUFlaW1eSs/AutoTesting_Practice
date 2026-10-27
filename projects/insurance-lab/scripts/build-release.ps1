param([string]$Configuration="Release")
$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
$artifacts=Join-Path $root "artifacts"
$stage=Join-Path $artifacts "insurance-lab"
if(Test-Path $stage){Remove-Item $stage -Recurse -Force}
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Push-Location (Join-Path $root "backend/Insurance.Api")
try { dotnet publish -c $Configuration -o (Join-Path $stage "backend") } finally { Pop-Location }
Push-Location (Join-Path $root "frontend")
try { if(-not(Test-Path "node_modules")){npm install};npm run build;Copy-Item -Recurse -Force "dist" (Join-Path $stage "frontend") } finally { Pop-Location }
Copy-Item -Recurse -Force (Join-Path $root "database") (Join-Path $stage "database")
Copy-Item -Recurse -Force (Join-Path $root "docs") (Join-Path $stage "docs")
Copy-Item (Join-Path $root "README.md") $stage
$zip=Join-Path $artifacts "insurance-lab-$Configuration.zip"
if(Test-Path $zip){Remove-Item $zip -Force}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip
Write-Host "Package created: $zip" -ForegroundColor Green
