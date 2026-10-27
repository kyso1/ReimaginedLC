@echo off
rem Remove o auxiliar de fundos do ReimaginedLC: para o processo, apaga o atalho de inicializacao e o script copiado.
rem A pasta Imagens\ReimaginedLC e os seus arquivos ficam.
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'rlc-fundos\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'ReimaginedLC fundos.lnk') -ErrorAction SilentlyContinue"
del /Q "%LOCALAPPDATA%\ReimaginedLC\rlc-fundos.ps1" 2>nul
echo Auxiliar de fundos removido. A pasta Imagens\ReimaginedLC continua no lugar.
pause
