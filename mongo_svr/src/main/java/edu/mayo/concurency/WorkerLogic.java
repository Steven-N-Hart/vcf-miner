package edu.mayo.concurency;


/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/16/13
 * Time: 10:49 AM
 * Workers will execute the logic defined in the compute method in the WorkerLogic class
 * The worker will return an object of type O (can be whatever really)
 */
public interface WorkerLogic<O> {
    public O compute(Task t) throws ProcessTerminatedException;
}
