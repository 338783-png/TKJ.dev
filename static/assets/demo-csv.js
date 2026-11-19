/* TKJ.dev — CSV dashboard demo.
   Runs entirely in the browser: files are read with FileReader and never uploaded.
   All user-provided text is inserted with textContent (never innerHTML). */
(() => {
  'use strict';

  const root = document.querySelector('[data-demo-csv]');
  if (!root) return;

  const T = JSON.parse(root.querySelector('[data-demo-i18n]').textContent);
  const LANG = root.dataset.lang || 'en';
  const LOCALE = { en: 'en-GB', it: 'it-IT', fr: 'fr-FR' }[LANG] || 'en-GB';
  const MAX_BYTES = 5 * 1024 * 1024;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = root) => r.querySelector(s);

  const nf = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const nf0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
  const nfCompact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
  const pf = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
  const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const monthLong = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = (tag, attrs = {}) => {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  /* ---------- parsing ---------- */

  function detectDelimiter(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20);
    let best = ',', bestScore = -1;
    for (const d of [';', ',', '\t', '|']) {
      const counts = lines.map((l) => splitLine(l, d).length);
      const first = counts[0];
      if (first < 2) continue;
      const consistent = counts.filter((c) => c === first).length;
      const score = consistent * 10 + first;
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    return best;
  }

  function splitLine(line, d) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === d) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }

  // Full parser (handles quoted fields containing line breaks).
  function parseCSV(text, d) {
    const rows = [];
    let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === d) { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cur.trim());
        rows.push(row);
        row = [];
        cur = '';
      } else cur += ch;
    }
    if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
    return rows;
  }

  const cleanNum = (s) => s.replace(/[€$£\s %]/g, '').replace(/^\((.*)\)$/, '-$1');

  function detectDecimalComma(values) {
    let comma = 0, dot = 0;
    for (const raw of values) {
      const s = cleanNum(raw);
      if (/^-?[\d.]*,\d+$/.test(s)) comma++;
      else if (/^-?[\d,]*\.\d+$/.test(s)) dot++;
    }
    return comma > dot;
  }

  function parseNum(raw, decimalComma) {
    let s = cleanNum(raw || '');
    if (!s) return NaN;
    s = decimalComma ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }

  // Returns a UTC Date or null. Slash/dot formats are read day-first (European data),
  // unless the column profile found a second part > 12, which means month-first (US data).
  function parseDate(raw, monthFirst = false) {
    const s = (raw || '').trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return mk(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
    if (m) {
      let [a, b, y] = [+m[1], +m[2], +m[3]];
      if (y < 100) y += 2000;
      return monthFirst ? mk(y, a, b) : mk(y, b, a);
    }
    return null;
  }
  function mk(y, mo, d) {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCMonth() === mo - 1 ? dt : null;
  }

  function profileColumns(header, rows) {
    return header.map((name, idx) => {
      const values = rows.map((r) => r[idx] ?? '').filter((v) => v !== '');
      const sample = values.slice(0, 300);
      const monthFirst = sample.some((v) => {
        const m = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-]/);
        return m && +m[2] > 12;
      });
      const dateHits = sample.filter((v) => parseDate(v, monthFirst)).length;
      const decimalComma = detectDecimalComma(sample);
      const numHits = sample.filter((v) => !isNaN(parseNum(v, decimalComma))).length;
      const distinct = new Set(values).size;
      const n = sample.length || 1;
      let type = 'text';
      if (dateHits / n > 0.8) type = 'date';
      else if (numHits / n > 0.8) type = 'number';
      return { name: name || `#${idx + 1}`, idx, type, monthFirst, decimalComma, distinct };
    });
  }

  /* ---------- state ---------- */

  let data = null; // { header, rows, cols, delimiter, rowsRead }
  let sel = { date: -1, value: -1, cat: -1 };

  function load(text, label) {
    hideError();
    text = text.replace(/^﻿/, '');
    if (!text.trim()) return showError(T.errors.empty);
    const delimiter = detectDelimiter(text);
    const all = parseCSV(text, delimiter);
    const header = all.shift() || [];
    const rows = all;
    if (!header.length || !rows.length) return showError(T.errors.empty);
    const cols = profileColumns(header, rows);
    const dateCol = cols.find((c) => c.type === 'date');
    if (!dateCol) return showError(T.errors.noDate);
    const numCols = cols.filter((c) => c.type === 'number');
    if (!numCols.length) return showError(T.errors.noValue);
    const sumOf = (c) => rows.reduce((s, r) => s + (parseNum(r[c.idx], c.decimalComma) || 0), 0);
    const valueCol = numCols.reduce((a, b) => (Math.abs(sumOf(b)) > Math.abs(sumOf(a)) ? b : a));
    // Category = the text column that groups rows best (fewest distinct values, at least 2).
    const catCol = cols
      .filter((c) => c.type === 'text' && c.distinct >= 2 && c.distinct <= 30)
      .sort((a, b) => a.distinct - b.distinct)[0];
    data = { header, rows, cols, delimiter, rowsRead: rows.length, label };
    sel = { date: dateCol.idx, value: valueCol.idx, cat: catCol ? catCol.idx : -1 };
    fillSelects();
    // Show the results first so the charts can measure their real width.
    $('[data-demo-start]').hidden = true;
    $('[data-demo-results]').hidden = false;
    compute();
    $('[data-demo-results]').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function fillSelects() {
    const fill = (select, filter, current, allowNone) => {
      select.textContent = '';
      if (allowNone) select.appendChild(new Option(T.none, '-1'));
      data.cols.filter(filter).forEach((c) => select.appendChild(new Option(c.name, String(c.idx))));
      select.value = String(current);
    };
    fill($('[data-sel="date"]'), (c) => c.type === 'date', sel.date);
    fill($('[data-sel="value"]'), (c) => c.type === 'number', sel.value);
    fill($('[data-sel="cat"]'), (c) => c.type === 'text', sel.cat, true);
  }

  /* ---------- compute & render ---------- */

  let last = null;

  function compute() {
    const dc = data.cols[sel.date];
    const vc = data.cols[sel.value];
    const kept = [];
    for (const r of data.rows) {
      if (r.every((v) => v === '')) continue;
      const d = parseDate(r[sel.date], dc.monthFirst);
      const v = parseNum(r[sel.value], vc.decimalComma);
      if (!d || isNaN(v)) continue;
      kept.push({ d, v, c: sel.cat >= 0 ? r[sel.cat] || '—' : null, raw: r });
    }
    if (!kept.length) return showError(T.errors.noValue);

    // Monthly totals, including empty months between first and last.
    const byMonth = new Map();
    for (const k of kept) {
      const key = Date.UTC(k.d.getUTCFullYear(), k.d.getUTCMonth(), 1);
      byMonth.set(key, (byMonth.get(key) || 0) + k.v);
    }
    const keys = [...byMonth.keys()].sort((a, b) => a - b);
    const months = [];
    for (let t = keys[0]; t <= keys[keys.length - 1]; ) {
      months.push({ t, v: byMonth.get(t) || 0 });
      const d = new Date(t);
      t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    }

    let cats = null;
    if (sel.cat >= 0) {
      const m = new Map();
      for (const k of kept) m.set(k.c, (m.get(k.c) || 0) + k.v);
      cats = [...m.entries()].map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v);
      if (cats.length > 7) {
        const rest = cats.slice(6).reduce((s, c) => s + c.v, 0);
        cats = [...cats.slice(0, 6), { name: T.other, v: rest, other: true }];
      }
    }

    const total = kept.reduce((s, k) => s + k.v, 0);
    last = { kept, months, cats, total };
    render();
  }

  function render() {
    const { kept, months, cats, total } = last;

    // Report
    const report = $('[data-demo-report]');
    report.textContent = '';
    const delimName = { ';': ';', ',': ',', '\t': 'TAB', '|': '|' }[data.delimiter];
    const items = [
      [nf0.format(data.rowsRead), T.rowsRead],
      [nf0.format(kept.length), T.rowsKept],
      [nf0.format(data.rowsRead - kept.length), T.rowsSkipped],
      [delimName, T.separator],
      [data.cols[sel.value].decimalComma ? ',' : '.', T.decimal],
    ];
    for (const [v, l] of items) {
      const li = el('li');
      li.append(el('strong', null, v), document.createTextNode(' ' + l));
      report.appendChild(li);
    }
    $('[data-demo-source]').textContent = data.label;

    // KPIs
    const best = months.reduce((a, b) => (b.v > a.v ? b : a));
    const avg = total / months.length;
    const kpis = $('[data-demo-kpis]');
    kpis.textContent = '';
    const tile = (label, value, sub, cls) => {
      const d = el('div', 'kpi');
      d.append(el('p', 'kpi-label', label), el('p', 'kpi-value', value));
      if (sub) d.append(el('p', 'kpi-sub ' + (cls || ''), sub));
      kpis.appendChild(d);
    };
    tile(T.kpiTotal, nf0.format(total), `${months.length} × ${T.month.toLowerCase()}`);
    tile(T.kpiAvg, nf0.format(avg));
    tile(T.kpiBest, cap(monthLong.format(best.t)), nf0.format(best.v));
    if (months.length >= 2) {
      const a = months[months.length - 1].v, b = months[months.length - 2].v;
      const delta = b ? (a - b) / Math.abs(b) : 0;
      const arrow = delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : '';
      tile(T.kpiTrend, arrow + pf.format(delta), `${cap(monthFmt.format(months[months.length - 1].t))} · ${nf0.format(a)}`, delta > 0 ? 'up' : delta < 0 ? 'down' : '');
    }

    drawColumns($('[data-chart="monthly"]'), months);
    fillTable($('[data-table="monthly"]'), [T.month, T.total], months.map((m) => [cap(monthLong.format(m.t)), nf.format(m.v)]));

    const topCard = $('[data-card="top"]');
    topCard.hidden = !cats;
    if (cats) {
      drawBars($('[data-chart="top"]'), cats);
      fillTable($('[data-table="top"]'), [T.category, T.total], cats.map((c) => [c.name, nf.format(c.v)]));
    }

    // Preview table
    const prevHead = [T.dateCol, T.valueCol, ...(sel.cat >= 0 ? [T.catCol] : [])];
    const prevRows = kept.slice(0, 12).map((k) => [
      new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC' }).format(k.d),
      nf.format(k.v),
      ...(sel.cat >= 0 ? [k.c] : []),
    ]);
    fillTable($('[data-table="preview"]'), prevHead, prevRows);
    $('[data-preview-note]').textContent = T.previewNote.replace('{n}', Math.min(12, kept.length));
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function fillTable(table, head, rows) {
    table.textContent = '';
    const thead = el('thead');
    const tr = el('tr');
    head.forEach((h, i) => {
      const th = el('th', i > 0 && /\d/.test(rows[0]?.[i] || '') ? 'num' : null, h);
      th.scope = 'col';
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    const tbody = el('tbody');
    for (const r of rows) {
      const row = el('tr');
      r.forEach((c, i) => row.appendChild(el('td', i > 0 && /^[\d\s.,\-−]+$/.test(c) ? 'num' : null, c)));
      tbody.appendChild(row);
    }
    table.append(thead, tbody);
  }

  /* ---------- charts ---------- */

  const tooltip = el('div', 'dz-tip');
  tooltip.setAttribute('role', 'status');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  function showTip(target, title, value) {
    tooltip.textContent = '';
    tooltip.append(el('strong', null, value), el('span', null, title));
    tooltip.hidden = false;
    const r = target.getBoundingClientRect();
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    let y = r.top - th - 10;
    if (y < 8) y = r.bottom + 10;
    tooltip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
  const hideTip = () => (tooltip.hidden = true);
  window.addEventListener('scroll', hideTip, { passive: true });

  function niceTicks(max, count = 4) {
    if (max <= 0) return [0, 1];
    const raw = max / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    const ticks = [];
    for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
    return ticks;
  }
  const axisFmt = (v, max) => (max >= 10000 ? nfCompact.format(v) : nf0.format(v));

  // Column = top-rounded bar, square at the baseline.
  function columnPath(x, y, w, h, r = 4) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function barPath(x, y, w, h, r = 4) {
    if (w <= 0) return '';
    r = Math.min(r, h / 2, w);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  }

  function drawColumns(host, months) {
    host.textContent = '';
    const W = Math.max(300, host.clientWidth);
    const H = 300;
    const m = { t: 24, r: 8, b: 32, l: 52 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = Math.max(...months.map((d) => d.v), 0);
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1];
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'chart', role: 'img', 'aria-label': T.chartMonthly });
    const g = svg('g', { transform: `translate(${m.l},${m.t})` });
    s.appendChild(g);
    for (const t of ticks) {
      const y = ih - (t / top) * ih;
      g.appendChild(svg('line', { x1: 0, x2: iw, y1: y, y2: y, class: t === 0 ? 'axis' : 'grid' }));
      const lbl = svg('text', { x: -10, y: y + 4, class: 'tick', 'text-anchor': 'end' });
      lbl.textContent = axisFmt(t, top);
      g.appendChild(lbl);
    }
    const band = iw / months.length;
    const bw = Math.max(4, Math.min(24, band - 2, band * 0.62));
    const every = Math.ceil(months.length / Math.max(1, Math.floor(iw / 56)));
    const bestIdx = months.reduce((bi, d, i, a) => (d.v > a[bi].v ? i : bi), 0);
    months.forEach((d, i) => {
      const cx = i * band + band / 2;
      const h = Math.max(0, (d.v / top) * ih);
      const grp = svg('g', { class: 'mark', tabindex: '0', role: 'img', 'aria-label': `${cap(monthLong.format(d.t))}: ${nf.format(d.v)}` });
      grp.appendChild(svg('rect', { x: i * band, y: 0, width: band, height: ih, class: 'hit' }));
      if (h > 0) grp.appendChild(svg('path', { d: columnPath(cx - bw / 2, ih - h, bw, h), class: 'bar' }));
      const show = (e) => showTip(e.currentTarget.querySelector('.bar') || e.currentTarget, cap(monthLong.format(d.t)), nf.format(d.v));
      grp.addEventListener('pointerenter', show);
      grp.addEventListener('focus', show);
      grp.addEventListener('pointerleave', hideTip);
      grp.addEventListener('blur', hideTip);
      g.appendChild(grp);
      if (i % every === 0) {
        const lbl = svg('text', { x: cx, y: ih + 20, class: 'tick', 'text-anchor': 'middle' });
        lbl.textContent = cap(monthFmt.format(d.t));
        g.appendChild(lbl);
      }
      if (i === bestIdx && h > 0) {
        const v = svg('text', { x: cx, y: ih - h - 8, class: 'val', 'text-anchor': 'middle' });
        v.textContent = axisFmt(d.v, 10000);
        g.appendChild(v);
      }
    });
    host.appendChild(s);
  }

  function drawBars(host, cats) {
    host.textContent = '';
    const W = Math.max(300, host.clientWidth);
    const row = 34;
    const labelW = Math.min(150, W * 0.34);
    const valueW = 64;
    const H = cats.length * row + 8;
    const iw = W - labelW - valueW;
    const max = Math.max(...cats.map((c) => c.v), 0) || 1;
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'chart', role: 'img', 'aria-label': T.chartTop });
    s.appendChild(svg('line', { x1: labelW, x2: labelW, y1: 0, y2: H, class: 'axis' }));
    cats.forEach((c, i) => {
      const y = i * row + 4;
      const w = Math.max(0, (c.v / max) * iw);
      const bh = 20;
      const grp = svg('g', { class: 'mark', tabindex: '0', role: 'img', 'aria-label': `${c.name}: ${nf.format(c.v)}` });
      grp.appendChild(svg('rect', { x: 0, y, width: W, height: row, class: 'hit' }));
      const name = svg('text', { x: labelW - 12, y: y + row / 2 + 4, class: 'cat', 'text-anchor': 'end' });
      name.textContent = c.name.length > 22 ? c.name.slice(0, 21) + '…' : c.name;
      grp.appendChild(name);
      grp.appendChild(svg('path', { d: barPath(labelW, y + (row - bh) / 2, w, bh), class: c.other ? 'bar bar-muted' : 'bar' }));
      const v = svg('text', { x: labelW + w + 8, y: y + row / 2 + 4, class: 'val' });
      v.textContent = axisFmt(c.v, 10000);
      grp.appendChild(v);
      const show = (e) => showTip(e.currentTarget.querySelector('.bar'), c.name, nf.format(c.v));
      grp.addEventListener('pointerenter', show);
      grp.addEventListener('focus', show);
      grp.addEventListener('pointerleave', hideTip);
      grp.addEventListener('blur', hideTip);
      s.appendChild(grp);
    });
    host.appendChild(s);
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => last && !$('[data-demo-results]').hidden && render(), 150);
  });

  /* ---------- export ---------- */

  function exportSummary() {
    const sep = LANG === 'en' ? ',' : ';';
    const num = (v) => (LANG === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
    const esc = (s) => (/[",;\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s);
    const lines = [[T.month, T.total].join(sep)];
    last.months.forEach((m) => {
      const d = new Date(m.t);
      lines.push([`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, num(m.v)].join(sep));
    });
    if (last.cats) {
      lines.push('', [T.category, T.total].join(sep));
      last.cats.forEach((c) => lines.push([esc(c.name), num(c.v)].join(sep)));
    }
    lines.push('', [T.kpiTotal, num(last.total)].join(sep));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tkj-dashboard-summary.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);

    // Visible confirmation + next step.
    const done = $('[data-demo-done]');
    $('[data-demo-done-title]').textContent = T.exported.replace('{file}', a.download);
    done.hidden = false;
    done.classList.remove('is-shown');
    requestAnimationFrame(() => done.classList.add('is-shown'));
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }

  /* ---------- errors ---------- */

  function showError(msg) {
    const box = $('[data-demo-error]');
    box.textContent = msg;
    box.hidden = false;
  }
  function hideError() {
    $('[data-demo-error]').hidden = true;
  }

  /* ---------- wiring ---------- */

  function readFile(file) {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name) && !/csv|text\/plain/.test(file.type)) return showError(T.errors.type);
    if (file.size > MAX_BYTES) return showError(T.errors.tooBig);
    const reader = new FileReader();
    reader.onload = () => load(String(reader.result || ''), file.name);
    reader.onerror = () => showError(T.errors.empty);
    reader.readAsText(file);
  }

  $('[data-demo-sample]').addEventListener('click', async () => {
    try {
      const res = await fetch(root.dataset.sample);
      load(await res.text(), T.sampleNote);
    } catch {
      showError(T.errors.empty);
    }
  });
  $('[data-demo-file]').addEventListener('change', (e) => readFile(e.target.files[0]));

  const zone = $('[data-demo-drop]');
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    })
  );
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove('is-over')));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    readFile(e.dataTransfer.files[0]);
  });

  root.querySelectorAll('[data-sel]').forEach((s) =>
    s.addEventListener('change', () => {
      sel[s.dataset.sel] = Number(s.value);
      compute();
    })
  );
  $('[data-demo-export]').addEventListener('click', exportSummary);
  $('[data-demo-print]').addEventListener('click', () => window.print());
  $('[data-demo-reset]').addEventListener('click', () => {
    $('[data-demo-done]').hidden = true;
    $('[data-demo-results]').hidden = true;
    $('[data-demo-start]').hidden = false;
    $('[data-demo-file]').value = '';
    hideError();
    $('[data-demo-start]').scrollIntoView({ block: 'center' });
  });
})();
