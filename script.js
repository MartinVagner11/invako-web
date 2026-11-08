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

// Language dropdown: close on outside click or Escape
const langMenu = document.querySelector('.lang');
if (langMenu) {
  document.addEventListener('click', e => { if (!langMenu.contains(e.target)) langMenu.open = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') langMenu.open = false; });
}

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
const FALLBACK_EMAIL = 'franzova.hana@invako.cz';

// Form messages in the page's language (<html lang="…">)
const MESSAGES = {
  cs: { sending: 'Odesílám…', send: 'Odeslat poptávku', ok: 'Děkujeme! Poptávka byla odeslána, ozveme se vám do 48 hodin.', error: 'Odeslání se nepodařilo. Zkuste to prosím znovu nebo nám napište na' },
  en: { sending: 'Sending…', send: 'Send request', ok: 'Thank you! Your request has been sent – we will get back to you within 48 hours.', error: 'Sending failed. Please try again or write to us at' },
  de: { sending: 'Wird gesendet…', send: 'Anfrage senden', ok: 'Vielen Dank! Ihre Anfrage wurde gesendet – wir melden uns innerhalb von 48 Stunden.', error: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie uns an' },
  pl: { sending: 'Wysyłanie…', send: 'Wyślij zapytanie', ok: 'Dziękujemy! Zapytanie zostało wysłane – odezwiemy się w ciągu 48 godzin.', error: 'Wysyłanie nie powiodło się. Spróbuj ponownie lub napisz do nas na' },
};
const msg = MESSAGES[document.documentElement.lang] || MESSAGES.cs;

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
  button.textContent = msg.sending;
  statusEl.hidden = true;
  try {
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new URLSearchParams(f) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    form.reset();
    showStatus('ok', msg.ok);
  } catch {
    showStatus('error', `${msg.error} ${FALLBACK_EMAIL}.`);
  } finally {
    button.disabled = false;
    button.textContent = msg.send;
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
