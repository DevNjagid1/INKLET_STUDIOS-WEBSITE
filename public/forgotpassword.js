/**
 * INKLET STUDIOS — FORGOT PASSWORD JAVASCRIPT (forgotpassword.js)
 * Philosophy: "Ink with Intent"
 * Independent, Client-Side Recovery Engine
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

    const form = document.getElementById('forgot-form');
    if (form) {
      form.addEventListener('submit', handleForgotSubmit);
    }
  });

  async function handleForgotSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('forgot-alert');
    const submitBtn = document.getElementById('forgot-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const emailInput = document.getElementById('forgot_email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      setError('forgot_email', 'Please provide your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('forgot_email', 'Please enter a valid email format (e.g. name@domain.com).');
      return;
    }

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const response = await fetch('api/auth.php?action=forgot_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'Unable to process recovery request. Please try again.', 'error');
        return;
      }

      // Success message
      showAlert(
        json.message || 'If an account exists for that address, recovery instructions have been dispatched. Check your inbox and spam folder.',
        'success'
      );
      form.reset();
    } catch (err) {
      showAlert('Network error: Unable to contact authentication server. Please check your connection.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errSpan = document.getElementById(`err-${fieldId}`);
    if (input) input.classList.add('is-invalid');
    if (errSpan) errSpan.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll('.form-input').forEach(input => input.classList.remove('is-invalid'));
    document.querySelectorAll('.field-error').forEach(span => span.textContent = '');
    const alertBox = document.getElementById('forgot-alert');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.className = 'forgot-alert';
      alertBox.textContent = '';
    }
  }

  function showAlert(message, type) {
    const alertBox = document.getElementById('forgot-alert');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `forgot-alert alert-${type}`;
    alertBox.style.display = 'block';
  }
})();
