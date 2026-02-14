$ErrorActionPreference = 'Stop'
$root = 'd:\ai t6ext\my-litrpg-gameztrui'
$frontendOut = Join-Path $root '.audit_tmp\10-dev-frontend.out.log'
$frontendErr = Join-Path $root '.audit_tmp\10-dev-frontend.err.log'
$apiOut = Join-Path $root '.audit_tmp\11-dev-api.out.log'
$apiErr = Join-Path $root '.audit_tmp\11-dev-api.err.log'
$summaryLog = Join-Path $root '.audit_tmp\12-smoke-summary.log'
$paths = @($frontendOut,$frontendErr,$apiOut,$apiErr,$summaryLog)
foreach ($p in $paths) { if (Test-Path $p) { Remove-Item $p -Force } }
$frontend = Start-Process -FilePath cmd.exe -ArgumentList '/c npm run dev -- --host 127.0.0.1 --port 4173 --strictPort' -PassThru -WindowStyle Hidden -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr -WorkingDirectory $root
$api = Start-Process -FilePath cmd.exe -ArgumentList '/c npm run dev:api' -PassThru -WindowStyle Hidden -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr -WorkingDirectory $root
$frontendOk = $false
$apiOk = $false
for ($i = 0; $i -lt 120; $i++) {
  Start-Sleep -Seconds 2
  if (-not $frontendOk) {
    try {
      $r1 = Invoke-WebRequest -Uri 'http://127.0.0.1:4173' -UseBasicParsing -TimeoutSec 3
      if ($r1.StatusCode -eq 200) { $frontendOk = $true }
    } catch {}
  }
  if (-not $apiOk) {
    try {
      $r2 = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/health' -UseBasicParsing -TimeoutSec 3
      if ($r2.StatusCode -eq 200) { $apiOk = $true }
    } catch {}
  }
  if ($frontendOk -and $apiOk) { break }
}
"FRONTEND_SMOKE_OK=$frontendOk" | Tee-Object -FilePath $summaryLog -Append
"API_SMOKE_OK=$apiOk" | Tee-Object -FilePath $summaryLog -Append
if ($frontend -and -not $frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
if ($api -and -not $api.HasExited) { Stop-Process -Id $api.Id -Force }
Start-Sleep -Seconds 2
if (-not $frontendOk -or -not $apiOk) { exit 1 }
