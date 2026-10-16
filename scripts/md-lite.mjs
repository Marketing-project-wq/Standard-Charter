// Renderer Markdown -> HTML tanpa dependensi, untuk subset yang dihasilkan html-to-md.mjs:
// heading #/##/###, paragraf, daftar bersarang (- dan 1.), tabel pipe, blockquote, **tebal**, *miring*,
// [teks](url http/https), dan penanda "⚠️ Verifikasi". Semua teks di-escape; tidak ada HTML mentah.

export const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const VERIF = '⚠️ Verifikasi';

export function inline(src) {
  const stash = [];
  const hold = html => { stash.push(html); return `\u0000${stash.length - 1}\u0000`; };
  let s = src.replace(/\\([\\*_`\[\]<>|])/g, (_, c) => hold(escHtml(c)));
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => hold(`<a href="${escHtml(u)}" target="_blank" rel="noopener noreferrer">${inline(t)}</a>`));
  s = s.replace(/\[([^\]]+)\]\(([\w-]+\.(?:md|html)(?:#[\w-]+)?)\)/g, (_, t, u) => hold(`<a href="${escHtml(u.replace(/\.md/, '.html'))}">${inline(t)}</a>`));
  s = escHtml(s).split(VERIF).join(hold(`<span class="mk">${VERIF}</span>`));
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
}

const isTableSep = l => /^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(l.trim());
const cells = l => { const out = []; let cur = ''; const t = l.trim().replace(/^\|/, '').replace(/\|$/, ''); for (let i = 0; i < t.length; i++) { if (t[i] === '\\' && t[i + 1] === '|') { cur += '|'; i++; } else if (t[i] === '|') { out.push(cur.trim()); cur = ''; } else cur += t[i]; } out.push(cur.trim()); return out; };
const slugId = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function render(md, opts = {}) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = []; const headings = [];
  let i = 0;
  const listAt = (idx) => /^(\s*)(-|\d+\.) /.exec(lines[idx]);

  function list(indent) {
    const ordered = /^\s*\d+\./.test(lines[i]);
    const tag = ordered ? 'ol' : 'ul'; const items = [];
    while (i < lines.length) {
      const m = listAt(i); if (!m || m[1].length < indent) break;
      if (m[1].length > indent) { if (items.length) items[items.length - 1] += list(m[1].length); else break; continue; }
      if (/^\d+\./.test(m[2]) !== ordered) break;
      items.push(inline(lines[i].replace(/^\s*(-|\d+\.) /, ''))); i++;
    }
    return `<${tag}>${items.map(x => `<li>${x}</li>`).join('')}</${tag}>`;
  }

  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === '') { i++; continue; }
    let m;
    if ((m = /^(#{1,3}) (.*)$/.exec(l))) {
      const level = m[1].length; const text = m[2];
      const num = /^(\d+\.\d+)\b/.exec(text);
      const id = num ? 's' + num[1].replace('.', '-') : slugId(text);
      headings.push({ level, text, id });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`); i++; continue;
    }
    if (l.startsWith('>')) {
      const block = [];
      while (i < lines.length && lines[i].startsWith('>')) { block.push(lines[i].replace(/^> ?/, '')); i++; }
      const inner = render(block.join('\n'), opts).html;
      const first = block.find(x => x.trim()) || '';
      const cls = first.startsWith('**Terkonfirmasi sumber resmi**') ? 'conf' : /^\*\*[^*]+:\*\*/.test(first) ? 'src' : first.startsWith('Kategori:') ? 'cat' : '';
      out.push(`<blockquote${cls ? ` class="${cls}"` : ''}>${inner}</blockquote>`); continue;
    }
    if (l.trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(cells(lines[i])); i++; }
      out.push(`<div class="tw"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if ((m = listAt(i))) { out.push(list(m[1].length)); continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3} |>|\|)/.test(lines[i]) && !listAt(i)) { para.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return { html: out.join('\n'), headings };
}

export function plainText(md) {
  return md.replace(/\]\(https?:\/\/[^)\s]+\)/g, ']').replace(/\\([\\*_`\[\]<>|])/g, '$1').replace(/[*#>|\[\]]/g, ' ').replace(/^\s*(?:-|\d+\.)\s+/gm, '').replace(/\s+/g, ' ').trim();
}
