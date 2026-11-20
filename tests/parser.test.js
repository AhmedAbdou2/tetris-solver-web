import test from "node:test";
import assert from "node:assert/strict";

import { parseInput } from "../js/core/parser.js";

// ==========================================
// Valid Input
// ==========================================

test("Parse one valid Tetromino", () => {
  const input = `....
.##.
.##.
....`;

  const pieces = parseInput(input);

  assert.equal(pieces.length, 1);
  assert.equal(pieces[0].label, "A");
  assert.equal(pieces[0].cells.length, 4);
});

test("Parse multiple Tetrominoes", () => {
  const input = `....
.##.
.##.
....

....
##..
##..
....`;

  const pieces = parseInput(input);

  assert.equal(pieces.length, 2);
  assert.equal(pieces[0].label, "A");
  assert.equal(pieces[1].label, "B");
});

// ==========================================
// Line Endings
// ==========================================

test("Support Windows line endings", () => {
  const input = "....\r\n.##.\r\n.##.\r\n....";

  const pieces = parseInput(input);

  assert.equal(pieces.length, 1);
});

// ==========================================
// Invalid Input
// ==========================================

test("Reject empty input", () => {
  assert.throws(() => parseInput(""), /cannot be empty/i);
});

test("Reject disconnected cells", () => {
  const input = `#...
.#..
..#.
...#`;

  assert.throws(() => parseInput(input), /not connected/i);
});

test("Reject invalid characters", () => {
  const input = `....
.X#.
.##.
....`;

  assert.throws(() => parseInput(input), /invalid character/i);
});

test("Reject incorrect row dimensions", () => {
  const input = `....
.##
.##.
....`;

  assert.throws(() => parseInput(input), /exactly 4 characters/i);
});

test("Reject incorrect filled cell count", () => {
  const input = `....
.##.
.#..
....`;

  assert.throws(() => parseInput(input), /exactly four filled cells/i);
});
