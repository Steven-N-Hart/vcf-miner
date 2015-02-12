#!/bin/bash

mongoUser=$1
mongoPass=$2


## If the mongo user and password are not specified, then show a warning saying that the integration and prod wars will not work
if [ -z "$mongoUser" ]  ||  [ -z "$mongoPass" ] ; then
  echo ""
  echo ""
  echo "***************************************"
  echo "WARNING: No Mongo username and password specified, so the integration and production wars will not work"
  echo "         (A Mongo username and password must be specified to connect to the Mongo instance)"
  echo "USAGE:  ./buildWars.sh  <mongoUser>  <mongoPassword>"
  echo "Ex:     ./buildWars.sh  TU00112  myPass123"
  echo "Ex:     ./buildWars.sh  TU00112  'myPass123@#$^!'"
  echo "***************************************"
  echo ""
  echo ""
fi

## Exit on error
set -e

if [ ! -d "target" ] ; then
  echo "Error: This script should be run from the project root directory, and the target subdirectory must already exist"
  exit 1;
fi

## Check if the war file exists first (so we can copy it and modify each of the instances created from it)
war=`ls target/mongo_svr*.war | tail -1`
if [ ! -f "$war" ] ; then
  echo "Error: The war file must already be built:  target/mongo_svr*.war"
  exit 1;
fi

mkdir -p target/Wars/Temp/WEB-INF/classes

## Add version to the Wars dir (ex: "v2.0.2" from "target/mongo_svr-2.0.2-SNAPSHOT.war") 
warVersion=v`ls $war | sed 's/target\///g' | sed 's/mongo_svr-//g' | sed 's/-SNAPSHOT//g' | sed 's/\.war//g'`
touch target/Wars/$warVersion

## Create a war file for each server we want to deploy to
## Give it 3 parms.  For example:
##   war 		= target/mongo_svr-2.0.2-SNAPSHOT
##   targetDir 	= Biordev
##   sysProps 	= sys.properties.biordev
function crtWar() {
  war=$1
  warDir=$2
  sysProps=$3
  user=$4
  pass=$5

  echo "Building war: target/Wars/$warDir/mongo_svr.war"
  mkdir -p target/Wars/$warDir
  cp $war target/Wars/$warDir/mongo_svr.war

  ## Copy the appropriate sys.properties file to the Wars/Temp dir
  cp src/main/resources/$sysProps  target/Wars/Temp/WEB-INF/classes/sys.properties

  ## If the mongo username and password specified, then change the sys.properties to include it
  if [ -n "$user" ]  &&  [ -n "$pass" ] ; then
    props=`cat target/Wars/Temp/WEB-INF/classes/sys.properties | sed "s/mongo_user =.*$/mongo_user = $user/g"  |  sed "s/mongo_password =.*$/mongo_password = $pass/g"`
    echo "$props" > target/Wars/Temp/WEB-INF/classes/sys.properties 
  fi

  ## Update the war with the correct sys.properties
  jar uvf target/Wars/$warDir/mongo_svr.war  -C target/Wars/Temp  WEB-INF/classes/sys.properties
}

crtWar  $war  Default     sys.properties
crtWar  $war  Biordev     sys.properties.biordev
crtWar  $war  Rcftomdev1  sys.properties.rcftomdev1   $mongoUser  $mongoPass
crtWar  $war  Rcftomprod1 sys.properties.rcftomprod1  $mongoUser  $mongoPass
crtWar  $war  Virtualbox  sys.properties.virtualbox
crtWar  $war  Windows     sys.properties.windows
