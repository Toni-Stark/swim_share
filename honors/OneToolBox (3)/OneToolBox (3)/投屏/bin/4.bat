@echo off
fastboot devices >log.txt
set "reboot=adb reboot recovery"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot reboot recovery"
%reboot%