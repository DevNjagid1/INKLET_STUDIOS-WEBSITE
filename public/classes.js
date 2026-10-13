/**
 * INKLET STUDIOS — CLASSES JAVASCRIPT (classes.js)
 * Philosophy: "Ink with Intent"
 * Independent, Academy Course Enrollment & Dialog Controller
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      toggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-menu');

    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
        mobileBtn.setAttribute('aria-expanded', !isExpanded);
        mobileDrawer.classList.toggle('open');
        mobileDrawer.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
      });

      const drawerLinks = mobileDrawer.querySelectorAll('a');
      drawerLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('open');
          mobileBtn.setAttribute('aria-expanded', 'false');
          mobileDrawer.setAttribute('aria-hidden', 'true');
        });
      });
    }

    // Enrollment Modal Triggers
    const dialog = document.getElementById('enrollment-dialog');
    const closeBtn = document.getElementById('enroll-close-btn');
    const classIdInput = document.getElementById('enroll_class_id');
    const titleDisplay = document.getElementById('enroll-course-display-title');
    const enrollButtons = document.querySelectorAll('.enroll-btn');

    enrollButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const courseId = btn.getAttribute('data-course-id');
        const courseTitle = btn.getAttribute('data-course-title');
        if (classIdInput) classIdInput.value = courseId;
        if (titleDisplay) titleDisplay.textContent = `Enroll: ${courseTitle}`;
        if (dialog) dialog.showModal();
      });
    });

    if (closeBtn && dialog) {
      closeBtn.addEventListener('click', () => dialog.close());
    }

    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    }

    // Enrollment Form Submission
    const form = document.getElementById('enrollment-form');
    if (form) {
      form.addEventListener('submit', handleEnrollmentSubmit);
    }
  });

  async function handleEnrollmentSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('enroll-alert');
    const submitBtn = document.getElementById('enroll-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const classId = form.class_id.value;
    const studentName = form.student_name.value.trim();
    const studentEmail = form.student_email.value.trim();
    const studentPhone = form.student_phone.value.trim();
    const experienceLevel = form.experience_level.value;
    const learningGoals = form.learning_goals.value.trim();

    let hasError = false;

    if (!studentName) {
      setError('student_name', 'Please provide your full name.');
      hasError = true;
    }

    if (!studentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      setError('student_email', 'Please provide a valid email address.');
      hasError = true;
    }

    if (!studentPhone) {
      setError('student_phone', 'Please provide your telephone or WhatsApp number.');
      hasError = true;
    }

    if (hasError) {
      showAlert('Please address the highlighted form fields.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const response = await fetch('api/classes.php?action=enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: parseInt(classId, 10),
          student_name: studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          experience_level: experienceLevel,
          learning_goals: learningGoals
        })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'Enrollment registration could not be submitted.', 'error');
        return;
      }

      showAlert('Your enrollment has been successfully registered! Our studio team will contact you via WhatsApp with cohort schedule details.', 'success');
      form.reset();
      setTimeout(() => {
        const dialog = document.getElementById('enrollment-dialog');
        if (dialog) dialog.close();
      }, 3000);
    } catch (err) {
      showAlert('Network error: Unable to transmit enrollment. Please reach us via WhatsApp or telephone directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function setError(fieldId, msg) {
    const input = document.getElementById(fieldId);
    const err = document.getElementById(`err-${fieldId}`);
    if (input) input.classList.add('is-invalid');
    if (err) {
      err.textContent = msg;
      err.classList.add('visible');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    document.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('enroll-alert');
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.className = `enroll-alert ${type}`;
      alertBox.style.display = 'block';
    }
  }
})();
