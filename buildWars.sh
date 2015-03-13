#!/bin/bash

## Show all lines
#set -x
## Exit on error
set -e

targetWar=$1
mongoUser=$2
mongoPass=$3


echo "targetWar = $targetWar"

function usage {
  echo ""
  echo ""
  echo "***************************************"
  echo "USAGE:  ./buildWars.sh  <targetWar>  [mongoUser]  [mongoPassword]"
  echo "Where <targetWar> is one of:"
  echo "    Default"
  echo "    Biordev"
  echo "    Rcftomdev1     (note: mongoUser and mongoPassword required)"
  echo "    Rcftomprod1    (note: mongoUser and mongoPassword required)"
  echo "    Virtualbox"
  echo "    Windows"
  echo ""
  echo "War files will be built under the ./target/<targetWar> directory"
  echo ""
  echo "Ex:     ./buildWars.sh  Biordev"
  echo "Ex:     ./buildWars.sh  Rcftomdev1  TU00112  'myPass123@#$^!'"
  echo "***************************************"
  echo ""
  echo ""

  exit 1
}


## If the user did not specify a war target 
##    OR the user did not choose a valid build option
##    OR they chose Rcftomdev1/Rcftomprod1 but did not specify a user & password
## Then show usage and exit
if [ -z "$targetWar" ] ; then 
  echo "ERROR: No target war specified"
  usage
fi

## Check if the user chose at least one of the target
warOptions=(
  'Default'
  'Biordev'
  'Rcftomdev1'
  'Rcftomprod1'
  'Virtualbox'
  'Windows'
  )
## These sysprops files must match the warOptions above (same order)
sysProps=(
  'sys.properties'
  'sys.properties.biordev'
  'sys.properties.rcftomdev1'
  'sys.properties.rcftomprod1'
  'sys.properties.virtualbox'
  'sys.properties.windows'
  )
isValidWarChosen="false"
arraySize=${#warOptions[@]}
idx=0
for i in `seq 0 $((arraySize-1))`; do
  if [ "${warOptions[i]}" == "$targetWar" ] ; then
     isValidWarChosen="true"
     idx=$i
  fi
done

## Check for valid option
if [ "true" == "$isValidWarChosen" ] ; then
  echo "Valid war option chosen"
else
  echo "ERROR: Please choose a valid War file option"
  usage
fi

## Check that a mongo user and password are specified when the Rcftomdev1 or Rcftomprod1 wars are chosen
## (show usage if case doesn't match -we want to match on case because we're using the war in directory and file names)
if [[ "$targetWar" == "Rcftomdev1" || "$targetWar" == "Rcftomprod1" ]] ; then
  if [[ -z "$mongoUser" || -z "$mongoPass" ]] ; then
    echo "Rcftomdev1 or Rcftomprod1 was specified as the target war; however, the Mongo username or password was not specified."
    usage
  fi
else
  echo "Dev or Prod not specified, so no username/password necessary"
fi

## Show error if not run from the project root dir
if [ ! -d "target" ] ; then
  echo "Error: This script should be run from the project root directory, and the target subdirectory must already exist"
  exit 1;
fi

## Check if the maven-built war file exists first (so we can copy it and modify each of the instances created from it)
war=`ls target/mongo_svr*.war | tail -1`
if [ ! -f "$war" ] ; then
  echo "Error: The war file must already be built:  target/mongo_svr*.war"
  echo "Run this command to build the war:  mvn clean package" 
  exit 1;
fi

mkdir -p target/Wars/Temp/WEB-INF/classes

## Add version to the Wars dir (ex: "v2.0.2" from "target/mongo_svr-2.0.2-SNAPSHOT.war") 
warVersion=v`ls $war | sed 's/target\///g' | sed 's/mongo_svr-//g' | sed 's/-SNAPSHOT//g' | sed 's/\.war//g'`
touch target/Wars/$warVersion

echo "Building war: target/Wars/$targetWar/mongo_svr.war"
mkdir -p target/Wars/$targetWar
cp $war target/Wars/$targetWar/mongo_svr.war


## Copy the appropriate sys.properties file to the Wars/Temp dir
sysProp=${sysProps[$idx]}
cp src/main/resources/$sysProp  target/Wars/Temp/WEB-INF/classes/sys.properties

## If the mongo username and password specified, then change the sys.properties to include it
if [ -n "$mongoUser" ]  &&  [ -n "$mongoPass" ] ; then
    props=`cat target/Wars/Temp/WEB-INF/classes/sys.properties | sed "s/mongo_user =.*$/mongo_user = $mongoUser/g"  |  sed "s/mongo_password =.*$/mongo_password = $mongoPass/g"`
    echo "$props" > target/Wars/Temp/WEB-INF/classes/sys.properties 
fi

## Update the war with the correct sys.properties
jar uvf target/Wars/$targetWar/mongo_svr.war  -C target/Wars/Temp  WEB-INF/classes/sys.properties


echo ""
echo "War file built: $targetWar"
echo "DONE."