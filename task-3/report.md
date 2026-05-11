# Development Report — AI Learning Assistant Bot

## Tools and Techniques Used

| Tool | Purpose |
|------|---------|
| **n8n Cloud** | Workflow automation platform (free trial with built-in AI credits) |
| **Telegram Bot API** | User interface — commands, messages, inline keyboards |
| **GPT-5-mini** (via n8n AI nodes) | Two AI roles: Teacher and Examiner |
| **Google Sheets** | Persistent storage — three sheets as a lightweight database |
| **Jina Reader** (`r.jina.ai`) | Primary web content extraction with JavaScript rendering |
| **HTTP Request + regex** | Fallback content extraction when Jina is unavailable |

---

## Architecture Decisions

### Two Distinct AI Roles
The system implements two separate LLM Chain nodes with different system prompts:

- **Teacher AI** — Analyzes learning material and produces structured JSON: title, difficulty level (beginner/intermediate/advanced), 2–3 sentence summary, 5–7 specific key points, and main concepts list.
- **Examiner AI** — Two-phase role: (1) generates 5 multiple-choice questions specific to the material, (2) validates each answer in real-time with contextual educational explanations.

### Content Extraction: Jina Reader with Runtime Fallback
Primary path uses Jina Reader (`r.jina.ai`) which handles JavaScript-rendered pages (React, Next.js, SPAs) and returns clean Markdown in a single HTTP call. If Jina fails (rate limit, timeout, 5xx error), the workflow automatically routes to a fallback path using direct HTTP GET with regex-based HTML cleaning. Both paths merge before the AI processing node — users are unaffected by Jina availability. Content is truncated to 30,000 characters to stay within model context limits while preserving enough depth for meaningful quiz generation.

### HTML over Markdown for Telegram Messages
All bot messages use `parse_mode: HTML` instead of Markdown. AI-generated content frequently contains special characters common in technical articles — JSX tags like `<button/>`, underscores in variable names like `useState_hook`, or square brackets in code examples. Telegram's Markdown parser rejects these with 400 Bad Request errors. HTML mode ignores unrecognized tags. Additionally, AI-generated text is passed through an HTML escape function before embedding in messages, converting `<`, `>`, and `&` to their HTML entities.

### Inline Quiz After Learning
After a successful `/learn`, the summary message includes a "📝 Take Quiz Now" inline button with `callback_data: topic_{materialId}`. This uses the same `topic_` callback prefix as the `/quiz` command flow. The existing callback router handles both entry points with zero code duplication — fully implementing the "inline after learning" requirement.

### Intelligent Answer Validation (Hybrid Approach)
Answer correctness is checked deterministically (comparing the user's letter A/B/C/D against the stored correct answer). This is reliable and immune to AI hallucination. However, the Examiner AI is called in real-time for each answer to generate a contextual educational explanation — covering why the correct answer is right and why the user's choice was wrong. This hybrid approach satisfies the "intelligent validation" requirement while maintaining data integrity.

### Double-Click and Duplicate Protection
Two layers of protection against duplicate answers:
1. `editMessageReplyMarkup` removes inline buttons immediately after a click, preventing re-clicks
2. Server-side duplicate check queries `quiz_answers` before writing — if a `(sessionId, questionIndex)` pair already exists, the flow stops silently

A known n8n behavior required a fix: when Google Sheets returns 0 rows, the subsequent Code node receives upstream data instead of an empty array. The duplicate check filters items by structural signature (presence of `sessionId` without `callbackQueryId`) to distinguish real sheet rows from passthrough data.

### Google Sheets as Database
Chosen for its simplicity, zero setup time, and human-readable data during development. Three sheets act as tables: `materials`, `quiz_sessions`, and `quiz_answers`. Trade-off: slower than a real database (1–2 second latency per operation) and a 50,000 character cell limit required truncating stored content. For this challenge's scope, these limitations were acceptable.

---

## What Worked Well

- **n8n Cloud's built-in AI credits** removed the need for a separate OpenAI account, simplifying setup significantly
- **Jina Reader** dramatically improved content quality for modern websites compared to raw HTTP + regex parsing
- **Switch-based routing** cleanly separated the three command flows and callback handling without complex conditional logic
- **Inline keyboards** via HTTP Request (direct Telegram API) gave full control over button structure, enabling dynamic quiz answer buttons
- **The `topic_` callback reuse pattern** — the "Take Quiz Now" button after learning routes through the exact same quiz generation flow as `/quiz`, with zero additional code

## What Did Not Work / Challenges

- **Native n8n Telegram node limitations** — the node does not support dynamic inline keyboard arrays via expressions; all messages with dynamic buttons required replacing Telegram nodes with HTTP Request nodes calling the Telegram API directly
- **n8n data context loss through Google Sheets nodes** — after a Sheets Append operation, `$json` contains the Sheets response, not the original workflow data. Multiple nodes required explicit node references like `$('Parse Teacher Response').first().json.field` instead of `$json.field`
- **Empty Sheets returning 0 items** — when `quiz_answers` is empty, n8n passes upstream data to the next node instead of an empty array, causing the duplicate check to incorrectly flag the first answer as a duplicate. Resolved with structural filtering
- **HTML injection from AI content** — technical articles (especially React documentation) contain JSX-like syntax (`<button/>`, `<br />`) that Telegram's HTML parser rejects. Resolved with an escape function applied to all AI-generated text fields
- **Telegram button text limit** — inline keyboard buttons have a ~64 character limit. Added a 40-character constraint to the Examiner AI prompt and client-side truncation as backup
- **n8n watermark on Telegram messages** — the native Telegram node appends "This message was sent automatically with n8n" on the free plan. Resolved by disabling the "Append n8n Attribution" option in each node's Additional Fields

## Notable Decisions

- Used `gpt-5-mini` — the newer model was available in the n8n free credits pool and produced higher quality outputs
- Content stored in Google Sheets is truncated to 30,000 characters. This sacrifices completeness for speed and cost, but covers the majority of article content for quiz generation purposes
- The Examiner AI does not pre-generate explanations during quiz creation — explanations are generated on-demand when a user answers incorrectly. This increases API calls but satisfies the "Examiner validates answers" requirement authentically
- Bot token stored as an n8n Variable (`$vars.TELEGRAM_TOKEN`) rather than hardcoded in node URLs, keeping the exported workflow safe for public GitHub commits
