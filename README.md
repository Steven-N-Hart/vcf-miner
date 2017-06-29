
# Getting VCF-Miner started with [Docker](https://www.docker.com/)


Type this into your commandline
```
docker run -d -p 8888:8080 stevenhart/vcf-miner
```
Alternatively, if you want to use a GUI:
1. Install and open [Kitematic](https://kitematic.com/)
2. Search for `stevenhart/vcf-miner`
3. Click `Create`

**Relevant links:**
 * [VCF-Miner Homepage](http://bioinformaticstools.mayo.edu/research/vcf-miner/) 
 
# More advanced usage
### VCF-Miner installation using Docker 

# Build locally
In a terminal, clone the repository:
```
git clone https://github.com/Steven-N-Hart/vcf-miner.git
cd vcf-miner
```


Next, build the image (see the following section if you get an error)

```
docker build -t vcfminer . # Dont forget the '.'!
```

**On a Mac**, when running 'docker build', you may need to run these commands to start the Docker daemon if you get this error: "**Cannot connect to the Docker daemon. Is the docker daemon running on this host?**"

```
# See: https://stackoverflow.com/questions/21871479/docker-cant-connect-to-docker-daemon
# And run these commands:
$ docker-machine start # Start virtual machine for docker
$ docker-machine env   # It helps to get environment variables
$ eval "$(docker-machine env default)" # Set environment variables
```

Run the image
``` 
docker run -d  -p 8888:8080 vcfminer
# To activate LDAP use:
# docker run -e LDAP=1 -d  -p 8888:8080 vcfminer
# note you will need IT help integrating with your existing LDAP!
```

Determine your docker IP Address.  (Note: You may need to run the commands under the "On a Mac" section to see the $DOCKER_HOST variable)

```
# For example, 
$ echo $DOCKER_HOST
tcp://192.168.99.100:2376
# In this case the IP address is: 192.168.99.100
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
USER=example_user

# Note you may need sudo access to install on bare metal
yum install -y java-1.7.0-openjdk.x86_64 java-1.7.0-openjdk-devel wget tar git
wget -O /home/${USER}/mongodb.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel62-3.0.3.tgz
tar -zxvf /home/${USER}/mongodb.tgz -C /home/${USER}
cp /home/${USER}/mongodb-linux-x86_64-rhel62-3.0.3/bin/* /bin

mkdir -p /data/db /data/mongo
chmod 775 -R /data/mongo /data/db 

#Get tomcat
wget http://archive.apache.org/dist/tomcat/tomcat-7/v7.0.62/bin/apache-tomcat-7.0.62.tar.gz
tar xvzf apache-tomcat-7.0.62.tar.gz
mv apache-tomcat-7.0.62 /usr/local
chmod 775 /usr/local/apache-tomcat-7.0.62/bin/*sh

#Delpoy VCF MINER war files
git clone https://github.com/Steven-N-Hart/vcf-miner.git
cd vcf-miner
cp *.war /usr/local/apache-tomcat-7.0.62/webapps/


#If you want to not use LDAP (cp securityuserapp-no-ldap.war /usr/local/apache-tomcat-7.0.62/webapps/securityuserapp.war)

echo -e '/usr/local/apache-tomcat-7.0.62/bin/catalina.sh &\nmongod --storageEngine wiredTiger' > start.sh
chmod 775 ./start.sh
./start.sh
```


Now open your browser to `http://server_IP_address:8080/vcf-miner/` (but obviously using your IP address instead)
 * Username: Admin
 * Password: temppass

You are all set!

