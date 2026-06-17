export function parseFrontmatter(source) {
  const text = String(source ?? '');
  if (!text.startsWith('---\n')) return { metadata: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { metadata: {}, body: text };
  const raw = text.slice(4, end).trim();
  const body = text.slice(end + 4).replace(/^\s*\n/, '');
  return { metadata: parseSimpleYaml(raw), body };
}

function parseSimpleYaml(raw) {
  const result = {};
  let arrayKey = null;
  raw.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const arrayMatch = line.match(/^\s*-\s+(.+)$/);
    if (arrayMatch && arrayKey) {
      result[arrayKey].push(parseScalar(arrayMatch[1]));
      return;
    }
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!match) return;
    const [, key, value] = match;
    if (value === '') {
      result[key] = [];
      arrayKey = key;
    } else {
      result[key] = parseScalar(value);
      arrayKey = null;
    }
  });
  return result;
}

function parseScalar(value) {
  const trimmed = String(value).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}
