'use strict';
(() => {
  const shapes = {
    circle: '<circle cx="10" cy="10" r="6"/>',
    ellipse: '<ellipse cx="10" cy="10" rx="7" ry="4.5" transform="rotate(-25 10 10)"/>',
    parabola: '<path d="M15 3Q-5 10 15 17"/>',
    hyperbola: '<path d="M3 3q12 7 0 14M17 3q-12 7 0 14"/>'
  };
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 20 20" aria-hidden="true">${shapes[button.dataset.preset]}</svg>`);
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const elements = document.querySelectorAll('.reveal');
  if (!reduced.matches && typeof IntersectionObserver === 'function') {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .04 });
    elements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', Math.min(index * 35, 210) + 'ms');
      observer.observe(element);
    });
    reduced.addEventListener('change', event => {
      if (event.matches) { observer.disconnect(); elements.forEach(element => element.classList.add('is-visible')); }
    });
  }
  document.documentElement.dataset.designReady = 'true';
})();
