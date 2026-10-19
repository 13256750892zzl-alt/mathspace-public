(() => {
  const body = document.body;
  const main = document.querySelector('main');
  const menu = document.querySelector('#alche-menu');
  const motion = document.querySelector('#alche-motion');
  const original = document.querySelector('.alche-original-link');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;

  // Keep shared content renderers intact while keeping reader navigation in this edition.
  function rewriteLinks(root) {
    for (const link of root.querySelectorAll('a[href]:not([data-keep-original])')) {
      const href = link.getAttribute('href');
      if (/^(?:\.\/)?paper\.html(?=[?#]|$)/.test(href)) link.setAttribute('href', href.replace('paper.html', 'paper-alche.html'));
      if (/^(?:\.\/)?index\.html(?=[?#]|$)/.test(href)) link.setAttribute('href', href.replace('index.html', 'alche.html'));
    }
  }
  function closeMenu() {
    body.classList.remove('alche-menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '打开导航');
  }
  function syncMotion() {
    const quiet = paused || reduced.matches || document.hidden || !!navigator.connection?.saveData;
    body.dataset.motion = quiet ? 'paused' : 'playing';
    motion.hidden = reduced.matches || !!navigator.connection?.saveData || body.dataset.page !== 'home';
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? '播放背景动画' : '暂停背景动画');
    motion.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    motion.querySelector('.alche-motion-label').textContent = paused ? '背景已暂停' : '暂停背景';
  }
  function syncPage() {
    const route = location.hash.slice(1);
    const reader = location.pathname.endsWith('paper-alche.html');
    body.dataset.page = reader ? 'reader' : ['knowledge', 'practice', 'lab', 'resources'].includes(route) ? route : 'home';
    original.href = (reader ? 'paper.html' : 'index.html') + location.search + location.hash;
    document.querySelector('meta[name="theme-color"]').content = '#030609';
    closeMenu();
    syncMotion();
  }

  rewriteLinks(document);
  new MutationObserver(() => rewriteLinks(main)).observe(main, {childList: true, subtree: true});
  menu.addEventListener('click', () => {
    const open = body.classList.toggle('alche-menu-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  });
  document.querySelector('nav').addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && body.classList.contains('alche-menu-open')) { closeMenu(); menu.focus(); }
  });
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
  window.addEventListener('hashchange', syncPage);
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  syncPage();
})();
