package edu.mayo.ve.message;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * A FilterHistory stores a history of operations performed by a user.  The idea is that the user could
 * pull this information up later
 *
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/9/13
 * Time: 2:01 PM
 * To change this template use File | Settings | File Templates.
 */
public class FilterHistory {
    /** an ordered list of the queries performed by the user 1st element in the list = 1st query and so on */
    List<Querry> filters = new ArrayList<Querry>();
    /** when the user created the filter history */
    String timestamp;
    /** the user that created the filter history */
    String user;
    /** the key for the workspace where the history was originally applied */
    String key;
    /** name - the name the user gives to the FilterHistory */
    String name;
    /** the unique identifier used for the FilterHistory */
    String id;
    /** description of the purpose of this filter history */
    String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<Querry> getFilters() {
        return filters;
    }

    public void setFilters(List<Querry> filters) {
        this.filters = filters;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
