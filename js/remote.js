let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
  focusableElements = Array.from(document.querySelectorAll(
    '.sidebar .remote-focusable, ' +
    '.sidebar .menu-item, ' +
    '.view-panel.active .remote-focusable, ' +
    '.view-panel.active .app-input, ' +
    '.view-panel.active .btn-action-submit, ' +
    '.view-panel.active .media-card, ' +
    '.view-panel.active .episode-row-card'
  ));
}

function applyStrictFocus(element) {
  if (!element) return;
  document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
  element.classList.add('focused');
  element.focus();
}

document.addEventListener("keydown", (e) => {
  updateFocusableElements();
  if (focusableElements.length === 0) return;

  if (currentFocusIndex >= focusableElements.length) {
    currentFocusIndex = 0;
  }

  if (e.key === "ArrowDown" || e.key === "Down") {
    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "ArrowUp" || e.key === "Up") {
    currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left") {
    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "Enter" || e.key === "Ok") {
    const activeEl = focusableElements[currentFocusIndex];
    if (activeEl) {
      activeEl.click();
      if(activeEl.tagName === "INPUT") activeEl.focus();
    }
    e.preventDefault();
  }
});

document.addEventListener("mouseover", (e) => {
  const target = e.target.closest('.remote-focusable, .menu-item, .app-input, .btn-action-submit, .media-card, .episode-row-card');
  if (target) {
    updateFocusableElements();
    const idx = focusableElements.indexOf(target);
    if (idx !== -1) {
      currentFocusIndex = idx;
      applyStrictFocus(target);
    }
  }
});

window.addEventListener("click", () => { setTimeout(updateFocusableElements, 100); });
setTimeout(() => { updateFocusableElements(); if (focusableElements.length > 0) applyStrictFocus(focusableElements[0]); }, 800);
