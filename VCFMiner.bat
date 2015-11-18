@echo on
setlocal enabledelayedexpansion
set PATH=%PATH%;"c:\Program Files (x86)\Git\bin"
boot2docker start
for /f %%i in ('boot2docker ip') do set VAR=%%i

set DOCKER_HOST=tcp://%VAR%:2376
set DOCKER_CERT_PATH=C:\Users\%username%\.boot2docker\certs\boot2docker-vm
set DOCKER_TLS_VERIFY=1
set tmpname=VCFMINER_%random%
docker run --name=%tmpname%  -e NO_LDAP=1 -d -p 8888:8080 stevenhart/vcf-miner:latest /home/start.sh
SLEEP 60
start chrome %VAR%:8888/vcf-miner/
PAUSE
docker kill %tmpname%
docker rm %tmpname%
