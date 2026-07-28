@echo off
fastboot devices >log.txt
set "reboot=adb shell getprop ro.build.version.incremental"
for /f "tokens=*" %%i in ('findstr "fastboot" "log.txt"') do set "reboot=fastboot getvar  system-fingerprint"
%reboot%