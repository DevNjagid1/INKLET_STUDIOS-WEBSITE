/**
 * INKLET STUDIOS — ADMIN BOOKINGS PIPELINE (adminbookings.js)
 * Philosophy: "Ink with Intent"
 * Independent Client Brief & Pipeline Controller
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let allBookings = [];

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

    // 4. Filter listeners
    const searchInput = document.getElementById('filter-search');
    const statusSelect = document.getElementById('filter-status');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusSelect) statusSelect.addEventListener('change', applyFilters);

    // Read initial status filter from URL if present
    const params = new URLSearchParams(window.location.search);
    const initialStatus = params.get('status');
    if (initialStatus && statusSelect) {
      statusSelect.value = initialStatus.toUpperCase();
    }

    // 5. Verify Auth & Load Bookings
    await verifyAuthAndLoadBookings();
  });

  async function verifyAuthAndLoadBookings() {
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

    loadBookings();
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

  async function loadBookings() {
    const tbody = document.getElementById('bookings-tbody');
    try {
      const response = await fetch('api/bookings.php');
      const json = await response.json();

      if (!response.ok || !json.success) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-error">Unable to load project briefs.</td></tr>';
        return;
      }

      allBookings = json.data || [];

      // Update sidebar badge if new bookings exist
      const newCount = allBookings.filter(b => b.status === 'NEW').length;
      const badgeEl = document.getElementById('badge-bookings-count');
      if (badgeEl && newCount > 0) {
        badgeEl.textContent = newCount;
        badgeEl.style.display = 'inline-block';
      }

      applyFilters();
    } catch (err) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-error">Network error communicating with bookings pipeline.</td></tr>';
    }
  }

  function applyFilters() {
    const search = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();
    const status = document.getElementById('filter-status')?.value || 'ALL';

    const filtered = allBookings.filter(b => {
      // Status check
      if (status !== 'ALL' && (b.status || '').toUpperCase() !== status) {
        return false;
      }

      // Search check
      if (search) {
        const refMatch = (b.booking_ref || '').toLowerCase().includes(search);
        const nameMatch = (b.client_name || '').toLowerCase().includes(search);
        const emailMatch = (b.client_email || '').toLowerCase().includes(search);
        const titleMatch = (b.project_title || '').toLowerCase().includes(search);
        if (!refMatch && !nameMatch && !emailMatch && !titleMatch) return false;
      }

      return true;
    });

    renderTable(filtered);
  }

  function renderTable(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No booking briefs matching the selected filter criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const statusClass = getStatusClass(b.status);
      const deadline = b.deadline_date ? formatDate(b.deadline_date) : 'Flexible';
      const channel = b.preferred_channel ? escapeHtml(b.preferred_channel.toUpperCase()) : 'EMAIL';

      return `
        <tr>
          <td class="font-mono"><strong>${escapeHtml(b.booking_ref)}</strong></td>
          <td>
            <strong>${escapeHtml(b.client_name)}</strong><br>
            <small class="text-muted font-mono">${escapeHtml(b.client_email || '')}</small>
            <small class="text-muted"> &bull; Prefers: ${channel}</small>
          </td>
          <td>${escapeHtml(b.service_name || 'Design Service')}</td>
          <td>
            <strong>${escapeHtml(b.project_title || 'Untitled Project')}</strong><br>
            <span class="budget-badge">Budget: ${escapeHtml(b.budget_range || 'Undisclosed')}</span>
          </td>
          <td class="text-secondary">${deadline}</td>
          <td>
            <span class="status-pill ${statusClass}">${escapeHtml(b.status || 'NEW')}</span>
          </td>
          <td style="text-align: right;">
            <a href="adminbookingdetail.html?id=${b.id}" class="btn-inspect">Inspect Brief &rarr;</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getStatusClass(status) {
    switch ((status || '').toUpperCase()) {
      case 'NEW': return 'status-new';
      case 'REVIEWING': return 'status-reviewing';
      case 'ACCEPTED': return 'status-accepted';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-new';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
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
