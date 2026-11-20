import test from "node:test";
import assert from "node:assert/strict";

import { parseInput } from "../js/core/parser.js";
import { findSmallestSquare } from "../js/core/solver.js";

// ==========================================
// Test Helpers
// ==========================================

function solveInput(input) {
  const pieces = parseInput(input);

  return findSmallestSquare(pieces, {
    maxAttempts: 50000,
    maxSnapshots: 150000,
  });
}

function validateSolution(result, expectedPieces) {
  assert.equal(result.status, "solved");
  assert.ok(result.grid);
  assert.equal(result.grid.length, result.size);

  const pieceCounts = {};

  for (const row of result.grid) {
    assert.equal(row.length, result.size);

    for (const cell of row) {
      if (cell === ".") continue;

      pieceCounts[cell] = (pieceCounts[cell] || 0) + 1;
    }
  }

  assert.equal(Object.keys(pieceCounts).length, expectedPieces);

  for (const count of Object.values(pieceCounts)) {
    assert.equal(count, 4);
  }
}

// ==========================================
// Single Tetromino
// ==========================================

test("Solve one square Tetromino", () => {
  const input = `....
.##.
.##.
....`;

  const result = solveInput(input);

  validateSolution(result, 1);
  assert.equal(result.size, 2);
});

// ==========================================
// Multiple Tetrominoes
// ==========================================

test("Solve two square Tetrominoes", () => {
  const input = `....
.##.
.##.
....

....
##..
##..
....`;

  const result = solveInput(input);

  validateSolution(result, 2);
  assert.equal(result.size, 4);
});

// ==========================================
// Hard Case - 12 Tetrominoes
// ==========================================

test("Solve the 12-piece hard example", () => {
  const input = `....
.##.
.##.
....

.#..
.##.
.#..
....

....
..##
.##.
....

....
.##.
.##.
....

....
..#.
.##.
.#..
....

.###
...#
....
....

##..
.#..
.#..
....

....
.##.
.##.
....

....
..##
.##.
....

##..
.#..
.#..
....

.#..
.##.
..#.
....

....
###.
.#..
....`;

  const result = solveInput(input);

  validateSolution(result, 12);
  assert.equal(result.size, 7);

  assert.equal(result.stats.pieceCount, 12);
  assert.ok(result.stats.candidateAttempts > 0);
  assert.ok(result.snapshots.length > 0);
});
