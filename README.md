
# Getting VCF-Miner started with [Docker](https://www.docker.com/)

**Relevant links:**
 * [VCF-Miner Homepage](http://bioinformaticstools.mayo.edu/research/vcf-miner/) 
 

### VCF-Miner installation using Docker 

In a terminal, clone the repository:
```
git clone https://github.com/Steven-N-Hart/vcf-miner.git
cd vcf-miner
```
Next, build the image
```
docker build -t vcfminer . # Dont forget the '.'!
```
Run the image
``` 
docker run -e NO_LDAP=1 -d  -p 8888:8080 -v $PWD:/home -w /home vcfminer sh ./start.sh
```
Open a browser to http://your-ip:8888/vcf-miner/

```
Username: Admin
Password: temppass
```
**Reminders:** 
 * Doesn’t work on Internet Explorer

############################################################

## Installing on bare metal centos6 or [Docker](https://www.docker.com/)
```
yum install -y java-1.7.0-openjdk.x86_64 java-1.7.0-openjdk-devel wget tar unzip
wget http://repos.fedorapeople.org/repos/dchen/apache-maven/epel-apache-maven.repo -O /etc/yum.repos.d/epel-apache-maven.repo
yum install -y apache-maven
```

Download VCF Miner
```
wget https://github.com/Steven-N-Hart/vcf-miner/archive/master.zip
unzip master.zip
cd vcf-miner-master/
```

Add missing packages
```
cd extra_jars
mvn install:install-file -Dfile=mayo-commons-mongodb-3.0.9.jar -DpomFile=mayo-commons-mongodb-3.0.9.pom
mvn install:install-file -Dfile=securityuserapp-0.0.11.jar -DpomFile=securityuserapp-0.0.11.pom
mvn install:install-file -Dfile=webapp_commons-1.0.0.jar -DpomFile=webapp_commons-1.0.0.pom
mvn install:install-file -Dfile=mayo-commons-concurrency-1.0.0.jar -DpomFile=mayo-commons-concurrency-1.0.0.pom
mvn install:install-file -Dfile=mayo-commons-directory-2.0.0.jar -DpomFile=mayo-commons-directory-2.0.0.pom
mvn install:install-file -Dfile=mayo-commons-exec-0.0.7.jar -DpomFile=mayo-commons-exec-0.0.7.pom
mvn install:install-file -Dfile=mayo-commons-mq-1.0.5.jar -DpomFile=mayo-commons-mq-1.0.5.pom
mvn install:install-file -Dfile=pipes-3.0.14.jar -DpomFile=pipes-3.0.14.pom
cd ..
```

Install mongodb
```
wget -O /home/mongodb.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-3.0.3.tgz
tar -zxvf /home/mongodb.tgz -C /home/
cp /home/mongodb-linux-x86_64-rhel62-3.0.3/bin/* /bin
```

Create directries and tomcat user
```
mkdir -p /data/db /data/mongo /local2/tmp
chmod 775 -R /data/mongo /data/db /local2/tmp 
useradd tomcat7
chown -R tomcat7:tomcat7 /local2/tmp/
```

Get tomcat
```
wget http://archive.apache.org/dist/tomcat/tomcat-7/v7.0.62/bin/apache-tomcat-7.0.62.tar.gz
tar xvzf apache-tomcat-7.0.62.tar.gz
mv apache-tomcat-7.0.62 /usr/local
chmod 775 /usr/local/apache-tomcat-7.0.62/bin/*sh
```

Delpoy VCF MINER war files
```
cp mongo_svr.war /usr/local/apache-tomcat-7.0.62/webapps/
cp vcf-miner.war /usr/local/apache-tomcat-7.0.62/webapps/
```

# Copy the security war into the tomcat space:
```
cp securityuserappNoLDAP.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war
# unless you are using LDAP, then cp securityuserapp.war /usr/local/apache-tomcat-7.0.62/webapps/
```

Start the webserver
```
/usr/local/apache-tomcat-7.0.62/bin/catalina.sh start
```
Start the moongodb server

```
mongod --storageEngine wiredTiger
```


Now open your browser to `http://server_IP_address:8080/vcf-miner/` (but obviously using your IP address instead)
 * Username: Admin
 * Password: temppass

You are all set!

