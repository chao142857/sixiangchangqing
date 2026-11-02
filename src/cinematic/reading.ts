import content from '../data/content.json';
import type { Scene } from './scenes';

export type ReadingLeaf = { title: string; paragraphs: string[]; quote?: string; sourceIds: readonly string[] };
export type ReadingSpread = { left: ReadingLeaf; right: ReadingLeaf };

// Pagination composes the existing verified records; it never depends on playback state.
// These are curated excerpts/introductions and complete case records, not fabricated primary text.
export function readingSpreads(scene: Scene): ReadingSpread[] {
  const { history, exhibit, caseData } = scene;
  const theory = content.theories.find(item => item.title === scene.theme)!;
  const sentences = caseData.factSummary.match(/[^。！？]+[。！？]?/g) || [caseData.factSummary];
  const half = Math.ceil(sentences.length / 2);
  return [
    {
      left: { title: exhibit.title, quote: history.quote || undefined, paragraphs: [history.fact], sourceIds: history.sourceIds },
      right: { title: scene.theme, paragraphs: [theory.definition, exhibit.summary, exhibit.analysis.replace(/^本组理解：/, '')], sourceIds: [...exhibit.sourceIds, ...theory.sourceIds] },
    },
    {
      left: { title: caseData.title, paragraphs: sentences.slice(0, half), sourceIds: caseData.sourceIds },
      right: { title: caseData.facts[1].title, paragraphs: sentences.slice(half), sourceIds: caseData.sourceIds },
    },
    {
      left: { title: caseData.analysis[0].title, paragraphs: [caseData.theoryAnalysis], sourceIds: caseData.sourceIds },
      right: { title: caseData.analysis[1].title, paragraphs: [caseData.practicalImplication], sourceIds: caseData.sourceIds },
    },
    {
      left: { title: '继续追问', paragraphs: [caseData.reflection, caseData.limit], sourceIds: caseData.sourceIds },
      right: { title: '回到现实', paragraphs: [caseData.oral], sourceIds: caseData.sourceIds },
    },
  ];
}
