param(
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9-]+$')][string]$Label,
  [ValidateRange(10, 600)][int]$Seconds = 60,
  [ValidateRange(1, 30)][int]$Interval = 5
)
$ErrorActionPreference = 'Stop'
$names = 'LeagueClient', 'LeagueClientUx', 'LeagueClientUxRender'

function Get-Snapshot {
  $p = @(Get-Process -Name $names -ErrorAction SilentlyContinue)
  if ($p.Count -eq 0) { throw 'Client do League não está aberto.' }
  [pscustomobject]@{
    t            = Get-Date
    processes    = $p.Count
    workingSetMB = ($p | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    privateMB    = ($p | Measure-Object PrivateMemorySize64 -Sum).Sum / 1MB
    cpuSeconds   = ($p | Measure-Object CPU -Sum).Sum
  }
}

$samples = @(Get-Snapshot)
$count = [math]::Ceiling($Seconds / $Interval)
for ($i = 0; $i -lt $count; $i++) {
  Start-Sleep -Seconds $Interval
  $samples += Get-Snapshot
}

$elapsed = ($samples[-1].t - $samples[0].t).TotalSeconds
$ws = $samples | Measure-Object workingSetMB -Average -Maximum
$pv = $samples | Measure-Object privateMB -Average -Maximum

$result = [ordered]@{
  label               = $Label
  takenAt             = (Get-Date).ToString('o')
  seconds             = [math]::Round($elapsed, 1)
  logicalCores        = [Environment]::ProcessorCount
  processes           = $samples[-1].processes
  workingSetMB        = [ordered]@{ avg = [math]::Round($ws.Average, 1); max = [math]::Round($ws.Maximum, 1) }
  privateMB           = [ordered]@{ avg = [math]::Round($pv.Average, 1); max = [math]::Round($pv.Maximum, 1) }
  cpuPercentOfOneCore = [math]::Round(100 * ($samples[-1].cpuSeconds - $samples[0].cpuSeconds) / $elapsed, 2)
}

New-Item -ItemType Directory -Force 'docs/dump/baseline' | Out-Null
$path = "docs/dump/baseline/$Label.json"
$result | ConvertTo-Json -Depth 4 | Set-Content -Path $path -Encoding utf8
Write-Host "gravado: $path"
$result | ConvertTo-Json -Depth 4
