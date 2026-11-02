# GitHub Pages 公网验收

- 网站：https://chao142857.github.io/sixiangchangqing/
- 公开仓库：https://github.com/chao142857/sixiangchangqing
- 首次成功部署：https://github.com/chao142857/sixiangchangqing/actions/runs/41395008527
- 首次部署提交：`7151f56d0c24940cde61c8a9094f064ba45b2d79`，包含已验收的延安 v2 修复和全部三章源码，不来自任何 ZIP。
- Pages Source 为 GitHub Actions，已启用 HTTPS。CI 使用 Node 22、`npm ci`、Lint、内容核验、类型检查与 Vite 构建，部署 `dist/`。

## 公网浏览器实际结果

测试均直接访问上述 HTTPS 地址，非 localhost，非离线文件：

1. 无登录的 Chrome 正常加载首页，CG 可解码显示。
2. 寻乌、延安、遵义各四组双页可阅读，能够下一页、上一页、关闭、用目录换章并返回历史/当代场景。
3. 对发布的全部37张CG及透明图层逐一检查，均返回 HTTP 200 且类型为图片；页面运行无脚本错误或素材404。
4. 入口刷新可重新显示寻乌场景，无白屏。
5. 手机 UA、触摸与390×844视口模拟可从公网打开、翻页、关闭、刷新，阅读层在视口内。此项不是实体手机或真实Safari内核的测试。
6. 公网页面未经加速完整执行约124秒自动导览，三章均保留正文和翻页控件，抵达终章。

脚本：`node tests/pages-public.mjs`；完整实时导览：`TEST_URL=https://chao142857.github.io/sixiangchangqing/ node tests/tour-real-time.mjs`。原始记录和截图位于本地忽略目录 `output/pages-public/`；不会将录像、ZIP、环境密钥、依赖或课程PDF上传到公开仓库。

## 部署范围与边界

仅修改Vite部署base、工作流、忽略规则和部署文档/检查脚本，未修改场景、素材或正文交互。Vite在Actions中设置项目子路径，本地与离线使用方式不变。未使用外部图床或本机绝对路径加载场景。

外部文献原文是否可访问取决于原网站；GitHub Pages在不同地区或校园网络中的访问速度未作保证。实体投影设备、实体手机性能仍建议演示前检查。
