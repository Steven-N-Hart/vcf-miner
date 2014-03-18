package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.BasicDBObject;
import edu.mayo.concurrency.workerQueue.WorkerPool;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import java.lang.reflect.Field;
import java.util.Collection;
import java.util.HashMap;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 11/21/13
 * Time: 1:11 PM
 * This allows us to access the working worker pools via REST to check what is going on and perhaps kill processes
 * when needed.
 */
@Path("/workerpool")
public class WorkerPoolManager {
//    private static HashMap<String,WorkerPool> pools = new HashMap<String,WorkerPool>();
//
//    public WorkerPoolManager(){
//
//    }
//
//    Gson gson = new Gson();
//    /**
//     *
//     * @return  a json style representation of all of the tasks in execution (or finished)
//     */
//    @GET
//    @Path("/ps")
//    public String ps(){
//        JsonObject jpools = new JsonObject();
//        JsonArray arr = new JsonArray();
//        for(String key : pools.keySet()){
//            WorkerPool wp = pools.get(key);
//            JsonObject nextWP = new JsonObject();
//            nextWP = addJSONFromTasklist(nextWP, "DOING", wp.getAllDoingTasks());
//
//
//
//        }
//        jpools.add("pools",arr);
//        return jpools.toString();
//    }
//
//    /**
//     * puts json inside parent with key = key e.g.
//     * parent = {}
//     * json = {foo:bar}
//     * key = akey
//     * return = {akey:{foo:bar}}
//     * @param parent
//     * @param key
//     * @param tasks
//     * @return
//     */
//    private JsonObject addJSONFromTasklist(JsonObject parent, String key, Collection<Task> tasks){
//        JsonArray arr = new JsonArray();
//        for(Task task : tasks){
//            JsonElement jtask = gson.toJsonTree(task);
//            arr.add(jtask);
//        }
//        parent.add(key, arr);
//        return parent;
//    }
//
//    /**
//     * make sure the WorkerPoolManager knows about the worker pool, then it can do all of the cool things in this class!
//     */
//    public static synchronized void registerWorkerPool(String poolName, WorkerPool pool){
//        WorkerPoolManager.pools.put(poolName,pool);
//    }
    /** temporary stub, the memory leak is causing problems, so we want to back it out until we have time to deal with this properly */
      public static synchronized void registerWorkerPool(String poolName, WorkerPool pool){

      }

}
