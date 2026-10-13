/**
 * INKLET STUDIOS — PORTFOLIO JAVASCRIPT (portfolio.js)
 * Philosophy: "Ink with Intent"
 * Independent, Page-Specific Logic & Interactive Project Filter Engine
 */

(function () {
  'use strict';

  // THEME ENGINE
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
  applyTheme(getPreferredTheme());

  // STATE
  let currentCategory = 'all';
  let searchQuery = '';
  let allProjects = [];

  document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle button
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

      const drawerLinks = mobileDrawer.querySelectorAll('a');
      drawerLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('open');
          mobileBtn.setAttribute('aria-expanded', 'false');
          mobileDrawer.setAttribute('aria-hidden', 'true');
        });
      });
    }

    // Parse URL category parameter if present (e.g., portfolio.html?category=brand-identity)
    const urlParams = new URLSearchParams(window.location.search);
    const initialCat = urlParams.get('category');
    if (initialCat) {
      currentCategory = initialCat;
    }

    // Initialize Category Filters
    initCategoryPills();

    // Initialize Search Input
    const searchInput = document.getElementById('project-search');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchQuery = e.target.value.trim().toLowerCase();
          filterAndRenderProjects();
        }, 250);
      });
    }

    // Reset Filters Button in Empty State
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentCategory = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        updateActivePill('all');
        filterAndRenderProjects();
      });
    }

    // Fetch projects from API
    fetchProjects();
  });

  function initCategoryPills() {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach((pill) => {
      const cat = pill.getAttribute('data-category');
      if (cat === currentCategory) {
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
      } else {
        pill.classList.remove('active');
        pill.setAttribute('aria-selected', 'false');
      }

      pill.addEventListener('click', () => {
        currentCategory = cat;
        updateActivePill(cat);
        filterAndRenderProjects();
      });
    });
  }

  function updateActivePill(category) {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach((p) => {
      const isSelected = p.getAttribute('data-category') === category;
      p.classList.toggle('active', isSelected);
      p.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  async function fetchProjects() {
    const statusEl = document.getElementById('gallery-status');
    try {
      if (statusEl) statusEl.textContent = 'Loading portfolio archive...';
      const response = await fetch('api/projects.php');
      if (!response.ok) throw new Error('API unavailable');
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        allProjects = json.data;
        filterAndRenderProjects();
      }
    } catch (err) {
      // Fallback: preserve hardcoded static HTML cards and enable DOM client-side filtering
      console.info('Operating on static DOM portfolio items');
      filterDOMProjects();
    } finally {
      if (statusEl) statusEl.textContent = '';
    }
  }

  function filterAndRenderProjects() {
    const grid = document.getElementById('portfolio-grid');
    const emptyState = document.getElementById('gallery-empty');
    if (!grid) return;

    if (allProjects.length === 0) {
      filterDOMProjects();
      return;
    }

    let filtered = allProjects;

    if (currentCategory !== 'all') {
      filtered = filtered.filter((p) => p.category_slug === currentCategory);
    }

    if (searchQuery !== '') {
      filtered = filtered.filter((p) => {
        const titleMatch = (p.title || '').toLowerCase().includes(searchQuery);
        const overviewMatch = (p.overview || '').toLowerCase().includes(searchQuery);
        const clientMatch = (p.client_name || '').toLowerCase().includes(searchQuery);
        return titleMatch || overviewMatch || clientMatch;
      });
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((proj) => {
      const article = document.createElement('article');
      article.className = 'project-card';
      article.setAttribute('data-category', proj.category_slug || '');
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
  }

  function filterDOMProjects() {
    const grid = document.getElementById('portfolio-grid');
    const emptyState = document.getElementById('gallery-empty');
    if (!grid) return;

    const cards = grid.querySelectorAll('.project-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCat = card.getAttribute('data-category') || '';
      const text = card.textContent.toLowerCase();

      const catMatches = currentCategory === 'all' || cardCat === currentCategory;
      const searchMatches = searchQuery === '' || text.includes(searchQuery);

      if (catMatches && searchMatches) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (visibleCount === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
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
