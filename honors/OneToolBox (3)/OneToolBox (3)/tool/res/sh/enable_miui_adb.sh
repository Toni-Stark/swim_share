#!/bin/sh
echo "------enable_miui_adb------"

echo "1. Enable USB debugging (Security settings)"

cd `dirname $0`
RESULT=`getprop persist.security.adbinput`
if [ "$RESULT" != "1" ]
then
    setprop persist.security.adbinput 1
fi

echo "2. Enable Fastboot"

RESULT=`getprop persist.fastboot.enable`
if [ "$RESULT" != "1" ]
then
    setprop persist.fastboot.enable 1
fi

# 检查包名和XML文件位置
XML_FILE=""
SECURITY_PACKAGE=""

echo "3. Checking security package..."
if [ -d "/data/data/com.miui.securitycenter" ]; then
    SECURITY_PACKAGE="com.miui.securitycenter"
    XML_FILE="/data/data/com.miui.securitycenter/shared_prefs/remote_provider_preferences.xml"
    echo "Found com.miui.securitycenter"
elif [ -d "/data/data/com.miui.securitymanager" ]; then
    SECURITY_PACKAGE="com.miui.securitymanager"
    XML_FILE="/data/data/com.miui.securitymanager/shared_prefs/remote_provider_preferences.xml"
    echo "Found com.miui.securitymanager"
else
    echo "Security package not found!"
    exit 1
fi

echo "Now modify $XML_FILE"

echo "4. Enable Installation via USB"
if grep "security_adb_install_enable" $XML_FILE >/dev/null 2>&1
then
    echo "Find security_adb_install_enable"
    sed -i '/security_adb_install_enable/s/false/true/' $XML_FILE
else
    echo "Cannot find security_adb_install_enable, inserting..."
    sed -i '3a \ \ \ \ <boolean name="security_adb_install_enable" value="true" />' $XML_FILE
fi
grep "security_adb_install_enable" $XML_FILE

echo "5. Disable install intercept"
if grep "permcenter_install_intercept_enabled" $XML_FILE >/dev/null 2>&1
then
    echo "Find permcenter_install_intercept_enabled"
    sed -i '/permcenter_install_intercept_enabled/s/true/false/' $XML_FILE
else
    echo "Cannot find permcenter_install_intercept_enabled, inserting..."
    sed -i '3a \ \ \ \ <boolean name="permcenter_install_intercept_enabled" value="false" />' $XML_FILE
fi
grep "permcenter_install_intercept_enabled" $XML_FILE

# 根据实际包名重启对应服务
if [ "$SECURITY_PACKAGE" = "com.miui.securitycenter" ]; then
    echo "6. Restarting security center service..."
    kill -9 $(pidof com.miui.securitycenter.remote) 2>/dev/null
elif [ "$SECURITY_PACKAGE" = "com.miui.securitymanager" ]; then
    echo "6. Restarting security manager service..."
    kill -9 $(pidof com.miui.securitymanager.remote) 2>/dev/null
fi

echo "All done!"