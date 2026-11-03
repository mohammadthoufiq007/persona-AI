/* eslint-disable */
// @ts-nocheck
"use client";
/* Drawn with pure DOM + SVG inside an effect. Zero external chart dependencies. */

import * as React from "react";

/* ------------------------------------------------------------------ */
/*  PersonaVoice Bento: Pro Voice AI Studio Dashboard                 */
/*  Real-time Latency Telemetry, Persona Knowledge Grounding,         */
/*  Gnani AI Credit Meter, Dual Audio Waveforms, and Voice Turns      */
/* ------------------------------------------------------------------ */

export interface VoiceBentoData {
  /** Telemetry history across turns (oldest first) */
  telemetry: { date: string; stt: number; ragLlm: number; tts: number }[];
  /** Recent voice turns and memories */
  recentTurns: { query: string; time: string; persona: string; latencyMs: number }[];
  /** Voice system benchmarks */
  goals: { name: string; progress: number; target: string }[];
  /** Audio processed in seconds: [inputMic, outputTts] */
  speechFlow: { months: string[]; inputMic: number[][]; outputTts: number[][] };
  /** Personas configured in the system */
  personas: { name: string; lang: string; share: number; voice: string; trend: number[][] }[];
  /** Weekly voice interactions count per weekday */
  weeklyTurns: { days: string[]; values: number[] };
  /** Credit budget status */
  credits: { used: number; total: number; dailyTurnsLeft: number };
}

export interface VoiceBentoProps {
  data?: VoiceBentoData;
  title?: string;
  subtitle?: string;
  activePersona?: string;
  onSelectPersona?: (personaSlug: string) => void;
  onTriggerVoice?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const DEFAULT_DATA: VoiceBentoData = {
  telemetry: [
    { date: "10:00", stt: 180, ragLlm: 520, tts: 210 },
    { date: "10:15", stt: 175, ragLlm: 490, tts: 200 },
    { date: "10:30", stt: 165, ragLlm: 470, tts: 195 },
    { date: "10:45", stt: 160, ragLlm: 450, tts: 190 },
    { date: "11:00", stt: 155, ragLlm: 430, tts: 185 },
    { date: "11:15", stt: 150, ragLlm: 420, tts: 180 },
    { date: "11:30", stt: 145, ragLlm: 410, tts: 175 },
    { date: "11:45", stt: 140, ragLlm: 395, tts: 170 },
  ],
  recentTurns: [
    { query: "What are Thoufiq's core technical skills?", time: "Just now", persona: "Sapphire", latencyMs: 780 },
    { query: "Namaste Rahu, college projects ke baare mein batao", time: "4m ago", persona: "Rahu", latencyMs: 840 },
    { query: "Vanakkam Maragatham, internship status enna?", time: "9m ago", persona: "Maragatham", latencyMs: 810 },
    { query: "Summarize education from personal profile", time: "16m ago", persona: "Sapphire", latencyMs: 720 },
  ],
  goals: [
    { name: "Sub-1.0s Turn Latency", progress: 0.96, target: "900 ms" },
    { name: "Profile Grounding Match", progress: 1.0, target: "100% Acc" },
  ],
  speechFlow: {
    months: ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"],
    inputMic: [
      [2.4, 3.1, 3.8, 4.2, 4.8, 5.2],
      [1.8, 2.4, 2.9, 3.4, 3.9, 4.2],
      [1.2, 1.6, 2.1, 2.6, 3.0, 3.4],
    ],
    outputTts: [
      [2.1, 2.8, 3.4, 3.8, 4.3, 4.7],
      [1.6, 2.1, 2.6, 3.0, 3.5, 3.8],
      [1.0, 1.4, 1.8, 2.2, 2.6, 3.0],
    ],
  },
  personas: [
    { name: "Sapphire", lang: "English", share: 0.50, voice: "Sapphire", trend: [[0, 10, 5, 22], [1, 14, 8, 26], [2, 18, 12, 31], [3, 25, 18, 38], [4, 32, 24, 42], [5, 40, 30, 46], [6, 45, 36, 50]] },
    { name: "Rahu", lang: "हिन्दी", share: 0.30, voice: "Rahu", trend: [[0, 8, 4, 18], [1, 12, 7, 21], [2, 15, 10, 25], [3, 20, 14, 30], [4, 26, 19, 34], [5, 30, 22, 38], [6, 35, 28, 40]] },
    { name: "Maragatham", lang: "தமிழ்", share: 0.20, voice: "Maragatham", trend: [[0, 5, 2, 12], [1, 8, 4, 15], [2, 11, 6, 18], [3, 14, 9, 21], [4, 17, 12, 24], [5, 19, 14, 27], [6, 20, 15, 30]] },
  ],
  weeklyTurns: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    values: [4.2, 5.8, 6.4, 7.1, 8.5],
  },
  credits: {
    used: 14,
    total: 300,
    dailyTurnsLeft: 286,
  },
};

const CSS = `.pvb{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;color:#fff;width:100%;height:100%;display:flex;flex-direction:column;min-height:0}
.pvb *{box-sizing:border-box}
.pvb .pvb-c{border-radius:22px;padding:12px;background:#05070f;color:#fff;border:1px solid rgba(255,255,255,.08);box-shadow:0 16px 40px -15px rgba(0,0,0,.7);width:100%;max-width:1280px;margin:0 auto;height:100%;flex:1;min-height:0;display:flex;flex-direction:column}
.pvb{--acc:#6366F1;--t1:#fff;--t2:rgba(255,255,255,.62);--t3:rgba(255,255,255,.42);--hair:rgba(255,255,255,.14);--ease:cubic-bezier(.32,.72,0,1);
    --stt:#FFFFFF;--rag:#818CF8;--tts:#F59E0B;--lime:#10B981}
.pvb .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px;height:100%;flex:1;min-height:0}
.pvb .h1{height:232px}
.pvb .h2{height:124px}
.pvb .h3{height:218px}
@media (min-width:1200px){
  .pvb .grid{grid-template-rows:minmax(215px,1.8fr) minmax(120px,1fr) minmax(210px,1.75fr)}
  .pvb .h1{height:100%;min-height:215px}
  .pvb .h2{height:100%;min-height:120px}
  .pvb .h3{height:100%;min-height:210px}
}
.pvb #nw{grid-column:span 8}
.pvb #alloc{grid-column:span 4}
.pvb .kpi{grid-column:span 3}
.pvb #flow{grid-column:span 5}
.pvb #crypto{grid-column:span 4}
.pvb #stocks{grid-column:span 3}
@media (max-width:1199px){.pvb #nw{grid-column:span 12}
.pvb #alloc{grid-column:span 6;grid-row:span 2;height:auto}
.pvb .kpi{grid-column:span 6}
.pvb #flow{grid-column:span 12}
.pvb #crypto,.pvb #stocks{grid-column:span 6}}
@media (max-width:767px){.pvb .pvb-c{padding:10px}
.pvb #nw{height:240px}
.pvb #alloc{grid-column:span 12;grid-row:auto;height:220px}
.pvb .kpi{grid-column:span 6}
.pvb #crypto,.pvb #stocks{grid-column:span 12}
.pvb .grid{gap:8px}}
@media (max-width:520px){.pvb .kpi{grid-column:span 12}}
.pvb .card{position:relative;border-radius:20px;overflow:hidden;opacity:1 !important;transform:none !important;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.pvb .card .rim{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),inset 0 0 0 1px rgba(255,255,255,.06);pointer-events:none;z-index:9}
.pvb .g{position:absolute;inset:0}
.pvb .core{position:absolute;left:10%;right:10%;top:16%;bottom:-6%;border-radius:90px;filter:blur(50px)}
.pvb .glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px)}
.pvb .glass .rim{display:none}
.pvb .solid{background:var(--lime);color:#02140d}
.pvb .solid .rim{box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.pvb .in-c{position:absolute;inset:0;padding:12px 16px;z-index:2}
.pvb .h2 .in-c{padding:10px 14px}
.pvb .ttl{font-size:14px;font-weight:600;letter-spacing:-.02em;display:flex;align-items:center;gap:6px}
.pvb .cap{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--t2)}
.pvb .solid .cap{color:rgba(0,0,0,.6)}
.pvb .big{font-size:28px;font-weight:300;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.pvb .delta{font:600 11px "Geist Mono",monospace;color:#34D399;letter-spacing:-.02em}
.pvb .muted{font-size:11px;color:var(--t3);font-weight:500;letter-spacing:-.01em}
.pvb .chip{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:10px;background:rgba(0,0,0,.75);color:#fff;font:600 10px "Geist Mono",monospace;letter-spacing:-.02em}
.pvb .legend{display:flex;gap:12px;font-size:11px;font-weight:500;color:var(--t2)}
.pvb .legend span{display:inline-flex;align-items:center;gap:5px}
.pvb .legend i{width:7px;height:7px;border-radius:50%}
.pvb .row{display:flex;align-items:center;gap:10px}
.pvb .mono{font-family:"Geist Mono",monospace;font-variant-numeric:tabular-nums}
.pvb .dots circle{transition:opacity .26s,transform .26s;transform-box:fill-box;transform-origin:center}
.pvb .tip{position:fixed;z-index:50;pointer-events:none;background:rgba(10,12,22,.94);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:8px 10px;font-size:11px;
    backdrop-filter:blur(16px);box-shadow:0 12px 30px -10px rgba(0,0,0,.8);opacity:0;transform:translateY(4px);transition:opacity .15s,transform .15s;white-space:nowrap;min-width:140px}
.pvb .tip.on{opacity:1;transform:none}
.pvb .tip .t{color:var(--t2);margin-bottom:4px;font-weight:600}
.pvb .tip .r{display:flex;justify-content:space-between;gap:12px;align-items:center;line-height:18px}
.pvb .tip .r span{display:inline-flex;align-items:center;gap:5px;color:var(--t2)}
.pvb .tip i{width:6px;height:6px;border-radius:50%}
.pvb .tip b{font:500 11px "Geist Mono",monospace}`;

const markup = () => `<div class="pvb-c canvas">
  <div class="grid" id="grid">
    <!-- Telemetry Stream Card -->
    <section class="card h1" id="nw" aria-label="Turn Latency Telemetry"></section>
    <!-- Grounding Knowledge Gauge -->
    <section class="card h1" id="alloc" aria-label="Knowledge Grounding"></section>
    <!-- KPI row -->
    <section class="card h2 kpi" id="ret" aria-label="Turns Quota"></section>
    <section class="card glass h2 kpi" id="cash" aria-label="Audio Buffer and VAD"></section>
    <section class="card glass h2 kpi" id="pay" aria-label="Recent Spoken Turns"></section>
    <section class="card glass h2 kpi" id="goals" aria-label="Accuracy Benchmarks"></section>
    <!-- Bottom row -->
    <section class="card h3" id="flow" aria-label="Dual Speech Flow"></section>
    <section class="card h3" id="crypto" aria-label="Active Personas"></section>
    <section class="card h3" id="stocks" aria-label="Interaction Volume"></section>
  </div>
</div>
<div class="tip" id="tip"></div>`;

function mount(root, currentData, onSelectPersona) {
  let alive = true;
  let activeData = { ...currentData };
  const frames = new Set();
  const RAF = (cb) => { if (!alive) return 0; const id = requestAnimationFrame((t) => { frames.delete(id); if (alive) cb(t); }); frames.add(id); return id; };
  const $id = (id) => root.querySelector("#" + id);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T2 = 'rgba(255,255,255,.62)', T3 = 'rgba(255,255,255,.42)', HAIR = 'rgba(255,255,255,.12)';
  const COL = { stt: '#FFFFFF', rag: '#818CF8', tts: '#F59E0B' };
  const ease = t => 1 - Math.pow(1 - t, 3);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };

  const GR = {
    indigo: { top: '#818cf8', base: '#312e81', bottom: '#4338ca', core: '#0a0a2e' },
    graph: { top: '#94a3b8', base: '#1e293b', bottom: '#334155', core: '#050811' },
    amber: { top: '#fcd34d', base: '#78350f', bottom: '#b45309', core: '#230e04' },
    emerald: { top: '#6ee7b7', base: '#064e3b', bottom: '#047857', core: '#021810' },
    rose: { top: '#fda4af', base: '#881337', bottom: '#be123c', core: '#21040d' },
    cyan: { top: '#67e8f9', base: '#155e75', bottom: '#0e7490', core: '#041720' },
  };

  function bg({ top, base, bottom, core }) {
    return `<div class="g" style="background:linear-gradient(180deg,${top} 0%,${base} 36%,${base} 74%,${bottom} 100%)"></div><div class="core" style="background:${core}"></div>`;
  }

  function smoothPath(P, move = true) {
    if (!P || P.length === 0) return '';
    let d = (move ? 'M' : 'L') + `${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2, k = .17;
      d += `C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  const P2 = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];

  const F = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    'm': ['00000', '11011', '10101', '10101', '10101', '10101', '10101'],
    's': ['00000', '01111', '10000', '01110', '00001', '10001', '01110'],
    ' ': ['00', '00', '00', '00', '00', '00', '00'],
    ',': ['0', '0', '0', '0', '0', '1', '1']
  };

  function DotNumber(host, pitch) {
    if (!host) return { count: () => {} };
    const cols = 48, svg = el('svg', { class: 'dots', 'aria-hidden': 'true' }, host), cells = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 7; r++) {
        const ci = el('circle', { cx: c * pitch + pitch / 2, cy: r * pitch + pitch / 2, r: pitch * .36, fill: '#fff', opacity: 0 }, svg);
        cells.push([c, r, ci]);
      }
    }
    const set = (t) => {
      const on = new Set();
      let x = 0;
      for (const ch of t) {
        const g = F[ch] || F[' '];
        const w = g[0].length;
        for (let r = 0; r < 7; r++) {
          for (let k = 0; k < w; k++) {
            if (g[r][k] === '1') on.add((x + k) * 8 + r);
          }
        }
        x += w + 1;
      }
      const used = Math.max(1, x - 1);
      for (const [c, r, ci] of cells) {
        const v = on.has(c * 8 + r);
        ci.setAttribute('opacity', v ? 1 : (c < used ? .08 : 0));
      }
      svg.setAttribute('width', used * pitch);
      svg.setAttribute('height', 7 * pitch);
      svg.setAttribute('viewBox', `0 0 ${used * pitch} ${7 * pitch}`);
    };
    let raf = 0, cur = 0;
    return {
      count(to, dur = 800) {
        cancelAnimationFrame(raf);
        const from = cur, t0 = performance.now();
        let last = '';
        const f = (now) => {
          const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
          cur = from + (to - from) * ease(t);
          const s = Math.round(cur) + ' ms';
          if (s !== last) { set(s); last = s; }
          if (t < 1) raf = RAF(f);
        };
        raf = RAF(f);
      }
    };
  }

  function tween(node, to, fmt, dur = 800) {
    if (!node) return;
    const from = +node.dataset.v || 0, t0 = performance.now();
    node.dataset.v = to;
    (function f(now) {
      const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
      node.textContent = fmt(from + (to - from) * ease(t));
      if (t < 1) RAF(f);
    })(t0);
  }

  const tip = $id('tip');
  function showTip(x, y, title, rows) {
    if (!tip) return;
    tip.innerHTML = `<div class="t">${title}</div>` + rows.map(([k, v, c]) => `<div class="r"><span>${c ? `<i style="background:${c}"></i>` : ''}${k}</span><b>${v}</b></div>`).join('');
    tip.classList.add('on');
    const r = tip.getBoundingClientRect();
    let L = x + 16, T = y - r.height - 14;
    if (L + r.width > innerWidth - 8) L = x - r.width - 16;
    if (T < 8) T = y + 16;
    tip.style.left = L + 'px';
    tip.style.top = T + 'px';
  }
  const hideTip = () => tip && tip.classList.remove('on');

  /* ================= 1. Telemetry Stream Card ================= */
  const nw = $id('nw');
  let nwNum = null;
  let nwGrow = 0, nwRaf = 0;

  function totalLatency(p) { return (p.stt || 160) + (p.ragLlm || 460) + (p.tts || 180); }

  function initNW() {
    if (!nw) return;
    nw.innerHTML = `${bg(GR.indigo)}<div class="in-c">
      <div class="row hrow" style="justify-content:space-between">
        <div class="ttl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Pipeline Latency Stream
        </div>
        <div class="legend">
          <span><i style="background:${COL.stt}"></i>Prisma STT</span>
          <span><i style="background:${COL.rag}"></i>RAG & LLM</span>
          <span><i style="background:${COL.tts}"></i>Timbre TTS</span>
        </div>
      </div>
      <div class="row nrow" style="margin-top:8px;align-items:flex-end;gap:12px">
        <div class="nwn"></div>
        <div style="padding-bottom:2px">
          <div class="delta nwd">↓ 120ms faster</div>
          <div class="muted nwc" style="margin-top:1px;font-size:10px">verified turn latency budget</div>
        </div>
      </div>
      <svg class="nws" style="position:absolute;left:0;right:0;bottom:0;display:block" aria-hidden="true"></svg>
    </div><div class="rim"></div>`;
    nwNum = DotNumber(nw.querySelector('.nwn'), 5);
  }

  function drawNW() {
    if (!nw) return;
    const svg = nw.querySelector('.nws');
    if (!svg) return;
    const W = nw.clientWidth || 600, Hh = Math.max(140, (nw.clientHeight || 230) - 85), top = 22, bot = 14, mid = top + (Hh - top - bot) / 2;
    svg.setAttribute('width', W); svg.setAttribute('height', Hh); svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const D = activeData.telemetry || DEFAULT_DATA.telemetry, n = D.length;
    const tots = D.map(totalLatency), mx = Math.max(...tots), mn = Math.min(...tots);
    const floor = mn - (mx - mn) * .9, half = (Hh - top - bot) / 2;
    const k = p => ((totalLatency(p) - floor) / (mx - floor || 1)) * half * 2 / totalLatency(p);
    const X = i => -10 + i / (n - 1) * (W + 20);
    const g = ease(nwGrow);
    const lay = D.map(p => {
      const q = k(p) * g / 2, stt = (p.stt || 160) * q, rag = (p.ragLlm || 460) * q, tts = (p.tts || 180) * q;
      return { stt, sttRag: stt + rag, all: stt + rag + tts };
    });
    const band = kKey => {
      const T = D.map((p, i) => [X(i), mid - lay[i][kKey]]);
      const B = D.map((p, i) => [X(i), mid + lay[i][kKey]]).reverse();
      return smoothPath(T) + smoothPath(B, false) + 'Z';
    };
    const marks = [Math.round((n - 1) * .2), Math.round((n - 1) * .55), n - 1];

    svg.innerHTML = `
      <defs>
        <linearGradient id="nwf" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".0"/>
          <stop offset=".25" stop-color="#fff" stop-opacity="1"/>
        </linearGradient>
        <mask id="nwm"><rect width="${W}" height="${Hh}" fill="url(#nwf)"/></mask>
      </defs>
      <g mask="url(#nwm)">
        <path d="${band('all')}" fill="${COL.tts}" opacity=".95"/>
        <path d="${band('sttRag')}" fill="${COL.rag}"/>
        <path d="${band('stt')}" fill="${COL.stt}" opacity=".95"/>
      </g>
      ${marks.map((i, k) => {
        const x = Math.min(W - 32, Math.max(32, X(i)));
        const t = totalLatency(D[i]);
        return `<g style="opacity:${g > .6 ? 1 : 0};transition:opacity .4s ${k * .08}s">
          <line x1="${x}" x2="${x}" y1="${top}" y2="${Hh - bot}" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>
          <rect x="${x - 28}" y="${top - 12}" width="56" height="18" rx="9" fill="#000"/>
          <text x="${x}" y="${top}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff" font-family="Geist Mono">${Math.round(t)}ms</text>
          <rect x="${x - 25}" y="${Hh - bot - 6}" width="50" height="18" rx="9" fill="#000"/>
          <text x="${x}" y="${Hh - bot + 6}" text-anchor="middle" font-size="9" font-weight="500" fill="rgba(255,255,255,.7)" font-family="Geist Mono">${D[i].date}</text>
        </g>`;
      }).join('')}
      <line class="hl" y1="${top}" y2="${Hh - bot}" stroke="#fff" stroke-width="1.2" opacity="0"/>
      <rect width="${W}" height="${Hh}" fill="transparent" class="hit"/>`;

    const hit = svg.querySelector('.hit'), hl = svg.querySelector('.hl');
    if (hit) {
      hit.onpointermove = e => {
        const r = svg.getBoundingClientRect(), z = r.width / W, x = (e.clientX - r.left) / z;
        const i = Math.max(0, Math.min(n - 1, Math.round((x + 10) / (W + 20) * (n - 1))));
        const p = D[i];
        hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hl.setAttribute('opacity', 1);
        showTip(r.left + X(i) * z, r.top + (mid - lay[i].all) * z, `${p.date} • Stage Breakdown`, [
          ['Gnani Timbre TTS', (p.tts || 180) + ' ms', COL.tts],
          ['RAG & LLM', (p.ragLlm || 460) + ' ms', COL.rag],
          ['Prisma STT', (p.stt || 160) + ' ms', COL.stt],
          ['Total Latency', Math.round(totalLatency(p)) + ' ms']
        ]);
      };
      hit.onpointerleave = () => { hl.setAttribute('opacity', 0); hideTip(); };
    }
  }

  function updateNW() {
    if (!nw) return;
    const D = activeData.telemetry || DEFAULT_DATA.telemetry;
    const a = totalLatency(D[0]), b = totalLatency(D[D.length - 1]);
    if (nwNum) nwNum.count(b);
    const nwd = nw.querySelector('.nwd');
    if (nwd) nwd.textContent = '↓ ' + Math.abs((a - b)).toFixed(0) + ' ms delta';
    cancelAnimationFrame(nwRaf);
    const t0 = performance.now();
    nwGrow = 0;
    const f = (now) => {
      nwGrow = reduce ? 1 : Math.min(1, (now - t0) / 900);
      drawNW();
      if (nwGrow < 1) nwRaf = RAF(f);
    };
    nwRaf = RAF(f);
  }

  /* ================= 2. Grounding Knowledge Gauge ================= */
  const al = $id('alloc');
  function initAlloc() {
    if (!al) return;
    al.innerHTML = `${bg(GR.graph)}<div class="in-c">
      <div class="row" style="justify-content:space-between">
        <div class="ttl">Grounding Score</div>
        <span class="chip" style="background:rgba(99,102,241,.25);border:1px solid rgba(99,102,241,.4)">100% Master KB</span>
      </div>
      <svg class="alg" width="220" height="110" viewBox="-110 -110 220 110" style="position:absolute;left:50%;margin-left:-110px;top:40px" aria-hidden="true"></svg>
      <div class="all" style="position:absolute;left:16px;right:16px;bottom:12px"></div>
    </div><div class="rim"></div>`;
  }

  function updateAlloc() {
    if (!al) return;
    const fr = { kb: 0.65, persona: 0.25, memory: 0.10 };
    const n = 42, svg = al.querySelector('.alg');
    if (!svg) return;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const f = i / n, a = 180 + f * 180;
      const cls = f <= fr.kb ? '#818CF8' : f <= fr.kb + fr.persona ? '#F59E0B' : '#FFFFFF';
      const [x1, y1] = P2(96, a), [x2, y2] = P2(i % 6 === 0 ? 80 : 84, a);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${cls}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    s += `<text y="-26" text-anchor="middle" font-family="Inter" font-weight="200" font-size="34" fill="#fff" letter-spacing="-1.5">100<tspan font-size="14" dy="-14" fill="${T2}">%</tspan></text>
          <text y="-6" text-anchor="middle" font-size="10.5" font-weight="600" fill="rgba(255,255,255,.75)" font-family="Inter">Profile Grounded</text>`;
    svg.innerHTML = s;

    const allEl = al.querySelector('.all');
    if (allEl) {
      allEl.innerHTML = [
        ['Master Knowledge Base', 65, '#818CF8'],
        ['Persona System Prompts', 25, '#F59E0B'],
        ['Session Context Cache', 10, '#FFFFFF']
      ].map(([k, pct, col], i) => `
        <div class="row" style="height:23px;${i ? 'border-top:1px solid rgba(255,255,255,.06)' : ''}">
          <i style="width:6px;height:6px;border-radius:50%;background:${col}"></i>
          <div style="flex:1"><span style="font-size:11px;font-weight:600">${k}</span></div>
          <span class="mono muted" style="font-size:10px">${pct}%</span>
        </div>
      `).join('');
    }
  }

  /* ================= 3. Turns Quota / Completed KPI ================= */
  const ret = $id('ret');
  function initRet() {
    if (!ret) return;
    ret.innerHTML = `${bg(GR.emerald)}<div class="in-c">
      <div class="row" style="justify-content:space-between">
        <div class="cap">Agent Turns Quota</div>
        <span class="chip rtc">Daily Budget</span>
      </div>
      <div style="position:absolute;left:14px;bottom:28px;display:flex;align-items:center;gap:6px">
        <svg width="20" height="24" viewBox="0 0 34 40" aria-hidden="true">
          <path d="M17 5V37M5 25l12 12 12-12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="big rtv" style="font-size:32px">${activeData.credits?.dailyTurnsLeft ?? 286}</span>
      </div>
      <div class="muted rtp" style="position:absolute;left:14px;bottom:10px;font-size:9.5px">${activeData.credits?.used ?? 14} turns processed today</div>
    </div><div class="rim"></div>`;
  }

  function updateRet() {
    if (!ret) return;
    const cred = activeData.credits || DEFAULT_DATA.credits;
    const rtv = ret.querySelector('.rtv');
    const rtc = ret.querySelector('.rtc');
    const rtp = ret.querySelector('.rtp');
    if (rtv) tween(rtv, cred.dailyTurnsLeft, v => Math.round(v).toLocaleString());
    if (rtc) rtc.textContent = `${cred.dailyTurnsLeft} left`;
    if (rtp) rtp.textContent = `${cred.used} turns processed today`;
  }

  /* ================= 4. Audio Buffer & VAD Runway ================= */
  const cash = $id('cash');
  function initCash() {
    if (!cash) return;
    cash.innerHTML = `<div class="in-c">
      <div class="row" style="justify-content:space-between">
        <div class="cap">Audio Engine & VAD</div>
        <span class="muted" style="font-size:10px">Silero VAD ONNX</span>
      </div>
      <div class="row" style="margin-top:10px;align-items:baseline;justify-content:space-between">
        <span class="big csv" style="font-size:26px">16 kHz</span>
        <span class="mono" style="font-size:13px;font-weight:500"><span class="crw">640</span><span class="muted" style="font-size:10px"> ms silence</span></span>
      </div>
      <div class="row" style="position:absolute;left:14px;right:14px;bottom:12px;justify-content:space-between;align-items:center">
        <svg class="cst" width="130" height="16" aria-hidden="true"></svg>
        <span class="mono muted" style="font-size:9.5px">Barge-in ready</span>
      </div>
    </div>`;
  }

  function updateCash() {
    if (!cash) return;
    const svg = cash.querySelector('.cst');
    if (!svg) return;
    const W = 130, n = 28;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = 1 + i * (W - 2) / (n - 1), on = i / (n - 1) <= 0.7;
      s += `<line x1="${x}" x2="${x}" y1="${i % 5 === 0 ? 1 : 5}" y2="15" stroke="${on ? '#10B981' : 'rgba(255,255,255,.2)'}" stroke-width="1.4" stroke-linecap="round"/>`;
    }
    svg.innerHTML = s;
  }

  /* ================= 5. Recent Voice Turns ================= */
  const pay = $id('pay');
  function updatePay() {
    if (!pay) return;
    const turns = activeData.recentTurns || DEFAULT_DATA.recentTurns;
    pay.innerHTML = `<div class="in-c" style="padding:10px 14px">
      <div class="row" style="justify-content:space-between">
        <div class="cap">Recent User Turns</div>
        <span class="mono muted" style="font-size:9.5px">Real Interactions</span>
      </div>
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:1px">
        ${turns.slice(0, 3).map((item, i) => `
          <div class="row" style="height:25px;${i ? 'border-top:1px solid rgba(255,255,255,.05)' : ''};align-items:center">
            <i style="width:16px;height:16px;border-radius:4px;background:rgba(99,102,241,.2);display:grid;place-items:center;font:600 9px Inter;font-style:normal;color:#818cf8;flex:0 0 auto">
              ${(item.persona || 'S').charAt(0)}
            </i>
            <span style="flex:1;font-size:10.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;padding-right:4px">
              ${item.query}
            </span>
            <span class="mono" style="text-align:right;font-size:10px;color:#34D399;flex:0 0 auto">${item.latencyMs || 780}ms</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  /* ================= 6. Challenge Benchmarks ================= */
  const goals = $id('goals');
  function updateGoals() {
    if (!goals) return;
    const gList = activeData.goals || DEFAULT_DATA.goals;
    goals.innerHTML = `<div class="in-c" style="padding:10px 14px">
      <div class="row" style="justify-content:space-between">
        <div class="cap">System Benchmarks</div>
        <span class="muted" style="font-size:9.5px">Target Goals</span>
      </div>
      ${gList.map((g, k) => `
        <div style="margin-top:${k ? 8 : 8}px">
          <div class="row" style="justify-content:space-between;font-size:10.5px;font-weight:600">
            <span>${g.name}</span>
            <span class="mono" style="font-weight:500">${Math.round(g.progress * 100)}%<span class="muted"> / ${g.target}</span></span>
          </div>
          <svg width="100%" height="8" style="margin-top:3px;display:block" class="gl" data-f="${g.progress}" aria-hidden="true"></svg>
        </div>
      `).join('')}
    </div>`;

    RAF(() => goals.querySelectorAll('.gl').forEach((svg) => {
      const W = svg.getBoundingClientRect().width || 120, n = 32, f = +svg.dataset.f;
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = 1 + i * (W - 2) / (n - 1), on = i / (n - 1) <= f;
        s += `<line x1="${x}" x2="${x}" y1="${i % 6 === 0 ? 0 : 3}" y2="8" stroke="${on ? '#6366F1' : 'rgba(255,255,255,.18)'}" stroke-width="1.3" stroke-linecap="round"/>`;
      }
      svg.innerHTML = s;
    }));
  }

  /* ================= 7. Dual Audio Speech Flow ================= */
  const flow = $id('flow');
  let flowRaf = 0;

  function initFlow() {
    if (!flow) return;
    flow.innerHTML = `${bg(GR.rose)}<div class="in-c">
      <div class="row" style="justify-content:space-between">
        <div>
          <div class="ttl">Dual Audio Speech Flow</div>
          <div class="muted" style="margin-top:2px;font-size:10px"><span class="mono" style="color:#34D399">16kHz Mic In → 24kHz Timbre Out</span></div>
        </div>
        <div class="legend" style="flex-direction:column;gap:2px;align-items:flex-end;font-size:10px">
          <span><i style="background:#fff"></i>Mic Input</span>
          <span><i style="background:#FDA4AF"></i>TTS Waveform</span>
        </div>
      </div>
      <svg class="fls" style="position:absolute;left:0;bottom:8px" aria-hidden="true"></svg>
    </div><div class="rim"></div>`;
  }

  function updateFlow(instant) {
    if (!flow) return;
    const svg = flow.querySelector('.fls');
    if (!svg) return;
    const MLAB = activeData.speechFlow?.months || DEFAULT_DATA.speechFlow.months;
    const INC = activeData.speechFlow?.inputMic || DEFAULT_DATA.speechFlow.inputMic;
    const SPN = activeData.speechFlow?.outputTts || DEFAULT_DATA.speechFlow.outputTts;

    const W = flow.clientWidth || 400, Hh = Math.max(145, (flow.clientHeight || 218) - 55), L = 32, R = W - 28, mid = Hh / 2, lab = 14, amp = mid - lab - 8, max = 6;
    svg.setAttribute('width', W); svg.setAttribute('height', Hh); svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const X = i => L + i / (MLAB.length - 1) * (R - L);
    cancelAnimationFrame(flowRaf);
    const t0 = instant ? -1e6 : performance.now();

    const frame = (now) => {
      const g = ease(reduce ? 1 : Math.min(1, (now - t0) / 900));
      const path = (arr, dir) => smoothPath(arr.map((v, i) => [X(i), mid + dir * (lab + v / max * amp * g)]));
      let s = '';
      [2, 4].forEach(v => {
        const yT = mid - lab - v / max * amp, yB = mid + lab + v / max * amp;
        s += `<line x1="${L}" x2="${R}" y1="${yT}" y2="${yT}" stroke="${HAIR}"/><line x1="${L}" x2="${R}" y1="${yB}" y2="${yB}" stroke="${HAIR}"/>
              <text x="${L - 8}" y="${yT + 3}" text-anchor="end" font-size="8.5" fill="${T3}" font-family="Geist Mono">${v}s</text>
              <text x="${L - 8}" y="${yB + 3}" text-anchor="end" font-size="8.5" fill="${T3}" font-family="Geist Mono">${v}s</text>`;
      });
      MLAB.forEach((m, i) => s += `<text x="${X(i)}" y="${mid + 4}" text-anchor="middle" font-size="9.5" font-weight="500" fill="rgba(255,255,255,.8)" font-family="Geist Mono">${m}</text>`);
      INC.slice().reverse().forEach((a, k) => {
        const j = 2 - k;
        s += `<path d="${path(a, -1)}" fill="none" stroke="#fff" stroke-opacity="${[1, .55, .3][j]}" stroke-width="${j ? 1.3 : 1.9}" stroke-linecap="round"/>`;
      });
      SPN.slice().reverse().forEach((a, k) => {
        const j = 2 - k;
        s += `<path d="${path(a, 1)}" fill="none" stroke="#FDA4AF" stroke-opacity="${[1, .55, .3][j]}" stroke-width="${j ? 1.3 : 1.9}" stroke-linecap="round"/>`;
      });
      s += `<line class="hl" y1="8" y2="${Hh - 8}" stroke="#fff" stroke-opacity=".5" opacity="0"/><rect class="hit" x="${L - 8}" width="${R - L + 16}" height="${Hh}" fill="transparent"/>`;
      svg.innerHTML = s;

      const hit = svg.querySelector('.hit'), hl = svg.querySelector('.hl');
      if (hit) {
        hit.onpointermove = e => {
          const r = svg.getBoundingClientRect(), z = r.width / W, x = (e.clientX - r.left) / z, i = Math.max(0, Math.min(5, Math.round((x - L) / (R - L) * 5)));
          hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hl.setAttribute('opacity', 1);
          showTip(r.left + X(i) * z, r.top + (mid - lab - INC[0][i] / max * amp) * z, `${MLAB[i]} Audio Stats`, [
            ['Mic In (STT)', INC[0][i] + ' sec audio', '#fff'],
            ['TTS Out (Timbre)', SPN[0][i] + ' sec speech', '#FDA4AF'],
            ['Total Time', (INC[0][i] + SPN[0][i]).toFixed(1) + ' sec']
          ]);
        };
        hit.onpointerleave = () => { hl.setAttribute('opacity', 0); hideTip(); };
      }
      if (g < 1) flowRaf = RAF(frame);
    };
    flowRaf = RAF(frame);
  }

  /* ================= 8. Active Personas Card ================= */
  const cr = $id('crypto');
  function initCrypto() {
    if (!cr) return;
    cr.innerHTML = `${bg(GR.amber)}<div class="in-c">
      <div class="row" style="justify-content:space-between">
        <div class="ttl">Configured Personas</div>
        <span class="muted" style="font-size:10px">3 Live Engines</span>
      </div>
      <div class="crb" style="margin-top:6px"></div>
      <div class="crl" style="position:absolute;left:16px;right:16px;bottom:12px"></div>
    </div><div class="rim"></div>`;
  }

  function candles(asset) {
    const d = asset?.trend ? asset.trend.map(x => x[3]) : [10, 15, 20, 25, 30];
    const W = 72, H = 20;
    const lo = Math.min(...d), hi = Math.max(...d), pad = (hi - lo) * .15 || 1, Y = v => H - 2 - (v - lo + pad) / (hi - lo + 2 * pad) * (H - 4);
    const P = d.map((v, i) => [2 + i / (d.length - 1) * (W - 4), Y(v)]), e = P[P.length - 1];
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${smoothPath(P)}" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${e[0]}" cy="${e[1]}" r="2.5" fill="#fff" stroke="#F59E0B" stroke-width="1.2"/>
    </svg>`;
  }

  function updateCrypto() {
    if (!cr) return;
    const CA = activeData.personas || DEFAULT_DATA.personas;
    const crb = cr.querySelector('.crb');
    const crl = cr.querySelector('.crl');

    if (crb) {
      crb.innerHTML = `
        <div style="display:flex;gap:2px;height:4px">
          ${CA.map((a, i) => `<div style="flex:0 0 calc(${a.share * 100}% - 2px);border-radius:2px;background:rgba(255,255,255,${[.95, .6, .35][i] || .5});transform-origin:left;transform:scaleX(1)" class="crs"></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:5px;padding:0 2px">
          ${CA.map((a) => `<span class="mono muted" style="font-size:9.5px">${a.name} ${Math.round(a.share * 100)}%</span>`).join('')}
        </div>`;
    }

    if (crl) {
      crl.innerHTML = CA.map((a, i) => `
        <div class="row" style="height:46px;cursor:pointer;align-items:center;gap:12px;${i ? 'border-top:1px solid rgba(255,255,255,.08)' : ''}" data-persona="${a.name}">
          <div style="flex:0 0 85px;min-width:0">
            <div style="font-size:12.5px;font-weight:600;line-height:1.2">${a.name}</div>
            <div class="mono muted" style="font-size:9.5px;line-height:1.2;margin-top:3px">${a.lang}</div>
          </div>
          <div style="flex:1;display:flex;justify-content:center;padding:0 6px">
            ${candles(a)}
          </div>
          <div style="flex:0 0 auto;min-width:80px;text-align:right">
            <div class="mono" style="font-size:11px;font-weight:600;color:#F59E0B;line-height:1.2">${a.voice}</div>
            <div class="mono muted" style="font-size:9px;line-height:1.2;margin-top:3px">Timbre v2.5</div>
          </div>
        </div>
      `).join('');

      crl.querySelectorAll('.row').forEach(row => {
        row.onclick = () => {
          const pName = row.dataset.persona;
          onSelectPersona && onSelectPersona(pName);
        };
      });
    }
  }

  /* ================= 9. Interaction Volume ================= */
  const st = $id('stocks');
  function initStocks() {
    if (!st) return;
    st.innerHTML = `${bg(GR.cyan)}<div class="in-c">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <div class="ttl">Interaction Volume</div>
          <div class="row" style="margin-top:3px;gap:6px">
            <span class="delta" style="color:#67e8f9;font-size:10px">100% Verified</span>
            <span class="muted" style="font-size:9.5px">Live sessions</span>
          </div>
        </div>
        <div style="text-align:right">
          <span class="big stv" style="font-size:24px;font-weight:600;display:block;line-height:1">${activeData.credits?.used || 14}</span>
          <span class="muted" style="font-size:9.5px;text-transform:uppercase;letter-spacing:0.04em">Turns</span>
        </div>
      </div>
      <svg class="sts" style="position:absolute;left:14px;bottom:12px" aria-hidden="true"></svg>
    </div><div class="rim"></div>`;
  }

  function updateStocks() {
    if (!st) return;
    const svg = st.querySelector('.sts');
    if (!svg) return;
    const WK = activeData.weeklyTurns?.days || DEFAULT_DATA.weeklyTurns.days;
    const WV = activeData.weeklyTurns?.values || DEFAULT_DATA.weeklyTurns.values;

    const W = st.clientWidth - 28 || 220, Hh = Math.max(100, (st.clientHeight || 218) - 75), pb = 18, bw = 18, max = 10, gap = (W - 20 - bw * 5) / 4;
    svg.setAttribute('width', W); svg.setAttribute('height', Hh);
    const Y = x => (Hh - pb) * (1 - x / max);
    let s = '';
    [0, 5].forEach(t => s += `<text x="0" y="${Y(t) + 3}" font-size="8.5" fill="${T3}" font-family="Geist Mono">${t}</text>`);
    WV.forEach((x, i) => {
      const X = 18 + i * (bw + gap);
      const today = i === WV.length - 1;
      s += `<rect x="${X}" y="${Y(max)}" width="${bw}" height="${Hh - pb - Y(max)}" rx="${bw / 2}" fill="rgba(0,0,0,.28)"/>
            <rect class="sb" x="${X}" y="${Y(x)}" width="${bw}" height="${Hh - pb - Y(x)}" rx="${bw / 2}" fill="${today ? '#67E8F9' : '#fff'}"/>
            <text x="${X + bw / 2}" y="${Hh - 2}" text-anchor="middle" font-size="8.5" fill="${today ? '#fff' : T3}" font-family="Geist Mono">${WK[i]}</text>
            <rect class="hit" x="${X - 4}" y="0" width="${bw + 8}" height="${Hh}" fill="transparent" data-i="${i}"/>`;
    });
    svg.innerHTML = s;

    svg.querySelectorAll('.hit').forEach(h => {
      h.onpointermove = e => {
        const i = +h.dataset.i;
        showTip(e.clientX, e.clientY, `${WK[i]} Turn Volume`, [
          ['Voice Turns', Math.round(WV[i] * 4) + ' queries', '#67E8F9'],
          ['Completion', '100%']
        ]);
      };
      h.onpointerleave = hideTip;
    });
  }

  function updateAll() {
    try { updateNW(); } catch(e) { console.warn('updateNW error:', e); }
    try { updateAlloc(); } catch(e) { console.warn('updateAlloc error:', e); }
    try { updateRet(); } catch(e) { console.warn('updateRet error:', e); }
    try { updateCash(); } catch(e) { console.warn('updateCash error:', e); }
    try { updatePay(); } catch(e) { console.warn('updatePay error:', e); }
    try { updateGoals(); } catch(e) { console.warn('updateGoals error:', e); }
    try { updateFlow(); } catch(e) { console.warn('updateFlow error:', e); }
    try { updateCrypto(); } catch(e) { console.warn('updateCrypto error:', e); }
    try { updateStocks(); } catch(e) { console.warn('updateStocks error:', e); }
  }

  // Initialize all cards
  initNW();
  initAlloc();
  initRet();
  initCash();
  initFlow();
  initCrypto();
  initStocks();

  updateAll();

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
    if (!alive) return;
    try { drawNW(); } catch {}
    try { updateFlow(true); } catch {}
    try { updateStocks(); } catch {}
  }) : null;
  if (ro && root) ro.observe(root);

  return {
    destroy() {
      alive = false;
      if (ro) ro.disconnect();
      cancelAnimationFrame(nwRaf);
      cancelAnimationFrame(flowRaf);
      frames.clear();
      hideTip();
    },
    update(newData) {
      if (newData) {
        activeData = { ...newData };
      }
      updateAll();
    }
  };
}

export function VoiceBento({
  data = DEFAULT_DATA,
  activePersona,
  onSelectPersona,
  className = "",
  style,
}: VoiceBentoProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const instRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!rootRef.current) return;
    if (instRef.current) {
      instRef.current.destroy();
      instRef.current = null;
    }
    rootRef.current.innerHTML = `<style>${CSS}</style>${markup()}`;

    try {
      const inst = mount(rootRef.current, data, onSelectPersona);
      instRef.current = inst;
    } catch (err) {
      console.error('[VoiceBento] Mount error:', err);
    }

    return () => {
      if (instRef.current) {
        instRef.current.destroy();
        instRef.current = null;
      }
      if (rootRef.current) rootRef.current.innerHTML = "";
    };
  }, []);

  React.useEffect(() => {
    if (instRef.current && data) {
      instRef.current.update(data);
    }
  }, [data]);

  return (
    <div
      ref={rootRef}
      className={`pvb ${className}`}
      style={style}
    />
  );
}

export default VoiceBento;
