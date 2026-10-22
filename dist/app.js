/* Open Detection is a local, buildless reference implementation.
 * It intentionally uses anonymized demo data and mock actions; no external provider or billing system is contacted.
 */

const app = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');
const DEMO_EMAIL = 'demo@example.test';
const STORAGE_KEY = 'open-detection-demo-state-v1';
const MIN_WORDS = 125;
const MAX_WORDS = 50000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_CHECKS = 100;
const HISTORY_PAGE_SIZE = 10;
const ALLOWED_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt']);

const defaultState = {
  checks: [],
  billingTab: 'pricing',
  annual: false,
  reportTab: 'ai',
  profileName: 'Ai Enoch',
  sidebarCollapsed: false,
  mobileNavOpen: false,
  historyPage: 1,
  historyQuery: '',
};

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(defaultState);
    const checks = Array.isArray(saved.checks)
      ? saved.checks.filter((check) => check && typeof check === 'object').slice(0, MAX_CHECKS)
      : [];
    return {
      ...structuredClone(defaultState),
      ...saved,
      checks,
      historyPage: Math.max(1, Math.floor(Number(saved.historyPage) || 1)),
      historyQuery: typeof saved.historyQuery === 'string' ? saved.historyQuery : '',
    };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = readState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    toast('This browser could not save the demo state.');
    return false;
  }
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function wordsIn(text) {
  const value = String(text ?? '').trim();
  return value ? value.split(/\s+/).length : 0;
}

function fileExtension(name) {
  return String(name || '').split('.').pop().toLowerCase();
}

function validateCheckInput() {
  const text = document.querySelector('#paper-text')?.value || '';
  const file = document.querySelector('#file-input')?.files?.[0] || null;
  const words = wordsIn(text);

  if (file) {
    if (!ALLOWED_FILE_EXTENSIONS.has(fileExtension(file.name))) {
      return { valid: false, words: 0, file, message: 'Choose a PDF, DOC, DOCX, or TXT document.' };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { valid: false, words: 0, file, message: 'That document is larger than the 50 MB limit.' };
    }
    return { valid: true, words: Math.max(words, 1200), file, message: '' };
  }

  if (!words) return { valid: false, words: 0, file: null, message: `Paste at least ${MIN_WORDS} words or choose a document.` };
  if (words < MIN_WORDS) return { valid: false, words, file: null, message: `Add ${MIN_WORDS - words} more words to run this check.` };
  if (words > MAX_WORDS) return { valid: false, words, file: null, message: `This check is limited to ${MAX_WORDS.toLocaleString()} words.` };
  return { valid: true, words, file: null, message: '' };
}

const iconPaths = {
  check: '<path d="m5 12 4 4L19 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'arrow-up': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  back: '<path d="m15 18-6-6 6-6"/><path d="M9 12h10"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  copy: '<rect x="8" y="8" width="10" height="10" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="m6 7 1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  code: '<path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/>',
  book: '<path d="M5 5a2 2 0 0 1 2-2h10v17H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h10"/>',
  chat: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.2-.6L4 20l1.6-3.8A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-1.9 1.2-1.9 2.7"/><path d="M12 16.8h.01"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  upload: '<path d="M12 16V5"/><path d="m8 9 4-4 4 4"/><path d="M5 16v4h14v-4"/>',
  paperclip: '<path d="m9 17 6.5-6.5a3 3 0 0 0-4.2-4.2L5.7 12.9a4.5 4.5 0 0 0 6.4 6.4l6-6"/>',
  spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
};

function icon(name) {
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
}

function brandMark() {
  return '<svg class="wordmark-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="9" fill="#14283F"/><path d="M21.8 10.4a8.2 8.2 0 1 0 .2 11.2" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><path d="M14.2 16h8.1" stroke="#80B9FF" stroke-width="2.8" stroke-linecap="round"/><circle cx="23.2" cy="16" r="1.55" fill="#80B9FF"/></svg>';
}

function routeTo(path) {
  state.mobileNavOpen = false;
  const target = window.location.protocol === 'file:' ? `${window.location.pathname}#${path}` : path;
  window.history.pushState({}, '', target);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function pathName() {
  if (window.location.protocol === 'file:') {
    if (window.location.hash.startsWith('#/')) return window.location.hash.slice(1).replace(/\/+$/, '') || '/';
    return '/';
  }
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path;
}

function isDashboard(path = pathName()) {
  return path === '/dashboard' || path.startsWith('/dashboard/');
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  toastRegion.appendChild(node);
  window.setTimeout(() => node.remove(), 3400);
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand?.('copy') === true;
  area.remove();
  return copied;
}

async function copyText(text, success = 'Copied to clipboard.') {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopy(text)) {
      throw new Error('Clipboard unavailable');
    }
    toast(success);
  } catch {
    try {
      if (!fallbackCopy(text)) throw new Error('Fallback clipboard unavailable');
      toast(success);
    } catch {
      toast('Copy failed. Select and copy the link manually.');
    }
  }
}

function resourceHeader(active, dashboardLabel = 'Dashboard') {
  return `
    <header class="resource-header">
      <a class="wordmark" href="/" data-route="/" aria-label="Open Detection home">
        ${brandMark()}<span>Open Detection</span>
      </a>
      <nav class="resource-nav" aria-label="Primary">
        <a class="${active === 'learn' ? 'active' : ''}" href="/learn" data-route="/learn">Learn</a>
        <a class="${active === 'help' ? 'active' : ''}" href="/help" data-route="/help">Help</a>
      </nav>
      <div class="resource-actions">
        <div class="search-pill">${icon('search')} <span>Search resources…</span><kbd>⌘ K</kbd></div>
        <a class="btn small" href="/dashboard" data-route="/dashboard">${dashboardLabel} ${icon('arrow-up')}</a>
      </div>
    </header>`;
}

function sidebar(active) {
  const collapsed = Boolean(state.sidebarCollapsed);
  return `
    <aside class="sidebar" aria-label="Workspace navigation">
      <div class="sidebar-brand"><a class="wordmark" href="/" data-route="/">${brandMark()}<span>Open Detection</span></a><button class="sidebar-toggle" type="button" data-action="toggle-sidebar" aria-label="${collapsed ? 'Expand' : 'Collapse'} sidebar" aria-expanded="${!collapsed}">${icon('panel-left')}</button></div>
      <nav class="sidebar-nav" aria-label="Workspace">
        <a class="sidebar-link ${active === 'new' ? 'active' : ''}" href="/dashboard" data-route="/dashboard">${icon('file')}<span>New check</span></a>
        <div class="sidebar-label">HISTORY</div>
        <a class="sidebar-link ${active === 'history' ? 'active' : ''}" href="/dashboard/checks" data-route="/dashboard/checks">${icon('list')}<span>All checks</span></a>
        <div class="sidebar-label">MORE</div>
        <a class="sidebar-link ${active === 'learn' ? 'active' : ''}" href="/learn" data-route="/learn">${icon('book')}<span>Learn</span></a>
        <a class="sidebar-link ${active === 'help' ? 'active' : ''}" href="/help" data-route="/help">${icon('help')}<span>Help</span></a>
      </nav>
      <a class="sidebar-bottom" href="/dashboard/billing" data-route="/dashboard/billing"><span>Plan</span><span class="plan-chip">Pro</span></a>
    </aside>`;
}

function topbar() {
  const accountName = state.profileName || 'Ai Enoch';
  const menuOpen = false;
  const crumbLabels = {
    '/dashboard': 'New check',
    '/dashboard/checks': 'All checks',
    '/dashboard/billing': 'Plans',
    '/dashboard/profile': 'Account',
    '/dashboard/settings': 'Settings',
    '/learn': 'Learn',
    '/help': 'Help',
  };
  const currentLabel = crumbLabels[pathName()] || 'Workspace';
  return `
    <header class="topbar">
      <button class="mobile-nav-toggle" type="button" data-action="toggle-mobile-nav" aria-label="Open navigation" aria-expanded="${Boolean(state.mobileNavOpen)}">${icon('menu')}</button>
      <div class="topbar-crumbs"><span>Open Detection</span><span class="topbar-separator">/</span><strong>${currentLabel}</strong></div>
      <div class="topbar-right">
        <div class="user-menu-wrap">
          <button class="user-trigger" type="button" data-action="toggle-user-menu" aria-expanded="${menuOpen}">
            <span class="avatar">${esc(accountName.slice(0, 1).toUpperCase())}</span><span class="user-meta"><strong>${esc(accountName)}</strong><span>Pro</span></span>${icon('chevron')}
          </button>
          <div class="user-menu"${menuOpen ? '' : ' hidden'}>
            <div class="user-menu-header"><strong>${esc(accountName)}</strong><span>${DEMO_EMAIL}</span></div>
            <div class="user-menu-divider"></div>
            <a href="/dashboard/profile" data-route="/dashboard/profile">Account</a>
            <a href="/dashboard/settings" data-route="/dashboard/settings">Settings</a>
            <a href="/help" data-route="/help">Help</a>
            <div class="user-menu-divider"></div>
            <button type="button" data-action="sign-out">Sign out</button>
          </div>
        </div>
      </div>
    </header>`;
}

function appShell(active, content) {
  const shellClasses = ['app-shell', state.sidebarCollapsed ? 'sidebar-collapsed' : '', state.mobileNavOpen ? 'mobile-nav-open' : ''].filter(Boolean).join(' ');
  return `<div class="${shellClasses}">${sidebar(active)}${state.mobileNavOpen ? '<button class="mobile-scrim" type="button" data-action="close-mobile-nav" aria-label="Close navigation"></button>' : ''}<div class="app-body">${topbar()}${content}</div></div>`;
}

function renderHome() {
  document.title = 'Open Detection — see your writing clearly';
  app.innerHTML = `
    <div class="resource-shell">
      ${resourceHeader('')}
      <main>
        <section class="hero">
          <div class="hero-inner">
            <div class="eyebrow">A calmer way to review a draft</div>
            <h1>Understand your writing before it leaves your desk.</h1>
            <p>Open Detection turns a document into a clear, sentence-level review of originality signals, likely AI patterns, and the next useful edit.</p>
            <div class="hero-actions">
              <a class="btn" href="/dashboard" data-route="/dashboard">Check a draft ${icon('arrow')}</a>
              <a class="btn secondary" href="/learn" data-route="/learn">Explore the guide</a>
            </div>
            <div class="hero-note">Local prototype · demo actions never send your text anywhere</div>
          </div>
          <div class="hero-demo" aria-label="Product preview">
            <div class="demo-topbar"><span class="wordmark">${brandMark()}<span>Open Detection</span></span><div class="mini-nav"><span>New check</span><span>History</span><span>Reports</span></div><span class="plan-chip">Pro</span></div>
            <div class="demo-grid"><div class="demo-sidebar"><div>New check</div><div>All checks</div><div>Learn</div><div>Help</div></div><div class="demo-card"><div class="fake-tabs"><span class="active">Text</span><span>Upload</span></div><div class="fake-input">Paste a passage or drop a document here…</div><div class="demo-bottom"><span class="muted">Include similarity report</span><button class="btn small" type="button">Run review ${icon('arrow')}</button></div></div></div>
          </div>
        </section>
        <section class="section"><div class="resource-main"><div class="section-heading"><div class="eyebrow">One workspace</div><h2>Everything you need to review a draft with context.</h2><p>Use the same flow for a quick AI signal check, a similarity pass, or a clearer revision.</p></div><div class="feature-grid">
          <article class="feature-card"><span class="feature-icon">%</span><h3>Sentence-level signals</h3><p>See a simple score first, then inspect the passages that deserve a closer look.</p></article>
          <article class="feature-card"><span class="feature-icon">${icon('link')}</span><h3>Similarity context</h3><p>Keep matching sources and the report workflow beside the writing you are reviewing.</p></article>
          <article class="feature-card"><span class="feature-icon">${icon('check')}</span><h3>Confident revisions</h3><p>Keep the useful signals together while you decide what to edit, explain, or leave alone.</p></article>
        </div></div></section>
        <section class="section" style="background:var(--blue-wash)"><div class="resource-main split-section"><div><div class="eyebrow">A useful result</div><h2>Start with the score. Finish with a better decision.</h2><div class="checklist"><div class="checklist-item">${icon('check')}<span>Read a high-level percentage without losing the sentence-level detail.</span></div><div class="checklist-item">${icon('check')}<span>Keep AI and similarity outputs separate so each signal stays understandable.</span></div><div class="checklist-item">${icon('check')}<span>Download or share a report when the review is ready.</span></div></div></div><div class="mock-report"><div class="mock-report-head"><div><div class="eyebrow">AI overview</div><h3 style="margin:8px 0 0;font-size:20px">Research methods draft</h3><p class="muted" style="margin:6px 0 0;font-size:12px">4,820 words · reviewed just now</p></div><div class="mock-score">28%</div></div><div class="mock-lines"><span class="mock-line"></span><span class="mock-line"></span><span class="mock-line"></span><span class="mock-line"></span><span class="mock-line"></span></div></div></div></section>
        <section class="section"><div class="resource-main" style="text-align:center"><div class="eyebrow">Ready when you are</div><h2 style="max-width:650px;margin:12px auto 22px;font-size:clamp(31px,4vw,48px);letter-spacing:-.055em">Make review a normal part of finishing.</h2><a class="btn" href="/dashboard" data-route="/dashboard">Open the workspace ${icon('arrow')}</a></div></section>
      </main>
      ${resourceFooter()}
    </div>`;
}

function resourceFooter() {
  return `<footer class="resource-footer"><span>© 2026 Open Detection prototype</span><span><a class="text-link" href="/privacy-policy" data-route="/privacy-policy">Privacy</a> · <a class="text-link" href="/tos" data-route="/tos">Terms</a></span></footer>`;
}

function renderNewCheck() {
  document.title = 'New check · Open Detection';
  return `<main class="dashboard-main check-backdrop"><div class="new-check-wrap"><h1>Check your work</h1><p>See exactly what your professor will see — ahead of time.</p><div class="check-card">
    <div class="check-toolbar"><div class="toggle"><button class="check-tab active" type="button" data-action="new-check-tab" data-tab="text">Text</button><button class="check-tab" type="button" data-action="new-check-tab" data-tab="upload">Upload</button></div><div class="drop-hint">${icon('paperclip')} Drop a file anywhere to upload</div></div>
    <div class="check-pane" data-pane="text"><div class="text-area-wrap"><label class="sr-only" for="paper-text">Paper text</label><textarea id="paper-text" aria-describedby="check-input-message" placeholder="Paste 125–50,000 words, or upload a document."></textarea><span class="word-count" id="word-count">0 words</span></div></div>
    <div class="check-pane" data-pane="upload" hidden><label class="file-drop" for="file-input"><span class="file-icon">${icon('upload')}</span><strong id="selected-file">Drop your paper here or browse</strong><p>PDF, DOC, DOCX, or TXT — up to 50 MB</p><input id="file-input" type="file" hidden accept=".pdf,.doc,.docx,.txt" /></label></div>
    <p class="check-input-message" id="check-input-message" role="status" aria-live="polite"></p>
    <div class="check-footer"><label class="option-card"><span class="option-icon">${icon('copy')}</span><span class="option-copy">Include Turnitin Report</span><span class="pro-tag">Pro</span><input class="option-checkbox" id="similarity-toggle" type="checkbox" /></label><button class="btn disabled" type="button" data-action="run-check" disabled>Run check ${icon('arrow')}</button></div>
  </div></div></main>`;
}

function checkCountText(count) {
  return `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`;
}

function renderHistoryRows(checks, emptyMessage = 'No checks match that search.') {
  if (!checks.length) return `<tr><td colspan="6" style="padding:35px;text-align:center;color:var(--ink-faint)">${emptyMessage}</td></tr>`;
  return checks.map((check) => {
    const aiClass = check.ai >= 45 ? 'ai-high' : check.ai >= 18 ? 'ai-mid' : 'ai-low';
    const turnitin = check.similarity == null ? `<button class="btn small subtle" type="button" data-action="run-similarity" data-id="${esc(check.id)}">Run</button>` : `<span class="status-pill similarity">${esc(check.similarity)}%</span>`;
    const download = check.archived ? '' : `<button class="icon-action" type="button" data-action="download-check" data-id="${esc(check.id)}" aria-label="Download ${esc(check.name)}">${icon('download')}</button>`;
    return `<tr><td><input class="checkbox" type="checkbox" aria-label="Select ${esc(check.name)}" /></td><td><button class="doc-button" type="button" data-action="open-report" data-id="${esc(check.id)}"><span class="doc-name">${esc(check.name)}</span><span class="doc-sub">${checkCountText(Number(check.words))}${check.archived ? ' · Archived' : ''}</span></button></td><td>${esc(check.date)}</td><td><span class="status-pill ${aiClass}">${esc(check.ai)}%</span></td><td>${turnitin}</td><td><span class="row-actions">${download}<button class="icon-action delete" type="button" data-action="delete-check" data-id="${esc(check.id)}" aria-label="Delete ${esc(check.name)}">${icon('trash')}</button></span></td></tr>`;
  }).join('');
}

function historyMatches(query = state.historyQuery) {
  const normalized = String(query || '').toLowerCase().trim();
  return state.checks.filter((check) => String(check.name || '').toLowerCase().includes(normalized));
}

function renderHistoryPager(page, pageCount, total) {
  const start = total ? ((page - 1) * HISTORY_PAGE_SIZE) + 1 : 0;
  const end = total ? Math.min(page * HISTORY_PAGE_SIZE, total) : 0;
  const pageButtons = total
    ? Array.from({ length: pageCount }, (_, index) => {
      const number = index + 1;
      const current = number === page;
      return `<button class="pager-link${current ? ' active' : ''}" type="button" data-action="history-page" data-page="${number}" aria-label="Go to page ${number}"${current ? ' aria-current="page"' : ''}>${number}</button>`;
    }).join('')
    : '';
  return `<div class="pager"><span>${total ? `${start}–${end} of ${total} checks` : '0 checks'}</span><div class="pager-links"><button class="pager-link" type="button" data-action="history-page" data-page="${page - 1}" aria-label="Previous page"${page <= 1 ? ' disabled' : ''}>Previous</button>${pageButtons}<button class="pager-link" type="button" data-action="history-page" data-page="${page + 1}" aria-label="Next page"${page >= pageCount ? ' disabled' : ''}>Next</button></div></div>`;
}

function renderHistory() {
  document.title = 'All checks · Open Detection';
  const matches = historyMatches();
  const pageCount = Math.max(1, Math.ceil(matches.length / HISTORY_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(Number(state.historyPage) || 1)), pageCount);
  state.historyPage = page;
  const visibleChecks = matches.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);
  const emptyMessage = state.checks.length ? 'No checks match that search.' : 'No checks yet. Run a new check to see it here.';
  return `<main class="dashboard-main history-page"><div class="content-width history-content"><div class="page-heading"><h1>All checks</h1><a class="btn" href="/dashboard" data-route="/dashboard">New check</a></div><div class="card"><div class="history-search-body"><div class="history-toolbar"><div class="search-wrap">${icon('search')}<label class="sr-only" for="check-search">Search your checks</label><input class="search-field" id="check-search" data-check-search value="${esc(state.historyQuery)}" placeholder="Search by document name" /></div></div></div><div class="table-wrap"><table class="table history-table"><thead><tr><th><input class="checkbox" type="checkbox" aria-label="Select all checks" /></th><th>DOCUMENT</th><th>DATE</th><th>AI</th><th>TURNITIN</th><th>ACTIONS</th></tr></thead><tbody id="history-body">${renderHistoryRows(visibleChecks, emptyMessage)}</tbody></table></div>${renderHistoryPager(page, pageCount, matches.length)}</div></div></main>`;
}

function reportFor(id) {
  return state.checks.find((check) => check.id === id) || null;
}

function reportPanel(check) {
  if (state.reportTab === 'similarity') return `<div class="source-list"><div class="source-row"><span><strong>Source match 01</strong><br />Open educational reference</span><span class="status-pill similarity">${check.similarity ?? 0}%</span></div><div class="source-row"><span><strong>Source match 02</strong><br />Public research archive</span><span class="status-pill similarity">${Math.max(1, Math.round((check.similarity ?? 0) / 2))}%</span></div><p class="muted" style="font-size:12px">Demo sources are placeholders. Connect your approved similarity provider before showing real sources.</p></div>`;
  if (state.reportTab === 'details') return `<div class="card"><div class="card-body"><div class="price-row"><span>Document</span><strong>${esc(check.name)}</strong></div><div class="price-row"><span>Word count</span><strong>${Number(check.words).toLocaleString()}</strong></div><div class="price-row"><span>Created</span><strong>${esc(check.date)}</strong></div><div class="price-row"><span>Review mode</span><strong>AI${check.similarity != null ? ' + similarity' : ''}</strong></div><div class="callout" style="margin-bottom:0">This local report is a safe UI preview. No text is sent to a provider.</div></div></div>`;
  return `<div class="highlight-doc"><p><mark>Clear topic sentences</mark> help the reader understand the argument. The evidence is introduced with a little more context, and the transitions keep the section moving.</p><p>The highlighted passages are <mark class="blue">review cues</mark>, not verdicts. Use them to decide where your own voice or citation context should be clearer.</p><p>Open Detection demo output is designed to show the report interaction pattern. Plug your own analysis service into the backend before relying on scores.</p></div>`;
}

function renderReport(id) {
  const check = reportFor(id);
  if (!check) {
    document.title = 'No report · Open Detection';
    return `<main class="dashboard-main"><div class="content-width"><div class="page-heading"><div><h1>No report yet</h1><p>Run a new check to see your results here.</p></div><a class="btn" href="/dashboard" data-route="/dashboard">New check ${icon('arrow')}</a></div></div></main>`;
  }
  document.title = `Report · ${check.name} · Open Detection`;
  return `<main class="dashboard-main"><div class="content-width"><div class="report-titlebar"><a class="back-link" href="/dashboard/checks" data-route="/dashboard/checks">${icon('back')} Checks</a><h1>${esc(check.name)}</h1>${check.archived ? '<span class="status-pill" style="color:var(--ink-soft);background:#eef1f4">Archived</span>' : ''}</div><div class="report-note">This is a local demo report for <strong>${esc(check.name)}</strong>. Scores below are sample UI data and are not connected to a live detection provider.</div><div class="report-scores"><div class="score-card ai"><div class="eyebrow">AI score</div><strong>${esc(check.ai)}%</strong></div><div class="score-card sim"><div class="eyebrow">Similarity score</div><strong>${check.similarity == null ? '—' : `${esc(check.similarity)}%`}</strong></div></div><div class="report-actions"><button class="btn" type="button" data-action="download-report">Download AI report ${icon('download')}</button><button class="btn secondary" type="button" data-action="share-report">Copy report link ${icon('copy')}</button></div><div class="report-tabs"><button type="button" class="${state.reportTab === 'ai' ? 'active' : ''}" data-action="report-tab" data-tab="ai">AI highlights</button><button type="button" class="${state.reportTab === 'similarity' ? 'active' : ''}" data-action="report-tab" data-tab="similarity">Similarity sources</button><button type="button" class="${state.reportTab === 'details' ? 'active' : ''}" data-action="report-tab" data-tab="details">Details</button></div><div class="report-panel">${reportPanel(check)}</div></div></main>`;
}

function renderBilling() {
  document.title = 'Plans · Open Detection';
  const pricing = state.billingTab === 'pricing';
  if (!pricing) return `<main class="dashboard-main"><div class="content-width"><div class="page-heading"><div><h1>Unlimited checks remaining</h1><p>Renews November 22, 2026.</p></div><button class="btn secondary" type="button" data-action="show-demo-note">Manage billing</button></div><div class="current-plan"><div class="metric"><span>AI checks</span><strong>Unlimited</strong></div><div class="metric"><span>Similarity reports</span><strong>Unlimited</strong></div></div><div style="margin-top:26px"><button class="btn" type="button" data-action="billing-tab" data-tab="pricing">Compare plans ${icon('arrow')}</button></div></div></main>`;
  return `<main class="dashboard-main"><div class="content-width"><div class="billing-tabs"><button type="button" class="active" data-action="billing-tab" data-tab="pricing">Explore plans</button><button type="button" data-action="billing-tab" data-tab="current">Your plan</button></div><div class="plan-grid"><article class="plan-card"><div class="plan-card-head">FREE</div><div class="plan-main"><small>1 check / day</small><div class="plan-price"><strong>Free</strong></div><small>Documents up to 350 words</small></div><div class="plan-cta"><button class="btn secondary" type="button" disabled>Included with Pro</button></div><div class="plan-features"><div>${icon('check')}AI detection percentages</div><div>${icon('check')}Sentence-level AI highlights</div><div>${icon('check')}24/7 support</div><div>${icon('check')}1 upload per day</div><div>${icon('check')}350 word limit</div></div></article><article class="plan-card featured"><div class="plan-card-head">PRO <span class="popular-tag">MOST POPULAR</span></div><div class="plan-main"><small>Unlimited checks</small><div class="plan-price"><strong>${state.annual ? '$16.66' : '$19.99'}</strong><span>per month</span></div><div class="annual-row">Annual <label class="switch"><input type="checkbox" ${state.annual ? 'checked' : ''} data-action="annual-toggle" /><span class="switch-track"></span></label><span class="save-badge">Save $60</span></div></div><div class="plan-cta"><button class="btn secondary" type="button" disabled>Current plan</button></div><div class="plan-features"><div>${icon('spark')}All free plan features</div><div class="plus">— PLUS —</div><div>${icon('check')}Unlimited uploads</div><div>${icon('check')}Similarity reports</div><div>${icon('check')}Similarity percentages</div><div>${icon('check')}Advanced sentence heuristics</div><div>${icon('check')}Money-back guarantee</div></div></article></div></div></main>`;
}

function renderProfile(kind = 'profile') {
  const settings = kind === 'settings';
  if (settings) {
    document.title = 'Settings · Open Detection';
    return `<main class="dashboard-main"><div class="content-width"><div class="page-heading"><div><h1>Workspace settings</h1><p>Choose how the local workspace behaves.</p></div></div><div class="card"><div class="card-body"><div class="price-row"><span>Demo mode</span><strong>Enabled</strong></div><div class="price-row"><span>Provider requests</span><strong>Disabled</strong></div><div class="price-row"><span>Data retention</span><strong>Browser only</strong></div><div class="callout">This local clone stores only demo state in your browser’s local storage.</div></div></div></div></main>`;
  }
  document.title = 'Account · Open Detection';
  const profileName = state.profileName || 'Ai Enoch';
  return `<main class="dashboard-main account-page"><div class="account-content">
    <div class="account-heading"><h1>Account</h1><p>Your details, your password, and your plan.</p></div>
    <section class="account-card profile-card">
      <h2>Profile</h2>
      <div class="account-name-field"><label class="account-label" for="profile-name">Name</label><div class="account-name-controls"><input class="account-input" id="profile-name" value="${esc(profileName)}" autocomplete="name" /><button class="account-save" type="button" data-action="save-profile" disabled>Save</button></div></div>
      <div class="account-divider"></div>
      <div class="account-email"><div class="account-label">Email</div><div class="account-value">${DEMO_EMAIL}</div><p class="account-copy">This is a safe placeholder address for the local demo. <a href="mailto:support@example.test">Contact support</a> to change it.</p></div>
      <div class="account-divider"></div>
      <div class="connected-row"><span>Google</span><span class="connected-badge">Connected</span></div>
    </section>
    <section class="account-card password-card">
      <h2>Password</h2><p class="account-card-lede">Changing it signs out every other device.</p>
      <label class="account-label" for="current-password">Current password</label><input class="account-input" id="current-password" type="password" autocomplete="current-password" />
      <label class="account-label password-label" for="new-password">New password</label><input class="account-input" id="new-password" type="password" autocomplete="new-password" /><p class="password-hint">At least 8 characters.</p><button class="account-button" type="button" data-action="update-password" disabled>Update password</button>
    </section>
    <section class="account-card plan-account-card">
      <h2>Plan</h2><p class="account-card-lede">Unlimited AI checks and Turnitin similarity reports.</p>
      <div class="account-divider"></div><div class="account-plan-summary"><div><span>CURRENT PLAN</span><strong>Pro · Monthly</strong></div><div><span>RENEWS</span><strong>November 22, 2026</strong></div></div><div class="account-divider"></div>
      <div class="account-plan-actions"><a class="account-button account-primary" href="/dashboard/billing" data-route="/dashboard/billing">Manage billing</a><a class="account-button account-secondary" href="/dashboard/billing" data-route="/dashboard/billing">Plans</a></div>
    </section>
  </div></main>`;
}

const learnArticles = [
  { slug: 'your-first-check', group: 'START HERE', number: '1', title: 'Uploading your first document', meta: 'Start here · 4 min read', lede: 'Take a document from your computer to a readable report. Here is what to expect at each step.', sections: [['Prepare a readable file', 'Use a selectable-text PDF, DOC, DOCX, or TXT. A scanned image needs OCR before a checker can read it.'], ['Choose the file and check type', 'Use Text for a pasted passage or Upload for a document. Turn similarity on only when you also need source matching.'], ['What happens after Run check?', 'Uploads, conversion, and analysis can happen in stages. The report opens when the AI result is ready, while similarity may continue separately.']] },
  { slug: 'how-detection-works', group: 'UNDERSTAND THE RESULT', number: '1', title: 'How AI detection works', meta: 'Understand the result · 5 min read', lede: 'Learn what a percentage can tell you, and what it cannot.', sections: [['A signal, not a verdict', 'Scores identify patterns in the submitted text. They do not determine who wrote it or whether a decision about authorship is correct.'], ['Read the highlights', 'Open the sentence view to see the passages behind the overview. Compare the signal with your own context and drafting history.']] },
  { slug: 'understanding-ai-scores', group: 'UNDERSTAND THE RESULT', number: '2', title: 'Interpreting AI scores', meta: 'Understand the result · 4 min read', lede: 'Use the score as a prompt for review, not as a standalone conclusion.', sections: [['Start with context', 'Look at the size and type of the document, then move through the highlighted sentences.'], ['Keep a record', 'Save drafts, sources, and notes so you can explain how your work developed over time.']] },
  { slug: 'report-viewer', group: 'WORK WITH YOUR REPORT', number: '1', title: 'A tour of the report viewer', meta: 'Work with your report · 5 min read', lede: 'Move from the overview score to highlighted text, sources, and report actions.', sections: [['Overview first', 'The report keeps AI and similarity as separate panels so each result has a clear meaning.'], ['Then inspect', 'Use sentence highlights and source rows to decide where an edit or citation check is useful.']] },
  { slug: 'reviewing-similarity', group: 'WORK WITH YOUR REPORT', number: '2', title: 'Reviewing similarity matches', meta: 'Work with your report · 4 min read', lede: 'A match is a place to investigate, not automatically a problem.', sections: [['Open the source', 'Read the surrounding text and compare the match with your citation and quotation choices.'], ['Make the change you mean', 'Rewrite only when it improves clarity or accurately reflects your source.']] },
  { slug: 'responsible-revision', group: 'WORK WITH YOUR REPORT', number: '3', title: 'Making and checking changes', meta: 'Work with your report · 3 min read', lede: 'Use a report to guide a thoughtful revision loop.', sections: [['Revise in small passes', 'Make one meaningful change at a time, then rerun the relevant check.'], ['Keep your voice', 'A lower number is not the goal; clear, honest writing is.']] },
  { slug: 'sharing-your-work', group: 'WORK WITH YOUR REPORT', number: '4', title: 'Sharing a report', meta: 'Work with your report · 3 min read', lede: 'Share the result with the right amount of context.', sections: [['Choose the artifact', 'Download a report or share a review link depending on what your recipient needs.'], ['Protect private work', 'Review permissions and remove sensitive files from shared spaces when a project ends.']] },
];

function learnSide(active) {
  const groups = [...new Set(learnArticles.map((article) => article.group))];
  return groups.map((group) => `<section><h3>${group}</h3>${learnArticles.filter((article) => article.group === group).map((article) => `<a class="${article.slug === active ? 'active' : ''}" href="/learn/${article.slug}" data-route="/learn/${article.slug}">${article.number} ${article.title}</a>`).join('')}</section>`).join('');
}

function renderLearn(path) {
  if (path === '/learn') {
    document.title = 'Learn · Open Detection';
    return `<div class="resource-shell">${resourceHeader('learn')}<main class="resource-main resource-index"><div class="eyebrow" style="text-align:center">Practical lessons</div><h1>Learn with Open Detection</h1><p>Short guides for a more confident review, from the first upload to a finished report.</p><div class="resource-cards">${learnArticles.slice(0, 6).map((article) => `<a class="resource-card" href="/learn/${article.slug}" data-route="/learn/${article.slug}"><span class="feature-icon">${article.number}</span><h3>${esc(article.title)}</h3><p>${esc(article.lede)}</p></a>`).join('')}</div></main>${resourceFooter()}</div>`;
  }
  const slug = path.split('/').pop();
  const article = learnArticles.find((item) => item.slug === slug) || learnArticles[0];
  document.title = `${article.title} · Learn · Open Detection`;
  return `<div class="resource-shell">${resourceHeader('learn')}<div class="article-layout"><aside class="article-side"><div>${learnSide(article.slug)}</div></aside><article class="article-main"><div class="article-meta">${esc(article.meta)}</div><h1>${esc(article.title)}</h1><p class="article-lede">${esc(article.lede)}</p><div class="article-figure">Product walkthrough preview · local demo</div>${article.sections.map(([heading, copy]) => `<h2>${esc(heading)}</h2><p>${esc(copy)}</p>`).join('')}<h2>Keep exploring</h2><p>Pair this lesson with the <a class="text-link" href="/help" data-route="/help">Help centre</a> or open a <a class="text-link" href="/dashboard" data-route="/dashboard">new demo check</a>.</p></article></div>${resourceFooter()}</div>`;
}

const helpTopics = [
  ['Getting started', 'Your account and your first check.', 'getting-started'],
  ['Documents & reports', 'Uploads, results, downloads, and sharing.', 'uploading-documents'],
  ['Plans & billing', 'Subscriptions and payments.', 'plans-and-payments'],
  ['Account & security', 'Sign-in, settings, and access.', 'account-access'],
];

const helpArticles = {
  'getting-started': ['Getting started', 'Open the workspace, paste a passage or choose a file, and read the result when processing completes.'],
  'uploading-documents': ['Uploading documents', 'Use a readable PDF, DOC, DOCX, or TXT. Confirm the displayed filename before running a check.'],
  'understanding-results': ['Understanding results', 'Scores are review signals. Open the highlighted text and source context before deciding what to change.'],
  'check-stuck-or-failed': ['When a check is stuck or fails', 'Check the status message, file format, word allowance, and whether the document contains selectable text.'],
  'downloads-and-sharing': ['Downloads and sharing', 'Use the report actions after a check is complete, and review permissions before sharing private work.'],
  'plans-and-payments': ['Plans and payments', 'Review your plan, payment status, and renewal details before continuing.'],
  'account-access': ['Account access', 'Keep login credentials private and contact support if a sign-in or access issue persists.'],
};

function renderHelp(path) {
  if (path !== '/help') {
    const slug = path.split('/').pop();
    const article = helpArticles[slug] || helpArticles['getting-started'];
    document.title = `${article[0]} · Help · Open Detection`;
    return `<div class="resource-shell">${resourceHeader('help')}<div class="article-layout"><aside class="article-side"><div><h3>HELP CENTRE</h3>${Object.entries(helpArticles).map(([key, value]) => `<a class="${key === slug ? 'active' : ''}" href="/help/${key}" data-route="/help/${key}">${esc(value[0])}</a>`).join('')}</div></aside><article class="article-main"><div class="article-meta">Help centre · 3 min read</div><h1>${esc(article[0])}</h1><p class="article-lede">${esc(article[1])}</p><div class="article-figure">Support article preview · local demo</div><h2>What to do next</h2><p>${esc(article[1])} If the issue continues, collect the exact message shown by the form and contact your support team.</p><a class="btn" href="/help" data-route="/help">Back to Help centre</a></article></div>${resourceFooter()}</div>`;
  }
  document.title = 'Help centre · Open Detection';
  return `<div class="resource-shell">${resourceHeader('help')}<main class="resource-main resource-index"><div class="eyebrow" style="text-align:center">Support</div><h1>How can we help?</h1><p>A little guidance, wherever you are in your writing.</p><div class="resource-search search-wrap">${icon('search')}<label class="sr-only" for="help-search">Search help articles</label><input class="search-field" id="help-search" placeholder="Search for answers, like “my report is still processing”" /></div><div class="resource-cards"><a class="resource-card" href="/learn" data-route="/learn"><span class="feature-icon">${icon('book')}</span><h3>Learn with Open Detection ${icon('arrow-up')}</h3><p>Short guides for a more confident review.</p></a><a class="resource-card" href="mailto:support@example.test"><span class="feature-icon">${icon('chat')}</span><h3>Talk to our team ${icon('arrow-up')}</h3><p>Get help with an account or a report.</p></a></div><div class="topics"><div class="topics-head"><h2>BROWSE BY TOPIC</h2><span>${helpTopics.length} articles</span></div><div class="accordion">${helpTopics.map(([title, desc, slug], index) => `<div class="accordion-item"><button class="accordion-trigger" type="button" data-action="accordion-toggle"><span class="topic-copy"><span class="topic-number">0${index + 1}</span><span><strong>${esc(title)}</strong><span>${esc(desc)}</span></span></span>${icon('chevron')}</button><div class="accordion-content"><a class="text-link" href="/help/${slug}" data-route="/help/${slug}">Browse ${esc(title)} help →</a></div></div>`).join('')}</div></div></main>${resourceFooter()}</div>`;
}

function renderPricing() {
  document.title = 'Pricing · Open Detection';
  return `<div class="resource-shell">${resourceHeader('')}<main class="resource-main resource-index"><div class="eyebrow" style="text-align:center">Simple plans</div><h1>Choose your review rhythm.</h1><p>Start with a daily check or unlock unlimited workspace reviews.</p><div class="plan-grid" style="margin-top:55px"><article class="plan-card"><div class="plan-card-head">FREE</div><div class="plan-main"><small>1 check / day</small><div class="plan-price"><strong>Free</strong></div><small>Short documents up to 350 words</small></div><div class="plan-cta"><a class="btn" href="/dashboard" data-route="/dashboard">Start free</a></div><div class="plan-features"><div>${icon('check')}AI percentage overview</div><div>${icon('check')}Sentence highlights</div><div>${icon('check')}Support resources</div></div></article><article class="plan-card featured"><div class="plan-card-head">PRO <span class="popular-tag">MOST POPULAR</span></div><div class="plan-main"><small>Unlimited checks</small><div class="plan-price"><strong>$19.99</strong><span>per month</span></div><small>For active review workflows</small></div><div class="plan-cta"><a class="btn" href="/dashboard/billing" data-route="/dashboard/billing">Choose Pro</a></div><div class="plan-features"><div>${icon('spark')}Everything in Free</div><div>${icon('check')}Unlimited uploads</div><div>${icon('check')}Similarity reports</div><div>${icon('check')}Advanced review tools</div></div></article></div></main>${resourceFooter()}</div>`;
}

function renderSimplePage(path) {
  const pages = {
    '/benchmark': ['Benchmark', 'A transparent place to compare review workflows and document-level signals.'],
    '/guarantee': ['Money-back guarantee', 'A plain-language explanation of the product promise and eligibility window.'],
    '/tos': ['Terms of service', 'Use this page as a placeholder for your final terms, acceptable-use policy, and product limits.'],
    '/privacy-policy': ['Privacy policy', 'Use this page as a placeholder for your final data, retention, and processor disclosures.'],
    '/blog': ['Field notes', 'Short product updates, benchmark notes, and practical writing guidance.'],
  };
  const [title, lede] = pages[path] || pages['/blog'];
  document.title = `${title} · Open Detection`;
  return `<div class="resource-shell">${resourceHeader('')}<main class="resource-main resource-index"><div class="eyebrow" style="text-align:center">Open Detection resources</div><h1>${esc(title)}</h1><p>${esc(lede)}</p><div class="resource-cards">${['A clearer review loop', 'What a score can tell you', 'A more useful report'].map((item, index) => `<article class="resource-card"><span class="feature-icon">0${index + 1}</span><h3>${item}</h3><p>Original placeholder content for your product team to replace with approved copy.</p></article>`).join('')}</div></main>${resourceFooter()}</div>`;
}

function renderDashboard(path) {
  let active = 'new';
  let content;
  if (path === '/dashboard') content = renderNewCheck();
  else if (path === '/dashboard/checks') { active = 'history'; content = renderHistory(); }
  else if (path.startsWith('/dashboard/checks/')) { active = 'history'; content = renderReport(path.split('/').pop()); }
  else if (path === '/dashboard/billing') { active = 'billing'; content = renderBilling(); }
  else if (path === '/dashboard/profile') { active = 'profile'; content = renderProfile('profile'); }
  else if (path === '/dashboard/settings') { active = 'settings'; content = renderProfile('settings'); }
  else { content = renderNewCheck(); }
  app.innerHTML = appShell(active, content);
  bindNewCheck();
  bindProfile();
}

function render() {
  const path = pathName();
  if (isDashboard(path)) return renderDashboard(path);
  if (path === '/learn' || path.startsWith('/learn/')) { app.innerHTML = renderLearn(path); return; }
  if (path === '/help' || path.startsWith('/help/')) { app.innerHTML = renderHelp(path); return; }
  if (path === '/pricing') { app.innerHTML = renderPricing(); return; }
  if (path === '/' || path === '') { renderHome(); return; }
  app.innerHTML = renderSimplePage(path);
}

function bindNewCheck() {
  const text = document.querySelector('#paper-text');
  const count = document.querySelector('#word-count');
  const message = document.querySelector('#check-input-message');
  const run = document.querySelector('[data-action="run-check"]');
  if (!text || !count || !run) return;
  let hasInteracted = false;
  const update = () => {
    const validation = validateCheckInput();
    count.textContent = checkCountText(validation.words);
    if (message) message.textContent = hasInteracted ? validation.message : '';
    run.disabled = !validation.valid;
    run.classList.toggle('disabled', run.disabled);
  };
  text.addEventListener('input', () => { hasInteracted = true; update(); });
  document.querySelector('#file-input')?.addEventListener('change', (event) => {
    hasInteracted = true;
    const file = event.target.files?.[0];
    if (file) document.querySelector('#selected-file').textContent = file.name;
    update();
  });
  update();
}

function bindProfile() {
  const name = document.querySelector('#profile-name');
  const save = document.querySelector('[data-action="save-profile"]');
  const currentPassword = document.querySelector('#current-password');
  const newPassword = document.querySelector('#new-password');
  const updatePassword = document.querySelector('[data-action="update-password"]');
  if (name && save) {
    const initial = name.value;
    const updateName = () => { save.disabled = !name.value.trim() || name.value.trim() === initial; };
    name.addEventListener('input', updateName);
    updateName();
  }
  if (currentPassword && newPassword && updatePassword) {
    const updatePasswordState = () => { updatePassword.disabled = !currentPassword.value || newPassword.value.length < 8; };
    currentPassword.addEventListener('input', updatePasswordState);
    newPassword.addEventListener('input', updatePasswordState);
    updatePasswordState();
  }
}

let modalRestoreFocus = null;
const MODAL_FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function openModal(content) {
  modalRestoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" data-modal-backdrop><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">${content}</div></div>`);
  document.querySelector('[data-modal-backdrop] .modal')?.focus();
}

function closeModal() {
  document.querySelector('[data-modal-backdrop]')?.remove();
  if (modalRestoreFocus?.isConnected) modalRestoreFocus.focus();
  modalRestoreFocus = null;
}

function handleAction(action, element) {
  if (action === 'toggle-sidebar') {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    state.mobileNavOpen = false;
    saveState();
    render();
    return;
  }
  if (action === 'toggle-mobile-nav') {
    state.mobileNavOpen = !state.mobileNavOpen;
    render();
    return;
  }
  if (action === 'close-mobile-nav') {
    state.mobileNavOpen = false;
    render();
    return;
  }
  if (action === 'toggle-user-menu') {
    const menu = element.parentElement.querySelector('.user-menu');
    const hidden = menu.hasAttribute('hidden');
    menu.toggleAttribute('hidden', !hidden);
    element.setAttribute('aria-expanded', String(hidden));
    return;
  }
  if (action === 'show-demo-note') {
    document.querySelectorAll('.user-menu').forEach((menu) => menu.setAttribute('hidden', ''));
    openModal(`<div class="modal-header"><h2 id="modal-title">About this local clone</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="modal-body"><p>This is an original Open Detection reference implementation inspired by the inspected information architecture. It uses anonymized sample data and browser-only mock actions.</p><p>No documents, payment details, or provider requests leave this browser.</p><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Close</button></div></div>`);
    return;
  }
  if (action === 'sign-out') {
    document.querySelectorAll('.user-menu').forEach((menu) => menu.setAttribute('hidden', ''));
    toast('Sign out is disabled in this local demo.');
    return;
  }
  if (action === 'save-profile') {
    const name = document.querySelector('#profile-name')?.value.trim();
    if (!name) return;
    state.profileName = name;
    saveState();
    render();
    toast('Profile name saved locally.');
    return;
  }
  if (action === 'update-password') {
    document.querySelector('#current-password').value = '';
    document.querySelector('#new-password').value = '';
    toast('Password changes are disabled in this local demo.');
    bindProfile();
    return;
  }
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'new-check-tab') {
    document.querySelectorAll('.check-tab').forEach((tab) => tab.classList.toggle('active', tab === element));
    document.querySelectorAll('.check-pane').forEach((pane) => { pane.hidden = pane.dataset.pane !== element.dataset.tab; });
    return;
  }
  if (action === 'run-check') {
    const input = validateCheckInput();
    if (!input.valid) return toast(input.message || 'Add text or choose a document first.');
    const check = { id: `demo-${Date.now()}`, name: input.file?.name || 'Untitled draft.txt', words: input.words, date: 'Just now', ai: Math.min(86, Math.max(4, Math.round(input.words % 61))), similarity: document.querySelector('#similarity-toggle')?.checked ? 9 : null, status: 'Ready' };
    state.checks = [check, ...state.checks].slice(0, MAX_CHECKS);
    saveState();
    state.reportTab = 'ai';
    routeTo(`/dashboard/checks/${check.id}`);
    return;
  }
  if (action === 'open-report') { state.reportTab = 'ai'; routeTo(`/dashboard/checks/${element.dataset.id}`); return; }
  if (action === 'history-page') {
    const requested = Number(element.dataset.page);
    const pageCount = Math.max(1, Math.ceil(historyMatches().length / HISTORY_PAGE_SIZE));
    if (Number.isFinite(requested)) state.historyPage = Math.min(Math.max(1, Math.floor(requested)), pageCount);
    render();
    return;
  }
  if (action === 'download-check' || action === 'download-report') { toast('Demo download prepared locally.'); return; }
  if (action === 'share-report') { copyText(`${window.location.origin}/dashboard/checks/demo`, 'Demo report link copied.'); return; }
  if (action === 'run-similarity') {
    const check = state.checks.find((item) => item.id === element.dataset.id);
    if (check) { check.similarity = 9; saveState(); render(); toast('Demo similarity result added.'); }
    return;
  }
  if (action === 'delete-check') {
    const check = state.checks.find((item) => item.id === element.dataset.id);
    if (!check) return;
    openModal(`<div class="modal-header"><h2 id="modal-title">Delete this check?</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="modal-body"><strong style="color:var(--ink)">${esc(check.name)}</strong><p>All demo data associated with this check will be removed from this browser. This cannot be undone.</p><div class="modal-actions"><button class="btn secondary" type="button" data-action="close-modal">Cancel</button><button class="btn danger" type="button" data-action="confirm-delete" data-id="${esc(check.id)}">Delete upload</button></div></div>`);
    return;
  }
  if (action === 'confirm-delete') {
    state.checks = state.checks.filter((check) => check.id !== element.dataset.id);
    saveState(); closeModal(); render(); toast('Demo check deleted.'); return;
  }
  if (action === 'report-tab') { state.reportTab = element.dataset.tab; render(); return; }
  if (action === 'billing-tab') { state.billingTab = element.dataset.tab; saveState(); render(); return; }
  if (action === 'annual-toggle') { state.annual = element.checked; saveState(); render(); return; }
  if (action === 'accordion-toggle') { element.closest('.accordion-item')?.classList.toggle('open'); return; }
}

document.addEventListener('click', (event) => {
  const route = event.target.closest('[data-route]');
  if (route) { event.preventDefault(); routeTo(route.dataset.route); return; }
  const action = event.target.closest('[data-action]');
  if (action) handleAction(action.dataset.action, action);
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-check-search]')) {
    state.historyQuery = event.target.value;
    state.historyPage = 1;
    const matches = historyMatches();
    const rows = matches.slice(0, HISTORY_PAGE_SIZE);
    const body = document.querySelector('#history-body');
    if (body) body.innerHTML = renderHistoryRows(rows, state.checks.length ? 'No checks match that search.' : 'No checks yet. Run a new check to see it here.');
    const pager = document.querySelector('.history-page .pager');
    if (pager) pager.outerHTML = renderHistoryPager(1, Math.max(1, Math.ceil(matches.length / HISTORY_PAGE_SIZE)), matches.length);
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.user-menu-wrap')) document.querySelectorAll('.user-menu').forEach((menu) => menu.setAttribute('hidden', ''));
  if (event.target.matches('[data-modal-backdrop]')) closeModal();
});

document.addEventListener('keydown', (event) => {
  const dialog = document.querySelector('[data-modal-backdrop] .modal');
  if (!dialog) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll(MODAL_FOCUSABLE)].filter((node) => node.offsetParent !== null);
  if (!focusable.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);
render();
