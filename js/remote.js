// ============================================
// VISION TV REMOTE ENGINE
// ============================================

let focusableElements = [];
let currentFocusIndex = 0;

// ============================================

function updateFocusableElements() {

    focusableElements = Array.from(

        document.querySelectorAll(

            ".view-panel.active .remote-focusable," +

            ".sidebar .menu-item"

        )

    );

    if (focusableElements.length === 0)
        return;

    if (currentFocusIndex >= focusableElements.length)
        currentFocusIndex = 0;

    applyFocus();

}

// ============================================

function applyFocus() {

    document
        .querySelectorAll(".focused")
        .forEach(el => {

            el.classList.remove("focused");

        });

    const item =
        focusableElements[currentFocusIndex];

    if (!item)
        return;

    item.classList.add("focused");

    item.scrollIntoView({

        block: "nearest",

        inline: "nearest",

        behavior: "smooth"

    });

}

// ============================================

function focusNext() {

    if (!focusableElements.length)
        return;

    currentFocusIndex++;

    if (currentFocusIndex >= focusableElements.length)
        currentFocusIndex = 0;

    applyFocus();

}

// ============================================

function focusPrevious() {

    if (!focusableElements.length)
        return;

    currentFocusIndex--;

    if (currentFocusIndex < 0)
        currentFocusIndex =
            focusableElements.length - 1;

    applyFocus();

}
// ============================================
// NAVIGATION
// ============================================

function moveRight() {

    focusNext();

}

function moveLeft() {

    focusPrevious();

}

function moveDown() {

    focusNext();

}

function moveUp() {

    focusPrevious();

}

// ============================================
// SELECT
// ============================================

function pressEnter() {

    const item =
        focusableElements[currentFocusIndex];

    if (!item)
        return;

    item.click();

}

// ============================================
// BACK
// ============================================

function pressBack() {

    if (typeof currentViewId === "undefined")
        return;

    if (currentViewId === "view-details") {

        openView("home");

        return;

    }

    if (currentViewId !== "view-home") {

        openView("home");

        return;

    }

}

// ============================================
// KEY EVENTS
// ============================================

document.addEventListener("keydown", e => {

    switch (e.key) {

        case "ArrowRight":

            moveRight();
            e.preventDefault();
            break;

        case "ArrowLeft":

            moveLeft();
            e.preventDefault();
            break;

        case "ArrowDown":

            moveDown();
            e.preventDefault();
            break;

        case "ArrowUp":

            moveUp();
            e.preventDefault();
            break;

        case "Enter":

        case "OK":

        case "Ok":

            pressEnter();
            e.preventDefault();
            break;

        case "Backspace":

        case "Escape":

            pressBack();
            e.preventDefault();
            break;

    }

});
// ============================================
// MAGIC REMOTE / POINTER
// ============================================

document.addEventListener("mousemove", () => {

    document
        .querySelectorAll(".focused")
        .forEach(el => {

            el.classList.remove("focused");

        });

});

// ============================================

document.addEventListener("mouseover", e => {

    const target =
        e.target.closest(".remote-focusable,.menu-item");

    if (!target)
        return;

    updateFocusableElements();

    const index =
        focusableElements.indexOf(target);

    if (index === -1)
        return;

    currentFocusIndex = index;

    applyFocus();

});

// ============================================
// VIEW CHANGED
// ============================================

const observer = new MutationObserver(() => {

    updateFocusableElements();

});

document.querySelectorAll(".view-panel")
    .forEach(view => {

        observer.observe(view, {

            attributes: true,

            attributeFilter: ["class"]

        });

    });

// ============================================
// START
// ============================================

window.addEventListener("load", () => {

    updateFocusableElements();

});
