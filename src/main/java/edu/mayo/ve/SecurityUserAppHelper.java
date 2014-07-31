package edu.mayo.ve;

import edu.mayo.securityuserapp.client.ClientFactory;
import edu.mayo.securityuserapp.client.GroupMgmtClient;
import edu.mayo.securityuserapp.client.PermissionMgmtClient;
import edu.mayo.securityuserapp.client.ResourceMgmtClient;
import edu.mayo.securityuserapp.db.objects.Group;
import edu.mayo.securityuserapp.db.objects.Permission;
import edu.mayo.securityuserapp.db.objects.Resource;
import edu.mayo.util.SystemProperties;

import java.util.HashSet;
import java.util.Set;

/**
 * Centralizes logic for interfacing with the SecurityUserApp web application.
 */
public class SecurityUserAppHelper {

    /**
     * The hostname of the SecurityUserApp web application.
     */
    private static final String SYS_PRP_SECURITY_APP_HOSTNAME = "securityuserapp_server";
    /**
     * The port number of the SecurityUserApp web application.
     */
    private static final String SYS_PRP_SECURITY_APP_PORT = "securityuserapp_port";

    /**
     * Defined resource type for the UserSecurityApp that is for workspaces.
     */
    private static final String RESOURCE_TYPE_WORKSPACE = "WKS";

    // client APIs to interface with the SecurityUserApp RESTful services
    private ResourceMgmtClient resourceMgmtClient;
    private PermissionMgmtClient permissionMgmtClient;
    private GroupMgmtClient groupMgmtClient;

    /**
     * Constructor
     *
     * @param hostname
     *      The hostname of the SecurityUserApp web application.
     * @param port
     *      The port number of the SecurityUserApp web application.
     */
    public SecurityUserAppHelper(String hostname, int port) {
        ClientFactory factory = new ClientFactory(hostname, port);
        resourceMgmtClient = factory.buildResourceMgmtClient();
        permissionMgmtClient = factory.buildPermissionMgmtClient();
        groupMgmtClient = factory.buildGroupMgmtClient();
    }

    /**
     * Constructor
     *
     * @param sysprops
     *      A {@link SystemProperties} that must contain the properties:
     *      <ul>
     *          <li>{@link SecurityUserAppHelper#SYS_PRP_SECURITY_APP_HOSTNAME}</li>
     *          <li>{@link SecurityUserAppHelper#SYS_PRP_SECURITY_APP_PORT}</li>
     *      </ul>
     */
    public SecurityUserAppHelper(SystemProperties sysprops) {
        this(getStringProperty(sysprops, SYS_PRP_SECURITY_APP_HOSTNAME), getIntegerProperty(sysprops, SYS_PRP_SECURITY_APP_PORT));
    }

    /**
     * Registers the given workspace resource into the UserSecurityApp by doing the following:
     *
     * <ul>
     *     <li>Creates a new resource based on the specified workspace key</li>
     *     <li>Authorizes the "SOLO" group to have access to this newly created resource</li>
     * </ul>
     *
     * @param userToken
     *      The token that identifies an authenticated user.
     * @param workspaceKey
     *      The unique key of the workspace resource to be registered.
     * @throws Exception
     */
    public void registerWorkspace(String userToken, String workspaceKey) throws Exception {

        // get the SOLO group for the current user (should exist already)
        final Group soloGroup = getSoloGroup(userToken);

        // create workspace key as a new resource in securityuserapp
        Resource requestedResource = new Resource();
        requestedResource.type = RESOURCE_TYPE_WORKSPACE;
        requestedResource.key = workspaceKey;
        requestedResource.description = "none";
        final Resource wksResource = resourceMgmtClient.addResource(userToken, requestedResource);

        // authorize SOLO group to have access to the new resource by default
        Permission soloGroupAccess = new Permission();
        soloGroupAccess.resourceId = wksResource.id;
        soloGroupAccess.userOrGroupId = soloGroup.id;
        soloGroupAccess.isUser = false;
        soloGroupAccess.actions = new String[0];
        soloGroupAccess.isReadAuthority = true;
        soloGroupAccess.isWriteAuthority = true;
        soloGroupAccess.isExecuteAuthority = true;
        permissionMgmtClient.setPermissions(userToken, soloGroupAccess);
    }

    /**
     * Gets a collection of keys that represent workspace resources the specified user is
     * authorized to have access to.
     *
     * @param userToken
     *      The token that identifies an authenticated user.
     * @return
     *      A {@link Set} containing zero or more workspace keys.
     * @throws Exception
     */
    public Set<String> getAuthorizedWorkspaces(String userToken) throws Exception {

        HashSet<String> workspaceKeys = new HashSet<String>();

        for (Resource r: resourceMgmtClient.getAllResourcesForUser(userToken)) {
            workspaceKeys.add(r.key);
        }

        return workspaceKeys;
    }

    /**
     * Gets the "solo" group.  The "solo" group is a special internal
     * group that contains 1 and only 1 user, the user itself that created
     * the group.  The javascript frontend is responsible for creating this group.
     * The group name follows the following convention that is also coded
     * into the javascript frontend:
     *
     *      username.solo.group
     *
     * @param userToken
     *      The token that identifies an authenticated user.
     * @return
     *      A {@link Group} that represents the "solo" group.
     */
    private Group getSoloGroup(String userToken) throws Exception {

        for (Group grp: groupMgmtClient.getGroupsForUser(userToken)) {
            if (grp.groupName.endsWith(".solo.group")) {
                return grp;
            }
        }

        throw new RuntimeException(String.format("SOLO group not found for user token: %s", userToken));
    }

    /**
     * Gets a {@link String} value from the given {@link SystemProperties} with some extra validation.
     * @param sysprops
     * @param key
     * @return
     */
    private static String getStringProperty(SystemProperties sysprops, String key) {
        String val = sysprops.get(key);
        if( val != null) {
            return val;
        } else {
            throw new RuntimeException(String.format("Property not specified: %s", key));
        }
    }

    /**
     * Gets a {@link Integer} value from the given {@link SystemProperties} with some extra validation.
     * @param sysprops
     * @param key
     * @return
     */
    private static Integer getIntegerProperty(SystemProperties sysprops, String key) {
        String val = getStringProperty(sysprops, key);
        return new Integer(val);
    }
}
