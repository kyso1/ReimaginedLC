<#
  ReimaginedLC helper.

  The LoL client can't read Windows folders. This script runs in the background (it starts with Windows) and serves,
  only to the client itself, the list and the files of two folders it finds on its own:
    - Wallpaper Engine: the Steam wallpaper folders (workshop 431960 and the user's own projects);
    - My folder: Pictures\ReimaginedLC (created if missing).
  It only listens on 127.0.0.1, only accepts requests from the client (origin https://127.0.0.1:<port>) and only
  serves files that are in the list, by an opaque id (never by path).

  It also maximizes the client window like a browser (fills the work area, the taskbar stays visible) and restores
  the previous size: Riot's client doesn't have this, and the page can't move or resize its own window.
#>
$ErrorActionPreference = 'Stop'
$Version = '4'

Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices;
public static class RlcWin {
  delegate bool EnumCb(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumCb cb, IntPtr l);
  [DllImport("user32.dll")] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern IntPtr GetParent(IntPtr h);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint f);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindow(string c, string t);
  // By the Riot window class: Pengu's DevTools also belongs to LeagueClientUx and can be its "main window".
  public static IntPtr Client() { return FindWindow("RCLIENT", null); }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  const uint NOZORDER_NOACTIVATE = 0x14;
  public static int[] Rect(IntPtr h) { RECT r; GetWindowRect(h, out r); return new[] { r.L, r.T, r.R - r.L, r.B - r.T }; }
  // The Riot window (RCLIENT) doesn't resize the Chromium area by itself: resize its two child windows too.
  public static void Place(IntPtr main, int x, int y, int w, int h) {
    if (IsZoomed(main)) ShowWindow(main, 9);
    SetWindowPos(main, IntPtr.Zero, x, y, w, h, NOZORDER_NOACTIVATE);
    EnumChildWindows(main, (c, l) => {
      if (GetParent(c) != main) return true;
      var s = new StringBuilder(64); GetClassName(c, s, 64);
      var k = s.ToString();
      if (k == "Chrome_WidgetWin_0" || k == "CefBrowserWindow") SetWindowPos(c, IntPtr.Zero, 0, 0, w, h, NOZORDER_NOACTIVATE);
      return true;
    }, IntPtr.Zero);
  }
}
"@

function Get-ClientWindow { return [RlcWin]::Client() }

# Size before maximizing (to restore it). Only saved when the window isn't already maximized by us.
$script:Restore = $null

function Get-WorkArea($hwnd) {
  $wa = [System.Windows.Forms.Screen]::FromHandle($hwnd).WorkingArea
  return @($wa.X, $wa.Y, $wa.Width, $wa.Height)
}

function Invoke-Maximize {
  $hwnd = Get-ClientWindow
  if ($hwnd -eq [IntPtr]::Zero) { return $false }
  $wa = Get-WorkArea $hwnd
  $now = [RlcWin]::Rect($hwnd)
  $already = ($now[0] -eq $wa[0] -and $now[1] -eq $wa[1] -and $now[2] -eq $wa[2] -and $now[3] -eq $wa[3])
  if (-not $already) { $script:Restore = $now }
  [RlcWin]::Place($hwnd, $wa[0], $wa[1], $wa[2], $wa[3])
  return $true
}

# Without the previous size (e.g. the helper restarted while the window was maximized): use the size the client
# sends (Riot's own window size), centered. Only accepts values that fit the work area.
function Invoke-Restore($w, $h) {
  $hwnd = Get-ClientWindow
  if ($hwnd -eq [IntPtr]::Zero) { return $false }
  $r = $script:Restore
  if (-not $r) {
    $wa = Get-WorkArea $hwnd
    $iw = 0; $ih = 0
    if (-not ([int]::TryParse([string]$w, [ref]$iw) -and [int]::TryParse([string]$h, [ref]$ih))) { return $false }
    if ($iw -lt 640 -or $ih -lt 360 -or $iw -gt $wa[2] -or $ih -gt $wa[3]) { return $false }
    $r = @(($wa[0] + [int](($wa[2] - $iw) / 2)), ($wa[1] + [int](($wa[3] - $ih) / 2)), $iw, $ih)
  }
  [RlcWin]::Place($hwnd, $r[0], $r[1], $r[2], $r[3])
  $script:Restore = $null
  return $true
}
# Ports the client tries, in this order (some machines have ports reserved by the system).
$Ports = @(38611, 41847, 45219, 47863)
$ImageExt = @('.jpg', '.jpeg', '.png', '.webp', '.gif')
$VideoExt = @('.mp4', '.webm')
$Mime = @{ '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'; '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm' }
# Max chunk per video response: the browser asks for the rest next (the server handles one request at a time).
$Chunk = 4MB

function Get-UserFolder {
  $dir = Join-Path ([Environment]::GetFolderPath('MyPictures')) 'ReimaginedLC'
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  return $dir
}

# Steam libraries: the main one (registry) and the ones in libraryfolders.vdf.
function Get-EngineFolders {
  $libs = @()
  try { $steam = (Get-ItemProperty 'HKCU:\Software\Valve\Steam' -ErrorAction Stop).SteamPath } catch { $steam = $null }
  if (-not $steam) { $steam = 'C:\Program Files (x86)\Steam' }
  $libs += $steam
  $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
  if (Test-Path $vdf) {
    foreach ($m in [regex]::Matches((Get-Content $vdf -Raw), '"path"\s+"([^"]+)"')) { $libs += $m.Groups[1].Value -replace '\\\\', '\' }
  }
  # The same library can come from the registry and the .vdf with different casing: keep it once.
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

# Relative path from project.json, accepted only if it is a regular file inside $dir: no '..', no absolute/UNC path
# and no junction/symlink along the way that could lead outside.
function Get-Inside([string]$dir, $rel) {
  if (-not ($rel -is [string]) -or -not $rel -or $rel.Contains('..') -or [IO.Path]::IsPathRooted($rel) -or $rel.StartsWith('\\') -or $rel.Contains(':')) { return $null }
  $root = [IO.Path]::GetFullPath($dir).TrimEnd('\') + '\'
  $full = [IO.Path]::GetFullPath((Join-Path $dir $rel))
  if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { return $null }
  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { return $null }
  $item = Get-Item -LiteralPath $full -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { return $null }
  for ($d = $item.Directory; $d -and $d.FullName.TrimEnd('\').Length -ge $root.TrimEnd('\').Length; $d = $d.Parent) {
    if ($d.Attributes -band [IO.FileAttributes]::ReparsePoint) { return $null }
  }
  return $full
}

function Get-Id([string]$prefix, [string]$path) {
  $sha = [Security.Cryptography.SHA1]::Create()
  $hash = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($path.ToLowerInvariant()))
  return $prefix + (($hash[0..7] | ForEach-Object { $_.ToString('x2') }) -join '')
}

# Index: id -> file (and thumbnail). Rebuilt at most every 10 s.
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
      # project.json comes from third parties (Workshop): only files inside the wallpaper's own folder count.
      $preview = Get-Inside $dir.FullName $p.preview
      $file = Get-Inside $dir.FullName $p.file
      $ext = if ($file) { [IO.Path]::GetExtension($file).ToLowerInvariant() } else { '' }
      $id = Get-Id 'e' $dir.FullName
      if ($p.type -and $p.type.ToLowerInvariant() -eq 'video' -and $file -and (Test-Path $file) -and ($VideoExt -contains $ext)) {
        # Video: actually plays in the client.
        $index[$id] = @{ file = $file; thumb = $preview }
        $list += [ordered]@{ id = $id; source = 'engine'; title = [string]$p.title; media = 'video'; mime = $Mime[$ext]; thumb = [bool]$preview }
      } elseif ($preview) {
        # Scene, web and application wallpapers only run inside Wallpaper Engine: use the preview (image or animated GIF).
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
      # Video without Range: send the beginning as partial content, and the browser continues with Range.
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

# Is a copy already running? It answers /v1/status on one of the ports. The app id 'reimaginedlc-fundos' is the
# protocol name the client looks for: kept as is so old and new helpers and theme versions keep recognizing each other.
foreach ($p in $Ports) {
  try { $s = Invoke-RestMethod -Uri "http://127.0.0.1:$p/v1/status" -TimeoutSec 1; if ($s.app -eq 'reimaginedlc-fundos') { exit 0 } } catch {}
}
# Token of this run (32 random bytes): the client gets it from /v1/token and sends it with every file request.
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$tokenBytes = New-Object byte[] 32
$rng.GetBytes($tokenBytes)
$Token = ($tokenBytes | ForEach-Object { $_.ToString('x2') }) -join ''

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
    # Client only: the Host must be ours and the browser origin, when present, https://127.0.0.1:<port>.
    $origin = $req.Headers['Origin']
    if ($req.Headers['Host'] -ne "127.0.0.1:$Port") { $res.StatusCode = 403; continue }
    $fromClient = $origin -and $origin -match '^https://127\.0\.0\.1:\d+$'
    if ($origin -and -not $fromClient) { $res.StatusCode = 403; continue }
    if ($fromClient) {
      $res.AddHeader('Access-Control-Allow-Origin', $origin)
      $res.AddHeader('Vary', 'Origin')
    }
    if ($req.HttpMethod -eq 'OPTIONS') { $res.AddHeader('Access-Control-Allow-Methods', 'GET, POST'); $res.StatusCode = 204; continue }
    $path = $req.Url.AbsolutePath
    if ($path -eq '/v1/status') {
      # Only what the client (and the installer) need to recognize the helper: no paths.
      Send-Json $res @{ app = 'reimaginedlc-fundos'; version = $Version }
    } elseif ($path -eq '/v1/token') {
      # The token only goes to the client origin (CORS): an arbitrary website can't read the response.
      if (-not $fromClient) { $res.StatusCode = 403; continue }
      Send-Json $res @{ token = $Token }
    } elseif ($path -eq '/v1/wallpapers') {
      if (-not $fromClient) { $res.StatusCode = 403; continue }
      Update-Index
      Send-Json $res @($script:List)
    } elseif ($path -match '^/v1/(file|thumb)/([ue][0-9a-f]{16})$') {
      # <img>/<video> don't send Origin: whoever asks for a file must show the token of the current run.
      if ($req.QueryString['k'] -ne $Token) { $res.StatusCode = 403; continue }
      Update-Index
      $entry = $script:Index[$Matches[2]]
      $target = if ($entry) { if ($Matches[1] -eq 'file') { $entry.file } else { $entry.thumb } } else { $null }
      if ($target -and (Test-Path $target)) { Send-File $req $res $target } else { $res.StatusCode = 404 }
    } elseif (($path -eq '/v1/window/maximize' -or $path -eq '/v1/window/restore') -and $req.HttpMethod -eq 'POST') {
      if (-not $fromClient) { $res.StatusCode = 403; continue }
      $done = if ($path -eq '/v1/window/maximize') { Invoke-Maximize } else { Invoke-Restore $req.QueryString['w'] $req.QueryString['h'] }
      Send-Json $res @{ ok = [bool]$done }
    } elseif ($path -eq '/v1/open-user-folder' -and $req.HttpMethod -eq 'POST') {
      if (-not $fromClient) { $res.StatusCode = 403; continue }
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
