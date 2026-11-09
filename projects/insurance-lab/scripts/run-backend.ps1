$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$projectDirectory = Join-Path $root "backend/Insurance.Api"
$project = Join-Path $projectDirectory "Insurance.Api.csproj"

# This script is intended for local development. Ensure the Development
# appsettings file and User Secrets are loaded consistently.
$previousDotnetEnvironment = $env:DOTNET_ENVIRONMENT
$previousAspNetCoreEnvironment = $env:ASPNETCORE_ENVIRONMENT

try {
    $env:DOTNET_ENVIRONMENT = "Development"
    $env:ASPNETCORE_ENVIRONMENT = "Development"

    Push-Location $projectDirectory
    try {
        Write-Host "Environment: Development"
        Write-Host "Project: $project"

        Write-Host "Building Insurance API..."
        dotnet build $project --configuration Debug
        if ($LASTEXITCODE -ne 0) {
            throw "Insurance API build failed with exit code $LASTEXITCODE. Startup cancelled."
        }

        Write-Host "Build succeeded. Starting Insurance API at http://localhost:5080 ..."
        dotnet run --no-build --project $project --configuration Debug --urls "http://localhost:5080"
        if ($LASTEXITCODE -ne 0) {
            throw "Insurance API exited with code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    # Do not leave environment changes in the caller's PowerShell session.
    if ($null -eq $previousDotnetEnvironment) {
        Remove-Item Env:DOTNET_ENVIRONMENT -ErrorAction SilentlyContinue
    }
    else {
        $env:DOTNET_ENVIRONMENT = $previousDotnetEnvironment
    }

    if ($null -eq $previousAspNetCoreEnvironment) {
        Remove-Item Env:ASPNETCORE_ENVIRONMENT -ErrorAction SilentlyContinue
    }
    else {
        $env:ASPNETCORE_ENVIRONMENT = $previousAspNetCoreEnvironment
    }
}
