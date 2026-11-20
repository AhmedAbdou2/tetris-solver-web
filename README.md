# Tetris Solver

An interactive web-based Tetris solver and algorithm visualizer built with HTML, CSS, and Vanilla JavaScript.

The application arranges Tetrominoes into the smallest possible square grid and visualizes the search process using DFS and Backtracking.

## Features

- Upload Tetromino input files (`.txt`).
- Enter puzzle data directly in the text editor.
- Try predefined examples, including a 12-piece hard case.
- Validate Tetromino shapes and connectivity.
- Solve puzzles using DFS and Backtracking.
- Find the smallest possible square grid.
- Visualize placements, rejected attempts, and backtracking events.
- Navigate through recorded algorithm steps.
- Play, pause, and control playback speed.
- View solver statistics.
- Download the final solution as a TXT file.
- Run the solver in a Web Worker to keep the interface responsive.

## Technologies

- HTML5
- CSS3
- JavaScript ES Modules
- Vanilla JavaScript
- Web Workers
- Node.js built-in test runner

No frontend framework or runtime dependency is required.

## Project Structure

```text
tetris-solver-web/
│
├── index.html
├── README.md
├── package.json
│
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── main.js
│   │
│   ├── core/
│   │   ├── parser.js
│   │   ├── validator.js
│   │   ├── board.js
│   │   ├── solver.js
│   │   └── solver.worker.js
│   │
│   ├── data/
│   │   └── examples.js
│   │
│   ├── ui/
│   │   ├── input-controller.js
│   │   └── solver-controller.js
│   │
│   └── visualization/
│       ├── grid-renderer.js
│       ├── step-renderer.js
│       └── playback.js
│
└── tests/
    ├── parser.test.js
    └── solver.test.js
```

## Input Format

Each Tetromino is represented by a 4 × 4 block.

- `#` represents an occupied cell.
- `.` represents an empty cell.
- Every Tetromino must contain exactly four occupied cells.
- All four cells must be connected horizontally or vertically.
- Consecutive Tetromino blocks are separated by one blank line.

Example:

```text
....
.##.
.##.
....
```

## How the Solver Works

### 1. Parsing and Validation

The parser converts the input text into Tetromino objects containing cell coordinates.

Each piece is validated before being passed to the solver.

### 2. Normalization

Tetromino coordinates are shifted so their minimum row and column become zero.

The original orientation is preserved. Rotations and mirroring are not generated.

### 3. Search Strategy

The JavaScript solver uses recursive DFS and Backtracking.

It uses a Most Constrained Cell strategy to prioritize cells with the fewest available placement options.

When a placement fails to lead to a complete solution, the solver removes the piece and explores another possibility.

Empty cells are also considered when necessary.

The grid size starts at the smallest square capable of containing all occupied cells and increases when no arrangement is found.

### 4. Visualization

The solver records compact events describing:

- Grid initialization
- Cell selection
- Placement attempts
- Successful placements
- Backtracking
- Empty-cell decisions
- Final solution

The Playback system reconstructs board states from these events.

## Run Locally

Node.js 18 or later is required for running the automated tests.

Start a local static server from the project root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Run Tests

Run the automated tests:

```bash
npm test
```

The test suite covers parsing, validation, single-piece solving, multiple-piece solving, and the 12-piece hard example.

## Search Limits

The default browser solver limits are:

- 50,000 candidate placement attempts.
- 150,000 recorded events.

Reaching these limits means the search was stopped safely. It does not prove that a puzzle has no solution.

The user can cancel an active search.

## Deployment

The project is a static website and can be hosted using GitHub Pages.

1. Push the project to GitHub.
2. Open the repository Settings.
3. Select Pages.
4. Choose Deploy from a branch.
5. Select `main` and the root folder (`/`).
6. Save the configuration.

GitHub Pages will publish the website.

## License

No license has been specified yet.
