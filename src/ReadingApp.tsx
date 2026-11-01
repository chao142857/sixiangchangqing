import './reading.css';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import content from './data/content.json';
import materials from '../CASE_MATERIALS.md?raw';
import { OrbitArt, PeopleArt, VillageArt } from './Illustrations';

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SourceRefs({ ids }: { ids: string[] }) {
  return <span className="source-refs">{ids.map(id => {
    const source = content.sources.find(s => s.id === id)!;
    return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer" title={`${source.title} · ${source.publisher} · ${source.date}`} aria-label={`查看来源 ${id}：${source.title}`}>[{id}]<span className="sr-only">（新窗口）</span></a>;
  })}</span>;
}

function Eyebrow({ number, children, light = false }: { number: string; children: React.ReactNode; light?: boolean }) {
  return <div className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span>{number}</span><span className="eyebrow-line" />{children}</div>;
}

function App() {
  const [activeCase, setActiveCase] = useState(0);
  const [activeNav, setActiveNav] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentCase = content.cases[activeCase];
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveNav(entry.target.id);
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    content.nav.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => { observer.disconnect(); window.removeEventListener('keydown', onEscape); };
  }, []);

  function selectCaseFromHero(id: string) {
    setActiveCase(content.cases.findIndex(item => item.id === id));
    setMenuOpen(false);
  }

  function handleTabKey(event: KeyboardEvent, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % content.cases.length;
    else if (event.key === 'ArrowLeft') next = (index + content.cases.length - 1) % content.cases.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = content.cases.length - 1;
    else return;
    event.preventDefault();
    setActiveCase(next);
    tabRefs.current[next]?.focus();
  }

  return <>
    <a className="skip-link" href="#main">跳至正文</a>
    <header className="site-header">
      <div className="header-inner">
        <a href="#home" className="brand" aria-label="思想常青，返回首页" onClick={() => setMenuOpen(false)}>
          <span className="brand-seal" aria-hidden="true">常<br />青</span>
          <span className="brand-name">思想常青<span>THE EVERGREEN OF THOUGHT</span></span>
        </a>
        <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '关闭目录 −' : '阅读目录 +'}</button>
        <nav id="main-nav" className={menuOpen ? 'nav-open' : ''} aria-label="章节导航">
          {content.nav.map(item => <a key={item.id} href={`#${item.id}`} className={activeNav === item.id ? 'active' : ''} aria-current={activeNav === item.id ? 'location' : undefined} onClick={() => setMenuOpen(false)}><span>{item.number}</span>{item.label}</a>)}
        </nav>
        <span className="header-edition">专题档案 <span>001</span></span>
      </div>
    </header>

    <main id="main">
      <section id="home" className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-topline"><span>{content.site.course}</span><span>一次从历史走向现实的阅读</span></div>
        <div className="hero-main">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="tiny-square" /> {content.site.subtitle}</div>
            <h1 id="hero-title">思想常青</h1>
            <p className="hero-question">{content.site.question}</p>
            <p className="hero-intro">{content.site.intro}</p>
            <a className="primary-button" href="#history">开启专题阅读 <Arrow /></a>
          </div>
          <figure className="hero-figure">
            <div className="figure-index"><span>FIELD NOTES / 01—03</span><span>从乡村，到星空</span></div>
            <div className="hero-art"><VillageArt hero /><span className="art-note">立足现实<br />向新而行</span><span className="art-vertical">历史的回响 · 现实的回答</span></div>
            <figcaption><span>2003 · 浙江乡村</span><span className="caption-line" /><span>2020 · 北斗全球开通</span></figcaption>
            <span className="art-credit">原创主题意象 / 非纪实图像</span>
          </figure>
        </div>
        <div className="theory-entrances" aria-label="选择一个思想方法进入案例">
          {content.theories.map(theory => <a href="#cases" key={theory.id} onClick={() => selectCaseFromHero(theory.caseId)}><span className="entrance-number">{theory.number}</span><span><strong>{theory.title}</strong><span className="entrance-subtitle">{theory.short}</span></span><Arrow diagonal /></a>)}
        </div>
        <p className="reading-note"><span>阅读指引</span>{content.site.reading}<span className="reading-scroll">向下探索 ↓</span></p>
      </section>

      <section id="history" className="history-section section-space" aria-labelledby="history-title">
        <div className="wrap">
          <Eyebrow number="01">思想的来处 <span className="english-label">THE ROOTS</span></Eyebrow>
          <div className="history-intro section-intro"><h2 id="history-title">{content.history.title}</h2><div><span className="content-kind">理论解释</span><p>{content.history.intro}<SourceRefs ids={content.history.sourceIds} /></p></div></div>
          <div className="timeline">
            {content.history.timeline.map(item => <article key={item.year}><span className="timeline-year">{item.year}</span><div className="timeline-node" /><span className="small-label">{item.kind}</span><h3>{item.title}</h3><p>{item.text}<SourceRefs ids={item.sourceIds} /></p></article>)}
          </div>
          <div className="theory-definitions">{content.theories.map(theory => <article key={theory.id}><span className="small-label">{theory.relation}</span><h3>{theory.title}<span>{theory.number}</span></h3><p>{theory.definition}</p><div className="theory-question">{theory.question}</div></article>)}</div>
          <div className="history-relationship"><span className="relationship-mark" aria-hidden="true">∴</span><p><strong>三个方面，一种相互联系的实践逻辑。</strong>{content.history.relationship}<SourceRefs ids={['S5']} /></p></div>
        </div>
      </section>

      <section id="cases" className="cases-section section-space wrap" aria-labelledby="cases-title">
        <Eyebrow number="02">思想的回响 <span className="english-label">IN PRACTICE</span></Eyebrow>
        <div className="section-intro cases-intro"><h2 id="cases-title">在当代中国，<br />读懂三个回答。</h2><p>{content.history.transition}</p></div>
        <div className="case-tabs" role="tablist" aria-label="三个当代案例">
          {content.cases.map((item, i) => <button key={item.id} id={`tab-${item.id}`} ref={el => { tabRefs.current[i] = el; }} role="tab" aria-selected={activeCase === i} aria-controls={`panel-${item.id}`} tabIndex={activeCase === i ? 0 : -1} onKeyDown={event => handleTabKey(event, i)} onClick={() => setActiveCase(i)} className={activeCase === i ? 'case-tab selected' : 'case-tab'}><span className="case-tab-top"><span>CASE {item.number}</span><span>{item.theory}</span></span><span className="case-tab-title">{item.shortTitle}<Arrow diagonal /></span><span className="case-tab-bottom">{item.place}<span>{activeCase === i ? '正在阅读' : '点击阅读'}</span></span></button>)}
        </div>
        <article className="case-panel" id={`panel-${currentCase.id}`} role="tabpanel" aria-labelledby={`tab-${currentCase.id}`} tabIndex={0} key={currentCase.id}>
          <div className="case-feature">
            <div className="case-feature-copy"><span className="case-file-number">档案 {currentCase.number} / {currentCase.theory}</span><h3>{currentCase.heading}</h3><p>{currentCase.lead}</p><div className="case-meta"><span>{currentCase.title}</span><span>{currentCase.time}</span></div></div>
            <figure className={`case-art case-art-${currentCase.visual}`}>
              {currentCase.visual === 'village' ? <VillageArt /> : currentCase.visual === 'people' ? <PeopleArt /> : <OrbitArt />}
              <span className="case-art-year">{currentCase.year}</span><figcaption>原创主题意象 · 非纪实图像</figcaption>
            </figure>
          </div>
          <div className="case-body">
            <div className="fact-column"><div className="subsection-label"><span className="content-kind">文献事实</span><span>发生了什么</span></div><div className="fact-list">{currentCase.facts.map((fact, i) => <article key={fact.title}><span className="fact-number">0{i + 1}</span><div><h4>{fact.title}</h4><p>{fact.text}<SourceRefs ids={fact.sourceIds} /></p></div></article>)}</div></div>
            <div className="analysis-column"><div className="subsection-label"><span className="content-kind kind-analysis">本组分析</span><span>如何理解</span></div><p className="method-line">{currentCase.method}</p>{currentCase.analysis.map(item => <div className="analysis-item" key={item.title}><h4>{item.title}</h4><p>{item.text}</p></div>)}<p className="case-meaning">{currentCase.meaning}</p></div>
          </div>
          <div className="case-boundary"><span>理解的边界</span><p>{currentCase.limit}</p></div>
          <div className="case-bottom"><div><span className="small-label">留一个问题给自己</span><p>{currentCase.reflection}</p></div><a className="text-link" href="#dialogue">进入思辨现场 <Arrow /></a></div>
          <div className="case-source-line"><span>本案依据</span><SourceRefs ids={currentCase.sourceIds} /><a href="#references">查看完整文献与核验记录 <Arrow diagonal /></a></div>
        </article>
      </section>

      <section id="dialogue" className="dialogue-section section-space" aria-labelledby="dialogue-title">
        <div className="wrap">
          <Eyebrow number="03" light>思想的现场 <span className="english-label">YOUR PERSPECTIVE</span></Eyebrow>
          <div className="section-intro"><h2 id="dialogue-title">如果是你，<br />会怎样选择？</h2><div><p>把概念放进真实的决策难题。<br />选择一种观点，再读读它背后的理由与边界。</p><span className="dialogue-note">以下为本组设计的讨论情境；反馈是方法分析。</span></div></div>
          <div className="dialogue-toolbar"><span>没有分数，只有值得继续的思考。</span><div><span aria-live="polite">已思考 {answeredCount} / 3</span><button onClick={() => setAnswers({})} disabled={!answeredCount}>重新思考 ↺</button></div></div>
          <div className="question-grid">{content.questions.map(question => {
            const answer = answers[question.id];
            return <article className={`question-card ${answer !== undefined ? 'is-answered' : ''}`} key={question.id}>
              <div className="question-meta"><span>情境 {question.number}</span><span>{question.theory}</span></div><h3 id={`${question.id}-title`}>{question.title}</h3><p className="question-context">{question.context}</p>
              <div className="question-options" role="group" aria-labelledby={`${question.id}-title`}>{question.options.map((option, i) => <button key={i} aria-pressed={answer === i} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: i }))}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{option.label}</span><span className="option-check" aria-hidden="true">{answer === i ? '✓' : ''}</span></button>)}</div>
              <div className="feedback" role="status" aria-live="polite" aria-atomic="true">{answer !== undefined ? <><span className="feedback-eyebrow">换个角度看</span><h4>{question.options[answer].lens}</h4><p>{question.options[answer].feedback}</p><div className="feedback-sources">延伸依据 <SourceRefs ids={question.sourceIds} /></div></> : <p className="feedback-placeholder"><span aria-hidden="true">↗</span> 选择一种观点，展开分析</p>}</div>
            </article>;
          })}</div>
        </div>
      </section>

      <section id="conclusion" className="conclusion-section section-space wrap" aria-labelledby="conclusion-title">
        <Eyebrow number="04">思想的常青 <span className="english-label">AN OPEN CONCLUSION</span></Eyebrow>
        <div className="conclusion-answer"><span className="content-kind kind-analysis">本组结论</span><h2 id="conclusion-title">{content.conclusion.answer}</h2><p>{content.conclusion.text}</p></div>
        <div className="conclusion-points">{content.conclusion.points.map((point, i) => <article key={point.title}><span>0{i + 1}</span><h3>{point.title}</h3><p>{point.text}</p></article>)}</div>
        <p className="conclusion-boundary"><strong>有现实意义，也有运用前提。</strong>{content.conclusion.boundary}</p>
        <div className="materials-strip"><div><span className="small-label">把讨论带回课堂</span><h3>PPT 组的案例资料，已备好。</h3><p>事实摘要 · 理论分析 · 课堂口播 · 教师追问与回答</p></div><a className="primary-button" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(materials)}`} download="CASE_MATERIALS.md">下载案例资料 <Arrow /></a></div>

        <div id="references" className="references" aria-labelledby="references-title">
          <div className="references-heading"><div><span className="small-label">READING & REFERENCES</span><h3 id="references-title">循着出处，继续阅读。</h3></div><span>资料核验日期 <time dateTime={content.site.verifiedAt}>{content.site.verifiedAt.replaceAll('-', '.')}</time></span></div>
          <p className="references-note">正文采用下列已读取文献。网页所述事实与作者的经验总结分别理解；文章中的评价不作为独立效果评估。外部原文需联网访问。</p>
          <ol className="source-list">{content.sources.filter(source => source.verified).map(source => <li id={`ref-${source.id}`} key={source.id}><span className="source-id">{source.id}</span><div><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<Arrow diagonal /></a><p>{source.publisher} · {source.origin}</p><span>{source.date} · {source.dateNote}</span><details><summary>核验记录与引用范围</summary><p>{source.status}</p><p>用于：{source.use}</p></details></div><span className="verified-tag">已核对正文</span></li>)}</ol>
          <details className="unverified-sources"><summary>两条待复核的原始链接 <span>正文已有可访问的替代依据 ＋</span></summary><div>{content.sources.filter(source => !source.verified).map(source => <article key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">[{source.id}] {source.publisher} · {source.date}<Arrow diagonal /></a><p>{source.dateNote}。{source.status}</p></article>)}</div></details>
          <p className="editorial-note">{content.site.evidenceNote}</p>
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="wrap"><a href="#home" className="footer-title">思想常青</a><p>{content.conclusion.takeaway}<span>{content.site.course} · 课程学习作品</span></p><a href="#home" className="back-top">回到开篇 ↑</a></div></footer>
  </>;
}

export default App;
