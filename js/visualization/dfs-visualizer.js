const SVG_NS = "http://www.w3.org/2000/svg";

const DIRECTIONS = [
  { row: 0, col: -1, name: "Left" },
  { row: 0, col: 1, name: "Right" },
  { row: 1, col: 0, name: "Down" },
  { row: -1, col: 0, name: "Up" },
];

// ==========================================
// Tetromino Examples
// ==========================================

const SHAPES = {
  square: {
    title: "Square Tetromino (O)",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },

  line: {
    title: "Line Tetromino (I)",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },

  tee: {
    title: "T-Shape Tetromino",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
  },

  ell: {
    title: "L-Shape Tetromino",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  },

  ess: {
    title: "S-Shape Tetromino",
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
  },

  zee: {
    title: "Z-Shape Tetromino",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  },
};

// ==========================================
// Large Graph (A-I)
// ==========================================

const LARGE_GRAPH = {
  nodes: [
    { label: "A", x: 85, y: 65 },
    { label: "B", x: 260, y: 65 },
    { label: "C", x: 435, y: 65 },
    { label: "D", x: 85, y: 195 },
    { label: "E", x: 260, y: 195 },
    { label: "F", x: 435, y: 195 },
    { label: "G", x: 85, y: 325 },
    { label: "H", x: 260, y: 325 },
    { label: "I", x: 435, y: 325 },
  ],

  adjacency: {
    A: ["B", "D"],
    B: ["A", "C", "E"],
    C: ["B", "F"],
    D: ["A", "E", "G"],
    E: ["B", "D", "F", "H"],
    F: ["C", "E", "I"],
    G: ["D", "H"],
    H: ["E", "G", "I"],
    I: ["F", "H"],
  },

  edges: [
    ["A", "B"],
    ["A", "D"],
    ["B", "C"],
    ["B", "E"],
    ["C", "F"],
    ["D", "E"],
    ["D", "G"],
    ["E", "F"],
    ["E", "H"],
    ["F", "I"],
    ["G", "H"],
    ["H", "I"],
  ],
};

// ==========================================
// DOM Elements
// ==========================================

const ids = [
  "dfs-status",
  "dfs-step-number",
  "dfs-step-title",
  "dfs-step-message",
  "dfs-direction",

  "dfs-graph",
  "dfs-graph-title",
  "dfs-graph-description",
  "dfs-edges",
  "dfs-nodes",

  "dfs-domain-label",
  "dfs-domain-count",
  "dfs-domain",

  "dfs-stack",
  "dfs-visited",
  "dfs-visited-count",

  "dfs-processed",
  "dfs-processed-count",
  "dfs-traversal-order",

  "dfs-progress",

  "dfs-mode-shapes",
  "dfs-mode-graph",
  "dfs-shape-picker",
  "dfs-shape-select",

  "dfs-reset",
  "dfs-prev",
  "dfs-play",
  "dfs-next",
  "dfs-last",
];

const elements = Object.fromEntries(
  ids.map((id) => [id, document.getElementById(id)]),
);

if (ids.every((id) => elements[id])) {
  let currentIndex = 0;
  let timer = null;
  let currentModel = null;
  let snapshots = [];
  let currentMode = "shapes";

  // ======================================
  // Helpers
  // ======================================

  function createSVGElement(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);

    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }

    return element;
  }

  function edgeKey(first, second) {
    return [first, second].sort().join("-");
  }

  function cloneSet(set) {
    return [...set];
  }

  // ======================================
  // Build Tetromino Model
  // ======================================

  function buildShapeModel(shapeName) {
    const shape = SHAPES[shapeName];

    const cells = shape.cells
      .map(([row, col]) => ({ row, col }))
      .sort((a, b) => a.row - b.row || a.col - b.col);

    const maxRow = Math.max(...cells.map((cell) => cell.row));
    const maxCol = Math.max(...cells.map((cell) => cell.col));

    const rows = maxRow + 1;
    const cols = maxCol + 1;

    const tileSize = 64;
    const spacing = 90;

    const totalWidth = tileSize + (cols - 1) * spacing;
    const totalHeight = tileSize + (rows - 1) * spacing;

    const startX = (520 - totalWidth) / 2;
    const startY = (390 - totalHeight) / 2;

    const nodes = cells.map((cell, index) => ({
      label: String.fromCharCode(65 + index),
      row: cell.row,
      col: cell.col,
      x: startX + cell.col * spacing + tileSize / 2,
      y: startY + cell.row * spacing + tileSize / 2,
      shapeCell: true,
    }));

    const coordinateMap = new Map(
      nodes.map((node) => [`${node.row},${node.col}`, node.label]),
    );

    const adjacency = {};
    const edges = new Map();

    for (const node of nodes) {
      adjacency[node.label] = [];

      for (const direction of DIRECTIONS) {
        const nextRow = node.row + direction.row;
        const nextCol = node.col + direction.col;

        const neighbor = coordinateMap.get(`${nextRow},${nextCol}`);

        if (neighbor) {
          adjacency[node.label].push({
            label: neighbor,
            direction: direction.name,
          });

          const key = edgeKey(node.label, neighbor);

          if (!edges.has(key)) {
            edges.set(key, [node.label, neighbor]);
          }
        }
      }
    }

    return {
      title: shape.title,
      description: `${nodes.length} occupied and connected cells`,
      domainLabel: "cellSet",
      nodes,
      adjacency,
      edges: [...edges.entries()].map(([key, pair]) => ({
        key,
        pair,
      })),
      shapeMode: true,
      start: "A",
    };
  }

  // ======================================
  // Build Large Graph Model
  // ======================================

  function buildLargeGraphModel() {
    const nodes = LARGE_GRAPH.nodes.map((node) => ({
      ...node,
      shapeCell: false,
    }));

    const adjacency = {};

    for (const [label, neighbors] of Object.entries(LARGE_GRAPH.adjacency)) {
      adjacency[label] = neighbors.map((neighbor) => ({
        label: neighbor,
        direction: "Neighbor",
      }));
    }

    const edges = LARGE_GRAPH.edges.map((pair) => ({
      key: edgeKey(pair[0], pair[1]),
      pair,
    }));

    return {
      title: "Large DFS Graph (A–I)",
      description: "9 nodes · 12 undirected edges",
      domainLabel: "Graph Nodes",
      nodes,
      adjacency,
      edges,
      shapeMode: false,
      start: "A",
    };
  }

  // ======================================
  // DFS Simulation
  // ======================================

  function buildSnapshots(model) {
    const events = [];

    const cellSet = new Set(model.nodes.map((node) => node.label));

    const visited = new Set();
    const open = [];
    const processed = [];
    const treeEdges = new Set();

    let current = null;

    function record(type, title, message, details = {}) {
      events.push({
        type,
        title,
        message,

        current,
        open: [...open],
        visited: cloneSet(visited),
        processed: [...processed],
        cellSet: cloneSet(cellSet),
        treeEdges: cloneSet(treeEdges),

        activeEdge: details.activeEdge ?? null,
        currentNeighbor: details.currentNeighbor ?? null,
        direction: details.direction ?? "—",
      });
    }

    // Start DFS
    visited.add(model.start);
    open.push(model.start);

    record(
      "initialize",
      "Initialize DFS",
      `Start at ${model.start}. Mark it as visited and push it onto open (Stack).`,
    );

    // DFS Loop
    while (open.length > 0) {
      // Pop the last element (LIFO)
      current = open.pop();
      processed.push(current);

      record(
        "pop",
        `Pop ${current} from Stack`,
        `Remove ${current} from the top of open and process its neighbors.`,
      );

      const neighbors = model.adjacency[current] || [];

      for (const neighbor of neighbors) {
        const key = edgeKey(current, neighbor.label);

        record(
          "inspect",
          `Inspect ${neighbor.label}`,
          `Check the ${neighbor.direction.toLowerCase()} neighbor ${neighbor.label} of ${current}.`,
          {
            activeEdge: key,
            currentNeighbor: neighbor.label,
            direction: neighbor.direction,
          },
        );

        if (!visited.has(neighbor.label)) {
          visited.add(neighbor.label);
          open.push(neighbor.label);
          treeEdges.add(key);

          record(
            "push",
            `Push ${neighbor.label} onto Stack`,
            `Neighbor ${neighbor.label} is not visited. Mark it visited and push it onto open.`,
            {
              activeEdge: key,
              currentNeighbor: neighbor.label,
              direction: neighbor.direction,
            },
          );
        } else {
          record(
            "skip",
            `Skip ${neighbor.label}`,
            `Neighbor ${neighbor.label} is already in visited. Do not push it again.`,
            {
              activeEdge: key,
              currentNeighbor: neighbor.label,
              direction: neighbor.direction,
            },
          );
        }
      }
    }

    current = null;

    record(
      "complete",
      "DFS Completed",
      `All reachable nodes have been processed. The Stack is empty.`,
    );

    return events;
  }

  // ======================================
  // Render Graph Edges
  // ======================================

  function renderEdges(step) {
    const fragment = document.createDocumentFragment();

    for (const edge of currentModel.edges) {
      const [firstLabel, secondLabel] = edge.pair;

      const first = currentModel.nodes.find(
        (node) => node.label === firstLabel,
      );

      const second = currentModel.nodes.find(
        (node) => node.label === secondLabel,
      );

      const line = createSVGElement("line", {
        x1: first.x,
        y1: first.y,
        x2: second.x,
        y2: second.y,
        class: "dfs-edge",
      });

      if (step.treeEdges.includes(edge.key)) {
        line.classList.add("is-tree-edge");
      }

      if (step.activeEdge === edge.key) {
        line.classList.add("is-active");
      }

      fragment.appendChild(line);
    }

    elements["dfs-edges"].replaceChildren(fragment);
  }

  // ======================================
  // Render Graph Nodes
  // ======================================

  function renderNodes(step) {
    const fragment = document.createDocumentFragment();

    for (const node of currentModel.nodes) {
      const group = createSVGElement("g", {
        class: "dfs-node",
      });

      if (step.current === node.label) {
        group.classList.add("is-current");
      } else if (step.open.includes(node.label)) {
        group.classList.add("is-pending");
      } else if (step.processed.includes(node.label)) {
        group.classList.add("is-visited");
      }

      if (node.shapeCell) {
        const tile = createSVGElement("rect", {
          x: node.x - 32,
          y: node.y - 32,
          width: 64,
          height: 64,
          rx: 8,
        });

        group.appendChild(tile);
      } else {
        const circle = createSVGElement("circle", {
          cx: node.x,
          cy: node.y,
          r: 29,
        });

        group.appendChild(circle);
      }

      const label = createSVGElement("text", {
        x: node.x,
        y: node.y + 6,
      });

      label.textContent = node.label;

      group.appendChild(label);
      fragment.appendChild(group);
    }

    elements["dfs-nodes"].replaceChildren(fragment);
  }

  // ======================================
  // Render Chips
  // ======================================

  function renderChips(container, values, className, emptyText) {
    container.replaceChildren();

    if (values.length === 0) {
      const empty = document.createElement("span");

      empty.className = "dfs-empty-value";
      empty.textContent = emptyText;

      container.appendChild(empty);
      return;
    }

    values.forEach((value, index) => {
      const chip = document.createElement("span");

      chip.className = className;
      chip.textContent = value;

      if (className === "dfs-stack-chip" && index === values.length - 1) {
        chip.classList.add("stack-top");
      }

      container.appendChild(chip);
    });
  }

  // ======================================
  // Render Current Step
  // ======================================

  function renderStep() {
    const step = snapshots[currentIndex];

    renderEdges(step);
    renderNodes(step);

    renderChips(
      elements["dfs-domain"],
      step.cellSet,
      "dfs-domain-chip",
      "Empty",
    );

    renderChips(
      elements["dfs-stack"],
      step.open,
      "dfs-stack-chip",
      "Empty Stack",
    );

    renderChips(
      elements["dfs-visited"],
      step.visited,
      "dfs-visited-chip",
      "None",
    );

    renderChips(
      elements["dfs-processed"],
      step.processed,
      "dfs-processed-chip",
      "None",
    );

    elements["dfs-status"].textContent =
      currentIndex === snapshots.length - 1 ? "Completed" : "Traversing";

    elements["dfs-step-number"].textContent =
      `Step ${currentIndex + 1} / ${snapshots.length}`;

    elements["dfs-step-title"].textContent = step.title;
    elements["dfs-step-message"].textContent = step.message;

    elements["dfs-direction"].textContent =
      step.direction === "—"
        ? step.currentNeighbor
          ? `Neighbor ${step.currentNeighbor}`
          : "Not started"
        : step.currentNeighbor
          ? `${step.direction} → ${step.currentNeighbor}`
          : step.direction;

    elements["dfs-domain-label"].textContent = currentModel.domainLabel;

    elements["dfs-domain-count"].textContent = step.cellSet.length;

    elements["dfs-visited-count"].textContent = step.visited.length;

    elements["dfs-processed-count"].textContent = step.processed.length;

    elements["dfs-traversal-order"].textContent = step.processed.length
      ? step.processed.join(" → ")
      : "Not started";

    elements["dfs-progress"].style.width =
      `${(currentIndex / (snapshots.length - 1)) * 100}%`;

    elements["dfs-prev"].disabled = currentIndex === 0;
    elements["dfs-next"].disabled = currentIndex === snapshots.length - 1;

    elements["dfs-last"].disabled = currentIndex === snapshots.length - 1;
  }

  // ======================================
  // Navigation
  // ======================================

  function pause() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    elements["dfs-play"].textContent = "Play";
  }

  function goToStep(index) {
    pause();

    currentIndex = Math.max(0, Math.min(index, snapshots.length - 1));

    renderStep();
  }

  // ======================================
  // Playback
  // ======================================

  function play() {
    if (timer !== null) return;

    if (currentIndex === snapshots.length - 1) {
      currentIndex = 0;
      renderStep();
    }

    elements["dfs-play"].textContent = "Pause";

    timer = setInterval(() => {
      if (currentIndex >= snapshots.length - 1) {
        pause();
        return;
      }

      currentIndex++;
      renderStep();

      if (currentIndex === snapshots.length - 1) {
        pause();
      }
    }, 1100);
  }

  // ======================================
  // Load Mode
  // ======================================

  function loadMode(mode, shapeName = "square") {
    pause();

    currentMode = mode;

    if (mode === "graph") {
      currentModel = buildLargeGraphModel();

      elements["dfs-mode-graph"].classList.add("active");
      elements["dfs-mode-shapes"].classList.remove("active");

      elements["dfs-shape-picker"].hidden = true;
    } else {
      currentModel = buildShapeModel(shapeName);

      elements["dfs-mode-shapes"].classList.add("active");
      elements["dfs-mode-graph"].classList.remove("active");

      elements["dfs-shape-picker"].hidden = false;
    }

    elements["dfs-graph-title"].textContent = currentModel.title;

    elements["dfs-graph-description"].textContent = currentModel.description;

    snapshots = buildSnapshots(currentModel);
    currentIndex = 0;

    renderStep();
  }

  // ======================================
  // Event Listeners
  // ======================================

  elements["dfs-mode-shapes"].addEventListener("click", () => {
    loadMode("shapes", elements["dfs-shape-select"].value);
  });

  elements["dfs-mode-graph"].addEventListener("click", () => {
    loadMode("graph");
  });

  elements["dfs-shape-select"].addEventListener("change", () => {
    loadMode("shapes", elements["dfs-shape-select"].value);
  });

  elements["dfs-reset"].addEventListener("click", () => {
    goToStep(0);
  });

  elements["dfs-prev"].addEventListener("click", () => {
    goToStep(currentIndex - 1);
  });

  elements["dfs-next"].addEventListener("click", () => {
    goToStep(currentIndex + 1);
  });

  elements["dfs-last"].addEventListener("click", () => {
    goToStep(snapshots.length - 1);
  });

  elements["dfs-play"].addEventListener("click", () => {
    if (timer !== null) {
      pause();
    } else {
      play();
    }
  });

  window.addEventListener("beforeunload", pause);

  // Initial Visualization
  loadMode("shapes", "square");
}
