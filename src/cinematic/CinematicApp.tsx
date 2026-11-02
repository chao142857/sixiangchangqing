import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import ArchivePanel from './ArchivePanel';
import { archiveDocument, atlas, openDocument, scenes, type Scene, type ScenePhase } from './scenes';

type AutoState = 'off' | 'playing' | 'paused';

function ParallaxScene({ scene }: { scene: Scene }) {
  return <div className={`scene-composite scene-${scene.id}`} aria-hidden="true">
    {scene.exterior && <div className="far-plane" style={{ backgroundImage: `url("${scene.exterior}")` }} />}
    <div className="interior-plane" style={{ backgroundImage: `url("${scene.room}")` }} />
    {scene.foreground && <div className="foreground-plane" style={{ backgroundImage: `url("${scene.foreground}")` }} />}
    <div className="sunbeam" />
    <div className="dust">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>
  </div>;
}

export default function CinematicApp() {
  const root = useRef<HTMLElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const prop = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const contactShadow = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const modern = useRef<HTMLDivElement>(null);
  const chapterCurtain = useRef<HTMLDivElement>(null);
  const action = useRef<gsap.core.Timeline | null>(null);
  const auto = useRef<gsap.core.Timeline | null>(null);
  const ambient = useRef<gsap.core.Tween[]>([]);
  const phaseRef = useRef<ScenePhase>('room');
  const indexRef = useRef(0);
  const sceneRef = useRef<Scene>(scenes[0]);
  const tourRef = useRef(false);
  const pausedRef = useRef(false);
  const [phase, setPhaseState] = useState<ScenePhase>('room');
  const [index, setIndex] = useState(0);
  const [autoState, setAutoState] = useState<AutoState>('off');
  const [actionPaused, setActionPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [archive, setArchive] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [intro, setIntro] = useState(true);
  const [interlude, setInterlude] = useState<'intro' | 'outro' | null>(null);
  const [tour, setTour] = useState(false);
  const scene = scenes[index];
  sceneRef.current = scene;

  const setPhase = useCallback((next: ScenePhase) => { phaseRef.current = next; setPhaseState(next); }, []);
  const setAmbientPaused = useCallback((paused: boolean) => { pausedRef.current = paused; ambient.current.forEach(tween => paused ? tween.pause() : tween.resume()); }, []);
  const stopAuto = useCallback(() => {
    auto.current?.kill(); auto.current = null; action.current?.resume(); setAmbientPaused(false);
    setActionPaused(false); setAutoState('off'); setTour(false); tourRef.current = false; setInterlude(null);
  }, [setAmbientPaused]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && scene.exterior) ambient.current = [
        gsap.to('.far-plane', { xPercent: 2.5, duration: 27, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
        gsap.to('.foreground-plane', { xPercent: -0.45, duration: 27, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
      ];
      if (pausedRef.current) ambient.current.forEach(tween => tween.pause());
    }, root);
    return () => { ctx.revert(); ambient.current = []; };
  }, [index, scene.exterior]);
  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 8500);
    return () => window.clearTimeout(timer);
  }, [index]);
  useEffect(() => () => { action.current?.kill(); auto.current?.kill(); }, []);

  // Compute a transform from the on-desk prop to the centered reading object.
  // This is measured after the camera move, so mobile and non-16:9 screens follow the same path.
  const bookPose = useCallback((target: HTMLDivElement) => {
    const propRect = prop.current!.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      x: propRect.left + propRect.width / 2 - (targetRect.left + targetRect.width / 2),
      y: propRect.top + propRect.height / 2 - (targetRect.top + targetRect.height / 2),
      scaleX: propRect.width / targetRect.width,
      scaleY: Math.max(0.15, propRect.height / targetRect.height),
      rotationX: 38,
      rotation: -3,
    };
  }, []);

  const openDocumentAction = useCallback(() => {
    if (phaseRef.current !== 'room') return;
    setIntro(false); setPage(0); setPhase('opening'); action.current?.kill();
    gsap.set(paper.current, { clearProps: 'transform,opacity,visibility' });
    const documentKind = sceneRef.current.id;
    action.current = gsap.timeline({ onComplete: () => setPhase('reading') })
      .to(camera.current, { scale: 1.12, xPercent: -2, yPercent: -3, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(shade.current, { opacity: 0.66, duration: 1.25 }, 0.15)
      .to(contactShadow.current, { opacity: 0, duration: 0.8 }, 0.55)
      .to(prop.current, documentKind === 'yanan'
        ? { filter: 'brightness(1.25) sepia(0.12) drop-shadow(0px 8px 6px rgba(9,7,4,0.5))', duration: 1.15, ease: 'power2.inOut' }
        : { yPercent: documentKind === 'zunyi' ? -35 : -100, xPercent: -8, rotation: -3, rotationX: documentKind === 'zunyi' ? 8 : 18, transformPerspective: 1000, scale: 1.18, filter: 'drop-shadow(0px 26px 18px rgba(9,7,4,0.72))', duration: 1.15, ease: 'power2.inOut' }, 0.65)
      .call(() => { if (paper.current) gsap.set(paper.current, { ...bookPose(paper.current), autoAlpha: 0 }); }, [], 1.65)
      .to(paper.current, { autoAlpha: 1, duration: 0.35 }, 1.68)
      .to(prop.current, { autoAlpha: 0, duration: 0.35 }, 1.75)
      .to(paper.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationX: 0, rotation: 0, duration: 1.05, ease: 'power2.inOut' }, 1.7)
      .fromTo('.paper-content, .paper-controls', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.1 }, 2.48);
  }, [bookPose, setPhase]);

  const closeDocument = useCallback(() => {
    if (phaseRef.current !== 'reading' || !paper.current) return;
    setPhase('closing'); action.current?.kill();
    const destination = bookPose(paper.current);
    action.current = gsap.timeline({ onComplete: () => setPhase('room') })
      .to('.paper-content, .paper-controls', { autoAlpha: 0, duration: 0.3 }, 0)
      .to(paper.current, { ...destination, duration: 1, ease: 'power2.inOut' }, 0.2)
      .to(prop.current, { autoAlpha: 1, duration: 0.3 }, 0.95)
      .to(paper.current, { autoAlpha: 0, duration: 0.3 }, 1.0)
      .to(prop.current, { yPercent: 0, xPercent: 0, rotation: 0, rotationX: 0, scale: 1, filter: 'drop-shadow(0px 5px 4px rgba(9,7,4,0.55))', duration: 1, ease: 'power2.inOut' }, 1.1)
      .to(contactShadow.current, { opacity: 1, duration: 0.7 }, 1.55)
      .to(shade.current, { opacity: 0, duration: 1.1 }, 1.1)
      .to(camera.current, { scale: 1, xPercent: 0, yPercent: 0, duration: 1.25, ease: 'power2.inOut' }, 1.05);
  }, [bookPose, setPhase]);

  const goPresent = useCallback(() => {
    if (phaseRef.current !== 'room') return;
    setIntro(false); setPhase('transitioning'); action.current?.kill();
    gsap.set(map.current, { clearProps: 'transform,opacity,visibility' });
    gsap.set('.map-label, .map-route', { autoAlpha: 0 });
    action.current = gsap.timeline({ onComplete: () => setPhase('present') })
      .to(camera.current, { scale: 1.12, xPercent: -2, yPercent: -3, duration: 1.35, ease: 'power2.inOut' }, 0)
      .to(shade.current, { opacity: 0.68, duration: 1.1 }, 0.1)
      .to(contactShadow.current, { opacity: 0, duration: 0.65 }, 0.5)
      .to(prop.current, { yPercent: -90, xPercent: -5, rotation: -3, rotationX: 15, transformPerspective: 1000, scale: 1.15, filter: 'drop-shadow(0px 24px 16px rgba(9,7,4,0.7))', duration: 1.05, ease: 'power2.inOut' }, 0.45)
      .call(() => { if (map.current) gsap.set(map.current, { ...bookPose(map.current), autoAlpha: 0 }); }, [], 1.35)
      .to(map.current, { autoAlpha: 1, duration: 0.4 }, 1.4)
      .to(prop.current, { autoAlpha: 0, duration: 0.35 }, 1.55)
      .to(map.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationX: 0, rotation: 0, duration: 1.05, ease: 'power2.inOut' }, 1.45)
      .to('.map-label', { autoAlpha: 1, duration: 0.6, stagger: 0.45 }, 2.5)
      .to('.map-route', { autoAlpha: 1, duration: 0.2 }, 2.85)
      .fromTo('.map-route path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, 2.85)
      .fromTo(modern.current, { clipPath: 'circle(0% at 67% 48%)', opacity: 1 }, { clipPath: 'circle(160% at 67% 48%)', duration: 2.3, ease: 'power2.inOut' }, 4.4)
      .to(map.current, { autoAlpha: 0, scale: 1.08, duration: 1.3, ease: 'power1.inOut' }, 4.8)
      .set(modern.current, { clipPath: 'none' });
  }, [bookPose, setPhase]);

  const returnRoom = useCallback(() => {
    if (phaseRef.current !== 'present') return;
    setPhase('transitioning'); action.current?.kill();
    gsap.set(prop.current, { autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1, rotation: 0, rotationX: 0, filter: 'drop-shadow(0px 5px 4px rgba(9,7,4,0.55))' });
    action.current = gsap.timeline({ onComplete: () => setPhase('room') })
      .fromTo(modern.current, { clipPath: 'circle(160% at 67% 48%)' }, { clipPath: 'circle(0% at 67% 48%)', duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(camera.current, { scale: 1, xPercent: 0, yPercent: 0, duration: 2, ease: 'power2.inOut' }, 0)
      .to(shade.current, { opacity: 0, duration: 1.6 }, 0)
      .to(contactShadow.current, { opacity: 1, duration: 1 }, 0)
      .set(modern.current, { opacity: 0 });
  }, [setPhase]);

  const startAuto = useCallback(() => {
    if (phaseRef.current !== 'room') return;
    auto.current?.kill(); setAutoState('playing');
    auto.current = gsap.timeline({ onComplete: () => setAutoState('off') })
      .addLabel('document', 3).call(openDocumentAction, [], 'document')
      .addLabel('close', 10.5).call(closeDocument, [], 'close')
      .addLabel('present', 13.4).call(goPresent, [], 'present')
      .addLabel('end', 34).call(() => setAutoState('off'), [], 'end');
  }, [openDocumentAction, closeDocument, goPresent]);

  const resetVisuals = useCallback(() => {
    gsap.set(camera.current, { xPercent: 0, yPercent: 0, scale: 1 });
    gsap.set(prop.current, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, rotationX: 0, scale: 1, filter: 'drop-shadow(0px 5px 4px rgba(9,7,4,0.55))' });
    gsap.set(shade.current, { opacity: 0 }); gsap.set(contactShadow.current, { opacity: 1 });
    gsap.set(modern.current, { opacity: 0, clipPath: 'circle(0% at 67% 48%)' });
    gsap.set([paper.current, map.current], { autoAlpha: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, rotationX: 0 });
  }, []);

  const changeChapter = useCallback((next: number, preserveAuto = false) => {
    if (!['room', 'present'].includes(phaseRef.current) || next === indexRef.current) { setChaptersOpen(false); return; }
    if (!preserveAuto) stopAuto();
    setPhase('chapter-changing'); setChaptersOpen(false); action.current?.kill();
    action.current = gsap.timeline({ onComplete: () => { setIntro(true); setPhase('room'); } })
      .fromTo(chapterCurtain.current, { scaleX: 0, transformOrigin: 'left', autoAlpha: 1 }, { scaleX: 1, duration: 0.75, ease: 'power2.inOut' })
      .call(() => {
        resetVisuals(); indexRef.current = next; sceneRef.current = scenes[next]; setIndex(next); setPage(0);
      })
      .to(chapterCurtain.current, { scaleX: 0, transformOrigin: 'right', duration: 0.75, ease: 'power2.inOut' });
  }, [resetVisuals, setPhase, stopAuto]);

  const startTour = useCallback(() => {
    if (!['room', 'present'].includes(phaseRef.current)) return;
    auto.current?.kill(); action.current?.kill(); action.current = null;
    resetVisuals(); indexRef.current = 0; sceneRef.current = scenes[0]; setIndex(0); setPage(0); setPhase('room'); setIntro(false);
    setInterlude('intro'); tourRef.current = true; setTour(true); setAutoState('playing');
    const timeline = gsap.timeline({ onComplete: () => { setAutoState('off'); setTour(false); tourRef.current = false; } });
    timeline.addLabel('序幕', 0).addLabel('序幕结束', 7).call(() => setInterlude(null), [], '序幕结束');
    [8, 44, 80].forEach((start, chapter) => {
      timeline.addLabel(`chapter-${chapter}`, start)
        .addLabel(`document-${chapter}`, start + 3).call(openDocumentAction, [], `document-${chapter}`)
        .addLabel(`close-${chapter}`, start + 10.5).call(closeDocument, [], `close-${chapter}`)
        .addLabel(`present-${chapter}`, start + 13.4).call(goPresent, [], `present-${chapter}`);
      if (chapter < 2) timeline.addLabel(`next-${chapter}`, start + 34).call(() => changeChapter(chapter + 1, true), [], `next-${chapter}`);
    });
    timeline.addLabel('终章', 114).call(() => setInterlude('outro'), [], '终章')
      .addLabel('结束', 124).call(() => {}, [], '结束');
    auto.current = timeline;
  }, [changeChapter, closeDocument, goPresent, openDocumentAction, resetVisuals, setPhase]);

  const pause = () => {
    if (autoState !== 'off') {
      if (autoState === 'playing') { auto.current?.pause(); action.current?.pause(); setAmbientPaused(true); setAutoState('paused'); }
      else { auto.current?.resume(); action.current?.resume(); setAmbientPaused(false); setAutoState('playing'); }
    } else if (actionPaused) { action.current?.resume(); setAmbientPaused(false); setActionPaused(false); }
    else { action.current?.pause(); setAmbientPaused(true); setActionPaused(true); }
  };
  const skip = () => {
    if (action.current?.isActive() || action.current?.paused()) action.current.progress(1);
    setActionPaused(false); setAmbientPaused(false);
    if (auto.current && autoState !== 'off') {
      if (autoState === 'paused') { auto.current.resume(); setAutoState('playing'); }
      const next = auto.current.nextLabel(); if (next) auto.current.seek(next, false);
    }
  };
  const showArchive = () => { stopAuto(); setArchive(true); };
  const jumpChapter = (next: number) => {
    if (!tourRef.current || !auto.current) { changeChapter(next); return; }
    action.current?.kill(); action.current = null; resetVisuals();
    gsap.set(chapterCurtain.current, { scaleX: 0, autoAlpha: 0 });
    indexRef.current = next; sceneRef.current = scenes[next]; setIndex(next); setPage(0);
    setInterlude(null); setIntro(false); setChaptersOpen(false); setPhase('room');
    auto.current.seek(`chapter-${next}`, true);
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'h' && !archive) setHidden(value => !value);
      if (event.key === 'Escape') {
        if (archive) setArchive(false);
        else if (phaseRef.current === 'reading') { stopAuto(); closeDocument(); }
      }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [archive, closeDocument, stopAuto]);

  const isReading = ['opening', 'reading', 'closing'].includes(phase);
  const isBusy = ['opening', 'closing', 'transitioning', 'chapter-changing'].includes(phase);
  const [x, y, w, h] = scene.bounds;
  return <main data-chapter={scene.id} data-phase={phase} data-tour={tour ? 'active' : 'off'} className={`experience ${hidden ? 'ui-hidden' : ''} ${isReading ? 'is-reading' : ''} ${phase === 'transitioning' ? 'is-transitioning' : ''} ${interlude ? 'has-interlude' : ''} ${autoState !== 'off' ? 'auto-performance' : ''} ${autoState === 'paused' || actionPaused ? 'is-paused' : ''}`} ref={root}>
    <div className="stage">
      <div className="camera" ref={camera}>
        <ParallaxScene scene={scene} />
        <div className="focus-shade" ref={shade} />
        <div className="prop-plane">
          <div className="contact-shadow" ref={contactShadow} style={scene.shadow ? { backgroundImage: `url("${scene.shadow}")` } : undefined} />
          <div className="scene-prop" ref={prop} style={{ left: `${x / 16.72}%`, top: `${y / 9.41}%`, width: `${w / 16.72}%`, height: `${h / 9.41}%` }}>
            <img src={scene.prop} alt="" draggable="false" />
            {phase === 'room' && <button className="prop-hotspot" aria-label={`打开${scene.exhibit.title}`} onClick={() => { stopAuto(); openDocumentAction(); }}><span>查看文献</span></button>}
          </div>
        </div>
      </div>
      <div className="present-art" ref={modern} style={{ backgroundImage: `url("${scene.present}")` }} aria-hidden="true">
        {scene.presentOverlay && <><svg className="orbit-illustration" viewBox="0 0 1000 560"><ellipse cx="500" cy="310" rx="450" ry="130" /></svg><div className="satellite-layer" style={{ backgroundImage: `url("${scene.presentOverlay}")` }} /></>}
      </div>
      <div className="vignette" />
      <div className="chapter-curtain" ref={chapterCurtain} />
    </div>

    <header className="scene-heading ui">
      <div className="brand">思想常青 <span> / </span> 毛泽东思想的活的灵魂</div>
      <div className="heading-rule" /><p>{scene.chapter} · {scene.theme}</p>
      <h1>{phase === 'present' ? scene.caseData.title : scene.title}</h1>
      <div className="location">{phase === 'present' ? `${scene.caseData.year} · ${scene.caseData.place}` : `${scene.history.year} · ${scene.history.place}`}</div>
    </header>
    {intro && phase === 'room' && <div className="narration ui">{scene.intro}</div>}
    {phase === 'room' && !intro && <div className="hint ui">点击桌上的文献</div>}

    <div className="reading-wrap" ref={paper} aria-hidden={!isReading}>
      <div className={`paper-image ${scene.id === 'yanan' ? 'archive-paper' : ''}`} style={{ backgroundImage: `url("${scene.id === 'zunyi' ? atlas : scene.id === 'yanan' ? archiveDocument : openDocument}")` }}>
        <div className="paper-content">
          <div className="paper-left"><div className="paper-kicker">{scene.history.year} · 历史文献</div><h2>{scene.exhibit.title}</h2><div className="paper-rule" /><p>{scene.id === 'zunyi' ? '历史事实 · 现代排印' : '毛泽东著作 · 现代排印'}</p><small>艺术重建，非原件影像</small></div>
          <div className="paper-right">
            {page === 0 ? <><div className="paper-kicker">{scene.history.quote ? '原典节录' : '历史事实 · 地图意象'}</div>{scene.history.quote ? <blockquote>“{scene.history.quote}”</blockquote> : <blockquote>立足实际<br />独立探索</blockquote>}{autoState === 'off' && <><p>{scene.history.fact}</p><small>{scene.history.quoteNote}</small></>}</> : <><div className="paper-kicker">从历史到今天 · 本组分析</div><h3>{scene.caseData.shortTitle}</h3><p>{scene.history.analysis}</p><p>{scene.caseData.facts[0].text}</p></>}
          </div>
        </div>
        <div className="paper-controls"><button onClick={() => setPage(page === 0 ? 1 : 0)} disabled={phase !== 'reading'}>{page === 0 ? '继续阅读 →' : '← 返回节录'}</button><button onClick={showArchive} disabled={phase !== 'reading'}>资料模式</button><button onClick={() => { stopAuto(); closeDocument(); }} disabled={phase !== 'reading'}>收起文献 ×</button></div>
      </div>
    </div>

    <div className="map-wrap" ref={map} aria-hidden="true" style={{ backgroundImage: `url("${atlas}")` }}>
      <div className="map-label map-from"><b>{scene.history.year}</b><span>{scene.transitionFrom}</span></div>
      <svg className="map-route" viewBox="0 0 1000 300"><path pathLength="1" d="M120 210 C300 150 480 200 620 100 S850 55 920 65" /></svg>
      <div className="map-label map-to"><b>{scene.caseData.year}</b><span>{scene.transitionTo}</span></div>
      <small>方法联系示意 · 非地理路线</small>
    </div>

    {phase === 'present' && <section className="present-caption ui"><div className="caption-mark" /><div><span>当代回响 · {scene.caseData.title}</span><p>{scene.id === 'zunyi' ? '独立自主与开放合作，可以并行。' : scene.caseData.lead}</p><small>{scene.id === 'zunyi' ? '卫星与轨道为艺术示意；思想联系是本组分析。' : '思想联系是本组的方法论分析。'}</small></div></section>}

    {interlude && <section className={`interlude ui interlude-${interlude}`}>
      {interlude === 'intro' ? <><p>毛泽东思想活的灵魂</p><h2>思想常青</h2><div className="interlude-rule" /><div>从历史出发，回答今天的问题。</div></> : <><p>终章 · 思想何以常青</p><h2>回到现实，<br />继续寻找答案。</h2><div className="interlude-rule" /><div>尊重事实 · 依靠人民 · 掌握主动</div></>}
    </section>}

    <footer className="controls ui">
      <div className="controls-left"><span className="art-note">艺术重建 · 非历史照片</span></div>
      <div className="controls-right">
        {(phase === 'room' || phase === 'present') && autoState === 'off' && <button onClick={startTour}>▶ 全片导览</button>}
        {phase === 'room' && autoState === 'off' && <button onClick={startAuto}>自动播放本章</button>}
        {autoState !== 'off' && <><button onClick={pause}>{autoState === 'playing' ? 'Ⅱ 暂停' : '▶ 继续'}</button><button onClick={stopAuto}>退出自动播放</button></>}
        {autoState === 'off' && isBusy && phase !== 'chapter-changing' && <button onClick={pause}>{actionPaused ? '▶ 继续演出' : 'Ⅱ 暂停演出'}</button>}
        {(autoState !== 'off' || isBusy) && <button onClick={skip}>跳过 ›</button>}
        {phase === 'room' && <button onClick={() => { stopAuto(); goPresent(); }}>走向当代 →</button>}
        {phase === 'present' && <button onClick={() => { stopAuto(); returnRoom(); }}>← 返回历史</button>}
        {(phase === 'room' || phase === 'present') && autoState === 'off' && <button onClick={showArchive}>资料模式</button>}
        {(phase === 'room' || phase === 'present' || tour) && <div className="chapter-picker"><button onClick={() => setChaptersOpen(!chaptersOpen)}>章节 {String(index + 1).padStart(2, '0')} / 03</button>{chaptersOpen && <div className="chapter-menu">{scenes.map((item, i) => <button key={item.id} onClick={() => jumpChapter(i)}>{item.chapter} · {item.theme}</button>)}</div>}</div>}
        {interlude === 'outro' && autoState === 'off' && <button onClick={() => setInterlude(null)}>返回章节</button>}
        <button onClick={() => setHidden(true)} aria-label="隐藏界面">隐藏界面 <kbd>H</kbd></button>
      </div>
    </footer>
    {hidden && <button className="restore-ui" onClick={() => setHidden(false)}>显示界面 <kbd>H</kbd></button>}
    {archive && <ArchivePanel scene={scene} close={() => setArchive(false)} />}
  </main>;
}
