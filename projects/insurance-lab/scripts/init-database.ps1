param(
    [string]$Psql = "E:\DevelopTools\DataBase\PostgreSQL\bin\psql.exe",
    [string]$Database = "insurance_lab",
    [string]$User = "postgres",
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432
)

# 强制将环境变量与控制台设置为 UTF8
$env:PGCLIENTENCODING = "UTF8"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$secure = Read-Host "PostgreSQL password for $User" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

    # 1. 测试数据库连接
    $testOutput = & $Psql -h $HostName -p $Port -U $User -d postgres -c "SELECT 1" 2>&1 | Out-String

    if ($LASTEXITCODE -ne 0) {
        Write-Host "PostgreSQL error details:" -ForegroundColor Red
        Write-Host $testOutput -ForegroundColor Yellow
        throw "Cannot connect to PostgreSQL. Check host, port, user and password."
    }

    # 2. 检查目标数据库是否存在
    $exists = & $Psql -h $HostName -p $Port -U $User -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$Database'"
    if ("$exists".Trim() -ne "1") {
        & $Psql -h $HostName -p $Port -U $User -d postgres -c "CREATE DATABASE $Database"
        if ($LASTEXITCODE -ne 0) { throw "Database creation failed." }
    }

    # 3. 执行 SQL 初始化脚本
    $sqlFile = Join-Path $root "database/001-init.sql"
    & $Psql -h $HostName -p $Port -U $User -d $Database -f $sqlFile
    if ($LASTEXITCODE -ne 0) { throw "Schema initialization failed." }

    Write-Host "Database '$Database' initialized successfully." -ForegroundColor Green
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}