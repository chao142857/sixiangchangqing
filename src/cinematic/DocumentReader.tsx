import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { readingSpreads, type ReadingLeaf, type ReadingSpread } from './reading';
import { archiveDocument, atlas, openDocument, sources, type Scene } from './scenes';

function Leaf({ leaf, side }: { leaf: ReadingLeaf; side: string }) {
  const refs = [...new Set(leaf.sourceIds)];
  return <article className={`reader-leaf ${side}`}>
    <h2>{leaf.title === '《关于领导方法的若干问题》' ? <>《关于领导方法的<br />若干问题》</> : leaf.title}</h2>
    {leaf.quote && <blockquote>“{leaf.quote}”</blockquote>}
    <div className="leaf-copy">{leaf.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
    <div className="leaf-sources">{refs.map(id => {
      const source = sources.find(item => item.id === id);
      return source ? <a key={id} href={source.url} target="_blank" rel="noreferrer">[{id}]</a> : null;
    })}</div>
  </article>;
}

export default function DocumentReader({ scene, page, disabled, onPage, onClose, onTakeOver }: {
  scene: Scene; page: number; disabled: boolean;
  onPage: (page: number) => void; onClose: () => void; onTakeOver: () => void;
}) {
  const spreads = readingSpreads(scene);
  const spread = spreads[page];
  const copy = useRef<HTMLDivElement>(null);
  const previous = useRef({ page, scene: scene.id });
  const turnId = useRef(0);
  const [turning, setTurning] = useState<{ id: number; scene: string; spread: ReadingSpread; leaf: ReadingLeaf; direction: number } | null>(null);
  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { page, scene: scene.id };
    if (disabled || last.scene !== scene.id) { setTurning(null); return; }
    if (!copy.current || last.page === page) return;
    const direction = page > last.page ? 1 : -1;
    const old = spreads[last.page];
    if (scene.id !== 'zunyi' && old) setTurning({ id: ++turnId.current, scene: scene.id, spread: old, leaf: direction > 0 ? old.right : old.left, direction });
    const target = copy.current;
    const isMap = scene.id === 'zunyi';
    const isArchive = scene.id === 'yanan';
    const tween = gsap.fromTo(target,
      { opacity: isArchive ? 1 : 0.45, rotationY: isMap || isArchive ? 0 : direction * 7, x: isMap ? direction * 12 : 0, y: isArchive ? direction * 10 : 0, transformOrigin: direction > 0 ? 'left center' : 'right center' },
      { opacity: 1, rotationY: 0, x: 0, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity', onComplete: () => { target.dataset.turning = 'false'; } });
    target.dataset.turning = 'true';
    return () => { tween.kill(); gsap.set(target, { clearProps: 'transform' }); target.dataset.turning = 'false'; };
  }, [page, scene.id, disabled]);
  const finishTurn = (id: number) => setTurning(current => current?.id === id ? null : current);
  return <div className={`paper-image reader-art reader-${scene.id}`} style={{ backgroundImage: `url("${openDocument}")`, '--archive-art': `url("${archiveDocument}")` } as React.CSSProperties}>
    {scene.id === 'yanan' && <div className="archive-sheet" aria-hidden="true"><div className="archive-extract" /></div>}
    {scene.id === 'zunyi' && <div className="unrolled-map" aria-hidden="true" style={{ backgroundImage: `url("${atlas}")` }}><svg className="unrolled-route" viewBox="0 0 500 600"><path pathLength="1" d="M80 465 C140 360 250 380 260 250 S365 190 410 95" /></svg></div>}
    <div className="paper-content reader-spread" ref={copy} data-page={page + 1} onClick={onTakeOver}>
      <Leaf leaf={spread.left} side="leaf-left" />
      <Leaf leaf={spread.right} side="leaf-right" />
    </div>
    {!disabled && turning?.scene === scene.id && (scene.id === 'yanan'
      ? <div key={turning.id} className={`reader-turning-sheet ${turning.direction < 0 ? 'sheet-backward' : ''}`} aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget) finishTurn(turning.id); }}>
        <div className="archive-turn-paper" />
        <div className="reader-sheet-copy"><Leaf leaf={turning.spread.left} side="leaf-left" /><Leaf leaf={turning.spread.right} side="leaf-right" /></div>
      </div>
      : <div key={turning.id} className={`reader-turning-leaf ${turning.direction < 0 ? 'turn-backward' : ''}`} aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget) finishTurn(turning.id); }} style={{ backgroundImage: `url("${openDocument}")` }}><Leaf leaf={turning.leaf} side="turning-copy" /></div>)}
    <nav className="paper-controls reader-controls" aria-label="文献翻页">
      <button onClick={() => onPage(page - 1)} disabled={disabled || page === 0}>← 上一页</button>
      <span aria-label={`第${page + 1}页，共${spreads.length}页`}>{page + 1} / {spreads.length}</span>
      <button onClick={() => onPage(page + 1)} disabled={disabled || page === spreads.length - 1}>下一页 →</button>
      <button onClick={onClose} disabled={disabled}>关闭文献 ×</button>
    </nav>
  </div>;
}
