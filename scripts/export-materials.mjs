import { readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../src/data/content.json', import.meta.url), 'utf8'));
const sources = new Map(data.sources.map(source => [source.id, source]));
function reference(id) {
  const s = sources.get(id);
  return `- [${s.id}] ${s.publisher}：《[${s.title}](${s.url})》，${s.date}（${s.dateNote}）。来源说明：${s.origin}。`;
}
const lines = [
  `# ${data.site.title}——当代案例资料包`,
  '',
  `主题：${data.site.question}`,
  '',
  `用途：同济大学《毛泽东思想和中国特色社会主义理论体系概论》小组 Presentation。核验日期：${data.site.verifiedAt}。`,
  '',
  '> 使用说明：每案“事实摘要”依据已读取文献转述；“理论联系与意义分析”“口播”和追问回答中的评价属于本组分析。口播是本组原创表达，不是任何人物的讲话原文。下列案例能说明思想方法的现实价值，不能单独证明复杂政策成果的全部成因。',
  '',
  '本文件由 `src/data/content.json` 自动生成；修改资料后运行 `npm run materials`。',
  ''
];
for (const item of data.cases) {
  lines.push(
    `## 案例${item.number}：${item.title}——${item.theory}`, '',
    `时间与场景：${item.time}；${item.place}。`, '',
    '### 事实摘要（可用于 PPT 的背景页）', '', item.factSummary, '',
    `事实依据：${item.sourceIds.map(id => `[${id}]`).join('、')}。`, '',
    '### 理论联系与意义分析（本组观点）', '', item.theoryAnalysis, '',
    '### 现实启示（本组观点）', '', item.practicalImplication, '',
    '### 课堂口播（本组原创，可直接使用）', '', item.oral, '',
    '### 适合投放到 PPT 的三行提要', '',
    `- 案例：${item.title}（${item.year}）。`,
    `- 方法：${item.method}。`,
    `- 思考：${item.reflection}`, '',
    '### 论证边界', '', item.limit, '',
    '### 准确出处', '', ...item.sourceIds.map(reference), ''
  );
  for (const id of item.clueSourceIds) {
    const s = sources.get(id);
    lines.push(`原始线索 [${id}]：[${s.publisher}提供链接](${s.url})；${s.date}（${s.dateNote}）。${s.status} 不建议在 PPT 上把此链接标为“已核实”。`, '');
  }
}
lines.push('## 整体总结：为何仍有现实意义', '', data.conclusion.text, '',
  ...data.conclusion.points.map(point => `- **${point.title}**：${point.text}`), '', data.conclusion.boundary, '',
  `理论解释参考：${reference('S5').slice(2)}`, '',
  '## 教师可能追问的三个问题', '');
data.teacherQuestions.forEach((item, i) => lines.push(`### ${i + 1}. ${item.question}`, '', item.answer, '', `依据：${item.sourceIds.map(id => `[${id}]`).join('、')}；其中事实与文献观点见下列来源，推论按本组分析表述。`, ''));
lines.push('## 完整参考文献与核验记录', '', '以下“已读取”表示本次能够读取网页正文并核对相关段落，不保证网页今后持续可访问。', '');
for (const s of data.sources.filter(s => s.verified)) lines.push(reference(s.id), `  - 核验：${s.status}`, `  - 引用范围：${s.use}。`, '');
lines.push('### 保留的待复核线索（不承载正文关键事实）', '');
for (const s of data.sources.filter(s => !s.verified)) lines.push(reference(s.id), `  - 状态：${s.status}`, '');
lines.push('## 发给 PPT 与演讲稿同学时', '',
  '- 可直接使用：三案事实摘要、三段本组理论分析、三段原创口播、三行提要、整体总结与追问回答。',
  '- PPT 中请保留对应来源编号；文末放入准确出处，区分网页发布日期与事件发生时间。',
  '- 事实摘要可压缩，理论评价请用“本组认为”“可理解为”等表述；不添加未经核实的数字或讲话引文。',
  '- 本站图形是原创 CSS / SVG 意象，没有采用来源和授权不明的历史照片；可在课堂中展示，但不能当作纪实图片。', '');
await writeFile(new URL('../CASE_MATERIALS.md', import.meta.url), lines.join('\n'));
console.log('Generated CASE_MATERIALS.md from src/data/content.json');
