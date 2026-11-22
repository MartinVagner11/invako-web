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
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwz3CT81mtiqBkAnRPwY3jqx9EYmgoiose_lnGGSRUgll6_OiJLCL__FDtix1MONv5a/exec';
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

// Phone prefix: preselect by page language, then merge prefix + number on submit
const prefixSelect = form?.querySelector('select[name=predvolba]');
const PREFIX_BY_LANG = { de: '+49', pl: '+48' };
if (prefixSelect && PREFIX_BY_LANG[document.documentElement.lang]) prefixSelect.value = PREFIX_BY_LANG[document.documentElement.lang];

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(form);
  const number = (f.get('telefon') || '').trim();
  f.set('telefon', number ? `${f.get('predvolba') || ''} ${number}`.trim() : '');
  f.delete('predvolba');

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

// Realizace: malé fotky pod velkou – klik prohodí s velkou, šipky na velké fotce je točí dokola
const mainPhoto = document.querySelector('[data-main-photo]');
if (mainPhoto) {
  const thumbs = [];
  const cleanStyle = (el) => el.getAttribute('style').replace(/;?\s*opacity:[^;]*;?/, '');
  const fade = (change) => {
    mainPhoto.style.opacity = 0;
    setTimeout(() => { change(); mainPhoto.style.opacity = 1; }, 200);
  };
  // posun dokola: dir = 1 další, -1 předchozí
  const rotate = (dir) => fade(() => {
    const slots = [mainPhoto, ...thumbs];
    const styles = slots.map(cleanStyle);
    slots.forEach((el, k) => el.setAttribute('style', styles[(k + dir + styles.length) % styles.length]));
  });
  const addArrows = () => {
    if (mainPhoto.querySelector('.photo-arrow')) return;
    [['prev', '‹', -1], ['next', '›', 1]].forEach(([cls, label, dir]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `photo-arrow photo-arrow--${cls}`;
      b.setAttribute('aria-label', dir < 0 ? 'Předchozí fotka' : 'Další fotka');
      b.textContent = label;
      b.addEventListener('click', () => rotate(dir));
      mainPhoto.appendChild(b);
    });
  };
  document.querySelectorAll('.service-gallery figure[data-full]').forEach((fig) => {
    const test = new Image();
    test.onload = () => {
      fig.classList.add('has-photo');
      thumbs.push(fig);
      thumbs.sort((a, b) => a.dataset.full.localeCompare(b.dataset.full, undefined, { numeric: true }));
      addArrows();
      fig.addEventListener('click', () => fade(() => {
        const big = cleanStyle(mainPhoto);
        mainPhoto.setAttribute('style', fig.getAttribute('style'));
        fig.setAttribute('style', big);
      }));
    };
    test.src = fig.dataset.full;
  });
}

// Video: na konci se zastaví a ukáže šipku „přehrát znovu“
document.querySelectorAll('.service-video').forEach((box) => {
  const video = box.querySelector('video');
  const replay = box.querySelector('.video-replay');
  video.addEventListener('ended', () => { replay.hidden = false; });
  replay.addEventListener('click', () => {
    replay.hidden = true;
    video.currentTime = 0;
    video.play();
  });
});
