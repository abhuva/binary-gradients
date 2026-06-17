export function renderMarkdown(markdown, { onWikiLink } = {}) {
  const fragment = document.createDocumentFragment();
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      const pre = document.createElement('pre');
      const codeNode = document.createElement('code');
      if (language) codeNode.dataset.language = language;
      codeNode.textContent = code.join('\n');
      pre.appendChild(codeNode);
      fragment.appendChild(pre);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(4, heading[1].length + 1);
      const node = document.createElement(`h${level}`);
      appendInline(node, heading[2], onWikiLink);
      fragment.appendChild(node);
      index += 1;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const list = document.createElement('ul');
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        const item = document.createElement('li');
        appendInline(item, lines[index].replace(/^\s*-\s+/, ''), onWikiLink);
        list.appendChild(item);
        index += 1;
      }
      fragment.appendChild(list);
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length
      && lines[index].trim()
      && !lines[index].startsWith('```')
      && !/^(#{1,4})\s+/.test(lines[index])
      && !/^\s*-\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    const node = document.createElement('p');
    appendInline(node, paragraph.join(' '), onWikiLink);
    fragment.appendChild(node);
  }

  return fragment;
}

function appendInline(parent, text, onWikiLink) {
  const pattern = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  for (const match of String(text).matchAll(pattern)) {
    if (match.index > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
    const token = match[0];
    if (token.startsWith('`')) {
      const code = document.createElement('code');
      code.textContent = token.slice(1, -1);
      parent.appendChild(code);
    } else {
      parent.appendChild(createLink(token, onWikiLink));
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
}

function createLink(token, onWikiLink) {
  const match = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  const link = document.createElement('a');
  link.textContent = match?.[1] ?? token;
  const href = match?.[2] ?? '#';
  if (href.startsWith('wiki:')) {
    link.href = '#';
    link.dataset.wiki = href.slice(5);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onWikiLink?.(link.dataset.wiki);
    });
  } else {
    link.href = href;
    if (/^https?:\/\//.test(href)) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
  }
  return link;
}
