/**
 * INKLET STUDIOS — REGISTRATION JAVASCRIPT (register.js)
 * Philosophy: "Ink with Intent"
 * Independent, Client Account Registration Engine
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

    const form = document.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', handleRegisterSubmit);
    }
  });

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('reg-alert');
    const submitBtn = document.getElementById('reg-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;

    let hasError = false;

    if (!name) {
      setError('reg_name', 'Full name is required.');
      hasError = true;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('reg_email', 'A valid email address is required.');
      hasError = true;
    }

    if (!password || password.length < 8) {
      setError('reg_password', 'Password must be at least 8 characters.');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      // In development server simulation / production endpoint
      showAlert('Client account registration is currently by studio invitation. Please use the booking form to submit project requirements directly.', 'error');
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
    const alertBox = document.getElementById('reg-alert');
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.className = `reg-alert ${type}`;
      alertBox.style.display = 'block';
    }
  }
})();
