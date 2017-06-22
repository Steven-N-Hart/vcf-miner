#!/bin/bash

if [ -n "$LDAP" ]
 then
 	wget -O /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war https://github.com/Steven-N-Hart/vcf-miner/blob/master/securityuserapp.war?raw=true
fi
/usr/local/apache-tomcat-7.0.62/bin/catalina.sh run &
mongod --storageEngine wiredTiger 
