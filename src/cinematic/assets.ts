import { archiveDocument, atlas, openDocument, scenes } from './scenes';

const path = (chapter: string, file: string) => `${import.meta.env.BASE_URL}assets/scenes/${chapter}/${file}`;

export const finaleFrames = [
  { id: 'xunwu', image: path('xunwu', 'workroom.png'), text: '实事求是' },
  { id: 'yanan', image: path('yanan', 'room-clean.png'), text: '群众路线' },
  { id: 'zunyi', image: path('zunyi', 'room-clean.png'), text: '独立自主' },
  { id: 'village', image: scenes[0].present, text: '浙江 · 千万工程' },
  { id: 'pujiang', image: scenes[1].present, text: '浙江 · 浦江经验' },
  { id: 'beidou', image: scenes[2].present, text: '北斗 · 星海' },
] as const;
export const finaleArt = {
  hero: path('finale', 'archive-hero.png'),
  foreground: scenes[0].prop,
  paper: atlas,
  satellite: scenes[2].presentOverlay,
};
export const finaleImages = [...finaleFrames.map(frame => frame.image), ...Object.values(finaleArt)];

export function roomImages(index: number) {
  const scene = scenes[index];
  return [scene.room, scene.exterior, scene.foreground, scene.prop, scene.shadow].filter(Boolean);
}
export function chapterImages(index: number) {
  const scene = scenes[index];
  return [...roomImages(index), scene.present, scene.presentOverlay, openDocument, archiveDocument, atlas].filter(Boolean);
}
export const experienceImages = [...new Set([...scenes.flatMap((_, index) => chapterImages(index)), ...finaleImages])];
