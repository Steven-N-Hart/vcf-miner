package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.mongodb.*;
import edu.mayo.query.QueryCursorInterface;
import edu.mayo.query.QueryFactory;
import edu.mayo.security.CWEUtils;
import edu.mayo.util.Tokens;
import edu.mayo.ve.message.DisplayedFilterVariants;
import edu.mayo.ve.message.QuerryDownload;
import edu.mayo.util.MongoConnection;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.StreamingOutput;
import java.io.*;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/7/13
 * Time: 4:16 PM
 * To change this template use File | Settings | File Templates.
 */

@Path("/download/")
public class DownloadFile {
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
            q = unmarshall(json);
            if(q == null) throw new Exception();
        } catch (Exception e){
            return failedInputMessage(json);
        }

        // set name of file, causes browser to always do "Save as..." dialog
        response.setHeader("Content-Disposition", String.format("attachment; filename=\"%s.tsv\"", CWEUtils.neutralizeCRLF(getFileName(q.getWorkspace()))));

        final QuerryDownload finalQ = q;
        return new StreamingOutput() {
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    writeHeader(output, finalQ);
                    writeData(output,finalQ);
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

    public QuerryDownload unmarshall(String json){
        QuerryDownload q = gson.fromJson(json, QuerryDownload.class);
        return q;
    }

    public StreamingOutput failedInputMessage(final String json){
        return new StreamingOutput() {
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    output.write("The following json is not something the download interface understands: ".getBytes());
                    output.write(json.getBytes());
                } catch (Exception e) {
                    throw new WebApplicationException(e);
                }
            }
        };
    }

    private void writeHeader(OutputStream output, final QuerryDownload q) throws IOException, WebApplicationException{
        // write the filters applied
        if(q.getDisplayFiltersApplied() != null && q.getDisplayFiltersApplied().size() > 0){
            output.write("##Filter\t#Variants\n".getBytes());
            for(DisplayedFilterVariants f : q.getDisplayFiltersApplied()){
                output.write("##".getBytes());
                output.write(f.getFilterText().getBytes());
                output.write("\t".getBytes());
                output.write(
                        new Integer(f.getNumberVariantsRemaining()).toString().getBytes()
                );
                output.write("\n".getBytes());
            }
        }

        // write the traditional header, describing each data row
        List<String> outFields = q.getDisplayFields();
        if(outFields.size() < q.getReturnFields().size()){
            outFields = q.getReturnFields();
        }
        output.write("#".getBytes());
        int i = 0;
        for(String header : outFields){
            output.write(header.getBytes());
            i++;
            if(i== q.getReturnFields().size()){
                output.write("\n".getBytes());
            }else{
                output.write("\t".getBytes());
            }
        }
    }

    private void writeData(OutputStream output, final QuerryDownload q) throws IOException, WebApplicationException, InterruptedException {
        int i = 0;
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(q.getWorkspace());
        //DBObject query = q.createQuery();
        //System.out.println(q.getCustomReturnSelect().toString());
        //DBCursor documents = col.find(query, q.getCustomReturnSelect());
        QueryFactory qfact = new QueryFactory();
        QueryCursorInterface documents = qfact.makeCursor(col,q);
        for( i = 0; documents.hasNext(); i++){
            DBObject next = documents.next();
            int j=0;
            for(String field : q.getReturnFields()){
                output.write(format(field, next).getBytes());
                j++;
                if(j== q.getReturnFields().size()){
                    output.write("\n".getBytes());
                }else{
                    output.write("\t".getBytes());
                }
            }
        }
    }

    public String format(String key, DBObject dbo){
        //System.out.println(key);
        //System.out.println(dbo.toString());
        //?? String newkey = key.replaceAll("\\.", "_");
        if(key.contains(".")){
            int start = key.indexOf(".");
            String prefix = key.substring(0,start); // usually INFO or FORMAT
            String suffix = key.substring(start+1); // sub-field under INFO or FORMAT

            if (dbo.containsField(prefix)) {
                return format(suffix, (DBObject) dbo.get(prefix));
            } else {
                // value is absent in ResultSet, fetch the proper formatting for NULL
                return formatPrimative(null);
            }
        }
        Object o = dbo.get(key);
        return formatPrimative(o);

    }

    public String formatPrimative(Object o){
        if(o == null){
            return ".";
        }
        if(o instanceof Boolean){
            Boolean value = (Boolean) o;
            return value.toString();
        }
        //System.out.println(o.getClass().toString());
        if(o instanceof String){
            String value = (String) o;
            return value;
        }
        if(o instanceof Integer){
            Integer value = (Integer) o;
            return value.toString();
        }
        if(o instanceof Double){
            Double value = (Double) o;
            return value.toString();
        }
        if(o instanceof BasicDBList){
            BasicDBList values = (BasicDBList) o;
            StringBuilder sb = new StringBuilder();
            int i = 0;
            for(String s : values.keySet()){
                Object val = values.get(s);
                sb.append(formatPrimative(val));
                i++;
                if(i< values.keySet().size()){
                    sb.append(";");
                }
            }
            //System.out.println(sb.toString());
            return sb.toString();
        }
        if(o instanceof BasicDBObject){
            BasicDBObject value = (BasicDBObject) o;
            return o.toString();
        }
        return ".";
    }

    public HttpServletResponse getResponse() {
        return response;
    }

    public void setResponse(HttpServletResponse response) {
        this.response = response;
    }
}