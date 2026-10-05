// OrigoVero passport — behaviour: section tabs that follow the scroll, language sheet, report form states.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Section tabs ---------- */
  const tabsScroll = $('#tabs-scroll');
  const tabs = $$('.tab');
  const sectionIds = tabs.map((a) => a.dataset.target);

  // Current section = the last one whose top has passed just under the sticky header.
  const LINE = 112 + 16;
  const currentSection = () => {
    let current = 'top';
    for (const id of sectionIds) {
      if (id === 'top') continue;
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= LINE) current = id;
    }
    return current;
  };

  let shown = null;
  const markCurrent = (forced) => {
    const now = forced || currentSection();
    if (now === shown) return;
    shown = now;
    tabs.forEach((a) => {
      const on = a.dataset.target === now;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    // Keep the active tab in view inside the sideways-scrolling strip.
    const active = tabs.find((a) => a.dataset.target === now);
    if (active) {
      const left = Math.max(0, active.offsetLeft - 12);
      tabsScroll.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; markCurrent(); });
  }, { passive: true });
  addEventListener('resize', () => markCurrent());
  tabs.forEach((a) => a.addEventListener('click', () => markCurrent(a.dataset.target)));
  markCurrent();

  /* ---------- Language sheet ---------- */
  // UI only: the page copy is not translated in this demo, so <html lang> is left alone.
  const sheet = $('#lang-sheet');
  const openBtn = $('#lang-open');
  const code = $('#lang-code');
  const options = $$('.lang');
  const KEY = 'passport-language';

  const select = (btn, { persist = true } = {}) => {
    options.forEach((o) => o.setAttribute('aria-checked', o === btn ? 'true' : 'false'));
    code.textContent = btn.dataset.code;
    openBtn.setAttribute('aria-label', 'Language: ' + btn.firstChild.textContent.trim());
    if (persist) { try { localStorage.setItem(KEY, btn.dataset.code); } catch (e) { /* storage may be blocked */ } }
  };
  try {
    const saved = localStorage.getItem(KEY);
    const match = options.find((o) => o.dataset.code === saved);
    if (match) select(match, { persist: false });
  } catch (e) { /* storage may be blocked */ }

  // The sheet slides up and the scrim fades in; closing plays the same motion backwards before the dialog is closed.
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  sheet.setAttribute('tabindex', '-1'); // focus lands on the sheet itself, so no ring is drawn on the close button after a tap
  let closing = false;
  const openSheet = () => {
    closing = false;
    sheet.showModal();
    sheet.focus({ preventScroll: true });
    void sheet.offsetHeight; // commit the off-screen start position, then animate in
    sheet.classList.add('is-in');
  };
  const closeSheet = () => {
    if (!sheet.open || closing) return;
    closing = true;
    sheet.classList.remove('is-in');
    const done = () => { if (!closing) return; closing = false; sheet.close(); };
    if (reduceMotion()) { done(); return; }
    sheet.addEventListener('transitionend', (e) => { if (e.target === sheet && e.propertyName === 'transform') done(); }, { once: true });
    setTimeout(done, 450); // safety net if transitionend never fires
  };
  openBtn.addEventListener('click', openSheet);
  $('#lang-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); }); // tap on the scrim
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });     // Esc key
  sheet.addEventListener('close', () => sheet.classList.remove('is-in'));
  options.forEach((o) => o.addEventListener('click', () => { select(o); closeSheet(); }));

  /* ---------- Placeholder links ---------- */
  // The carbon footprint study has no URL in the data yet; keep the link from jumping to the top of the page.
  $$('a[data-todo]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  /* ---------- Report form ---------- */
  const form = $('#report-form');
  const send = $('#send');
  const status = $('#form-status');
  const emailField = $('#email-field');
  const email = $('#email');
  const emailError = $('#email-error');
  const details = $('#details');
  const reason = $('#reason');

  const autosize = (el) => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
  details.addEventListener('input', () => autosize(details));

  [details, email, reason].forEach((el) =>
    el.addEventListener('input', () => el.classList.toggle('is-filled', el.value.trim() !== '')));
  reason.addEventListener('change', () => reason.classList.add('is-filled'));

  const validEmail = (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); // optional field
  const setInvalid = (bad) => {
    emailField.classList.toggle('is-invalid', bad);
    emailError.hidden = !bad;
    email.setAttribute('aria-invalid', bad ? 'true' : 'false');
  };
  email.addEventListener('input', () => { if (emailField.classList.contains('is-invalid') && validEmail(email.value.trim())) setInvalid(false); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validEmail(email.value.trim())) { setInvalid(true); email.focus(); return; }
    setInvalid(false);
    // Loading state. There is no backend in this demo: the request is simulated.
    send.textContent = 'Sending…';
    send.setAttribute('aria-busy', 'true');
    status.textContent = '';
    window.setTimeout(() => {
      send.textContent = 'Send to the brand';
      send.removeAttribute('aria-busy');
      status.textContent = 'Sent. Thank you, the brand will see this.';
      form.reset();
      [details, email, reason].forEach((el) => el.classList.remove('is-filled'));
      autosize(details);
    }, 900);
  });
})();
