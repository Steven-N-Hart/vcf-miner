package edu.mayo.ve.util;

import com.mongodb.BasicDBList;

/**
 * Usage of a type-ahead field usually starts with the user typing a prefix, and then expanding on the prefix
 * if we store the results for the previous prefix then we can satisfy the next request very rapidly
 * by just filtering the lastHit results.  Also, users may backspace on thier prefix based on what they see,
 * if they do that, then we still should be able to satisfy the request.  If the user starts with a new prefix,
 * then the code will need to update last-hit to make traversal of this new set fast
 */
public class LastHit {
    private String workspaceID;
    private String field;
    private String prefix;
    private Integer maxValues;
    private BasicDBList l;

    public LastHit(String workspace, String field, String prefix, Integer maxValues, BasicDBList typeAheadValues){
        this.workspaceID = workspace;
        this.field = field;
        this.prefix = prefix;
        this.maxValues = maxValues;
        l = typeAheadValues;
    }

    public boolean canSatisfyRequest(String workspace, String field, String prefix, Integer maxValues){
        if(workspace.equalsIgnoreCase(this.workspaceID)  &&
                field.equalsIgnoreCase(this.field) &&
                prefix.startsWith(this.prefix) &&
                this.maxValues >= maxValues
                ){
            return true;
        }else{
            return false;
        }
    }

    public BasicDBList satisfyRequest(String prefix, Integer maxValues){
        BasicDBList ret = new BasicDBList();
        for(int i=0; i< l.size(); i++){
            if(ret.size() >= maxValues) break;
            String next = (String) l.get(i);
            if(next.startsWith(prefix)){
                ret.add(next);
            }
        }
        return ret;
    }

    public String getWorkspaceID() {
        return workspaceID;
    }

    public void setWorkspaceID(String workspaceID) {
        this.workspaceID = workspaceID;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public Integer getMaxValues() {
        return maxValues;
    }

    public void setMaxValues(Integer maxValues) {
        this.maxValues = maxValues;
    }

    public BasicDBList getL() {
        return l;
    }

    public void setL(BasicDBList l) {
        this.l = l;
    }
}

