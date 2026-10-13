/**
 * INKLET STUDIOS — ADMIN MESSAGES CONTROLLER (adminmessages.js)
 * Philosophy: "Ink with Intent"
 * Independent Contact Inquiries & Correspondence Engine
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'inklet_theme';
  let allMessages = [];
  let selectedMessageId = null;

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

    // 5. Toggle Read Button
    const toggleReadBtn = document.getElementById('btn-toggle-read');
    if (toggleReadBtn) toggleReadBtn.addEventListener('click', handleToggleRead);

    // 6. Verify Auth & Load Messages
    await verifyAuthAndLoadMessages();
  });

  async function verifyAuthAndLoadMessages() {
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

    loadMessages();
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

  async function loadMessages() {
    const container = document.getElementById('mail-items-container');
    try {
      const res = await fetch('api/contact.php');
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (container) container.innerHTML = '<div class="text-center py-4 text-error">Unable to load contact messages.</div>';
        return;
      }

      allMessages = json.data || [];
      updateUnreadBadge();
      applyFilters();

      // Automatically select first message if available
      if (allMessages.length > 0 && !selectedMessageId) {
        selectMessage(allMessages[0].id);
      }
    } catch (err) {
      if (container) container.innerHTML = '<div class="text-center py-4 text-error">Network error loading messages.</div>';
    }
  }

  function updateUnreadBadge() {
    const unreadCount = allMessages.filter(m => m.is_read == 0 || m.status === 'unread').length;
    const badge = document.getElementById('badge-messages-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function applyFilters() {
    const search = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();
    const status = document.getElementById('filter-status')?.value || 'all';

    const filtered = allMessages.filter(m => {
      const isUnread = (m.is_read == 0 || m.status === 'unread');
      if (status === 'unread' && !isUnread) return false;
      if (status === 'read' && isUnread) return false;

      if (search) {
        const nameMatch = (m.name || '').toLowerCase().includes(search);
        const emailMatch = (m.email || '').toLowerCase().includes(search);
        const subMatch = (m.subject || '').toLowerCase().includes(search);
        const bodyMatch = (m.message || '').toLowerCase().includes(search);
        if (!nameMatch && !emailMatch && !subMatch && !bodyMatch) return false;
      }

      return true;
    });

    renderList(filtered);
  }

  function renderList(messages) {
    const container = document.getElementById('mail-items-container');
    const countEl = document.getElementById('mail-count-display');
    if (countEl) countEl.textContent = `${messages.length} Message${messages.length === 1 ? '' : 's'}`;

    if (!container) return;

    if (!messages.length) {
      container.innerHTML = '<div class="text-center py-4 text-muted text-sm">No messages match filter.</div>';
      return;
    }

    container.innerHTML = messages.map(m => {
      const isUnread = (m.is_read == 0 || m.status === 'unread');
      const isActive = (m.id === selectedMessageId);
      const activeClass = isActive ? 'active' : '';
      const unreadClass = isUnread ? 'is-unread' : '';
      const dateStr = formatDate(m.created_at);

      return `
        <div class="mail-item ${activeClass} ${unreadClass}" data-id="${m.id}" onclick="window.inkletSelectMail(${m.id})">
          <div class="item-top">
            <span class="item-sender">${escapeHtml(m.name || 'Anonymous')}</span>
            <span class="item-time">${dateStr}</span>
          </div>
          <div class="item-subject">${escapeHtml(m.subject || 'General Inquiry')}</div>
          <div class="item-snippet">${escapeHtml(m.message || '')}</div>
        </div>
      `;
    }).join('');
  }

  window.inkletSelectMail = function (id) {
    selectMessage(id);
  };

  function selectMessage(id) {
    selectedMessageId = id;
    const msg = allMessages.find(m => m.id === id);
    if (!msg) return;

    // Update active highlight in list
    document.querySelectorAll('.mail-item').forEach(el => {
      if (parseInt(el.getAttribute('data-id'), 10) === id) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Show detail view
    const emptyState = document.getElementById('mail-empty-state');
    const detailView = document.getElementById('mail-detail-view');
    if (emptyState) emptyState.style.display = 'none';
    if (detailView) detailView.style.display = 'flex';

    // Generate initials for avatar
    const nameStr = (msg.name || 'IS').trim();
    const initials = nameStr.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'IS';
    setTxt('read-sender-avatar', initials);

    // Populate contents
    setTxt('read-subject', msg.subject || 'General Inquiry');
    setTxt('read-sender-name', msg.name || 'Anonymous');
    setTxt('read-sender-email', msg.email || 'No email provided');
    setTxt('read-sender-phone', msg.phone ? `• ${msg.phone}` : '');
    setTxt('read-date-stamp', `Received on ${formatDateTime(msg.created_at)}`);
    setTxt('read-body-content', msg.message || 'No message content provided.');

    // Toggle Read Button text
    const isUnread = (msg.is_read == 0 || msg.status === 'unread');
    const toggleBtn = document.getElementById('btn-toggle-read');
    if (toggleBtn) {
      toggleBtn.textContent = isUnread ? 'Mark as Read' : 'Mark as Unread';
    }

    // Email Reply button & preview
    const emailBtn = document.getElementById('btn-reply-email');
    if (emailBtn) {
      emailBtn.href = msg.email ? `mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + (msg.subject || 'Inquiry to Inklet Studios'))}` : '#';
    }
    setTxt('read-email-preview', msg.email ? `to: ${msg.email}` : 'No email address on file');

    // WhatsApp Reply button & preview
    const waBtn = document.getElementById('btn-reply-wa');
    const cleanPhone = (msg.phone || '').replace(/[^0-9]/g, '');
    if (waBtn) {
      const replyText = encodeURIComponent(`Hello ${msg.name || 'there'}! Thank you for contacting Inklet Studios regarding '${msg.subject || 'your enquiry'}'. We would be glad to assist you.`);
      waBtn.href = cleanPhone ? `https://wa.me/${cleanPhone}?text=${replyText}` : `https://wa.me/254700000000?text=${replyText}`;
    }
    setTxt('read-wa-preview', cleanPhone ? `chat: +${cleanPhone}` : 'Studio WhatsApp (+254 700 000 000)');
  }

  async function handleToggleRead() {
    if (!selectedMessageId) return;

    const msg = allMessages.find(m => m.id === selectedMessageId);
    if (!msg) return;

    const currentlyUnread = (msg.is_read == 0 || msg.status === 'unread');
    const newStatus = currentlyUnread ? 'read' : 'unread';

    try {
      const res = await fetch('api/contact.php', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMessageId,
          status: newStatus
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        msg.status = newStatus;
        msg.is_read = newStatus === 'read' ? 1 : 0;
        updateUnreadBadge();
        applyFilters();
        selectMessage(selectedMessageId);
      }
    } catch (err) {
      console.error('Error toggling read status:', err);
    }
  }

  function setTxt(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatDate(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return dStr;
    }
  }

  function formatDateTime(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' +
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
