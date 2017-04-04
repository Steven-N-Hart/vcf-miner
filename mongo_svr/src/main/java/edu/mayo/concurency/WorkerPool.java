package edu.mayo.concurency;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created with IntelliJ IDEA.
 * User: m102417 - dquest
 * Date: 9/16/13
 * Time: 8:02 AM
 * @author dquest
 * loosely based on:
 *  * http://www.vogella.com/articles/JavaConcurrency/article.html
 *
 * Thread pools manage a pool of worker threads. The thread pools contains a work queue which holds tasks waiting to get executed.
 *
 * The WorkerPool is a thread pool.  The current implementation contains the tasks to be executed in an in-memory queue.
 * as this code imporoves, this interface will allow users to specify work queues that are stored to:
 * 1) a file,
 * 2) a database,
 * 3) a message queue,
 * 4) or even a distibuted task manager such as zookeeper
 *
 * A thread pool can be described as a collection of Runnable objects (work queue) and a connections of running threads.
 * These threads are constantly running and are checking the work query for new work.
 * If there is new work to be done they execute this Runnable.
 * The Thread class itself provides a method, e.g. execute(Runnable r) to add a new Runnable object to the work queue.

 * The Executor framework provides example implementation of the java.util.concurrent.Executor interface,
 * e.g. Executors.newFixedThreadPool(int n) which will create n worker threads.
 * The ExecutorService adds lifecycle methods to the Executor, which allows to shutdown the Executor and to wait for termination.
 *
 * If you want to use one thread pool with one thread which executes several runnables you can use the Executors.newSingleThreadExecutor() method.
 *
 *
 */
public class WorkerPool {

    private AtomicInteger NTHREDS = new AtomicInteger(10);
    private ExecutorService executor;
    private Hashtable<UUID,Task> failedTasks = new Hashtable<UUID,Task>();
    private Hashtable<UUID,Future<Task>> completeTasks = new Hashtable<UUID,Future<Task>>();
    private Hashtable<UUID,Task> doingTasks = new Hashtable<UUID,Task>();
    private Hashtable<UUID,Task> newTasks = new Hashtable<UUID,Task>();
    private WorkerLogic logic;

    /**
     *
     * @param l        - the logic the workers need to use to do thier work
     * @param poolSize - the number of workers in the pool
     */
    public WorkerPool(WorkerLogic l, int poolSize){
        logic = l;
        NTHREDS = new AtomicInteger( poolSize );
        executor = Executors.newFixedThreadPool(NTHREDS.get());
    }

    public synchronized void addTask(Task t){
        UUID key =  UUID.randomUUID();
        t.setId(key);
        t.setStatus(Task.TaskStatus.newTask.toString());
        newTasks.put(key,t);
    }

    public synchronized void startTask(UUID id){
        Task t = newTasks.get(id);
        if(t != null){
            t.setStatus(Task.TaskStatus.executing.toString());
            t.setStartTime(System.nanoTime());
            doingTasks.put(id, t);
            newTasks.remove(id);
            Future<Task> submit = executor.submit(new Worker(logic, t));
            completeTasks.put(id, submit);
        }else {
            t.setStatus(Task.TaskStatus.failed.toString());
            failedTasks.put(id,t);
            newTasks.remove(id);
        }
    }

    public synchronized void killTask(UUID id){
        Task t = doingTasks.get(id);

    }

    public synchronized boolean isTaskComplete(UUID id){
        Future<Task> future = completeTasks.get(id);
        return future.isDone();
    }

    public synchronized Collection<Task> getAllDoingTasks(){
        return doingTasks.values();
    }

    public synchronized Collection<Task> getAllFailedTasks(){
        return failedTasks.values();
    }

    public synchronized Collection<Task> getAllNewTasks(){
        return newTasks.values();
    }

    public synchronized void pergeNewTask(UUID id){
        newTasks.remove(id);
    }


    /**
     * Note, this is a blocking call.
     *
     * if the task is complete, it will return the Task that is completed, if it is not complete, it will return null
     * @param id - the unique id for the task
     * @return
     */
    public synchronized Task getCompleteTask(UUID id){
        try {
            Future<Task> future = completeTasks.get(id);
            if(future == null){
                return null;
            }
            Task t = future.get();
            if(doingTasks.get(id) != null){
                doingTasks.remove(id);
            }
            return t;
        } catch (InterruptedException e) {
            return null;
        } catch (ExecutionException e) {
            return null;
        }
    }

    /**
     * Blocking call... all tasks in completeTasks at the time this call is made must be complete for it to finish
     * @return  all completed tasks at this time in execution
     */
    public synchronized List<Task> getAllCompletedTasks(){
        List<Task> completedTasks = new ArrayList<Task>();
        //first get all the tasks that are already marked as complete
        for(UUID id : completeTasks.keySet()){
            Task t = getCompleteTask(id);
            completedTasks.add(t);
        }
        //now, move over any tasks that should be
        for(UUID id : doingTasks.keySet()){
            Task t = getCompleteTask(id);
            if(t != null){
                completedTasks.add(t);
            }
        }
        return completedTasks;
    }

    /**
     * note: additional completed tasks may still enter the completeTasks hash after this has started.
     */
    public synchronized void pergeCompleteTasks(){
        for(UUID id : completeTasks.keySet()){
            completeTasks.remove(id);
        }
    }

    /**
     * note: additional completed tasks may still enter the completeTasks hash after this has started.
     */
    public synchronized void pergeFailedTasks(){
        for(UUID id : failedTasks.keySet()){
            failedTasks.remove(id);
        }
    }

    public void shutdown(int seconds) throws InterruptedException {
        if(executor != null){
            // This will make the executor accept no new threads
            // and finish all existing threads in the queue
            executor.shutdown();
            // Wait until all threads are finish
            executor.awaitTermination(seconds, TimeUnit.SECONDS);
        }
        executor = null;
    }

}
