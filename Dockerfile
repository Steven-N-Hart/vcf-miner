FROM centos:7
MAINTAINER Steven N Hart, PhD
# docker run -d -p 8888:8080 stevenhart/vcf-miner:v4.0.1 /home/start.sh 
RUN yum install -y java-1.7.0-openjdk.x86_64 java-1.7.0-openjdk-devel wget tar git
RUN wget -O /home/mongodb.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-3.0.3.tgz
RUN tar -zxvf /home/mongodb.tgz -C /home/
RUN cp /home/mongodb-linux-x86_64-rhel62-3.0.3/bin/* /bin

RUN mkdir -p /data/db /data/mongo /local2/tmp
RUN chmod 775 -R /data/mongo /data/db /local2/tmp 

#Get tomcat
RUN wget http://archive.apache.org/dist/tomcat/tomcat-7/v7.0.62/bin/apache-tomcat-7.0.62.tar.gz
RUN tar xvzf apache-tomcat-7.0.62.tar.gz
RUN mv apache-tomcat-7.0.62 /usr/local
RUN chmod 775 /usr/local/apache-tomcat-7.0.62/bin/*sh


#Get necessary files
RUN git clone https://github.com/Steven-N-Hart/vcf-miner.git && cd vcf-miner

#Delpoy VCF MINER war files
RUN cp /vcf-miner/mongo_svr.war /usr/local/apache-tomcat-7.0.62/webapps/
RUN cp /vcf-miner/vcf-miner.war /usr/local/apache-tomcat-7.0.62/webapps/
RUN cp /vcf-miner/securityuserappNoLDAP.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war

EXPOSE 8080

RUN chmod 775 /vcf-miner/start.sh

ENTRYPOINT sh /vcf-miner/start.sh
