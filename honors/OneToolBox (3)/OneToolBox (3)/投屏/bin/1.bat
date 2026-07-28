@echo off
fastboot devices >log.txt
set "zt=false"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "zt=true"
if "%zt%"=="true" (
fastboot devices
) else (
adb devices
)