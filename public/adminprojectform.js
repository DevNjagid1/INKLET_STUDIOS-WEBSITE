/**
 * INKLET STUDIOS — ADMIN PROJECT FORM CONTROLLER (adminprojectform.js)
 * Philosophy: "Ink with Intent"
 * Independent Portfolio Authoring Engine
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let editingProjectId = null;

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

    // 4. Auto-generate slug handler
    const slugBtn = document.getElementById('btn-slug-gen');
    if (slugBtn) {
      slugBtn.addEventListener('click', () => {
        const titleVal = document.getElementById('project_title')?.value || '';
        const slugInput = document.getElementById('project_slug');
        if (slugInput && titleVal) {
          slugInput.value = slugify(titleVal);
        }
      });
    }

    // 5. Cover image live preview handler
    const coverInput = document.getElementById('cover_image');
    const previewImg = document.getElementById('cover-preview');
    if (coverInput && previewImg) {
      coverInput.addEventListener('input', () => {
        const val = coverInput.value.trim();
        if (val) previewImg.src = val;
      });
    }

    // 6. Form submit handler
    const form = document.getElementById('project-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // 7. Verify Auth & Check Edit Mode
    await verifyAuthAndCheckMode();
  });

  async function verifyAuthAndCheckMode() {
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
      console.warn('Auth check notice:', e);
    }

    // Parse URL params for edit mode
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    if (idParam) {
      editingProjectId = parseInt(idParam, 10);
      setupEditMode(editingProjectId);
    }
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

  async function setupEditMode(id) {
    document.getElementById('form-page-title').textContent = 'Edit Case Study';
    document.getElementById('form-eyebrow').textContent = 'CASE STUDY MODIFICATION';
    document.getElementById('breadcrumb-title').textContent = `Edit Project #${id}`;

    try {
      const res = await fetch(`api/projects.php?id=${id}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        showAlert('Unable to load project data for editing.', 'error');
        return;
      }

      const p = json.data;
      setVal('project_id', p.id);
      setVal('project_title', p.title);
      setVal('project_slug', p.slug);
      setVal('category_id', p.category_id || 1);
      setVal('client_name', p.client_name);
      setVal('project_year', p.project_year || 2026);
      setVal('overview', p.overview);
      setVal('client_brief', p.client_brief);
      setVal('creative_direction', p.creative_direction);
      setVal('design_process', p.design_process);
      setVal('tools_used', p.tools_used);
      setVal('deliverables', p.deliverables);
      setVal('verified_outcomes', p.verified_outcomes);
      setVal('cover_image', p.cover_image);

      const pubEl = document.getElementById('is_published');
      if (pubEl) pubEl.checked = (p.is_published == 1);

      const featEl = document.getElementById('is_featured');
      if (featEl) featEl.checked = (p.is_featured == 1);

      const prev = document.getElementById('cover-preview');
      if (prev && p.cover_image) prev.src = p.cover_image;

    } catch (err) {
      showAlert('Network error fetching project details.', 'error');
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    clearErrors();

    const form = e.target;
    const submitBtn = document.getElementById('btn-save-project');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    const title = form.title.value.trim();
    const slug = form.slug.value.trim();
    const category_id = parseInt(form.category_id.value, 10);
    const client_name = form.client_name.value.trim();
    const project_year = parseInt(form.project_year.value, 10);
    const overview = form.overview.value.trim();
    const client_brief = form.client_brief.value.trim();
    const creative_direction = form.creative_direction.value.trim();
    const design_process = form.design_process.value.trim();
    const tools_used = form.tools_used.value.trim();
    const deliverables = form.deliverables.value.trim();
    const verified_outcomes = form.verified_outcomes.value.trim();
    const cover_image = form.cover_image.value.trim();
    const is_published = form.is_published.checked ? 1 : 0;
    const is_featured = form.is_featured.checked ? 1 : 0;

    let hasError = false;

    if (!title) { setError('title', 'Project title is required.'); hasError = true; }
    if (!slug) { setError('slug', 'URL slug is required.'); hasError = true; }
    if (!overview) { setError('overview', 'Executive overview is required.'); hasError = true; }
    if (!client_brief) { setError('client_brief', 'Client brief description is required.'); hasError = true; }
    if (!creative_direction) { setError('creative_direction', 'Creative direction notes are required.'); hasError = true; }
    if (!design_process) { setError('design_process', 'Design process is required.'); hasError = true; }
    if (!verified_outcomes) { setError('verified_outcomes', 'Outcomes and delivery verification are required.'); hasError = true; }

    if (hasError) {
      showAlert('Please complete all required fields marked with an asterisk.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';

    const payload = {
      id: editingProjectId,
      title,
      slug,
      category_id,
      client_name,
      project_year,
      overview,
      client_brief,
      creative_direction,
      design_process,
      tools_used,
      deliverables,
      verified_outcomes,
      cover_image,
      is_published,
      is_featured
    };

    try {
      const endpoint = 'api/projects.php';
      const method = editingProjectId ? 'POST' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        showAlert(json.message || 'Error occurred while saving project.', 'error');
        return;
      }

      showAlert('Case study saved successfully! Returning to project list...', 'success');
      setTimeout(() => {
        window.location.href = 'adminprojects.html';
      }, 1500);

    } catch (err) {
      showAlert('Network error: Unable to contact project service.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }

  function setError(field, msg) {
    const input = document.getElementById(`project_${field}`) || document.getElementById(field);
    const err = document.getElementById(`err-${field}`);
    if (input) input.classList.add('is-invalid');
    if (err) err.textContent = msg;
  }

  function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    const alertBox = document.getElementById('form-alert');
    if (alertBox) alertBox.style.display = 'none';
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('form-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
  }

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
})();
