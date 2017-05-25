package edu.mayo.ve.dbinterfaces;

import java.text.ParseException;
import java.util.Iterator;

public interface DatabaseInterface {

	/** Does the ID already exist in the INFO headers?
	 *  @param workspaceKey  The workspaceKey to add the metadata to
	 *  @param infoId The ID that appears in the INFO header metadata in VCF files  (ex: AF, ACC, AN, etc)
	 *         NOTE: Is infoId supposed to start with "HEADER.INFO."?????????????????????????????????????????????????? */
	boolean isInfoFieldExists(String workspaceKey, String infoId);

	/** Add a new INFO line to the header metadata 
	 * @throws Exception */
	void addInfoField(String workspaceKey, String infoId, int numOccurrences, String type, String description) throws Exception;

	
    /** Insert multiple ranges (lines) into the database at the same time
    * @param workspace - the workspace that we want to do the update on
    * @param rangeIterator - an iterator that comes from a file or from a list of raw ranges
    * @param numRangesGrouped - send the bulk update every n ranges processed  todo: change the update to use mongo's bulk interface (requires mongodb 2.6)
    * @param rangeSet - the validated name for the range set (e.g. it is not already a name in INFO)
    * @throws ParseException
    * @return number of records updated
    */
	public int bulkUpdate(String workspaceKey, Iterator<String> rangeIterator, int numRangesGrouped, String intervalsName) throws ParseException;

    /**
     * Store a field name/value pair to the metadata.
     *
     * @param workspace
     *      The key for the workspace to be modified.
     * @param fieldName
     *      The name of the metadata field.
     * @param fieldValue
     *      The value of the metadata field.
     */
    public void setMetadataValue(String workspace, String fieldName, int fieldValue);

    /**
     * Increments a metadata field's value by the specified amount.
     *
     * @param workspace
     *      The key for the workspace to be modified.
     * @param fieldName
     *      The name of the metadata field.
     * @param amount
     *      The amount to increment the field value by.
     */
    public void incrementMetadataValue(String workspace, String fieldName, int amount);

    /** Flag the workspace status as currently annotating */
    public void flagAsAnnotating(String workspace);

    /** Get the variant count from the database/workspace */
    public long getVariantCount(String workspace);


}
