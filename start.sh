#!/bin/bash

if [ -n "$NO_LDAP" ]
 then
 	wget -O /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war https://github.com/Steven-N-Hart/vcf-miner/blob/master/securityuserappNoLDAP.war?raw=true
fi
/usr/local/apache-tomcat-7.0.62/bin/catalina.sh run &
mongod --storageEngine wiredTiger 
