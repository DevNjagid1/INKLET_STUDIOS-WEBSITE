/**
 * INKLET STUDIOS — HOMEPAGE JAVASCRIPT (index.js)
 * Philosophy: "Ink with Intent"
 * Independent, Page-Specific Logic & Theme Preference Controller
 */

(function () {
  'use strict';

  // =====================================================================
  // 1. THEME PREFERENCE ENGINE
  // =====================================================================
  const THEME_STORAGE_KEY = 'inklet_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
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

  // Initialize theme immediately
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // =====================================================================
  // 2. DOM CONTENT LOADED BINDINGS
  // =====================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle button binding
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // System theme preference listener
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });

    // Mobile Navigation Drawer Toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-menu');

    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        const isExpanded = mobileBtn.getAttribute('aria-expanded') === 'true';
        mobileBtn.setAttribute('aria-expanded', !isExpanded);
        mobileDrawer.classList.toggle('open');
        mobileDrawer.setAttribute('aria-hidden', isExpanded ? 'true' : 'false');
      });

      // Close drawer on link click
      const drawerLinks = mobileDrawer.querySelectorAll('a');
      drawerLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('open');
          mobileBtn.setAttribute('aria-expanded', 'false');
          mobileDrawer.setAttribute('aria-hidden', 'true');
        });
      });
    }

    // ===================================================================
    // 3. PROGRESSIVE API ENHANCEMENT: FEATURED PROJECTS
    // ===================================================================
    loadDynamicFeaturedProjects();
  });

  async function loadDynamicFeaturedProjects() {
    const grid = document.getElementById('featured-projects-grid');
    if (!grid) return;

    try {
      const response = await fetch('api/projects.php?featured=1&limit=3');
      if (!response.ok) return; // Retain fallback HTML
      const json = await response.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return;

      const projects = json.data;
      grid.innerHTML = '';

      projects.forEach((proj) => {
        const article = document.createElement('article');
        article.className = 'project-card';
        article.innerHTML = `
          <a href="project.html?slug=${encodeURIComponent(proj.slug)}" class="project-media-link" aria-label="View ${escapeHtml(proj.title)} project">
            <img src="${escapeHtml(proj.cover_image)}" alt="${escapeHtml(proj.title)}" class="project-img" loading="lazy">
            <div class="project-overlay">
              <span class="overlay-tag">${escapeHtml(proj.category_name || 'Design')}</span>
              <span class="overlay-action">Inspect Brief &rarr;</span>
            </div>
          </a>
          <div class="project-info">
            <div class="project-meta">
              <span class="project-cat">${escapeHtml(proj.category_name || 'Design')}</span>
              <span class="project-year">${escapeHtml(String(proj.project_year || '2026'))}</span>
            </div>
            <h3 class="project-title">
              <a href="project.html?slug=${encodeURIComponent(proj.slug)}">${escapeHtml(proj.title)}</a>
            </h3>
            <p class="project-excerpt">${escapeHtml(proj.overview || '')}</p>
          </div>
        `;
        grid.appendChild(article);
      });
    } catch (err) {
      // Gracefully silent: fallback static HTML cards are already rendered
      console.info('Operating on static fallback featured projects.');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
