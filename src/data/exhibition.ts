import history from './scene-history.json';
import content from './content.json';
export type ExhibitionPhase='history'|'present';
const sceneData=[
 {title:'思想常青',place:'毛泽东思想活的灵魂',duration:12,sourceIds:['H1'],historyTitle:'毛泽东《反对本本主义》',historyText:'《反对本本主义》写于1930年5月，第一节以“没有调查，没有发言权”为题，阐述通过调查认识实际的必要性。眼前的文献是现代排印陈列，不是原始手稿。',quote:'没有调查，没有发言权',analysis:'本展从历史实践出发，讨论调查研究、群众路线和独立自主在今天的方法意义。历史照片为标注1944年的策展资料，不作为1930年寻乌现场影像。'},
 {title:'实事求是',place:'1930 · 江西寻乌',duration:42,sourceIds:['H1'],historyTitle:'调查，先于判断',historyText:'1930年5月，毛泽东在寻乌开展调查。《反对本本主义》强调调查研究，反对脱离实际的本本主义。',quote:'没有调查，没有发言权。',analysis:'从实际出发，需要查明具体条件，将理论同现实问题相联系，并用实践检验认识。与“千万工程”的联系是方法论上的比较，不能把当代项目的全部成效归于单一思想。'},
 {title:'群众路线',place:'延安时期 · 历史工作空间',duration:42,sourceIds:['H3'],historyTitle:'从群众中来，到群众中去',historyText:'1943年《关于领导方法的若干问题》阐述了从群众中来、到群众中去的领导方法。所引网页是相关摘编，而非原典全文。',quote:'从群众中来，到群众中去',analysis:'群众的需要与经验需要经过集中研究，回到实践中检验和完善。今天的群众工作也要让倾听通向实际问题的办理。'},
 {title:'独立自主',place:'1935 · 贵州遵义',duration:42,sourceIds:['H2'],historyTitle:'从自身实际出发，探索道路',historyText:'1935年1月召开的遵义会议，是中国共产党独立自主解决中国革命实际问题的重要历史转折。不能把复杂的历史过程简化为某个单一人物瞬间决定一切。',quote:'',analysis:'立足自己的实际形成判断、积累能力，同开放交流并不矛盾。北斗自主建设与国际合作并行，为这一方法提供了当代讨论的具体材料。'},
 {title:'思想何以常青',place:'历史与现实的回答',duration:12,sourceIds:['H4','S5'],historyTitle:'思想的价值，在实践中延续',historyText:'毛泽东思想活的灵魂，是在中国革命和建设实践中形成的重要立场、观点和方法。实事求是、群众路线和独立自主，在新的历史条件下仍具有方法论启示。',quote:'',analysis:'本组结论：继承这些思想方法，应当结合现实情况，不断在新的实践中丰富和发展；不能机械照搬历史做法。'}
];
export const scenes=sceneData.map((scene,i)=>i>0&&i<4?{...scene,sourceIds:history[i-1].sourceIds,historyText:history[i-1].fact,quote:history[i-1].quote,analysis:history[i-1].analysis+' '+history[i-1].architecture}:scene);
export const currentCase=(scene:number)=>content.cases[Math.max(0,Math.min(2,scene-1))];
export const presentPlaces=['','2003—今天 · 浙江乡村','2003—今天 · 浙江浦江','1994—2020 · 北斗建设',''];
export const exhibitChoices=[[],['山地村落','平原农业村','城郊村落'],['群众诉求','了解情况','协调处理','结果反馈'],['1994','2000','2012','2020'],[]];
export const exhibitDetails=[[],['讨论示意：调查居民分布、道路可达性与设施维护成本，再决定建设尺度。','讨论示意：协调农业生产与公共服务，避免照搬城市建设方式。','讨论示意：识别通勤、土地利用与公共服务衔接的实际需求。'],['方法示意：提供可使用的表达渠道，认真记录群众需要。','方法示意：深入基层核实情况，辨明成因与现实约束。','方法示意：明确责任，依法协调，让倾听通向行动。','方法示意：反馈结果和限制，继续跟进尚未解决的困难。'],['1994年，中国开始研制发展独立自主的卫星导航系统。','2000年底，北斗一号系统建成，服务中国。','2012年，北斗二号系统建成，面向亚太地区提供服务。','2020年7月31日，北斗三号全球卫星导航系统正式开通。'],[]];
