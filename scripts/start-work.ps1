$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Join-Path $PSScriptRoot "..")

Write-Host "[start-work] CWD: $(Get-Location)"
Write-Host "[start-work] Running memory session start..."
npm run memory:session

Write-Host "[start-work] Done."
