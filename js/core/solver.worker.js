import { findSmallestSquare } from "./solver.js";

self.addEventListener("message", (event) => {
  const { tetrominoes, limits } = event.data;

  try {
    const result = findSmallestSquare(tetrominoes, {
      maxAttempts: limits.maxAttempts,
      maxSnapshots: limits.maxSnapshots,

      onProgress(stats) {
        self.postMessage({
          type: "progress",
          stats,
        });
      },
    });

    self.postMessage({
      type: "complete",
      result,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error.message || "An unexpected solver error occurred.",
    });
  }
});
