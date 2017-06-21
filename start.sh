#!/bin/bash

if [ -n "$NO_LDAP" ]
 then
 	cp /vcf-miner/securityuserappNoLDAP.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war
else
	cp /vcf-miner/securityuserapp.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war
fi
/usr/local/apache-tomcat-7.0.62/bin/catalina.sh run &
mongod --storageEngine wiredTiger 
