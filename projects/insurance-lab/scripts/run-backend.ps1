$ErrorActionPreference="Stop"
$root=Split-Path -Parent $PSScriptRoot
$project=Join-Path $root "backend/Insurance.Api/Insurance.Api.csproj"
Write-Host "Starting Insurance API at http://localhost:5080 ..."
dotnet run --project $project --urls http://localhost:5080
