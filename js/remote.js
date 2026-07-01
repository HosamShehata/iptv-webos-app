let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
  // تجميع كافة عناصر الفوكس النشطة في الواجهة الحالية والمسارات لمنع علامتين الفوكس معاً
  focusableElements = Array.from(document.querySelectorAll('.sidebar .remote-focusable, .view-panel.active .remote-focusable, .sidebar .menu-item, .view-panel.active .media-card, .view-panel.active .episode-row-card'));
}

function applyStrictFocus(element) {
  if (!element) return;
  document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
  element.classList.add('focused');
  element.focus();
}

// السيطرة الصارمة على الاتجاهات الأربعة للريموت ومؤشر الماوس السحري لمنع التداخل
document.addEventListener("keydown", (e) => {
  updateFocusableElements();
  if (focusableElements.length === 0) return;

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
    // التنقل الأفقي المرن بين كروت شبكة الميديا نسبة وتناسب
    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "Enter" || e.key === "Ok") {
    if (focusableElements[currentFocusIndex]) {
      focusableElements[currentFocusIndex].click();
    }
    e.preventDefault();
  }
});
