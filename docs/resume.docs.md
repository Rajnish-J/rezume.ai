# Resume Feature Documentation

## Overview
The Resume feature lets a user upload a resume, parse and store resume context in the database, generate AI suggestions, and ask follow-up questions through a chatbot-style endpoint.

Core flow:
1. User uploads resume from UI.
2. API validates input and maps upload to `userId`.
3. Resume text/context is parsed and saved.
4. AI suggestions are generated and saved.
5. UI shows parsed context + suggestions.
6. User can chat with assistant for personalized resume improvements.

---

## Database Schema
Defined in: `src/lib/db/schema.ts`

### `resumes`
- `id` (PK)
- `userId` (FK -> `users.id`)
- `originalFileName`
- `fileUrl`
- `parsedText`
- `parsedContext` (jsonb)
- `createdAt`
- `updatedAt`

### `resume_suggestions`
- `id` (PK)
- `resumeId` (FK -> `resumes.id`)
- `userId` (FK -> `users.id`)
- `suggestionTitle`
- `suggestion`
- `category`
- `priority`
- `createdAt`

---

## API Layer

### 1) `POST /api/resume`
File: `src/app/api/resume/route.ts`

Purpose:
- Accept resume upload.
- Validate payload (`userId`, `file`).
- Parse text and build resume context.
- Save resume + generated suggestions.

Input:
- `FormData`
  - `userId` (number-like string)
  - `file` (`File`)

Output:
- `201` with:
  - `resumeId`
  - `userId`
  - `parsedContext`
  - `suggestions[]`

Validation:
- Uses Zod schemas from `src/types/resume.types.ts`.
- File checks in `src/utils/resume/resume.util.ts`.

### 2) `GET /api/resume?userId=<id>`
File: `src/app/api/resume/route.ts`

Purpose:
- Fetch latest resume insights for a user.
- Returns latest saved resume context + saved suggestions.

Output:
- `200` with `ResumeInsightsResponse`
- `404` when no resume exists for the user

### 3) `POST /api/resume/chat`
File: `src/app/api/resume/chat/route.ts`

Purpose:
- Chatbot endpoint for follow-up resume guidance.

Input JSON:
- `userId`
- `resumeId`
- `message`

Output:
- `200` with `{ answer: string }`

---

## AI SDK Integration

Files:
- `src/lib/ai/resume/resume-prompt.ts`
- `src/lib/ai/resume/resume-ai.ts`

### Prompt separation
- System prompts are isolated in `resume-prompt.ts`.
- Keeps route files clean and modular.

### Suggestion generation
- Uses `generateObject` from `ai` SDK.
- Model client from `@ai-sdk/openai`.
- Validates suggestion shape via Zod schema.

### Chat response generation
- Uses `generateText` from `ai` SDK.
- Uses parsed context + stored suggestions + user message.

### Fallback behavior
If `OPENAI_API_KEY` is missing or request fails:
- Suggestions fallback to deterministic local suggestions.
- Chat returns safe fallback answer.

---

## Types and Validation

File: `src/types/resume.types.ts`

Includes:
- Zod schemas for upload payload, query params, chat payload.
- Schemas for parsed context and suggestions.
- Shared TS types for API and UI contracts.

---

## Utility Layer

### Server-side resume utils
File: `src/utils/resume/resume.util.ts`
- Extracts text from uploaded file.
- Builds parsed context from text.
- Validates file constraints.
- Formats Zod errors.

### Client-side utils
File: `src/utils/resume/resume-client.util.ts`
- Converts API error payloads into user-safe messages.

---

## Service Layer (UI -> API)

File: `src/app/resume/services/resume.service.ts`

Contains:
- `uploadResume(...)`
- `fetchResumeInsights(...)`
- `askResumeAssistant(...)`

Why:
- UI does not call API directly.
- Keeps network/business orchestration outside components.

---

## UI Layer

### Page entry
File: `src/app/resume/page.tsx`
- Only renders container component.

### Feature container
File: `src/app/resume/ResumeContainer.tsx`

Responsibilities:
- Upload interactions
- Loading latest insights
- Display parsed context
- Display AI suggestions
- Chat assistant interactions

Design rule followed:
- No direct API calls inside component.
- Uses service layer only.

---

## Environment Requirements

Required:
- `OPENAI_API_KEY` in `.env` for live AI responses.

Dependencies used:
- `ai`
- `@ai-sdk/openai`
- `zod`

---

## End-to-End Flow Summary
1. Enter `userId` + upload file from Resume UI.
2. `resume.service.ts` calls `POST /api/resume`.
3. API validates request, parses resume, saves to DB.
4. AI SDK generates suggestions (or fallback), saves them.
5. UI renders parsed context and suggestions.
6. User asks chatbot question.
7. `POST /api/resume/chat` returns assistant answer.
