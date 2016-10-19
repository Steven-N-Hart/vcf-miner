
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

## Installing on bare metal

Before you begin, make sure you have the following dependencies:
* [Apache Maven](https://maven.apache.org/)
* Java JDK
* Java JRE 
* [Apache Tomcat](http://tomcat.apache.org/)

```
apt-get update
apt-get install -y maven default-jre default-jdk tomcat7 maven
```
Next, run the install script
```
sh install.sh
```

You should have 3 WAR files now.
```
./mongo_svr-4.0.3/target/mongo_svr-4.0.3.war
./mongo_view-4.0.3/target/vcf-miner.war
./securityuserapp.war
```
Next start tomcat



follow the UI
#security, svr, then vcf-miner .war

