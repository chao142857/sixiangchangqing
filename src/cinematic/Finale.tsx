import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { finaleArt, finaleFrames as frames } from './assets';
import './finale.css';

export interface FinaleHandle { pause: () => void; resume: () => void; finish: () => void }

/** One independent 23.5s direction timeline; all assets remain the existing local CGs. */
const Finale = forwardRef<FinaleHandle, { paused: boolean; onComplete: () => void }>(function Finale({ paused, onComplete }, ref) {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  useImperativeHandle(ref, () => ({
    pause: () => timeline.current?.pause(),
    resume: () => timeline.current?.resume(),
    finish: () => timeline.current?.progress(1),
  }), []);

  useLayoutEffect(() => {
    if (!root.current) return;
    const host = root.current;
    const ctx = gsap.context(() => {
      const cue = (name: string) => { host.dataset.cue = name; };
      gsap.set('.finale-shot, .finale-memory, .finale-hero, .finale-foreground, .finale-satellite, .finale-paper, .finale-word, .finale-final-title > *', { autoAlpha: 0 });
      const t = gsap.timeline({ paused, onComplete: () => { cue('complete'); completeRef.current(); } });
      timeline.current = t;
      t.call(() => cue('history'), [], 0)
        .fromTo('.shot-xunwu', { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)', scale: 1.03 }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut' }, 0)
        .to('.shot-xunwu', { scale: 1.1, xPercent: -0.5, duration: 2.8, ease: 'none' }, 0)
        .fromTo('.shot-xunwu .finale-word', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.65)
        .fromTo('.shot-yanan', { autoAlpha: 1, clipPath: 'circle(0% at 72% 48%)', scale: 1.08 }, { clipPath: 'circle(145% at 72% 48%)', duration: 0.95, ease: 'power2.inOut' }, 1.9)
        .to('.shot-yanan', { scale: 1.15, xPercent: 0.6, duration: 2.8, ease: 'none' }, 1.9)
        .fromTo('.shot-yanan .finale-word', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.5)
        .fromTo('.shot-zunyi', { autoAlpha: 1, clipPath: 'inset(100% 0 0 0)', scale: 1.04 }, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'power2.inOut' }, 3.9)
        .to('.shot-zunyi', { scale: 1.12, yPercent: -0.4, duration: 2.8, ease: 'none' }, 3.9)
        .fromTo('.shot-zunyi .finale-word', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 4.45)
        .fromTo('.memory-xunwu', { autoAlpha: 0, xPercent: -3 }, { autoAlpha: 0.48, xPercent: 0, duration: 0.65 }, 4.65)
        .fromTo('.memory-yanan', { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 0.45, xPercent: 0, duration: 0.65 }, 4.8)
        .to('.finale-memory', { autoAlpha: 0, duration: 0.7 }, 5.6)
        .call(() => cue('present'), [], 6)
        .fromTo('.finale-paper', { autoAlpha: 0, xPercent: -12, rotation: -5, scale: 1.18 }, { autoAlpha: 0.24, xPercent: 0, rotation: 0, duration: 1.1 }, 5.55)
        .to('.finale-paper', { autoAlpha: 0, xPercent: 12, duration: 1.2 }, 6.8)
        .fromTo('.shot-village', { autoAlpha: 1, clipPath: 'inset(0 0 0 100%)', scale: 1.06 }, { clipPath: 'inset(0 0 0 0%)', duration: 1, ease: 'power2.inOut' }, 6.1)
        .to('.shot-village', { scale: 1.12, duration: 2.6, ease: 'none' }, 6.1)
        .fromTo('.shot-village .finale-word', { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 6.8)
        .fromTo('.shot-pujiang', { autoAlpha: 1, clipPath: 'circle(0% at 50% 43%)', scale: 1.04 }, { clipPath: 'circle(145% at 50% 43%)', duration: 0.95, ease: 'power2.inOut' }, 8.15)
        .to('.shot-pujiang', { scale: 1.11, duration: 2.7, ease: 'none' }, 8.15)
        .fromTo('.shot-pujiang .finale-word', { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 8.85)
        .fromTo('.shot-beidou', { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)', scale: 1.02 }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power2.inOut' }, 10.3)
        .to('.shot-beidou', { scale: 1.1, duration: 2.8, ease: 'none' }, 10.3)
        .fromTo('.finale-satellite', { autoAlpha: 0, xPercent: 1 }, { autoAlpha: 1, xPercent: -0.4, duration: 1.4 }, 10.5)
        .fromTo('.shot-beidou .finale-word', { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 10.95)
        .call(() => cue('final'), [], 12.65)
        .fromTo('.finale-hero', { autoAlpha: 1, clipPath: 'inset(0 0 100% 0)', scale: 1.025, filter: 'brightness(0.72)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'power2.inOut' }, 12.65)
        .to('.finale-hero', { scale: 1.085, filter: 'brightness(1.04)', duration: 9.8, ease: 'sine.inOut' }, 12.65)
        .fromTo('.finale-foreground', { autoAlpha: 0, xPercent: 2, yPercent: 1 }, { autoAlpha: 0.82, xPercent: -1, yPercent: 0, duration: 3.2, ease: 'sine.out' }, 13.2)
        .fromTo('.finale-final-title .finale-title', { autoAlpha: 0, y: 24, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'power2.out' }, 14.8)
        .fromTo('.finale-final-title .finale-subtitle', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1 }, 16)
        .fromTo('.finale-final-title .finale-themes', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 17.05)
        .fromTo('.finale-final-title .finale-last', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 18.1)
        .call(() => {}, [], 23.5);
    }, root);
    return () => { timeline.current = null; ctx.revert(); };
    // The parent changes the key to replay; pause is handled separately below.
  }, []);

  useLayoutEffect(() => { timeline.current?.paused(paused); }, [paused]);
  return <section className="finale" ref={root} data-cue="start" aria-label="薪火相传 · 思想常青">
    {frames.map(frame => <div key={frame.id} className={`finale-shot shot-${frame.id}`} style={{ backgroundImage: `url("${frame.image}")` }}>
      {frame.id === 'beidou' && <div className="finale-satellite" style={{ backgroundImage: `url("${finaleArt.satellite}")` }} />}
      <div className="finale-word">{frame.text}</div>
    </div>)}
    <div className="finale-memory memory-xunwu" style={{ backgroundImage: `url("${frames[0].image}")` }} />
    <div className="finale-memory memory-yanan" style={{ backgroundImage: `url("${frames[1].image}")` }} />
    <div className="finale-paper" style={{ backgroundImage: `url("${finaleArt.paper}")` }} />
    <div className="finale-hero" style={{ backgroundImage: `url("${finaleArt.hero}")` }} />
    <div className="finale-foreground" style={{ backgroundImage: `url("${finaleArt.foreground}")` }} />
    <div className="finale-final-title">
      <h2 className="finale-title">思想常青</h2>
      <p className="finale-subtitle">毛泽东思想活的灵魂</p>
      <p className="finale-themes">实事求是 · 群众路线 · 独立自主</p>
      <p className="finale-last">思想的生命力，在时代的实践中延续。</p>
    </div>
  </section>;
});
export default Finale;
