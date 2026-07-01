// =====================================================
// VISION TV - LG SMART TV REMOTE FOCUS LAYER
// =====================================================

let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
    // تجميع العناصر التفاعلية في الصفحة المفتوحة حالياً فقط بالإضافة إلى القائمة الجانبية
    focusableElements = Array.from(
        document.querySelectorAll(".sidebar .menu-item, .sidebar .language-btn, .view-panel.active .remote-focusable, .search-container input")
    );

    if (focusableElements.length === 0) return;
    if (currentFocusIndex >= focusableElements.length) currentFocusIndex = 0;

    applyFocus();
}

function applyFocus() {
    document.querySelectorAll(".focused").forEach(el => el.classList.remove("focused"));
    const item = focusableElements[currentFocusIndex];
    if (!item) return;

    item.classList.add("focused");
    item.focus(); // تفعيل الفوكس الفعلي للمتصفح لدعم الكيبورد والريموت
    
    item.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth"
    });
}

function focusNext() {
    if (!focusableElements.length) return;
    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    applyFocus();
}

function focusPrevious() {
    if (!focusableElements.length) return;
    currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
    applyFocus();
}

document.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowRight":
            focusNext();
            e.preventDefault();
            break;
        case "ArrowLeft":
            focusPrevious();
            e.preventDefault();
            break;
        case "ArrowDown":
            focusNext();
            e.preventDefault();
            break;
        case "ArrowUp":
            focusPrevious();
            e.preventDefault();
            break;
        case "Enter":
        case "OK":
        case "Ok":
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

// تفعيل العمل بالماجيك ريموت الماوس لشاشات LG
document.addEventListener("mouseover", e => {
    const target = e.target.closest(".remote-focusable, .menu-item");
    if (!target) return;
    
    const index = focusableElements.indexOf(target);
    if (index !== -1) {
        currentFocusIndex = index;
        applyFocus();
    }
});

// تحديث اللائحة التفاعلية تلقائياً عند تحميل الصفحة بالكامل
window.addEventListener("load", () => {
    setTimeout(updateFocusableElements, 500);
});
