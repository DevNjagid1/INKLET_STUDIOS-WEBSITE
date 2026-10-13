/**
 * INKLET STUDIOS — ADMIN BRIEF INSPECTOR (adminbookingdetail.js)
 * Philosophy: "Ink with Intent"
 * Independent Client Brief & Audit Timeline Controller
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let currentBookingId = null;
  let currentBookingData = null;

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

    // 4. Status update form
    const statusForm = document.getElementById('status-update-form');
    if (statusForm) statusForm.addEventListener('submit', handleStatusUpdate);

    // 5. Note submit form
    const noteForm = document.getElementById('note-form');
    if (noteForm) noteForm.addEventListener('submit', handleAddNote);

    // 6. Verify Auth & Load Brief
    await verifyAuthAndLoadBrief();
  });

  async function verifyAuthAndLoadBrief() {
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

    // Read id or ref from URL
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const refParam = params.get('ref');

    if (!idParam && !refParam) {
      showAlert('No booking reference or ID provided in URL.', 'error');
      return;
    }

    loadBookingDetail(idParam, refParam);
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

  async function loadBookingDetail(id, ref) {
    try {
      const endpoint = id ? `api/bookings.php?id=${id}` : `api/bookings.php?ref=${encodeURIComponent(ref)}`;
      const response = await fetch(endpoint);
      const json = await response.json();

      if (!response.ok || !json.success || !json.data) {
        showAlert('Unable to retrieve booking details. Record may not exist.', 'error');
        return;
      }

      currentBookingData = json.data;
      currentBookingId = currentBookingData.id;
      renderBookingDetail(currentBookingData);
    } catch (err) {
      showAlert('Network error communicating with bookings service.', 'error');
    }
  }

  function renderBookingDetail(b) {
    // Header & Meta
    setTxt('crumb-ref', b.booking_ref);
    setTxt('detail-ref-badge', b.booking_ref);
    setTxt('detail-project-title', b.project_title || 'Untitled Project Brief');
    setTxt('detail-submitted-meta', `Submitted on ${formatDateTime(b.created_at)} • Chuka Time (EAT)`);

    // Status Pill
    const pill = document.getElementById('detail-status-pill');
    if (pill) {
      pill.textContent = b.status || 'NEW';
      pill.className = `status-pill ${getStatusClass(b.status)}`;
    }

    // Status Select pre-selection
    const statusSelect = document.getElementById('select-new-status');
    if (statusSelect && b.status) {
      statusSelect.value = b.status;
    }

    // Specs
    setTxt('spec-service', b.service_name || 'Creative Service');
    setTxt('spec-deadline', b.deadline_date ? formatDate(b.deadline_date) : 'Flexible Timeline');
    setTxt('spec-budget', b.budget_range || 'Undisclosed');
    setTxt('spec-channel', (b.preferred_channel || 'Email').toUpperCase());
    setTxt('spec-description', b.project_description || 'No detailed brief description provided.');

    // Client Profile
    setTxt('client-name-display', b.client_name);
    const emailLink = document.getElementById('client-email-link');
    if (emailLink) {
      emailLink.textContent = b.client_email || 'No email provided';
      emailLink.href = b.client_email ? `mailto:${b.client_email}?subject=${encodeURIComponent('Inklet Studios — ' + (b.booking_ref || 'Project Brief'))}` : '#';
    }

    const phoneLink = document.getElementById('client-phone-link');
    if (phoneLink) {
      phoneLink.textContent = b.client_phone || 'No phone provided';
      phoneLink.href = b.client_phone ? `tel:${b.client_phone}` : '#';
    }

    // WhatsApp & Email quick replies
    const waBtn = document.getElementById('btn-quick-whatsapp');
    if (waBtn) {
      const cleanPhone = (b.client_phone || '').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(`Hello ${b.client_name}! Thank you for submitting brief ${b.booking_ref} to Inklet Studios. We've reviewed your project notes and would love to discuss next steps.`);
      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/254700000000?text=${msg}`;
      waBtn.href = waUrl;
    }

    const emailQuickBtn = document.getElementById('btn-quick-email');
    if (emailQuickBtn) {
      emailQuickBtn.href = b.client_email ? `mailto:${b.client_email}?subject=${encodeURIComponent('Inklet Studios — Project Brief ' + (b.booking_ref || ''))}` : '#';
    }

    // Timeline History
    renderTimeline(b.history || []);

    // Internal Notes
    renderNotes(b.notes || []);
  }

  function renderTimeline(history) {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    if (!history.length) {
      container.innerHTML = '<p class="text-muted text-sm">No historical transitions recorded.</p>';
      return;
    }

    container.innerHTML = history.map(item => {
      const dateStr = formatDateTime(item.created_at);
      const prev = item.previous_status ? `${item.previous_status} &rarr; ` : '';
      return `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-meta">${dateStr}</div>
          <div class="timeline-title">${prev}<strong>${escapeHtml(item.new_status)}</strong></div>
          ${item.notes ? `<div class="timeline-notes">${escapeHtml(item.notes)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderNotes(notes) {
    const container = document.getElementById('notes-list-container');
    if (!container) return;

    if (!notes.length) {
      container.innerHTML = '<p class="text-muted text-sm">No internal studio notes recorded yet.</p>';
      return;
    }

    container.innerHTML = notes.map(n => `
      <div class="note-card">
        <div class="note-meta">
          <strong>${escapeHtml(n.admin_name || 'Studio Administrator')}</strong>
          <span>${formatDateTime(n.created_at)}</span>
        </div>
        <div class="note-body">${escapeHtml(n.note_content)}</div>
      </div>
    `).join('');
  }

  // --- ACTIONS ---
  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!currentBookingId) return;

    const newStatus = document.getElementById('select-new-status').value;
    const note = document.getElementById('status-note-input').value.trim();
    const btn = document.getElementById('btn-update-status');

    btn.disabled = true;
    try {
      const res = await fetch('api/bookings.php', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentBookingId,
          status: newStatus,
          notes: note || `Status updated to ${newStatus}`
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showAlert(`Booking status successfully transitioned to ${newStatus}.`, 'success');
        document.getElementById('status-note-input').value = '';
        // Reload details
        loadBookingDetail(currentBookingId, null);
      } else {
        showAlert(json.message || 'Unable to update status.', 'error');
      }
    } catch (err) {
      showAlert('Network error updating booking status.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!currentBookingId) return;

    const noteInput = document.getElementById('new-note-content');
    const content = noteInput.value.trim();
    if (!content) return;

    const btn = document.getElementById('btn-save-note');
    btn.disabled = true;

    try {
      const res = await fetch('api/bookings.php?action=note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: currentBookingId,
          note_content: content
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showAlert('Internal studio note recorded.', 'success');
        noteInput.value = '';
        loadBookingDetail(currentBookingId, null);
      } else {
        showAlert(json.message || 'Unable to record note.', 'error');
      }
    } catch (err) {
      showAlert('Network error adding note.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function setTxt(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function showAlert(msg, type) {
    const alertBox = document.getElementById('detail-alert');
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
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

  function formatDate(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  }

  function formatDateTime(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dStr;
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
