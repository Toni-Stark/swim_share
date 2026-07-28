@echo off
fastboot devices >log.txt
set "reboot=adb shell getprop ro.boot.slot_suffix"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot getvar  current-slot"
%reboot%