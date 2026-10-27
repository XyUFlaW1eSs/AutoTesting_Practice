param([string]$Psql="psql",[string]$Database="insurance_lab",[string]$User="postgres",[string]$HostName="localhost",[int]$Port=5432)
$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
$secure=Read-Host "PostgreSQL password for $User" -AsSecureString
$bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:PGPASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  & $Psql -h $HostName -p $Port -U $User -d postgres -c "SELECT 1" | Out-Null
  if($LASTEXITCODE -ne 0){throw "Cannot connect to PostgreSQL. Check host, port, user and password."}
  $exists=& $Psql -h $HostName -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'"
  if("$exists".Trim() -ne "1"){& $Psql -h $HostName -p $Port -U $User -d postgres -c "CREATE DATABASE $Database";if($LASTEXITCODE -ne 0){throw "Database creation failed."}}
  & $Psql -h $HostName -p $Port -U $User -d $Database -f (Join-Path $root "database/001-init.sql")
  if($LASTEXITCODE -ne 0){throw "Schema initialization failed."}
  Write-Host "Database '$Database' initialized. Existing data was not dropped." -ForegroundColor Green
} finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue;[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
