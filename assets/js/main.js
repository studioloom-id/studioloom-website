// Studio Loom — shared site behavior (nav scroll state, fade-up reveal, mobile nav toggle).
(function () {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const solid = navbar.classList.contains('solid');
    window.addEventListener('scroll', () => {
      if (!solid) navbar.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Hero slides below are positioned inset:0 and merely opacity:0 — geometrically "in
  // viewport" from the browser's point of view, so loading="lazy" never actually defers
  // them. Instead they ship with no real src at all (see data-src/data-srcset) and we
  // populate those here once the page has finished loading, well ahead of when each
  // slide is actually due to appear.
  function loadDeferredHeroSlides() {
    document.querySelectorAll('.hero-slide:not(.active) picture').forEach((picture) => {
      picture.querySelectorAll('source[data-srcset]').forEach((source) => {
        source.srcset = source.dataset.srcset;
        source.removeAttribute('data-srcset');
      });
      const img = picture.querySelector('img[data-src]');
      if (img) {
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }
  if (document.readyState === 'complete') loadDeferredHeroSlides();
  else window.addEventListener('load', loadDeferredHeroSlides);

  document.querySelectorAll('.hero-slideshow').forEach((slideshow) => {
    const slides = slideshow.querySelectorAll('.hero-slide');
    if (slides.length < 2) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3000);
  });

  document.querySelectorAll('.gallery-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.gallery-track');
    const prev = carousel.querySelector('.gallery-prev');
    const next = carousel.querySelector('.gallery-next');
    if (!track) return;
    const step = () => (track.querySelector('img')?.offsetWidth || 300) + 16;
    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  });
})();
