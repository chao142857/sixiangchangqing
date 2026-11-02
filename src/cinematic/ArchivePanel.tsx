import { sources, type Scene } from './scenes';

export default function ArchivePanel({ scene, close }: { scene: Scene; close: () => void }) {
  const relevant = sources.filter(source => [...scene.history.sourceIds, ...scene.caseData.sourceIds].includes(source.id));
  return <section className="archive" role="dialog" aria-modal="true" aria-label="参考文献与制作说明">
    <div className="archive-shell">
      <header><div><h2>参考文献与制作说明</h2><p>{scene.theme}</p></div><button onClick={close}>返回场景 ×</button></header>
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
          <h4>现实启示</h4><p>{scene.caseData.practicalImplication}</p>
        </article>
      </div>
      <div className="archive-sources"><h3>文献来源</h3>{relevant.map(source => <p key={source.id}>[{source.id}] <a href={source.url} target="_blank" rel="noreferrer">{source.publisher}：《{source.title}》 ↗</a>　{source.date}（{source.dateNote}）</p>)}
        <p>场景与当代画面是生成式艺术重建，不是历史照片、原件或具体地点实景。思想联系属于本组分析。</p>
        <p>{scene.history.architecture}</p>
        <p>书页与档案使用原典标题、短句节录及核验后的介绍，不是原典全文或手稿扫描。地图连线只表达方法联系，并非真实行军路线；卫星与轨道为通用艺术意象，不代表真实型号或参数。</p>
        <p>历史事实、引文和当代案例依据上列来源；理论联系、现实启示、口播与讨论回答属于本组分析。文献核验沿用2026年10月29日的项目记录，不表示本轮重新核验。</p>
      </div>
    </div>
  </section>;
}
