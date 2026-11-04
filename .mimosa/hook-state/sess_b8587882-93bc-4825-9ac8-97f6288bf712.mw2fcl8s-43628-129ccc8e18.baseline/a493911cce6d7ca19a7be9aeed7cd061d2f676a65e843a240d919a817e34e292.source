/* ============================================================
   เว็บสื่อการสอน Software Engineering 05506017 (1/2569)
   main.js — sidebar, theme, progress, stepwise solutions
   ============================================================ */
'use strict';

/* ---------- โครงสร้างหลักสูตร ---------- */
const SITE = {
  course: 'Software Engineering 05506017',
  term: '1/2569',
  chapters: [
    {
      ch: 1, color: '#0ea5e9', title: 'บทนำสู่วิศวกรรมซอฟต์แวร์', en: 'Introduction to SE',
      sections: [
        { no: '1', file: 'ch1.html', title: 'ประวัติ SE · ประเภทซอฟต์แวร์ · SDLC', practice: 6 },
      ],
    },
    {
      ch: 2, color: '#8b5cf6', title: 'หลักการวิศวกรรมซอฟต์แวร์', en: 'SE Principles',
      sections: [
        { no: '2', file: 'ch2.html', title: '4 ชั้นความรู้ · 7 หลักการสำคัญ', practice: 5 },
      ],
    },
    {
      ch: 3, color: '#ec4899', title: 'คุณภาพซอฟต์แวร์', en: 'Software Quality',
      sections: [
        { no: '3', file: 'ch3.html', title: '16 คุณภาพ · External/Internal · 4 ระบบ', practice: 8 },
      ],
    },
    {
      ch: 4, color: '#10b981', title: 'งานพัฒนาซอฟต์แวร์', en: 'Tasks of SW Development',
      sections: [
        { no: '4', file: 'ch4.html', title: '13 งาน · Verification vs Validation', practice: 6 },
      ],
    },
    {
      ch: 5, color: '#f59e0b', title: 'การจัดการโครงการซอฟต์แวร์', en: 'Project Management',
      sections: [
        { no: '5', file: 'ch5.html', title: 'แผนโครงการ · Milestone · WBS · Gantt · PERT/CPM', practice: 6 },
      ],
    },
    {
      ch: 6, color: '#ef4444', title: 'วิศวกรรมความต้องการ', en: 'Requirement Engineering',
      sections: [
        { no: '6', file: 'ch6.html', title: 'FR/NFR · FURPS+ · User Story · Acceptance Test', practice: 6 },
      ],
    },
    {
      ch: 7, color: '#6366f1', title: 'สถาปัตยกรรมซอฟต์แวร์', en: 'Software Architecture',
      sections: [
        { no: '7', file: 'ch7.html', title: 'สไตล์สถาปัตยกรรม · REST · ER Schema · MVC', practice: 6 },
      ],
    },
    {
      ch: 8, color: '#14b8a6', title: 'โมเดลกระบวนการซอฟต์แวร์', en: 'Software Process Models',
      sections: [
        { no: '8', file: 'ch8.html', title: 'Waterfall · Spiral · RAD · RUP · XP · Scrum', practice: 6 },
      ],
    },
    {
      ch: 9, color: '#f97316', title: 'Use Cases', en: 'Use Case Modeling',
      sections: [
        { no: '9', file: 'ch9.html', title: 'Actor · Use Case Diagram · include/extend · SSD', practice: 6 },
      ],
    },
    {
      ch: 10, color: '#22c55e', title: 'การทดสอบซอฟต์แวร์', en: 'Software Testing',
      sections: [
        { no: '10', file: 'ch10.html', title: 'Unit→Integration→System→Acceptance · Black/White box', practice: 8 },
      ],
    },
    {
      ch: 11, color: '#a855f7', title: 'การบำรุงรักษาซอฟต์แวร์', en: 'Software Maintenance',
      sections: [
        { no: '11', file: 'ch11.html', title: '4 ประเภท · กระบวนการ · Maintainability', practice: 6 },
      ],
    },
    {
      ch: 12, color: '#e11d48', title: 'ติวตามแนวข้อสอบจากรุ่นพี่', en: 'Exam Prep',
      sections: [
        { no: 'F', file: 'exam.html', title: 'ติว Final — ข้อสอบรุ่นพี่ + เฉลย CS-Hospital', practice: 8, disp: '🎓 ติว Final' },
        { no: 'S', file: 'summary.html', title: 'สรุปรวมทุกบท — ทบทวนก่อนเข้าห้องสอบ', practice: 0, disp: '📋 สรุปรวม' },
      ],
    },
  ],
};

function secLabel(s) { return s.disp ? s.disp : 'บทที่ ' + s.no + ' — ' + s.title; }

const flatSections = [];
SITE.chapters.forEach((c) => c.sections.forEach((s) => flatSections.push({ ...s, ch: c.ch, color: c.color, chTitle: c.title })));

/* ---------- storage ---------- */
const PKEY = 'se269-progress';
function getProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(PKEY) || '[]')); } catch (e) { return new Set(); }
}
function saveProgress(set) {
  try { localStorage.setItem(PKEY, JSON.stringify([...set])); } catch (e) { /* ignore */ }
}
function secKeyPrefix(secNo) { return 'p' + secNo + '-'; }
function secDoneCount(secNo, total) {
  const pre = secKeyPrefix(secNo); const prog = getProgress();
  let n = 0; for (let i = 1; i <= total; i++) if (prog.has(pre + i)) n++;
  return n;
}
function chapterCounts(chIdx) {
  const c = SITE.chapters[chIdx];
  const total = c.sections.reduce((a, s) => a + s.practice, 0);
  const done = c.sections.reduce((a, s) => a + secDoneCount(s.no, s.practice), 0);
  return { done, total };
}

/* ---------- theme ---------- */
function initTheme() {
  const saved = localStorage.getItem('se269-theme');
  const theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = dark ? '☀️' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('se269-theme', next);
  updateThemeIcon();
}

/* ---------- sidebar ---------- */
function buildSidebar() {
  const nav = document.getElementById('sidebar');
  if (!nav) return;
  const curSec = document.body.dataset.section || '';
  const curPage = document.body.dataset.page || '';

  let html = `
    <div class="side-search"><input type="search" id="sideSearch" placeholder="ค้นหาหัวข้อ…" aria-label="ค้นหาหัวข้อ"></div>
    <a class="side-home ${curPage === 'index.html' ? 'active' : ''}" href="index.html">🏠 หน้าแรก</a>`;

  for (const c of SITE.chapters) {
    html += `<div class="side-ch" style="--ch-c:${c.color}">
      <div class="side-ch-head"><span class="side-ch-dot">${c.ch === 12 ? '★' : c.ch}</span><span>${c.title}</span></div>
      <ul class="side-ch-list">`;
    for (const s of c.sections) {
      const done = secDoneCount(s.no, s.practice) >= s.practice && s.practice > 0;
      html += `<li><a href="${s.file}" class="${curSec === s.no ? 'active' : ''} ${done ? 'done' : ''}">${secLabel(s)}</a></li>`;
    }
    html += '</ul></div>';
  }
  nav.innerHTML = html;

  const inp = document.getElementById('sideSearch');
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    nav.querySelectorAll('.side-ch').forEach((div) => {
      let any = false;
      div.querySelectorAll('li').forEach((li) => {
        const hit = !q || li.textContent.toLowerCase().includes(q);
        li.style.display = hit ? '' : 'none';
        if (hit) any = true;
      });
      div.style.display = any ? '' : 'none';
    });
  });
}

/* ---------- mobile nav ---------- */
function initNav() {
  const btn = document.getElementById('menuBtn');
  const side = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  if (!btn) return;
  btn.addEventListener('click', () => {
    side.classList.toggle('open');
    scrim.classList.toggle('show', side.classList.contains('open'));
  });
  scrim.addEventListener('click', () => {
    side.classList.remove('open');
    scrim.classList.remove('show');
  });
}

/* ---------- pager ---------- */
function buildPager() {
  const holder = document.getElementById('pager');
  if (!holder) return;
  const curPage = document.body.dataset.page || '';
  let idx = flatSections.findIndex((s) => s.file === curPage);
  if (curPage === 'index.html') idx = -1;
  let html = '';
  if (idx > 0) {
    const p = flatSections[idx - 1];
    html = `<a class="prev" href="${p.file}"><span class="dir">◀ ก่อนหน้า</span><span class="dest">${secLabel(p)}</span></a>`;
  } else if (idx === 0) {
    html = '<a class="prev" href="index.html"><span class="dir">◀ ก่อนหน้า</span><span class="dest">หน้าแรก</span></a>';
  } else {
    html = '<a class="empty"></a>';
  }
  if (idx >= 0 && idx < flatSections.length - 1) {
    const n = flatSections[idx + 1];
    html += `<a class="next" href="${n.file}"><span class="dir">ถัดไป ▶</span><span class="dest">${secLabel(n)}</span></a>`;
  } else if (idx === flatSections.length - 1) {
    html += '<a class="next empty"></a>';
  } else if (idx === -1 && flatSections.length) {
    html += `<a class="next" href="${flatSections[0].file}"><span class="dir">เริ่มเรียน ▶</span><span class="dest">${secLabel(flatSections[0])}</span></a>`;
  }
  holder.innerHTML = html;
}

/* ---------- progress checkboxes ---------- */
function initProgress() {
  const prog = getProgress();
  document.querySelectorAll('.pr-card[data-pkey]').forEach((card) => {
    const key = card.dataset.pkey;
    const cb = card.querySelector('input[type="checkbox"]');
    const sync = () => {
      card.classList.toggle('done', prog.has(key));
      if (cb) cb.checked = prog.has(key);
    };
    sync();
    if (cb) cb.addEventListener('change', () => {
      const p = getProgress();
      if (cb.checked) p.add(key); else p.delete(key);
      saveProgress(p);
      card.classList.toggle('done', cb.checked);
      refreshProgressUI();
    });
  });
}

function refreshProgressUI() {
  document.querySelectorAll('[data-chprog]').forEach((el) => {
    const chIdx = SITE.chapters.findIndex((c) => c.ch === Number(el.dataset.chprog));
    if (chIdx < 0) return;
    const { done, total } = chapterCounts(chIdx);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const bar = el.querySelector('.pbar > i');
    const lbl = el.querySelector('[data-chpctlbl]');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = total ? `${done}/${total} ข้อ (${pct}%)` : '—';
  });
  document.querySelectorAll('[data-secmeta]').forEach((el) => {
    const [chN, secNo] = el.dataset.secmeta.split('|');
    const c = SITE.chapters.find((x) => x.ch === Number(chN));
    if (!c) return;
    const s = c.sections.find((x) => x.no === secNo);
    if (!s) return;
    const done = secDoneCount(s.no, s.practice);
    el.textContent = done >= s.practice && s.practice > 0 ? `✓ ครบ ${done}/${s.practice}` : (s.practice ? `${done}/${s.practice} ข้อ` : 'อ่าน');
    const link = el.closest('a');
    if (link) link.classList.toggle('done', done >= s.practice && s.practice > 0);
  });
  const ov = document.querySelector('[data-overall]');
  if (ov) {
    let done = 0, total = 0;
    SITE.chapters.forEach((_, i) => { const r = chapterCounts(i); done += r.done; total += r.total; });
    const pct = total ? Math.round((done / total) * 100) : 0;
    ov.querySelector('.pbar > i').style.width = pct + '%';
    const lbl = ov.querySelector('[data-overalllbl]');
    if (lbl) lbl.textContent = `ทำโจทย์ซ้อมสำเร็จแล้ว ${done} จาก ${total} ข้อ (${pct}%)`;
  }
  const nav = document.getElementById('sidebar');
  if (nav) {
    nav.querySelectorAll('.side-ch-list a').forEach((a) => {
      const m = a.getAttribute('href');
      const fs = flatSections.find((s) => s.file === m);
      if (fs) a.classList.toggle('done', secDoneCount(fs.no, fs.practice) >= fs.practice && fs.practice > 0);
    });
  }
}

/* ---------- stepwise practice solutions ---------- */
function initStepwise() {
  document.querySelectorAll('details.sol').forEach((det) => {
    const ol = det.querySelector('ol.steps');
    if (!ol || ol.children.length < 2) return;
    ol.classList.add('stepwise');
    const items = [...ol.children];
    const controls = document.createElement('div');
    controls.className = 'sol-controls';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    const allBtn = document.createElement('button');
    allBtn.className = 'btn';
    allBtn.textContent = 'แสดงทั้งหมด';
    controls.append(nextBtn, allBtn);
    ol.before(controls);

    let shown = 0;
    const render = () => {
      items.forEach((li, i) => li.classList.toggle('revealed', i < shown));
      nextBtn.style.display = shown >= items.length ? 'none' : '';
      nextBtn.textContent = shown === 0
        ? `👀 ดูเฉลยขั้นที่ 1 (มี ${items.length} ขั้น)`
        : `➡️ ขั้นถัดไป (${Math.min(shown + 1, items.length)}/${items.length})`;
    };
    nextBtn.addEventListener('click', () => { shown = Math.min(shown + 1, items.length); render(); });
    allBtn.addEventListener('click', () => { shown = items.length; render(); });
    render();
  });
}

/* ---------- boot ---------- */
initTheme();
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  initNav();
  buildPager();
  initStepwise();
  initProgress();
  refreshProgressUI();
  const tb = document.getElementById('themeBtn');
  if (tb) tb.addEventListener('click', toggleTheme);
  const rp = document.getElementById('resetBtn');
  if (rp) rp.addEventListener('click', () => {
    if (confirm('ล้างความคืบหน้าทั้งหมดใช่ไหม?')) {
      localStorage.removeItem(PKEY);
      refreshProgressUI();
      document.querySelectorAll('.pr-card[data-pkey]').forEach((c) => {
        c.classList.remove('done');
        const cb = c.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      });
    }
  });
});
