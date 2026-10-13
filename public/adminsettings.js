/**
 * INKLET STUDIOS — ADMIN SETTINGS CONTROLLER (adminsettings.js)
 * Philosophy: "Ink with Intent"
 * Independent Business Configuration Engine
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';

  // --- THEME ENGINE ---
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
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

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // 2. Sidebar mobile toggle
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('admin-sidebar');
    if (toggleBtn && sidebar) toggleBtn.addEventListener('click', () => sidebar.classList.add('sidebar-open'));
    if (closeBtn && sidebar) closeBtn.addEventListener('click', () => sidebar.classList.remove('sidebar-open'));

    // 3. Logout handler
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // 4. Form submit handler
    const form = document.getElementById('settings-form');
    if (form) form.addEventListener('submit', handleSettingsSubmit);

    // 5. Verify Auth & Load Settings
    await verifyAuthAndLoadSettings();
  });

  async function verifyAuthAndLoadSettings() {
    try {
      const authRes = await fetch('api/auth.php?action=me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (!authData.success || !authData.data || !authData.data.authenticated) {
          window.location.href = 'login.html';
          return;
        }
      }
    } catch (e) {
      console.warn('Auth notice:', e);
    }

    loadSettings();
  }

  async function handleLogout() {
    try {
      await fetch('api/auth.php?action=logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = 'login.html';
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('api/settings.php');
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) return;

      const d = json.data;
      setVal('business_name', d.business_name);
      setVal('tagline', d.tagline);
      setVal('official_email', d.official_email);
      setVal('admin_email', d.admin_email);
      setVal('phone_number', d.phone_number);
      setVal('whatsapp_number', d.whatsapp_number);
      setVal('location_town', d.location_town);
      setVal('location_region', d.location_region);
      setVal('social_instagram', d.social_instagram);
      setVal('social_behance', d.social_behance);
      setVal('social_linkedin', d.social_linkedin);
      setVal('social_x', d.social_x);
      setVal('theme_default', d.theme_default || 'dark');
    } catch (err) {
      console.warn('Could not load settings:', err);
    }
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const saveBtn = document.getElementById('btn-save-settings');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnSpinner = saveBtn.querySelector('.btn-spinner');

    saveBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';

    const payload = {
      business_name: form.business_name.value.trim(),
      tagline: form.tagline.value.trim(),
      official_email: form.official_email.value.trim(),
      admin_email: form.admin_email.value.trim(),
      phone_number: form.phone_number.value.trim(),
      whatsapp_number: form.whatsapp_number.value.trim(),
      location_town: form.location_town.value.trim(),
      location_region: form.location_region.value.trim(),
      social_instagram: form.social_instagram.value.trim(),
      social_behance: form.social_behance.value.trim(),
      social_linkedin: form.social_linkedin.value.trim(),
      social_x: form.social_x.value.trim(),
      theme_default: form.theme_default.value
    };

    try {
      const res = await fetch('api/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showAlert('Studio settings updated successfully. Business records saved.', 'success');
      } else {
        showAlert(json.message || 'Unable to update settings.', 'error');
      }
    } catch (err) {
      showAlert('Network error saving settings.', 'error');
    } finally {
      saveBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('settings-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
  }
})();
