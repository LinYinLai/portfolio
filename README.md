# 赖琳茵 · 作品集

金融科技背景，转 AI 产品方向。从想法到上线——四个项目各自从一个具体想法或真实痛点出发，最后都做到能玩、能用、已经上线。

> 这个仓库是作品集站点本身（总览页 + 四个项目介绍页 + 截图）。看项目，从下面的「推荐浏览路线」开始。想看源码，秋招助手有独立仓库；其余三个因版权不开源，见「仓库边界」。

## 项目

### 01 · 秋招助手 · 求职投递管理 + AI 提效

从自己秋招的痛点出发做的工具：五分区看板跟踪投递进度，IMAP 自动识别企业回复并更新阶段，AI 生成周报、选岗、面试准备。Flask + SQLite + Electron 双端，真实用于个人秋招。

- 在线演示：http://119.28.16.198:8001
- 源码仓库：https://github.com/LinYinLai/job-tracker

### 02 · instax 拍立得 · AI 滤镜 + 反即时满足

以富士 instax mini 7c 为原型的互动网页：3D 相机吐相纸，90 秒显影，AI 联网生成相机滤镜，收进收藏墙。纯前端单文件构建，DeepSeek 联网搜索把相机型号映射成可微调的滤镜参数。

- 在线体验：https://instax-room.netlify.app（加 `?demo=1` 显影压到 5 秒）

### 03 · DICS Records · 3D 唱片墙 + 唱机

12 张专辑排成 3D 弧形旋转木马，点按中心碟飞入唱机，支持自制 CD 上传和 iTunes 自动抓封面音频。Three.js + GSAP + Lenis。

- 在线体验：http://119.28.16.198

### 04 · 梦核房间 · 个人主页

中式梦核风格的互动房间，贴纸 hover、猫的五段演出、电视三频道、百叶窗昼夜系统。纯 HTML/CSS/JS 无依赖。

- 在线体验：https://portfolio-lightning.netlify.app

## 推荐浏览路线

| 项目 | 先看什么 | 如何体验 |
|---|---|---|
| 01 秋招助手 | [项目详情](job-tracker.html) | 打开[在线演示](http://119.28.16.198:8001)，demo 数据是虚构的，写操作有保护，可玩 |
| 02 instax | [项目详情](instax.html) | 打开[在线体验](https://instax-room.netlify.app)，加 `?demo=1` 快速走完显影 |
| 03 DICS | [项目详情](dics.html) | 打开[在线体验](http://119.28.16.198)，拖拽旋转木马、点中心碟进唱机 |
| 04 梦核房间 | [项目详情](room.html) | 打开[在线体验](https://portfolio-lightning.netlify.app)，猫按脚本演出、拉百叶窗入夜 |

## 仓库边界

- 本仓库 = 作品集站点（总览页 + 四个项目介绍页 + 截图），**不含项目源码**。
- 秋招助手的源码在独立仓库 [LinYinLai/job-tracker](https://github.com/LinYinLai/job-tracker)。
- instax / DICS / 梦核房间 的源码因版权素材**不开源**，这里只有介绍页和线上 demo 链接。

## 本地预览

```bash
# 方式一：直接双击 index.html（纯静态，无需构建）
open index.html

# 方式二：起本地服务
python3 -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

## 目录结构

```
index.html          总览页
job-tracker.html    秋招助手介绍页
instax.html         instax 拍立得介绍页
dics.html           DICS Records 介绍页
room.html           梦核房间介绍页
style.css           全站共用样式
shots/              项目截图
```
