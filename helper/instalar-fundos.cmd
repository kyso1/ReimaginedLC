@echo off
rem Instala o auxiliar de fundos do ReimaginedLC: copia o script para %LOCALAPPDATA%\ReimaginedLC, cria o atalho de
rem inicializacao do Windows (roda escondido) e ja inicia. Nao precisa de administrador. Para remover: remover-fundos.cmd.
setlocal
set "DEST=%LOCALAPPDATA%\ReimaginedLC"
if not exist "%DEST%" mkdir "%DEST%"
rem Atualizacao: para o auxiliar antigo (senao o novo ve o antigo rodando e sai).
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -match 'rlc-fundos\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
copy /Y "%~dp0rlc-fundos.ps1" "%DEST%\rlc-fundos.ps1" >nul || (echo Nao achei rlc-fundos.ps1 ao lado deste arquivo. & pause & exit /b 1)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l = Join-Path ([Environment]::GetFolderPath('Startup')) 'ReimaginedLC fundos.lnk'; $s = (New-Object -ComObject WScript.Shell).CreateShortcut($l); $s.TargetPath = 'powershell.exe'; $s.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%DEST%\rlc-fundos.ps1\"'; $s.WindowStyle = 7; $s.Save()"
start "" /min powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%DEST%\rlc-fundos.ps1"
echo.
echo Auxiliar de fundos instalado e rodando.
echo  - Wallpaper Engine: encontrado automaticamente pelo Steam.
echo  - Sua pasta: Imagens\ReimaginedLC (coloque imagens ou videos mp4/webm la).
echo No client: Configuracoes ^> Aparencia ^> Papeis de parede, ou o botao de imagem no Inicio.
echo.
pause
