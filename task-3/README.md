# AI Learning Assistant — Telegram Bot

An AI-powered personal learning assistant delivered as a Telegram bot, built with n8n. The bot helps users learn from web articles through intelligent summarization and interactive quizzes.

## Bot Link

**[@ai_ak_learn_bot](https://t.me/ai_ak_learn_bot)**

---

## How to Use

### Step 1: Start the Bot
Open Telegram, find **@ai_ak_learn_bot** and send `/start` to see available commands.

### Step 2: Learn from an Article
Send `/learn` followed by any article URL:
```
/learn https://en.wikipedia.org/wiki/Docker_(software)
```
The bot will:
- Fetch and analyze the article content (with automatic fallback for different site types)
- Generate a structured summary with 5–7 key points and difficulty level
- Save the material to your personal library
- Show an inline **"📝 Take Quiz Now"** button for instant quiz access

### Step 3: Take a Quiz
**Option A** — Press **"📝 Take Quiz Now"** right after learning a topic.

**Option B** — Send `/quiz` to choose from all your saved materials.

Quiz flow:
1. Select a topic from your saved materials
2. Answer 5 multiple-choice questions
3. Receive AI-generated feedback on each answer
4. See your final score with detailed explanations for incorrect answers

### Commands
| Command | Description |
|---------|-------------|
| `/start` | Show welcome message and instructions |
| `/learn <url>` | Submit a URL to learn from |
| `/quiz` | Take a quiz on your saved materials |

---

## Setup (for developers)

### Prerequisites
- n8n Cloud account (free trial includes AI credits)
- Telegram Bot token (from [@BotFather](https://t.me/BotFather))
- Google account (for Google Sheets storage)

### Installation

1. **Clone the repository** and navigate to the `task-3` folder

2. **Create a Telegram bot** via [@BotFather](https://t.me/BotFather):
   ```
   /newbot
   ```
   Save the bot token.

3. **Create Google Sheets database**:
   - Create a new Google Spreadsheet named `LearningBot_DB`
   - Create three sheets: `materials`, `quiz_sessions`, `quiz_answers`
   - Add headers to each sheet (see Headers section below)

4. **Import workflow into n8n**:
   - Go to your n8n Cloud instance
   - Click **Add Workflow** → **Import from file**
   - Select `workflow.json`

5. **Configure credentials** in n8n:
   - Add **Telegram API** credential with your bot token
   - Add **Google Sheets OAuth2** credential

6. **Set environment variable** in n8n Settings → Variables:
   - Name: `TELEGRAM_TOKEN`
   - Value: your Telegram bot token

7. **Activate the workflow** by clicking **Publish**

### Google Sheets Headers

**`materials` sheet** (columns A–H):
```
id | chatId | url | title | content | summary | difficulty | addedDate
```

**`quiz_sessions` sheet** (columns A–G):
```
sessionId | chatId | materialId | questions | currentQuestion | status | startedDate
```

**`quiz_answers` sheet** (columns A–F):
```
sessionId | questionIndex | userAnswer | correctAnswer | isCorrect | explanation
```

---

## Architecture

```
Telegram Trigger
    │
    ├── /start → Welcome message
    │
    ├── /learn → Jina Reader (with HTTP fallback)
    │              → Teacher AI (GPT) → Summary
    │              → Google Sheets (save)
    │              → Send summary + "Take Quiz Now" button
    │
    ├── /quiz  → Load user materials
    │              → Topic picker (inline keyboard)
    │
    └── callback → topic_* → Examiner AI → Generate 5 questions
                            → Send Q1 with answer buttons
                 → answer_* → Examiner AI → Validate + explain
                            → Save answer → Next Q or Final score
```
