@echo off
fastboot devices >log.txt
set "reboot=adb reboot bootloader"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot reboot bootloader"
%reboot%