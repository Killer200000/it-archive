const app = (() => {
  let data = null;
  let currentSection = 'home';

  const els = {
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('sidebarOverlay'),
    openBtn: document.getElementById('openSidebar'),
    closeBtn: document.getElementById('closeSidebar'),
    search: document.getElementById('searchInput'),
    searchResults: document.getElementById('search-results'),
    searchGrid: document.getElementById('search-grid'),
    searchEmpty: document.getElementById('search-empty'),
  };

  async function init() {
    try {
      const res = await fetch('data.json');
      if (!res.ok) throw new Error('Не удалось загрузить data.json');
      data = await res.json();
    } catch (err) {
      console.error(err);
      document.body.insertAdjacentHTML(
        'afterbegin',
        `<div class="p-6 bg-red-900/20 border border-red-500/30 rounded text-red-400">Ошибка загрузки данных: ${err.message}</div>`
      );
      return;
    }

    setupStats();
    setupSearch();
    renderAllSections();
    switchSection('home', false);
    setupNav();
    setupMobileMenu();

    document.getElementById('year').textContent = new Date().getFullYear();
  }

  function setupStats() {
    const itemCount = data.items ? data.items.length : 0;
    const catCount = data.categories ? data.categories.length : 0;
    const totalEl = document.getElementById('stat-total');
    const catEl = document.getElementById('stat-categories');
    if (totalEl) totalEl.textContent = itemCount;
    if (catEl) catEl.textContent = catCount > 0 ? catCount - 1 : 0;
  }
  function setupNav() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        if (section) switchSection(section);
      });
    });
  }

  function setupMobileMenu() {
    if (els.openBtn) els.openBtn.addEventListener('click', toggleSidebar);
    if (els.closeBtn) els.closeBtn.addEventListener('click', toggleSidebar);
  }

  function toggleSidebar() {
    const isOpen = !els.sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
      els.sidebar.classList.add('-translate-x-full');
      els.overlay.classList.add('hidden');
    } else {
      els.sidebar.classList.remove('-translate-x-full');
      els.overlay.classList.remove('hidden');
    }
  }

  function setupSearch() {
    els.search.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length === 0) {
        clearSearch();
        return;
      }
      performSearch(q);
    });
  }

  function clearSearch() {
    els.search.value = '';
    els.searchResults.classList.add('hidden');
    els.searchGrid.innerHTML = '';
    els.searchEmpty.classList.add('hidden');
    document.querySelectorAll('.section').forEach((s) => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
    const current = document.getElementById(`section-${currentSection}`);
    if (current) {
      current.classList.remove('hidden');
      current.classList.add('active');
    }
    updateNavActive(currentSection);
  }

  function performSearch(q) {
    const results = data.items.filter((item) => {
      const haystack = `${item.title} ${item.subtitle || ''} ${item.description} ${item.version || ''} ${item.category}`.toLowerCase();
      return haystack.includes(q);
    });

    els.searchResults.classList.remove('hidden');
    document.querySelectorAll('.section').forEach((s) => s.classList.add('hidden'));

    if (results.length === 0) {
      els.searchEmpty.classList.remove('hidden');
      els.searchGrid.innerHTML = '';
      return;
    }

    els.searchEmpty.classList.add('hidden');
    els.searchGrid.innerHTML = results.map(renderCard).join('');
  }

  function switchSection(section, animate = true) {
    if (!data) return;
    currentSection = section;

    // Скрываем результаты поиска, если были
    els.searchResults.classList.add('hidden');
    els.searchEmpty.classList.add('hidden');
    els.searchGrid.innerHTML = '';

    // Переключаем секции
    document.querySelectorAll('.section').forEach((s) => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
    const target = document.getElementById(`section-${section}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    if (section === 'home') renderRecent();
    updateNavActive(section);
    toggleSidebar();
  }

  function updateNavActive(activeId) {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      const isActive = btn.dataset.section === activeId;
      if (isActive) {
        btn.classList.remove('text-zinc-400', 'hover:bg-zinc-800', 'hover:text-white');
        btn.classList.add(
          'bg-emerald-500/10',
          'text-emerald-400',
          'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        );
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.add('text-zinc-400', 'hover:bg-zinc-800', 'hover:text-white');
        btn.classList.remove(
          'bg-emerald-500/10',
          'text-emerald-400',
          'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        );
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  function renderAllSections() {
    ['windows', 'android', 'software', 'games'].forEach((cat) => {
      const container = document.getElementById(`grid-${cat}`);
      if (!container) return;
      const items = data.items.filter((i) => i.category === cat);
      container.innerHTML = items.map(renderCard).join('');
    });
  }
  function renderRecent() {
    const container = document.getElementById('recent-grid');
    if (!container) return;
    const recent = [...data.items]
      .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
      .slice(0, 6);
    container.innerHTML = recent.map(renderCard).join('');
  }

  function renderCard(item) {
    const badgeColor = {
      windows: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      android: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      software: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      games: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    }[item.category] || 'bg-zinc-800 text-zinc-400';

    return `
      <article class="card bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div class="p-5">
          <div class="flex justify-between items-start mb-3">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${badgeColor}">
              ${item.icon || '📦'} ${item.badge || item.category}
            </span>
            <a href="${item.archiveUrl || item.downloadUrl}" target="_blank" rel="noopener" class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-zinc-800 text-zinc-400" title="Страница архива">
              <i class="fas fa-external-link-alt"></i>
            </a>
          </div>

          <h3 class="font-semibold text-zinc-100 text-sm leading-tight mb-1">${escapeHtml(item.title)}</h3>
          <p class="text-xs text-zinc-500 mb-3 line-clamp-2">${escapeHtml(item.description || '')}</p>

          <div class="grid grid-cols-2 gap-2 text-xs mb-4">
            <span class="flex items-center gap-1 text-zinc-400"><i class="fas fa-tag w-4"></i> <span class="text-zinc-300">${item.version || '-'}</span></span>
            <span class="flex items-center gap-1 text-zinc-400 justify-end"><i class="fas fa-download w-4"></i> <span class="text-zinc-300">${item.size || '-'}</span></span>
          </div>

          <div class="flex gap-2">
            <a href="${item.downloadUrl}" target="_blank" rel="noopener" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg text-center transition shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5">
              <i class="fas fa-download"></i> Скачать
            </a>
            ${item.hash
              ? `<button onclick="app.copyHash('${escapeAttr(item.hash)}', this)" class="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition flex items-center justify-center" title="Скопировать ${item.hashType || 'хэш'}">
                <i class="fas fa-copy"></i>
              </button>`
              : ''}
          </div>
        </div>
      </article>
    `;
  }

  async function copyHash(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check text-emerald-400"></i>';
      btn.classList.add('bg-emerald-500/20', 'text-emerald-400');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('bg-emerald-500/20', 'text-emerald-400');
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Не удалось скопировать в буфер обмена');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return String(text).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }

  return {
    init,
    switchSection,
    copyHash,
    clearSearch,
  };
})();

document.addEventListener('DOMContentLoaded', () => app.init());