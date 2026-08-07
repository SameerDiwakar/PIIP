# PIIP Technical Documentation

## Overview

PIIP (Personal Investment Intelligence Platform) is a full-stack financial technology application that analyzes user transaction history, builds a behavioral investor profile, maintains persistent long-term memory, and provides personalized stock evaluations and AI interaction.

This document details the software architecture, analytical heuristics, memory management model, data handling, system limitations, security practices, and future technical improvements.

---

## Technical Approach & Personalization Pipeline

The core technical objective of PIIP is to move away from generic buy/sell indicators toward personalized, behavior-aware financial analysis. The system achieves this by running a structured, multi-step pipeline:

```
[ Raw User Inputs ]
 (Trades, Notes, Feedback)
         │
         ▼
[ Behavior Analyzer ] ───────► Stores in UserBehaviorProfile
 (Quantitative Heuristics)       (Style, Risk Profile, Sub-scores)
         │
         ▼
[ Memory Service ] ──────────► Stores in UserMemory
 (Extracts Insights/Feedback)    (Categorized & Rated Memories)
         │
         ▼
[ AI & Evaluation Engine ] ◄── Loads Profile + Top Memories + Recent Chat
 (Gemini API / Rule Scorer)
         │
         ▼
[ Personalised Response ] ───► Recommendation, Fit Score & Reasoning
```

### Data Flow Execution Steps

1. **Transaction Entry & Ingestion:** When a user logs a trade (buy, sell, hold), the transaction is persisted with volume, price, date, sector, notes, and sentiment.
2. **Behavioral Profile Computation:** `behaviorAnalyzer.js` parses the full historical transaction timeline to compute quantitative metrics, determine investor style, and calculate behavioral sub-scores.
3. **Memory Extraction & Persistence:** Key takeaways from transaction notes and recommendation feedback are categorized and written to the `UserMemory` collection.
4. **Context Injection & Prompt Engineering:** When interacting with the AI chat or evaluating a ticker, `aiService.js` constructs a system prompt containing the user's computed profile, active positions, top relevant memories, and chat history.
5. **Generation & Fallback Handling:** The application queries the Google Gemini API (`generativelanguage.googleapis.com`). If the API is unavailable, the system seamlessly degrades to rule-based fit scoring.

---

## Behavioral Analyzer Heuristics & Metrics

The `behaviorAnalyzer` service computes quantitative metrics directly from database records:

### 1. Holding Period Classification
Holding periods are calculated by matching sell transactions to historical buy records on the same ticker:
- **Intraday:** `< 1 day`
- **Short-term:** `< 7 days`
- **Medium-term:** `7 to 30 days`
- **Long-term:** `30 to 180 days`
- **Very Long-term:** `>= 180 days`

### 2. Investor Style Classification
- **Momentum:** Average holding period `< 7 days` AND Buy/Sell ratio `> 1.5`.
- **Value:** Average holding period `> 90 days` AND Buy/Sell ratio `< 0.5`.
- **Growth:** Primary preferred sector contains `Tech`, `Growth`, or `Innovation`.
- **Contrarian:** Negative trade sentiment count exceeds positive trade sentiment count.
- **Balanced:** Default fallback classification when no single pattern dominates.

### 3. Risk Profile Determination
If a user explicitly sets their risk tolerance in user settings, that value is honored. Otherwise, an inferred risk score is computed:
- Position size `> $10,000` (`+2 pts`), `> $1,000` (`+1 pt`)
- Holding period `< 7 days` (`+2 pts`), `< 30 days` (`+1 pt`)
- Buy/Sell ratio `> 2.0` (`+1 pt`)
- **Classification:** Score `>= 4` → `Aggressive`; Score `>= 2` → `Moderate`; else `Conservative`.

### 4. Behavioral Sub-scores (0–100 Scale)

- **Patience:** Standardized function of average holding period. Higher average holding days yield higher patience scores (capped at 100).
- **Decisiveness:** Derived from sell execution ratio (`sells / buys * 100`). Higher exit execution relative to entries indicates higher decisiveness.
- **Consistency:** Inverse function of sector spread (`100 - (unique_sectors * 10)`). Concentrated trading in familiar sectors yields higher consistency.
- **Discipline:** Measured using the Coefficient of Variation ($CV = \frac{\sigma}{\mu}$) of position sizing across trades. Lower variance relative to mean position size yields a higher discipline score (`100 - CV * 50`).
- **Risk Management:** Ratio of closed trades to total transactions (`sells / total_trades * 100`).

---

## Three-Tier Memory Architecture

PIIP uses a three-tier memory architecture to combine raw activity logs with structured memory storage:

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Raw Behavioral Data                             │
│ - Transactions (Price, quantity, date, sentiment, notes) │
│ - Watchlist records & stated user preferences            │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│ Layer 2: Derived Behavior Profile                        │
│ - Investor Style, Risk Level, Quantitative Scores        │
│ - Updated on demand & cached in UserBehaviorProfile      │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│ Layer 3: Persistent User Memory (Second Brain)          │
│ - Categorized entries (pattern, mistake, preference, etc)│
│ - Confidence scores & source tags                        │
└──────────────────────────────────────────────────────────┘
```

### Memory Entry Schema
Each memory in the `UserMemory` collection contains:
- **`category`:** `preference`, `pattern`, `mistake`, `success`, `note`, or `feedback`.
- **`content`:** Concise textual representation of the observation.
- **`confidence`:** Score from `0` to `100` indicating reliability.
- **`source`:** Tag indicating origin (`transaction_note`, `chat_interaction`, `recommendation_feedback`, `system_inference`).
- **`ticker`:** Optional ticker association.

---

## Recommendation & Opportunity Evaluator

When a user requests a recommendation or evaluates a ticker (e.g. `AMD`), PIIP evaluates stock fit using a hybrid approach:

### 1. Offline Deterministic Rule Scorer
The baseline fit score starts at `50` and is adjusted based on user alignment:
- Sector match with preferred sectors: `+25`
- Investor style match (e.g., momentum investor evaluating momentum stock): `+20`
- Style-specific alignment bonus (e.g., aggressive risk profile evaluating momentum stock): `+10`
- Previously traded ticker penalty: `-30` (promotes discovery of new assets)
- **Score Clamping:** Clamped between `0` and `100`. Fit `>= 75` recommends `Consider Buy`, `40–74` recommends `Hold`, `< 40` recommends `Pass`.

### 2. Gemini Generative AI Evaluation
When `GEMINI_API_KEY` is configured, `aiService.js` executes a structured prompt using JSON response mode (`response_mime_type: application/json`).
- **Prompt Input:** Ticker details, company market cap/style, user behavior profile, and formatted user memory items.
- **Output Schema:** JSON containing `action`, `fitScore`, `reasoning`, `keyFactors`, and `memoryReferences`.
- **Resilience Strategy:** Uses model fallback sequence (`gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-2.0-flash`). If network or API limits occur, the service seamlessly defaults to the offline rule scorer.

---

## Data Sources & Local Database Setup

- **Company Universe:** Static reference array of 20 US equities in `server/data/sampleCompanies.js`. Tickers span Technology, Finance, Healthcare, Energy, and Consumer Goods across large and mid-cap categories.
- **Sample Seed Dataset:** Pre-configured historical trades in `server/data/sampleData.js` covering a 12-month period for realistic behavior profile generation during initial testing.
- **Database Engine:** MongoDB schemas defined using Mongoose (`User`, `Transaction`, `UserBehaviorProfile`, `UserMemory`, `ChatHistory`, `Watchlist`, `RecommendationFeedback`).

---

## Technical Assumptions

1. **Manual Entry:** Trade logs are manually created by the user or seeded via script. Automatic broker API synchronization is not implemented in the current build.
2. **Fixed Universe:** Company metadata lookup depends on the internal reference catalog (`SAMPLE_COMPANIES`). Uncatalogued tickers return fallback static metadata.
3. **Cost Basis Valuation:** Portfolio holdings and unrealized gains are calculated based on recorded purchase prices and cost basis, rather than real-time market quote feeds.
4. **Single-Tenant User Context:** Each JWT token isolates data query execution strictly to `req.user._id`.

---

## System Limitations

| Feature Area | Limitation | Technical Impact |
|---|---|---|
| **Market Data** | Static local dataset | Portfolio valuations reflect historical transaction prices, not real-time tick-by-tick prices. |
| **Asset Coverage** | 20 US equities | Non-catalogued stock searches use baseline fallback sector assumptions. |
| **Behavior Rules** | Heuristic logic | Sophisticated multi-strategy traders may be assigned a dominant label (e.g. `growth`) rather than a dynamic strategy distribution. |
| **AI Context Window** | 10 chat messages / 10 memories | System prompts truncate chat history to the 10 most recent messages to stay within token budgets. |
| **Language Support** | English prompt templates | System instructions and UI elements are optimized for English input. |

---

## Security & System Hardening

- **Password Hashing:** User passwords are encrypted using `bcryptjs` with a cost factor of 12 salt rounds before database insertion.
- **Stateless Authentication:** API endpoints require a valid JSON Web Token (`JWT`) in the `Authorization: Bearer <token>` header, verified by Express middleware (`middleware/auth.js`).
- **Rate Limiting:** Routes are protected via `express-rate-limit` to protect against brute-force attacks and API abuse:
  - General API endpoints: 100 requests per 15-minute window.
  - AI endpoints (`/api/ai/*`): 20 requests per 15-minute window.
- **CORS Protection:** Express CORS middleware restricts requests strictly to the configured `CLIENT_URL`.
- **Input Validation:** Endpoint payloads are validated using `express-validator` sanitizers to prevent injection attacks.

---

## Future Improvements

1. **Vector Database Integration:** Transition long-term memory retrieval from keyword/limit matching to semantic embeddings using a vector store (e.g. Qdrant or Pinecone).
2. **Brokerage API Sync:** Integrate Plaid or Alpaca API connectors for automated, real-time transaction importing and portfolio sync.
3. **Live Market Data Feed:** Connect financial data APIs (such as Polygon.io or Alpha Vantage) to fetch real-time market prices, P/E ratios, and news feeds.
4. **Backtesting & Simulation Engine:** Allow users to simulate how their historical behavioral profile and recommended trades would have performed over custom market periods.
5. **PDF Behavioral Reporting:** Add export functionality to generate downloadable PDF summaries of investor discipline, trading patterns, and sector performance.
