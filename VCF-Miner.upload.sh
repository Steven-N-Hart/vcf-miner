
####################
## Script Options ##
####################
SERVER="http://rcftomprod1:8886"
#SERVER="http://roecad001a.mayo.edu:8080"
#SERVER="http://ngsqvm01.mayo.edu:8080"
usage ()
{
cat << EOF

##########################################################################################################
##
##  This script will perform various tasks to submit or modify data sent to VCF Miner
##
## Script Options:
##  -p  PASSWORD    - (REQUIRED)
##  -a  <alias>     - Use this name instead of the VCF's file name
##  -g  <groupname> - Assign to a new/existing lab or project group
##  -h  Display this usage/help text
##  -m  <usernames> - Comma separated list of usernames that have access to the group
##  -s  <server>    - Server to use instead of the default
##  -v  <input.vcf> - path to the VCF to load
##  -w <workspaceID> - workspace ID of VCF to remove
##
## Available Functions:
##  -f <function>
##    FUNCTION              REQUIRES  EXPLANATION
##    ---------------------------------------------------------------
##    addVCF                   -upvg     Upload a VCF to a new or existing group (group is optional)
##    addVCFToGroup            -upvg     Add an existing VCF to an existing group
##    addUsersToGroup          -upgm     Add a list of users to a group
##    createGroup              -upgm     Create a new group and add a user list to it
##    deleteGroup              -upg      Delete group from VCF Miner (requires that user is group owner
##                                         or an administrator)
##    listGroups               -up       List group names accessible by the current user
##    listPermissionsForGroup  -upg      List permissions for this group's resources
##    listResourcesForGroup    -upg      List resources accessible for the specified group
##    listResourcesForUser     -up       List resources accessible by the current user
##    listUsersInGroup         -upg      List users in specified group
##    removeUsersFromGroup     -upgm     Remove a list of users from the group
##    removeVCF 	       -upw      Removes a VCF file from the security and mongo apps
##
#########################################################################################################



EOF
}
echo "Options specified: $@"

while getopts "a:h:p:u:v:g:df:m:s:w:" OPTION; do
  case $OPTION in
    h) usage
      exit ;;
    p) PASSWORD=$OPTARG ;;
    u) USERID=$OPTARG ;;
    a) ALIAS=$OPTARG ;;
    v) VCF=$OPTARG ;;
    g) GROUPID=$OPTARG ;;
    f) FUNCTION=$OPTARG ;;
    m) MEMBERS=$OPTARG ;;
    s) SERVER=$OPTARG ;;
    w) WORKSPACE_ID=$OPTARG ;;
    d) DEBUG=1 
	set -x
	;;

   \?) echo "Invalid option: -$OPTION. See output file for usage." >&2
       usage
       exit ;;
    :) echo "Option -$OPTION requires an argument. See output file for usage." >&2
       usage
       exit ;;
  esac
done

### Handle required parameters ###

#Check for userID and Password
if [ -z "$USERID" ] ; 
then
	USERID=`whoami` 
fi

if [ "$#" -eq 0 ]; 
then
	usage
	exit
fi


VCF_TOKEN_FILE="/home/$USERID/.vcf-miner-token"

if [ -e "$VCF_TOKEN_FILE" ] && [[ $(grep "$SERVER" $VCF_TOKEN_FILE | cut -f3) -gt $(date +%s --date="719 min ago") ]] && [[ $(grep "$SERVER" "$VCF_TOKEN_FILE") ]]
then
  TOKEN=`grep $SERVER /home/$USERID/.vcf-miner-token | cut -f 2`
  echo "TOKEN=$TOKEN"
else
  # If password not specified on command line, prompt for it here.
  if [ -z "$PASSWORD" ]
  then
    read -s -p "Password for user $USERID: " PASSWORD
  fi


  # Get User token
  TOKEN=`curl --request POST -s --data "username=${USERID}&password=${PASSWORD}&appkey=VcfMiner" ${SERVER}/securityuserapp/api/login|cut -f6 -d"\""`
  if [ -z "$TOKEN" ]
  then
    echo "ERROR!!!! Your credentials do not seem to be working!"
    exit 1
  fi

  # If the server already exists, replace the original token. Otherwise, append it to the file.
  if [ -e "$VCF_TOKEN_FILE" ] && [[ $(grep "$SERVER" "$VCF_TOKEN_FILE") ]]
  then
    #perl -p -i -e 's/^$SERVER.*$/$SERVER\t$TOKEN\t$(date +%s)/' $VCF_TOKEN_FILE
    grep -v $SERVER /home/$USERID/.vcf-miner-token > /home/$USERID/.vcf-miner-token.tmp
    mv /home/$USERID/.vcf-miner-token.tmp /home/$USERID/.vcf-miner-token
  fi
  
  echo -e "$SERVER\t$TOKEN\t$(date +%s)" >> /home/$USERID/.vcf-miner-token
fi

if [ ! -z "$DEBUG" ]
then 
	echo "User token is $TOKEN"
fi

#GET APPGROUP ID
if [ ! -z "$GROUPID" ]
then
  APPGROUPID=`curl -s --data "groupname=$GROUPID" ${SERVER}/securityuserapp/api/groups  --request POST --header "usertoken:${TOKEN}"|perl -pne 's/},{/},\n{/g'|grep $GROUPID|json_reformat|grep id|perl -ane '$res=($F[1]=~s/,//);print "@F[1]\n"'`
fi

if [[ -z "$ALIAS" && ! -z "$VCF" ]]
then
  ALIAS=`basename $VCF`
fi

if [  "$DEBUG" == 1 ]
then
  echo "My APPGROUPID=$APPGROUPID"
	echo "My GROUPID=$GROUPID"
fi

APPUSERID=`curl -s ${SERVER}/securityuserapp/api/groups/foruser  --data username=$USERID --request POST --header usertoken:${TOKEN}|perl -pne 's/},{/},\n{/g'| grep $USERID|json_reformat| egrep ownerUserId|perl -ane '$res=($F[1]=~s/,//);print "@F[1]\n"'`

### Utility functions ###

#
# FUNCTION: Add Users to Group
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = Member list for group
#
# Return values:
#   Users will be added to group.
#   If failure is detected, an error will be displayed with explanation
add_users_to_group()
{
  SERVER=$1
  TOKEN=$2
  MEMBERS=$3
  #Add each MEMBER to group
  array=(${MEMBERS//,/ })

  for i in "${!array[@]}"
  do
    i="${array[i]}"
    #Make sure user exists
    echo "Checking for member $i"
    THROW_AWAY_OUTPUT=$(curl --request POST -s --data "username=${i}&password=fakePass&appkey=VcfMiner" ${SERVER}/securityuserapp/api/login)

    echo "Adding member $i to group ${GROUPID}"
    MEMBERID=`curl -s ${SERVER}/securityuserapp/api/users --request POST --header usertoken:${TOKEN}|json_reformat | grep -i -B 1 \"${i}\"| grep id | tr -s ' ' | cut -d ' ' -f 3 | perl -pe "s/,//"`
    if [ ! -n "$MEMBERID" ]
    then
      echo "ERROR: User $i not found in server ${SERVER}."
    else
      ERROR_OUTPUT=$(curl --data "groupname=${GROUPID}&username=${i}" ${SERVER}/securityuserapp/api/groups/addusertogroup  --request POST --header "usertoken:${TOKEN}" 2>&1)
      EXPECTED_ERROR_MESSAGE=`echo $ERROR_OUTPUT | grep "User is already in the group"`
      if [[ -z $ERROR_OUTPUT || ! -z "$EXPECTED_ERROR_MESSAGE" ]]
      then
        echo "Success"
      else
        echo "ERROR:"
        echo $ERROR_OUTPUT
      fi
    fi
  done

}

#
# FUNCTION: Remove Users from Group
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = Member list for group
#
# Return values:
#   Users will be removed from group.
#   If failure is detected, an error will be displayed with explanation
remove_users_from_group()
{
  SERVER=$1
  TOKEN=$2
  MEMBERS=$3

  #Add each MEMBER to group
  array=(${MEMBERS//,/ })
  for i in "${!array[@]}"
  do
    i="${array[i]}"
    #Make sure user exists
    echo "Checking for member $i"
    MEMBERID=`curl -s ${SERVER}/securityuserapp/api/groups/foruser  --data username=${i} --request POST --header usertoken:${TOKEN}|perl -pne 's/},{/},\n{/g'| grep ${i}|json_reformat| egrep ownerUserId|perl -ane '$res=($F[1]=~s/,//);print "@F[1]\n"'`
    if [ ! -n "$MEMBERID" ]
    then
      echo "ERROR: User $i not found in server ${SERVER}."
    else
      echo "Submitting user $i with ID $MEMBERID for removal from group $GROUPID"
      curl --data "groupname=${GROUPID}&username=${i}" ${SERVER}/securityuserapp/api/groups/removeuserfromgroup  --request POST --header "usertoken:${TOKEN}"
    fi
  done

}

#
# FUNCTION: Create Group
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = Group ID name
#   $4 = Member list for group (optional)
#
# Return values:
#   $APPGROUPID is set to the value of the new group ID (not the group name)
create_group ()
{
  SERVER=$1
  TOKEN=$2
  GROUPID=$3
  MEMBERS=$4

  curl -s --data "groupname=$GROUPID" ${SERVER}/securityuserapp/api/groups/add --request POST --header "usertoken:${TOKEN}"
  APPGROUPID=`curl -s --data "groupname=$GROUPID" ${SERVER}/securityuserapp/api/groups  --request POST --header "usertoken:${TOKEN}"|perl -pne 's/},{/},\n{/g'|grep $GROUPID|json_reformat|grep id|perl -ane '$res=($F[1]=~s/,//);print "@F[1]\n"'`
  if [ $? -gt 0 ]
  then
    echo "ERROR: Failed to create group. Check output for details."
    exit 1
  fi

  if [ ! -z $MEMBERS ]
  then
    add_users_to_group $SERVER $TOKEN $MEMBERS
  fi

}

#
# FUNCTION: Delete Group
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = Group ID name
#
# Return values:
#   None
delete_group ()
{
  SERVER=$1
  TOKEN=$2
  GROUPID=$3

  curl -s --data "groupname=$GROUPID" ${SERVER}/securityuserapp/api/groups/delete --request DELETE --header "usertoken:${TOKEN}"

  echo "Delete request for group $GROUPID has been submitted."
}

#
# FUNCTION: Add VCF to Group
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = VCF name or alias
#   $4 = Group ID
#
# Return values:
#   $VCF is added to the resource list for $APPGROUPID
add_vcf_to_group()
{
  SERVER=$1
  TOKEN=$2
  NAME=$3
  APPGROUPID=$4

  # Get resource ID

  VCFID=`curl  --request POST ${SERVER}/securityuserapp/api/resources/foruser --data "username=${USERID}" --header "usertoken:${TOKEN}"| json_reformat | egrep "(\"id\")|(description.*name=$ALIAS,)" | grep "description" -B 1 | grep id | tr -s " " | cut -d " " -f3 | cut -d "," -f1`

  if [[ `echo "$VCFID" | wc -l` != "1" ]]
  then
    echo -e "\nWARNING: There are multiple VCFs with the name $ALIAS. Please select from the following VCF IDs, or enter 0 to quit."
    echo $VCFID
    read -p "Choose VCF ID> " CHOSEN_VCF_ID
    if [[ "$CHOSEN_VCF_ID" == "" || "$CHOSEN_VCF_ID" == "0" ]]
    then
      echo "Exiting."
      exit
    fi
  else
    CHOSEN_VCF_ID="$VCFID"
  fi

  if [ -z "$CHOSEN_VCF_ID" ]
  then
    echo "ERROR: Unable to retrieve VCF ID for ${VCF} and user ${USERID}. Please ensure that the VCF has been uploaded using addVCF and that the user ${USERID} has access to this resource."
    exit 1
  fi

  curl --request POST ${SERVER}/securityuserapp/api/permissions/set --data '{"resourceId":'${CHOSEN_VCF_ID}',"userOrGroupId":'${APPGROUPID}',"isUser":false,"isReadAuthority":true,"isWriteAuthority":true,"isExecuteAuthority":true,"actions":[]}' -H "Content-Type: application/json" --header "usertoken:${TOKEN}"

  echo "Your request to assign VCF ID $CHOSEN_VCF_ID to group $APPGROUPID has been submitted. Please verify the change in the VCF Miner web interface."

}

#
# FUNCTION: Remove VCF
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = VCF name
#
# Return values:
#   $VCF is added to the resource list for $MEMBERS
remove_vcf()
{
  SERVER=$1
  TOKEN=$2
  WORKSPACE_ID=$3
	TMP=${SERVER/http:\/\//}
	port=${TMP/*:}
	IFS=':' read -a server <<< "$TMP"
	curl -i -X DELETE http://$server:$port/mongo_svr/ve/delete_workspace/$WORKSPACE_ID
	curl  --request POST http://$server:$port/securityuserapp/api/resources/delete/$WORKSPACE_ID --header "usertoken:$TOKEN" 
	echo "Deleted $WORKSPACE_ID"
}




#
# FUNCTION: Add VCF to set of users
# Inputs:
#   $1 = Server that hosts VCF Miner
#   $2 = Authentication token
#   $3 = VCF name
#   $4 = Member list
#
# Return values:
#   $VCF is added to the resource list for $MEMBERS
add_vcf_to_users()
{
  SERVER=$1
  TOKEN=$2
  VCF=$3
  MEMBERS=$4

  # Get resource ID

  VCFID=`curl  --request POST ${SERVER}/securityuserapp/api/resources/foruser --data "username=${USERID}" --header "usertoken:${TOKEN}"| json_reformat | egrep "(id)|($VCF)" | grep -B 1 haplotype | tail -n 2 | grep id | tr -s " " | cut -d " " -f3 | cut -d "," -f1`

  if [ -z $VCFID ]
  then
    echo "ERROR: Unable to retrieve VCF ID for ${VCF} and user ${USERID}. Please ensure that user ${USERID} has access to this resource."
    exit 1
  fi

  #Add VCF to each MEMBER
  array=(${MEMBERS//,/ })
  for i in "${!array[@]}"
  do
    i="${array[i]}"
    #Make sure user exists
    echo "Checking for member $i"
    MEMBERID=`curl -s ${SERVER}/securityuserapp/api/groups/foruser  --data username=${i} --request POST --header usertoken:${TOKEN}|perl -pne 's/},{/},\n{/g'| grep ${i}|json_reformat| egrep ownerUserId|perl -ane '$res=($F[1]=~s/,//);print "@F[1]\n"'`
    if [ ! -n "$MEMBERID" ]
    then
      echo "ERROR: User $i not found in server ${SERVER}."
    else
      curl --request POST ${SERVER}/securityuserapp/api/permissions/set --data '{"resourceId":'${VCFID}',"userOrGroupId":'${MEMBERID}',"isUser":true,"isReadAuthority":true,"isWriteAuthority":true,"isExecuteAuthority":true,"actions":[]}' -H "Content-Type: application/json" --header "usertoken:${TOKEN}"
    fi
  done


}

### Determine the correct function and process accordingly ###
if [ ! -z "$FUNCTION" ]
then
   if [ "$FUNCTION" == "removeVCF" ]
    then
        if [ -z "$WORKSPACE_ID" ]
        then
                echo "You need to submit a workspace ID to say which VCF you want to remove"
                exit 1
        fi
    remove_vcf ${SERVER} ${TOKEN} ${WORKSPACE_ID}

  elif [ "$FUNCTION" == "addUsersToGroup" ]
  then
       add_users_to_group $SERVER $TOKEN $MEMBERS
	elif [ "$FUNCTION" == "addVCF" ]	
	then
		if [ -z "$VCF" ]
    then
      echo "ERROR: $FUNCTION requires a VCF file."
      exit 1
    elif [ ! -e $VCF ]
    then
			echo "ERROR: $VCF does not exist. Please specify the full path to the VCF file."
			exit 1
		fi

		# Check to see if another VCF with the same name has been uploaded already.
		VCFID=`curl  --request POST ${SERVER}/securityuserapp/api/resources/foruser --data "username=${USERID}" --header "usertoken:${TOKEN}"| json_reformat | egrep "(\"id\")|(description.*name=$ALIAS,)" | grep "description" -B 1 | grep id | tr -s " " | cut -d " " -f3 | cut -d "," -f1`

		if [ ! -z "$VCFID" ]
		then
		  echo -e "\n***ERROR: At least one VCF with name $ALIAS has already been uploaded. List of matching IDs:\n\n$VCFID\n"
		  echo "Please specify a new alias using -a <alias_name>, change the file name for your VCF to a unique value, or remove all matches from VCF Miner."
		  echo -e "\nYour VCF file was not uploaded. Please check for earlier errors."
		  exit 1
		fi

    VCF_FILE_NAME=`basename $VCF`
    extension="${VCF_FILE_NAME##*.}"
    header=""

    if [ "$extension" == "gz" ] || [ "$extension" == "tgz" ] || [ "$extension" == "bgz" ]
    then
      header="file-compression:.gz"
    else
      header="file-compression:none"
    fi

		#Upload VCF
		curl -i -H "$header" -F file=@${VCF} ${SERVER}/mongo_svr/uploadvcf/user/${USERID}/alias/$ALIAS --header "usertoken:${TOKEN}"

		if [ $? -gt 0 ]
		then
			echo "ERROR: VCF failed to upload. Check output for details."
			exit 1
		fi

		# If the group ID is specified, add the VCF as a resource to the group
		if [ ! -z "$APPGROUPID" ]
		then
			add_vcf_to_group $SERVER $TOKEN $ALIAS $APPGROUPID
		fi
  elif [ "$FUNCTION" == "addVCFToGroup" ]
	then
    if [ ! -z "$VCF" ]
    then
	    VCF=`basename $VCF`
	  fi

    # If the group ID is specified, add the VCF as a resource to the group
		if [ ! -z "$APPGROUPID" ] && [ ! -z "$VCF" -o ! -z "$ALIAS" ]
		then
			add_vcf_to_group $SERVER $TOKEN $ALIAS $APPGROUPID
		elif [ -z "$APPGROUPID" ] && [ ! -z "$GROUPID" ]
		then
		  echo "ERROR: Group ID for group $GROUPID is not available on $SERVER"
		  echo "Please check the group name or run createGroup if it hasn't been created."
		  exit 1
		elif [ -z "$GROUPID" ]
		then
		  echo "ERROR: Group ID is required for this command"
		  exit 1
    elif [ -z "$VCF" ] || [ -z "$ALIAS" ]
    then
      echo "ERROR: The VCF file name or alias is required for this command"
		  exit 1
		fi
	elif [ "$FUNCTION" == "addVCFToUsers" ]
	then
		VCF=`basename $VCF`
    # If the group ID is specified, add the VCF as a resource to the group
		if [ ! -z "MEMBERS" ] && [ ! -z "$VCF" ]
		then
			add_vcf_to_users $SERVER $TOKEN $VCF $MEMBERS
		else
		  echo "ERROR: Must specify member list and VCF"
		  exit 1
		fi
	elif [ "$FUNCTION" == "createGroup" ]
	then
		if [ -z "${GROUPID}" ]
  	then
  		echo "ERROR: Did not specify a new group ID."
  		exit 1
    fi

    if [ ! -z "$APPGROUPID" ]
    then
      echo "ERROR: Group already exists."
      exit 1
    fi

    if [ -z "$MEMBERS" ]
    then
      echo "WARNING: No group members specified. Group will be created without any members."
    fi

    if [  "$DEBUG" == 1 ]
    then
      echo "GROUPID=$GROUPID"
      echo "APPGROUPID=$APPGROUPID"
    fi

    #Create a group if one doesn't exist
    create_group ${SERVER} ${TOKEN} ${GROUPID} ${MEMBERS}

    if [ "$DEBUG" == 1 ]; then echo "My new APPGROUPID=$APPGROUPID";fi
  elif [ "$FUNCTION" == "deleteGroup" ]
	then
		if [ -z "${GROUPID}" ]
  	then
  		echo "ERROR: Did not specify a new group ID."
  		exit 1
    fi

    if [ -z "$APPGROUPID" ]
    then
      echo "ERROR: Group ${GROUPID} does not exist"
      exit 1
    fi

    if [  "$DEBUG" == 1 ]
    then
      echo "GROUPID=$GROUPID"
      echo "APPGROUPID=$APPGROUPID"
    fi

    delete_group ${SERVER} ${TOKEN} ${GROUPID}
 
  elif [ "$FUNCTION" == "listGroups" ]
  then
    RESPONSE_GROUP=`curl -s ${SERVER}/securityuserapp/api/groups/foruser  --data "username=$USERID"  --request POST --header "usertoken:$TOKEN" |json_reformat |grep "groupName"`

    if [ -z "$RESPONSE_GROUP" ]
    then
      echo "ERROR: Failed login. Login may be incorrect or the server might be down"
      exit 1
    else
      echo "############################################"
      echo "You have access to the following groups"
      echo  "$RESPONSE_GROUP"
    fi
  elif [ "$FUNCTION" == "listPermissionsForGroup" ]
  then
    if [ -z "$GROUPID" ]
    then
      echo "ERROR: Group ID is required for listing permissions for a group"
      exit 1
    else
      echo "############################################"
      echo "The $GROUPID group has the following permissions "
      RESOURCEIDS=`curl -s ${SERVER}/securityuserapp/api/resources/forgroup --data groupname=$GROUPID --request POST --header usertoken:${TOKEN} | json_reformat| grep "id"| tr -s " " | cut -d " " -f3 | cut -d "," -f1 | tr "\n" "," | perl -pe 's/,$//'`

      array=(${RESOURCEIDS//,/ })

      if [ ! -z $DEBUG ]
      then
        echo "RESOURCEIDS=$RESOURCEIDS"
        echo "ARRAY=$array"
      fi

      for i in "${!array[@]}"
      do
        i="${array[i]}"
        echo $i
        curl -s --data "userorgroup=${GROUPID}&isUser=false" ${SERVER}/securityuserapp/api/permissions/${i}  --request POST --header "usertoken:${TOKEN}"|json_reformat
      done
    fi
	elif [ "$FUNCTION" == "listResourcesForGroup" ]
	then
		if [ -z "${GROUPID}" ]
    then
      echo "ERROR: Did not specify a group ID."
      exit 1
    fi

		curl  --request POST ${SERVER}/securityuserapp/api/resources/forgroup --data "groupname=${GROUPID}" --header "usertoken:${TOKEN}"| json_reformat
	elif [ "$FUNCTION" == "listResourcesForUser" ]
  then
    curl  --request POST ${SERVER}/securityuserapp/api/resources/foruser --data "username=${USERID}" --header "usertoken:${TOKEN}"| json_reformat
	elif [ "$FUNCTION" == "listUsers" ]
  then
		curl --request POST  ${SERVER}/securityuserapp/api/users --header "usertoken:${TOKEN}" | json_reformat | grep username
	elif [ "$FUNCTION" == "listUsersInGroup" ]
  then

		if [ -z "${GROUPID}" ]
    then
            echo "ERROR: Did not specify a group ID."
            exit 1
    fi

    echo "############################################"
    echo "The following users have access to $GROUPID "
		curl --request POST  ${SERVER}/securityuserapp/api/groups/usersingroup --data "groupname=${GROUPID}" --header "usertoken:${TOKEN}" 2>/dev/null | json_reformat | grep "username"
  elif [ "$FUNCTION" == "removeUsersFromGroup" ]
  then
    remove_users_from_group $SERVER $TOKEN $MEMBERS
  else
		#Do nothing
		echo "ERROR: This function is not available: ${FUNCTION}"
	fi
fi








