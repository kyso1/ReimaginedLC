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
  $cpuByPid = @{}
  foreach ($proc in $p) {
    $cpuByPid[$proc.Id] = if ($proc.CPU) { $proc.CPU } else { 0 }
  }
  [pscustomobject]@{
    t            = Get-Date
    processes    = $p.Count
    workingSetMB = ($p | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    privateMB    = ($p | Measure-Object PrivateMemorySize64 -Sum).Sum / 1MB
    cpuByPid     = $cpuByPid
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

# Calculate CPU delta per PID across consecutive samples
$totalCpuDelta = 0
for ($i = 0; $i -lt $samples.Count - 1; $i++) {
  $earlier = $samples[$i]
  $later = $samples[$i + 1]
  foreach ($procId in $earlier.cpuByPid.Keys) {
    if ($later.cpuByPid.ContainsKey($procId)) {
      $delta = $later.cpuByPid[$procId] - $earlier.cpuByPid[$procId]
      if ($delta -gt 0) {
        $totalCpuDelta += $delta
      }
    }
  }
}

# Find min and max process count across all samples
$processCounts = $samples | ForEach-Object { $_.processes }
$minProcesses = $processCounts | Measure-Object -Minimum | Select-Object -ExpandProperty Minimum
$maxProcesses = $processCounts | Measure-Object -Maximum | Select-Object -ExpandProperty Maximum

$result = [ordered]@{
  label               = $Label
  takenAt             = (Get-Date).ToString('o')
  seconds             = [math]::Round($elapsed, 1)
  logicalCores        = [Environment]::ProcessorCount
  processes           = [ordered]@{ min = $minProcesses; max = $maxProcesses }
  workingSetMB        = [ordered]@{ avg = [math]::Round($ws.Average, 1); max = [math]::Round($ws.Maximum, 1) }
  privateMB           = [ordered]@{ avg = [math]::Round($pv.Average, 1); max = [math]::Round($pv.Maximum, 1) }
  cpuPercentOfOneCore = [math]::Round(100 * $totalCpuDelta / $elapsed, 2)
}

New-Item -ItemType Directory -Force 'docs/dump/baseline' | Out-Null
$path = "docs/dump/baseline/$Label.json"
$result | ConvertTo-Json -Depth 4 | Set-Content -Path $path -Encoding utf8
Write-Host "gravado: $path"
$result | ConvertTo-Json -Depth 4
