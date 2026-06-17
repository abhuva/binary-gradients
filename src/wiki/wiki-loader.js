import { parseFrontmatter } from './frontmatter.js';

export function createWikiLoader({ manifestUrl = 'docs/wiki/index.json' } = {}) {
  let manifestPromise = null;
  const articleCache = new Map();

  async function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(manifestUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Wiki manifest failed: ${response.status}`);
          return response.json();
        });
    }
    return manifestPromise;
  }

  async function loadArticle(id) {
    if (articleCache.has(id)) return articleCache.get(id);
    const manifest = await loadManifest();
    const path = manifest.articles?.[id];
    if (!path) throw new Error(`Unknown wiki article: ${id}`);
    const article = await fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`Wiki article failed: ${response.status}`);
        return response.text();
      })
      .then((source) => {
        const parsed = parseFrontmatter(source);
        return {
          id,
          path,
          metadata: { id, ...parsed.metadata },
          body: parsed.body,
        };
      });
    articleCache.set(id, article);
    return article;
  }

  return { loadManifest, loadArticle };
}
