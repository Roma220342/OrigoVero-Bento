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
    // At the very bottom the last section can never reach the top line, so it counts as current.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) return sectionIds[sectionIds.length - 1];
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
  // After a tap the page scrolls smoothly past other sections. The tapped tab is held until the scroll settles,
  // so the strip does not flicker through every section on the way.
  let held = null;
  let holdTimer = null;
  const release = () => { held = null; markCurrent(); };
  const hold = (target) => { held = target; clearTimeout(holdTimer); holdTimer = setTimeout(release, 250); };
  addEventListener('scroll', () => {
    if (held) { clearTimeout(holdTimer); holdTimer = setTimeout(release, 160); return; }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; markCurrent(); });
  }, { passive: true });
  addEventListener('resize', () => markCurrent());
  tabs.forEach((a) => {
    a.dataset.text = a.textContent; // lets CSS reserve the bold width, so the active tab never changes the strip width
    a.addEventListener('click', () => { hold(a.dataset.target); markCurrent(a.dataset.target); });
  });
  markCurrent();

  /* ---------- Smooth expand and collapse (journey steps, FAQ) ---------- */
  // The height of the <details> animates between its closed and open size and the panel fades.
  // `open` stays set while closing, so the `.is-closing` class carries the closed look (chevron, plus/minus) at once.
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const toggleDetails = (d) => {
    const panel = d.querySelector('summary').nextElementSibling;
    if (d._anim) d._anim.cancel();
    if (panel) panel.getAnimations().forEach((x) => x.cancel());
    const opening = !d.open;
    const start = d.getBoundingClientRect().height;
    let end;
    if (opening) { d.open = true; end = d.getBoundingClientRect().height; }
    else { d.open = false; end = d.getBoundingClientRect().height; d.open = true; } // measure closed, then keep it open while animating
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || start === end) { d.open = opening; d.classList.remove('is-closing'); return; }
    d.classList.toggle('is-closing', !opening);
    d.style.overflow = 'hidden';
    const grow = d.animate({ height: [start + 'px', end + 'px'] }, { duration: opening ? 340 : 280, easing: EASE });
    if (panel) panel.animate({ opacity: opening ? [0, 1] : [1, 0] }, { duration: opening ? 260 : 160, delay: opening ? 70 : 0, easing: 'ease-out', fill: 'both' });
    d._anim = grow;
    const finish = () => { if (d._anim !== grow) return; d._anim = null; d.open = opening; d.classList.remove('is-closing'); d.style.overflow = ''; grow.cancel(); if (panel) panel.getAnimations().forEach((x) => x.cancel()); };
    grow.onfinish = finish;
    setTimeout(finish, (opening ? 340 : 280) + 80); // safety net if the animation never reports finished (hidden tab)
    grow.oncancel = () => { if (d._anim === grow) { d._anim = null; d.style.overflow = ''; } };
  };
  $$('details.step__content, details.faq').forEach((d) => {
    d.querySelector('summary').addEventListener('click', (e) => { e.preventDefault(); toggleDetails(d); });
  });

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

  // Swipe down on the sheet to dismiss it: it follows the finger, then either flies out or springs back.
  // A swipe that starts inside a scrolled list scrolls the list instead.
  const list = $('#lang-list');
  let drag = null;
  sheet.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || closing) return;
    drag = { y: e.touches[0].clientY, t: performance.now(), dy: 0, active: false, inList: !!e.target.closest('.lang-list') };
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (!drag) return;
    const dy = e.touches[0].clientY - drag.y;
    if (!drag.active) {
      if (dy < -4 || (drag.inList && list.scrollTop > 0)) { drag = null; return; }  // scrolling up, or the list has its own scroll
      if (dy <= 4) return;
      drag.active = true;
      sheet.style.transition = 'none';
    }
    e.preventDefault();
    drag.dy = Math.max(0, dy);
    sheet.style.transform = 'translateY(' + drag.dy + 'px)';
  }, { passive: false });
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    const speed = d.dy / Math.max(1, performance.now() - d.t); // px per ms
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (d.dy > 110 || (d.dy > 40 && speed > 0.55)) closeSheet(); // the CSS transition continues from where the finger let go
  };
  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);

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
