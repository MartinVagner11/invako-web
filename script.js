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

// Contact form
// FORM_ENDPOINT = URL of the deployed Google Apps Script web app (poptavka-apps-script.gs).
// While it's empty, the form falls back to opening the visitor's mail client.
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxh3Wweq4yudQHTZxFYpLXS7BLw14WR5nJF6AGfUhuIVGGEn60BK_pTtWiTOKondyCA/exec';
const FALLBACK_EMAIL = 'martinvagner1108@gmail.com';

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

function showStatus(type, text) {
  statusEl.hidden = false;
  statusEl.className = `form__status form__status--${type}`;
  statusEl.textContent = text;
}

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(form);

  if (!FORM_ENDPOINT) {
    const body = [
      `Jméno: ${f.get('jmeno')}`,
      `Firma: ${f.get('firma') || '-'}`,
      `E-mail: ${f.get('email')}`,
      `Telefon: ${f.get('telefon') || '-'}`,
      `Zájem o náhradní plnění: ${f.get('nahradni') ? 'ano' : 'ne'}`,
      '',
      f.get('zprava'),
    ].join('\n');
    location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('Poptávka z webu')}&body=${encodeURIComponent(body)}`;
    return;
  }

  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  button.textContent = 'Odesílám…';
  statusEl.hidden = true;
  try {
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new URLSearchParams(f) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    form.reset();
    showStatus('ok', 'Děkujeme! Poptávka byla odeslána, ozveme se vám do 48 hodin.');
  } catch {
    showStatus('error', `Odeslání se nepodařilo. Zkuste to prosím znovu nebo nám napište na ${FALLBACK_EMAIL}.`);
  } finally {
    button.disabled = false;
    button.textContent = 'Odeslat poptávku';
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
