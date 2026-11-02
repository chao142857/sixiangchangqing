import { sources, type Scene } from './scenes';

export default function ArchivePanel({ scene, close }: { scene: Scene; close: () => void }) {
  const relevant = sources.filter(source => [...scene.history.sourceIds, ...scene.caseData.sourceIds].includes(source.id));
  return <section className="archive" role="dialog" aria-modal="true" aria-label={`${scene.theme}资料模式`}>
    <div className="archive-shell">
      <header><div><p>思想常青 / 资料模式</p><h2>{scene.theme}</h2></div><button onClick={close}>返回演出 ×</button></header>
      <div className="archive-grid">
        <article>
          <div className="archive-label">历史脉络 · {scene.history.year}</div>
          <h3>{scene.history.title}</h3><p>{scene.history.fact}</p>
          {scene.history.quote && <blockquote>“{scene.history.quote}”</blockquote>}
          <small>{scene.history.quoteNote}</small>
          <p className="archive-analysis">{scene.history.analysis}</p>
          <a href={scene.exhibit.sourceUrl} target="_blank" rel="noreferrer">查看历史文献 ↗</a>
        </article>
        <article>
          <div className="archive-label">当代案例 · {scene.caseData.year}</div>
          <h3>{scene.caseData.title}</h3><p>{scene.caseData.factSummary}</p>
          <h4>本组分析</h4><p>{scene.caseData.theoryAnalysis}</p>
          <h4>论证边界</h4><p>{scene.caseData.limit}</p>
        </article>
      </div>
      <div className="archive-sources"><h3>文献来源</h3>{relevant.map(source => <p key={source.id}>[{source.id}] <a href={source.url} target="_blank" rel="noreferrer">{source.publisher}：《{source.title}》 ↗</a>　{source.date}（{source.dateNote}）</p>)}
        <p>场景与当代画面是生成式艺术重建，不是历史照片、原件或具体地点实景。思想联系属于本组分析。</p>
      </div>
    </div>
  </section>;
}
