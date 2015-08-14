
 # Getting VCF-Miner started with <img src="http://blog.phusion.nl/wp-content/uploads/2013/11/docker.png" width="70" height="50" alt="Docker">

**Relevant links:**

 * [VCF-Miner Homepage](http://bioinformaticstools.mayo.edu/research/vcf-miner/) 
 

VCF-Miner installation for Mac and PC users

1.	Install [boot2docker](http://boot2docker.io/).  
 *	Note: for Windows installers on 64-bit machines see [this](http://stackoverflow.com/questions/20647610/verr-vmx-msr-vmxon-disabled-when-starting-an-image-from-oracle-virtual-box) thread

2.	Download and double click the installer 
 * <a href="https://raw.githubusercontent.com/Steven-N-Hart/vcf-miner/master/VCFMiner.bat" download> PC </a>or
 * <a href="https://raw.githubusercontent.com/Steven-N-Hart/vcf-miner/master/VCFMiner.command" download> Mac </a>

3.	Chrome will automatically be launched after 60 seconds
 *	The first time you use it, it will take longer because it needs to download the image
 *	If Chrome launches and the page isn’t displayed, wait another minute and refresh
 *	If you don’t have chrome point your browser to http://192.168.59.103:8888/vcf-miner/

For Linux users
1.	In a terminal, type the following:
> docker run -e NO_LDAP=1 -d -p 8888:8080 stevenhart/vcf-miner:latest /home/start.sh

2.	Open a browser to http://192.168.59.103:8888/vcf-miner/

Reminders: 
 * Doesn’t work on Internet Explorer

```
Username: Admin
Password: temppass
```