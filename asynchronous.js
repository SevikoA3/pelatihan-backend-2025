/**
 * ======================================
 * 1. SYNCHRONOUS (BLOCKING) EXECUTION
 * ======================================
 * Kode dijalankan baris per baris secara berurutan
 */
console.log("\n=== 1. Synchronous Execution ===");

function syncTask() {
  console.log("Task 1 (sync)");
  console.log("Task 2 (sync)");
  console.log("Task 3 (sync)");
}

syncTask();
console.log("Setelah syncTask");

/**
 * Output:
 * Task 1 (sync)
 * Task 2 (sync)
 * Task 3 (sync)
 * Setelah syncTask
 */

/**
 * ======================================
 * 2. ASYNCHRONOUS WITH CALLBACKS
 * ======================================
 * Menggunakan callback untuk menangani operasi async
 */
console.log("\n=== 2. Callback Style ===");

function asyncCallback(task, delay, callback) {
  setTimeout(() => {
    console.log(`Completed: ${task}`);
    callback();
  }, delay);
}

console.log("Start Callback Example");
asyncCallback("Task A", 1000, () => {
  console.log("Callback for Task A executed");
});
asyncCallback("Task B", 500, () => {
  console.log("Callback for Task B executed");
});
console.log("End of Callback Example");

/**
 * Output:
 * Start Callback Example
 * End of Callback Example
 * Completed: Task B (after 500ms)
 * Callback for Task B executed
 * Completed: Task A (after 1000ms)
 * Callback for Task A executed
 */

/**
 * ======================================
 * 3. PROMISES
 * ======================================
 * Menggunakan Promise untuk menghindari callback hell
 */

// Contoh callback hell
function callbackHell() {
  asyncCallback("Task 1", 1000, () => {
    asyncCallback("Task 2", 800, () => {
      asyncCallback("Task 3", 600, () => {
        asyncCallback("Task 4", 400, () => {
          asyncCallback("Task 5", 200, () => {
            console.log("All tasks completed");
          });
        });
      });
    });
  });
}
console.log("Start Callback Hell Example");
callbackHell();


console.log("\n=== 3. Promise Style ===");

function promiseTask(task, delay, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(`Error: ${task} failed`);
      } else {
        console.log(`Promise resolved: ${task}`);
        resolve(`${task} result`);
      }
    }, delay);
  });
}

console.log("Start Promise Example");

// Basic Promise
promiseTask("Task X", 800)
  .then((result) => console.log("Then:", result))
  .catch((error) => console.error("Catch:", error));

// Chaining Promises
promiseTask("First Task", 300)
  .then((result) => {
    console.log("First then:", result);
    return promiseTask("Second Task", 400);
  })
  .then((result) => {
    console.log("Second then:", result);
    return promiseTask("Third Task", 200, true); // This will fail
  })
  .then((result) => console.log("This won't run"))
  .catch((error) => console.error("Chain failed:", error));

console.log("End of Promise Example");

/**
 * Output:
 * Start Promise Example
 * End of Promise Example
 * Promise resolved: First Task (after 300ms)
 * First then: First Task result
 * Promise resolved: Second Task (after 400ms more)
 * Second then: Second Task result
 * Chain failed: Error: Third Task failed (after 200ms more)
 * Promise resolved: Task X (after 800ms)
 * Then: Task X result
 */

/**
 * ======================================
 * 4. ASYNC/AWAIT
 * ======================================
 * Syntax modern untuk bekerja dengan Promise
 */
console.log("\n=== 4. Async/Await ===");

async function runAsyncTasks() {
  try {
    console.log("Start Async Function");
    
    // Sequential execution
    const result1 = promiseTask("Async Task 1", 600);
    console.log("After await 1:", result1);
    
    const result2 = await promiseTask("Async Task 2", 400);
    console.log("After await 2:", result2);
    
    // Parallel execution
    const [parallel1, parallel2] = await Promise.all([
      promiseTask("Parallel A", 800),
      promiseTask("Parallel B", 500)
    ]);
    console.log("Parallel results:", parallel1, parallel2);
    
    // Error handling
    await promiseTask("Failing Task", 300, true);
    console.log("This won't execute");
  } catch (error) {
    console.error("Async error:", error);
  } finally {
    console.log("Async function completed");
  }
}

console.log("Before calling async function");
runAsyncTasks();
console.log("After calling async function");

/**
 * Output:
 * Before calling async function
 * Start Async Function
 * After calling async function
 * 
 * (After 600ms)
 * Promise resolved: Async Task 1
 * After await 1: Async Task 1 result
 * 
 * (After 400ms more)
 * Promise resolved: Async Task 2
 * After await 2: Async Task 2 result
 * 
 * (After 500ms more - Parallel B completes first)
 * Promise resolved: Parallel B
 * (After 300ms more - Parallel A completes)
 * Promise resolved: Parallel A
 * Parallel results: Parallel A result Parallel B result
 * 
 * (After 300ms more)
 * Async error: Error: Failing Task failed
 * Async function completed
 */

/**
 * ======================================
 * 5. ASYNC WITHOUT AWAIT
 * ======================================
 * Fungsi async tetap mengembalikan Promise meski tanpa await
 */
console.log("\n=== 5. Async Without Await ===");

async function asyncNoAwait() {
  console.log("Start asyncNoAwait");
  
  // Ini akan berjalan di background
  promiseTask("Background Task", 700)
    .then(result => console.log("Background completed:", result));
  
  console.log("End of asyncNoAwait");
  return "Direct return value";
}

console.log("Before asyncNoAwait");
asyncNoAwait().then(result => console.log("Function returned:", result));
console.log("After asyncNoAwait");

/**
 * Output:
 * Before asyncNoAwait
 * Start asyncNoAwait
 * End of asyncNoAwait
 * After asyncNoAwait
 * Function returned: Direct return value
 * 
 * (After 700ms)
 * Promise resolved: Background Task
 * Background completed: Background Task result
 */

/**
 * ======================================
 * 6. COMPARING ALL APPROACHES
 * ======================================
 */
console.log("\n=== 6. Comparison ===");

function compareApproaches() {
  console.log("\n--- Callback Approach ---");
  asyncCallback("Compare A", 300, () => {
    asyncCallback("Compare B", 200, () => {
      asyncCallback("Compare C", 100, () => {
        console.log("Callback chain done");
      });
    });
  });

  console.log("\n--- Promise Approach ---");
  promiseTask("Compare X", 400)
    .then(() => promiseTask("Compare Y", 300))
    .then(() => promiseTask("Compare Z", 200))
    .then(() => console.log("Promise chain done"))
    .catch(err => console.error(err));

  console.log("\n--- Async/Await Approach ---");
  (async () => {
    try {
      await promiseTask("Compare 1", 500);
      await promiseTask("Compare 2", 400);
      await promiseTask("Compare 3", 300);
      console.log("Async chain done");
    } catch (err) {
      console.error(err);
    }
  })();
}

compareApproaches();