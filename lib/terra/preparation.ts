/** Drain the shared geometry algorithm synchronously for live tuning and tools. */
export function finishPreparation<T>(steps: Generator<void,T,void>): T {
 let step=steps.next();
 while(!step.done)step=steps.next();
 return step.value;
}

/** A real task boundary lets input, painting and the loading animation run.
 * A resolved Promise alone would keep the browser in the same blocked task. */
export async function yieldPreparation(signal: AbortSignal) {
 signal.throwIfAborted();
 const scheduler=(globalThis as typeof globalThis & {scheduler?:{yield?:()=>Promise<void>}}).scheduler;
 if(scheduler?.yield)await scheduler.yield();
 else await new Promise<void>(resolve=>setTimeout(resolve,0));
 signal.throwIfAborted();
}

/** Spend at most ~8ms between route checkpoints, rather than delay every route.
 * One route is atomic; cancellation is checked at every checkpoint. */
export async function runPreparation<T>(steps: Generator<void,T,void>,signal: AbortSignal):Promise<T> {
 let started=performance.now();
 try {
  while(true){
   signal.throwIfAborted();
   const step=steps.next();
   if(step.done)return step.value;
   if(performance.now()-started>=8){await yieldPreparation(signal);started=performance.now();}
  }
 }finally{steps.return(undefined as T);}
}
