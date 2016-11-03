#!/bin/bash
cd extra_jars
mkdir -p /local2/tmp
chown -R tomcat7:tomcat7 /local2/tmp/
mvn install:install-file -Dfile=mayo-commons-mongodb-3.0.9.jar -DpomFile=mayo-commons-mongodb-3.0.9.pom
mvn install:install-file -Dfile=securityuserapp-0.0.11.jar -DpomFile=securityuserapp-0.0.11.pom
mvn install:install-file -Dfile=webapp_commons-1.0.0.jar -DpomFile=webapp_commons-1.0.0.pom
mvn install:install-file -Dfile=mayo-commons-concurrency-1.0.0.jar -DpomFile=mayo-commons-concurrency-1.0.0.pom
mvn install:install-file -Dfile=mayo-commons-directory-2.0.0.jar -DpomFile=mayo-commons-directory-2.0.0.pom
mvn install:install-file -Dfile=mayo-commons-exec-0.0.7.jar -DpomFile=mayo-commons-exec-0.0.7.pom
mvn install:install-file -Dfile=mayo-commons-mq-1.0.5.jar -DpomFile=mayo-commons-mq-1.0.5.pom
mvn install:install-file -Dfile=pipes-3.0.14.jar -DpomFile=pipes-3.0.14.pom


cd ../mongo_svr-4.0.3
#need to skip tests because order of execution cna change in different environments
mvn clean package -DskipTests

cd ../
cd mongo_view-4.0.3
mvn clean package
cd ..
mv mongo_svr-4.0.3/target/mongo_svr*.war mongo_svr-*/target/mongo_svr.war
