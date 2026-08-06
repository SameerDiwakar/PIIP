# PIIP — Personal Investment Intelligence Platform

A full-stack fintech application that learns from your investment behavior and provides personalized, explainable insights powered by AI.

## Features

- **Transaction Tracking** — Log buys, sells, and holds with notes, sentiment, and market context
- **Portfolio & Analytics** — Real-time allocation, sector breakdown, and activity charts
- **Behavior Analysis** — Automated profiling of investing style (momentum, value, growth, etc.)
- **Long-term Memory** — Persistent "second brain" that learns patterns, mistakes, and preferences
- **AI Assistant** — Conversational chat with context from your profile and memory (OpenAI GPT-4o-mini)
- **Personalized Recommendations** — Evaluate new opportunities with fit scores and reasoning
- **Similar Companies** — Discover stocks aligned with your behavioral profile
- **Feedback Loop** — Rate recommendations so the system adapts over time
- **Watchlist** — Track stocks with price alerts and priority levels

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│  React SPA  │────▶│  Express API (Node.js)                       │
│  (Vite)     │     │  ├── Auth (JWT)                              │
└─────────────┘     │  ├── Transactions / Portfolio / Watchlist     │
                    │  ├── Behavior Analyzer (rule-based ML)       │
                    │  ├── Memory Service (persistent user memory)  │
                    │  ├── Recommendation Engine (profile + OpenAI) │
                    │  └── AI Service (GPT-4o-mini)                │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  MongoDB                                     │
                    │  Users · Transactions · BehaviorProfiles     │
                    │  UserMemory · ChatHistory · Watchlist        │
                    └──────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### Setup

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Configure environment
cd ../server
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Seed demo data (requires MongoDB running)
npm run seed

# 4. Start server
npm run dev

# 5. Start client (separate terminal)
cd ../client
npm run dev
```

Open http://localhost:5173 and sign in with:

| Email | Password |
|-------|----------|
| demo@piip.com | demo1234 |

Or register a new account and click **Load Sample Data** on the dashboard.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CLIENT_URL` | Frontend URL for CORS |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/transactions` | CRUD transactions |
| GET | `/api/portfolio` | Portfolio positions |
| GET/POST | `/api/watchlist` | Watchlist management |
| GET | `/api/analytics` | Trading analytics |
| GET | `/api/ai/profile` | Behavior profile |
| POST | `/api/ai/chat` | AI conversation |
| POST | `/api/ai/insights` | Generate insights |
| GET | `/api/recommendations/similar` | Similar companies |
| POST | `/api/recommendations/evaluate` | Evaluate opportunity |
| POST | `/api/recommendations/feedback` | Rate recommendation |
| GET | `/api/memory` | User long-term memory |
| POST | `/api/seed/demo` | Load sample data |

## Design Decisions

See [docs/TECHNICAL.md](docs/TECHNICAL.md) for detailed technical approach, assumptions, limitations, and future improvements.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **AI:** OpenAI GPT-4o-mini

## Deployment

Deploy the server (Railway, Render, Fly.io) and client (Vercel, Netlify) separately. Set environment variables on the server and configure the client proxy or `VITE_API_URL`.

## Disclaimer

PIIP provides educational behavioral insights, not licensed financial advice. Always do your own research before making investment decisions.
