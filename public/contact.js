/**
 * INKLET STUDIOS — CONTACT JAVASCRIPT (contact.js)
 * Philosophy: "Ink with Intent"
 * Independent, Direct Inquiry Form Controller & Validation Engine
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

    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', handleContactSubmit);
    }
  });

  async function handleContactSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('contact-alert');
    const submitBtn = document.getElementById('contact-submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();
    const honeypot = form.contact_company_hp.value;

    let hasError = false;

    if (!name) {
      setError('name', 'Please provide your full name.');
      hasError = true;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Please provide a valid email address.');
      hasError = true;
    }

    if (!subject) {
      setError('subject', 'Please enter a subject.');
      hasError = true;
    }

    if (!message || message.length < 10) {
      setError('message', 'Please enter a message with at least 10 characters.');
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
      const response = await fetch('api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          subject: subject,
          message: message,
          contact_company_hp: honeypot
        })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'An error occurred while sending your message.', 'error');
        return;
      }

      showAlert('Your message has been received by our studio team in Chuka. We will respond promptly.', 'success');
      form.reset();
    } catch (err) {
      showAlert('Network error: Unable to transmit message. Please reach us via WhatsApp or email directly.', 'error');
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
    const alertBox = document.getElementById('contact-alert');
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.className = `contact-alert ${type}`;
      alertBox.style.display = 'block';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
})();
