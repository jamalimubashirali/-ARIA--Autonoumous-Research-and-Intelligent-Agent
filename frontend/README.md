# ARIA — Frontend

> Next.js 16 frontend for the Autonomous Research & Intelligence Agent platform.

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4, `tw-animate-css` |
| **Component Library** | shadcn/ui (Radix UI primitives) |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Payments** | Stripe (server-side checkout) |
| **Animations** | Framer Motion, GSAP (`@gsap/react`) |
| **3D Graphics** | Three.js (landing page background) |
| **Markdown Rendering** | `react-markdown` + `remark-gfm` |
| **Theming** | `next-themes` (dark/light mode) |
| **Smooth Scrolling** | Lenis |
| **Icons** | Lucide React |

## Project Structure

```
frontend/
├── next.config.ts                 Next.js configuration
├── package.json                   Dependencies & scripts
├── postcss.config.mjs             PostCSS (Tailwind)
├── tsconfig.json                  TypeScript configuration
├── components.json                shadcn/ui configuration
├── public/                        Static assets (SVGs, images)
└── src/
    ├── middleware.ts               Clerk auth route protection
    ├── app/
    │   ├── layout.tsx              Root layout (providers, fonts)
    │   ├── page.tsx                Landing page
    │   ├── globals.css             Global styles
    │   ├── dashboard/
    │   │   ├── page.tsx            Dashboard home
    │   │   ├── layout.tsx          Dashboard layout (sidebar)
    │   │   ├── history/            Report history view
    │   │   ├── reports/            Individual report view
    │   │   └── settings/           User settings & plan management
    │   ├── research/
    │   │   └── page.tsx            Research interface (query input + SSE results)
    │   ├── shared/                 Public shared report viewer (no auth)
    │   ├── sign-in/                Clerk sign-in page
    │   └── sign-up/                Clerk sign-up page
    ├── components/
    │   ├── landing/
    │   │   ├── HeroSection.tsx         Animated hero with CTA
    │   │   ├── FeaturesSection.tsx      Feature cards grid
    │   │   ├── HowItWorksSection.tsx    Pipeline visualization
    │   │   ├── PricingSection.tsx       Stripe pricing tiers
    │   │   ├── TestimonialsSection.tsx   Social proof carousel
    │   │   ├── Footer.tsx               Site footer
    │   │   ├── Navbar.tsx               Navigation bar
    │   │   ├── ThreeBackground.tsx      Three.js animated background
    │   │   ├── MouseGlow.tsx            Cursor glow effect
    │   │   └── ScrollProgress.tsx       Scroll progress indicator
    │   ├── ui/                     shadcn/ui components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── select.tsx
    │   │   ├── textarea.tsx
    │   │   ├── glass-action-button.tsx    Glassmorphism button
    │   │   ├── liquid-background.tsx      Liquid animation background
    │   │   ├── shimmer-skeleton.tsx       Loading skeleton with shimmer
    │   │   └── animated-counter.tsx       Animated number counter
    │   ├── AppHeader.tsx            Dashboard header
    │   ├── AppSidebar.tsx           Dashboard sidebar navigation
    │   ├── notion-markdown.tsx      Notion-styled Markdown renderer
    │   ├── theme-provider.tsx       Dark/light theme context
    │   ├── theme-toggle.tsx         Theme switch component
    │   ├── clerk-provider-wrapper.tsx  Clerk provider setup
    │   └── providers/               Context providers
    └── lib/                         Utility functions
```

## Key Features

### Authentication
- Clerk-powered sign-in/sign-up with route protection via `middleware.ts`
- Public routes: `/`, `/sign-in`, `/sign-up`, `/shared/*`
- All other routes require authentication

### Research Interface
- Natural-language query input with domain selection
- Optional focus prompt for targeted research
- Real-time SSE streaming — shows progress as each agent node completes
- Rendered Markdown output with Notion-style formatting

### Dashboard
- **History** — Browse, search, and manage past reports
- **Reports** — Full report view with export and sharing controls
- **Settings** — User profile, plan info, and usage statistics

### Landing Page
- Three.js animated particle background
- GSAP + Framer Motion scroll-driven animations
- Lenis smooth scrolling
- Mouse glow cursor effect
- Feature cards, pipeline diagram, pricing tiers, and testimonials

### Billing
- Stripe Checkout integration for subscription management
- Tiered pricing: Free (3 reports/mo) / Starter (50) / Pro (unlimited) / Enterprise (unlimited)

## Getting Started

### Prerequisites

- Node.js 20+
- A running ARIA backend instance

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `http://localhost:8000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |

### Development

```bash
npm run dev         # Starts on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```
