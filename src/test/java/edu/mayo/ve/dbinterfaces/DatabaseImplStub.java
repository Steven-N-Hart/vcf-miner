package edu.mayo.ve.dbinterfaces;

import java.text.ParseException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import edu.mayo.ve.dbinterfaces.DatabaseInterface;

public class DatabaseImplStub implements DatabaseInterface {

	private class InfoField {
		public String 	id;
		public int 		numOccurrences;
		public String 	type;
		public String 	desc;
	}
	
	//private final String INFO_FIELD_PREFIX = "HEADER.INFO.";
	// Map:  workspaceKey -> infoId -> InfoField
	private HashMap<String, HashMap<String, InfoField>> mWorkspaceToInfoFieldMap = new HashMap<String, HashMap<String, InfoField>>(); 
	
	@Override
	public boolean isInfoFieldExists(String workspaceKey, String infoId) {
		HashMap<String, InfoField> wksKeyToInfoIdMap = mWorkspaceToInfoFieldMap.get(workspaceKey);
		if( wksKeyToInfoIdMap == null ) 
			return false;
		InfoField infoField = wksKeyToInfoIdMap.get(infoId);
		return infoField != null;
	}

	@Override
	public void addInfoField(String workspaceKey, String infoId, int numOccurrences, String type, String description) throws Exception {
		// if the workspace is not already in the hashmap, then add it
		HashMap<String, InfoField> infoIdToInfoFieldMap = mWorkspaceToInfoFieldMap.get(workspaceKey);
		if( infoIdToInfoFieldMap == null ) {
			infoIdToInfoFieldMap = new HashMap<String, InfoField>();
			mWorkspaceToInfoFieldMap.put(workspaceKey, infoIdToInfoFieldMap);
		}
		
		// Now, get the InfoField from infoId.
		InfoField infoField = infoIdToInfoFieldMap.get(infoId);
		// If it already exists, then throw error
		if( infoField != null )
			throw new Exception("Info field already exists for workspace " + workspaceKey + " and id " + infoId);
		// Else, add new one;
		infoField = new InfoField();
		infoField.id = infoId;
		infoField.numOccurrences = numOccurrences;
		infoField.type = type;
		infoField.desc = description;
		// Now add it
		infoIdToInfoFieldMap.put(infoId, infoField);
	}

	@Override
	public int bulkUpdate(String workspaceKey, Iterator<String> rangeIterator, int numRangesGrouped, String intervalsName) throws ParseException {
		// TODO Auto-generated method stub
		return 0;
	}

    @Override
    public void setMetadataValue(String workspace, String fieldName, int fieldValue) {
        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void incrementMetadataValue(String workspace, String fieldName, int amount) {
        //To change body of implemented methods use File | Settings | File Templates.
    }
}
