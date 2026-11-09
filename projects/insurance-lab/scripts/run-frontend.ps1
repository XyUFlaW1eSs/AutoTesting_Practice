$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDirectory = Join-Path $root "frontend"

Push-Location $frontendDirectory
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Dependencies not found. Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend dependency installation failed with exit code $LASTEXITCODE."
        }
    }

    Write-Host "Building Vue frontend..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed with exit code $LASTEXITCODE. Startup cancelled."
    }

    # Use the Vite development server so the configured server port and
    # development behavior in vite.config.ts are respected.
    Write-Host "Build succeeded. Starting Vue frontend..."
    npm run dev
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend development server exited with code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
