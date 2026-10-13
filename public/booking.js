/**
 * INKLET STUDIOS — BOOKING & COMMISSION JAVASCRIPT (booking.js)
 * Philosophy: "Ink with Intent"
 * Independent, Adaptive Form Controller, Validation & Booking Reference Handler
 */

(function () {
  'use strict';

  // THEME ENGINE
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
    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // System theme preference listener
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });

    // Mobile Navigation Drawer Toggle
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

    // Service dropdown adaptive behavior
    const serviceSelect = document.getElementById('service_id');
    const panelWeb = document.getElementById('adaptive-web');
    const panelBranding = document.getElementById('adaptive-branding');
    const panelPrint = document.getElementById('adaptive-print');

    function updateAdaptivePanels() {
      const val = serviceSelect.value;
      if (panelWeb) panelWeb.style.display = val === '4' ? 'block' : 'none';
      if (panelBranding) panelBranding.style.display = val === '2' ? 'block' : 'none';
      if (panelPrint) panelPrint.style.display = val === '1' ? 'block' : 'none';
    }

    if (serviceSelect) {
      serviceSelect.addEventListener('change', updateAdaptivePanels);

      // Pre-select service from URL query (e.g. booking.html?service=2)
      const urlParams = new URLSearchParams(window.location.search);
      const preSelected = urlParams.get('service');
      if (preSelected) {
        serviceSelect.value = preSelected;
        updateAdaptivePanels();
      }
    }

    // Confirmation dialog close button
    const confDialog = document.getElementById('confirmation-dialog');
    const confCloseBtn = document.getElementById('conf-close-btn');
    if (confCloseBtn && confDialog) {
      confCloseBtn.addEventListener('click', () => {
        confDialog.close();
      });
    }

    // Form Submission Handler
    const form = document.getElementById('project-booking-form');
    if (form) {
      form.addEventListener('submit', handleBookingSubmit);
    }
  });

  async function handleBookingSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const alertBox = document.getElementById('booking-alert');
    const submitBtn = document.getElementById('submit-brief-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    // Collect values
    const clientName = form.client_name.value.trim();
    const clientEmail = form.client_email.value.trim();
    const clientPhone = form.client_phone.value.trim();
    const preferredChannel = form.preferred_channel.value;
    const serviceId = form.service_id.value;
    const projectTitle = form.project_title.value.trim();
    const projectDesc = form.project_description.value.trim();
    const budgetRange = form.budget_range.value;
    const deadlineDate = form.deadline_date.value;
    const privacyConsent = form.privacy_consent.checked;
    const honeypot = form.website_hp.value;

    // Client-side Validation
    let hasError = false;

    if (!clientName) {
      setError('client_name', 'Please provide your name or organization.');
      hasError = true;
    }

    if (!clientEmail || !validateEmail(clientEmail)) {
      setError('client_email', 'Please provide a valid email address.');
      hasError = true;
    }

    if (!serviceId) {
      setError('service_id', 'Please select a service discipline.');
      hasError = true;
    }

    if (!projectTitle) {
      setError('project_title', 'Please provide a title or campaign name.');
      hasError = true;
    }

    if (!projectDesc || projectDesc.length < 20) {
      setError('project_description', 'Please provide at least 20 characters describing your scope.');
      hasError = true;
    }

    if (!privacyConsent) {
      setError('privacy_consent', 'You must agree to the privacy policy to submit.');
      hasError = true;
    }

    if (hasError) {
      showAlert('Please address the highlighted errors in the brief form.', 'error');
      return;
    }

    // Compile service-specific adaptive payload
    const serviceSpecificData = {};
    if (serviceId === '4') { // Web
      serviceSpecificData.existing_domain = form.web_domain.value.trim();
      const features = [];
      form.querySelectorAll('input[name="web_features"]:checked').forEach((cb) => {
        features.push(cb.value);
      });
      serviceSpecificData.required_features = features;
    } else if (serviceId === '2') { // Branding
      serviceSpecificData.brand_stage = form.brand_stage.value;
    } else if (serviceId === '1') { // Print
      serviceSpecificData.dimensions_format = form.print_format.value.trim();
    }

    const payload = {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      preferred_channel: preferredChannel,
      service_id: parseInt(serviceId, 10),
      project_title: projectTitle,
      project_description: projectDesc,
      budget_range: budgetRange,
      deadline_date: deadlineDate,
      service_specific_data: serviceSpecificData,
      website_hp: honeypot
    };

    // UI Loading state
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    if (alertBox) alertBox.style.display = 'none';

    try {
      const response = await fetch('api/bookings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const errorMsg = json.message || 'An error occurred while logging your enquiry.';
        if (json.errors) {
          for (const [k, v] of Object.entries(json.errors)) {
            setError(k, v);
          }
        }
        showAlert(errorMsg, 'error');
        return;
      }

      // Success Confirmation
      const resultData = json.data;
      showConfirmationModal(resultData);
      form.reset();
      const panelWeb = document.getElementById('adaptive-web');
      const panelBranding = document.getElementById('adaptive-branding');
      const panelPrint = document.getElementById('adaptive-print');
      if (panelWeb) panelWeb.style.display = 'none';
      if (panelBranding) panelBranding.style.display = 'none';
      if (panelPrint) panelPrint.style.display = 'none';
    } catch (err) {
      showAlert('Network error: Unable to communicate with the server. Please check your connection or contact our studio directly on WhatsApp.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function showConfirmationModal(data) {
    const dialog = document.getElementById('confirmation-dialog');
    const nameEl = document.getElementById('conf-client-name');
    const refEl = document.getElementById('conf-booking-ref');
    const noteEl = document.getElementById('conf-email-note');
    const waBtn = document.getElementById('conf-whatsapp-btn');

    if (nameEl) nameEl.textContent = data.client_name || 'Client';
    if (refEl) refEl.textContent = data.booking_ref || 'INK-202610-0000';
    if (noteEl && data.notice) noteEl.textContent = data.notice;

    if (waBtn && data.whatsapp_direct_url) {
      waBtn.href = data.whatsapp_direct_url;
    }

    if (dialog) {
      dialog.showModal();
    }
  }

  function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errEl = document.getElementById(`err-${fieldId}`);
    if (input) input.classList.add('is-invalid');
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
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
    const alertBox = document.getElementById('booking-alert');
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.className = `booking-alert ${type}`;
      alertBox.style.display = 'block';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();
