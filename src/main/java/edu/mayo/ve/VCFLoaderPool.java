package edu.mayo.ve; /**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/25/13
 * Time: 4:40 PM
 * To change this template use File | Settings | File Templates.
 */

import edu.mayo.concurency.WorkerPool;
import edu.mayo.ve.VCFParser.VCFLoadWorker;
import edu.mayo.ve.resources.WorkerPoolManager;
import edu.mayo.ve.util.Tokens;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.http.HttpSessionAttributeListener;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import javax.servlet.http.HttpSessionBindingEvent;

public class VCFLoaderPool implements ServletContextListener,
        HttpSessionListener, HttpSessionAttributeListener {

    private static WorkerPool wp = null;
    private static int maxCache = 50000;
    // Public constructor is required by servlet spec
    public VCFLoaderPool() {
    }

    // -------------------------------------------------------
    // ServletContextListener implementation
    // -------------------------------------------------------
    public void contextInitialized(ServletContextEvent sce) {
      /* This method is called when the servlet context is
         initialized(when the Web application is deployed). 
         You can initialize servlet context related data here.
      */
        //initialize the worker pool if this is the first load
        if(wp == null){
            VCFLoadWorker logic = new VCFLoadWorker(maxCache);//do we want to let them pass this value?
            wp = new WorkerPool(logic, 1);
            WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        }
    }

    public void contextDestroyed(ServletContextEvent sce) {
      /* This method is invoked when the Servlet Context 
         (the Web application) is undeployed or 
         Application Server shuts down.
      */
        try{
            wp.shutdown(1);
        }catch (Exception e){

        }
    }

    // -------------------------------------------------------
    // HttpSessionListener implementation
    // -------------------------------------------------------
    public void sessionCreated(HttpSessionEvent se) {
      /* Session is created. */
    }

    public void sessionDestroyed(HttpSessionEvent se) {
      /* Session is destroyed. */
    }

    // -------------------------------------------------------
    // HttpSessionAttributeListener implementation
    // -------------------------------------------------------

    public void attributeAdded(HttpSessionBindingEvent sbe) {
      /* This method is called when an attribute 
         is added to a session.
      */
    }

    public void attributeRemoved(HttpSessionBindingEvent sbe) {
      /* This method is called when an attribute
         is removed from a session.
      */
    }

    public void attributeReplaced(HttpSessionBindingEvent sbe) {
      /* This method is invoked when an attibute
         is replaced in a session.
      */
    }

    public static WorkerPool getWp() {
        return wp;
    }

    public static void setWp(WorkerPool wp) {
        VCFLoaderPool.wp = wp;
    }

    public static void setReportingTrueAndResetPool(int typeAheadCacheSize){
        VCFLoadWorker logic = new VCFLoadWorker(typeAheadCacheSize, true);
        wp = new WorkerPool(logic, 1);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        return;
    }

    public static void reset(int typeAheadCacheSize){
        VCFLoadWorker logic = new VCFLoadWorker(typeAheadCacheSize);//do we want to let them pass this value?
        wp = new WorkerPool(logic, 1);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        return;
    }
}
