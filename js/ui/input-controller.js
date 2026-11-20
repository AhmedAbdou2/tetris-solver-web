import { examples } from "../data/examples.js";

export function setupInputController({ dom, state, playback }) {
  function showInputError(message) {
    dom.inputErrors.textContent = message;
    dom.inputErrors.hidden = false;
    dom.solverStatus.textContent = "Invalid Input";
  }

  function clearInputError() {
    dom.inputErrors.textContent = "";
    dom.inputErrors.hidden = true;
  }

  function resetSolverData() {
    playback.reset();

    state.tetrominoes = [];
    state.solution = null;
    state.isSolved = false;

    dom.solutionStatus.textContent = "Not Started";
    dom.solverStatus.textContent = "Ready";

    dom.gridDimensions.textContent = "-- × --";

    dom.resultGridSize.textContent = "--";
    dom.resultPieceCount.textContent = "--";
    dom.resultSearchSteps.textContent = "--";
    dom.resultBacktracks.textContent = "--";

    dom.downloadButton.disabled = true;

    dom.boardContainer.innerHTML = `
            <div class="empty-state">
                <p>Your solution will appear here.</p>
                <span>Upload an input to get started.</span>
            </div>
        `;

    dom.cancelButton.hidden = true;
    dom.cancelButton.disabled = true;
    dom.resultExecutionTime.textContent = "--";
    dom.resultGridSizes.textContent = "--";
  }

  function updateInputControls() {
    state.inputText = dom.inputEditor.value;

    const hasInput = state.inputText.trim().length > 0;

    dom.solveButton.disabled = !hasInput;
    dom.resetButton.disabled = !hasInput;
  }

  function setInputContent(content) {
    dom.inputEditor.value = content;

    clearInputError();
    resetSolverData();

    updateInputControls();
  }

  // ======================================
  // Text Editor
  // ======================================

  dom.inputEditor.addEventListener("input", () => {
    dom.fileInput.value = "";
    dom.exampleSelect.value = "";

    setInputContent(dom.inputEditor.value);
  });

  // ======================================
  // File Upload
  // ======================================

  dom.fileInput.addEventListener("change", async () => {
    const file = dom.fileInput.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      showInputError("Please select a valid TXT file.");
      dom.fileInput.value = "";
      return;
    }

    try {
      const content = await file.text();

      if (!content.trim()) {
        throw new Error("The selected file is empty.");
      }

      dom.exampleSelect.value = "";
      setInputContent(content);
    } catch (error) {
      dom.fileInput.value = "";
      showInputError(error.message);
    }
  });

  // ======================================
  // Examples
  // ======================================

  dom.exampleSelect.addEventListener("change", () => {
    const selectedExample = dom.exampleSelect.value;

    if (!selectedExample) return;

    const content = examples[selectedExample];

    if (!content) {
      showInputError("Example not found.");
      return;
    }

    dom.fileInput.value = "";
    setInputContent(content);
  });

  // ======================================
  // Reset
  // ======================================

  dom.resetButton.addEventListener("click", () => {
    dom.inputEditor.value = "";
    dom.fileInput.value = "";
    dom.exampleSelect.value = "";

    clearInputError();
    resetSolverData();

    updateInputControls();
  });

  // Initial Setup
  resetSolverData();
  updateInputControls();
}
