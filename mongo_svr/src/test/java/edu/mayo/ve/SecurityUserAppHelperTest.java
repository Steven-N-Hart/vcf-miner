package edu.mayo.ve;

import edu.mayo.securityuserapp.api.interfaces.GroupMgmtInterface;
import edu.mayo.securityuserapp.api.interfaces.PermissionMgmtInterface;
import edu.mayo.securityuserapp.api.interfaces.ResourceMgmtInterface;
import edu.mayo.securityuserapp.client.ClientFactory;
import edu.mayo.securityuserapp.db.objects.Group;
import edu.mayo.securityuserapp.db.objects.Permission;
import edu.mayo.securityuserapp.db.objects.Resource;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentMatcher;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.argThat;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.*;

public class SecurityUserAppHelperTest {

    private ResourceMgmtInterface   mockResourceClient;
    private PermissionMgmtInterface mockPermissionClient;
    private GroupMgmtInterface      mockGroupClient;

    private SecurityUserAppHelper helper;

    @Before
    public void setupClientMocks() {
        mockResourceClient   = mock(ResourceMgmtInterface.class);
        mockPermissionClient = mock(PermissionMgmtInterface.class);
        mockGroupClient      = mock(GroupMgmtInterface.class);

        ClientFactory mockFactory = mock(ClientFactory.class);
        when(mockFactory.buildResourceMgmtClient()).thenReturn(mockResourceClient);
        when(mockFactory.buildPermissionMgmtClient()).thenReturn(mockPermissionClient);
        when(mockFactory.buildGroupMgmtClient()).thenReturn(mockGroupClient);

        // build helper using mocks
        helper = new SecurityUserAppHelper(mockFactory);
    }

    @Test
    public void getAuthorizedWorkspaces() throws Exception {

        final String dummyToken = "dummyToken";

        // workspace #1
        final String wksKey1 = "key1";
        Resource wks1 = new Resource();
        wks1.key = wksKey1;

        // workspace #2
        final String wksKey2 = "key2";
        Resource wks2 = new Resource();
        wks2.key = wksKey2;

        final Resource[] resources = {wks1, wks2};
        List<String> expectedKeys = new ArrayList<String>();
        expectedKeys.add(wksKey1);
        expectedKeys.add(wksKey2);
        Collections.sort(expectedKeys);

        // handle external dependency to the security REST service by mocking
        // out the security client and client factory
        when(mockResourceClient.getAllResourcesForUser(dummyToken)).thenReturn(resources);

        List<String> actualKeys = new ArrayList<String>();
        actualKeys.addAll(helper.getAuthorizedWorkspaces(dummyToken));
        Collections.sort(actualKeys);

        assertEquals(expectedKeys, actualKeys);
    }

    @Test
    public void registerWorkspace() throws Exception {
        final String dummyToken = "dummyToken";
        final String dummyKey = "dummyKey";
        final String dummyWorkspaceName = "dummyName";
        final String dummyUsername = "dummyUsername";
        final int dummyGroupId = new Random(System.currentTimeMillis()).nextInt();
        final int dummyResourceId = new Random(System.currentTimeMillis()).nextInt();

        // SOLO group
        Group soloGroup = new Group();
        soloGroup.id = dummyGroupId;
        soloGroup.groupName = dummyUsername + ".solo.group";

        Resource requestedResource = new Resource();
        requestedResource.key = dummyKey;

        Resource newResource = new Resource();
        newResource.id = dummyResourceId;
        newResource.key = dummyKey;

        when(mockGroupClient.getGroupsForUser(dummyToken)).thenReturn(new Group[]{soloGroup});
        when(mockResourceClient.addResource(eq(dummyToken), any(Resource.class))).thenReturn(newResource);

        helper.registerWorkspace(dummyUsername, dummyToken, dummyKey, dummyWorkspaceName);

        class IsSameResource extends ArgumentMatcher<Resource> {
            public boolean matches(Object resource) {
                Resource r = (Resource) resource;
                return r.key.equals(dummyKey);
            }
        }
        verify(mockResourceClient).addResource(eq(dummyToken), argThat(new IsSameResource()));

        class IsSameAccess extends ArgumentMatcher<Permission> {
            public boolean matches(Object permission) {
                Permission p = (Permission) permission;
                return (p.resourceId == dummyResourceId) &&
                        (p.userOrGroupId == dummyGroupId) &&
                        (!p.isUser) &&
                        (p.actions.length == 0) &&
                        (p.isReadAuthority) &&
                        (p.isWriteAuthority) &&
                        (p.isExecuteAuthority);
            }
        }
        verify(mockPermissionClient).setPermissions(eq(dummyToken), argThat(new IsSameAccess()));
    }

}
