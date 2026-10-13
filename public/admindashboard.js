/**
 * INKLET STUDIOS — ADMIN DASHBOARD JAVASCRIPT (admindashboard.js)
 * Philosophy: "Ink with Intent"
 * Independent Administrative Telemetry & Pipeline Controller
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

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.add('sidebar-open'));
    }
    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', () => sidebar.classList.remove('sidebar-open'));
    }

    // 3. Logout handler
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // 4. Session Verification & Telemetry Load
    await verifyAuthAndLoadData();
  });

  async function verifyAuthAndLoadData() {
    try {
      const authRes = await fetch('api/auth.php?action=me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (!authData.success || !authData.data || !authData.data.authenticated) {
          window.location.href = 'login.html';
          return;
        }

        // Display admin user info
        const user = authData.data.user;
        const nameEl = document.getElementById('admin-user-name');
        const roleEl = document.getElementById('admin-user-role');
        if (nameEl && user.name) nameEl.textContent = user.name;
        if (roleEl && user.role) roleEl.textContent = `${user.role.toUpperCase()} • Chuka`;
      }
    } catch (e) {
      // In standalone static preview or network glitch, continue gracefully
      console.warn('Auth check notice:', e);
    }

    // Load Dashboard Stats
    loadDashboardStats();
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

  async function loadDashboardStats() {
    try {
      const response = await fetch('api/stats.php');
      const json = await response.json();

      if (!response.ok || !json.success || !json.data) {
        console.error('Failed to retrieve statistics:', json);
        return;
      }

      const d = json.data;

      // Update Project Metrics
      if (d.projects) {
        setTxt('stat-proj-total', d.projects.total ?? 0);
        setTxt('stat-proj-pub', d.projects.published ?? 0);
        setTxt('stat-proj-draft', d.projects.draft ?? 0);
      }

      // Update Booking Metrics
      if (d.bookings) {
        setTxt('stat-book-total', d.bookings.total ?? 0);
        setTxt('stat-book-new', d.bookings.new ?? 0);
        setTxt('stat-book-accepted', d.bookings.accepted ?? 0);

        // Update sidebar badge
        const badgeBookings = document.getElementById('badge-bookings-new');
        if (badgeBookings && d.bookings.new > 0) {
          badgeBookings.textContent = d.bookings.new;
          badgeBookings.style.display = 'inline-block';
        }
      }

      // Update Message Metrics
      if (d.messages) {
        setTxt('stat-msg-total', d.messages.total ?? 0);
        setTxt('stat-msg-unread', d.messages.unread ?? 0);

        const badgeMsg = document.getElementById('badge-messages-unread');
        if (badgeMsg && d.messages.unread > 0) {
          badgeMsg.textContent = d.messages.unread;
          badgeMsg.style.display = 'inline-block';
        }
      }

      // Update Class Metrics
      if (d.classes) {
        setTxt('stat-class-confirmed', d.classes.confirmed ?? 0);
        setTxt('stat-class-pending', d.classes.pending ?? 0);
      }

      // Render Recent Bookings Table
      renderRecentBookings(d.recent_bookings || []);

      // Render Recent Messages Table
      renderRecentMessages(d.recent_messages || []);

    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    }
  }

  function setTxt(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderRecentBookings(bookings) {
    const tbody = document.getElementById('table-bookings-tbody');
    if (!tbody) return;

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No recent bookings logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const statusClass = getStatusClass(b.status);
      const dateFormatted = formatDate(b.created_at);
      return `
        <tr>
          <td class="font-mono">${escapeHtml(b.booking_ref || 'INK-REF')}</td>
          <td><strong>${escapeHtml(b.client_name || 'Client')}</strong></td>
          <td>${escapeHtml(b.service_name || 'Design Service')}</td>
          <td><span class="status-pill ${statusClass}">${escapeHtml(b.status || 'NEW')}</span></td>
          <td class="text-muted">${dateFormatted}</td>
          <td>
            <a href="adminbookingdetail.html?id=${b.id}" class="btn-table-action">Inspect &rarr;</a>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderRecentMessages(messages) {
    const tbody = document.getElementById('table-messages-tbody');
    if (!tbody) return;

    if (!messages.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No inbound messages logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = messages.map(m => {
      const isUnread = (m.is_read == 0 || m.status === 'unread');
      const statusPill = isUnread 
        ? '<span class="status-pill status-unread">UNREAD</span>' 
        : '<span class="status-pill status-read">READ</span>';
      const dateFormatted = formatDate(m.created_at);

      return `
        <tr>
          <td><strong>${escapeHtml(m.name || 'Anonymous')}</strong><br><small class="text-muted font-mono">${escapeHtml(m.email || '')}</small></td>
          <td>${escapeHtml(m.subject || 'Inquiry')}</td>
          <td>${statusPill}</td>
          <td class="text-muted">${dateFormatted}</td>
          <td>
            <a href="adminmessages.html" class="btn-table-action">View &rarr;</a>
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
      default: return 'status-read';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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
