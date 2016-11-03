
# Getting VCF-Miner started with [Docker](https://www.docker.com/)

**Relevant links:**
 * [VCF-Miner Homepage](http://bioinformaticstools.mayo.edu/research/vcf-miner/) 
 

### VCF-Miner installation using Docker for Mac and PC users

1.	Install [boot2docker](http://boot2docker.io/)
 *	Note: for Windows installers on 64-bit machines see [this](http://stackoverflow.com/questions/20647610/verr-vmx-msr-vmxon-disabled-when-starting-an-image-from-oracle-virtual-box) thread

2.	Download and double click the installer 
 * Right-click and `Save File As`
 * [PC](https://raw.githubusercontent.com/Steven-N-Hart/vcf-miner/master/VCFMiner.bat) or
 * [Mac](https://raw.githubusercontent.com/Steven-N-Hart/vcf-miner/master/VCFMiner.command)

3.	Chrome will automatically be launched after 60 seconds  
 *	The first time you use it, it will take longer because it needs to download the image
 *	If Chrome launches and the page isn’t displayed, wait another minute and refresh
 *	If you don’t have chrome point your browser to http://192.168.59.103:8888/vcf-miner/

### VCF-Miner installation or Linux users
1.	In a terminal, type the following:
> docker run -e NO_LDAP=1 -d -p 8888:8080 stevenhart/vcf-miner:latest /home/start.sh

2.	Open a browser to http://192.168.59.103:8888/vcf-miner/

**Reminders:** 
 * Doesn’t work on Internet Explorer

```
Username: Admin
Password: temppass
```

## Installing on bare metal ubuntu or [Docker](https://www.docker.com/)

Before you begin, make sure you have the following dependencies:
* [Apache Maven](https://maven.apache.org/)
* Java JDK
* Java JRE 
* [Apache Tomcat](http://tomcat.apache.org/)

If you are doing this on Docker, then run this command first:
```
docker run -it -p 8080:8080  ubuntu:latest bash
```
It tells docker to create a ubuntu virtual environment, opened with the `bash` prompt, with port 8080 exposed.  Otherwise, all steps are identical between docker and Ubuntu installation.


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
 * mongo_svr-4.0.3/target/mongo_svr-4.0.3.war
 * mongo_view-4.0.3/target/vcf-miner.war
 * securityuserapp.war

Set the default admins for tomcat by uncommenting these values in the `/etc/tomcat7/tomcat-users.xml` file
```
<role rolename="manager-gui"/>
<user username="tomcat" password="tomcat" roles="manager-gui"/>
# Note, these must be between the <tomcat-users> and </tomcat-users> tags
#perl -p -i -e 's/<tomcat-users>/<tomcat-users>\n<role rolename=\"manager-gui\"\/>\n<user username=\"tomcat\" password=\"tomcat\" roles=\"manager-gui\"\/>/' /etc/tomcat7/tomcat-users.xml
```
Set your JAVA_HOME variable
```
export JAVA_HOME=/usr/share/doc/default-jdk
```
Copy WAR files into tomcat directory
```
chown -R tomcat7:tomcat7 /local2/tmp/ 
cp ./securityuserapp.war /var/lib/tomcat7/webapps/
cp ./mongo_svr-4.0.3/target/mongo_svr-4.0.3.war /var/lib/tomcat7/webapps/
cp ./mongo_view-4.0.3/target/vcf-miner.war /var/lib/tomcat7/webapps/
```

Finally, start tomcat
```
#mkdir -p /usr/share/tomcat7/logs/

service tomcat7 start
```

Now open your browser to `http://server_IP_address:8080/vcf-miner/` (but obviously using your IP address instead)
 * Username: Admin
 * Password: temppass

You are all set!

