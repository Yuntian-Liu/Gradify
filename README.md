# 🎓 Gradify - 英语作业反馈生成器

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-00a?logo=fastapi)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.x-38b?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-V1.9.0-purple)

*A modern, elegant feedback generator for HOUHAI English teachers*

**碳碳四键的个人开发实践项目-2**

</div>

---

## 📖 项目介绍

Gradify 是一款专为少儿英语老师设计的 Web 应用，帮助您通过**模板拼接 + AI 扩写**的方式，极速生成排版精美、语气亲和的作业反馈文本。

### ✨ 核心特性

**UI/UX 设计**
- 🎨 **温暖中性色调** - 参考 Anthropic 设计语言，warm/accent/brown 三套色彩系统
- 🫧 **精致阴影系统** - subtle/soft/medium 三档阴影，层次分明
- 📐 **统一圆角体系** - xl(12px)/2xl(16px)/3xl(20px) 圆角规范
- 🔤 **专业字体系统** - Inter/SF Pro Display/SF Pro Text 字体组合

**生成功能**
- ⚡ **极速生成** - 三段式架构：头部模板 + AI 扩写 + 尾部模板
- 🤖 **智能联动** - 自动识别课程类型（L/Lesson 或 Day），自动判断反馈类型
- 📱 **预习支持** - 支持添加预习作业信息，checkbox 文本动态更新
- 📝 **Markdown渲染** - 支持 Markdown 语法渲染

**复制功能**
- 📋 **三级复制策略** - 复制全部/复制问候语/复制反馈，满足不同场景
- 💬 **独立问候卡片** - 问候语与批改记录分离，方便群聊发送
- ⚡ **常用语快捷复制** - Task/Reading Skill/Vocabulary 等常用语一键复制

**生成体验**
- 🔄 **流式输出** - 实时展示 AI 生成过程，打字机效果
- 📊 **状态提示** - 四阶段生成进度可视化（问候语→模板→AI扩写→完成）
- 🎲 **多模板随机** - 问候语/评级话术支持多种模板随机选择
- 📜 **ICP备案** - 合规的备案信息展示
- 🦴 **骨架屏加载** - AI 生成过程中展示骨架屏动画，提升等待体验

---

## 🖥️ 在线演示

> 暂未部署 Demo，请本地运行

---

## 🚀 快速开始

### 环境要求

- Python 3.11+
- OpenAI API Key

### 1. 克隆项目

```bash
git clone https://github.com/Yuntian-Liu/Gradify.git
cd Gradify
```

### 2. 创建虚拟环境（推荐）

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
# 复制配置模板
copy .env.example .env
```

编辑 `.env` 文件，填入您的 OpenAI API Key：

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

> 💡 如何获取 API Key？访问 [OpenAI Platform](https://platform.openai.com/api-keys)

### 5. 启动服务

```bash
python main.py
```

### 6. 访问应用

打开浏览器访问：**http://localhost:8000**

---

## 📖 使用指南

### 基础信息填写

1. **学生英文名** - 输入学生姓名，如 `Lisa`
2. **单元进度** - 智能选择课程类型
   - 格式：`U` + 单元号 + 课程类型 + 课时号
   - 课程类型：`L`（练习）或 `Day`（伴学手册）
   - 课时号：`1`、`2`、`3`
   - 例如：`U7L2`（第七单元第二课）或 `U7Day1`（第七单元第一天）
3. **反馈类型** - 自动根据课程类型识别（L → 练习反馈，Day → 伴学手册反馈）
4. **家长问候时间** - 选择早上/中午下午/晚上

### 预习作业（可选）

- 勾选「包含预习作业」后，可填写预习详情
- 格式：`U` + 单元号 + `A/B` + Preview
- 例如：`U7B Preview`（第七单元B版预习）
- 有预习时标题格式：`U7Day1&U7B Preview 伴学手册反馈`

### 表现评价

1. **总体正确率** - 选择 A+/A/B/C 评级
2. **主要失分板块** - 输入需要关注的知识点（选择 A+ 时自动禁用）

### 核心错题速记

在 Textarea 中用简短的短语记录错题，例如：

```
Task3造句: 3.没懂what sports，选了颜色。6.主谓一致错
阅读: 第2题细节题定位错误
```

> 💡 输入区下方配有 5 档渐变色条指示器，实时反映速记信息量（简短/偏少/不错/详细/超详细，上限 250 字）。

### 未交/不规范情况

勾选相关选项，系统会自动追加提醒文本：

- ☐ 未交预习
- ☐ 缺作业页面
- ☐ 答题不规范
- ☐ 预习有错题
- ☐ 单词拼写错误
- ☐ 听记未交

### 常用语快捷复制（v1.3.0 新增）

右侧展示区顶部提供常用语快捷复制功能：

**Task 快捷复制**
1. 选择 Task 编号（1-7）
2. 输入内容类型（如：造句、填空）
3. 点击「复制」生成格式：`Task3 造句部分`

**Reading Skill 快捷复制**
1. 输入单元号（如：7）
2. 选择类型（A/B）
3. 点击「复制」生成格式：`Reading Skill 7A`

**固定常用语**
- 一键复制「Vocabulary部分」
- 一键复制「Reading部分」

### 生成反馈

1. 点击「生成反馈」按钮
2. 右侧实时展示生成结果（Markdown 渲染）
3. 使用三级复制按钮：
   - 「复制全部」- 问候语 + 学生反馈
   - 「复制问候语」- 仅问候语（群聊发送）
   - 「复制反馈」- 仅批改记录

---

## 🏗️ 项目架构

```
gradify/
├── main.py              # FastAPI 后端服务
├── index.html           # 前端页面
├── static/              # 静态资源目录
│   └── app.js           # 前端逻辑
├── requirements.txt     # Python 依赖
├── .env.example         # 环境变量模板
├── .gitignore          # Git 忽略规则
├── LICENSE             # 开源许可证
├── CHANGELOG.md        # 版本更新日志
└── README.md           # 项目文档
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + Vanilla JavaScript + Tailwind CSS |
| 后端 | Python 3 + FastAPI |
| AI | OpenAI API (GPT-4) |
| 部署 | Uvicorn |

---

## ⚙️ 模板自定义

所有文本模板都可在 [`main.py`](main.py) 中修改，支持**多模板随机选择**：

```python
# 家长问候语模板 - 每个时间段支持多种问候语随机选择
GREETING_TEMPLATES = {
    "早上": [
        "早上好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
        "上午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
    ],
    "中午下午": [
        "中午好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
        "下午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
    ],
    "晚上": [
        "晚上好[月亮]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
        "晚上好[月亮]这是孩子本次的练习反馈，辛苦查收[爱心]",
    ],
}

# 评级话术模板 - 每个评级支持多种话术随机选择
RATING_TEMPLATES = {
    "A+": [
        "收到宝贝的作业喽✌️~咱们这次作业完成非常棒哦👍！！！正确率百分百！全部都做对啦，继续保持呀💗~",
        "收到小朋友的作业啦😄，咱们这次作业完成得非常棒🎉！全都做对啦，继续保持哦💗~",
        "收到宝贝的作业啦☀️，咱们这次作业完成得超级棒！正确率100%，继续保持哦💗~",
    ],
    "A": [
        "收到宝贝的作业喽🎶~咱们这次作业完成很棒👍！正确率很高。只有「{lost_sections}」需要注意一下，一起来看看吧⬇️：",
        "收到宝贝的作业喽🐾~咱们这次作业完成非常棒哦👍！！！正确率百分之九十！「{lost_sections}」有一些小问题，我们一起看看吧⬇️：",
        # ... 更多模板
    ],
    # B、C 同样支持多模板
}

# 未交/不规范情况模板 - 支持动态占位符
ISSUE_TEMPLATES = {
    "未交预习": [
        "{preview_unit} Preview部分\n小朋友没有提交预习作业哦，看看是不是忘记啦~",
    ],
    "预习有错题": [
        "{preview_unit_full} Preview部分\n预习部分小朋友错了1个小题，可以结合材料再看看哦💗！",
    ],
    # {preview_unit} = U7, {preview_unit_full} = U7A
}

# AI System Prompt
AI_SYSTEM_PROMPT = """你是一位专业的少儿英语老师。请把我输入的错题速记扩写成解析。

【格式要求】（非常重要，必须严格遵守）：
- 每个题目解析用编号1. 2. 3.开头
- 1.后面直接跟内容，不要换行
- 这题解析结束后直接换行写下一题
- 绝对不要出现空行或多余换行
"""
```

---

## 📝 开源协议

```
Copyright © LYT, 2026 All Rights Reserved
联系方式：liuyuntian@ytunx.com

MIT License
...
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## 📌 注意事项

- 🔐 请妥善保管您的 OpenAI API Key，不要泄露
- 💰 使用 OpenAI API 会产生费用，请留意使用量
- ⚡ 首次启动可能需要下载依赖，请耐心等待
- 📜 网站已按要求展示 ICP 备案信息

---

## 📊 效果预览

### 界面展示

```
┌────────────────────────────────────────────────────────────────────┐
│  Gradify v1.0              │ 碳碳四键的个人开发实践项目-2           │
│  英语作业反馈生成器        │                                        │
├─────────────────────────────┼──────────────────────────────────────┤
│  基础信息                   │  生成结果                              │
│  ┌─────────────────────┐   │  [一键复制]                           │
│  │ 学生英文名: Lisa     │   │                                       │
│  │ 单元进度: U 7 L 2   │   │  Lisa U7L2 练习反馈                    │
│  │ 反馈类型: 练习反馈   │   │                                       │
│  └─────────────────────┘   │  下午好[太阳]...                      │
│                             │                                       │
│  [生成反馈]                 │  收到宝贝的作业喽...                   │
│                             │                                       │
├─────────────────────────────┼──────────────────────────────────────┤
│ Gradify v1.0 | ... | 碳碳四键... | 蜀ICP备... | GitHub | © LYT 2026 │
└────────────────────────────────────────────────────────────────────┘
```

---

<div align="center">

Made with ❤️ for 少儿英语老师们

</div>

---

## v1.4.0 增补说明

> 本节为 v1.4.0 的查漏补缺说明，仅增补，不替换原有文档内容。

### 新增能力（v1.4.0）

- 新增：Tutor Assistant 助教对话窗（独立于生成解析流程）。
- 新增：图片理解（支持上传图片与粘贴图片）。
- 新增：联网搜索开关（`web_search` tool calling）。
- 新增：消息状态反馈（"正在思考中" + 计时器）。
- 新增：回复 Token 统计展示（Prompt / Completion / Total）。
- 新增：搜索用量展示（Tool Usage / Page Usage）与 Sources 链接展示。
- 新增：助教消息 Markdown 渲染。
- 新增：富文本编辑能力（输出区手动加粗/高亮）。

### 优化与修复（v1.4.0）

- 优化：整体 UI/UX 重构，顶部信息区、输出区、快捷区、弹窗层级统一。
- 优化：版权与备案信息展示样式，增加 Open Source 入口图标化展示。
- 修复：SSE 解析边界问题（全对场景无法生成）。
- 修复：Markdown 横线异常与标题加粗漏判问题。
- 修复：图片请求兼容性问题（多格式兼容 + 非空内容保护）。
- 修复：模型名大小写导致的模型调用失败问题（模型名规范化）。

### 环境变量增补（v1.4.0）

在原有 `.env` 基础上，建议补充以下变量：

```env
# 解析生成模型（文本）
OPENAI_MODEL=mimo-v2-pro

# 助教文本模型
ASSISTANT_MODEL=mimo-v2-omni

# 助教视觉模型（有图时自动切换）
ASSISTANT_VISION_MODEL=mimo-v2-omni

# 助教独立网关（可选，不填则回退到 OPENAI_BASE_URL）
ASSISTANT_BASE_URL=https://api.xiaomimimo.com/v1

# 助教独立密钥（可选，不填则回退到 OPENAI_API_KEY）
ASSISTANT_API_KEY=your-assistant-key
```

### 联网搜索说明（v1.4.0）

- 助教对话窗可手动开启/关闭联网搜索。
- 开启后后端会按 `tools: [{ type: "web_search", ... }]` 调用。
- 若问题不需要联网，可关闭该开关以减少工具调用成本。

### 版本记录

- 详细版本历史请见 [CHANGELOG.md](CHANGELOG.md)

## v1.5.0 增补说明

> 本节为 v1.5.0 的查漏补缺说明，仅增补，不替换原有文档内容。

### 新增能力（v1.5.0）

- 新增：前端代码模块化，JavaScript 从 `index.html` 提取至 `static/app.js`，配合 FastAPI 静态文件服务。
- 新增：XSS 防护（`sanitizeHtml`），剪贴板复制与输出渲染均过滤危险标签与事件属性。
- 新增：AI 生成过程骨架屏加载动画（Skeleton Loading + Shimmer），替代空白等待。
- 新增：Error Notes 输入区 5 档渐变色条指示器（简短→偏少→不错→详细→超详细，上限 250 字）。
- 新增：助教面板拖拽调整大小，尺寸自动持久化到 localStorage。
- 新增：Quick Phrases Task 预设下拉（造句 / Vocabulary / Grammar / Match / Reading）。

### 优化与修复（v1.5.0）

- 优化：应用初始化增加逐步骤错误隔离（`initApp`），单个模块失败不影响整体加载。
- 优化：`Ctrl+Enter` 快捷键作用域限定为表单区和输出区，避免在助教输入框误触生成。
- 修复：富文本编辑加粗/斜体/高亮 Toggle 行为异常（恢复原生 `execCommand` 实现，不再嵌套/堆叠）。

## v1.6.0 增补说明

> 本节为 v1.6.0 的查漏补缺说明，仅增补，不替换原有文档内容。

### 新增能力（v1.6.0）

- 新增：开屏欢迎页（Splash Screen），含打字机标题动画、液态玻璃材质系统、Canvas 彩色鼠标拖尾粒子、自定义圆形光标（功能卡片区域放大镜效果）。
- 新增：右侧功能卡片展示（Smart Error Analysis / Personalized Feedback / One-Click Export），品牌色左边框 + SVG 图标，入场动画交错编排。
- 新增：CTA 启动按钮（图标→hover 展开文字），Sparkle 星光图标 + pulse 微闪动画 + hover 180° 旋转。
- 新增：底部站点矩阵胶囊栏（Gradify Studio / Selfie / MyScore），含版权标识，hover 交互反馈。
- 新增：双语描述块（英文 italic 主句 + 中文副句），品牌色渐变高亮词 + 玻璃衬底 + 渐变左边线装饰。
- 新增：点击启动按钮时礼花粒子（Confetti）爆发动画，背景 scale + fade 平滑退出过渡。
- 新增：背景装饰层（3 层 SVG 波浪、右侧双层圆弧、5 个漂浮几何体、15 颗闪烁星光）。
- 新增：`prefers-reduced-motion` 无障碍支持，减弱动画模式下自动跳过所有动效。

### 优化（v1.6.0）

- 优化：标题字重 600（轻而大），DM Sans 字体，`clamp(72px,13vw,140px)` 响应式超大字号。
- 优化：液态玻璃材质（`backdrop-filter: blur(20px) saturate(180%)` + 内部高光折射），替代毛玻璃。
- 优化：动画编排紧凑化，打字机完成后 750ms 内全部元素就位，告别按部就班逐个出现的呆板感。
- 优化：站点矩阵链接更新为正式域名（`gradify.ytunx.com` / `selfie.ytunx.com` / `myscore.ytunx.com`）。

### 修复（v1.6.0）

- 修复：复制到微信/钉钉等富文本目标后**加粗丢失** — 写入剪贴板前将语义标签（`<strong>`/`<em>`/`<mark>`）转换为内联样式（`style="font-weight:700"` 等），确保粘贴目标正确识别。
- 修复：复制到微信/钉钉后**换行丢失、内容粘连** — 对 contentEditable 产生的 `<div>` 换行做 normalize 处理，转为明确的 `<br>` 标签。
- 修复：复制按钮**频繁失灵**（点十余次无响应）— 复制前临时关闭 `contentEditable` 避免浏览器拦截剪贴板写入；空 `catch` 块改为 `console.warn` 记录失败原因；`execCommand("copy")` 降级路径检查返回值，失败时弹"复制失败"toast 而非静默吞错。

## v1.8.0 增补说明

> 本节为 v1.8.0 的查漏补缺说明，仅增补，不替换原有文档内容。

### 新增能力（v1.8.0）
- 新增：学生切换过期数据保护。生成反馈时，系统自动检测 Error Notes 和快捷用语（Issues）是否与上一位学生相同；如未更新，弹窗提醒具体哪项需要修改
- 新增：Error Notes 区域快速清空按钮（有内容时自动显示）
- 新增：过期数据黄色警告条，学生名变更后实时提示
- 新增：Header 版本号胶囊徽章（液态玻璃效果 + JetBrains Mono 字体）

### 修复（v1.8.0）
- 修复：评级 A 模板 `{local_sections}` 拼写错误，约 16.7% 概率导致占位符泄漏到反馈内容中
- 修复：Issue 标题下方斜体内容有时显示为原始星号，改用 HTML `<em>` 标签确保稳定渲染
- 修复：清空按钮点击后颜色条和 Token 计数器未同步刷新

## v1.7.0 增补说明

> 本节为 v1.7.0 的查漏补缺说明，仅增补，不替换原有文档内容。

### 新增能力（v1.7.0）

- 新增：「缺作业页面」Issue Flag 支持自定义配置——勾选后展开配置面板，可选择 Task 编号（1-7）+ 题型预设（造句/Vocabulary/Grammar/Match/Reading/Writing）或自定义输入，替代原先硬编码的 Task6 判断题模板。
- 新增：AI 调用统计信息展示（AI Status 卡片），包含 Prompt/Completion/Total Tokens、TTFT（首字用时）、总耗时、费用估算（¥ 精确到 8 位小数）。
- 新增：Thinking Process 折叠展示——若模型返回思考过程（reasoning），可点击展开查看，默认收起。
- 新增：生成过程中的「正在思考中」计时动画（跳动圆点 + 实时秒数），显示在加载骨架屏区域。
- 新增：Prompt Tokens 预估指示器（Error Notes 输入框下方），表单变化时实时估算输入 token 数。
- 新增：`/api/estimate-tokens` 轻量预估接口，纯文本计算不调用真实 API。
- 新增：Quick Phrases Reading Skill 行标签（加粗显示 Reading Skill），提升 UX 可识别性。
- 新增：`estimate_tokens()` 后端函数，中英文混合 token 估算（中文 1.5 tokens/字，英文 0.25 tokens/词）。

### 优化（v1.7.0）

- 优化：Markdown 渲染正则从硬编码 `Task6 判断题` 泛化为 `Task\d+\s+\S+`，支持任意 Task 编号 + 内容组合的标题加粗。
- 优化：AI 流式调用统计采集重构——记录开始时间、首字时间、结束时间、reasoning 内容，tokens 不支持时自动降级为估算值。
- 优化：右侧输出区域高度由 JS 动态计算（`fitOutputScroll()`），避免 CSS Grid 布局冲突。

### 修复（v1.7.0）

- 修复：右侧输出框底边框不显示——改用 JS 动态测量替代 CSS calc/flex 方案，精确控制 output-scroll 高度。
- 修复：Quick Phrases 折叠/展开导致输出框高度异常——新增 details toggle 监听自动重算高度。

## v1.8.1 增补说明

> 本节为 v1.8.1 的查漏补缺说明，仅增补，不替换原有文档内容。

### 变更（v1.8.1）

- 变更：全项目版本号规范化为语义化版本（SemVer），统一使用 1.x 系列编号。
- 版本映射：V1.0→1.0.0, V1.5→1.1.0, V2.0→1.2.0, V2.5→1.3.0, V3.0→1.4.0, V3.0.1→1.4.1, V3.0.2→1.4.2, V3.0.3→1.5.0, V3.1.0→1.6.0, V3.2.0→1.7.0, V3.3.1→1.8.0。
- 补充：CHANGELOG.md 新增 1.0.0–1.3.1 和 1.6.0 的历史版本记录。
