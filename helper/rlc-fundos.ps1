<#
  Auxiliar de fundos do ReimaginedLC.

  O client do LoL não enxerga pastas do Windows. Este script roda em segundo plano (inicia com o Windows) e serve,
  só para o próprio client, a lista e os arquivos de duas pastas que ele acha sozinho:
    - Wallpaper Engine: as pastas de wallpapers do Steam (workshop 431960 e os projetos do próprio usuário);
    - Minha pasta: Imagens\ReimaginedLC (criada se não existir).
  Escuta só em 127.0.0.1, aceita só pedidos do client (origem https://127.0.0.1:<porta>) e só entrega arquivos que
  estão na lista, por um id opaco (nunca por caminho).
#>
$ErrorActionPreference = 'Stop'
$Version = '1'
# Portas que o client procura, nesta ordem (algumas máquinas têm portas presas pelo sistema).
$Ports = @(38611, 41847, 45219, 47863)
$ImageExt = @('.jpg', '.jpeg', '.png', '.webp', '.gif')
$VideoExt = @('.mp4', '.webm')
$Mime = @{ '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'; '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm' }
# Pedaço máximo por resposta de vídeo: o navegador pede o resto em seguida (o servidor atende um pedido por vez).
$Chunk = 4MB

function Get-UserFolder {
  $dir = Join-Path ([Environment]::GetFolderPath('MyPictures')) 'ReimaginedLC'
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  return $dir
}

# Bibliotecas do Steam: a principal (registro) e as de libraryfolders.vdf.
function Get-EngineFolders {
  $libs = @()
  try { $steam = (Get-ItemProperty 'HKCU:\Software\Valve\Steam' -ErrorAction Stop).SteamPath } catch { $steam = $null }
  if (-not $steam) { $steam = 'C:\Program Files (x86)\Steam' }
  $libs += $steam
  $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
  if (Test-Path $vdf) {
    foreach ($m in [regex]::Matches((Get-Content $vdf -Raw), '"path"\s+"([^"]+)"')) { $libs += $m.Groups[1].Value -replace '\\\\', '\' }
  }
  # A mesma biblioteca pode vir do registro e do .vdf com maiúsculas diferentes: uma vez só.
  $seen = @{}
  $dirs = @()
  foreach ($lib in $libs) {
    foreach ($sub in @('steamapps\workshop\content\431960', 'steamapps\common\wallpaper_engine\projects\myprojects')) {
      $d = Join-Path $lib $sub
      if (-not (Test-Path $d)) { continue }
      $full = (Get-Item $d).FullName.TrimEnd('\')
      $key = $full.ToLowerInvariant()
      if ($seen.ContainsKey($key)) { continue }
      $seen[$key] = $true
      $dirs += $full
    }
  }
  return $dirs
}

function Get-Id([string]$prefix, [string]$path) {
  $sha = [Security.Cryptography.SHA1]::Create()
  $hash = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($path.ToLowerInvariant()))
  return $prefix + (($hash[0..7] | ForEach-Object { $_.ToString('x2') }) -join '')
}

# Índice: id -> arquivo (e miniatura). Refeito no máximo a cada 10 s.
$script:Index = @{}
$script:List = @()
$script:IndexedAt = [datetime]::MinValue

function Update-Index {
  if (((Get-Date) - $script:IndexedAt).TotalSeconds -lt 10) { return }
  $index = @{}
  $list = @()
  $user = Get-UserFolder
  foreach ($f in (Get-ChildItem -Path $user -File -Recurse -Depth 1 -ErrorAction SilentlyContinue)) {
    $ext = $f.Extension.ToLowerInvariant()
    if (-not $Mime.ContainsKey($ext)) { continue }
    $id = Get-Id 'u' $f.FullName
    $video = $VideoExt -contains $ext
    $index[$id] = @{ file = $f.FullName; thumb = $(if ($video) { $null } else { $f.FullName }) }
    $list += [ordered]@{ id = $id; source = 'user'; title = $f.BaseName; media = $(if ($video) { 'video' } else { 'image' }); mime = $Mime[$ext]; thumb = -not $video }
  }
  foreach ($root in (Get-EngineFolders)) {
    foreach ($dir in (Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue)) {
      $pj = Join-Path $dir.FullName 'project.json'
      if (-not (Test-Path $pj)) { continue }
      try { $p = Get-Content $pj -Raw -Encoding UTF8 | ConvertFrom-Json } catch { continue }
      $preview = if ($p.preview) { Join-Path $dir.FullName $p.preview } else { $null }
      if ($preview -and -not (Test-Path $preview)) { $preview = $null }
      $file = if ($p.file) { Join-Path $dir.FullName $p.file } else { $null }
      $ext = if ($file) { [IO.Path]::GetExtension($file).ToLowerInvariant() } else { '' }
      $id = Get-Id 'e' $dir.FullName
      if ($p.type -and $p.type.ToLowerInvariant() -eq 'video' -and $file -and (Test-Path $file) -and ($VideoExt -contains $ext)) {
        # Vídeo: toca de verdade no client.
        $index[$id] = @{ file = $file; thumb = $preview }
        $list += [ordered]@{ id = $id; source = 'engine'; title = [string]$p.title; media = 'video'; mime = $Mime[$ext]; thumb = [bool]$preview }
      } elseif ($preview) {
        # Cena, web e aplicativo só rodam no Wallpaper Engine: vale a prévia (imagem ou GIF animado).
        $pext = [IO.Path]::GetExtension($preview).ToLowerInvariant()
        if (-not $Mime.ContainsKey($pext)) { continue }
        $index[$id] = @{ file = $preview; thumb = $preview }
        $list += [ordered]@{ id = $id; source = 'engine'; title = [string]$p.title; media = 'image'; mime = $Mime[$pext]; thumb = $true; preview = $true }
      }
    }
  }
  $script:Index = $index
  $script:List = $list
  $script:IndexedAt = Get-Date
}

function Send-Json($res, $obj) {
  $bytes = [Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 4 -Compress))
  $res.ContentType = 'application/json; charset=utf-8'
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-File($req, $res, [string]$path) {
  $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
  $fs = [IO.File]::OpenRead($path)
  try {
    $size = $fs.Length
    $start = 0; $end = $size - 1
    $range = $req.Headers['Range']
    if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
      if ($Matches[1]) { $start = [int64]$Matches[1] }
      if ($Matches[2]) { $end = [int64]$Matches[2] }
      if ($end -ge $size) { $end = $size - 1 }
      if ($end - $start + 1 -gt $Chunk) { $end = $start + $Chunk - 1 }
      if ($start -gt $end) { $res.StatusCode = 416; $res.AddHeader('Content-Range', "bytes */$size"); return }
      $res.StatusCode = 206
      $res.AddHeader('Content-Range', "bytes $start-$end/$size")
    } elseif ($VideoExt -contains $ext -and $size -gt $Chunk) {
      # Vídeo sem Range: devolve o começo como parcial, e o navegador continua por Range.
      $end = $Chunk - 1
      $res.StatusCode = 206
      $res.AddHeader('Content-Range', "bytes $start-$end/$size")
    }
    $res.AddHeader('Accept-Ranges', 'bytes')
    $res.AddHeader('Cache-Control', 'private, max-age=3600')
    $res.ContentType = $Mime[$ext]
    $len = $end - $start + 1
    $res.ContentLength64 = $len
    $fs.Seek($start, 'Begin') | Out-Null
    $buf = New-Object byte[] 65536
    $left = $len
    while ($left -gt 0) {
      $n = $fs.Read($buf, 0, [int][Math]::Min([int64]$buf.Length, [int64]$left))
      if ($n -le 0) { break }
      $res.OutputStream.Write($buf, 0, $n)
      $left -= $n
    }
  } finally { $fs.Dispose() }
}

# Já há uma cópia rodando? Ela responde /v1/status em alguma das portas.
foreach ($p in $Ports) {
  try { $s = Invoke-RestMethod -Uri "http://127.0.0.1:$p/v1/status" -TimeoutSec 1; if ($s.app -eq 'reimaginedlc-fundos') { exit 0 } } catch {}
}
$listener = $null
foreach ($p in $Ports) {
  $l = New-Object Net.HttpListener
  $l.Prefixes.Add("http://127.0.0.1:$p/")
  try { $l.Start(); $listener = $l; $Port = $p; break } catch { $l.Close() }
}
if (-not $listener) { exit 1 }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request; $res = $ctx.Response
  try {
    # Só o client: a origem do navegador tem de ser https://127.0.0.1:<porta>, e o Host tem de ser o nosso.
    $origin = $req.Headers['Origin']
    if ($req.Headers['Host'] -ne "127.0.0.1:$Port") { $res.StatusCode = 403; continue }
    if ($origin) {
      if ($origin -notmatch '^https://127\.0\.0\.1:\d+$') { $res.StatusCode = 403; continue }
      $res.AddHeader('Access-Control-Allow-Origin', $origin)
      $res.AddHeader('Vary', 'Origin')
    }
    if ($req.HttpMethod -eq 'OPTIONS') { $res.AddHeader('Access-Control-Allow-Methods', 'GET, POST'); $res.StatusCode = 204; continue }
    $path = $req.Url.AbsolutePath
    if ($path -eq '/v1/status') {
      Send-Json $res @{ app = 'reimaginedlc-fundos'; version = $Version; user = (Get-UserFolder); engine = @(Get-EngineFolders) }
    } elseif ($path -eq '/v1/wallpapers') {
      Update-Index
      Send-Json $res @($script:List)
    } elseif ($path -match '^/v1/(file|thumb)/([ue][0-9a-f]{16})$') {
      Update-Index
      $entry = $script:Index[$Matches[2]]
      $target = if ($entry) { if ($Matches[1] -eq 'file') { $entry.file } else { $entry.thumb } } else { $null }
      if ($target -and (Test-Path $target)) { Send-File $req $res $target } else { $res.StatusCode = 404 }
    } elseif ($path -eq '/v1/open-user-folder' -and $req.HttpMethod -eq 'POST') {
      Start-Process explorer.exe (Get-UserFolder)
      $res.StatusCode = 204
    } else {
      $res.StatusCode = 404
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.Close() } catch {}
  }
}
