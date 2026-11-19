/* TKJ.dev — interactions & motion. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mq = (q) => window.matchMedia(q);
  const reduced = mq('(prefers-reduced-motion: reduce)').matches;
  const finePointer = mq('(hover: hover) and (pointer: fine)').matches;

  // One shared scroll/resize loop for every scroll-driven effect.
  const onScroll = [];
  const onResize = [];
  let ticking = false;
  const runScroll = () => {
    ticking = false;
    const y = window.scrollY;
    onScroll.forEach((fn) => fn(y));
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runScroll);
    }
  }, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      onResize.forEach((fn) => fn());
      runScroll();
    }, 120);
  });

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'split-w';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'split-i';
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- hero entrance timing ---------- */
  const hero = $('[data-hero]') || $('.phero');
  if (hero) {
    const delays = [
      ['.kicker', 0],
      ['[data-split]', 0.12],
      ['.hero-visual', 0.35],
      ['.hero-lead, .phero-lead', 0.55],
      ['.hero-actions', 0.7],
      ['.hero-foot', 0.95],
    ];
    delays.forEach(([sel, d]) => $$(sel, hero).forEach((el) => el.style.setProperty('--d', d + 's')));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-split]');
  revealEls.forEach((el) => {
    if (el.style.getPropertyValue('--d')) return;
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--d', Math.min(idx, 6) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- header: solid on scroll, hide on scroll down ---------- */
  const header = $('[data-header]');
  const progress = $('[data-progress]');
  let lastY = window.scrollY;
  onScroll.push((y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 20);
    const menuOpen = document.body.classList.contains('menu-open');
    if (!menuOpen) {
      if (y > lastY + 4 && y > 240) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 240) header.classList.remove('is-hidden');
    }
    lastY = y;
  });

  /* ---------- full-screen menu ---------- */
  const menu = $('[data-menu]');
  const burger = $('[data-menu-toggle]');
  if (menu && burger) {
    const label = $('.burger-text', burger);
    $$('.menu-list li', menu).forEach((li, i) => li.firstElementChild.style.setProperty('--i', i));
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      label.textContent = open ? label.dataset.close : label.dataset.open;
      if (open) menu.removeAttribute('inert');
      else menu.setAttribute('inert', '');
      if (open) setTimeout(() => $('.menu-list a', menu)?.focus({ preventScroll: true }), 400);
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setMenu(false);
        burger.focus();
      }
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    mq('(min-width: 1025px)').addEventListener('change', (e) => e.matches && setMenu(false));
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduced) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor is-hidden';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-ring"></span><span class="cursor-dot"></span>';
    document.body.appendChild(cursor);
    const ring = $('.cursor-ring', cursor);
    const dot = $('.cursor-dot', cursor);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseover', (e) => {
      const hit = e.target.closest('a, button, [data-cursor], .chip-radio, input[type="checkbox"]');
      cursor.classList.toggle('is-link', !!hit);
    });
    const loop = () => {
      rx = lerp(rx, mx, 0.35);
      ry = lerp(ry, my, 0.35);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- hero: interactive dot field + diagram parallax ---------- */
  const canvas = $('[data-dots]');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const heroEl = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, dots = [], visible = true;
    let pointer = { x: -9999, y: -9999 };
    const GAP = 30;

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = heroEl.clientWidth;
      h = heroEl.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y });
    };
    const draw = (time = 0) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = clamp(1 - dist / 120);
        const wave = reduced ? 0 : (Math.sin(d.x * 0.012 + time * 0.0012) + Math.cos(d.y * 0.014 + time * 0.0009)) * 0.5;
        const push = near * 4;
        const x = d.x + (dist ? (dx / dist) * push : 0);
        const y = d.y + (dist ? (dy / dist) * push : 0);
        const r = 0.9 + near * 0.9 + wave * 0.25;
        const a = 0.12 + near * 0.3 + wave * 0.04;
        ctx.fillStyle = near > 0.05 ? `rgba(34, 211, 238, ${a})` : `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(r, 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const frame = (t) => {
      if (visible) draw(t);
      requestAnimationFrame(frame);
    };
    setup();
    onResize.push(setup);
    if (reduced) {
      draw();
    } else {
      requestAnimationFrame(frame);
      new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(heroEl);
    }

    const visual = $('.hero-visual', heroEl);
    if (finePointer) {
      heroEl.addEventListener('mousemove', (e) => {
        const r = heroEl.getBoundingClientRect();
        pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        if (visual && !reduced) {
          visual.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          visual.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        }
      });
      heroEl.addEventListener('mouseleave', () => (pointer = { x: -9999, y: -9999 }));
    }
  }
  if (reduced) $$('svg.diagram').forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());

  /* ---------- marquee reacts to scroll velocity & direction ---------- */
  if (!reduced) {
    const tracks = $$('[data-marquee] .mq-track');
    if (tracks.length) {
      let prevY = window.scrollY, dir = 1, rate = 1;
      const tick = () => {
        const y = window.scrollY;
        const v = y - prevY;
        prevY = y;
        if (v > 1) dir = 1;
        else if (v < -1) dir = -1;
        const target = dir * (1 + Math.min(Math.abs(v) / 12, 5));
        rate = lerp(rate, target, 0.08);
        tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = rate)));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- horizontal pinned section ---------- */
  $$('[data-hscroll]').forEach((section) => {
    const track = $('[data-hs-track]', section);
    const viewport = $('.hs-viewport', section);
    const counter = $('[data-hs-current]', section);
    const bar = $('[data-hs-bar]', section);
    const cards = $$('.pcard', section);
    const desktop = mq('(min-width: 1025px)');
    let dist = 0, pinned = false;

    const setState = (p) => {
      bar?.parentElement.style.setProperty('--hp', p.toFixed(4));
      if (counter) counter.textContent = String(Math.round(p * (cards.length - 1)) + 1).padStart(2, '0');
    };
    const layout = () => {
      pinned = desktop.matches && !reduced;
      section.classList.toggle('is-pinned', pinned);
      track.style.transform = '';
      if (pinned) {
        dist = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.height = window.innerHeight + dist + 'px';
      } else {
        section.style.height = '';
      }
    };
    onScroll.push(() => {
      if (!pinned) return;
      const r = section.getBoundingClientRect();
      const p = clamp(-r.top / (section.offsetHeight - window.innerHeight || 1));
      track.style.transform = `translate3d(${-dist * p}px, 0, 0)`;
      setState(p);
    });
    viewport.addEventListener('scroll', () => {
      if (pinned) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      setState(max > 0 ? viewport.scrollLeft / max : 0);
    }, { passive: true });
    layout();
    onResize.push(layout);
    desktop.addEventListener('change', layout);
  });

  /* ---------- process line fills while scrolling ---------- */
  $$('[data-progress-line]').forEach((flow) => {
    const steps = $$('[data-step]', flow);
    onScroll.push(() => {
      const r = flow.getBoundingClientRect();
      const center = window.innerHeight * 0.6;
      const p = clamp((center - r.top) / r.height);
      flow.style.setProperty('--p', p.toFixed(4));
      steps.forEach((s) => s.classList.toggle('is-active', s.getBoundingClientRect().top < center));
    });
  });

  /* ---------- statement: words light up while scrolling ---------- */
  $$('[data-scrub]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = '';
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    onScroll.push(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    });
  });

  /* ---------- lab terminal typer ---------- */
  $$('[data-typer]').forEach((el) => {
    if (reduced) return;
    const lines = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((l) => l.replace(/<[^>]+>/g, '').replace(/^\$\s*/, '').trim())
      .filter(Boolean);
    let started = false;
    const run = async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (;;) {
        el.innerHTML = '';
        for (const line of lines) {
          const row = document.createElement('div');
          row.innerHTML = '<span class="c-muted">$</span> <span class="t"></span><span class="caret"></span>';
          el.appendChild(row);
          const t = $('.t', row);
          for (const ch of line) {
            t.textContent += ch;
            await wait(38 + Math.random() * 50);
          }
          await wait(500);
          $('.caret', row).remove();
          const ok = document.createElement('div');
          ok.className = 'c-muted';
          ok.textContent = '  … in progress';
          el.appendChild(ok);
          await wait(350);
        }
        const last = document.createElement('div');
        last.innerHTML = '<span class="c-muted">$</span> <span class="caret"></span>';
        el.appendChild(last);
        await wait(4000);
      }
    };
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting && !started) {
        started = true;
        obs.disconnect();
        run();
      }
    }).observe(el);
  });

  /* ---------- back to top ---------- */
  $('[data-to-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- project filters ---------- */
  const filters = $('[data-filters]');
  const grid = $('[data-project-grid]');
  if (filters && grid) {
    const empty = $('[data-empty-filter]');
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      const type = btn.dataset.filter;
      $$('[data-filter]', filters).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let visible = 0;
      $$('[data-type]', grid).forEach((card) => {
        const show = type === 'all' || card.dataset.type === type;
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
  }

  runScroll();

  /* ---------- contact form ---------- */
  const form = $('[data-contact-form]');
  if (!form) return;

  const t = JSON.parse($('[data-form-i18n]', form)?.textContent || '{}');
  const status = $('[data-form-status]', form);
  const submitBtn = $('button[type="submit"]', form);
  const submitLabel = $('.btn-label', submitBtn);
  const endpoint = form.dataset.endpoint;
  const email = form.dataset.email;
  const loadedAt = Date.now();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const errors = t.errors || {};

  $$('[data-autosize]', form).forEach((ta) => {
    const fit = () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 2 + 'px';
    };
    ta.addEventListener('input', fit);
  });

  const setStatus = (state, msg) => {
    status.dataset.state = state;
    status.textContent = msg;
  };

  // A "control" is a single input/textarea, or a required radio group (fieldset).
  const controls = [
    ...$$('input[type="text"]:not([name="website"]), input[type="email"], textarea, input[type="checkbox"]', form).map((el) => ({
      el,
      container: el.closest('.field'),
      focusEl: el,
      validate() {
        if (el.type === 'checkbox') return el.required && !el.checked ? errors.privacy : '';
        const v = el.value.trim();
        if (el.required && !v) return errors.required;
        if (el.type === 'email' && v && !EMAIL_RE.test(v)) return errors.email;
        if (el.name === 'message' && v && v.length < 20) return errors.minMessage;
        return '';
      },
    })),
    ...$$('fieldset[data-group]', form).map((fs) => ({
      el: fs,
      container: fs,
      focusEl: $('input', fs),
      validate() {
        return $('input:checked', fs) ? '' : errors.required;
      },
    })),
  ];

  const clearError = (c) => {
    c.el.removeAttribute('aria-invalid');
    $('.field-error', c.container)?.remove();
  };
  const showError = (c, msg) => {
    clearError(c);
    c.el.setAttribute('aria-invalid', 'true');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.id = (c.el.id || c.el.dataset.group) + '-error';
    err.textContent = msg;
    c.container.appendChild(err);
    (c.focusEl || c.el).setAttribute('aria-describedby', err.id);
  };
  const check = (c) => {
    const msg = c.validate();
    if (msg) showError(c, msg);
    else clearError(c);
    return !msg;
  };

  controls.forEach((c) => {
    const evt = c.el.tagName === 'FIELDSET' || c.el.type === 'checkbox' ? 'change' : 'blur';
    c.el.addEventListener(evt, () => check(c));
  });

  const readableText = () => {
    const labels = t.labels || {};
    const data = new FormData(form);
    const lines = [];
    for (const name of ['name', 'email', 'company', 'country', 'service', 'budget', 'timeline']) {
      let v = (data.get(name) || '').toString().trim();
      if (!v) continue;
      const radio = $(`input[name="${name}"]:checked`, form);
      if (radio) v = radio.nextElementSibling.textContent;
      lines.push(`${labels[name] || name}: ${v}`);
    }
    lines.push('', (data.get('message') || '').toString().trim());
    return lines.join('\n');
  };

  const setBusy = (busy) => {
    submitBtn.disabled = busy;
    const text = busy ? t.sending : t.submit;
    submitLabel.dataset.text = text;
    submitLabel.firstElementChild.textContent = text;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = controls.filter((c) => !check(c));
    if (invalid.length) {
      setStatus('error', t.invalid);
      (invalid[0].focusEl || invalid[0].el).focus();
      return;
    }

    // Anti-spam: honeypot filled or submitted unrealistically fast → silently drop.
    const honeypot = $('[name="website"]', form);
    if ((honeypot && honeypot.value) || Date.now() - loadedAt < 3000) {
      setStatus('success', t.success);
      form.reset();
      return;
    }

    if (!endpoint) {
      const subject = `${t.mailSubject} — ${$('[name="name"]', form).value.trim()}`;
      setStatus('info', t.mailtoNotice);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(readableText())}`;
      return;
    }

    setBusy(true);
    try {
      const data = new FormData(form);
      data.delete('website');
      data.set('privacy', 'accepted');
      data.set('_subject', `${t.mailSubject} — ${data.get('name')}`);
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus('success', t.success);
    } catch {
      setStatus('error', t.error);
    } finally {
      setBusy(false);
    }
  });
})();
