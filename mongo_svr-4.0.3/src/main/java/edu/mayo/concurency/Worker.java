package edu.mayo.concurency;

import java.util.concurrent.Callable;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/16/13
 * Time: 10:38 AM
 * Addresses to all of the workers are registered in the WorkerPool, but the WorkerPool does not control
 * individual workers, instead, when they are done executing a task, they go back to the WorkerPool and modify
 * the task list.  if there is no work for them, then they will sleep.
 */
public class Worker<R> implements Callable<R> {
    private WorkerLogic<R> logic;
    private Task task = null;

    public Worker(WorkerLogic l, Task t) {
        task = t;
        logic = l;
    }

    @Override
    public R call() throws ProcessTerminatedException {
        if(task != null){
            R r = logic.compute(task);
            task.setEndTime(System.nanoTime());
            task.setStatus(Task.TaskStatus.complete.toString());
            return r;
        }
        else return null;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public WorkerLogic<R> getLogic() {
        return logic;
    }

    public void setLogic(WorkerLogic<R> logic) {
        this.logic = logic;
    }
}
