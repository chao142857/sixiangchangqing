# 开源研究、采用范围与许可证

核查日期：2026-10-29。以下四个用户指定项目均已读取仓库结构、README 与许可说明。没有复制其完整应用、照片、音乐、纹理或模型。

| 项目 | 已核实结构与许可 | 本项目决策 |
| --- | --- | --- |
| [入画 WITHIN](https://github.com/fatasia/within) | React / TypeScript / Three.js / Vite；src、public、docs、tests；原创代码 MIT，第三方模型、纹理、字体与音乐另有许可；README明确三维演绎不是考古复原 | 采用其“程序化主题场景 + 镜头导览 + 独立内容数据”设计思路，场景代码重新编写；没有迁移18个完整世界及资源 |
| [R3F Gallery Template](https://github.com/homemadegarbage/r3f-gallery-template) | React 19、R3F、drei、Vite；Room.jsx / Player.jsx / pictures.js；代码MIT；README列明两种纹理分别来自Poly Haven和ambientCG，CC0 | 借鉴展板选择与HTML详情分离；未采用第一人称WASD与纹理，以保证课堂无需训练即可操作 |
| [R3F Scroll Rig](https://github.com/14islands/r3f-scroll-rig) | MIT；R3F与DOM元素同步，适合滚动驱动叙事 | 课堂优先固定站点与定时导览，不引入额外滚动状态系统；未复制实现 |
| [The Book of Qbject](https://github.com/Qbject/the-book-of-qbject) | Three.js / TypeScript / Vite；代码MIT；README明确图片和视频不属于该MIT许可，资源在另一仓库 | 未复制书页图片/视频；档案纸张为本项目原创几何与程序纹理 |

## 实际采用的成熟代码

- Three.js 0.180.0：MIT，采用公开 npm 包；许可证随成品保存在 `public/licenses/three-MIT.txt`，构建后位于 `dist/licenses/three-MIT.txt`。
- `three/addons/controls/OrbitControls.js`：Three.js 官方附带的成熟相机交互。用于拖动视角、阻尼及角度限制。
- React / React DOM 19.2.8：MIT，沿用已有工程。
- Vite / TypeScript：MIT / Apache-2.0，构建工具，不需要在线运行服务。

## 最小验证与迁移范围

实际运行了固定版本依赖安装和类型检查。2026-10-29 在浏览器打开 WITHIN 线上演示，进入“千里江山”场景并操作暂停导览，观察了近景建筑、植被、中远景层次和导览界面的配合；没有复制其山水场景或素材。其余参考项目未被整体运行或迁移。运行视觉验收针对本项目实际组件进行，详见最终测试记录。

## 本地原创视觉资源

建筑、家具、房屋、农田、档案纸张、文字标牌、地球网格、卫星和轨道由本项目程序生成。历史建筑依据公开旧址资料作艺术化重建，室内比例与道具位置不声称测绘级复原；文献为有出处的现代排印摘录，不伪装成原始手稿。地球与轨道不标注真实轨道参数，卫星数量不表示系统实际在轨数量。

使用一张真实历史影像：NARA 196235，Franklin D. Roosevelt Library 公共领域照片系列，Commons 文件页标注 PD-USGov / Public Domain Mark。照片档案标注1944年，作为序章的当代策展复制件，不作为1930年寻乌现场照片。文件位于 `src/assets/mao-1944-nara.jpg`，详细来源与校验值见 `public/assets/ASSET_CREDITS.json` 和 `SOURCES.md`。没有复制授权不明的图片、外部模型、字体或音乐。

## 为什么选直接 Three.js

现有站点已经是 React + Vite + TypeScript，直接使用 Three.js 能复用成熟的几何、材质、相机和控制器，同时避免为了一个受控导览再引入 R3F、drei 和滚动同步的整套依赖。内容与导览状态在 React 层，渲染在独立组件中，所有事实文案由 HTML 提供；WebGL不可用时仍保留可读内容和场景选择。
