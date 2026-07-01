// =====================================================
// VISION TV - TV REMOTE CONTROLLER (التحكم في الريموت)
// =====================================================

let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
    // جلب العناصر القابلة للفوكس من الصفحة النشطة فقط + القائمة الجانبية
    focusableElements = Array.from(
        document.querySelectorAll(".sidebar .menu-item, .sidebar .language-btn, .view-panel.active .remote-focusable, .view-panel.active input")
    );

    if (focusableElements.length === 0) return;
    if (currentFocusIndex >= focusableElements.length) currentFocusIndex = 0;

    applyFocusStyle();
}

function applyFocusStyle() {
    document.querySelectorAll(".focused").forEach(el => el.classList.remove("focused"));
    const currentActiveItem = focusableElements[currentFocusIndex];
    
    if (currentActiveItem) {
        currentActiveItem.classList.add("focused");
        currentActiveItem.focus();
        
        currentActiveItem.scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: "smooth"
        });
    }
}

document.addEventListener("keydown", e => {
    if (focusableElements.length === 0) return;

    switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
            currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
            applyFocusStyle();
            e.preventDefault();
            break;
            
        case "ArrowLeft":
        case "ArrowUp":
            currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
            applyFocusStyle();
            e.preventDefault();
            break;
            
        case "Enter":
        case "OK":
            if (focusableElements[currentFocusIndex]) {
                focusableElements[currentFocusIndex].click();
                e.preventDefault();
            }
            break;

        case "Backspace":
        case "Escape":
            if (currentView !== "home") {
                openView("home");
                e.preventDefault();
            }
            break;
    }
});

// دعم مؤشر الريموت السحري لشاشات LG (Magic Remote)
document.addEventListener("mouseover", e => {
    const target = e.target.closest(".remote-focusable, .menu-item, .iptv-input");
    if (!target) return;

    const index = focusableElements.indexOf(target);
    if (index !== -1) {
        currentFocusIndex = index;
        applyFocusStyle();
    }
});
