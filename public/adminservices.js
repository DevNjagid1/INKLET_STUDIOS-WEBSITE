/**
 * INKLET STUDIOS — ADMIN SERVICES CONTROLLER (adminservices.js)
 * Philosophy: "Ink with Intent"
 * Independent Creative Service Catalog Management
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let servicesData = [];

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

    // 4. Modal event listeners
    initModalEvents();

    // 5. Verify Auth & Load Services
    await verifyAuthAndLoadServices();
  });

  async function verifyAuthAndLoadServices() {
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

    loadServices();
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

  async function loadServices() {
    const tbody = document.getElementById('services-tbody');
    try {
      const res = await fetch('api/services.php');
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Unable to load services catalog.</td></tr>';
        return;
      }

      servicesData = json.data || [];
      renderTable(servicesData);
    } catch (err) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-error">Network error communicating with services API.</td></tr>';
    }
  }

  function renderTable(services) {
    const tbody = document.getElementById('services-tbody');
    if (!tbody) return;

    if (!services.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No services configured.</td></tr>';
      return;
    }

    tbody.innerHTML = services.map(s => {
      const isActive = (s.is_active == 1);
      const activeBadge = isActive 
        ? '<span class="badge-active">ACTIVE</span>' 
        : '<span class="badge-inactive">INACTIVE</span>';
      const formattedPrice = Number(s.starting_price_kes || 0).toLocaleString();

      return `
        <tr>
          <td class="font-mono text-muted">${s.id}</td>
          <td>
            <div class="service-title-text">${escapeHtml(s.name)}</div>
            <div class="service-summary-text">${escapeHtml(s.summary || '')}</div>
          </td>
          <td>
            <span class="price-text">KES ${formattedPrice}</span>
          </td>
          <td class="text-secondary">${escapeHtml(s.timeline_estimate || '3-7 days')}</td>
          <td>${activeBadge}</td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.inkletOpenServiceModal(${s.id})">Edit</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function initModalEvents() {
    const modal = document.getElementById('service-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const form = document.getElementById('service-edit-form');

    function closeModal() {
      if (modal) modal.style.display = 'none';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    window.inkletOpenServiceModal = function (id) {
      const service = servicesData.find(s => s.id === id);
      if (!service) return;

      document.getElementById('edit_service_id').value = service.id;
      document.getElementById('edit_service_name').value = service.name;
      document.getElementById('edit_service_summary').value = service.summary || '';
      document.getElementById('edit_service_description').value = service.description || '';
      document.getElementById('edit_service_price').value = service.starting_price_kes || 0;
      document.getElementById('edit_service_timeline').value = service.timeline_estimate || '';

      const deliverables = Array.isArray(service.deliverables) 
        ? service.deliverables.join('\n') 
        : (service.deliverables || '');
      document.getElementById('edit_service_deliverables').value = deliverables;

      document.getElementById('edit_service_active').checked = (service.is_active == 1);

      if (modal) modal.style.display = 'flex';
    };

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit_service_id').value, 10);
        const summary = document.getElementById('edit_service_summary').value.trim();
        const description = document.getElementById('edit_service_description').value.trim();
        const starting_price_kes = parseInt(document.getElementById('edit_service_price').value, 10);
        const timeline_estimate = document.getElementById('edit_service_timeline').value.trim();
        const rawDeliv = document.getElementById('edit_service_deliverables').value.trim();
        const deliverables = rawDeliv ? rawDeliv.split('\n').map(d => d.trim()).filter(Boolean) : [];
        const is_active = document.getElementById('edit_service_active').checked ? 1 : 0;

        const saveBtn = document.getElementById('btn-save-service');
        saveBtn.disabled = true;

        try {
          const res = await fetch('api/services.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              summary,
              description,
              starting_price_kes,
              timeline_estimate,
              deliverables,
              is_active
            })
          });

          const json = await res.json();

          if (res.ok && json.success) {
            showAlert('Service details updated successfully.', 'success');
            // Update local memory
            const idx = servicesData.findIndex(s => s.id === id);
            if (idx !== -1) {
              servicesData[idx].summary = summary;
              servicesData[idx].description = description;
              servicesData[idx].starting_price_kes = starting_price_kes;
              servicesData[idx].timeline_estimate = timeline_estimate;
              servicesData[idx].deliverables = deliverables;
              servicesData[idx].is_active = is_active;
            }
            renderTable(servicesData);
            closeModal();
          } else {
            showAlert(json.message || 'Unable to update service.', 'error');
          }
        } catch (err) {
          showAlert('Network error saving service changes.', 'error');
        } finally {
          saveBtn.disabled = false;
        }
      });
    }
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('service-alert');
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
