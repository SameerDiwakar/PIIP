# PIIP Technical Documentation

## Overview

PIIP (Personal Investment Intelligence Platform) is a behavioral learning system for investors. Instead of generic buy/sell signals, it builds a personalized model of each user's decision-making style and uses that to generate contextual recommendations.

## Memory Management Strategy

PIIP implements a three-layer memory architecture:

### Layer 1: Raw Behavioral Data
- **Transactions** — Every buy/sell/hold with notes, sentiment, market condition, and tags
- **Watchlist activity** — Stocks being monitored with user reasoning
- **Onboarding preferences** — Stated risk tolerance, goals, and sector preferences

### Layer 2: Computed Behavior Profile
The `behaviorAnalyzer` service processes raw transactions into a structured profile:
- **Behavior type** — momentum, value, growth, contrarian, or balanced
- **Risk profile** — conservative, moderate, aggressive
- **Behavioral scores** — discipline, patience, decisiveness, risk management, consistency (0–100)
- **Quantitative metrics** — win rate, profit factor, buy/sell ratio, holding periods

This profile is recalculated on demand and stored in `UserBehaviorProfile`.

### Layer 3: Long-term Memory (Second Brain)
The `UserMemory` collection stores semantic memories:
- **Categories:** preference, pattern, mistake, success, note, feedback
- **Sources:** transaction notes, chat interactions, recommendation feedback, system inference
- **Confidence scores** — Higher confidence memories are prioritized in AI prompts

Memories are:
1. Seeded from transaction notes during sync
2. Created when users rate recommendations
3. Injected into AI system prompts for chat and evaluations

## Personalization Pipeline

```
User Action (trade, chat, feedback)
        │
        ▼
Behavior Analyzer ──▶ UserBehaviorProfile
        │
        ▼
Memory Service ──▶ UserMemory entries
        │
        ▼
AI / Recommendation Service
  ├── System prompt: profile + memories + preferences
  ├── User query: ticker, question, context
  └── Output: explainable recommendation with fit score
        │
        ▼
Feedback Loop ──▶ Updated memories
```

### Recommendation Scoring (Offline Fallback)
When OpenAI is unavailable, a rule-based scorer computes fit:
- Sector alignment with preferred sectors (+25)
- Style match with behavior type (+20)
- Risk alignment (+10)
- Already traded penalty (−30)

### AI-Powered Evaluation
With OpenAI configured, evaluations include:
- Personalized action (Consider Buy / Hold / Pass)
- Fit score (0–100)
- Natural language reasoning referencing user's history
- Key factor breakdown

## Explainability

Every recommendation includes:
1. **Fit score** — Quantified alignment with user profile
2. **Reasoning** — Plain-language explanation referencing behavioral data
3. **Key factors** — Sector fit, style match, risk alignment scores
4. **Memory references** — Past notes and patterns that influenced the analysis

The behavior dashboard provides radar charts, sector preferences, and trading metrics for full transparency.

## Data Sources

All market data in the demo is **sample/static data**:
- 20 companies in `server/data/sampleCompanies.js`
- 27 historical transactions spanning ~12 months in `server/data/sampleData.js`
- No live market data API integration (future improvement)

## Assumptions

1. Users manually log transactions (no broker integration)
2. Sample company catalog covers major US equities
3. Behavior analysis requires at least 1 transaction
4. OpenAI API key is optional — offline fallbacks exist for all AI features
5. Single-user sessions via JWT (no multi-tenant org support)

## Limitations

| Limitation | Impact |
|------------|--------|
| No live market prices | Portfolio values use cost basis, not market prices |
| Static company catalog | Unknown tickers get generic analysis |
| Rule-based behavior classification | May misclassify hybrid investing styles |
| In-memory chat context | Last 10 messages only in AI context window |
| No broker sync | Manual data entry required |
| English only | AI prompts and UI are English-only |

## Scalability Considerations

- **MongoDB indexes** on user+date, user+ticker for fast queries
- **Rate limiting** — 100 req/15min general, 20 req/min for AI endpoints
- **Behavior analysis** — Computed on demand, cached in profile document
- **Horizontal scaling** — Stateless API servers behind load balancer
- **Future:** Background jobs for periodic re-analysis, vector DB for semantic memory search

## Future Improvements

1. **Vector database** (Pinecone/Qdrant) for semantic memory retrieval
2. **Broker integrations** (Plaid, Alpaca) for automatic transaction import
3. **Live market data** (Alpha Vantage, Polygon.io) for real portfolio valuation
4. **LangGraph agents** for multi-step research workflows
5. **Mem0 integration** for advanced memory management
6. **Knowledge graph** linking sectors, companies, and user decisions
7. **Push notifications** for watchlist price alerts
8. **Multi-model AI** — Fine-tuned models per behavior type
9. **Backtesting** — Simulate how recommendations would have performed
10. **Export/reporting** — PDF behavioral reports

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT authentication with configurable expiry
- Rate limiting on all API and AI routes
- CORS restricted to configured client URL
- API keys stored in environment variables only
- Input validation via express-validator

## Testing the Demo

```bash
# Seed demo user
cd server && npm run seed

# Login: demo@piip.com / demo1234

# Try these flows:
# 1. Dashboard → view AI insights and sector allocation
# 2. Behavior → see momentum/growth profile with radar chart
# 3. Recommendations → evaluate "AMD" or click a similar company
# 4. AI Chat → ask "What patterns do you see in my trading?"
# 5. Analytics → explore sector and monthly charts
```

The demo user profile reflects a tech-heavy, momentum-leaning investor with documented successes (META, PLTR) and mistakes (AMD, SQ).
