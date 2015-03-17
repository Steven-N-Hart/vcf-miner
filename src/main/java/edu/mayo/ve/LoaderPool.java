package edu.mayo.ve; /**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/25/13
 * Time: 4:40 PM
 * To change this template use File | Settings | File Templates.
 */

import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.range.RangeWorker;
import edu.mayo.ve.resources.WorkerPoolManager;
import edu.mayo.ve.util.SystemProperties;
import org.apache.log4j.Logger;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.http.HttpSessionAttributeListener;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import javax.servlet.http.HttpSessionBindingEvent;
import java.io.IOException;

/**
 * this class is started when the code is deployed to Tomcat or any other web container.
 * There is a singe instance of it (static) and it holds a reference to the WorkerPools that
 * load the data into the VCF-Miner app.  (BED files / VCF-Files ect).
 */
public class LoaderPool implements ServletContextListener,
        HttpSessionListener, HttpSessionAttributeListener {

    private static final Logger log = Logger.getLogger(LoaderPool.class);

    private static WorkerPool wp = null;  //worker pool is for the VCF files
    private static WorkerPool wpr = null; //worker pool for the range updates (BED files)
    private static int maxCache = 50000;
    // Public constructor is required by servlet spec
    public LoaderPool() {
    }


    public static final String NUM_WORKERS = "num_workers";
    public static final String NUM_WORKERS_RANGE = "num_workers_range";
    private static int numberworkers = 1;
    private static int numberworkersrange = 1;
    public static int initNumberWorkers() throws IOException {
        SystemProperties sysprop = new SystemProperties();
        String v = sysprop.get(NUM_WORKERS);
        return Integer.parseInt(v);
    }

    public static int initNumberWorkersRange() throws IOException {
        SystemProperties sysprop = new SystemProperties();
        String v = sysprop.get(NUM_WORKERS_RANGE);
        return Integer.parseInt(v);
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
            try {
                numberworkers = initNumberWorkers();
                log.info("Number of Threads in the Worker Pool: " + numberworkers);
            }catch (IOException e){
                throw new RuntimeException(e.getMessage(),e);    //todo: probably a better way to handle this exception!
            }
            LoadWorker logic = new LoadWorker(new VCFParser(), maxCache);//do we want to let them pass this value?
            wp = new WorkerPool(logic, numberworkers);
            WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        }

        if (wpr == null) {
            try {
                numberworkersrange = initNumberWorkersRange();
                log.info("Number of Threads in the RANGE Worker Pool: " + numberworkersrange);
            }catch (IOException e){
                throw new RuntimeException(e.getMessage(),e);    //todo: probably a better way to handle this exception!
            }
            RangeWorker logic = new RangeWorker(); //the VCF updater
            wpr = new WorkerPool(logic, numberworkers);
            WorkerPoolManager.registerWorkerPool(RANGE_WORKERS, wpr);
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
        LoaderPool.wp = wp;
    }

    public static void setReportingTrueAndResetPool(int typeAheadCacheSize){
        LoadWorker logic = new LoadWorker(new VCFParser(), typeAheadCacheSize, true); //the vcf parser
        logic.setLogStackTrace(true);
        wp = new WorkerPool(logic, numberworkers);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        return;
    }

    public static void reset(int typeAheadCacheSize){
        LoadWorker logic = new LoadWorker(new VCFParser(), typeAheadCacheSize);//do we want to let them pass this value?
        wp = new WorkerPool(logic, numberworkers);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        return;
    }

    public static final String RANGE_WORKERS = "range_workers";
    public static void setReportingTrueAndResetRangePool(){
        RangeWorker logic = new RangeWorker(); //the VCF updater
        logic.setVerboseMode(true);
        wpr = new WorkerPool(logic, numberworkers);
        WorkerPoolManager.registerWorkerPool(RANGE_WORKERS, wpr);
        return;
    }

    public static void resetRangePool(){
        RangeWorker logic = new RangeWorker();
        wpr = new WorkerPool(logic, numberworkers);
        WorkerPoolManager.registerWorkerPool(RANGE_WORKERS, wpr);
        return;
    }

    public static WorkerPool getRangeWorkerPool(){
        return wpr;
    }

    public static void shutdown(int seconds) throws InterruptedException {
        if(wp != null) {
            wp.shutdown(seconds);
        }
        if(wpr != null) {
            wpr.shutdown(seconds);
        }
    }


}
