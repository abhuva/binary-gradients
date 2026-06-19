import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { LUT_GENERATOR_TYPES } from '../src/lut/generators.js';
import { parseFrontmatter } from '../src/wiki/frontmatter.js';

test('parseFrontmatter reads scalar and array metadata', () => {
  const parsed = parseFrontmatter(`---
id: render-combine
title: Comb > Combine
order: 20
related:
  - gradient-fields
  - lut-definition
---

# Body
`);

  assert.deepEqual(parsed.metadata, {
    id: 'render-combine',
    title: 'Comb > Combine',
    order: 20,
    related: ['gradient-fields', 'lut-definition'],
  });
  assert.equal(parsed.body, '# Body\n');
});

test('wiki manifest references existing markdown files with matching frontmatter ids', () => {
  const manifest = JSON.parse(readFileSync('docs/wiki/index.json', 'utf8'));
  for (const [id, path] of Object.entries(manifest.articles)) {
    assert.ok(existsSync(path), `${id} points to missing ${path}`);
    const article = parseFrontmatter(readFileSync(path, 'utf8'));
    assert.equal(article.metadata.id, id, `${path} frontmatter id should match manifest key`);
    assert.ok(article.metadata.title, `${id} should have a title`);
    assert.ok(article.body.trim(), `${id} should have article body`);
  }
});

test('every LUT generator has a contextual wiki article', () => {
  const manifest = JSON.parse(readFileSync('docs/wiki/index.json', 'utf8'));
  for (const generatorId of Object.keys(LUT_GENERATOR_TYPES)) {
    const articleId = `lut-generator-${generatorId}`;
    assert.ok(manifest.articles[articleId], `${generatorId} needs ${articleId}`);
  }
});
