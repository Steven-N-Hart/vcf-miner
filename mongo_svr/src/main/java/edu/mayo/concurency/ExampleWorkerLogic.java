package edu.mayo.concurency;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/16/13
 * Time: 10:51 AM
 * To change this template use File | Settings | File Templates.
 */
public class ExampleWorkerLogic implements WorkerLogic {

    private final long countUntil;

    public ExampleWorkerLogic(long countUntil) {
        this.countUntil = countUntil;
    }

    public Task<Integer,Long> compute(Task t) throws ProcessTerminatedException {
        System.out.println((Integer) t.getCommandContext() + "Hello! I am Thread: " + Thread.currentThread().toString());
        System.out.println((Integer) t.getCommandContext() + "I am working on Task: " + t.toString());
        long sum = 0;
        for (long i = 1; i < countUntil; i++) {
            //IMPORTANT! all tasks need this so they can be terminated by external calls to the system!
            if(t.isTerminated() == true) throw new ProcessTerminatedException();
            sum += i;
        }
        t.setResultContext(new Long(sum)); //put the result in result context, if needed
        //System.out.println(sum);
        return t;
    }
}
