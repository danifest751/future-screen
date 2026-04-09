$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Join-Path $PSScriptRoot "..")

Write-Host "[end-work] CWD: $(Get-Location)"
Write-Host "[end-work] Saving memory session..."
npm run memory:session:save

Write-Host "[end-work] Done."
