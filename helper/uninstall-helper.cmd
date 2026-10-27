@echo off
rem Removes the ReimaginedLC helper: stops it, deletes the startup shortcut and the copied script (also the old
rem rlc-fundos.ps1 install). Your Pictures\ReimaginedLC folder and its files stay.
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'rlc-(helper|fundos)\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; $d = [Environment]::GetFolderPath('Startup'); Remove-Item (Join-Path $d 'ReimaginedLC helper.lnk'), (Join-Path $d 'ReimaginedLC fundos.lnk') -ErrorAction SilentlyContinue"
del /Q "%LOCALAPPDATA%\ReimaginedLC\rlc-helper.ps1" 2>nul
del /Q "%LOCALAPPDATA%\ReimaginedLC\rlc-fundos.ps1" 2>nul
echo ReimaginedLC helper removed. Your Pictures\ReimaginedLC folder is still there.
pause
