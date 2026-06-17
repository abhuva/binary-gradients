import { renderMarkdown } from '../wiki/markdown.js';

export function createWikiPanel({ panel, loader }) {
  const title = panel?.querySelector('[data-wiki-title]') ?? null;
  const summary = panel?.querySelector('[data-wiki-summary]') ?? null;
  const body = panel?.querySelector('[data-wiki-body]') ?? null;
  const related = panel?.querySelector('[data-wiki-related]') ?? null;
  const closeButton = panel?.querySelector('[data-wiki-close]') ?? null;
  const isReady = Boolean(panel && title && summary && body && related && closeButton);

  if (closeButton) closeButton.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (panel && !panel.hidden && event.key === 'Escape') close();
  });

  async function open(id) {
    if (!isReady) return;
    panel.hidden = false;
    panel.classList.add('loading');
    title.textContent = 'Loading wiki...';
    summary.textContent = '';
    body.replaceChildren();
    related.replaceChildren();
    try {
      const article = await loader.loadArticle(id);
      renderArticle(article);
    } catch (error) {
      title.textContent = 'Wiki article unavailable';
      summary.textContent = error.message;
      body.replaceChildren();
      console.error('Wiki load failed.', error);
    } finally {
      panel.classList.remove('loading');
    }
  }

  function close() {
    if (!panel) return;
    panel.hidden = true;
  }

  function renderArticle(article) {
    if (!isReady) return;
    title.textContent = article.metadata.title || article.id;
    summary.textContent = article.metadata.summary || '';
    body.replaceChildren(renderMarkdown(article.body, { onWikiLink: open }));
    renderRelated(article.metadata.related);
  }

  function renderRelated(ids) {
    if (!related) return;
    related.replaceChildren();
    if (!Array.isArray(ids) || ids.length === 0) return;
    const label = document.createElement('span');
    label.textContent = 'Related';
    related.appendChild(label);
    ids.forEach((id) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = id;
      button.addEventListener('click', () => open(id));
      related.appendChild(button);
    });
  }

  function enhance(root = document) {
    if (!isReady) return;
    root.querySelectorAll('[data-wiki]').forEach((node) => {
      if (node.dataset.wikiEnhanced === 'true') return;
      node.dataset.wikiEnhanced = 'true';
      node.classList.add('wiki-heading');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wiki-help-button';
      button.textContent = '?';
      button.title = 'Open wiki article';
      button.setAttribute('aria-label', `Open wiki article for ${node.textContent.trim()}`);
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        open(node.dataset.wiki);
      });
      node.appendChild(button);
    });
  }

  return { open, close, enhance };
}
