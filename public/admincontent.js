/**
 * INKLET STUDIOS — ADMIN CONTENT CONTROLLER (admincontent.js)
 * Philosophy: "Ink with Intent"
 * Independent Website Copy & Messaging Engine
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

    // 4. Form submit
    const form = document.getElementById('content-form');
    if (form) form.addEventListener('submit', handleContentSubmit);

    // 5. Verify Auth & Load Content
    await verifyAuthAndLoadContent();
  });

  async function verifyAuthAndLoadContent() {
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

    loadCurrentContent();
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

  async function loadCurrentContent() {
    try {
      const res = await fetch('api/settings.php');
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) return;

      const d = json.data;
      if (d.hero_eyebrow) setVal('hero_eyebrow', d.hero_eyebrow);
      if (d.hero_heading) setVal('hero_heading', d.hero_heading);
      if (d.hero_subheading) setVal('hero_subheading', d.hero_subheading);
      if (d.hero_cta_primary) setVal('hero_cta_primary', d.hero_cta_primary);
      if (d.hero_cta_secondary) setVal('hero_cta_secondary', d.hero_cta_secondary);
      if (d.manifesto_title) setVal('manifesto_title', d.manifesto_title);
      if (d.manifesto_body) setVal('manifesto_body', d.manifesto_body);
      if (d.location_town) setVal('stat_town', d.location_town);
      if (d.location_region) setVal('stat_region', d.location_region);
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  }

  async function handleContentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const saveBtn = document.getElementById('btn-save-content');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnSpinner = saveBtn.querySelector('.btn-spinner');

    saveBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';

    const payload = {
      hero_eyebrow: form.hero_eyebrow.value.trim(),
      hero_heading: form.hero_heading.value.trim(),
      hero_subheading: form.hero_subheading.value.trim(),
      hero_cta_primary: form.hero_cta_primary.value.trim(),
      hero_cta_secondary: form.hero_cta_secondary.value.trim(),
      manifesto_title: form.manifesto_title.value.trim(),
      manifesto_body: form.manifesto_body.value.trim(),
      location_town: form.stat_town.value.trim(),
      location_region: form.stat_region.value.trim()
    };

    try {
      const res = await fetch('api/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showAlert('Website content updated successfully. Public copy refreshed.', 'success');
      } else {
        showAlert(json.message || 'Unable to update website content.', 'error');
      }
    } catch (err) {
      showAlert('Network error saving website copy.', 'error');
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
    const alertBox = document.getElementById('content-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
  }
})();
