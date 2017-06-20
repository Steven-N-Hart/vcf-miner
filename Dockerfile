FROM centos:6
MAINTAINER Steven N Hart, PhD
# docker run -d -p 8888:8080 stevenhart/vcf-miner:v4.0.1 /home/start.sh 
RUN yum install -y java-1.7.0-openjdk.x86_64 java-1.7.0-openjdk-devel wget tar
RUN wget -O /home/mongodb.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-3.0.3.tgz
RUN tar -zxvf /home/mongodb.tgz -C /home/
RUN cp /home/mongodb-linux-x86_64-rhel62-3.0.3/bin/* /bin

RUN mkdir -p /data/db /data/mongo /local2/tmp
RUN chmod 775 -R /data/mongo /data/db /local2/tmp 

#Get tomcat
#RUN wget http://mirror.tcpdiag.net/apache/tomcat/tomcat-7/v7.0.62/bin/apache-tomcat-7.0.62.tar.gz
RUN wget http://archive.apache.org/dist/tomcat/tomcat-7/v7.0.62/bin/apache-tomcat-7.0.62.tar.gz
RUN tar xvzf apache-tomcat-7.0.62.tar.gz
RUN mv apache-tomcat-7.0.62 /usr/local
RUN chmod 775 /usr/local/apache-tomcat-7.0.62/bin/*sh

#Delpoy VCF MINER war files
COPY mongo_svr.war /usr/local/apache-tomcat-7.0.62/webapps/
COPY vcf-miner.war /usr/local/apache-tomcat-7.0.62/webapps/

RUN echo -e '#!/bin/bash\nmkdir -p /local2/tmp\nif [ -n "$NO_LDAP" ]\n then \n/bin/cp /home/securityuserapp-no-ldap.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war\nfi\n' > start.sh
RUN echo -e '/usr/local/apache-tomcat-7.0.62/bin/catalina.sh run &\nmongod --storageEngine wiredTiger' >> start.sh

RUN chmod 775 ./start.sh

ENTRYPOINT /start.sh
