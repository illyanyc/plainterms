# PlainTerms - Privacy Policy & Terms Analyzer

Chrome extension that detects legal/policy links on any website, extracts the text, and streams an AI-powered analysis with red flags, pros, watch-outs, plain English summaries, and reputation data.

## Architecture

```
PlainTerms/
├── extension/   Chrome MV3 extension (WXT + React + TypeScript + Tailwind)
└── backend/     FastAPI server (Python, OpenAI, Serper.dev, Stripe)
```

**Extension** detects and highlights policy links, extracts text, and renders a streaming Side Panel UI.
**Backend** runs heuristic checks (20 clause families), PII redaction, LLM analysis (GPT-4o-mini), and reputation lookups (Serper.dev).

The Side Panel calls the backend directly via SSE (not proxied through the service worker) to avoid MV3 timeout constraints.

## Tiers

| Feature | Free | Pro ($9.99/mo) | Enterprise |
|---------|------|----------------|------------|
| Heuristic scans | Unlimited | Unlimited | Unlimited |
| Quick AI analyses | 5/day | 20/day | Unlimited |
| Deep multi-agent | - | 50/month | Unlimited |
| Reputation badge | Basic | Deep dive | Deep dive |
| Policy diffing | - | Yes | Yes |
| Export (PDF/HTML) | - | - | Yes |

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys (see below)
uvicorn main:app --reload --port 8000
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini analysis
- `SERPER_API_KEY` - Serper.dev key for reputation lookups
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)
- `STRIPE_PRO_PRICE_ID` - Stripe Price ID for the Pro monthly subscription

### Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Create a Product called "PlainTerms Pro" with a $9.99/month recurring price
3. Copy the Price ID (starts with `price_`) to `STRIPE_PRO_PRICE_ID`
4. Copy your Secret Key to `STRIPE_SECRET_KEY`
5. Set up a webhook endpoint pointing to `https://your-domain/api/v1/billing/webhook`
6. Subscribe to these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
7. Copy the Webhook Signing Secret to `STRIPE_WEBHOOK_SECRET`
8. For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:8000/api/v1/billing/webhook`

### Extension

```bash
cd extension
npm install
npm run dev
```

Load the extension in Chrome:
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/.output/chrome-mv3` directory

## Backend API

**Analysis**
- `POST /api/v1/analyze/quick` - Quick analysis with tier limits (SSE stream)
- `POST /api/v1/analyze/deep` - Deep analysis, Pro+ only (SSE stream)

**Auth & Billing**
- `POST /api/v1/auth/register` - Register anonymous user
- `GET /api/v1/auth/status?client_id=` - Get tier, usage, subscription status
- `POST /api/v1/auth/upgrade` - Create Stripe Checkout session for Pro upgrade
- `POST /api/v1/auth/portal` - Get Stripe Customer Portal URL
- `POST /api/v1/billing/webhook` - Stripe webhook handler

**Utility**
- `GET /api/v1/health` - Health check

## How It Works

1. **Content script** scans every page for links matching privacy/terms/cookie/refund patterns
2. Detected links get a shield badge overlay
3. Clicking the badge or using the popup opens the **Side Panel**
4. Side Panel extracts policy text (Readability.js + fallback) and applies client-side PII redaction
5. Text is streamed to the backend via SSE:
   - PII redaction (server-side defense in depth)
   - 20 heuristic clause checks (regex patterns)
   - LLM analysis (GPT-4o-mini with heuristic hints)
   - Reputation lookup (Serper.dev for Trustpilot + BBB)
6. Results stream back as typed SSE events and render incrementally

## Publishing

Requires a $5 Chrome Web Store developer account. See `STORE.md` for the listing template.

## License

MIT
# plainterms
