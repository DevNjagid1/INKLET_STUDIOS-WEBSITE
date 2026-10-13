/**
 * INKLET STUDIOS — ADMIN PROJECTS CONTROLLER (adminprojects.js)
 * Philosophy: "Ink with Intent"
 * Independent Portfolio Project Management Engine
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let allProjects = [];
  let pendingDeleteId = null;

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

    // 4. Modal listeners
    initDeleteModal();

    // 5. Filter listeners
    const searchInput = document.getElementById('filter-search');
    const catSelect = document.getElementById('filter-category');
    const statusSelect = document.getElementById('filter-status');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (catSelect) catSelect.addEventListener('change', applyFilters);
    if (statusSelect) statusSelect.addEventListener('change', applyFilters);

    // 6. Verify Auth & Load Projects
    await verifyAuthAndLoadProjects();
  });

  async function verifyAuthAndLoadProjects() {
    try {
      const authRes = await fetch('api/auth.php?action=me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (!authData.success || !authData.data || !authData.data.authenticated) {
          window.location.href = 'login.html';
          return;
        }
        const user = authData.data.user;
        const nameEl = document.getElementById('admin-user-name');
        if (nameEl && user.name) nameEl.textContent = user.name;
      }
    } catch (e) {
      console.warn('Auth verification warning:', e);
    }

    loadProjects();
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

  async function loadProjects() {
    const tbody = document.getElementById('projects-tbody');
    try {
      const response = await fetch('api/projects.php');
      const json = await response.json();

      if (!response.ok || !json.success) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Unable to load project listings.</td></tr>';
        return;
      }

      allProjects = json.data || [];
      applyFilters();
    } catch (err) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Network error communicating with projects API.</td></tr>';
    }
  }

  function applyFilters() {
    const search = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('filter-category')?.value || 'all';
    const status = document.getElementById('filter-status')?.value || 'all';

    let filtered = allProjects.filter(p => {
      // Category match
      if (cat !== 'all' && p.category_slug !== cat) {
        return false;
      }

      // Status match
      if (status === 'published' && p.is_published != 1) return false;
      if (status === 'draft' && p.is_published != 0) return false;
      if (status === 'featured' && p.is_featured != 1) return false;

      // Search match
      if (search) {
        const titleMatch = (p.title || '').toLowerCase().includes(search);
        const clientMatch = (p.client_name || '').toLowerCase().includes(search);
        const descMatch = (p.overview || '').toLowerCase().includes(search);
        if (!titleMatch && !clientMatch && !descMatch) return false;
      }

      return true;
    });

    renderTable(filtered);
  }

  function renderTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    if (!projects.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No projects found matching the selected filter criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = projects.map(p => {
      const coverUrl = p.cover_image || 'assets/brand/logo.svg';
      const isPub = (p.is_published == 1);
      const isFeat = (p.is_featured == 1);
      const pubBadge = isPub 
        ? `<span class="badge-pub">PUBLISHED</span>` 
        : `<span class="badge-draft">DRAFT</span>`;
      const featBadge = isFeat 
        ? `<span class="badge-featured">&#9733; FEATURED</span>` 
        : `<span class="badge-standard">&mdash;</span>`;

      return `
        <tr data-id="${p.id}">
          <td>
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(p.title)}" class="proj-thumb" loading="lazy">
          </td>
          <td>
            <strong>${escapeHtml(p.title)}</strong>
            <span class="proj-meta-cat">${escapeHtml(p.category_name || 'Design')}</span>
          </td>
          <td>
            ${escapeHtml(p.client_name || 'Studio Concept')}<br>
            <small class="text-muted">${p.project_year || '2026'}</small>
          </td>
          <td>${featBadge}</td>
          <td>${pubBadge}</td>
          <td>
            <div class="table-actions">
              <a href="project.html?slug=${encodeURIComponent(p.slug)}" target="_blank" class="btn btn-outline btn-xs" title="Preview public view">View</a>
              <a href="adminprojectform.html?id=${p.id}" class="btn btn-outline btn-xs" title="Edit project content">Edit</a>
              <button type="button" class="btn-delete-row" onclick="window.inkletConfirmDelete(${p.id}, '${escapeHtml(p.title).replace(/'/g, "\\'")}')" title="Delete case study">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- DELETE MODAL HANDLERS ---
  function initDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-delete-btn');

    window.inkletConfirmDelete = function (id, title) {
      pendingDeleteId = id;
      const titleEl = document.getElementById('delete-project-title');
      if (titleEl) titleEl.textContent = `“${title}”`;
      if (modal) modal.style.display = 'flex';
    };

    function closeModal() {
      pendingDeleteId = null;
      if (modal) modal.style.display = 'none';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        confirmBtn.disabled = true;
        try {
          const res = await fetch(`api/projects.php?id=${pendingDeleteId}`, {
            method: 'DELETE'
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showAlert('Project deleted successfully.', 'success');
            allProjects = allProjects.filter(p => p.id !== pendingDeleteId);
            applyFilters();
          } else {
            showAlert(json.message || 'Unable to delete project.', 'error');
          }
        } catch (err) {
          showAlert('Network error attempting to delete project.', 'error');
        } finally {
          confirmBtn.disabled = false;
          closeModal();
        }
      });
    }
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('projects-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
