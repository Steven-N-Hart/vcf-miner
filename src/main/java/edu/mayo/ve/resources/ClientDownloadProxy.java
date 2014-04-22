package edu.mayo.ve.resources;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.io.OutputStream;

/**
 * Allows a web client to submit data to the server-side that is redirected
 * back to the client as a downloadable file.  This implementation works across
 * browsers versus the typical Data URI solution that exists only on the client.
 */
@Path("/client_download_proxy/")
public class ClientDownloadProxy {

    @Context
    private javax.servlet.http.HttpServletResponse response;

    /**
     * PROXY endpoint that allows the client to submit an HTML form over an
     * HTTP POST request.  The data in the form is then fed back to the client
     * as a downloaded file.
     *
     * @param filename
     *      The name of the file.
     * @param mimeType
     *      The MIME type for the file.
     * @param content
     *      The file content.
     * @return
     * @throws Exception
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public StreamingOutput generateFile(
            final @FormParam("filename") String filename,
            final @FormParam("mimeType") String mimeType,
            final @FormParam("content") String content
    ) throws Exception {

        response.setHeader("Content-Type", mimeType);

        // set name of file, causes browser to always do "Save as..." dialog
        response.setHeader("Content-Disposition", String.format("attachment; filename=\"%s\"", filename));

        return new StreamingOutput() {
            public void write(OutputStream output) throws IOException, WebApplicationException {
                try {
                    output.write(content.getBytes());
                } catch (Exception e) {
                    throw new WebApplicationException(e);
                }
            }
        };
    }

}
