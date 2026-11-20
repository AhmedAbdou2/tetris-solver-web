function getPieceColor(label) {
  const index = label.charCodeAt(0) - 65;
  const hue = (190 + index * 53) % 360;

  return `hsl(${hue} 78% 55%)`;
}

export function renderGrid(container, grid, view = {}) {
  if (!Array.isArray(grid) || grid.length === 0) {
    container.replaceChildren();
    return;
  }

  const size = grid.length;
  const cellSize = Math.max(16, Math.min(38, Math.floor(420 / size)));

  const highlights = new Set(
    (view.highlights || []).map((cell) => `${cell.row},${cell.col}`),
  );

  const skipped = new Set(
    (view.skippedCells || []).map((cell) => `${cell.row},${cell.col}`),
  );

  const board = document.createElement("div");

  board.className = "board-grid";
  board.style.setProperty("--columns", size);
  board.style.setProperty("--cell-size", `${cellSize}px`);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = grid[row][col];
      const key = `${row},${col}`;

      const cell = document.createElement("div");

      cell.className = "board-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (value !== ".") {
        cell.classList.add("is-occupied");
        cell.textContent = value;

        cell.style.setProperty("--piece-color", getPieceColor(value));
      } else {
        cell.classList.add("is-empty");
      }

      if (skipped.has(key)) {
        cell.classList.add("is-skipped");
      }

      if (highlights.has(key)) {
        if (view.eventType === "attempt") {
          cell.classList.add(view.accepted ? "is-current" : "is-rejected");
        } else if (view.eventType === "backtrack") {
          cell.classList.add("is-backtracking");
        } else if (view.eventType === "cell-selected") {
          cell.classList.add("is-focus");
        } else if (
          view.eventType === "empty-cell" ||
          view.eventType === "backtrack-empty"
        ) {
          cell.classList.add("is-focus");
        } else if (view.eventType === "placement") {
          cell.classList.add("is-current");
        }
      }

      cell.setAttribute(
        "aria-label",
        `Row ${row + 1}, Column ${col + 1}, ${
          value === "." ? "Empty" : `Piece ${value}`
        }`,
      );

      board.appendChild(cell);
    }
  }

  container.replaceChildren(board);
}
