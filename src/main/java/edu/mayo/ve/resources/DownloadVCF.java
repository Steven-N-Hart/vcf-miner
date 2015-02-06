package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.mongodb.*;
import edu.mayo.security.CWEUtils;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.message.DisplayedFilterVariants;
import edu.mayo.ve.message.QuerryDownload;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.StreamingOutput;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Created by m102417 on 10/28/14.
 *
 * Extracts a VCF File from the database (note all samples will not be complete)
 *
 */
public class DownloadVCF {

    DownloadFile d = new DownloadFile();
    MetaData meta = new MetaData();
    Mongo m = MongoConnection.getMongo();
    Gson gson = new Gson();

    @Context
    private javax.servlet.http.HttpServletResponse response;

    @POST
    @Produces("text/plain")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public StreamingOutput generateFile(final @FormParam("json") String json) throws Exception {
        QuerryDownload q = null;
        try {
            q = d.unmarshall(json);
            if(q == null) throw new Exception();
        } catch (Exception e){
            return d.failedInputMessage(json);
        }
        // set name of file, causes browser to always do "Save as..." dialog
        response.setHeader("Content-Disposition", String.format("attachment; filename=\"%s.vcf\"", CWEUtils.neutralizeCRLF(getFileName(q.getWorkspace()))));

        final QuerryDownload finalQ = q;
        return new StreamingOutput() {
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    writeVCF(output,finalQ);
                    //output.write(json.getBytes());
                } catch (Exception e) {
                    throw new WebApplicationException(e);
                }
            }
        };
    }

    private String getFileName(String workspace){
        DBObject db = meta.queryMeta(Tokens.KEY, workspace);
        String out = (String) db.get("alias");
        if(out == null){
            out = workspace;
        }
        if(out.length() <= 1){
            out = workspace;
        }
        return out;
    }

    public void writeVCF(OutputStream output, final QuerryDownload finalQ)throws IOException, WebApplicationException{
        writeHeader(output, finalQ);
        writeData(output,finalQ);
    }


    public void writeHeader(OutputStream output, final QuerryDownload q) throws IOException, WebApplicationException{
        output.write("##fileformat=VCFv4.3\n".getBytes());

        DBObject db = meta.queryMeta(Tokens.KEY, q.getWorkspace());
        DBObject header = (DBObject) db.get("HEADER");
        if( header == null) throw new IOException("no header in metadata for workspace: " + q.getWorkspace());

        //create lines like this: ##INFO=<ID=NS,Number=1,Type=Integer,Description="Number of Samples With Data">
        for(String key : header.keySet()){  //gets keys for FORMAT, INFO, ect.
            DBObject section = (DBObject) header.get(key);
            for(String field : section.keySet()){
                DBObject dbfield = (DBObject) section.get(field);
                //output.write(dbfield.toString().getBytes());
                //output.write("\n".getBytes());
                String number = dbfield.get("number").toString();
                //for these fields we actually change the data, and provide a custom calculation for the fields they are interested in.  So they need to be changed to Number=1
                if(key.equalsIgnoreCase("INFO") && (field.equalsIgnoreCase("AC") ||  field.equalsIgnoreCase("AN") || field.equalsIgnoreCase("AF")) ){
                    number = "1";
                }
                String line = "##" + key + "=<ID=" + field +
                        ",Number=" + dbfield.get("number").toString() +
                        ",Type=" + dbfield.get("type").toString() +
                        ",Description=\"" + dbfield.get("Description").toString() +  "\"" +
                        ">\n";
                output.write(line.getBytes());
            }
        }
        //create the #CHROM header line
        output.write("#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t".getBytes());
        ArrayList<String> samples = getSamples(q.getWorkspace());
        int count =0;
        for( String sample : samples){
            output.write(sample.getBytes());
            count++;
            if(count < samples.size()){
                output.write("\t".getBytes());
            }

        }
        output.write("\n".getBytes());

    }

    public ArrayList<String> getSamples(String workspace){
        ArrayList<String> samples = new ArrayList<String>();
        DBObject db = meta.queryMeta(Tokens.KEY, workspace);
        DBObject dbo = (DBObject) db.get("SAMPLES");
        //System.out.println(dbo.toString());
        for (String sample : dbo.keySet()){
            samples.add(sample);
        }
        return samples;
    }

    public void writeData(OutputStream output, final QuerryDownload q) throws IOException, WebApplicationException {
        int i = 0;
        DB db = MongoConnection.getDB();
        DBObject schema = meta.queryMeta(Tokens.KEY, q.getWorkspace());

        DBCollection col = db.getCollection(q.getWorkspace());
        DBObject query = q.createQuery();
        //System.out.println(q.getCustomReturnSelect().toString());
        DBCursor documents = col.find(query);
        for( i = 0; documents.hasNext(); i++){
            DBObject next = documents.next();
            next = recalculateAlleleStats(next, q.getSelectedSamples());
            //#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT
            output.write(next.get("CHROM").toString().getBytes());
            output.write("\t".getBytes());
            output.write(next.get("POS").toString().getBytes());
            output.write("\t".getBytes());
            output.write(next.get("ID").toString().getBytes());
            output.write("\t".getBytes());
            output.write(next.get("REF").toString().getBytes());
            output.write("\t".getBytes());
            output.write(next.get("ALT").toString().getBytes());   //todo: validate that tri-allelics work!
            output.write("\t".getBytes());
            output.write(next.get("QUAL").toString().getBytes());
            output.write("\t".getBytes());
            output.write(next.get("FILTER").toString().getBytes());
            output.write("\t".getBytes());
            output.write(formatInfo((DBObject) next.get("INFO"), schema).getBytes());
            output.write("\tGT\t".getBytes());
            //construct the samples
            String sampleLine = formatSamples(next, getSamples(q.getWorkspace()));
            output.write(sampleLine.getBytes());
            output.write("\n".getBytes());
            //System.out.println(next);
        }
    }

    /**
     * when the user only selects a subset of variants, the values for AC, AN, and AF all need to be recalculated. This modifies the variant row in place as json so it can be
     * formatted properly later...
     * @param variant
     * @return
     */
    public DBObject recalculateAlleleStats(DBObject variant, List<String> selectedSamples){
        DBObject info = (DBObject) variant.get("INFO");
        if(selectedSamples != null){
            if(selectedSamples.size() > 0){
                int ac = calculateAC(variant);
                int an = calculateAN(variant);
                //"CALCULATIONS.AF = CALCULATIONS.AC / CALCULATIONS.AN;"
                double af = (1.0*ac) / (1.0*an);
                System.out.println(variant.toString());
                info.put("AC",ac);
                info.put("AN", an);
                info.put("AF", af);
            }
        }
        variant.put("INFO", info);
        return variant;
    }

    //"CALCULATIONS.AC = hetrocount + 2*homocount;"
    public int calculateAC(DBObject variant){
        int ac =0;
        BasicDBObject format = (BasicDBObject) variant.get("FORMAT");
        BasicDBList bhomozygousList = (BasicDBList) format.get("HomozygousList");
        BasicDBList bheterozygousList = (BasicDBList) format.get("HeterozygousList");
        if(bheterozygousList == null || bhomozygousList == null) return -1;
        ac = bheterozygousList.size() + 2* bhomozygousList.size();
        return ac;
    }

    //"CALCULATIONS.AN = 2*hetrocount + 2*homocount + 2*wildcount;"
    public int calculateAN(DBObject variant){
        int an =0;
        BasicDBObject format = (BasicDBObject) variant.get("FORMAT");
        BasicDBList bhomozygousList = (BasicDBList) format.get("HomozygousList");
        BasicDBList bheterozygousList = (BasicDBList) format.get("HeterozygousList");
        BasicDBList bwildtypeList = (BasicDBList) format.get("WildtypeList");
        if(bheterozygousList == null || bhomozygousList == null || bwildtypeList == null) return -1;
        an = bheterozygousList.size() + 2* bhomozygousList.size() + 2*bwildtypeList.size();
        return an;
    }




    public String formatInfo(DBObject info, DBObject schema){
        StringBuilder sb = new StringBuilder();
        Set keys = info.keySet();
        int count = 0;
        for(String key : info.keySet()){
            Object value = info.get(key);
            if(isFlag(key, value)){
                sb.append(key);
            }else if (isNumber(key,value)) {
                sb.append(key);
                sb.append("=");
                sb.append(value);
            } else if(isString(key,value)){
                sb.append(key);
                sb.append("=");
                sb.append(value);
            } else if (isList(key,value)){
                sb.append(key);
                sb.append("=");
                sb.append(formatList((BasicDBList)value));
            }

            count++;
            if(count<keys.size()){
                sb.append(";");
            }
        }
        return sb.toString();
    }


    /**
     * checks the metadata, if the value is supposed to be a flag based on the header, return true, otherwise return false
     * @return
     */
    public boolean isFlag(String field, Object value){
        if(value instanceof Boolean) {
            Boolean tmp = (Boolean) value;
//            System.out.println(field);
//            System.out.println(":");
//            System.out.println(value.toString());
            if (tmp == true) return true;
        }

        return false;
    }


    public boolean isNumber(String field, Object value){
        if(value instanceof Double || value instanceof Float || value instanceof Integer || value instanceof Long) {
            return true;
        }
        return false;
    }

    public boolean isString(String field, Object value){
        if(value instanceof String){
            return true;
        }
        return false;
    }

    public boolean isList(String field, Object value){
        if(value instanceof BasicDBList){
            return true;
        }
        return false;
    }

    /**
     * formats a comma seperated list into comma seperated values
     * @param l
     * @return
     */
    public String formatList(BasicDBList l){
        StringBuilder sb = new StringBuilder();
        for(int i=0;i<l.size();i++){
            Object o = l.get(i);
            sb.append(o.toString());  //assuming they are all strings or integers, if they are json objects then it came in incorrect!
            if(i<l.size()-1){
                sb.append(",");
            }
        }
        return sb.toString();
    }

    /**
     * assumes that you can stringify the elements in the list, returns a list of strings...
    */
    public List<String> toList(BasicDBList dblist){
        ArrayList<String> toList = new ArrayList();
        for(int i=0;i<dblist.size();i++){
            Object o = dblist.get(i);
            toList.add(o.toString());
        }
        return toList;
    }

    /**
     * takes the raw information from a MongoDB entry and transforms it into a VCF compatable sample set.
     * @param variant - a variant record stored in MongoDB
     * @param sampleList - the list of samples in the order they will be in the header
     * @return a string representing samples, e.g. 0/0\t0/1\t1/1 ...
     *
     * Note, this is basically the reverse of this logic: (this is what was used to determine what arrays a sample will be in -- this can be found in the VCF2VariantPipe in the pipes project)
     * The reverse process has information loss.
     * Insert Hetro/Homo if the same has the array.
     * 0/0 means wildtype
     * 2/2 homo
     * 1/1 homo
     * 1/2 homo
     *
     * if you parse out all of these strings, exclude zero
     *
     * calculate a length on the field, if that length is 1 then it is hetro, if the le
     * nth is greater than one it is homo, and if it is null/zero then don't store it.
     *
     * Here are some examples:
     *
     * If I have 3 samples in a VCF that looks like this:
     * FORMAT   A   B   C
     * GT       1/1 0/0 1/0
     *
     * A -> Homo
     * B -> Wildtype
     * C -> Hetro
     * More Examples:
     * If 1/1 -> Hom
     * If 1/0 -> Het
     * If 0/1 -> Het
     * If 2/0 -> Het
     * If 0/2 -> Het
     * If 0/0 -> Wildtype
     * ./././././. -> NoCall (used to be wildtype)
     * 0/0/0/0/0/0 -> Wildtype
     *
     */
    public String formatSamples(DBObject variant, List<String> sampleList){
        StringBuilder sampleLine = new StringBuilder();
        BasicDBObject format = (BasicDBObject) variant.get("FORMAT");
        BasicDBList bwildtypeList = (BasicDBList) format.get("WildtypeList");
        List<String> wildtypeList = toList(bwildtypeList);
        BasicDBList bhomozygousList = (BasicDBList) format.get("HomozygousList");
        List<String> homozygousList = toList(bhomozygousList);
        BasicDBList bheterozygousList = (BasicDBList) format.get("HeterozygousList");
        List<String> heterozygousList = toList(bheterozygousList);


        int count =0;
        for (String sample : sampleList) {
            sampleLine.append(translateType(wildtypeList,homozygousList,heterozygousList,sample));
            count++;
            if(count < sampleList.size()) {
                sampleLine.append("\t");
            }
        }
        //System.out.println(wildtypeList.toString());
        //System.out.println(homozygousList.toString());
        //System.out.println(heterozygousList.toString());
        return sampleLine.toString();
    }

    public String translateType(List<String> wildtypeList, List<String> homozygousList, List<String> heterozygousList, String sample) {
        //if in wildtype array -> 0/0
        if(wildtypeList.contains(sample)){
            return "0/0";
            //if in homozygus -> 1/1
        } else if (homozygousList.contains(sample)){
            return "1/1";
            //if in heterozygous -> 0/1
        } else if (heterozygousList.contains(sample)) {
            return "0/1";
            //else -> ./.
        } else {
           return "./.";
        }
    }

}
