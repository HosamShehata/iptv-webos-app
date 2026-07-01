let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
  // تجميع كل العناصر القابلة للتفاعل في الواجهة النشطة حالياً لمنع علامتين الفوكس معاً
  focusableElements = Array.from(document.querySelectorAll('.sidebar .remote-focusable, .view-panel.active .remote-focusable, .sidebar .menu-item, .view-panel.active .media-card'));
}

function applyStrictFocus(element) {
  if (!element) return;
  document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
  element.classList.add('focused');
  element.focus();
}

// السيطرة المطلقة على ريموت التلفزيون وفصل الاتجاهات تماماً
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
  else if (e.key === "Enter" || e.key === "Ok") {
    if (focusableElements[currentFocusIndex]) {
      focusableElements[currentFocusIndex].click();
    }
    e.preventDefault();
  }
});

// تصفير ذكي للعلامات عند استخدام الماوس المحرك لريموت LG Magic السحري
document.addEventListener("mousemove", () => {
  // يتيح الانتقال السلس للمؤشر دون ترك علامات فوكس قديمة معلقة بالتناوب
});
