/**
 * INKLET STUDIOS — LOGIN JAVASCRIPT (login.js)
 * Philosophy: "Ink with Intent"
 * Independent, Secure Portal Authentication Engine
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

    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', handleLoginSubmit);
    }
  });

  async function handleLoginSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('login-alert');
    const submitBtn = document.getElementById('login-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const email = form.email.value.trim();
    const password = form.password.value;

    let hasError = false;

    if (!email) {
      setError('email', 'Email address is required.');
      hasError = true;
    }

    if (!password) {
      setError('password', 'Password is required.');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const response = await fetch('api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'Invalid email or password credentials.', 'error');
        return;
      }

      // Success: redirect to administrative dashboard
      window.location.href = 'admindashboard.html';
    } catch (err) {
      showAlert('Network error: Unable to communicate with authentication service.', 'error');
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
    const alertBox = document.getElementById('login-alert');
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.className = `login-alert ${type}`;
      alertBox.style.display = 'block';
    }
  }
})();
