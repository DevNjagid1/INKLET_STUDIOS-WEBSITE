/**
 * INKLET STUDIOS — PROJECT DETAIL JAVASCRIPT (project.js)
 * Philosophy: "Ink with Intent"
 * Independent, Dynamic Case Study Viewer & Lightbox Modal Engine
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

  // Apply immediately
  applyTheme(getPreferredTheme());

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

    // Lightbox Dialog Controls
    initLightbox();

    // Fetch and Populate Case Study by Slug or ID
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug') || 'kipawa-coffee-roasters-identity';
    loadProjectDetails(slug);
  });

  async function loadProjectDetails(slug) {
    try {
      const response = await fetch(`api/projects.php?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) return; // Keep default content
      const json = await response.json();
      if (!json.success || !json.data) return;

      const p = json.data;

      // Update Meta Tags & Document Title
      document.title = `${p.title} — Inklet Studios`;
      const metaTitle = document.getElementById('meta-doc-title');
      if (metaTitle) metaTitle.textContent = `${p.title} — Inklet Studios`;
      const metaDesc = document.getElementById('meta-doc-desc');
      if (metaDesc) metaDesc.setAttribute('content', p.overview || '');

      // Breadcrumb & Headings
      const bc = document.getElementById('breadcrumb-current-title');
      if (bc) bc.textContent = p.title;

      const elCat = document.getElementById('proj-category');
      if (elCat) elCat.textContent = p.category_name || 'Design';

      const elYear = document.getElementById('proj-year');
      if (elYear) elYear.textContent = String(p.project_year || '2026');

      const elClient = document.getElementById('proj-client');
      if (elClient) elClient.textContent = p.client_name || 'Studio Commission';

      const elTitle = document.getElementById('proj-title');
      if (elTitle) elTitle.textContent = p.title;

      const elOverview = document.getElementById('proj-overview');
      if (elOverview) elOverview.textContent = p.overview || '';

      const elTools = document.getElementById('proj-tools');
      if (elTools) elTools.textContent = p.tools_used || 'Studio Suite';

      // Commission Button link with pre-selected service
      const commBtn = document.getElementById('commission-similar-btn');
      if (commBtn) {
        commBtn.href = `booking.html?service=${p.category_id || 2}`;
      }

      // Cover Image
      const coverImg = document.getElementById('proj-cover-img');
      if (coverImg) {
        coverImg.src = p.cover_image;
        coverImg.alt = p.title;
      }

      // Narrative Blocks
      if (p.client_brief) {
        const elBrief = document.getElementById('proj-brief');
        if (elBrief) elBrief.innerHTML = `<p>${escapeHtml(p.client_brief)}</p>`;
      }

      if (p.creative_direction) {
        const elDir = document.getElementById('proj-direction');
        if (elDir) elDir.innerHTML = `<p>${escapeHtml(p.creative_direction)}</p>`;
      }

      if (p.design_process) {
        const elProc = document.getElementById('proj-process');
        if (elProc) elProc.innerHTML = `<p>${escapeHtml(p.design_process)}</p>`;
      }

      if (p.deliverables) {
        const elDeliv = document.getElementById('proj-deliverables');
        if (elDeliv) elDeliv.textContent = p.deliverables;
      }

      if (p.verified_outcomes) {
        const elOut = document.getElementById('proj-outcomes');
        if (elOut) elOut.textContent = p.verified_outcomes;
      }

      // Gallery Mosaic
      const mosaic = document.getElementById('gallery-mosaic');
      const gallerySec = document.getElementById('case-gallery-container');
      if (mosaic && Array.isArray(p.gallery) && p.gallery.length > 0) {
        mosaic.innerHTML = '';
        p.gallery.forEach((img) => {
          const item = document.createElement('div');
          item.className = 'mosaic-item';
          item.innerHTML = `
            <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || p.title)}" class="mosaic-img" loading="lazy">
            <div class="mosaic-caption">${escapeHtml(img.caption || img.alt_text || p.title)}</div>
          `;
          item.addEventListener('click', () => {
            openLightbox(img.image_url, img.caption || img.alt_text || p.title);
          });
          mosaic.appendChild(item);
        });
      } else if (gallerySec) {
        gallerySec.style.display = 'none';
      }

      // Related Projects
      const relatedGrid = document.getElementById('related-projects-grid');
      if (relatedGrid && Array.isArray(p.related_projects) && p.related_projects.length > 0) {
        relatedGrid.innerHTML = '';
        p.related_projects.forEach((rel) => {
          const card = document.createElement('article');
          card.className = 'related-card';
          card.innerHTML = `
            <a href="project.html?slug=${encodeURIComponent(rel.slug)}" aria-label="View ${escapeHtml(rel.title)}">
              <img src="${escapeHtml(rel.cover_image)}" alt="${escapeHtml(rel.title)}" class="related-img" loading="lazy">
              <div class="related-info">
                <span class="related-cat">${escapeHtml(rel.category_name || 'Design')}</span>
                <h3 class="related-title">${escapeHtml(rel.title)}</h3>
              </div>
            </a>
          `;
          relatedGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.info('Operating on fallback static project view.');
    }
  }

  function initLightbox() {
    const dialog = document.getElementById('lightbox-modal');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const expandCoverBtn = document.getElementById('expand-cover-btn');
    const coverImg = document.getElementById('proj-cover-img');

    if (!dialog) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => dialog.close());
    }

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    if (expandCoverBtn && coverImg) {
      expandCoverBtn.addEventListener('click', () => {
        openLightbox(coverImg.src, coverImg.alt);
      });
    }
  }

  function openLightbox(url, caption) {
    const dialog = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');

    if (dialog && img) {
      img.src = url;
      img.alt = caption || 'Project preview';
      if (cap) cap.textContent = caption || '';
      dialog.showModal();
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
