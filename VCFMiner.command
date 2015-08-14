#!/usr/bin/env bash
unset DYLD_LIBRARY_PATH ; unset LD_LIBRARY_PATH
mkdir -p ~/.boot2docker
if [ ! -f ~/.boot2docker/boot2docker.iso ]; then cp /usr/local/share/boot2docker/boot2docker.iso ~/.boot2docker/ ; fi
/usr/local/bin/boot2docker init 
/usr/local/bin/boot2docker up 
$(/usr/local/bin/boot2docker shellinit)
if [ ! -f ~/.boot2docker/boot2docker.iso ]; then cp /usr/local/share/boot2docker/boot2docker.iso ~/.boot2docker/ ; fi

export DOCKER_HOST=tcp://`boot2docker ip`:2376
export DOCKER_CERT_PATH=~/.boot2docker/certs/boot2docker-vm
export DOCKER_TLS_VERIFY=1

$(/usr/local/bin/boot2docker shellinit)

boot2docker start
VCF_MINER=VCFMINER_$RANDOM
docker run -d -p 8888:8080 --name=$VCF_MINER stevenhart/vcf-miner:v4.0.1
open -a "Google Chrome" http://`boot2docker ip`:8888/vcf-miner/
read -p "Press [Enter] key to stop VCF Miner..."
docker kill $VCF_MINER
docker rm $VCF_MINER 
kill -9 $(ps -p $PPID -o ppid=)