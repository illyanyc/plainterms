# Chrome Web Store Listing

## Name
PlainTerms - Policy Analyzer

## Short Description (132 chars max)
Instantly understand any Privacy Policy or Terms of Service. AI-powered red flags, plain English summaries, and reputation snapshots.

## Detailed Description

### What it does
PlainTerms detects legal links (Privacy Policy, Terms of Service, Cookie Policy, Refund Policy) on any website and analyzes them for you.

One click opens a Side Panel with a streaming analysis that includes:

**Red Flags** - Ranked by severity with explanations of why each clause matters and what you should do about it. Covers 20 clause families including binding arbitration, data sharing, auto-renewal, cancellation friction, and more.

**Pros** - User-friendly clauses that work in your favor.

**Watch Outs** - Things that aren't necessarily bad but you should be aware of.

**Plain English Summary** - A 3-4 sentence summary at an 8th grade reading level.

**Receipts** - Direct quotes from the policy with section references.

**Reputation Snapshot** - Trustpilot rating and BBB grade for the company.

### How it works
1. Visit any website
2. PlainTerms highlights detected policy links with a shield badge
3. Click the badge or use the popup to open the Side Panel
4. Watch the AI analysis stream in real-time

### Privacy
- Policy text is extracted in your browser
- PII is automatically redacted before any text leaves your browser
- We do not store your browsing history
- Analysis results are cached for performance but not linked to your identity

### Pricing
- **Free**: 5 quick AI analyses per day + unlimited heuristic scans
- **Pro ($9.99/month)**: 20 quick analyses per day + 50 deep multi-agent analyses per month
- **Enterprise**: Contact sales for unlimited access

## Category
Productivity

## Language
English

## Permission Justifications

### <all_urls>
Required to detect privacy policy and terms of service links on any website the user visits. The content script scans page links for legal document patterns. No data is collected from pages without user action.

### sidePanel
Used to display the policy analysis results in Chrome's Side Panel UI.

### storage
Used to cache analysis results locally and store user preferences (enabled/disabled, tier info).

### contextMenus
Provides a right-click "Analyze this page's policies" option for convenience.

### activeTab
Used to get the current tab's URL and communicate with the content script when the user initiates an analysis.

## Privacy Policy URL
https://plainterms.com/privacy (to be created)

## Screenshots needed
1. Side panel showing a full analysis with risk score, red flags, and summary
2. Content script highlighting policy links on a website
3. Popup showing detected links and quick actions
4. Dark mode side panel view
