"""
Gradify - 英语作业反馈生成器
FastAPI 后端服务
"""

import os
import json
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# ============================================================================
# 📝 模板配置区 - 可在此处手动修改所有模板文本
# ============================================================================
import random

# 家长问候语模板 - 按时间段分多种
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

# 评级话术模板 - 多种随机选择 {lost_sections} 会被替换为主要失分板块
RATING_TEMPLATES = {
    "A+": [
        "收到宝贝的作业喽✌️~咱们这次作业完成非常棒哦👍！！！正确率百分百！全部都做对啦，继续保持呀💗~",
        "收到小朋友的作业啦😄，咱们这次作业完成得非常棒🎉！全都做对啦，继续保持哦💗~",
        "收到宝贝的作业啦☀️，咱们这次作业完成得超级棒！正确率100%，继续保持哦💗~",
    ],
    "A": [
        "收到宝贝的作业喽🎶~咱们这次作业完成很棒👍！正确率很高。只有「{lost_sections}」需要注意一下，知识掌握得不错！一起来看看吧⬇️：",
        "收到宝贝的作业喽🐾~咱们这次作业完成非常棒哦👍！！！正确率百分之九十！ 「{lost_sections}」有一些小问题，我们一起看看吧⬇️：",
        "收到宝贝的作业啦😄~咱们这次作业完成啦🎉！正确率不错的💗~「{lost_sections}」部分各有一些问题，一起看看吧⬇️：",
        "收到宝贝的作业啦😄~咱们这次作业完成得很不错🎉！正确率蛮高的💗~只有「{lost_sections}」部分有一个小问题，一起看看吧⬇️：",
        "收到宝贝的作业喽✌️~咱们这次作业完成非常棒哦👍！！！正确率百分之九十九！ 只有最后一个单词拼写上的小问题，需要注意一下拼写哦💗",
    ],
    "B": [
        "收到宝贝的作业啦😄~咱们这次作业完成啦🎉！正确率ok💗~「{lost_sections}」部分各有一些问题，一起看看吧⬇️：",
        "收到宝贝的作业啦😄~咱们这次作业完成得OK🎉！正确率整体不错噢💗~主要是「{lost_sections}」部分问题多点，可以看看哪里出问题啦，一起看看吧⬇️：",
    ],
    "C": [
        "收到宝贝作业啦😄~咱们这次作业问题稍稍多一点，主要集中在「{lost_sections}」，不过没关系，我们一起来分析分析，下次就会更好啦！一起来看看吧⬇️：",
    ],
}

# 未交/不规范情况模板 - {preview_unit} 和 {preview_unit_full} 会被动态替换
ISSUE_TEMPLATES = {
    "未交预习": [
        "{preview_unit} Preview部分\n小朋友没有提交预习作业哦，看看是不是忘记啦~",
    ],
    "缺作业页面": [
        "Task6 判断题\n小朋友还缺一页判断题没有交，看一看是不是忘记啦~",
    ],
    "判断不规范": [
        "Task6 判断部分\n这部分小朋友答案没有问题，主要注意题干要求需要用T、F表达正误哦，而不是用勾叉~",
    ],
    "预习有错题": [
        "{preview_unit_full} Preview部分\n预习部分小朋友错了1个小题，可以结合材料再看看哦💗！",
    ],
    "单词拼写错误": [
        "Vocabulary部分\n这部分小朋友答案没有问题，但是需要注意单词拼写不要出错哟~",
    ],
    "听记未交": [
        "听记作业\n小朋友没有提交听记作业哦，看看是不是忘记啦",
    ],
}

# AI System Prompt
AI_SYSTEM_PROMPT = """你是一位专业的少儿英语老师。请把我输入的错题速记扩写成解析。

【格式要求】（非常重要，必须严格遵守）：
- 每个题目解析用编号1. 2. 3.开头
- 1.后面直接跟内容，不要换行
- 这题解析结束后直接换行写下一题
- 绝对不要出现空行或多余换行
- 例如：
1.这道题考查单词拼写...（直接写完不换行）
2.这道题考查看图说话...（直接写完不换行）

【语气要求】：
- 专业、温和、有耐心
- 可以用"宝贝"、"小朋友"称呼，但不要太多
- 解释清晰到位，不要罗嗦
- 适当用~增加亲切感

直接输出解析，不要任何开场白或总结语"""

# ============================================================================
# 应用初始化
# ============================================================================

app = FastAPI(title="Gradify - 英语作业反馈生成器")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI 客户端
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)

# ============================================================================
# 数据模型
# ============================================================================

class FeedbackRequest(BaseModel):
    """反馈生成请求数据模型"""
    student_name: str  # 学生英文名
    unit_progress: str  # 单元进度
    feedback_type: str  # 反馈类型
    greeting_time: str  # 问候时间
    rating: str  # 正确率评级
    lost_sections: str  # 主要失分板块
    error_notes: str  # 错题速记
    issues: list[str]  # 未交/不规范情况列表

# ============================================================================
# 辅助函数
# ============================================================================

def build_greeting(data: FeedbackRequest) -> str:
    """生成家长问候语（单独发送，用于群聊回复）"""
    greeting_list = GREETING_TEMPLATES.get(data.greeting_time, GREETING_TEMPLATES["晚上"])
    return random.choice(greeting_list)


def build_header(data: FeedbackRequest) -> str:
    """构建头部文本（批改记录用，不含问候语）"""
    lines = []

    # 标题
    title = f"{data.student_name} {data.unit_progress} {data.feedback_type}"
    lines.append(title)

    # 评级话术 - 随机选择
    rating_list = RATING_TEMPLATES.get(data.rating, RATING_TEMPLATES["B"])
    rating_text = random.choice(rating_list)
    if "{lost_sections}" in rating_text:
        rating_text = rating_text.format(lost_sections=data.lost_sections or "部分题目")
    lines.append(rating_text)

    return "\n".join(lines)


def build_footer(issues: list[str], unit_progress: str = "") -> str:
    """构建尾部文本（第三段）"""
    if not issues:
        return ""
    
    # 从 unit_progress 中解析预习单元信息
    # 格式可能是: "U7Day1&U2B Preview" 或 "U7Day1"
    preview_unit = "U1"  # 默认值
    preview_unit_full = "U1A"  # 默认值
    
    if "&" in unit_progress:
        # 提取预习部分，如 "U2B Preview"
        preview_part = unit_progress.split("&")[1]
        if "Preview" in preview_part:
            # 提取 "U2B" 部分
            preview_unit_full = preview_part.replace(" Preview", "")
            # 提取 "U2" 部分（去掉最后的 A 或 B）
            if preview_unit_full and preview_unit_full[-1] in ['A', 'B']:
                preview_unit = preview_unit_full[:-1]
    
    parts = []
    for issue in issues:
        if issue in ISSUE_TEMPLATES:
            # 随机选择模板
            template_list = ISSUE_TEMPLATES[issue]
            template = random.choice(template_list)
            # 替换占位符
            template = template.replace("{preview_unit}", preview_unit)
            template = template.replace("{preview_unit_full}", preview_unit_full)
            parts.append(template)
    
    # 用换行符连接（每个段落之间有换行，但中间没有空行）
    return "\n".join(parts)


async def stream_ai_content(error_notes: str) -> AsyncGenerator[str, None]:
    """调用 OpenAI API 流式生成内容"""
    try:
        print(f"[DEBUG] 开始生成AI内容，error_notes: {error_notes}")
        stream = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": error_notes},
            ],
            stream=True,
            temperature=0.7,
            max_tokens=10000,
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                print(f"[DEBUG] AI返回内容: {content[:50]}...")
                yield f"data: {json.dumps({'content': content})}\n\n"
        
        # 发送结束标记
        print(f"[DEBUG] AI生成完成")
        yield f"data: {json.dumps({'done': True})}\n\n"
        
    except Exception as e:
        print(f"[DEBUG] AI调用出错: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

# ============================================================================
# API 路由
# ============================================================================

@app.post("/api/generate")
async def generate_feedback(data: FeedbackRequest):
    """生成反馈 - SSE 流式接口"""
    
    async def event_stream() -> AsyncGenerator[str, None]:
        # 家长问候语（单独发送，用于群聊回复）
        greeting = build_greeting(data)
        yield f"data: {json.dumps({'type': 'greeting', 'content': greeting})}\n\n"

        # 第一段：头部（代码生成，不含问候语）
        header = build_header(data)
        yield f"data: {json.dumps({'type': 'header', 'content': header})}\n\n"
        
        # 第二段：AI 扩写（流式）
        if data.error_notes.strip():
            # AI内容之前添加换行
            ai_intro = "\n"
            yield f"data: {json.dumps({'type': 'ai_start', 'content': ai_intro})}\n\n"
            async for chunk in stream_ai_content(data.error_notes):
                yield chunk
        
        # 第三段：尾部（代码生成）
        footer = build_footer(data.issues, data.unit_progress)
        if footer:
            # footer内容之前添加换行
            footer_with_newline = "\n" + footer
            yield f"data: {json.dumps({'type': 'footer', 'content': footer_with_newline})}\n\n"
        
        # 完成
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/")
async def index():
    """返回前端页面"""
    return FileResponse("index.html")


# 静态文件服务（如果有额外资源）
# app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================================================================
# 启动入口
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )