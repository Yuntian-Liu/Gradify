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

# 家长问候语模板
GREETING_TEMPLATES = {
    "早上": "早上好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
    "中午下午": "下午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
    "晚上": "晚上好[月亮]这是孩子本次的练习反馈，辛苦查收[爱心]",
}

# 评级话术模板 - {lost_sections} 会被替换为主要失分板块
RATING_TEMPLATES = {
    "A+": "收到宝贝的作业喽[Waddle]咱们这次作业完成非常棒哦[Wow]！！！正确率百分百！全部都做对啦，继续保持呀💗",
    "A": "收到宝贝的作业喽[Waddle]~咱们这次作业完成很棒👍！正确率很高。只有「{lost_sections}」需要注意一下，一起来看看吧⬇️：",
    "B": "收到宝贝的作业啦😄咱们这次作业完成得OK🎉！正确率整体不错噢💗主要是「{lost_sections}」问题多点，一起看看吧⬇️：",
    "C": "收到宝贝作业啦😄~咱们这次作业问题稍稍多一点，主要集中在「{lost_sections}」，不过没关系，我们一起来分析分析，一起来看看吧⬇️：",
}

# 未交/不规范情况模板 - checkbox 勾选后追加的文本
ISSUE_TEMPLATES = {
    "未交预习": "小朋友没有提交预习作业哦，看看是不是忘记啦~",
    "缺作业页面": "小朋友的作业页面好像不太完整呢，下次记得拍全哦~",
    "答题不规范": "小朋友的答题格式需要再规范一下哦，注意按照要求来写呀~",
    "预习有错题": "预习作业里有几道错题呢，宝贝要认真检查哦~",
    "单词拼写错误": "这次作业有一些单词拼写的小错误，宝贝要多加练习拼写呀~",
    "听记未交": "小朋友没有提交听记作业哦，看看是不是忘记啦~",
}

# AI System Prompt
AI_SYSTEM_PROMPT = """你是一个极其耐心、充满亲和力的少儿英语老师。请把我输入的简陋错题速记，扩写成带有具体题号、语气温柔的解析段落。每个题型板块独立成段。要求：多用 '小朋友注意'、'宝贝' 等称呼；解释要通俗易懂；适当使用波浪号~。直接输出解析内容，不要任何开场白或总结语。"""

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

def build_header(data: FeedbackRequest) -> str:
    """构建头部文本（第一段）"""
    lines = []
    
    # 标题
    title = f"{data.student_name} {data.unit_progress} {data.feedback_type}"
    lines.append(title)
    lines.append("")  # 空行
    
    # 问候语
    greeting = GREETING_TEMPLATES.get(data.greeting_time, GREETING_TEMPLATES["晚上"])
    lines.append(greeting)
    lines.append("")
    
    # 评级话术
    rating_text = RATING_TEMPLATES.get(data.rating, RATING_TEMPLATES["B"])
    if "{lost_sections}" in rating_text:
        rating_text = rating_text.format(lost_sections=data.lost_sections or "部分题目")
    lines.append(rating_text)
    lines.append("")
    
    return "\n".join(lines)


def build_footer(issues: list[str]) -> str:
    """构建尾部文本（第三段）"""
    if not issues:
        return ""
    
    lines = [""]
    for issue in issues:
        if issue in ISSUE_TEMPLATES:
            lines.append(ISSUE_TEMPLATES[issue])
    return "\n".join(lines)


async def stream_ai_content(error_notes: str) -> AsyncGenerator[str, None]:
    """调用 OpenAI API 流式生成内容"""
    try:
        stream = await client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": error_notes},
            ],
            stream=True,
            temperature=0.7,
            max_tokens=1000,
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'content': content})}\n\n"
        
        # 发送结束标记
        yield f"data: {json.dumps({'done': True})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

# ============================================================================
# API 路由
# ============================================================================

@app.post("/api/generate")
async def generate_feedback(data: FeedbackRequest):
    """生成反馈 - SSE 流式接口"""
    
    async def event_stream() -> AsyncGenerator[str, None]:
        # 第一段：头部（代码生成）
        header = build_header(data)
        yield f"data: {json.dumps({'type': 'header', 'content': header})}\n\n"
        
        # 第二段：AI 扩写（流式）
        if data.error_notes.strip():
            yield f"data: {json.dumps({'type': 'ai_start'})}\n\n"
            async for chunk in stream_ai_content(data.error_notes):
                yield chunk
        
        # 第三段：尾部（代码生成）
        footer = build_footer(data.issues)
        if footer:
            yield f"data: {json.dumps({'type': 'footer', 'content': footer})}\n\n"
        
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