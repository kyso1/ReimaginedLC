@echo off
rem Installs the ReimaginedLC helper (wallpapers + browser-like window maximize): copies the script to
rem %LOCALAPPDATA%\ReimaginedLC, adds a hidden Windows startup shortcut and starts it now. No admin needed.
rem To remove it: uninstall-helper.cmd.
setlocal
set "DEST=%LOCALAPPDATA%\ReimaginedLC"
if not exist "%DEST%" mkdir "%DEST%"
rem Update: stop any running helper, including the old one named rlc-fundos.ps1 (otherwise the new one sees it
rem running and exits), and remove the old startup shortcut and script.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'rlc-(helper|fundos)\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'ReimaginedLC fundos.lnk') -ErrorAction SilentlyContinue"
del /Q "%DEST%\rlc-fundos.ps1" 2>nul
copy /Y "%~dp0rlc-helper.ps1" "%DEST%\rlc-helper.ps1" >nul || (echo Could not find rlc-helper.ps1 next to this file. & pause & exit /b 1)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l = Join-Path ([Environment]::GetFolderPath('Startup')) 'ReimaginedLC helper.lnk'; $s = (New-Object -ComObject WScript.Shell).CreateShortcut($l); $s.TargetPath = 'powershell.exe'; $s.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%DEST%\rlc-helper.ps1\"'; $s.WindowStyle = 7; $s.Save()"
start "" /min powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%DEST%\rlc-helper.ps1"
echo.
echo ReimaginedLC helper installed and running.
echo  - Wallpaper Engine: found automatically through Steam.
echo  - Your folder: Pictures\ReimaginedLC (put images or mp4/webm videos there).
echo In the client: Settings ^> Appearance ^> Wallpapers, or the picture button on Home.
echo.
pause
