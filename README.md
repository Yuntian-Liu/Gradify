# 🎓 Gradify - 英语作业反馈生成器

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-00a?logo=fastapi)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.x-38b?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-purple)

*A modern, elegant feedback generator for 少儿 English teachers*

**碳碳四键的个人开发实践项目-2**

</div>

---

## 📖 项目介绍

Gradify 是一款专为少儿英语老师设计的 Web 应用，帮助您通过**模板拼接 + AI 扩写**的方式，极速生成排版精美、语气亲和的作业反馈文本。

### ✨ 核心特性

- 🎨 **现代设计** - 效仿大厂级 UI/UX 设计语言，极简、通透、留白充裕
- 🫧 **液态玻璃质感** - Glassmorphism 风格，精致细腻
- 🔵 **蓝色主题** - 清新现代的蓝色配色方案
- ⚡ **极速生成** - 三段式架构：头部模板 + AI 扩写 + 尾部模板
- 🤖 **智能联动** - 自动识别课程类型（L/Lesson 或 Day），自动判断反馈类型
- 📱 **预习支持** - 支持添加预习作业信息
- 📝 **Markdown渲染** - 支持 Markdown 语法渲染
- 📋 **一键复制** - 快速复制完整反馈文本
- 🔄 **流式输出** - 实时展示 AI 生成过程，打字机效果
- 📜 **ICP备案** - 合规的备案信息展示

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

### 未交/不规范情况

勾选相关选项，系统会自动追加提醒文本：

- ☐ 未交预习
- ☐ 缺作业页面
- ☐ 答题不规范
- ☐ 预习有错题
- ☐ 单词拼写错误
- ☐ 听记未交

### 生成反馈

1. 点击「生成反馈」按钮
2. 右侧实时展示生成结果（Markdown 渲染）
3. 点击「一键复制」获取完整文本

---

## 🏗️ 项目架构

```
gradify/
├── main.py              # FastAPI 后端服务
├── index.html           # 前端页面（单文件）
├── requirements.txt     # Python 依赖
├── .env.example         # 环境变量模板
├── .gitignore          # Git 忽略规则
├── LICENSE             # 开源许可证
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

所有文本模板都可在 [`main.py`](main.py) 中修改：

```python
# 家长问候语模板
GREETING_TEMPLATES = {
    "早上": "早上好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
    "中午下午": "下午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
    "晚上": "晚上好[月亮]这是孩子本次的练习反馈，辛苦查收[爱心]",
}

# 评级话术模板
RATING_TEMPLATES = {
    "A+": "收到宝贝的作业喽[Waddle]咱们这次作业完成非常棒哦[Wow]！！！...",
    "A": "收到宝贝的作业喽[Waddle]~咱们这次作业完成很棒👍！...",
    "B": "收到宝贝的作业啦😄咱们这次作业完成得OK🎉！...",
    "C": "收到宝贝作业啦😄~咱们这次作业问题稍稍多一点...",
}

# AI System Prompt
AI_SYSTEM_PROMPT = """你是一个极其耐心、充满亲和力的少儿英语老师..."""
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
