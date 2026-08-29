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
