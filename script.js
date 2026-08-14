(() => {
  document.documentElement.classList.remove('no-js');

  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const year = document.querySelector('[data-year]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (year) year.textContent = new Date().getFullYear();

  const setHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  // Responsive hero video loader: exactly one media file is requested at a time.
  const responsiveVideo = document.querySelector('[data-responsive-video]');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const videoSources = {
    desktop: responsiveVideo?.dataset.desktopSrc || '/assets/video/hero/kihon-hero-desktop.mp4',
    mobile: responsiveVideo?.dataset.mobileSrc || '/assets/video/hero/kihon-hero-mobile.mp4'
  };
  let currentVideoMode = '';

  const loadHeroVideo = () => {
    if (!responsiveVideo || reduceMotion.matches) return;
    const nextMode = mobileQuery.matches ? 'mobile' : 'desktop';
    if (nextMode === currentVideoMode) return;
    currentVideoMode = nextMode;
    responsiveVideo.pause();
    responsiveVideo.removeAttribute('src');
    responsiveVideo.load();
    responsiveVideo.src = videoSources[nextMode];
    responsiveVideo.load();
    responsiveVideo.play().catch(() => {});
  };

  loadHeroVideo();
  mobileQuery.addEventListener?.('change', loadHeroVideo);
  reduceMotion.addEventListener?.('change', () => {
    if (reduceMotion.matches && responsiveVideo) {
      responsiveVideo.pause();
      responsiveVideo.removeAttribute('src');
      responsiveVideo.load();
    } else {
      currentVideoMode = '';
      loadHeroVideo();
    }
  });

  // Full-screen mobile navigation with focus containment and Escape support.
  let previouslyFocused = null;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    previouslyFocused = document.activeElement;
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.classList.add('is-open');
    const first = mobileMenu.querySelector(focusableSelector);
    window.setTimeout(() => first?.focus(), 120);
  };
  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.classList.remove('is-open');
    mobileMenu.querySelectorAll('.mobile-programs-toggle[aria-expanded="true"]').forEach(button => {
      button.setAttribute('aria-expanded', 'false');
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (panel) panel.hidden = true;
    });
    previouslyFocused?.focus?.();
  };
  menuToggle?.addEventListener('click', () => menuToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());
  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      document.querySelectorAll('[data-dropdown] button[aria-expanded="true"]').forEach(button => button.click());
    }
    if (event.key === 'Tab' && mobileMenu?.classList.contains('is-open')) {
      const items = [...mobileMenu.querySelectorAll(focusableSelector)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Accessible desktop dropdown: hover for pointer users, click/keyboard for everyone.
  document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
    const button = dropdown.querySelector('button');
    const panel = dropdown.querySelector('.dropdown-panel');
    let closeTimer = 0;

    const setDropdown = open => {
      window.clearTimeout(closeTimer);
      button?.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
    };

    button?.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      setDropdown(!open);
    });

    dropdown.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') setDropdown(true);
    });
    dropdown.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      closeTimer = window.setTimeout(() => setDropdown(false), 180);
    });
    dropdown.addEventListener('focusin', () => setDropdown(true));
    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) setDropdown(false);
    });
  });

  // Mobile Programs accordion.
  document.querySelectorAll('[data-mobile-accordion]').forEach(accordion => {
    const button = accordion.querySelector('.mobile-programs-toggle');
    const panel = accordion.querySelector('.mobile-programs-panel');
    button?.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      if (panel) panel.hidden = open;
    });
  });

  // Story index image swap: hover/focus on pointer devices; viewport-center activation on touch devices.
  const storyIndexCards = [...document.querySelectorAll('.story-index-card')];
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)');
  let storyScrollTicking = false;

  const updateStoryIndexInView = () => {
    storyScrollTicking = false;
    if (!storyIndexCards.length || !coarsePointer.matches) {
      storyIndexCards.forEach(card => card.classList.remove('is-inview'));
      return;
    }
    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let closestDistance = Infinity;
    storyIndexCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = card;
      }
    });
    storyIndexCards.forEach(card => card.classList.toggle('is-inview', card === closest));
  };

  const requestStoryIndexUpdate = () => {
    if (storyScrollTicking) return;
    storyScrollTicking = true;
    window.requestAnimationFrame(updateStoryIndexInView);
  };

  if (storyIndexCards.length) {
    updateStoryIndexInView();
    window.addEventListener('scroll', requestStoryIndexUpdate, { passive: true });
    window.addEventListener('resize', requestStoryIndexUpdate, { passive: true });
    coarsePointer.addEventListener?.('change', updateStoryIndexInView);
  }

  // Reveal animations.
  const revealEls = document.querySelectorAll('.reveal');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Lightweight parallax: transform only, requestAnimationFrame throttled.
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  const updateParallax = () => {
    if (reduceMotion.matches) return;
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const speed = Number(el.dataset.speed || 0.06);
      const axis = el.dataset.axis === 'x' ? 'x' : 'y';
      const offset = (rect.top - vh / 2) * speed;
      const target = el.matches('img,video') ? el : el.querySelector('img,video');
      const transform = axis === 'x'
        ? `translate3d(${offset}px, 0, 0)`
        : `translate3d(0, ${offset}px, 0)`;
      if (target) target.style.transform = transform;
      else el.style.transform = transform;
    });
    ticking = false;
  };
  const requestParallax = () => {
    if (!ticking) { window.requestAnimationFrame(updateParallax); ticking = true; }
  };
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax, { passive: true });
  updateParallax();
})();
