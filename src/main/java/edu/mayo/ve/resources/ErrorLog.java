package edu.mayo.ve.resources;

import edu.mayo.ve.VCFParser.VCFErrorFileUtils;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by m102417 on 6/30/14.
 *
 * provides basic utility functions to access the ErrorLog for downloads that are probelems.
 *
 */
@Path("/error/download/")
public class ErrorLog {

    /**
     * gets a n lines from the current error file.
     * @param workspace
     * @param errors
     * @return
     * @throws IOException
     */
    @GET
    @Path("/w/{workspace}/n/{numberOfErrors}")
    @Produces("text/plain")
    public String getErrorFile(
            @PathParam("workspace") String workspace,
            @PathParam("numberOfErrors") int errors
    ) throws IOException {
        String path = VCFErrorFileUtils.getLoadErrorFilePath(workspace);
        List<String> lines = VCFErrorFileUtils.getNErrors(path,errors);
        System.out.println("Returning error file");
        System.out.println(errors);
        StringBuilder sb = new StringBuilder();
        for(String line: lines){
            sb.append(line);
            sb.append("\n");
        }
        return sb.toString();
    }

}
