# PIIP — Personal Investment Intelligence Platform

PIIP (Personal Investment Intelligence Platform) is a full-stack web application designed to track investment transactions, analyze investor trading behavior, maintain user-specific memory, and generate personalized equity recommendations and AI assistance using Google Gemini API.

---

## Project Links & Deliverables

- **GitHub Repository:** [https://github.com/SameerDiwakar/PIIP](https://github.com/SameerDiwakar/PIIP)
- **Live Frontend Application (Vercel):** [https://piip-mgbi-lilac.vercel.app](https://piip-mgbi-lilac.vercel.app)
- **Live Backend API Server (Render):** [https://piip-backend.onrender.com](https://piip-backend.onrender.com)

---

## Features

- **Transaction & Portfolio Management:** Log buy, sell, and hold transactions with cost basis, notes, sentiment, and market context. View portfolio positions, unrealized returns, and asset allocation breakdown.
- **Behavioral Profiling Engine:** Rule-based analyzer that evaluates trade history to determine investor style (momentum, value, growth, contrarian, balanced), risk profile, holding period tendencies, and behavioral scores (discipline, patience, decisiveness, consistency, risk management).
- **Three-Tier User Memory System:** Persistent user memory layer storing trade insights, behavioral patterns, trading mistakes, and feedback to personalize future AI responses and evaluations.
- **AI Assistant & Interactive Chat:** Context-aware chat interface powered by Google Gemini (`gemini-2.5-flash` with model fallbacks) loaded with user portfolio stats, behavior profile, and memory entries.
- **Recommendation & Opportunity Evaluator:** Evaluates individual tickers against investor profile and risk tolerance using AI analysis with a deterministic rule-based scoring fallback engine.
- **Similar Companies Discovery:** Surface stock ideas matched to user investment style and preferred sectors.
- **Feedback & Adaptation Loop:** Rate AI recommendations to record user feedback into long-term memory.
- **Watchlist Tracking:** Track priority tickers with notes and target price alerts.

---

## Architecture

PIIP uses a classic client-server architecture with decoupled services:

```
┌─────────────────────────────────────────────────────────────┐
│                      React SPA (Vite)                       │
│      React Router · Tailwind CSS · Recharts · Lucide UI     │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON / JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express API Server                       │
│  ├── Auth Service (JWT + bcrypt)                            │
│  ├── Transaction & Portfolio Engine                         │
│  ├── Behavior Analyzer (Quantitative Heuristics)            │
│  ├── Memory Service (Tiered User Context Store)            │
│  ├── Recommendation Engine (Hybrid Rule/AI Scorer)          │
│  └── AI Service (Gemini API Integration with Fallbacks)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐  ┌────────────▼───────────────┐
│           MongoDB           │  │     Google Gemini API     │
│  Users · Transactions       │  │  (generativelanguage REST)│
│  BehaviorProfiles · Memory  │  └───────────────────────────┘
│  ChatHistory · Watchlist    │
└─────────────────────────────┘
```

---

## Prerequisites

- **Node.js:** v18.x or higher
- **npm:** v9.x or higher
- **MongoDB:** Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas connection string
- **Gemini API Key:** Free key from [Google AI Studio](https://aistudio.google.com/)

---

## Setup Instructions

### 1. Repository Setup & Dependencies

Clone the repository and install dependencies for both server and client:

```bash
git clone https://github.com/SameerDiwakar/PIIP.git
cd PIIP

# Option A: Root helper script
npm run install:all

# Option B: Manual directory install
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```bash
cd server
cp .env.example .env  # or create .env directly
```

Update `server/.env` with your credentials:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/piip
JWT_SECRET=your_secure_jwt_secret_phrase
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed Demo Data

Make sure your MongoDB connection is configured, then run the seed script to populate sample companies, a demo user, and historical trade logs:

```bash
cd server
npm run seed
```

### 4. Running the Development Servers

Start the server and client concurrently or in separate terminal windows:

```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Alternatively, run from the root directory:

```bash
# Start server from root
npm run dev:server

# Start client from root (in separate terminal)
npm run dev:client
```

---

## Demo Credentials

You can sign in immediately using the pre-seeded account:

- **Email:** `demo@piip.com`
- **Password:** `demo1234`

*Note: You can also register a new user account on `/register` and click **Load Sample Data** on the dashboard to populate mock trade history.*

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server listening port |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/piip` | MongoDB database connection URI |
| `JWT_SECRET` | Yes | - | Secret key used to sign JWT authentication tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration time |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key for AI chat and evaluations |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Primary Gemini model ID |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed origin for CORS requests |
| `NODE_ENV` | No | `development` | Node execution environment |

---

## API Routes Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user and issue JWT |
| `GET` | `/api/auth/me` | Yes | Fetch current user profile |
| `PUT` | `/api/auth/preferences` | Yes | Update stated risk tolerance and preferred sectors |
| `GET` | `/api/transactions` | Yes | List user transactions with optional filters |
| `POST` | `/api/transactions` | Yes | Create a new trade record |
| `PUT` | `/api/transactions/:id` | Yes | Update an existing transaction |
| `DELETE` | `/api/transactions/:id` | Yes | Delete a transaction record |
| `GET` | `/api/portfolio` | Yes | Get calculated open portfolio holdings |
| `GET` | `/api/portfolio/summary` | Yes | Get portfolio metrics (total invested, cash, total gain) |
| `GET` | `/api/analytics` | Yes | Get sector allocation and monthly trade breakdown |
| `GET` | `/api/watchlist` | Yes | List watchlist items |
| `POST` | `/api/watchlist` | Yes | Add ticker to watchlist |
| `DELETE` | `/api/watchlist/:id` | Yes | Remove ticker from watchlist |
| `GET` | `/api/ai/profile` | Yes | Retrieve or compute investor behavior profile |
| `POST` | `/api/ai/analyze` | Yes | Force re-computation of behavior profile |
| `POST` | `/api/ai/chat` | Yes | Send message to AI assistant |
| `POST` | `/api/ai/insights` | Yes | Generate structured summary insights |
| `GET` | `/api/recommendations/similar` | Yes | Get recommended tickers matching investor profile |
| `POST` | `/api/recommendations/evaluate` | Yes | Evaluate specific stock ticker fit |
| `POST` | `/api/recommendations/feedback` | Yes | Submit rating for recommendation and save memory |
| `GET` | `/api/memory` | Yes | Retrieve user memory entries |
| `POST` | `/api/memory` | Yes | Add custom user memory entry |
| `DELETE` | `/api/memory/:id` | Yes | Delete memory entry |
| `POST` | `/api/seed/demo` | Yes | Populate user account with sample trade data |

---

## Data Sources

- **Market & Company Data:** Sample dataset of 20 major US equities defined in `server/data/sampleCompanies.js` (including ticker, sector, market cap, style tag, description).
- **Trade History:** 27 pre-built trade records spanning ~12 months in `server/data/sampleData.js` used during database seeding.
- **Live Prices:** Current version relies on transaction cost basis and static sample metadata; live API feeds (e.g. Polygon, Alpha Vantage) can be integrated in future iterations.

---

## Core Design Decisions

1. **Decoupled Quantitative & Qualitative Layers:** Quantitative trade metrics (holding days, win rate, buy/sell ratio) are calculated deterministically by `behaviorAnalyzer.js`. AI services consume these computed metrics as context rather than calculating math directly.
2. **Offline Fallback Engine:** If `GEMINI_API_KEY` is missing or the external API call fails, `recommendationService.js` falls back to rule-based fit scoring, ensuring UI components remain functional.
3. **Structured User Memory:** Long-term user context is stored as discrete typed records (`preference`, `pattern`, `mistake`, `success`, `note`, `feedback`) with confidence ratings, injected dynamically into AI prompts.
4. **Stateless API Design:** User session state is preserved via JWT headers and database persistence, allowing horizontally scalable Express deployments.

---

## Technical Documentation

For complete details on formulas, memory architecture, limitations, security practices, and future improvements, refer to [docs/TECHNICAL.md](docs/DOCUMENTATION.md).

---

## Disclaimer

PIIP is designed purely for educational and analytical purposes. It provides behavioral insights based on historical trade logs and does not provide formal, licensed financial advice.
