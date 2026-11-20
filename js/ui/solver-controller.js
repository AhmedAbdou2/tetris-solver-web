import { parseInput } from "../core/parser.js";

export function setupSolverController({ dom, state, playback }) {
  let activeWorker = null;

  const SEARCH_LIMITS = {
    maxAttempts: 50000,
    maxSnapshots: 150000,
  };

  // ======================================
  // Error Handling
  // ======================================

  function showError(message) {
    dom.inputErrors.textContent = message;
    dom.inputErrors.hidden = false;
  }

  function clearError() {
    dom.inputErrors.textContent = "";
    dom.inputErrors.hidden = true;
  }

  // ======================================
  // Busy State
  // ======================================

  function setBusy(busy) {
    const hasInput = dom.inputEditor.value.trim().length > 0;

    dom.solveButton.disabled = busy || !hasInput;
    dom.resetButton.disabled = busy || !hasInput;

    dom.inputEditor.disabled = busy;
    dom.fileInput.disabled = busy;
    dom.exampleSelect.disabled = busy;

    dom.cancelButton.hidden = !busy;
    dom.cancelButton.disabled = !busy;
  }

  function finishWorker() {
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }

    setBusy(false);
  }

  // ======================================
  // Statistics
  // ======================================

  function updateStatistics(stats) {
    dom.resultPieceCount.textContent = stats.pieceCount;
    dom.resultSearchSteps.textContent = stats.candidateAttempts;
    dom.resultBacktracks.textContent = stats.backtracks;

    dom.resultExecutionTime.textContent =
      stats.elapsedMs < 1000
        ? `${stats.elapsedMs.toFixed(2)} ms`
        : `${(stats.elapsedMs / 1000).toFixed(2)} s`;

    dom.resultGridSizes.textContent = stats.gridSizesTried;
  }

  // ======================================
  // Download Solution
  // ======================================

  function downloadSolution() {
    if (!state.isSolved || !state.solution) {
      showError("There is no solution available to download.");
      return;
    }

    const content = state.solution.map((row) => row.join("")).join("\n") + "\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const pieceCount = state.tetrominoes.length;
    const size = state.solution.length;

    link.href = url;
    link.download = `tetris-solution-${pieceCount}-pieces-${size}x${size}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ======================================
  // Successful Solution
  // ======================================

  function handleSolution(result) {
    state.solution = result.grid.map((row) => [...row]);
    state.isSolved = true;

    playback.load(result.snapshots);

    dom.gridDimensions.textContent = `${result.size} × ${result.size}`;

    dom.resultGridSize.textContent = `${result.size} × ${result.size}`;

    dom.solutionStatus.textContent = "Solved";
    dom.solverStatus.textContent = "Solved";

    updateStatistics(result.stats);

    dom.downloadButton.disabled = false;

    console.info("Solver completed:", result);
  }

  // ======================================
  // Search Limit Reached
  // ======================================

  function handleLimitReached(result) {
    state.solution = null;
    state.isSolved = false;

    playback.load(result.snapshots);

    dom.solutionStatus.textContent = "Incomplete";
    dom.solverStatus.textContent = "Search Limit";

    dom.resultGridSize.textContent = "--";

    updateStatistics(result.stats);

    showError(
      "Search limit reached. No solution was produced within the configured limit.",
    );

    dom.downloadButton.disabled = true;
  }

  // ======================================
  // Worker Messages
  // ======================================

  function handleWorkerMessage(event) {
    const { type } = event.data;

    if (type === "progress") {
      dom.solverStatus.textContent = "Searching...";

      updateStatistics(event.data.stats);

      dom.stepCounter.textContent = `${event.data.stats.snapshotsCount} Events`;

      return;
    }

    if (type === "error") {
      showError(event.data.message);

      dom.solverStatus.textContent = "Error";
      dom.solutionStatus.textContent = "Failed";

      finishWorker();
      return;
    }

    if (type === "complete") {
      const { result } = event.data;

      clearError();

      if (result.status === "solved") {
        handleSolution(result);
      } else {
        handleLimitReached(result);
      }

      finishWorker();
    }
  }

  // ======================================
  // Worker Errors
  // ======================================

  function handleWorkerError(event) {
    console.error("Worker error:", event);

    showError("The solver worker encountered an error.");

    dom.solverStatus.textContent = "Error";
    dom.solutionStatus.textContent = "Failed";

    finishWorker();
  }

  // ======================================
  // Run Solver
  // ======================================

  function runSolver() {
    if (activeWorker) return;

    clearError();

    const input = dom.inputEditor.value;

    if (!input.trim()) {
      showError("Please provide Tetromino input.");
      return;
    }

    let tetrominoes;

    try {
      tetrominoes = parseInput(input);
    } catch (error) {
      showError(error.message);

      dom.solverStatus.textContent = "Invalid Input";
      dom.solutionStatus.textContent = "Invalid Input";

      return;
    }

    playback.reset();

    state.inputText = input;
    state.tetrominoes = tetrominoes;
    state.solution = null;
    state.isSolved = false;

    dom.solverStatus.textContent = "Starting...";
    dom.solutionStatus.textContent = "Running";

    dom.resultGridSize.textContent = "--";
    dom.resultPieceCount.textContent = tetrominoes.length;
    dom.resultSearchSteps.textContent = "0";
    dom.resultBacktracks.textContent = "0";
    dom.resultExecutionTime.textContent = "--";
    dom.resultGridSizes.textContent = "0";

    dom.gridDimensions.textContent = "-- × --";
    dom.stepCounter.textContent = "0 Steps";

    dom.downloadButton.disabled = true;

    dom.boardContainer.innerHTML = `
            <div class="empty-state">
                <p>Searching for a solution...</p>
                <span>The search runs in a separate worker.</span>
            </div>
        `;

    setBusy(true);

    try {
      activeWorker = new Worker(
        new URL("../core/solver.worker.js", import.meta.url),
        { type: "module" },
      );

      activeWorker.addEventListener("message", handleWorkerMessage);

      activeWorker.addEventListener("error", handleWorkerError);

      activeWorker.postMessage({
        tetrominoes,
        limits: SEARCH_LIMITS,
      });
    } catch (error) {
      console.error(error);

      showError("Unable to start the solver worker.");

      dom.solverStatus.textContent = "Error";
      dom.solutionStatus.textContent = "Failed";

      finishWorker();
    }
  }

  // ======================================
  // Cancel Solver
  // ======================================

  function cancelSolver() {
    if (!activeWorker) return;

    finishWorker();
    playback.reset();

    state.tetrominoes = [];
    state.solution = null;
    state.isSolved = false;

    dom.solverStatus.textContent = "Cancelled";
    dom.solutionStatus.textContent = "Cancelled";

    dom.downloadButton.disabled = true;

    showError("Search was cancelled by the user.");
  }

  // ======================================
  // Event Listeners
  // ======================================

  dom.solveButton.addEventListener("click", runSolver);
  dom.cancelButton.addEventListener("click", cancelSolver);

  dom.downloadButton.addEventListener("click", downloadSolution);
}
