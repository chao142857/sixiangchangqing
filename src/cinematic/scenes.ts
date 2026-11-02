import history from '../data/scene-history.json';
import exhibits from '../data/history-exhibits.json';
import content from '../data/content.json';

const asset = (chapter: string, name: string) => `${import.meta.env.BASE_URL}assets/scenes/${chapter}/${name}`;
export type ScenePhase = 'room' | 'opening' | 'reading' | 'closing' | 'transitioning' | 'present' | 'chapter-changing';

// Data and image placement are independent of the GSAP direction timelines.
export const scenes = [
  {
    id: 'xunwu', chapter: '第一章', theme: '实事求是', title: '寻乌调查',
    history: history[0], exhibit: exhibits[0], caseData: content.cases[0],
    room: asset('xunwu', 'room-interior.png'), exterior: asset('xunwu', 'exterior-extended.png'),
    foreground: asset('xunwu', 'brush-isolated.png'), shadow: asset('xunwu', 'book-shadow.png'),
    prop: asset('xunwu', 'book-closed.png'), bounds: [790, 675, 465, 165],
    present: asset('xunwu', 'zhejiang.png'), transitionFrom: '江西 · 寻乌', transitionTo: '浙江 · 乡村',
    intro: '1930年，毛泽东在寻乌开展调查。',
  },
  {
    id: 'yanan', chapter: '第二章', theme: '群众路线', title: '延安 · 群众路线',
    history: history[1], exhibit: exhibits[2], caseData: content.cases[1],
    room: asset('yanan', 'room-clean.png'), exterior: '', foreground: '', shadow: '',
    prop: asset('yanan', 'document-prop.png'), bounds: [530, 665, 690, 275],
    present: asset('yanan', 'present.png'), transitionFrom: '陕北 · 延安', transitionTo: '浙江 · 浦江',
    intro: '从群众中来，到群众中去。',
  },
  {
    id: 'zunyi', chapter: '第三章', theme: '独立自主', title: '遵义 · 独立自主',
    history: history[2], exhibit: exhibits[1], caseData: content.cases[2],
    room: asset('zunyi', 'room-clean.png'), exterior: '', foreground: '', shadow: '',
    prop: asset('zunyi', 'document-prop.png'), bounds: [405, 550, 780, 155],
    present: asset('zunyi', 'present.png'), transitionFrom: '贵州 · 遵义', transitionTo: '北斗 · 星海',
    intro: '从中国革命的实际出发，独立探索。',
  },
] as const;

export type Scene = typeof scenes[number];
export const openDocument = asset('xunwu', 'book-open-cutout.png');
export const atlas = asset('xunwu', 'atlas-cutout.png');
export const sources = content.sources;
