/**
 * INKLET STUDIOS — ADMIN CLASSES CONTROLLER (adminclasses.js)
 * Philosophy: "Ink with Intent"
 * Independent Design Academy & Cohort Controller
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let classesData = [];

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
    initModalEvents();

    // 5. Verify Auth & Load Classes
    await verifyAuthAndLoadClasses();
  });

  async function verifyAuthAndLoadClasses() {
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

    loadClasses();
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

  async function loadClasses() {
    const tbody = document.getElementById('classes-tbody');
    try {
      const res = await fetch('api/classes.php');
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Unable to load academy courses.</td></tr>';
        return;
      }

      classesData = json.data || [];
      renderTable(classesData);
    } catch (err) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Network error communicating with classes API.</td></tr>';
    }
  }

  function renderTable(classes) {
    const tbody = document.getElementById('classes-tbody');
    if (!tbody) return;

    if (!classes.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No design training courses configured.</td></tr>';
      return;
    }

    tbody.innerHTML = classes.map(c => {
      const isEnrolling = (c.is_enrolling == 1);
      const enrollBadge = isEnrolling 
        ? '<span class="badge-enrolling">ENROLLING NOW</span>' 
        : '<span class="badge-closed">COHORT CLOSED</span>';
      const formattedPrice = Number(c.price_kes || 0).toLocaleString();

      return `
        <tr>
          <td>
            <div class="course-title-text">${escapeHtml(c.title)}</div>
            <div class="course-sub-text">${escapeHtml(c.summary || '')}</div>
          </td>
          <td>
            <strong>${escapeHtml(c.level || 'Beginner')}</strong><br>
            <small class="text-muted font-mono">${c.duration_weeks || 4} Weeks</small>
          </td>
          <td>
            <div>${escapeHtml(c.format || 'In-Person (Chuka)')}</div>
            <small class="text-muted">${escapeHtml(c.schedule_notes || '')}</small>
          </td>
          <td>
            <span class="price-text">KES ${formattedPrice}</span>
          </td>
          <td>${enrollBadge}</td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.inkletOpenClassModal(${c.id})">Edit Syllabus</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function initModalEvents() {
    const modal = document.getElementById('class-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const form = document.getElementById('class-edit-form');

    function closeModal() {
      if (modal) modal.style.display = 'none';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    window.inkletOpenClassModal = function (id) {
      const item = classesData.find(c => c.id === id);
      if (!item) return;

      document.getElementById('edit_class_id').value = item.id;
      document.getElementById('edit_class_title').value = item.title;
      document.getElementById('edit_class_level').value = item.level || 'Beginner';
      document.getElementById('edit_class_duration').value = item.duration_weeks || 4;
      document.getElementById('edit_class_price').value = item.price_kes || 0;
      document.getElementById('edit_class_format').value = item.format || 'In-Person (Chuka)';
      document.getElementById('edit_class_schedule').value = item.schedule_notes || '';
      document.getElementById('edit_class_summary').value = item.summary || '';
      document.getElementById('edit_class_description').value = item.description || '';

      const modules = Array.isArray(item.syllabus_modules)
        ? item.syllabus_modules.join('\n')
        : (item.syllabus_modules || '');
      document.getElementById('edit_class_syllabus').value = modules;

      document.getElementById('edit_class_enrolling').checked = (item.is_enrolling == 1);

      if (modal) modal.style.display = 'flex';
    };

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit_class_id').value, 10);
        const title = document.getElementById('edit_class_title').value.trim();
        const level = document.getElementById('edit_class_level').value;
        const duration_weeks = parseInt(document.getElementById('edit_class_duration').value, 10);
        const price_kes = parseInt(document.getElementById('edit_class_price').value, 10);
        const format = document.getElementById('edit_class_format').value.trim();
        const schedule_notes = document.getElementById('edit_class_schedule').value.trim();
        const summary = document.getElementById('edit_class_summary').value.trim();
        const description = document.getElementById('edit_class_description').value.trim();
        const rawSyl = document.getElementById('edit_class_syllabus').value.trim();
        const syllabus_modules = rawSyl ? rawSyl.split('\n').map(m => m.trim()).filter(Boolean) : [];
        const is_enrolling = document.getElementById('edit_class_enrolling').checked ? 1 : 0;

        const saveBtn = document.getElementById('btn-save-class');
        saveBtn.disabled = true;

        try {
          const res = await fetch('api/classes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              title,
              level,
              duration_weeks,
              price_kes,
              format,
              schedule_notes,
              summary,
              description,
              syllabus_modules,
              is_enrolling
            })
          });

          const json = await res.json();
          if (res.ok && json.success) {
            showAlert('Course syllabus updated successfully.', 'success');
            const idx = classesData.findIndex(c => c.id === id);
            if (idx !== -1) {
              classesData[idx].title = title;
              classesData[idx].level = level;
              classesData[idx].duration_weeks = duration_weeks;
              classesData[idx].price_kes = price_kes;
              classesData[idx].format = format;
              classesData[idx].schedule_notes = schedule_notes;
              classesData[idx].summary = summary;
              classesData[idx].description = description;
              classesData[idx].syllabus_modules = syllabus_modules;
              classesData[idx].is_enrolling = is_enrolling;
            }
            renderTable(classesData);
            closeModal();
          } else {
            showAlert(json.message || 'Unable to update class.', 'error');
          }
        } catch (err) {
          showAlert('Network error saving class changes.', 'error');
        } finally {
          saveBtn.disabled = false;
        }
      });
    }
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('class-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
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
