document.addEventListener('DOMContentLoaded', function () {
  // mobile nav toggle
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  // header scroll-shrink
  const headerEl = document.querySelector('header');
  if (headerEl) {
    const onScroll = () => {
      headerEl.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // scroll reveal (staggered within each grid row)
  const reveals = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (!prefersReducedMotion) {
            const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
            const idx = siblings.indexOf(el);
            el.style.transitionDelay = (Math.max(0, idx) % 6) * 70 + 'ms';
          }
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // stat count-up
  const statNums = document.querySelectorAll('.stat-num[data-count]');
  if (statNums.length) {
    const animateCount = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      if (prefersReducedMotion) { el.textContent = target + suffix; return; }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const statIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      statNums.forEach(el => statIo.observe(el));
    } else {
      statNums.forEach(animateCount);
    }
  }

  // tilt + cursor glow for interactive cards
  const tiltSelectors = '.service-card, .why-card, .solution-card, .portfolio-card, .price-card, .testimonial-card';
  const tiltEls = document.querySelectorAll(tiltSelectors);
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    tiltEls.forEach(el => {
      el.classList.add('tilt-card');
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;
        el.style.setProperty('--mx', px + '%');
        el.style.setProperty('--my', py + '%');
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (y / rect.height)) * 8;
        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      });
    });
  } else {
    tiltEls.forEach(el => el.classList.add('tilt-card'));
  }

  // smooth-scroll offset for sticky nav (cross-page and same-page anchors)
  const NAV_OFFSET = 100;
  const scrollToHash = (hash) => {
    if (!hash) return;
    try {
      const target = document.querySelector(hash);
      if (target) {
        const y = target.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;
        window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    } catch (err) { /* invalid selector, ignore */ }
  };
  if (window.location.hash) {
    window.addEventListener('load', () => setTimeout(() => scrollToHash(window.location.hash), 60));
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (hash.length > 1 && document.querySelector(hash)) {
        e.preventDefault();
        scrollToHash(hash);
        history.pushState(null, '', hash);
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(open => {
        if (open !== item) {
          open.classList.remove('open');
          open.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // contact form -> mailto
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const get = id => (document.getElementById(id) ? document.getElementById(id).value : '');
      const name = get('name');
      const email = get('email');
      const phone = get('phone');
      const company = get('company');
      const service = get('service');
      const message = get('message');
      const subject = encodeURIComponent('New project inquiry from ' + name);
      const bodyLines = [
        'Name: ' + name,
        'Email: ' + email,
        phone ? 'Phone: ' + phone : '',
        company ? 'Company: ' + company : '',
        service ? 'Service required: ' + service : '',
        '',
        'Project details:',
        message
      ].filter(Boolean);
      const body = encodeURIComponent(bodyLines.join('\n'));
      window.location.href = 'mailto:yetisoftcompany@gmail.com?subject=' + subject + '&body=' + body;
    });
  }
});
