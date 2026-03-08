# Debt Freedom Planner

A personal credit card debt tracking app built to help you visualize, plan, and execute your journey to zero balance. Track real monthly statements, project payoff timelines, and simulate different payment strategies.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL + Prisma 5
- **Auth**: NextAuth v5 (credentials)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod v4
- **Icons**: Lucide React
- **Runtime**: Bun

## Features

### Dashboard
- Total debt overview across all credit cards
- Projected total interest and debt freedom timeline
- Stacked area chart showing combined debt burndown
- Quick-access cards with payoff estimates

### Card Detail & Settings
- Per-card balance, target payment, interest rate, and computation method
- Mini balance trend sparkline
- Delete cards you no longer need

### Interactive Ledger (Projection)
- Month-by-month projection of how your debt decreases
- Customize any future month's **payment amount** or **new purchases**
- Changes auto-save to the database on blur
- Reset all overrides with one click
- Shows the exact month you become debt-free

### Record Monthly Statement (Real Data)
- Log your actual credit card bill each month
- Fields: previous balance, payments, purchases, interest, fees, ending balance, minimum due
- Track payment status (paid/pending)
- Card balance auto-updates when you save a statement
- Full statement history table with color-coded status

### Projection Engine
Two bank-specific interest computation methods:

| Method | Formula | Used By |
|--------|---------|---------|
| **BPI** | `dailyRate = (monthlyRate × 12) / 360` | BPI Credit Cards |
| **STANDARD** | `dailyRate = monthlyRate / 30` | Security Bank, most others |

Interest is calculated in two phases:
1. **Before payment** (21 days): full balance × daily rate × 21
2. **After payment** (9 days): remaining balance × daily rate × 9

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) v1.3+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL and AUTH_SECRET

# Push schema to database
bun run db:push

# Generate Prisma client
bun run db:generate

# Seed with initial data (BPI + Security Bank cards)
bun run db:seed

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:seed` | Seed database with initial data |
| `bun run db:studio` | Open Prisma Studio |

## Database Schema

```
users
  └── credit_cards
        ├── monthly_statements
        │     └── transactions
        └── monthly_overrides
```

- **users** — Auth accounts
- **credit_cards** — Card details, balance, interest rate, computation method
- **monthly_statements** — Actual bill records logged each month
- **transactions** — Individual transactions per statement
- **monthly_overrides** — Custom payment/purchase overrides for the projection ledger

## Monthly Workflow

1. Receive your credit card statement (PDF/email)
2. Open the card → **Record Monthly Statement**
3. Enter: previous balance, payments, purchases, interest, ending balance
4. After paying → update **Amount Paid** and check **Mark as Paid**
5. Use the **Interactive Ledger** to plan next month's strategy

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── cards/[id]/page.tsx         # Card detail + ledger
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth route
│       └── register/               # Registration endpoint
├── components/
│   ├── auth/login-form.tsx
│   ├── dashboard/
│   │   ├── app-header.tsx
│   │   ├── dashboard-view.tsx
│   │   └── add-card-dialog.tsx
│   └── cards/
│       ├── card-detail-view.tsx
│       ├── statement-history.tsx
│       └── record-statement-dialog.tsx
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── db.ts                       # Prisma client singleton
│   ├── actions.ts                  # Server Actions (CRUD)
│   ├── projection-engine.ts        # Debt projection algorithm
│   └── utils.ts                    # cn(), formatCurrency()
└── schemas/
    ├── auth.ts                     # Login/register validation
    └── card.ts                     # Card/statement/override validation
```
