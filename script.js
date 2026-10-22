// Mobile menu
const toggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Header shadow on scroll
const header = document.querySelector('.header');
addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 10), { passive: true });

// Reveal on scroll
const revealEls = document.querySelectorAll('.section__head, .card, .tile, .split__text, .split__media, .steps li, .gallery figure, .form');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Contact form -> opens mail client (replace with a real backend/form service when going live)
document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = [
    `Jméno: ${f.get('jmeno')}`,
    `Firma: ${f.get('firma') || '-'}`,
    `E-mail: ${f.get('email')}`,
    `Telefon: ${f.get('telefon') || '-'}`,
    `Zájem o náhradní plnění: ${f.get('nahradni') ? 'ano' : 'ne'}`,
    '',
    f.get('zprava'),
  ].join('\n');
  location.href = `mailto:martinvagner1108@gmail.com?subject=${encodeURIComponent('Poptávka z webu')}&body=${encodeURIComponent(body)}`;
});

document.getElementById('year').textContent = new Date().getFullYear();
