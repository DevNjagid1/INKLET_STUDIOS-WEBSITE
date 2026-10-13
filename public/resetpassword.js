/**
 * INKLET STUDIOS — RESET PASSWORD JAVASCRIPT (resetpassword.js)
 * Philosophy: "Ink with Intent"
 * Independent, Client-Side Credential Reset Engine
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

    // Auto-populate token & email from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');

    if (tokenParam) {
      const tokenInput = document.getElementById('reset_token');
      if (tokenInput) tokenInput.value = tokenParam;
    }
    if (emailParam) {
      const emailInput = document.getElementById('reset_email');
      if (emailInput) emailInput.value = emailParam;
    }

    // Password visibility toggle
    const pwdToggleBtn = document.getElementById('toggle-pwd-btn');
    const pwdInput = document.getElementById('reset_password');
    if (pwdToggleBtn && pwdInput) {
      pwdToggleBtn.addEventListener('click', () => {
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        pwdToggleBtn.textContent = isPassword ? 'Hide' : 'Show';
      });
    }

    const form = document.getElementById('reset-form');
    if (form) {
      form.addEventListener('submit', handleResetSubmit);
    }
  });

  async function handleResetSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('reset-alert');
    const submitBtn = document.getElementById('reset-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const email = document.getElementById('reset_email').value.trim();
    const token = document.getElementById('reset_token').value.trim();
    const password = document.getElementById('reset_password').value;
    const confirmPassword = document.getElementById('reset_password_confirm').value;

    let hasError = false;

    if (!email) {
      setError('reset_email', 'Email address is required.');
      hasError = true;
    }

    if (!token) {
      setError('reset_token', 'Security recovery token is required.');
      hasError = true;
    }

    if (!password) {
      setError('reset_password', 'New password is required.');
      hasError = true;
    } else if (password.length < 8) {
      setError('reset_password', 'Password must be at least 8 characters long.');
      hasError = true;
    }

    if (password !== confirmPassword) {
      setError('reset_password_confirm', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const response = await fetch('api/auth.php?action=reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          token: token,
          password: password
        })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'Unable to reset password. Token may be invalid or expired.', 'error');
        return;
      }

      showAlert('Password updated successfully! Redirecting you to sign in...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (err) {
      showAlert('Network error: Unable to contact authentication server.', 'error');
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
    const alertBox = document.getElementById('reset-alert');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.className = 'reset-alert';
      alertBox.textContent = '';
    }
  }

  function showAlert(message, type) {
    const alertBox = document.getElementById('reset-alert');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `reset-alert alert-${type}`;
    alertBox.style.display = 'block';
  }
})();
