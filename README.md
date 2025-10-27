# FileReadAI 🤖

AI-powered form field reader and extractor built with React and Zustand. Upload form images or PDFs and let AI automatically extract and structure the field data.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![Zustand](https://img.shields.io/badge/Zustand-4.5.2-orange)

## ✨ Features

- 🤖 **Multiple AI Providers** - Choose between OpenAI GPT-4o, Google Gemini, or Claude for field extraction
- 📄 **Multi-Page PDF Support** - Upload and extract fields from multi-page PDF documents with page navigation
- 📍 **Field Highlighting** - Click on extracted fields to highlight their location on the form preview
- ✏️ **Inline Editing** - Review and correct extracted data with popover-based editing
- 📊 **Confidence Scores** - See AI confidence levels for each field
- 💾 **Export Options** - Export to JSON or CSV formats
- 📝 **Field Management** - Add, edit, delete, and verify fields with page-wise organization
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations and hover effects
- 🔄 **State Management** - Zustand for efficient, scalable state
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Project Structure

```
FileReadAI/
├── src/
│   ├── components/              # React components (organized by feature)
│   │   ├── Header/
│   │   ├── FileUpload/
│   │   ├── FormViewer/          # Image preview, PDF navigation, highlighting
│   │   ├── ExtractedData/       # Field display, editing, export
│   │   └── Notifications/
│   ├── services/                # Business logic & API integration
│   │   ├── AIProviders/         # AI service implementations
│   │   │   ├── OpenAIService.js
│   │   │   ├── GeminiService.js
│   │   │   └── ClaudeService.js
│   │   ├── AIProviderService.js # AI provider router
│   │   ├── FormProcessingService.js # PDF & image processing
│   │   ├── PromptService.js     # AI prompts management
│   │   └── BaseService.js       # Common utilities
│   ├── stores/                  # Zustand state management
│   │   ├── formStore.js         # Form data, extraction, PDF state
│   │   └── uiStore.js           # UI state (notifications, theme)
│   └── styles/                  # Global SCSS styles
├── package.json
└── vite.config.js
```

## 🚀 Setup

### Prerequisites

- **Node.js 16+** and npm/yarn
- At least one AI provider API key:
  - **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys) (Paid, ~$0.01/image)
  - **Gemini API Key** - [Get one here](https://aistudio.google.com/app/apikey) (Free, 60 req/min)
  - **Claude API Key** - [Get one here](https://console.anthropic.com/) (Paid, ~$0.02/image)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API Keys:**

Create a `.env` file in the project root with at least one provider:

```env
# Choose one or more AI providers:
VITE_OPENAI_API_KEY=sk-your-openai-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
VITE_CLAUDE_API_KEY=your-claude-key-here
```

> ⚠️ **Important:** Never commit your `.env` file to version control!

3. **Start development server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:5173
```

The app will automatically use the first configured AI provider (priority: Gemini → GPT-4o → Claude).

## 📖 Usage

1. **Upload a Form** - Drag & drop or click to upload an image/PDF (max 10MB)
2. **Select AI Provider** - Choose from the dropdown (GPT-4o, Gemini, or Claude)
3. **Extract Fields** - Click "Extract Form Fields" and wait for AI processing
4. **Review & Edit** - Click on fields to highlight their location, edit values using the popover
5. **Navigate Pages** - For multi-page PDFs, use page controls (shown on hover)
6. **Export Data** - Download as JSON or CSV format

## 🛠️ Tech Stack

- **Frontend:** React 18, Zustand, SCSS
- **Build:** Vite
- **AI:** OpenAI GPT-4o, Google Gemini, Anthropic Claude
- **PDF Processing:** PDF.js

## 📄 License

MIT License - free to use for any purpose!

---

**Built with ❤️ using React, Zustand, and Cursor Agent :D**

