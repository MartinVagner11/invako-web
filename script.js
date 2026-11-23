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
const FALLBACK_EMAIL = 'info@invako.cz';

// Form messages in the page's language (<html lang="…">)
const MESSAGES = {
  cs: { sending: 'Odesílám…', send: 'Odeslat poptávku', ok: 'Děkujeme! Poptávka byla odeslána, ozveme se vám do 48 hodin.', error: 'Odeslání se nepodařilo. Zkuste to prosím znovu nebo nám napište na' },
  en: { sending: 'Sending…', send: 'Send request', ok: 'Thank you! Your request has been sent – we will get back to you within 48 hours.', error: 'Sending failed. Please try again or write to us at' },
  de: { sending: 'Wird gesendet…', send: 'Anfrage senden', ok: 'Vielen Dank! Ihre Anfrage wurde gesendet – wir melden uns innerhalb von 48 Stunden.', error: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie uns an' },
  pl: { sending: 'Wysyłanie…', send: 'Wyślij zapytanie', ok: 'Dziękujemy! Zapytanie zostało wysłane – odezwiemy się w ciągu 48 godzin.', error: 'Wysyłanie nie powiodło się. Spróbuj ponownie lub napisz do nas na' },
};
const msg = MESSAGES[document.documentElement.lang] || MESSAGES.cs;

// Vlastní hlášky u povinných polí (místo šedé bubliny prohlížeče), v jazyce stránky
const FIELD_ERRORS = {
  cs: { required: 'Vyplňte prosím toto pole.', email: 'Zadejte prosím platný e-mail, např. jmeno@firma.cz.', phone: 'Zadejte prosím platné telefonní číslo.' },
  en: { required: 'Please fill in this field.', email: 'Please enter a valid e-mail, e.g. name@company.com.', phone: 'Please enter a valid phone number.' },
  de: { required: 'Bitte füllen Sie dieses Feld aus.', email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein, z. B. name@firma.de.', phone: 'Bitte geben Sie eine gültige Telefonnummer ein.' },
  pl: { required: 'Proszę wypełnić to pole.', email: 'Proszę podać prawidłowy e-mail, np. imie@firma.pl.', phone: 'Proszę podać prawidłowy numer telefonu.' },
};
const fieldMsg = FIELD_ERRORS[document.documentElement.lang] || FIELD_ERRORS.cs;

function fieldProblem(input) {
  const v = input.value.trim();
  if (!v) return fieldMsg.required;
  if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return fieldMsg.email;
  if (input.type === 'tel' && v.replace(/\D/g, '').length < 6) return fieldMsg.phone;
  return '';
}

function setFieldError(input, text) {
  const label = input.closest('label');
  let el = label.querySelector('.field-error');
  input.classList.toggle('is-invalid', !!text);
  input.setAttribute('aria-invalid', text ? 'true' : 'false');
  if (!text) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('span');
    el.className = 'field-error';
    el.setAttribute('role', 'alert');
    label.append(el);
  }
  el.textContent = text;
}

function validateForm(form) {
  let first = null;
  form.querySelectorAll('[required]').forEach(input => {
    const problem = fieldProblem(input);
    setFieldError(input, problem);
    if (problem && !first) first = input;
  });
  first?.focus();
  return !first;
}

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

if (form) {
  form.noValidate = true; // bez bubliny prohlížeče, hlášky ukazujeme sami
  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) setFieldError(input, fieldProblem(input)); });
  });
}

form?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateForm(form)) return;
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

// ===== Cookies: souhlas podle zákona č. 127/2005 Sb. (§ 89 odst. 3) a GDPR =====
// Web sám ukládá jen nezbytné údaje (tuto volbu). Jediný obsah, který potřebuje souhlas,
// je mapa Google (Street View) na stránce Kontakt – Google při ní ukládá své cookies.
// Volba se ukládá v prohlížeči na 12 měsíců; při změně COOKIE_VERSION se lišta ukáže znovu.
const COOKIE_KEY = 'invako_cookies';
const COOKIE_VERSION = 1;
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

const COOKIE_TEXT = {
  cs: {
    title: 'Cookies na tomto webu',
    text: 'Náš web používá jen nezbytné ukládání dat, které potřebuje ke svému fungování. Mapu Google na stránce Kontakt, která ukládá cookies společnosti Google, načteme jen s vaším souhlasem.',
    more: 'Více o ochraně osobních údajů',
    accept: 'Přijmout vše', reject: 'Odmítnout vše', settings: 'Nastavení', save: 'Uložit nastavení',
    necessary: 'Nezbytné', necessaryText: 'Zajišťují základní funkce webu a uložení této volby. Nelze je vypnout.', always: 'Vždy zapnuto',
    maps: 'Mapy Google', mapsText: 'Zobrazení mapy Street View na stránce Kontakt. Google při tom ukládá své cookies.',
  },
  en: {
    title: 'Cookies on this website',
    text: 'Our website only uses the essential data storage it needs to work. The Google map on the Contact page, which stores Google cookies, is only loaded with your consent.',
    more: 'More about data protection',
    accept: 'Accept all', reject: 'Reject all', settings: 'Settings', save: 'Save settings',
    necessary: 'Essential', necessaryText: 'Needed for the basic functions of the website and to remember this choice. They cannot be switched off.', always: 'Always on',
    maps: 'Google Maps', mapsText: 'Shows the Street View map on the Contact page. Google stores its own cookies when it does so.',
  },
  de: {
    title: 'Cookies auf dieser Website',
    text: 'Unsere Website nutzt nur die technisch notwendige Datenspeicherung. Die Google-Karte auf der Kontaktseite, die Cookies von Google speichert, laden wir nur mit Ihrer Einwilligung.',
    more: 'Mehr zum Datenschutz',
    accept: 'Alle akzeptieren', reject: 'Alle ablehnen', settings: 'Einstellungen', save: 'Einstellungen speichern',
    necessary: 'Notwendig', necessaryText: 'Für die Grundfunktionen der Website und zum Speichern dieser Auswahl. Sie können nicht deaktiviert werden.', always: 'Immer aktiv',
    maps: 'Google Maps', mapsText: 'Anzeige der Street-View-Karte auf der Kontaktseite. Google speichert dabei eigene Cookies.',
  },
  pl: {
    title: 'Pliki cookies na tej stronie',
    text: 'Nasza strona korzysta tylko z niezbędnego przechowywania danych potrzebnego do jej działania. Mapę Google na stronie Kontakt, która zapisuje pliki cookies firmy Google, wczytamy tylko za Twoją zgodą.',
    more: 'Więcej o ochronie danych osobowych',
    accept: 'Akceptuj wszystkie', reject: 'Odrzuć wszystkie', settings: 'Ustawienia', save: 'Zapisz ustawienia',
    necessary: 'Niezbędne', necessaryText: 'Zapewniają podstawowe funkcje strony i zapamiętanie tego wyboru. Nie można ich wyłączyć.', always: 'Zawsze włączone',
    maps: 'Mapy Google', mapsText: 'Wyświetlenie mapy Street View na stronie Kontakt. Google zapisuje przy tym własne pliki cookies.',
  },
};
const ct = COOKIE_TEXT[document.documentElement.lang] || COOKIE_TEXT.cs;

function readConsent() {
  try {
    const c = JSON.parse(localStorage.getItem(COOKIE_KEY));
    if (!c || c.v !== COOKIE_VERSION || Date.now() - new Date(c.t).getTime() > COOKIE_MAX_AGE) return null;
    return c;
  } catch { return null; }
}

function saveConsent(maps) {
  const had = readConsent();
  try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ v: COOKIE_VERSION, t: new Date().toISOString(), maps })); } catch {}
  // Odvolání souhlasu s mapou: obnovit stránku, aby mapa (a její skripty) zmizela
  if (had?.maps && !maps && document.querySelector('[data-consent-map] iframe[src]')) location.reload();
  applyConsent(maps);
}

function applyConsent(maps) {
  document.querySelectorAll('[data-consent-map]').forEach(box => {
    const frame = box.querySelector('iframe');
    if (maps && !frame.src) frame.src = frame.dataset.src;
    frame.hidden = !maps;
    box.querySelector('.map-consent').hidden = maps;
  });
}

function buildCookieBar() {
  const bar = document.createElement('section');
  bar.className = 'cookie-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', ct.title);
  bar.innerHTML = `
    <div class="cookie-bar__inner">
      <p class="cookie-bar__title">${ct.title}</p>
      <p class="cookie-bar__text">${ct.text} <a href="ochrana-osobnich-udaju.html#cookies">${ct.more}</a></p>
      <div class="cookie-bar__settings" hidden>
        <label class="cookie-opt">
          <input type="checkbox" checked disabled>
          <span><strong>${ct.necessary}</strong> <em>${ct.always}</em><br>${ct.necessaryText}</span>
        </label>
        <label class="cookie-opt">
          <input type="checkbox" data-opt="maps">
          <span><strong>${ct.maps}</strong><br>${ct.mapsText}</span>
        </label>
      </div>
      <div class="cookie-bar__buttons">
        <button type="button" class="cookie-btn" data-cookie="reject">${ct.reject}</button>
        <button type="button" class="cookie-btn" data-cookie="settings">${ct.settings}</button>
        <button type="button" class="cookie-btn" data-cookie="accept">${ct.accept}</button>
      </div>
    </div>`;
  document.body.append(bar);
  const settings = bar.querySelector('.cookie-bar__settings');
  const mapsBox = bar.querySelector('[data-opt="maps"]');
  const settingsBtn = bar.querySelector('[data-cookie="settings"]');
  const close = (maps) => { saveConsent(maps); bar.hidden = true; };
  bar.querySelector('[data-cookie="accept"]').onclick = () => close(true);
  bar.querySelector('[data-cookie="reject"]').onclick = () => close(false);
  settingsBtn.onclick = () => {
    if (settings.hidden) { settings.hidden = false; settingsBtn.textContent = ct.save; }
    else close(mapsBox.checked);
  };
  return {
    open(withSettings) {
      mapsBox.checked = !!readConsent()?.maps;
      settings.hidden = !withSettings;
      settingsBtn.textContent = withSettings ? ct.save : ct.settings;
      bar.hidden = false;
      bar.querySelector('button').focus();
    },
  };
}

const cookieBar = buildCookieBar();
const consent = readConsent();
applyConsent(!!consent?.maps);
document.querySelector('.cookie-bar').hidden = !!consent; // lišta jen dokud není volba uložená

// Patička: „Nastavení cookies“ znovu otevře lištu s volbami
document.querySelectorAll('[data-cookie-settings]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  cookieBar.open(true);
}));
// Tlačítko „Zobrazit mapu“ přímo u mapy = souhlas jen s mapou
document.querySelectorAll('[data-load-map]').forEach(b => b.addEventListener('click', () => {
  saveConsent(true);
  document.querySelector('.cookie-bar').hidden = true;
}));
