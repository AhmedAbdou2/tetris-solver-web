const MAX_VISIBLE_STEPS = 100;

const eventLabels = {
  "grid-start": "Grid Started",
  "cell-selected": "Cell Selected",
  attempt: "Placement Attempt",
  placement: "Placement",
  backtrack: "Backtracking",
  "empty-cell": "Empty Cell",
  "backtrack-empty": "Undo Empty Cell",
  "grid-failed": "Grid Failed",
  solution: "Solution Found",
};

function getEventClass(event) {
  if (event.type === "placement") return "placement";
  if (event.type === "backtrack") return "backtrack";

  if (event.type === "attempt") {
    return event.accepted ? "attempt-valid" : "attempt-rejected";
  }

  if (event.type === "solution") return "solution";
  if (event.type === "cell-selected") return "selection";

  return "neutral";
}

function getEventLabel(event) {
  if (event.type === "attempt") {
    return event.accepted ? "Valid Attempt" : "Rejected Attempt";
  }

  return eventLabels[event.type] || event.type;
}

export function createStepRenderer(container, onSelect) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step-index]");

    if (!button || !container.contains(button)) return;

    const index = Number(button.dataset.stepIndex);

    if (Number.isInteger(index)) {
      onSelect(index);
    }
  });

  function render(snapshots, currentIndex) {
    const fragment = document.createDocumentFragment();

    const total = snapshots.length;

    const start = Math.max(
      0,
      Math.min(
        currentIndex - Math.floor(MAX_VISIBLE_STEPS / 2),
        total - MAX_VISIBLE_STEPS,
      ),
    );

    const end = Math.min(total, start + MAX_VISIBLE_STEPS);

    if (start > 0) {
      const note = document.createElement("div");
      note.className = "steps-window-note";
      note.textContent = `${start} earlier events are hidden.`;
      fragment.appendChild(note);
    }

    for (let index = start; index < end; index++) {
      const step = snapshots[index];

      const button = document.createElement("button");
      button.type = "button";
      button.className = "step-item";
      button.dataset.stepIndex = index;

      if (index === currentIndex) {
        button.classList.add("active");
        button.setAttribute("aria-current", "step");
      }

      const number = document.createElement("span");
      number.className = "step-number";
      number.textContent = String(index + 1).padStart(3, "0");

      const content = document.createElement("span");
      content.className = "step-content";

      const type = document.createElement("span");
      type.className = `step-type ${getEventClass(step)}`;
      type.textContent = getEventLabel(step);

      const message = document.createElement("span");
      message.className = "step-message";
      message.textContent = step.message || getEventLabel(step);

      content.append(type, message);
      button.append(number, content);

      fragment.appendChild(button);
    }

    if (end < total) {
      const note = document.createElement("div");
      note.className = "steps-window-note";
      note.textContent = `${total - end} later events are hidden.`;
      fragment.appendChild(note);
    }

    container.replaceChildren(fragment);

    const active = container.querySelector(".step-item.active");

    if (active) {
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;

      if (top < container.scrollTop) {
        container.scrollTop = top;
      } else if (bottom > container.scrollTop + container.clientHeight) {
        container.scrollTop = bottom - container.clientHeight;
      }
    }
  }

  function clear() {
    container.innerHTML = `
            <div class="empty-state">
                <p>No steps available.</p>
                <span>Run the solver to see the execution.</span>
            </div>
        `;
  }

  return { render, clear };
}
