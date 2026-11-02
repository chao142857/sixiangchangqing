import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import ArchivePanel from './ArchivePanel';
import DocumentReader from './DocumentReader';
import Finale, { type FinaleHandle } from './Finale';
import { atlas, scenes, type Scene, type ScenePhase } from './scenes';

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
  const finale = useRef<FinaleHandle>(null);
  const action = useRef<gsap.core.Timeline | null>(null);
  const auto = useRef<gsap.core.Timeline | null>(null);
  const ambient = useRef<gsap.core.Tween[]>([]);
  const phaseRef = useRef<ScenePhase>('room');
  const indexRef = useRef(0);
  const sceneRef = useRef<Scene>(scenes[0]);
  const tourRef = useRef(false);
  const pausedRef = useRef(false);
  const resumeAfterReading = useRef(false);
  const resumeOnRoom = useRef(false);
  const [phase, setPhaseState] = useState<ScenePhase>('room');
  const [index, setIndex] = useState(0);
  const [autoState, setAutoState] = useState<AutoState>('off');
  const [hidden, setHidden] = useState(false);
  const [archive, setArchive] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [interlude, setInterlude] = useState<'intro' | 'outro' | null>(null);
  const [tour, setTour] = useState(false);
  const [manualReading, setManualReading] = useState(false);
  const [finaleState, setFinaleState] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [finaleKey, setFinaleKey] = useState(0);
  const scene = scenes[index];
  sceneRef.current = scene;

  const setPhase = useCallback((next: ScenePhase) => { phaseRef.current = next; setPhaseState(next); }, []);
  const setAmbientPaused = useCallback((paused: boolean) => { pausedRef.current = paused; ambient.current.forEach(tween => paused ? tween.pause() : tween.resume()); }, []);
  const stopAuto = useCallback(() => {
    auto.current?.kill(); auto.current = null; action.current?.resume(); setAmbientPaused(false);
    setAutoState('off'); setTour(false); tourRef.current = false; setInterlude(null);
    setManualReading(false); resumeAfterReading.current = false; resumeOnRoom.current = false;
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
    setPage(0); setPhase('opening'); action.current?.kill();
    gsap.set(paper.current, { clearProps: 'transform,opacity,visibility' });
    const documentKind = sceneRef.current.id;
    const timeline = gsap.timeline({ onComplete: () => setPhase('reading') })
      .to(camera.current, { scale: 1.12, xPercent: -2, yPercent: -3, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(shade.current, { opacity: 0.66, duration: 1.25 }, 0.15)
      .to(contactShadow.current, { opacity: 0, duration: 0.8 }, 0.55)
      .to(prop.current, documentKind === 'yanan'
        ? { filter: 'brightness(1.25) sepia(0.12) drop-shadow(0px 8px 6px rgba(9,7,4,0.5))', duration: 1.15, ease: 'power2.inOut' }
        : { yPercent: documentKind === 'zunyi' ? -35 : -100, xPercent: -8, rotation: -3, rotationX: documentKind === 'zunyi' ? 8 : 18, transformPerspective: 1000, scale: 1.18, filter: 'drop-shadow(0px 26px 18px rgba(9,7,4,0.72))', duration: 1.15, ease: 'power2.inOut' }, 0.65)
      .call(() => { if (paper.current) gsap.set(paper.current, { ...bookPose(paper.current), autoAlpha: 0 }); }, [], 1.65)
      .to(paper.current, { autoAlpha: 1, duration: 0.35 }, 1.68)
      .to(prop.current, { autoAlpha: 0, duration: 0.35 }, 1.75)
      .to(paper.current, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotationX: 0, rotation: 0, duration: 1.05, ease: 'power2.inOut' }, 1.7);
    if (documentKind === 'yanan') timeline.fromTo('.archive-extract', { autoAlpha: 0, yPercent: 14 }, { autoAlpha: 1, yPercent: 0, duration: 0.85, ease: 'power2.out' }, 1.9);
    if (documentKind === 'zunyi') timeline
      .fromTo('.unrolled-map', { autoAlpha: 0, scaleX: 0.08, transformOrigin: 'left center' }, { autoAlpha: 1, scaleX: 1, duration: 1.05, ease: 'power2.out' }, 1.7)
      .fromTo('.unrolled-route path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' }, 2.15);
    action.current = timeline.fromTo('.paper-content, .paper-controls', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.1 }, 2.48);
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
    setPhase('transitioning'); action.current?.kill();
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

  const resetVisuals = useCallback(() => {
    gsap.set(camera.current, { xPercent: 0, yPercent: 0, scale: 1 });
    gsap.set(prop.current, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 0, rotationX: 0, scale: 1, filter: 'drop-shadow(0px 5px 4px rgba(9,7,4,0.55))' });
    gsap.set(shade.current, { opacity: 0 }); gsap.set(contactShadow.current, { opacity: 1 });
    gsap.set(modern.current, { opacity: 0, clipPath: 'circle(0% at 67% 48%)' });
    gsap.set([paper.current, map.current], { autoAlpha: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, rotationX: 0 });
  }, []);

  const changeChapter = useCallback((next: number, preserveAuto = false, showPresent = false) => {
    if (!['room', 'present'].includes(phaseRef.current) || next === indexRef.current) { setChaptersOpen(false); return; }
    if (!preserveAuto) stopAuto();
    setPhase('chapter-changing'); setChaptersOpen(false); action.current?.kill();
    action.current = gsap.timeline({ onComplete: () => { setPhase('room'); if (showPresent) goPresent(); } })
      .fromTo(chapterCurtain.current, { scaleX: 0, transformOrigin: 'left', autoAlpha: 1 }, { scaleX: 1, duration: 0.75, ease: 'power2.inOut' })
      .call(() => {
        resetVisuals(); indexRef.current = next; sceneRef.current = scenes[next]; setIndex(next); setPage(0);
      })
      .to(chapterCurtain.current, { scaleX: 0, transformOrigin: 'right', duration: 0.75, ease: 'power2.inOut' });
  }, [goPresent, resetVisuals, setPhase, stopAuto]);

  const enterFinale = useCallback(() => {
    setChaptersOpen(false); setFinaleState(pausedRef.current ? 'paused' : 'playing');
    setFinaleKey(value => value + 1); setInterlude('outro');
  }, []);

  const startTour = useCallback(() => {
    if (phaseRef.current === 'chapter-changing') return;
    auto.current?.kill(); action.current?.kill(); action.current = null;
    resetVisuals(); gsap.set(chapterCurtain.current, { scaleX: 0, autoAlpha: 0 });
    indexRef.current = 0; sceneRef.current = scenes[0]; setIndex(0); setPage(0); setPhase('room');
    setChaptersOpen(false); setManualReading(false); resumeAfterReading.current = false; resumeOnRoom.current = false; setAmbientPaused(false);
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
    timeline.addLabel('终章', 114).call(enterFinale, [], '终章')
      .addLabel('结束', 138).call(() => {}, [], '结束');
    auto.current = timeline;
  }, [changeChapter, closeDocument, enterFinale, goPresent, openDocumentAction, resetVisuals, setAmbientPaused, setPhase]);

  const takeOverReading = useCallback(() => {
    if (!auto.current || !tourRef.current) return;
    auto.current.pause(); setAutoState('paused'); setManualReading(true);
    resumeAfterReading.current = true; setAmbientPaused(true);
    // Complete only the current prop entrance; the master narration remains paused.
    if (phaseRef.current === 'opening') action.current?.progress(1);
  }, [setAmbientPaused]);

  useEffect(() => {
    if (phase !== 'room' || !resumeOnRoom.current || !auto.current) return;
    resumeOnRoom.current = false; resumeAfterReading.current = false;
    setManualReading(false); setAmbientPaused(false); setAutoState('playing');
    goPresent(); auto.current.seek(`present-${indexRef.current}`, true).resume();
  }, [phase, goPresent, setAmbientPaused]);

  const resumeGuide = () => {
    if (resumeAfterReading.current) {
      resumeOnRoom.current = true;
      if (phaseRef.current === 'reading') closeDocument();
      else if (phaseRef.current === 'room' && auto.current) {
        resumeOnRoom.current = false; resumeAfterReading.current = false;
        setManualReading(false); setAmbientPaused(false); setAutoState('playing');
        goPresent(); auto.current.seek(`present-${indexRef.current}`, true).resume();
      }
    } else { auto.current?.resume(); action.current?.resume(); setAmbientPaused(false); setAutoState('playing'); }
  };

  const pause = () => {
    if (autoState !== 'off') {
      if (autoState === 'playing') { auto.current?.pause(); action.current?.pause(); setAmbientPaused(true); setAutoState('paused'); }
      else resumeGuide();
    }
  };
  const showArchive = () => {
    if (tourRef.current) { auto.current?.pause(); action.current?.pause(); setAutoState('paused'); setAmbientPaused(true); }
    setChaptersOpen(false); setArchive(true);
  };
  const jumpChapter = (next: number) => {
    if (!tourRef.current || !auto.current) { changeChapter(next); return; }
    action.current?.kill(); action.current = null; resetVisuals();
    gsap.set(chapterCurtain.current, { scaleX: 0, autoAlpha: 0 });
    indexRef.current = next; sceneRef.current = scenes[next]; setIndex(next); setPage(0);
    setInterlude(null); setChaptersOpen(false); setPhase('room');
    setManualReading(false); resumeAfterReading.current = false; resumeOnRoom.current = false;
    auto.current.seek(`chapter-${next}`, true);
  };
  const skipChapter = () => {
    if (!tourRef.current || !auto.current) {
      if (indexRef.current < scenes.length - 1 && ['room', 'present'].includes(phaseRef.current)) changeChapter(indexRef.current + 1);
      return;
    }
    if (indexRef.current < scenes.length - 1) { jumpChapter(indexRef.current + 1); return; }
    action.current?.kill(); action.current = null; resetVisuals();
    gsap.set(chapterCurtain.current, { scaleX: 0, autoAlpha: 0 });
    gsap.set(modern.current, { opacity: 1, clipPath: 'none' });
    setPhase('present'); enterFinale();
    auto.current.seek('终章', true);
  };
  const exploreChapter = (next: number) => {
    action.current?.kill(); action.current = null; stopAuto(); resetVisuals();
    gsap.set(chapterCurtain.current, { scaleX: 0, autoAlpha: 0 }); setPhase('room'); setChaptersOpen(false);
    if (next !== indexRef.current) changeChapter(next);
    setPage(0);
  };
  const closeManually = useCallback(() => { takeOverReading(); closeDocument(); }, [takeOverReading, closeDocument]);
  const turnPage = (next: number) => {
    if (phaseRef.current !== 'reading') return;
    takeOverReading(); setPage(next);
  };
  const pauseFinale = () => {
    if (finaleState === 'playing') {
      finale.current?.pause(); if (tourRef.current) { auto.current?.pause(); setAutoState('paused'); }
      setAmbientPaused(true); setFinaleState('paused');
    } else if (finaleState === 'paused') {
      finale.current?.resume(); if (tourRef.current) { auto.current?.resume(); setAutoState('playing'); }
      setAmbientPaused(false); setFinaleState('playing');
    }
  };
  const skipFinale = () => {
    finale.current?.finish();
    auto.current?.kill(); auto.current = null; tourRef.current = false; setTour(false); setAutoState('off');
    setAmbientPaused(false); setFinaleState('finished');
  };
  const replayFinale = () => {
    auto.current?.kill(); auto.current = null; tourRef.current = false; setTour(false); setAutoState('off');
    setAmbientPaused(false); setFinaleState('playing'); setFinaleKey(value => value + 1);
  };
  const leaveFinale = () => {
    auto.current?.kill(); auto.current = null; action.current?.kill(); action.current = null;
    tourRef.current = false; setTour(false); setAutoState('off'); setAmbientPaused(false);
    setManualReading(false); resumeAfterReading.current = false; resumeOnRoom.current = false;
    setInterlude(null); setChaptersOpen(true);
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'h' && !archive) setHidden(value => !value);
      if (event.key === 'Escape') {
        if (archive) setArchive(false);
        else if (chaptersOpen) setChaptersOpen(false);
        else if (phaseRef.current === 'reading') closeManually();
      }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [archive, chaptersOpen, closeManually]);

  const isReading = ['opening', 'reading', 'closing'].includes(phase);
  const isBusy = ['opening', 'closing', 'transitioning', 'chapter-changing'].includes(phase);
  const [x, y, w, h] = scene.bounds;
  return <main data-chapter={scene.id} data-phase={phase} data-tour={tour ? 'active' : 'off'} data-reading={manualReading ? 'manual' : 'normal'} data-mode={tour ? 'guided' : 'explore'} data-finale={interlude === 'outro' ? finaleState : 'off'} className={`experience exploration ${hidden ? 'ui-hidden' : ''} ${isReading ? 'is-reading' : ''} ${phase === 'transitioning' ? 'is-transitioning' : ''} ${interlude ? 'has-interlude' : ''} ${autoState !== 'off' ? 'auto-performance' : ''} ${autoState === 'paused' || finaleState === 'paused' && interlude === 'outro' ? 'is-paused' : ''}`} ref={root}>
    <div className="stage">
      <div className="camera" ref={camera}>
        <ParallaxScene scene={scene} />
        <div className="focus-shade" ref={shade} />
        <div className="prop-plane">
          <div className="contact-shadow" ref={contactShadow} style={scene.shadow ? { backgroundImage: `url("${scene.shadow}")` } : undefined} />
          <div className="scene-prop" ref={prop} style={{ left: `${x / 16.72}%`, top: `${y / 9.41}%`, width: `${w / 16.72}%`, height: `${h / 9.41}%` }}>
            <img src={scene.prop} alt="" draggable="false" />
            {phase === 'room' && !interlude && <button className="prop-hotspot" aria-label={`打开${scene.exhibit.title}`} onClick={() => { takeOverReading(); openDocumentAction(); }}><span>查看文献</span></button>}
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
      <h1>{phase === 'present' ? scene.caseData.title : ['寻乌调查', '延安', '遵义会议'][index]}</h1>
    </header>

    <div className="reading-wrap" ref={paper} aria-hidden={!isReading}>
      <DocumentReader scene={scene} page={page} disabled={phase !== 'reading'} onPage={turnPage} onClose={closeManually} onTakeOver={takeOverReading} />
    </div>

    <div className={`map-wrap ${scene.id === 'zunyi' ? 'zunyi-map-transition' : ''}`} ref={map} aria-hidden="true" style={{ backgroundImage: `url("${atlas}")` }}>
      <div className="map-label map-from"><b>{scene.history.year}</b><span>{scene.transitionFrom}</span></div>
      <svg className="map-route" viewBox="0 0 1000 300"><path pathLength="1" d="M120 210 C300 150 480 200 620 100 S850 55 920 65" /></svg>
      <div className="map-label map-to"><b>{scene.caseData.year}</b><span>{scene.transitionTo}</span></div>
    </div>

    {phase === 'present' && <section className="present-caption ui"><div className="caption-mark" /><div><p>{scene.id === 'zunyi' ? '独立自主与开放合作，可以并行。' : scene.caseData.lead}</p></div></section>}

    {interlude === 'intro' && <section className="interlude ui interlude-intro"><p>毛泽东思想活的灵魂</p><h2>思想常青</h2><div className="interlude-rule" /><div>从历史出发，回答今天的问题。</div></section>}
    {interlude === 'outro' && <Finale key={finaleKey} ref={finale} paused={finaleState === 'paused'} onComplete={() => setFinaleState('finished')} />}

    {interlude === 'outro' ? <footer className="finale-controls" aria-label="终章操作">
      {finaleState === 'finished' ? <><button onClick={replayFinale}>再次观看</button><button onClick={leaveFinale}>返回目录</button></> : <><button onClick={pauseFinale}>{finaleState === 'paused' ? '继续' : '暂停'}</button><button onClick={skipFinale}>跳过</button><button onClick={leaveFinale}>退出</button></>}
    </footer> : <footer className="explore-controls ui" aria-label="场景操作">
      <div className="chapter-picker"><button aria-expanded={chaptersOpen} onClick={() => setChaptersOpen(!chaptersOpen)}>目录</button>{chaptersOpen && <nav className="chapter-menu" aria-label="目录">{scenes.map((item, i) => <button key={item.id} onClick={() => exploreChapter(i)}>{item.chapter} · {['寻乌调查', '延安', '遵义会议'][i]}</button>)}<button onClick={startTour}>自动导览</button><button onClick={showArchive}>参考文献与制作说明</button></nav>}</div>
      {autoState === 'off' ? <>
        {!isReading && <><button disabled={isBusy || (index === 0 && phase === 'room')} onClick={() => { setInterlude(null); if (phase === 'present') returnRoom(); else if (index > 0) changeChapter(index - 1, false, true); }}>上一场景</button><button disabled={isBusy || (index === 2 && phase === 'present')} onClick={() => { setInterlude(null); if (phase === 'room') goPresent(); else if (index < 2) changeChapter(index + 1); }}>下一场景</button></>}
        {index === 2 && phase === 'present' && <button onClick={enterFinale}>进入终章</button>}
        <button onClick={startTour} disabled={phase === 'chapter-changing'}>自动导览</button>
      </> : <><button onClick={pause}>{autoState === 'playing' ? '暂停导览' : '继续导览'}</button><button onClick={skipChapter}>跳过本章</button><button onClick={stopAuto}>退出导览</button></>}
    </footer>}
    {hidden && <button className="restore-ui" onClick={() => setHidden(false)}>显示界面 <kbd>H</kbd></button>}
    {archive && <ArchivePanel scene={scene} close={() => setArchive(false)} />}
  </main>;
}
