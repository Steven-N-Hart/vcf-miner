#!/bin/bash
mkdir -p /local2/tmp
if [ -n "$NO_LDAP" ]
 then
  /bin/cp /home/securityuserapp-no-ldap.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war
fi
/usr/local/apache-tomcat-7.0.62/bin/catalina.sh run &
mongod --storageEngine wiredTiger
