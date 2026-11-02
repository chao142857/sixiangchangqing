# 寻乌纵向切片测试记录

- 运行：`npm run dev -- --port 5173`，默认入口 `http://localhost:5173/`。
- 自动化：`npm run test:cinematic`（需运行开发服务器及本机 Chrome；可通过 `CHROME_PATH`、`TEST_URL` 覆盖）。
- 通过：Chrome 无头浏览器，1920×1080 与 390×844：场景截图、隐藏 UI、快速双击、手动演出暂停/跳过、文献阅读与返回、转场及返回、自动播放暂停/跳过、手机文献阅读、浏览器脚本错误与资源 HTTP 错误。
- 通过：完整约36秒自动播放不跳过，抵达当代场景并正常结束；`file://` 离线构建在本机 Chrome 中打开场景、图片与文献。离线 HTML 仍依赖同目录的 `assets/`，不是单文件交付。
- 截图：`output/cinematic/xunwu-scene.png`、`xunwu-clean.png`、`xunwu-document.png`、`xunwu-mobile-document.png`、`zhejiang-transition-result.png`。
- 通过：`npm run lint`、`npm run typecheck`、`npm run build`；构建也通过原有内容核验。
- 未进行有实测帧率的普通笔记本性能基准、真实投影设备验收或跨移动浏览器验收。当前没有安装录像编码器，未输出浏览器演出录像。
- 美术限制：透明层由扁平画面提取，没有补全遮挡后的底图；需正式 clean plate 才能确认无穿帮，详见 `ART_DIRECTION.md`。
