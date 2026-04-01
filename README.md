# Legacy AI — A Family Historian

Legacy is a family historian that captures stories through conversation and builds a living family archive. After years of interviews, this repo becomes an irreplaceable family heirloom.

**The accumulated context IS the product.**

## What It Does

- **Conversational Interviews** — A gentle, curious AI (powered by DeepSeek) asks thoughtful follow-up questions to surface memories people didn't know they had
- **Family Tree** — Profiles with bios, relationships, occupations, hometowns
- **Story Archive** — Captured narratives with emotional tone, tags, and narrators
- **Timeline** — Family events from 1945 to present, visualized chronologically
- **Recipe Keeper** — Family recipes with the stories behind them
- **Photo Descriptions** — The stories that photos tell, even without the images
- **Interview Logs** — Track sessions, topics covered, key stories captured
- **Smart Prompts** — Identifies gaps in the family story and suggests what to ask next

## Tech Stack

- **Cloudflare Worker** — API server with SSE streaming to DeepSeek
- **Single HTML file** (`public/app.html`) — Warm, archival aesthetic
- **TypeScript** — Domain models and seed data in `src/legacy/tracker.ts`

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/chat` | POST | SSE streaming chat with Legacy AI |
| `/api/people` | GET, POST | Family member profiles |
| `/api/stories` | GET, POST | Story entries |
| `/api/timeline` | GET, POST | Family timeline events |
| `/api/recipes` | GET, POST | Family recipes |
| `/api/photos` | GET, POST | Photo descriptions |
| `/api/interviews` | GET, POST | Interview session logs |
| `/api/prompts` | GET | Smart prompt suggestions based on gaps |

## Setup

```bash
npm install
npx wrangler dev
```

Set your DeepSeek API key:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

## Seed Data

The app ships with the **Morrison Family** — a realistic Pennsylvania family spanning four generations:

- **2 grandparents**: Harold (railroad engineer, 1928–2015) and Eleanor (teacher/secret poet, 1932–2020)
- **4 parents**: David & Linda Morrison, Sarah & James Mitchell
- **6 grandchildren**: Ryan, Emma, Caleb, Sophie, Olivia + great-granddaughter Mia
- **8 stories** already captured, spanning the blizzard of '66 to a restaurant opening in 2019
- **25 timeline events** from 1945 to 2024
- **3 family recipes**: Thanksgiving wonton soup, Eleanor's apple butter, Harold's railroad coffee
- **2 interview sessions** logged with notes

## Design

- Cream (#FFFBEB) background, dark brown (#44403C) text, amber (#B45309) accents
- Georgia serif typography — warm, archival, timeless
- Dashboard-first: see the family's story at a glance
- Chat feels like a gentle grandchild asking "Tell me about..."

## Architecture

```
src/
  index.ts          — Cloudflare Worker (API routes + static serving)
  legacy/
    tracker.ts      — Domain classes + seed data
public/
  app.html          — Single-file frontend (HTML + CSS + JS)
```

---

*Every family has stories worth keeping. Legacy helps you find them.*
