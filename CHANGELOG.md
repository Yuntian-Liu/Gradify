# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-03-14

### 🎉 Initial Release

Welcome to Gradify v1.0.0! This is the first stable release of our English homework feedback generator.

#### ✨ Features

- **Template-Based Feedback Generation**
  - Three-stage architecture: Header (template) → AI Expansion → Footer (template)
  - Customizable greeting templates based on time of day (morning/afternoon/evening)
  - Rating-specific feedback templates (A+/A/B/C)

- **Intelligent Course Type Detection**
  - Automatic feedback type identification based on course format (L/Lesson vs Day)
  - Smart unit progress input: `U` + number + `L/Day` + lesson number
  - Pre-homework support with preview format: `U7B Preview`

- **AI-Powered Expansion**
  - OpenAI GPT integration for error analysis expansion
  - Server-Sent Events (SSE) streaming for real-time generation
  - Markdown rendering support for formatted output

- **Modern UI/UX Design**
  - Glassmorphism visual style with subtle transparency
  - Blue color theme (#3B82F6)
  - Smooth animations and micro-interactions
  - Responsive layout (40% control panel / 60% preview)

- **Developer Experience**
  - FastAPI backend with CORS support
  - Vanilla JavaScript frontend (no framework overhead)
  - Tailwind CSS for rapid styling
  - Environment-based configuration

#### 🛠️ Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, Vanilla JavaScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| AI | OpenAI API (GPT-4) |
| Server | Uvicorn |

#### 📋 Project Structure

```
gradify/
├── main.py              # FastAPI application
├── index.html           # Single-file frontend
├── requirements.txt     # Python dependencies
├── .env.example        # Environment configuration template
├── LICENSE             # MIT License
├── README.md           # Project documentation
└── CHANGELOG.md       # Version changelog
```

#### 🔧 Configuration

Required environment variables:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

#### 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Yuntian-Liu/Gradify.git

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your API key

# Run the application
python main.py

# Access at http://localhost:8000
```

#### 📝 Usage Notes

- Input student name and unit progress (e.g., U7L2 or U7Day1)
- Select rating level (A+/A/B/C)
- Optionally add pre-homework information
- Enter error notes in the textarea
- Click "Generate Feedback" and copy the result

#### ⚠️ Known Limitations

- Requires valid OpenAI API key
- API usage may incur charges
- Currently desktop-focused (not optimized for mobile)

---

#### 🏢 ICP Information

- 蜀ICP备2026006689-2号
- 碳碳四键的个人开发实践项目-2

---

#### 📞 Contact

For issues and suggestions, please open an issue on GitHub.

---

**Thank you for choosing Gradify! 🎓**
