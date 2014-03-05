package edu.mayo.concurency;

import java.util.UUID;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/16/13
 * Time: 9:57 AM
 * A task is something that the WorkerPool needs to execute.
 * S represents the input variable that will be passed to the command context (some jave object that is the input of the task)
 * T represents the output variable (object that will be passed to the task)
 */
public class Task<S,T> {
    /** if the monitoring framework needs to kill a task, workers should respect this flag
     * e.g. the monitoring framework will set it to true, and the worker in the event loop will check that it is
     * false and if it is true, the worker is responsible for gracefully executing the loop
     */
    protected volatile boolean terminated = false;

    /**
     * absolute minimum constructor
     */
    public Task(){

    }

    public enum TaskStatus {
        blocked,
        complete,
        executing,
        failed,
        newTask
    }

    /**
     * all of these fields are optional, they simply help the worker determine the scope of the work for execution
     */
    private S commandContext = null;              //a generic reference to hashmaps, trees, collections, or whatever object the worker needs to do the work
    private T resultContext = null;               //a generic reference to an object for storing the result of the computation task
    private String[] args = null;                 //the arguments passed to the command, it is up to the Worker implementation to figure out what this argument list means and how to cast the params
    private String status =  TaskStatus.newTask.toString();
    private long createTime = System.nanoTime();  //the time the task was created
    private long startTime = System.nanoTime();   //the time the job actually started executing
    private long endTime = System.nanoTime();     //the time the job completed or failed
    private UUID id;

    public S getCommandContext() {
        return commandContext;
    }

    public void setCommandContext(S commandContext) {
        this.commandContext = commandContext;
    }

    public T getResultContext() {
        return resultContext;
    }

    public void setResultContext(T resultContext) {
        this.resultContext = resultContext;
    }

    public String[] getArgs() {
        return args;
    }

    public void setArgs(String[] args) {
        this.args = args;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getCreateTime() {
        return createTime;
    }

    public void setCreateTime(long createTime) {
        this.createTime = createTime;
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public long getEndTime() {
        return endTime;
    }

    public void setEndTime(long endTime) {
        this.endTime = endTime;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public boolean isTerminated() {
        return terminated;
    }

    public void setTerminated(boolean terminated) {
        this.terminated = terminated;
    }
}
