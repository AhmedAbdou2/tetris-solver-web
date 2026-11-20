import { renderGrid } from "./grid-renderer.js";
import { createStepRenderer } from "./step-renderer.js";

const CHECKPOINT_INTERVAL = 250;

export function setupPlayback({ dom, state }) {
  let timer = null;
  let checkpoints = [];

  const stepRenderer = createStepRenderer(dom.stepsContainer, (index) =>
    goToStep(index),
  );

  // ======================================
  // Helpers
  // ======================================

  function cloneGrid(grid) {
    return grid.map((row) => [...row]);
  }

  function cloneFrame(frame) {
    return {
      grid: cloneGrid(frame.grid),
      skippedCells: new Set(frame.skippedCells),
    };
  }

  function emptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill("."));
  }

  // ======================================
  // Apply an Event
  // ======================================

  function applyEvent(frame, event) {
    switch (event.type) {
      case "grid-start":
        frame.grid = emptyGrid(event.gridSize);
        frame.skippedCells.clear();
        break;

      case "placement":
        for (const cell of event.cells || []) {
          frame.grid[cell.row][cell.col] = event.pieceLabel;
        }
        break;

      case "backtrack":
        for (const cell of event.cells || []) {
          if (frame.grid[cell.row][cell.col] === event.pieceLabel) {
            frame.grid[cell.row][cell.col] = ".";
          }
        }
        break;

      case "empty-cell":
        frame.skippedCells.add(`${event.row},${event.col}`);
        break;

      case "backtrack-empty":
        frame.skippedCells.delete(`${event.row},${event.col}`);
        break;

      default:
        break;
    }
  }

  // ======================================
  // Build Checkpoints
  // ======================================

  function prepareCheckpoints() {
    checkpoints = [];

    const frame = {
      grid: [],
      skippedCells: new Set(),
    };

    state.snapshots.forEach((event, index) => {
      applyEvent(frame, event);

      if ((index + 1) % CHECKPOINT_INTERVAL === 0) {
        checkpoints.push({
          index,
          frame: cloneFrame(frame),
        });
      }
    });
  }

  // ======================================
  // Reconstruct a Specific Step
  // ======================================

  function buildFrameAt(targetIndex) {
    let checkpoint = null;

    for (let i = checkpoints.length - 1; i >= 0; i--) {
      if (checkpoints[i].index <= targetIndex) {
        checkpoint = checkpoints[i];
        break;
      }
    }

    const frame = checkpoint
      ? cloneFrame(checkpoint.frame)
      : {
          grid: [],
          skippedCells: new Set(),
        };

    const startIndex = checkpoint ? checkpoint.index + 1 : 0;

    for (let i = startIndex; i <= targetIndex; i++) {
      applyEvent(frame, state.snapshots[i]);
    }

    return frame;
  }

  // ======================================
  // Current Step Rendering
  // ======================================

  function renderCurrentStep() {
    const index = state.currentStep;
    const snapshots = state.snapshots;

    if (index < 0 || index >= snapshots.length) {
      return;
    }

    const event = snapshots[index];
    const frame = buildFrameAt(index);

    let highlights = event.cells || [];

    if (
      highlights.length === 0 &&
      Number.isInteger(event.row) &&
      Number.isInteger(event.col) &&
      ["cell-selected", "empty-cell", "backtrack-empty"].includes(event.type)
    ) {
      highlights = [
        {
          row: event.row,
          col: event.col,
        },
      ];
    }

    renderGrid(dom.boardContainer, frame.grid, {
      eventType: event.type,
      accepted: event.accepted,
      highlights,
      skippedCells: [...frame.skippedCells],
    });

    stepRenderer.render(snapshots, index);

    dom.gridDimensions.textContent = frame.grid.length
      ? `${frame.grid.length} × ${frame.grid.length}`
      : "-- × --";

    dom.stepCounter.textContent = `Step ${index + 1} / ${snapshots.length}`;

    updateControls();
  }

  // ======================================
  // Controls State
  // ======================================

  function updateControls() {
    const total = state.snapshots.length;
    const index = state.currentStep;
    const hasSteps = total > 0;

    dom.firstStep.disabled = !hasSteps || index <= 0;
    dom.previousStep.disabled = !hasSteps || index <= 0;

    dom.nextStep.disabled = !hasSteps || index >= total - 1;
    dom.lastStep.disabled = !hasSteps || index >= total - 1;

    dom.playPause.disabled = total < 2;
  }

  // ======================================
  // Navigation
  // ======================================

  function pause() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    dom.playPause.textContent = "Play";
  }

  function renderStep(index) {
    if (index < 0 || index >= state.snapshots.length) {
      return;
    }

    state.currentStep = index;
    renderCurrentStep();
  }

  function goToStep(index) {
    pause();
    renderStep(index);
  }

  function first() {
    goToStep(0);
  }

  function previous() {
    goToStep(state.currentStep - 1);
  }

  function next() {
    goToStep(state.currentStep + 1);
  }

  function last() {
    goToStep(state.snapshots.length - 1);
  }

  // ======================================
  // Automatic Playback
  // ======================================

  function play() {
    if (state.snapshots.length < 2) return;

    if (state.currentStep >= state.snapshots.length - 1) {
      renderStep(0);
    }

    if (timer !== null) return;

    const interval = Number(dom.playbackSpeed.value) || 350;

    dom.playPause.textContent = "Pause";

    timer = setInterval(() => {
      if (state.currentStep >= state.snapshots.length - 1) {
        pause();
        return;
      }

      renderStep(state.currentStep + 1);
    }, interval);
  }

  function togglePlayback() {
    if (timer !== null) {
      pause();
    } else {
      play();
    }
  }

  // ======================================
  // Load Solver Events
  // ======================================

  function load(snapshots) {
    pause();

    state.snapshots = snapshots || [];
    state.currentStep = state.snapshots.length - 1;

    if (state.snapshots.length === 0) {
      reset();
      return;
    }

    prepareCheckpoints();
    renderCurrentStep();
  }

  // ======================================
  // Reset
  // ======================================

  function reset() {
    pause();

    state.snapshots = [];
    state.currentStep = 0;

    checkpoints = [];

    stepRenderer.clear();
    dom.stepCounter.textContent = "0 Steps";

    updateControls();
  }

  // ======================================
  // Event Listeners
  // ======================================

  dom.firstStep.addEventListener("click", first);
  dom.previousStep.addEventListener("click", previous);
  dom.nextStep.addEventListener("click", next);
  dom.lastStep.addEventListener("click", last);

  dom.playPause.addEventListener("click", togglePlayback);

  dom.playbackSpeed.addEventListener("change", () => {
    if (timer !== null) {
      pause();
      play();
    }
  });

  reset();

  return {
    load,
    reset,
    goToStep,
    pause,
  };
}
