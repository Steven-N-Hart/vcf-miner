
# Getting VCF-Miner started with [Docker](https://www.docker.com/)

**Relevant links:**
 * [VCF-Miner Homepage](http://bioinformaticstools.mayo.edu/research/vcf-miner/) 
 

### VCF-Miner installation using Docker 

1.	In a terminal, clone the repository:
```
git clone https://github.com/Steven-N-Hart/vcf-miner.git
```
2. Next, build the image
```
docker build -t vcfminer . # Dont forget the '.'!
```
3. Run the image
``` 
docker run -e NO_LDAP=1 -d  -p 8888:8080 -v $PWD:/home -w /home  test sh ./start.sh
```
4.	Open a browser to http://your-ip:8888/vcf-miner/



```
Username: Admin
Password: temppass
```
**Reminders:** 
 * Doesn’t work on Internet Explorer

############################################################

## Installing on bare metal ubuntu or [Docker](https://www.docker.com/)

Before you begin, make sure you have the following dependencies:
* [Apache Maven](https://maven.apache.org/)
* Java JDK
* Java JRE 
* [Apache Tomcat](http://tomcat.apache.org/)

If you are doing this on Docker, then run this command first:
```
docker run -it -e NO_LDAP=1 -p 8080:8080  ubuntu:latest bash
```
It tells docker to create a ubuntu virtual environment, opened with the `bash` prompt, with port 8080 exposed.  Otherwise, all steps are identical between docker and Ubuntu installation.

otherwise, you need to export this variable to turn off LDAP authentication
```
export NO_LDAP=1 
```
Make sure you are up to date.
```
apt-get update
apt-get install -y maven default-jre default-jdk tomcat7 tomcat7-admin maven git vim mongodb
```

Next, download this repository
```
git clone https://github.com/Steven-N-Hart/vcf-miner.git
cd vcf-miner
```
Next, run the install script
```
sh install.sh
```

You should have 3 WAR files now.
 * mongo_svr-4.0.3/target/mongo_svr.war
 * mongo_view-4.0.3/target/vcf-miner.war
 * securityuserapp.war

Set the default admins for tomcat by uncommenting these values in the `/etc/tomcat7/tomcat-users.xml` file
```
#<role rolename="manager-gui"/>
#<user username="tomcat" password="tomcat" roles="manager-gui"/>
# Note, these must be between the <tomcat-users> and </tomcat-users> tags

perl -p -i -e 's/<tomcat-users>/<tomcat-users>\n<role rolename=\"manager-gui\"\/>\n<user username=\"tomcat\" password=\"tomcat\" roles=\"manager-gui\"\/>/' /etc/tomcat7/tomcat-users.xml
```
Set your JAVA_HOME variable
```
export JAVA_HOME=/usr/share/doc/default-jdk
```
Copy WAR files into tomcat directory
```
chown -R tomcat7:tomcat7 /local2/tmp/ 
cp ./securityuserapp.war /var/lib/tomcat7/webapps/
cp ./mongo_svr-4.0.3/target/mongo_svr.war /var/lib/tomcat7/webapps/
cp ./mongo_view-4.0.3/target/vcf-miner.war /var/lib/tomcat7/webapps/
```

Finally, start tomcat
```
service tomcat7 start
```

Now open your browser to `http://server_IP_address:8080/vcf-miner/` (but obviously using your IP address instead)
 * Username: Admin
 * Password: temppass

You are all set!

