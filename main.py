"""
Gradify - 英语作业反馈生成器
FastAPI 后端服务
"""

import os
import json
import hashlib
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    "中午": [
        "中午好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]",
        "中午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
    ],
    "下午": [
        "下午好[太阳]这是孩子本次的练习反馈，辛苦查收[爱心]",
        "下午好[太阳]这是孩子本次的练习反馈，辛苦查收[玫瑰]"
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
        "收到宝贝的作业喽✌️~咱们这次作业完成非常棒哦👍！！！正确率百分之九十！ 在「{lost_sections}」部分有一些小问题，一起看看吧⬇️：",
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
        "{preview_unit_full} Preview部分\n小朋友没有提交预习作业哦，看看是不是忘记啦~",
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

ASSISTANT_SYSTEM_PROMPT = """你是“助教突突er”，用于回答老师在批改英语作业时的临时问题。

要求：
- 先给结论，再给简短解释
- 用中文回答，必要时可附英文示例
- 语气专业友好，不冗长
- 如果信息不足，先提出1个关键追问
"""

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


# BUILD_ID：基于静态文件内容哈希，任何文件变动都会改变
def compute_build_id() -> str:
    files = ["index.html", "static/app.js", "static/styles.css"]
    h = hashlib.sha256()
    for f in files:
        h.update(open(f, "rb").read())
    return h.hexdigest()[:12]


BUILD_ID = compute_build_id()
_index_html = open("index.html", "r", encoding="utf-8").read()


# 缓存头中间件
@app.middleware("http")
async def cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path == "/index.html":
        response.headers["Cache-Control"] = "no-cache"
    elif path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif path == "/logo.svg":
        response.headers["Cache-Control"] = "public, max-age=86400"
    return response

# OpenAI 客户端
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)

# 助教问答客户端（可独立配置，未配置则回退到主客户端配置）
assistant_client = AsyncOpenAI(
    api_key=os.getenv("ASSISTANT_API_KEY", os.getenv("OPENAI_API_KEY")),
    base_url=os.getenv("ASSISTANT_BASE_URL", os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")),
)


def normalize_model_name(name: str, fallback: str) -> str:
    """规范化模型名，避免大小写/空格导致模型不匹配。"""
    raw = (name or fallback or "").strip()
    return raw.lower() if raw else fallback

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
    preview_error_count: int = 1  # 预习错题数量（1-5）
    issues: list[str]  # 未交/不规范情况列表


class AssistantChatRequest(BaseModel):
    """助教问答请求"""
    question: str = ""
    images: list[str] = []
    web_search_enabled: bool = False

# ============================================================================
# 辅助函数
# ============================================================================

def build_greeting(data: FeedbackRequest) -> str:
    """生成家长问候语（单独发送，用于群聊回复）"""
    greeting_time = "中午" if data.greeting_time == "中午下午" else data.greeting_time
    greeting_list = GREETING_TEMPLATES.get(greeting_time, GREETING_TEMPLATES["晚上"])
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


def build_footer(issues: list[str], unit_progress: str = "", preview_error_count: int = 1) -> str:
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
    
    preview_error_count = max(1, min(5, int(preview_error_count or 1)))
    parts = []
    for issue in issues:
        if issue.startswith("缺作业页面:"):
            # 自定义格式: "缺作业页面:6:判断题部分"
            parts_str = issue.split(":", 2)
            task_num = parts_str[1] if len(parts_str) > 1 else "6"
            task_content = parts_str[2] if len(parts_str) > 2 else "判断题部分"
            body_name = task_content[:-2] if task_content.endswith("部分") else task_content
            template = f"Task{task_num} {task_content}\n小朋友还缺一页{body_name}没有交，看一看是不是忘记啦~"
            parts.append(template)
        elif issue in ISSUE_TEMPLATES:
            # 随机选择模板
            template_list = ISSUE_TEMPLATES[issue]
            template = random.choice(template_list)
            # 替换占位符
            template = template.replace("{preview_unit}", preview_unit)
            template = template.replace("{preview_unit_full}", preview_unit_full)
            template = template.replace("错了1个小题", f"错了{preview_error_count}个小题")
            parts.append(template)
    
    # 用换行符连接（每个段落之间有换行，但中间没有空行）
    return "\n".join(parts)


async def stream_ai_content(error_notes: str) -> AsyncGenerator[str, None]:
    """调用 OpenAI API 流式生成内容（含统计采集）"""
    import time as _time
    try:
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        start_time = _time.monotonic()
        first_token_time = None
        reasoning_parts = []
        content_length = 0  # 用于 tokens 估算降级
        usage_info = None

        print(f"[DEBUG] 开始生成AI内容，error_notes: {error_notes}")
        stream = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": error_notes},
            ],
            stream=True,
            temperature=0.7,
            max_tokens=10000,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta:
                if delta.content:
                    if first_token_time is None:
                        first_token_time = _time.monotonic()
                    content = delta.content
                    content_length += len(content)
                    print(f"[DEBUG] AI返回内容: {content[:50]}...")
                    yield f"data: {json.dumps({'content': content})}\n\n"
                # 部分模型（如 deepseek-r1）通过 reasoning_content 返回思考过程
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    reasoning_parts.append(delta.reasoning_content)
            # 最后一个 chunk 通常携带 usage 信息
            if hasattr(chunk, 'usage') and chunk.usage:
                usage_info = {
                    "prompt_tokens": getattr(chunk.usage, 'prompt_tokens', None),
                    "completion_tokens": getattr(chunk.usage, 'completion_tokens', None),
                    "total_tokens": getattr(chunk.usage, 'total_tokens', None),
                }

        end_time = _time.monotonic()
        total_ms = round((end_time - start_time) * 1000)
        ttft_ms = round((first_token_time - start_time) * 1000) if first_token_time else None

        # 推送统计信息（tokens 降级：API 不返回时用估算值）
        has_usage = usage_info and usage_info.get("total_tokens") is not None
        est_prompt = estimate_tokens(AI_SYSTEM_PROMPT + "\n\n" + error_notes)
        est_completion = max(1, content_length // 3) if content_length > 0 else 0
        stats_data = {
            "model": model_name,
            "prompt_tokens": (usage_info.get("prompt_tokens") if has_usage else est_prompt),
            "completion_tokens": (usage_info.get("completion_tokens") if has_usage else est_completion),
            "total_tokens": (usage_info.get("total_tokens") if has_usage else (est_prompt + est_completion)),
            "ttft_ms": ttft_ms,
            "total_ms": total_ms,
            "reasoning": "".join(reasoning_parts) if reasoning_parts else None,
            "prompt_preview": error_notes[:80] + ("..." if len(error_notes) > 80 else ""),
        }
        yield f"data: {json.dumps({'type': 'stats', 'data': stats_data})}\n\n"

        # 发送结束标记
        print(f"[DEBUG] AI生成完成, 耗时{total_ms}ms, TTFT{ttft_ms}ms")
        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        print(f"[DEBUG] AI调用出错: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


def estimate_tokens(text: str) -> int:
    """简单估算 token 数：中文约 1.5 tokens/字，英文约 0.25 tokens/词，标点约 1 token"""
    if not text:
        return 0
    count = 0
    # 按中英文分段估算
    i = 0
    while i < len(text):
        ch = text[i]
        if '\u4e00' <= ch <= '\u9fff':
            # 中文汉字
            count += 1.5
        elif ch in '，。！？、；：""''（）【】《》…—～·':
            count += 1
        elif ch.isalpha():
            # 英文单词
            j = i
            while j < len(text) and text[j].isalpha():
                j += 1
            word_len = j - i
            count += max(1, word_len / 4)  # 约 4 字母 = 1 token
            i = j - 1
        elif ch.isdigit():
            # 数字
            j = i
            while j < len(text) and text[j].isdigit():
                j += 1
            num_len = j - i
            count += max(1, num_len / 3)
            i = j - 1
        elif ch in ' \t\n\r':
            pass  # 空白不计
        else:
            count += 1
        i += 1
    return int(count) + 5  # +5 缓冲


@app.post("/api/estimate-tokens")
async def estimate_prompt_tokens(data: FeedbackRequest):
    """预估输入 prompt 的 token 数（不调用真实 API）"""
    header_text = build_header(data)
    footer_text = build_footer(data.issues, data.unit_progress, data.preview_error_count)
    full_prompt = AI_SYSTEM_PROMPT + "\n\n" + (header_text or "") + "\n" + (data.error_notes or "")
    estimated = estimate_tokens(full_prompt)
    return {"estimated_tokens": estimated}

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
        footer = build_footer(data.issues, data.unit_progress, data.preview_error_count)
        if footer:
            # 仅在末尾没有换行时补一个换行，避免出现空白行
            footer_content = footer if header.endswith("\n") else "\n" + footer
            yield f"data: {json.dumps({'type': 'footer', 'content': footer_content})}\n\n"
        
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


@app.post("/api/assistant/chat")
async def assistant_chat(data: AssistantChatRequest):
    """助教问答 - 非流式接口"""
    question = (data.question or "").strip()
    images = data.images or []
    web_search_enabled = bool(data.web_search_enabled)
    if not question and not images:
        raise HTTPException(status_code=400, detail="问题或图片至少提供一项")
    if len(images) > 3:
        raise HTTPException(status_code=400, detail="最多支持3张图片")
    try:
        valid_images = [
            image_url
            for image_url in images
            if isinstance(image_url, str) and image_url.startswith("data:image/")
        ]
        text_prompt = question or "请结合我上传的图片回答。"
        if not text_prompt and not valid_images:
            raise HTTPException(status_code=400, detail="图片格式无效")

        default_assistant_model = normalize_model_name(
            os.getenv("ASSISTANT_MODEL", os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
            "gpt-4o-mini",
        )
        vision_assistant_model = normalize_model_name(
            os.getenv("ASSISTANT_VISION_MODEL", default_assistant_model),
            default_assistant_model,
        )
        model_name = vision_assistant_model if valid_images else default_assistant_model

        payload_variants = []

        # 兼容格式A（OpenAI常见格式）
        content_a = [{"type": "text", "text": text_prompt}]
        content_a.extend([{"type": "image_url", "image_url": {"url": u}} for u in valid_images])
        payload_variants.append({"content": content_a, "extra_body": None})

        # 兼容格式B（部分兼容实现使用扁平 image_url）
        content_b = [{"type": "text", "text": text_prompt}]
        content_b.extend([{"type": "image_url", "image_url": u} for u in valid_images])
        payload_variants.append({"content": content_b, "extra_body": None})

        # 兼容格式C（部分兼容实现使用 url 字段）
        content_c = [{"type": "text", "text": text_prompt}]
        content_c.extend([{"type": "image_url", "url": u} for u in valid_images])
        payload_variants.append({"content": content_c, "extra_body": None})

        # 兼容格式D（部分服务将图片放在 extra_body）
        payload_variants.append(
            {"content": text_prompt, "extra_body": {"images": valid_images} if valid_images else None}
        )

        completion = None
        last_error = None
        for variant in payload_variants:
            try:
                extra_body = {"thinking": {"type": "disabled"}}
                if variant["extra_body"]:
                    extra_body.update(variant["extra_body"])

                req = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": ASSISTANT_SYSTEM_PROMPT},
                        {"role": "user", "content": variant["content"]},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 1200,
                    "extra_body": extra_body,
                }
                if web_search_enabled:
                    req["tools"] = [
                        {
                            "type": "web_search",
                            "max_keyword": 3,
                            "force_search": True,
                            "limit": 1,
                            "user_location": {
                                "type": "approximate",
                                "country": "China",
                                "region": "Hubei",
                                "city": "Wuhan",
                            },
                        }
                    ]
                    req["tool_choice"] = "auto"
                completion = await assistant_client.chat.completions.create(**req)
                break
            except Exception as e:
                last_error = e
                continue

        if completion is None:
            raise last_error if last_error else HTTPException(status_code=500, detail="助教调用失败")

        answer = (completion.choices[0].message.content or "").strip() if completion.choices else ""
        if not answer:
            raise HTTPException(status_code=502, detail="助教未返回内容")
        usage = getattr(completion, "usage", None)
        message = completion.choices[0].message if completion.choices else None
        annotations = getattr(message, "annotations", None) if message else None
        citations = []
        if annotations:
            for a in annotations:
                a_type = getattr(a, "type", None) if not isinstance(a, dict) else a.get("type")
                if a_type != "url_citation":
                    continue
                getv = (lambda k: getattr(a, k, None)) if not isinstance(a, dict) else (lambda k: a.get(k))
                citations.append(
                    {
                        "url": getv("url"),
                        "title": getv("title"),
                        "site_name": getv("site_name"),
                    }
                )
        return {
            "answer": answer,
            "model_used": model_name,
            "web_search_enabled": web_search_enabled,
            "citations": citations,
            "usage": {
                "prompt_tokens": getattr(usage, "prompt_tokens", None),
                "completion_tokens": getattr(usage, "completion_tokens", None),
                "total_tokens": getattr(usage, "total_tokens", None),
                "web_search_usage": getattr(usage, "web_search_usage", None),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"助教服务异常: {str(e)}")


@app.get("/api/models")
async def get_models():
    """返回当前生效的模型配置（用于前端展示）"""
    generate_model = normalize_model_name(os.getenv("OPENAI_MODEL", "gpt-4o-mini"), "gpt-4o-mini")
    assistant_model = normalize_model_name(os.getenv("ASSISTANT_MODEL", generate_model), generate_model)
    assistant_vision_model = normalize_model_name(os.getenv("ASSISTANT_VISION_MODEL", assistant_model), assistant_model)
    return {
        "generate_model": generate_model,
        "assistant_model": assistant_model,
        "assistant_vision_model": assistant_vision_model,
    }


# 静态文件服务（必须在 catch-all 路由之前）
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/build-info")
async def build_info():
    """返回当前构建信息，用于客户端版本检测"""
    return {"version": "1.9.0", "build_id": BUILD_ID}


@app.get("/")
async def index():
    """返回前端页面，注入 BUILD_ID"""
    html = _index_html.replace("__BUILD_ID__", BUILD_ID)
    return HTMLResponse(content=html, headers={"Cache-Control": "no-cache"})

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

