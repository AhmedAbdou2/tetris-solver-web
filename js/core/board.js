// ==========================================
// Board Operations
// ==========================================

// Normalize Tetromino coordinates
export function normalize(tetromino) {
  const minRow = Math.min(...tetromino.cells.map((cell) => cell.row));
  const minCol = Math.min(...tetromino.cells.map((cell) => cell.col));

  return {
    ...tetromino,
    cells: tetromino.cells.map((cell) => ({
      row: cell.row - minRow,
      col: cell.col - minCol,
    })),
  };
}

// Create an empty square grid
export function makeGrid(size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("Grid size must be a positive integer.");
  }

  return Array.from({ length: size }, () => Array(size).fill("."));
}

// Check whether a Tetromino can be placed
export function canPlace(grid, tetromino, row, col) {
  if (!Array.isArray(grid) || grid.length === 0) {
    return false;
  }

  if (!Array.isArray(tetromino.cells)) {
    return false;
  }

  const size = grid.length;

  for (const cell of tetromino.cells) {
    const targetRow = row + cell.row;
    const targetCol = col + cell.col;

    if (
      targetRow < 0 ||
      targetCol < 0 ||
      targetRow >= size ||
      targetCol >= size
    ) {
      return false;
    }

    if (!Array.isArray(grid[targetRow]) || grid[targetRow][targetCol] !== ".") {
      return false;
    }
  }

  return true;
}

// Place a Tetromino on the grid
export function placePiece(grid, tetromino, row, col) {
  if (!canPlace(grid, tetromino, row, col)) {
    throw new Error(
      `Cannot place Tetromino ${tetromino.label} at (${row}, ${col}).`,
    );
  }

  for (const cell of tetromino.cells) {
    grid[row + cell.row][col + cell.col] = tetromino.label;
  }
}

// Remove a Tetromino from the grid
export function removePiece(grid, tetromino, row, col) {
  for (const cell of tetromino.cells) {
    const targetRow = row + cell.row;
    const targetCol = col + cell.col;

    if (
      targetRow >= 0 &&
      targetCol >= 0 &&
      targetRow < grid.length &&
      targetCol < grid.length &&
      grid[targetRow][targetCol] === tetromino.label
    ) {
      grid[targetRow][targetCol] = ".";
    }
  }
}
