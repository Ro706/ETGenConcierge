# ET Concierge — Your Personal Guide to Everything ET

AI-powered financial concierge for the Economic Times ecosystem. Personalized news, live markets, and smart financial guidance — all in one place.

## Tech Stack

- **Frontend Framework:** React 18 + TypeScript + Vite
- **UI Library:** shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Authentication:** Supabase Auth
- **AI Engine:** Google Gemini API (`gemini-1.5-flash`)
- **Data Sources:** TheNewsAPI, Twelve Data, Currency API, CoinGecko
- **State Management:** React Context (Auth) + localStorage (user profile, chat history, API keys)
- **Routing:** React Router v6 with protected routes

---

## Implemented Features

### 🔐 Authentication (Supabase)
- **Login** — Email/password sign-in with error handling and toast notifications
- **Sign Up** — New account creation with display name and email confirmation
- **Forgot Password** — Password reset email via Supabase, with redirect link
- **Reset Password** — Dedicated page to set a new password after email verification
- **Protected Routes** — Dashboard access requires authentication; unauthenticated users are redirected to `/auth`
- **Auth State Listener** — Real-time session tracking via `onAuthStateChange`

---

### 🏠 Landing Page
- Animated hero section with gradient CTA button
- Auto-cycling keyword carousel (News, Markets, Finance, Events, Investments, Tax Planning)
- Feature pills highlighting core capabilities
- Radial gradient background effects and smooth CSS animations (`fadeIn`, `slideUp`)

---

### 🤖 AI-Driven Onboarding Chat
- **Multi-step conversational flow** — 6 questions covering:
  - User type (Student, Professional, Business Owner, Investor, Retiree)
  - Financial goals (Save Taxes, Grow Wealth, Buy a Home, etc.)
  - Current investment level
  - Sectors of interest
  - Risk appetite (Conservative / Moderate / Aggressive)
  - Specific financial concerns (free-text)
- **Quick-reply buttons** for multiple-choice steps; free-text input for open questions
- **AI Profile Generation** — Sends onboarding answers to Gemini to generate a personalized summary, persona label, and recommendations
- **Graceful fallback** — Generates a profile locally if the Gemini API is unavailable
- **Loading overlay** with spinner animation during profile creation

---

### 📊 Personalized Dashboard
- **Profile Card** — Displays user name, persona badge (e.g., "Growth Investor"), risk indicator with color-coded dot, financial goals as tags, and an AI-generated summary. Includes "Retake Profile" option.

- **Live Market Snapshot** — Displays 4 market cards:
  - RELIANCE (NSE) — via Twelve Data API
  - TCS (NSE) — via Twelve Data API
  - USD/INR — via Currency API
  - BTC/INR — via CoinGecko API
  - Refresh button to re-fetch live data
  - Skeleton loading states while fetching
  - Falls back to mock/sample data with a "Sample" badge when APIs are unavailable

- **Personalized News Feed** — Fetches 6 articles from TheNewsAPI filtered by user's sector interests. Gemini generates "Why this matters to you" relevance notes for each headline. Falls back to mock ET news with "Sample" badge.

- **AI Financial Guide (Chat)** — Full chat interface powered by Gemini with:
  - System prompt aware of user's profile for personalized responses
  - Quick-action chips: "What ET products suit me?", "Review my investment approach", "Find relevant ET events", "Suggest financial services"
  - Persistent chat history (saved to localStorage)
  - Typing indicator during AI response generation
  - Markdown-like formatting (bold, italic, line breaks)

---

### 🏦 Financial Services Marketplace
- Displays 6 financial products: Home Loan, Personal Loan, Term Insurance, Health Insurance, Credit Card, Mutual Fund SIP
- **Personalized recommendations** — Services matching user's financial goals are marked with a "Recommended for you" badge
- **Per-service AI Advisor Chat** — Opens a modal chat where Gemini acts as an expert advisor for the selected service, aware of the user's financial profile

---

### 📅 Events & Conferences
- Displays curated ET events (ET Markets Masterclass, ET Wealth Summit, ET Startup Awards, ET CFO Conclave)
- **Personalized event recommendations** — Events matching user's sector interests are highlighted with a "Recommended for you" badge
- **Register Interest** button with toast notification confirmation

---

### ⚙️ Settings & API Key Management
- Modal to manage API keys: Gemini, TheNewsAPI, Twelve Data
- Keys stored locally in-browser (localStorage) — never sent to any server
- Links to obtain free API keys for each service
- **Clear Profile** option to reset all data and restart onboarding
- **API key warning banner** — Persistent banner displayed when any API key is missing, with shortcut to open Settings

---

### 🎨 UI / UX
- **Dark theme** with ET brand identity (`#FF6B35` accent, `#0A1628` background)
- **Typography** — Playfair Display for headings, DM Sans for body text (Google Fonts)
- **Responsive design** — Grid layouts adapt for desktop and mobile
- **Mobile bottom navigation** — Appears on screens ≤768px with Dashboard, Services, Events, and Settings tabs
- **Hover effects & micro-animations** — Card lift on hover, fade-in/slide transitions, spinning loader
- **Skeleton loading states** — Placeholder shimmer animations while data loads
- **Toast notifications** — Auto-dismissing toast messages for user feedback

---

### 🔄 State Persistence
- API keys persisted in `localStorage` (`et_keys`)
- User profile persisted in `localStorage` (`et_profile`)
- AI chat history persisted in `localStorage` (`et_chat`)
- Environment variables (`.env`) auto-merge into localStorage on first load — keys from `.env` fill in any missing keys without overwriting user-set values

---

### ⚡ Error Handling & Graceful Degradation
- All API calls wrapped in try/catch with fallback to mock data
- Market data uses `Promise.allSettled` — partial API failures don't break the dashboard
- "Sample" badges clearly distinguish mock data from live data
- AI features degrade gracefully with helpful error messages when Gemini key is missing

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env   # Then fill in your API keys

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_GEMINI_KEY` | Google Gemini API key |
| `VITE_NEWS_KEY` | TheNewsAPI key |
| `VITE_TWELVE_DATA_KEY` | Twelve Data API key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
