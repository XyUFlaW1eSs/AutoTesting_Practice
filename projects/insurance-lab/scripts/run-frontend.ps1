$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $root "frontend")
try { if(-not(Test-Path "node_modules")){npm install};npm run dev } finally {Pop-Location}
