/* ============================================================
   tts.js — อ่านออกเสียงด้วย Web Speech API + เสียงไทยออนไลน์
   เปิดใช้เฉพาะหน้าที่ใส่ data-tts="1"
   - ปุ่ม 🔊 หน้าแต่ละ section และแต่ละการ์ดโจทย์
   - แถบควบคุมลอย: เลือกเสียงไทย/อังกฤษ, ความเร็ว, พัก/หยุด
   - เสียงไทย: ใช้เสียงไทยในเครื่องก่อน ถ้าไม่มี → ใช้เสียงไทยออนไลน์
     (Google Translate TTS) ให้ทุกอุปกรณ์มีเสียงไทยใช้เสมอ
   ============================================================ */
'use strict';
(function () {
  if (document.body.dataset.tts !== '1') return;
  if (!('speechSynthesis' in window)) return;

  const LS_KEY = 'se269-tts';
  const ONLINE_TH = '__online_th__';      // ค่าพิเศษ = เสียงไทยออนไลน์
  const THAI_RE = /[\u0E00-\u0E7F]/;
  const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{2764}]/gu;
  const MAX_CHUNK = 195;                  // Google TTS จำกัด ~200 อักขระต่อครั้ง

  const state = {
    voiceTh: null, voiceEn: null, rate: 1,
    chunks: [], idx: 0, playing: false, paused: false, stopped: true,
    target: null, label: '', epoch: 0,
    cur: null,            // ตัวเล่นปัจจุบัน (SpeechSynthesisUtterance หรือ HTMLAudioElement)
    engine: 'local',      // 'local' | 'online' ของท่อนที่กำลังอ่าน
    onlineFail: 0,
  };

  /* ---------- ตั้งค่าที่บันทึกไว้ ---------- */
  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (p.rate) state.rate = p.rate;
      state._savedTh = p.th || '';
      state._savedEn = p.en || '';
    } catch (e) { /* ไม่มีค่าเดิมก็ข้าม */ }
  }
  function savePrefs() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        th: state.voiceTh === ONLINE_TH ? ONLINE_TH : (state.voiceTh ? state.voiceTh.name : ''),
        en: state.voiceEn ? state.voiceEn.name : '',
        rate: state.rate,
      }));
    } catch (e) { /* localStorage ใช้ไม่ได้ก็ไม่เป็นไร */ }
  }

  /* ---------- รายชื่อเสียง ---------- */
  function allVoices() {
    const vs = speechSynthesis.getVoices();
    const uniq = new Map();
    vs.forEach((v) => { if (!uniq.has(v.name)) uniq.set(v.name, v); });
    return [...uniq.values()];
  }
  function onlineOption(sel, savedName, localThaiCount) {
    /* เพิ่มตัวเลือก "ไทยออนไลน์" เป็นตัวแรกเสมอ — ทุกอุปกรณ์มีเสียงไทยใช้ */
    const o = document.createElement('option');
    o.value = ONLINE_TH;
    o.textContent = '🇹🇭 ไทยออนไลน์ (Google TTS) — ใช้ได้ทุกเครื่อง';
    sel.appendChild(o);
    if (!savedName || savedName === ONLINE_TH || (localThaiCount === 0 && !/^th/i.test(savedName))) sel.value = ONLINE_TH;
  }
  function fillSelect(sel, voices, savedName) {
    voices.forEach((v) => {
      const o = document.createElement('option');
      o.value = v.name;
      const isTh = /^th/i.test(v.lang);
      o.textContent = (isTh ? '🇹🇭 ' : '') + v.name + ' (' + v.lang + ')';
      sel.appendChild(o);
    });
    if (savedName && voices.some((v) => v.name === savedName)) sel.value = savedName;
  }
  function refreshVoices() {
    const list = allVoices();
    if (!list.length && el.selTh.options.length) return;
    const th = list.filter((v) => /^th/i.test(v.lang));
    const en = list.filter((v) => /^en/i.test(v.lang));
    const rest = list.filter((v) => !/^th/i.test(v.lang) && !/^en/i.test(v.lang));
    el.selTh.innerHTML = '';
    onlineOption(el.selTh, state._savedTh, th.length);
    fillSelect(el.selTh, th.concat(en, rest), state._savedTh);
    el.selEn.innerHTML = '';
    fillSelect(el.selEn, en.concat(th), state._savedEn);
    resolveVoices();
    updateHint();
  }
  function resolveVoices() {
    if (el.selTh.value === ONLINE_TH) { state.voiceTh = ONLINE_TH; }
    else { state.voiceTh = byName(el.selTh) || allVoices().find((v) => /^th/i.test(v.lang)) || null; }
    state.voiceEn = byName(el.selEn) || allVoices().find((v) => /^en/i.test(v.lang)) || null;
  }
  function byName(sel) { return allVoices().find((v) => v.name === sel.value) || null; }
  function updateHint() {
    const thLocal = allVoices().filter((v) => /^th/i.test(v.lang)).length;
    if (state.voiceTh === ONLINE_TH) {
      el.hint.textContent = thLocal
        ? 'กำลังใช้เสียงไทยออนไลน์ — ถ้าต้องการเสียงในเครื่องเลือกได้ในช่อง "เสียงไทย"'
        : 'เครื่องนี้ไม่มีเสียงไทยในตัว จึงใช้เสียงไทยออนไลน์ให้อัตโนมัติ (ต้องต่ออินเทอร์เน็ต)';
    } else if (!thLocal) {
      el.hint.textContent = '⚠️ เสียงที่เลือกไม่ใช่เสียงไทย — แนะนำเลือก "🇹🇭 ไทยออนไลน์ (Google TTS)"';
    } else {
      el.hint.textContent = '';
    }
  }

  /* ---------- ดึงข้อความจาก DOM ---------- */
  function cleanText(root) {
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script, style, input, button, label, svg, .tts-btn').forEach((n) => n.remove());
    /* ปิด details ที่ยังไม่เปิด → อ่านแค่หัวเรื่อง ไม่อ่านเฉลยที่ซ่อนอยู่ */
    clone.querySelectorAll('details:not([open])').forEach((d) => {
      const s = d.querySelector('summary');
      d.innerHTML = '';
      if (s) d.appendChild(s.cloneNode(true));
    });
    let text = clone.textContent || '';
    /* ทำความสะอาดสัญลักษณ์ที่อ่านแล้วงง */
    text = text.replace(EMOJI_RE, ' ');
    text = text.replace(/[«»→◀▶✓✗✅❌★☆●○◆☑️]/g, ' ');
    text = text.replace(/[\t\r]+/g, ' ').replace(/[ \u00A0]+/g, ' ');
    text = text.replace(/\n{2,}/g, '\n').replace(/\n /g, '\n').trim();
    return text;
  }

  /* ---------- หั่นข้อความเป็นท่อน ๆ สำหรับอ่าน ---------- */
  function chunkText(text) {
    const parts = text.split(/\n+/).flatMap((para) => {
      const sents = para.split(/(?<=[\.!?;:ๆ])\s+/);
      const out = [];
      for (let s of sents) {
        s = s.trim();
        if (!s) continue;
        if (s.length <= MAX_CHUNK) { out.push(s); continue; }
        /* ท่อนยาวเกิน: หั่นตรงช่องว่างใกล้ ๆ 180 ตัวอักษร */
        let rest = s;
        while (rest.length > MAX_CHUNK) {
          let cut = rest.lastIndexOf(' ', 180);
          if (cut < 60) cut = 180;
          out.push(rest.slice(0, cut).trim());
          rest = rest.slice(cut).trim();
        }
        if (rest) out.push(rest);
      }
      return out;
    });
    /* รวมท่อนสั้น ๆ ที่ติดกันให้อ่านต่อเนื่อง */
    const merged = [];
    for (const p of parts) {
      if (merged.length && (merged[merged.length - 1] + ' ' + p).length <= MAX_CHUNK) {
        merged[merged.length - 1] += ' ' + p;
      } else merged.push(p);
    }
    return merged.filter(Boolean).map((t) => ({ text: t, thai: THAI_RE.test(t) }));
  }

  /* ---------- เครื่องเล่น: local (speechSynthesis) ---------- */
  function playLocal(text, thai, onEnd, onErr) {
    const u = new SpeechSynthesisUtterance(text);
    const v = thai ? state.voiceTh : state.voiceEn;
    if (v && v !== ONLINE_TH) u.voice = v;
    u.lang = thai ? 'th-TH' : 'en-US';
    u.rate = state.rate;
    u.onend = onEnd;
    u.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') onErr(e);
    };
    speechSynthesis.speak(u);
    return u;
  }

  /* ---------- เครื่องเล่น: online Thai (Google Translate TTS + Polly สำรอง) ---------- */
  /* สำคัญ: ต้องตั้ง referrerPolicy = 'no-referrer' — Google ปฏิเสธ (404) ถ้ามี Referer header
     จากโดเมนอื่น (anti-hotlinking) ทำให้ <audio> ได้แต่ Format error */
  const TH_ENDPOINTS = [
    (t) => 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=' + encodeURIComponent(t),
    (t) => 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=' + encodeURIComponent(t),
    (t) => 'https://api.streamelements.com/kappa/v2/speech?voice=Amy&text=' + encodeURIComponent(t),
  ];
  function playOnline(text, onEnd, onErr, epIdx) {
    const idx = epIdx || 0;
    if (idx >= TH_ENDPOINTS.length) { onErr(idx); return; }
    /* ต้องตั้ง referrerPolicy ก่อนกำหนด src — ไม่งั้น browser ส่ง Referer ออกไปก่อน
       แล้ว Google จะคืน 404 (anti-hotlinking) ทำให้ audio ได้แต่ Format error
       ใช้ทั้ง setAttribute (กัน IDL property ไม่มี) และ property ตรง ๆ */
    const a = new Audio();
    try { a.setAttribute('referrerpolicy', 'no-referrer'); } catch (e) { /* เบราว์เซอร์เก่า */ }
    try { a.referrerPolicy = 'no-referrer'; } catch (e) { /* เบราว์เซอร์เก่า */ }
    try { a.playbackRate = Math.min(2, Math.max(0.5, state.rate)); } catch (e) { /* บางเบราว์เซอร์ไม่รองรับ */ }
    a.onended = onEnd;
    a.onerror = () => onErr(idx);
    a.preload = 'auto';
    a.src = TH_ENDPOINTS[idx](text);
    const p = a.play();
    if (p && p.catch) p.catch(() => onErr(idx));
    return a;
  }

  function pauseCurrent() {
    if (state.engine === 'online' && state.cur && state.cur.pause) state.cur.pause();
    else speechSynthesis.pause();
  }
  function resumeCurrent() {
    if (state.engine === 'online' && state.cur && state.cur.play) state.cur.play();
    else speechSynthesis.resume();
  }
  function cancelCurrent() {
    if (state.engine === 'online' && state.cur) {
      try { state.cur.pause(); state.cur.src = ''; } catch (e) { /* ไม่เป็นไร */ }
    }
    speechSynthesis.cancel();
  }

  /* ---------- เครื่องยนต์อ่าน ---------- */
  function startRead(target, label) {
    const text = cleanText(target);
    if (!text) { setStatus('ไม่พบข้อความให้อ่าน'); return; }
    state.epoch += 1;
    cancelCurrent();
    state.stopped = false; state.playing = true; state.paused = false;
    state.target = target; state.label = label;
    state.chunks = chunkText(text); state.idx = 0;
    const anchor = target.__anchor || target;
    markReading(anchor);
    if (typeof anchor.scrollIntoView === 'function') {
      try { anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* เลื่อนไม่ได้ก็อ่านต่อ */ }
    }
    setStatus('กำลังอ่าน: ' + label);
    el.pauseBtn.textContent = '⏸ พัก';
    speakChunk(0, state.epoch);
  }

  function speakChunk(i, epoch, epIdx) {
    if (state.stopped || epoch !== state.epoch) return;
    if (i >= state.chunks.length) { finish(); return; }
    state.idx = i;
    const c = state.chunks[i];
    const advance = () => {
      if (epoch !== state.epoch || state.stopped || state.paused) return;
      setTimeout(() => speakChunk(i + 1, epoch, 0), 80);
    };
    const onErr = (arg) => {
      if (epoch !== state.epoch || state.stopped) return;
      if (state.engine === 'online') {
        /* ลองช่องทางเสียงออนไลน์ถัดไปก่อน (Google → googleapis → Polly) */
        const failedEp = (typeof arg === 'number') ? arg : 0;
        if (failedEp + 1 < TH_ENDPOINTS.length) {
          setStatus('ช่องทางเสียงออนไลน์ที่ ' + (failedEp + 1) + ' ใช้ไม่ได้ — สลับช่องทางสำรอง');
          state.cur = playOnline(c.text, advance, onErr, failedEp + 1);
          return;
        }
        state.onlineFail += 1;
        setStatus('เสียงออนไลน์ใช้ไม่ได้ชั่วขณะ — สลับไปเสียงในเครื่อง');
        state.engine = 'local';
        playLocal(c.text, c.thai, advance, () => {
          /* เสียงในเครื่องก็อ่านไม่ได้ → ข้ามท่อนนี้ ไม่หยุดทั้งหมด */
          if (epoch !== state.epoch || state.stopped) { finish(); return; }
          setStatus('ข้ามท่อนที่เสียงอ่านไม่ได้');
          speakChunk(i + 1, epoch, 0);
        });
        return;
      }
      /* เสียงในเครื่อง error → ข้ามท่อนนี้ อ่านต่อ */
      setStatus('ข้ามท่อนที่เสียงอ่านไม่ได้');
      if (i + 1 < state.chunks.length) speakChunk(i + 1, epoch, 0);
      else finish();
    };
    const wantOnline = c.thai && state.voiceTh === ONLINE_TH;
    if (wantOnline && state.onlineFail < 3) {
      state.engine = 'online';
      state.cur = playOnline(c.text, advance, onErr, 0);
    } else {
      state.engine = 'local';
      state.cur = playLocal(c.text, c.thai, advance, onErr);
    }
    setStatus('กำลังอ่าน (' + (i + 1) + '/' + state.chunks.length + '): ' + state.label);
  }

  function stopAll() {
    state.epoch += 1;
    state.stopped = true; state.playing = false; state.paused = false;
    cancelCurrent();
    clearReading();
    setStatus('หยุดแล้ว');
    el.pauseBtn.textContent = '⏸ พัก';
  }
  function togglePause() {
    if (!state.playing) return;
    if (state.paused) {
      resumeCurrent(); state.paused = false;
      el.pauseBtn.textContent = '⏸ พัก';
      setStatus('กำลังอ่าน: ' + state.label);
    } else {
      pauseCurrent(); state.paused = true;
      el.pauseBtn.textContent = '▶ เล่นต่อ';
      setStatus('พักการอ่านอยู่');
    }
  }
  function finish() {
    state.playing = false; state.paused = false; state.stopped = true;
    clearReading();
    setStatus('อ่านจบแล้ว ✓');
    el.pauseBtn.textContent = '⏸ พัก';
  }
  function setStatus(t) { el.status.textContent = t; }
  function markReading(t) { clearReading(); t.classList.add('tts-reading'); }
  function clearReading() { document.querySelectorAll('.tts-reading').forEach((n) => n.classList.remove('tts-reading')); }

  /* ---------- ปุ่ม 🔊 หน้า section/หัวข้อย่อย/การ์ด ---------- */
  function makeBtn(target, label, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tts-btn' + (cls ? ' ' + cls : '');
    b.textContent = '🔊 อ่าน';
    b.setAttribute('aria-label', 'อ่านออกเสียง: ' + label);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.playing && state.target === target) stopAll();
      else startRead(target, label);
    });
    return b;
  }
  /* เนื้อหาของหัวข้อย่อย h3 = ทุก node ถัดจาก h3 จนถึง h2/h3 ถัดไป (หรือจบ section) */
  function subsectionContent(h3) {
    const box = document.createElement('div');
    let node = h3.nextElementSibling;
    while (node && !/^H[123]$/.test(node.tagName)) {
      box.appendChild(node.cloneNode(true));
      node = node.nextElementSibling;
    }
    const head = document.createElement('h3');
    head.textContent = h3.textContent;
    box.prepend(head);
    return box;
  }
  function injectButtons() {
    document.querySelectorAll('main .block[id]').forEach((sec) => {
      const h2 = sec.querySelector('h2');
      if (!h2) return;
      const name = h2.textContent.replace(EMOJI_RE, '').trim().slice(0, 60);
      h2.appendChild(makeBtn(sec, name, 'tts-sec'));
      /* ปุ่มระดับหัวข้อย่อย h3 — อ่านเฉพาะท่อนของหัวข้อนั้น ไม่รวมทั้ง section */
      sec.querySelectorAll('h3').forEach((h3) => {
        const box = subsectionContent(h3);
        box.__anchor = h3;
        h3.appendChild(makeBtn(box, h3.textContent.replace(EMOJI_RE, '').trim().slice(0, 60), 'tts-sub'));
      });
    });
    document.querySelectorAll('main .ex-card, main .pr-card').forEach((card) => {
      const head = card.querySelector('.ex-head, .pr-head');
      if (!head) return;
      const title = card.querySelector('.ex-title') ? ' ' + card.querySelector('.ex-title').textContent : '';
      head.appendChild(makeBtn(card, head.textContent.replace(EMOJI_RE, '').trim().slice(0, 50) + title));
    });
  }

  /* ---------- แถบควบคุมลอย ---------- */
  const el = {};
  function buildBar() {
    const bar = document.createElement('div');
    bar.className = 'tts-bar';
    bar.innerHTML = `
      <div class="tts-bar-head">
        <span class="tts-bar-title">🔊 อ่านออกเสียง</span>
        <button type="button" class="tts-fold" aria-label="ย่อ/กางแถบควบคุม">▾</button>
      </div>
      <div class="tts-bar-body">
        <div class="tts-status" role="status">พร้อม — กดปุ่ม 🔊 อ่าน ที่หัวข้อหรือการ์ดที่ต้องการฟัง</div>
        <div class="tts-row">
          <label>เสียงไทย <select class="tts-vth" id="ttsVoiceTh" name="ttsVoiceTh"></select></label>
          <label>เสียงอังกฤษ <select class="tts-ven" id="ttsVoiceEn" name="ttsVoiceEn"></select></label>
        </div>
        <div class="tts-row">
          <label>ความเร็ว
            <select class="tts-rate" id="ttsRate" name="ttsRate">
              <option value="0.75">ช้า 0.75×</option>
              <option value="0.9">ช้านิด 0.9×</option>
              <option value="1" selected>ปกติ 1×</option>
              <option value="1.15">เร็วนิด 1.15×</option>
              <option value="1.3">เร็ว 1.3×</option>
              <option value="1.5">เร็วมาก 1.5×</option>
            </select>
          </label>
          <button type="button" class="tts-pause">⏸ พัก</button>
          <button type="button" class="tts-stop">⏹ หยุด</button>
          <button type="button" class="tts-all">📖 อ่านทั้งหน้า</button>
        </div>
        <div class="tts-hint"></div>
      </div>`;
    document.body.appendChild(bar);
    el.bar = bar;
    el.status = bar.querySelector('.tts-status');
    el.hint = bar.querySelector('.tts-hint');
    el.selTh = bar.querySelector('.tts-vth');
    el.selEn = bar.querySelector('.tts-ven');
    el.selRate = bar.querySelector('.tts-rate');
    el.pauseBtn = bar.querySelector('.tts-pause');
    bar.querySelector('.tts-fold').addEventListener('click', () => bar.classList.toggle('min'));
    el.pauseBtn.addEventListener('click', togglePause);
    bar.querySelector('.tts-stop').addEventListener('click', stopAll);
    bar.querySelector('.tts-all').addEventListener('click', () => {
      const inner = document.querySelector('main .inner');
      if (state.playing && state.target === inner) stopAll();
      else startRead(inner, 'ทั้งหน้า');
    });
    el.selRate.value = String(state.rate);
    el.selRate.addEventListener('change', () => {
      state.rate = parseFloat(el.selRate.value) || 1;
      savePrefs();
      if (state.playing && !state.paused) { const t = state.target, l = state.label; startRead(t, l); }
    });
    el.selTh.addEventListener('change', () => {
      resolveVoices(); state.onlineFail = 0; savePrefs(); updateHint();
      if (state.playing && !state.paused) { const t = state.target, l = state.label; startRead(t, l); }
    });
    el.selEn.addEventListener('change', () => { resolveVoices(); savePrefs(); });
  }

  /* ---------- เริ่มทำงาน ---------- */
  loadPrefs();
  buildBar();
  injectButtons();
  refreshVoices();
  if (typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  } else {
    speechSynthesis.onvoiceschanged = refreshVoices;
  }
  /* เสียงบางเครื่องมาช้า — ลองโหลดซ้ำช่วงแรก */
  let tries = 0;
  const t = setInterval(() => {
    tries += 1;
    if (allVoices().length || tries > 10) { clearInterval(t); refreshVoices(); }
    else refreshVoices();
  }, 400);
  window.addEventListener('beforeunload', () => { cancelCurrent(); });
})();
