const directions = [
  [-1, 0], // Up
  [1, 0], // Down
  [0, -1], // Left
  [0, 1], // Right
];

export function areConnected(cells) {
  if (!Array.isArray(cells) || cells.length === 0) {
    return false;
  }

  const occupied = new Set(cells.map((cell) => `${cell.row},${cell.col}`));

  const visited = new Set();
  const stack = [cells[0]];

  while (stack.length > 0) {
    const current = stack.pop();
    const currentKey = `${current.row},${current.col}`;

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);

    for (const [rowOffset, colOffset] of directions) {
      const nextRow = current.row + rowOffset;
      const nextCol = current.col + colOffset;
      const nextKey = `${nextRow},${nextCol}`;

      if (occupied.has(nextKey) && !visited.has(nextKey)) {
        stack.push({
          row: nextRow,
          col: nextCol,
        });
      }
    }
  }

  return visited.size === cells.length;
}

export function validateBlock(rows, blockIndex) {
  const pieceNumber = blockIndex + 1;

  if (rows.length !== 4) {
    throw new Error(
      `Piece ${pieceNumber}: Expected 4 rows, got ${rows.length}.`,
    );
  }

  const cells = [];

  for (let row = 0; row < 4; row++) {
    if (rows[row].length !== 4) {
      throw new Error(
        `Piece ${pieceNumber}: Row ${row + 1} must contain exactly 4 characters.`,
      );
    }

    for (let col = 0; col < 4; col++) {
      const char = rows[row][col];

      if (char !== "#" && char !== ".") {
        throw new Error(`Piece ${pieceNumber}: Invalid character "${char}".`);
      }

      if (char === "#") {
        cells.push({ row, col });
      }
    }
  }

  if (cells.length !== 4) {
    throw new Error(
      `Piece ${pieceNumber}: Expected exactly 4 filled cells, got ${cells.length}.`,
    );
  }

  if (!areConnected(cells)) {
    throw new Error(
      `Piece ${pieceNumber}: The filled cells are not connected.`,
    );
  }

  return cells;
}
