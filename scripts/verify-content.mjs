import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../src/data/content.json', import.meta.url), 'utf8'));
const sources = new Map(data.sources.map(source => [source.id, source]));
assert.equal(sources.size, data.sources.length, 'Duplicate source IDs');
const hanCount = text => (text.match(/\p{Script=Han}/gu) || []).length;
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== 'object') return;
  if (value.sourceIds) for (const id of value.sourceIds) {
    assert(sources.has(id), `Missing source: ${id}`);
    assert(sources.get(id).verified, `Unverified evidence in primary sourceIds: ${id}`);
  }
  for (const child of Object.values(value)) visit(child);
}
visit(data);
assert.equal(data.cases.length, 3);
assert.equal(data.questions.length, 3);
for (const source of data.sources) assert.equal(new URL(source.url).protocol, 'https:');
for (const item of data.cases) {
  const factChars = hanCount(item.factSummary);
  const analysisChars = hanCount(item.theoryAnalysis);
  assert(factChars >= 150 && factChars <= 250, `${item.id}: fact summary ${factChars} Han characters (150–250 required)`);
  assert(analysisChars >= 100 && analysisChars <= 150, `${item.id}: analysis ${analysisChars} Han characters (100–150 required)`);
  assert(data.theories.some(theory => theory.id === item.theoryId));
  assert(item.oral.length > 50);
  console.log(`${item.title}: facts ${factChars} Han characters; analysis ${analysisChars}; sources verified`);
}
for (const question of data.questions) {
  assert.equal(question.options.length, 3);
  assert(new Set(question.options.map(option => option.feedback)).size === 3);
}
console.log(`Content checks passed: 3 cases, 3 discussions, ${data.sources.filter(source => source.verified).length} verified references, ${data.sources.filter(source => !source.verified).length} clearly marked unresolved links.`);
