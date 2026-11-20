import { validateBlock } from "./validator.js";

export function parseInput(content) {
  if (typeof content !== "string") {
    throw new TypeError("Input must be a string.");
  }

  // Normalize line endings
  const normalized = content.replace(/\r\n?/g, "\n");

  // Ignore trailing newline characters
  const input = normalized.replace(/\n+$/, "");

  if (!input.trim()) {
    throw new Error("Input cannot be empty.");
  }

  // Separate Tetromino blocks
  const blocks = input.split("\n\n");

  return blocks.map((block, index) => {
    const rows = block.split("\n");

    const cells = validateBlock(rows, index);

    return {
      id: index,
      label: String.fromCharCode(65 + index),
      cells,
    };
  });
}
