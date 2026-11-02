# GitHub Pages 部署

- 仓库：`https://github.com/chao142857/sixiangchangqing`
- Pages 入口：`https://chao142857.github.io/sixiangchangqing/`
- 工作流：`.github/workflows/deploy.yml`，推送 `main` 或手动运行后构建并部署 `dist/`。
- Vite 使用 CI 提供的 `VITE_BASE_PATH`；Pages 构建为 `/sixiangchangqing/`，本地开发仍为 `./`，离线 HTML 保持独立的相对路径。

## 发布更新

```bash
git push origin HEAD:main
```

当前本地开发分支不需要改名。不要使用旧版 ZIP、手工上传 dist 或强制覆盖远端历史。GitHub Pages 的 Source 应选择 GitHub Actions。构建与测试结果在 Actions 和部署报告中查看，地址的可访问性须以实际公网验收为准。

## 发布边界

`.gitignore` 排除依赖、构建产物、环境密钥、备份、临时文件、录像、ZIP 和根目录课程 PDF。主要图片在 `public/assets/` 中，本地加载；正文外链指向文献网站。CG 为艺术重建，制作说明与历史核验边界不变。
