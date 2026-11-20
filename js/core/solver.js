import { normalize, makeGrid, placePiece, removePiece } from "./board.js";

// ==========================================
// Search Snapshot
// ==========================================

function createSnapshot(step, type, details = {}) {
  return {
    step,
    type,
    gridSize: details.gridSize,
    pieceId: details.pieceId ?? null,
    pieceLabel: details.pieceLabel ?? null,
    row: details.row ?? null,
    col: details.col ?? null,
    cells: details.cells ?? [],
    depth: details.depth ?? 0,
    accepted: details.accepted ?? null,
    reason: details.reason ?? null,
    candidateCount: details.candidateCount ?? null,
    message: details.message ?? "",
  };
}

// ==========================================
// Generate All Possible Placements
// ==========================================

function buildPlacementsByCell(pieces, size) {
  const placementsByCell = Array.from({ length: size * size }, () => []);

  pieces.forEach((piece, pieceIndex) => {
    const maxRow = Math.max(...piece.cells.map((cell) => cell.row));

    const maxCol = Math.max(...piece.cells.map((cell) => cell.col));

    for (let row = 0; row <= size - 1 - maxRow; row++) {
      for (let col = 0; col <= size - 1 - maxCol; col++) {
        const cells = piece.cells.map((cell) => ({
          row: row + cell.row,
          col: col + cell.col,
        }));

        const placement = {
          pieceIndex,
          row,
          col,
          cells,
        };

        for (const cell of cells) {
          const index = cell.row * size + cell.col;
          placementsByCell[index].push(placement);
        }
      }
    }
  });

  return placementsByCell;
}

// ==========================================
// Check Placement Availability
// ==========================================

function isPlacementAvailable(placement, grid, skipped) {
  for (const cell of placement.cells) {
    if (grid[cell.row][cell.col] !== "." || skipped[cell.row][cell.col]) {
      return false;
    }
  }

  return true;
}

// ==========================================
// Select Most Constrained Cell
// ==========================================

function selectMostConstrainedCell(
  grid,
  skipped,
  placedPieces,
  placementsByCell,
  size,
) {
  let bestIndex = -1;
  let bestOptions = null;
  let minimumOptions = Infinity;

  for (let index = 0; index < size * size; index++) {
    const row = Math.floor(index / size);
    const col = index % size;

    if (grid[row][col] !== "." || skipped[row][col]) {
      continue;
    }

    const options = placementsByCell[index].filter((placement) => {
      if (placedPieces[placement.pieceIndex]) {
        return false;
      }

      return isPlacementAvailable(placement, grid, skipped);
    });

    if (options.length < minimumOptions) {
      minimumOptions = options.length;
      bestIndex = index;
      bestOptions = options;

      if (minimumOptions === 0) {
        break;
      }
    }
  }

  if (bestIndex === -1) {
    return null;
  }

  return {
    index: bestIndex,
    row: Math.floor(bestIndex / size),
    col: bestIndex % size,
    options: bestOptions,
  };
}

// ==========================================
// Find Smallest Square
// ==========================================

export function findSmallestSquare(tetrominoes, options = {}) {
  if (!Array.isArray(tetrominoes) || tetrominoes.length === 0) {
    throw new Error("At least one Tetromino is required.");
  }

  const MAX_ATTEMPTS = options.maxAttempts ?? 50000;
  const MAX_SNAPSHOTS = options.maxSnapshots ?? 150000;

  const startTime = performance.now();

  const pieces = tetrominoes.map(normalize);

  const totalCells = pieces.reduce(
    (total, piece) => total + piece.cells.length,
    0,
  );

  let gridSize = Math.max(2, Math.ceil(Math.sqrt(totalCells)));

  const stats = {
    pieceCount: pieces.length,
    totalCells,

    initialGridSize: gridSize,
    finalGridSize: 0,

    gridSizesTried: 0,
    failedGridSizes: 0,

    candidateAttempts: 0,
    validPlacements: 0,
    rejectedAttempts: 0,

    backtracks: 0,
    pieceBacktracks: 0,
    emptyCellBacktracks: 0,
    emptyCellsSkipped: 0,

    snapshotsCount: 0,
    elapsedMs: 0,
  };

  const snapshots = [];

  let solution = null;
  let aborted = false;

  // ======================================
  // Snapshot Recording
  // ======================================

  function recordSnapshot(type, details = {}) {
    if (snapshots.length >= MAX_SNAPSHOTS) {
      aborted = true;
      return;
    }

    snapshots.push(
      createSnapshot(snapshots.length + 1, type, {
        gridSize,
        ...details,
      }),
    );
  }

  function reportProgress() {
    if (
      stats.candidateAttempts % 250 === 0 &&
      typeof options.onProgress === "function"
    ) {
      options.onProgress({
        ...stats,
        snapshotsCount: snapshots.length,
        gridSize,
      });
    }
  }

  // ======================================
  // DFS + Backtracking
  // ======================================

  function solve(
    grid,
    skipped,
    placedPieces,
    placedCount,
    emptyCellsLeft,
    placementsByCell,
  ) {
    if (aborted) return false;

    // All pieces have been placed
    if (placedCount === pieces.length) {
      solution = grid.map((row) => [...row]);

      recordSnapshot("solution", {
        depth: placedCount,
        message: "All Tetrominoes placed successfully.",
      });

      return true;
    }

    // Select the cell with the fewest valid placements
    const selected = selectMostConstrainedCell(
      grid,
      skipped,
      placedPieces,
      placementsByCell,
      gridSize,
    );

    if (!selected) {
      return false;
    }

    const { row, col, options: candidates } = selected;

    recordSnapshot("cell-selected", {
      row,
      col,
      depth: placedCount,
      candidateCount: candidates.length,
      message: `Selected cell (${row}, ${col}) with ${candidates.length} candidates.`,
    });

    if (aborted) return false;

    // Try every valid placement covering this cell
    for (const placement of candidates) {
      if (aborted) return false;

      if (stats.candidateAttempts >= MAX_ATTEMPTS) {
        aborted = true;
        return false;
      }

      const piece = pieces[placement.pieceIndex];

      stats.candidateAttempts++;
      reportProgress();

      recordSnapshot("attempt", {
        pieceId: piece.id,
        pieceLabel: piece.label,
        row: placement.row,
        col: placement.col,
        cells: placement.cells,
        depth: placedCount,
        accepted: true,
        message: `Trying piece ${piece.label} at (${placement.row}, ${placement.col}).`,
      });

      if (aborted) return false;

      // Place the piece
      placedPieces[placement.pieceIndex] = true;

      placePiece(grid, piece, placement.row, placement.col);

      stats.validPlacements++;

      recordSnapshot("placement", {
        pieceId: piece.id,
        pieceLabel: piece.label,
        row: placement.row,
        col: placement.col,
        cells: placement.cells,
        depth: placedCount + 1,
        message: `Piece ${piece.label} placed successfully.`,
      });

      if (aborted) return false;

      // Continue searching
      if (
        solve(
          grid,
          skipped,
          placedPieces,
          placedCount + 1,
          emptyCellsLeft,
          placementsByCell,
        )
      ) {
        return true;
      }

      if (aborted) return false;

      // Backtrack
      removePiece(grid, piece, placement.row, placement.col);

      placedPieces[placement.pieceIndex] = false;

      stats.backtracks++;
      stats.pieceBacktracks++;

      recordSnapshot("backtrack", {
        pieceId: piece.id,
        pieceLabel: piece.label,
        row: placement.row,
        col: placement.col,
        cells: placement.cells,
        depth: placedCount,
        message: `Removed piece ${piece.label}. Trying another placement.`,
      });
    }

    // The selected cell may remain empty when space is available
    if (emptyCellsLeft > 0 && !aborted) {
      skipped[row][col] = true;

      stats.emptyCellsSkipped++;

      recordSnapshot("empty-cell", {
        row,
        col,
        depth: placedCount,
        message: `Leaving cell (${row}, ${col}) empty.`,
      });

      if (aborted) return false;

      if (
        solve(
          grid,
          skipped,
          placedPieces,
          placedCount,
          emptyCellsLeft - 1,
          placementsByCell,
        )
      ) {
        return true;
      }

      if (aborted) return false;

      // Undo the empty-cell decision
      skipped[row][col] = false;

      stats.backtracks++;
      stats.emptyCellBacktracks++;

      recordSnapshot("backtrack-empty", {
        row,
        col,
        depth: placedCount,
        message: `Undoing empty-cell decision at (${row}, ${col}).`,
      });
    }

    return false;
  }

  // ======================================
  // Search Grid Sizes
  // ======================================

  while (!aborted) {
    const grid = makeGrid(gridSize);

    const skipped = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false),
    );

    const placedPieces = Array(pieces.length).fill(false);

    const emptyCellsLeft = gridSize * gridSize - totalCells;

    const placementsByCell = buildPlacementsByCell(pieces, gridSize);

    stats.gridSizesTried++;

    recordSnapshot("grid-start", {
      message: `Starting ${gridSize} × ${gridSize} grid.`,
    });

    if (aborted) break;

    if (
      solve(grid, skipped, placedPieces, 0, emptyCellsLeft, placementsByCell)
    ) {
      break;
    }

    if (aborted) break;

    stats.failedGridSizes++;

    recordSnapshot("grid-failed", {
      message: `No solution for ${gridSize} × ${gridSize}.`,
    });

    gridSize++;
  }

  // ======================================
  // Final Result
  // ======================================

  stats.elapsedMs = performance.now() - startTime;
  stats.snapshotsCount = snapshots.length;

  if (typeof options.onProgress === "function") {
    options.onProgress({
      ...stats,
      snapshotsCount: snapshots.length,
      gridSize,
    });
  }

  if (solution) {
    stats.finalGridSize = gridSize;

    return {
      status: "solved",
      grid: solution,
      size: gridSize,
      snapshots,
      stats,
    };
  }

  return {
    status: "limit-reached",
    grid: null,
    size: null,
    snapshots,
    stats,
  };
}
