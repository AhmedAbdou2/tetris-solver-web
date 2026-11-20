import { setupInputController } from "./ui/input-controller.js";
import { setupSolverController } from "./ui/solver-controller.js";
import { setupPlayback } from "./visualization/playback.js";

// ==========================================
// DOM Elements
// ==========================================

function getElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Element with ID "${id}" was not found.`);
  }

  return element;
}

const dom = {
  exampleSelect: getElement("example-select"),
  fileInput: getElement("file-input"),
  inputEditor: getElement("input-editor"),
  inputErrors: getElement("input-errors"),

  solveButton: getElement("solve-button"),
  resetButton: getElement("reset-button"),
  cancelButton: getElement("cancel-button"),

  solverStatus: getElement("solver-status-text"),
  solutionStatus: getElement("solution-status"),

  boardContainer: getElement("board-container"),
  gridDimensions: getElement("grid-dimensions"),

  stepsContainer: getElement("steps-container"),
  stepCounter: getElement("step-counter"),

  firstStep: getElement("first-step"),
  previousStep: getElement("previous-step"),
  playPause: getElement("play-pause"),
  nextStep: getElement("next-step"),
  lastStep: getElement("last-step"),
  playbackSpeed: getElement("playback-speed"),

  resultGridSize: getElement("result-grid-size"),
  resultPieceCount: getElement("result-piece-count"),
  resultSearchSteps: getElement("result-search-steps"),
  resultBacktracks: getElement("result-backtracks"),

  downloadButton: getElement("download-button"),
  resultExecutionTime: getElement("result-execution-time"),
  resultGridSizes: getElement("result-grid-sizes"),
};

// ==========================================
// Application State
// ==========================================

const state = {
  inputText: "",
  tetrominoes: [],
  snapshots: [],
  currentStep: 0,
  solution: null,
  isSolved: false,
};

// ==========================================
// Initialization
// ==========================================

const playback = setupPlayback({ dom, state });

setupInputController({ dom, state, playback });

setupSolverController({ dom, state, playback });

console.info("Tetris Solver initialized.");
