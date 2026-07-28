@echo off
fastboot devices >log.txt
set "reboot=adb reboot edl"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot oem edl"
%reboot%