let focusableElements = [];
let currentFocusIndex = 0;

function updateFocusableElements() {
  // تجميع كل العناصر القابلة للفوكس في السايد بار أو الواجهة النشطة حالياً
  focusableElements = Array.from(document.querySelectorAll(
    '.sidebar .remote-focusable, ' +
    '.sidebar .menu-item, ' +
    '.view-panel.active .remote-focusable, ' +
    '.view-panel.active .media-card, ' +
    '.view-panel.active .episode-row-card, ' +
    '.view-panel.active .app-input, ' +
    '.view-panel.active .btn-action-submit, ' +
    '.view-panel.active .select-dropdown'
  ));
}

function applyStrictFocus(element) {
  if (!element) return;
  // مسح الفوكس من أي عنصر آخر في الشاشة نهائياً لمنع التداخل
  document.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
  
  element.classList.add('focused');
  element.focus();
}

// السيطرة المطلقة على ريموت التلفزيون وفك التجمد فوراً
document.addEventListener("keydown", (e) => {
  updateFocusableElements();
  if (focusableElements.length === 0) return;

  // تأمين المؤشر الحالي لو خرج بره النطاق بسبب تحديث الشاشات
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
  else if (e.key === "ArrowRight" || e.key === "Right") {
    // دعم التنقل العرضي بين كروت الميديا والسايد بار
    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "ArrowLeft" || e.key === "Left") {
    currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
    applyStrictFocus(focusableElements[currentFocusIndex]);
    e.preventDefault();
  }
  else if (e.key === "Enter" || e.key === "Ok") {
    if (focusableElements[currentFocusIndex]) {
      // إجبار العنصر الفعال على تنفيذ دالة الـ Click
      focusableElements[currentFocusIndex].click();
    }
    e.preventDefault();
  }
});

// إتاحة التحكم الحر الكامل لريموت الماجيك الحركي (Pointer) بدون تعليق
document.addEventListener("mouseover", (e) => {
  const target = e.target.closest('.remote-focusable, .menu-item, .media-card, .episode-row-card, .app-input, .btn-action-submit');
  if (target) {
    updateFocusableElements();
    currentFocusIndex = focusableElements.indexOf(target);
    if (currentFocusIndex !== -1) {
      applyStrictFocus(target);
    }
  }
});

// تهيئة أولية عند الإقلاع
setTimeout(() => {
  updateFocusableElements();
  if (focusableElements.length > 0) {
    applyStrictFocus(focusableElements[0]);
  }
}, 1000);
