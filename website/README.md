# HardSecNet — Public Marketing Site

The public marketing site for **HardSecNet**, a continuous security-hardening
and compliance platform. Built with React + Vite + TypeScript + Tailwind CSS v4
and Motion. Static output — no server, no backend dependencies.

> The product itself lives in a separate private repository. This repo is
> **marketing only** — safe to share with designers or deploy publicly.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build (static output in `dist/`):

```bash
npm run build
npm run preview
```

## Deploy (Vercel / Netlify)

The build is fully static — connect this repo and use the defaults:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- No environment variables required.

## Structure

```
src/
  App.tsx                  section order + providers
  index.css                design tokens (black/white system) + shared styles
  context/ThemeContext     dark / light toggle (persisted)
  hooks/                   useLocalStorage, useInView
  data/                    typed sample data (dashboard, pricing) — swap for API later
  components/
    layout/                Navbar, Footer, Section
    ui/                    Logo
    sections/              Hero, Bento, HowItWorks, DashboardPreview,
                           SecurityTrust, Pricing, About, Contact
    dashboard/             TrendChart (hand-rolled SVG), ActivityFeed, FindingsTable
```

## Design system

Monochrome by design: a black/white neutral canvas with the *ink* colour as the
single interactive accent. Status colours stay semantic — green (compliant),
amber (drift), red (critical). Display face is Fraunces (serif), body Inter,
data JetBrains Mono. All tokens live in `src/index.css`.

## Notes

- The demo form logs its payload to the console — search `TODO: wire to backend`
  in `src/components/sections/Contact.tsx` to attach a real endpoint.
- No fabricated logos, testimonials, or customer counts anywhere. Industry
  figures are labelled illustrative; roadmap features are marked "coming soon".
