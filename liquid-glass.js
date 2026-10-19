(() => {
  const video = document.querySelector('#ambient-video');
  const toggle = document.querySelector('#motion-toggle');
  const home = document.querySelector('#home');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!video || !toggle || !home) return;
  let userPaused = false, failed = false, frame = 0, restart = 0, fadingOut = false;
  const shouldPlay = () => !userPaused && !failed && !reduced.matches && !navigator.connection?.saveData && !document.hidden && !home.hidden;
  function updateToggle() {
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? '播放背景动画' : '暂停背景动画');
    toggle.title = userPaused ? '背景已暂停，点击继续播放' : '暂停首页背景视频，不影响学习功能';
    toggle.firstElementChild.textContent = userPaused ? '▷' : 'Ⅱ';
    toggle.querySelector('.motion-label').textContent = userPaused ? '背景已暂停' : '暂停背景';
  }
  function fade(to) {
    cancelAnimationFrame(frame);
    const from = Number(video.style.opacity || 0), start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / 500, 1);
      video.style.opacity = from + (to - from) * progress;
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    clearTimeout(restart);
    toggle.hidden = reduced.matches || failed || !!navigator.connection?.saveData;
    updateToggle();
    if (!shouldPlay()) {
      video.pause(); cancelAnimationFrame(frame);
      if (reduced.matches) video.style.opacity = '0';
      return;
    }
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    // shortcut: autoplay can be blocked by the browser; keep the poster and allow a manual retry.
    video.play().catch(() => {
      if (!shouldPlay()) return;
      userPaused = true; updateToggle();
    });
  }
  video.muted = true;
  video.addEventListener('playing', () => { fadingOut = false; fade(1); });
  video.addEventListener('timeupdate', () => {
    if (!fadingOut && !video.paused && video.duration - video.currentTime <= .55) { fadingOut = true; fade(0); }
  });
  video.addEventListener('ended', () => {
    cancelAnimationFrame(frame); video.style.opacity = '0';
    restart = setTimeout(() => { if (shouldPlay()) { video.currentTime = 0; sync(); } }, 100);
  });
  video.addEventListener('error', () => { failed = true; video.style.opacity = '0'; sync(); });
  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(sync).observe(home, { attributes: true, attributeFilter: ['hidden'] });
  sync();
})();
