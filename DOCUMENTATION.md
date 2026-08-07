# PIIP — Personal Investment Intelligence Platform
## Complete Technical Submission & Project Documentation

---

### Project Deliverables Summary

1. **GitHub Repository (Source Code):** [https://github.com/SameerDiwakar/PIIP](https://github.com/SameerDiwakar/PIIP)
2. **Live Deployed Application (Vercel):** [https://piip-mgbi-lilac.vercel.app](https://piip-mgbi-lilac.vercel.app)
3. **Live Backend API (Render):** [https://piip-backend.onrender.com](https://piip-backend.onrender.com)
4. **Pre-seeded Demo Account Credentials:**
   - **Email:** `demo@piip.com`
   - **Password:** `demo1234`

---

## 1. Executive Summary & System Overview

The **Personal Investment Intelligence Platform (PIIP)** is a full-stack financial technology application that moves beyond standard market data feeds by personalizing insights to each investor's unique behavioral footprint. 

Rather than generating generic market buy/sell signals, PIIP evaluates trade history to identify behavioral styles (such as momentum chasing, value seeking, growth investing, or contrarian tendencies), calculates discipline and risk management scores, stores long-term insights in a structured memory log, and leverages Google Gemini AI to provide explainable investment recommendations.

---

## 2. System Architecture & Technical Design

PIIP uses a decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend: React 18 SPA (Vite)               │
│   Tailwind CSS · Recharts · Lucide Icons · Axios · Router   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON / JWT Bearer)
┌──────────────────────────────▼──────────────────────────────┐
│                Backend API Server (Node.js/Express)         │
│  ├── Authentication (JWT + bcryptjs)                        │
│  ├── Transaction & Portfolio Calculation Engine             │
│  ├── Behavior Profiling Service (Rule-based Heuristics)     │
│  ├── User Memory System (Categorized & Rated Storage)       │
│  ├── Recommendation Engine (Hybrid Rule/AI Scorer)          │
│  └── AI Service (Google Gemini API REST Integration)        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐  ┌────────────▼───────────────┐
│     MongoDB Atlas Database  │  │     Google Gemini API     │
│  Users · Transactions       │  │ (generativelanguage REST) │
│  BehaviorProfiles · Memory  │  └───────────────────────────┘
│  ChatHistory · Watchlist    │
└─────────────────────────────┘
```

### Core Design Decisions

1. **Decoupling Math from Generative AI:** Quantitative metrics (holding periods, win rates, position size variance) are calculated deterministically by `behaviorAnalyzer.js`. The AI service consumes these structured values as context rather than performing math calculations itself.
2. **Hybrid Evaluation with Fallbacks:** If the Gemini API is unreachable or rate-limited, `recommendationService.js` defaults to a deterministic rule-based scoring engine, preventing system crashes.
3. **Three-Tier User Memory Architecture:** Long-term memory is decoupled into raw trade activity (Layer 1), computed investor behavior profile (Layer 2), and discrete categorized memory entries (Layer 3).
4. **Stateless API Design:** Session state is authenticated via JSON Web Tokens (`JWT`), allowing backend services to scale horizontally without session affinity.

---

## 3. Data Flow & Personalization Pipeline

```
[ User Trade / Note Entry ]
             │
             ▼
   [ Behavior Analyzer ] ───────► Computes Style & Behavioral Scores
   (Holding Days, Win Rate)       (Saved in UserBehaviorProfile)
             │
             ▼
     [ Memory Service ] ────────► Categorizes Insights & Feedback
   (Pattern, Mistake, Notes)      (Saved in UserMemory)
             │
             ▼
   [ AI Evaluation Engine ] ◄──── Injects Profile + Top Memories + Chat
   (Gemini API / Rule Engine)
             │
             ▼
  [ Personalized Output ] ──────► Action, Fit Score (0-100) & Reasoning
```

---

## 4. Analytical Heuristics & Behavioral Formulas

The `behaviorAnalyzer` service computes metrics directly from database transaction logs:

### 1. Holding Period Categories
Computed by matching sell transactions against historical buy records:
- **Intraday:** `< 1 day`
- **Short-term:** `< 7 days`
- **Medium-term:** `7 to 30 days`
- **Long-term:** `30 to 180 days`
- **Very Long-term:** `>= 180 days`

### 2. Investor Style Classification
- **Momentum:** Average holding period `< 7 days` AND Buy/Sell ratio `> 1.5`.
- **Value:** Average holding period `> 90 days` AND Buy/Sell ratio `< 0.5`.
- **Growth:** Primary preferred sector contains `Technology`, `Growth`, or `Innovation`.
- **Contrarian:** Negative trade sentiment count exceeds positive sentiment count.
- **Balanced:** Default classification when no single pattern dominates.

### 3. Risk Profile Inferencing
If risk tolerance is set in user preferences, that value is honored. Otherwise, an inferred score is computed:
- Average position size `> $10,000` (`+2 pts`), `> $1,000` (`+1 pt`)
- Holding period `< 7 days` (`+2 pts`), `< 30 days` (`+1 pt`)
- Buy/Sell ratio `> 2.0` (`+1 pt`)
- **Classification:** Score `>= 4` → `Aggressive`; Score `>= 2` → `Moderate`; else `Conservative`.

### 4. Behavioral Sub-scores (0–100 Scale)
- **Patience:** Standardized function of average holding days (capped at 100).
- **Decisiveness:** Derived from sell execution ratio (`sells / buys * 100`).
- **Consistency:** Inverse function of sector spread (`100 - (unique_sectors * 10)`).
- **Discipline:** Measured using the Coefficient of Variation ($CV = \frac{\sigma}{\mu}$) of position sizes (`100 - CV * 50`).
- **Risk Management:** Percentage of trades closed with sell records (`sells / total_trades * 100`).

---

## 5. Three-Tier Memory Architecture

1. **Layer 1 (Raw Activity):** Transaction records, watchlist items, and stated user risk preferences.
2. **Layer 2 (Computed Profile):** Document caching computed metrics, investor style, and sub-scores (`UserBehaviorProfile`).
3. **Layer 3 (Persistent User Memory):** Discrete memory entries (`UserMemory`) tagged with:
   - **`category`:** `preference`, `pattern`, `mistake`, `success`, `note`, `feedback`.
   - **`confidence`:** 0 to 100 score.
   - **`source`:** Tag (`transaction_note`, `chat_interaction`, `recommendation_feedback`, `system_inference`).

---

## 6. Recommendation & Opportunity Evaluator

### Offline Deterministic Rule Scorer
- **Base Score:** `50`
- Sector match with preferred sectors: `+25`
- Style match (e.g. momentum investor evaluating momentum stock): `+20`
- Style-specific alignment bonus: `+10`
- Traded ticker penalty (promotes discovery): `-30`
- **Output:** Clamped between `0` and `100`. Fit `>= 75` → `Consider Buy`, `40–74` → `Hold`, `< 40` → `Pass`.

### Gemini AI Evaluation Pipeline
- Generates qualitative reasoning referencing portfolio stats and top memories.
- Uses `gemini-2.5-flash` with fallback models (`gemini-1.5-flash`, `gemini-2.0-flash`).
- Falls back gracefully to the rule-based scorer on network failure.

---

## 7. Data Sources & Local Reference Catalog

- **Equities Catalog:** 20 major US equities in `server/data/sampleCompanies.js` (Technology, Finance, Healthcare, Energy, Consumer Goods).
- **Seed Dataset:** 27 historical trade records in `server/data/sampleData.js` spanning a 12-month period.
- **Valuation Basis:** Uses recorded transaction cost basis.

---

## 8. Technical Assumptions & Operational Limitations

### Assumptions
1. Transactions are entered manually or seeded via script.
2. Ticker evaluation references the internal catalog of US equities.
3. Sessions are authenticated via stateless JWT tokens.

### Limitations
1. **Static Catalog:** Tickers outside the catalog receive generalized fallback metadata.
2. **Cost Basis Valuation:** Portfolio values reflect cost basis rather than live tick-by-tick websocket feeds.
3. **Heuristic Classification:** Multi-strategy investors are assigned a dominant style label rather than a continuous distribution.
4. **Context Window Limits:** AI chat contexts include the 10 most recent chat messages and top 10 memory items to remain within token budgets.

---

## 9. Security Practices & Data Hardening

- **Password Encryption:** Passwords hashed using `bcryptjs` with 12 salt rounds.
- **JWT Authorization:** Secured endpoints require `Authorization: Bearer <token>` headers.
- **Rate Limiting (`express-rate-limit`):**
  - General routes: 100 requests per 15-minute window.
  - AI routes: 20 requests per minute window.
- **CORS Restrictions:** Configured to whitelist designated frontend origins.
- **Input Sanitization:** Payload validation via `express-validator`.

---

## 10. Future Roadmap & Improvements

1. **Vector Database Integration:** Replace keyword memory filtering with vector store embeddings (Qdrant/Pinecone) for semantic memory retrieval.
2. **Brokerage API Synchronization:** Connect Plaid or Alpaca APIs for automated trade imports.
3. **Live Market Data Feeds:** Integrate Polygon.io or Alpha Vantage APIs for real-time stock quotes.
4. **Backtesting Engine:** Allow users to simulate how recommendations would have performed over historical periods.
5. **PDF Report Exports:** Generate downloadable behavioral summaries and performance reports.
