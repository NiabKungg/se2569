/* Mermaid loader — ใช้กับ <pre class="mermaid"> ทุกหน้าที่ include ไฟล์นี้
   หมายเหตุ: ต้องเรียก mermaid.run() เอง เพราะ dynamic import มาถึงหลัง DOMContentLoaded
   (startOnLoad จับ event ไม่ทัน) */
let mermaid;
try {
  mermaid = (await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')).default;
} catch (e) {
  try {
    mermaid = (await import('https://unpkg.com/mermaid@11/dist/mermaid.esm.min.mjs')).default;
  } catch (e2) {
    console.warn('mermaid load failed', e2);
  }
}
if (mermaid) {
  window.mermaid = mermaid; /* ไว้ debug */
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    fontFamily: '"Sarabun", "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
    er: { useMaxWidth: true },
  });
  const run = async () => {
    try {
      await mermaid.run({ querySelector: 'pre.mermaid' });
    } catch (e) {
      console.warn('mermaid run error', e);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
