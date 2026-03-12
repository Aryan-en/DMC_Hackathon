<div align="center">

<br/>

```
  ██████╗ ███╗   ██╗████████╗ ██████╗ ██████╗  █████╗
 ██╔═══██╗████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗
 ██║   ██║██╔██╗ ██║   ██║   ██║   ██║██████╔╝███████║
 ██║   ██║██║╚██╗██║   ██║   ██║   ██║██╔══██╗██╔══██║
 ╚██████╔╝██║ ╚████║   ██║   ╚██████╔╝██║  ██║██║  ██║
  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

### **Global Intelligence & Ontology Analysis Platform**

*CLASSIFICATION: TOP SECRET // SCI // ORCON // NOFORN*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br/>

</div>

---

## Overview

**Ontora** is a production-grade, government-level intelligence command dashboard built for the **Global Ontology Engine** — a platform designed to monitor geopolitical threat vectors, process multilingual knowledge graphs, and deliver real-time predictive analysis across 216 nations.

The frontend is engineered to the standards of a classified intelligence operations centre: precision typography, deliberate information hierarchy, muted yet authoritative colour language, and a layout optimised for sustained high-density data consumption under operational conditions.

> **Design Philosophy:** _Classified Luxury_ — obsidian foundations, warm gold accents, hair-thin precision borders. Every pixel serves a purpose.

---

## Feature Modules

### `/` — Strategic Overview
The command centre. Real-time system health, global region risk matrix with colour-coded threat levels, live alert feed, entity ingestion metrics, sentiment trend analysis, and a full operations log feed.

### `/intelligence` — AI Intelligence Hub
Monitoring dashboard for the inference layer — LLaMA-3 NER pipeline throughput, multilingual document processing rates, model confidence distributions, and entity extraction breakdowns by category.

### `/knowledge-graph` — Knowledge Graph Explorer
Visual ontology browser for navigating entity relationships, triple stores, and semantic links. Displays SHACL validation status, graph traversal depth metrics, and relationship type distributions.

### `/geospatial` — Geospatial Intelligence
PostGIS-backed coordinate mapping for 2.1M+ data points. Satellite coverage overlays, conflict zone polygons, chokepoint monitoring, and country-level risk heat mapping.

### `/predictions` — Predictions Engine
PyG-powered conflict risk forecasting. Displays region-level probability distributions, confidence intervals, time-series trend projections, and model drift indicators.

### `/data-streams` — Data Streams Monitor
Kafka consumer lag monitoring, per-partition throughput analytics, ingestion pipeline health, and real-time event rate dashboards. Covers OSINT, signals, and financial data feeds.

### `/data-lake` — Data Lake Operations
Delta Lake checkpoint status, bronze/silver/gold medallion layer metrics, 847GB+ commit tracking, schema evolution monitoring, and storage tier utilisation.

### `/security` — Security & Governance
Zero-trust architecture status, access control audit logs, clearance tier management, anomaly detection alerts, and inter-agency data sharing governance.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [Next.js](https://nextjs.org) — App Router | 16.1.6 |
| UI Library | [React](https://react.dev) | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + inline precision styles | ^4.0 |
| Charts | [Recharts](https://recharts.org) — Area, Bar, Line, Radar, Composed | ^3.8 |
| Icons | [Lucide React](https://lucide.dev) | ^0.577 |
| Fonts | Geist Sans + Geist Mono — via `next/font` | — |
| Linting | ESLint + `eslint-config-next` | ^9 |
| Build | Turbopack (via `next dev`) | — |

---

## Design System

Ontora uses a custom design token system defined in `app/globals.css`.

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `--accent-gold` | `#c8a84a` | Primary accent — active states, highlights, live clock |
| `--accent-gold-light` | `#e8c97d` | Hover states, shimmer gradients |
| `--accent-steel` | `#5b8db8` | Medium-priority data, secondary chart series |
| `--accent-emerald` | `#3eb87a` | Online status, low risk, positive delta |
| `--accent-crimson` | `#b84a4a` | Critical alerts, high-risk threat indicators |
| `--accent-amber` | `#c8822a` | High-severity alerts, warning states |
| `--accent-lavender` | `#8a78c8` | Cyber domain, AI/ML pipeline indicators |
| `--background` | `#030810` | Page background — deep obsidian |
| `--card-bg` | `#0a1525` | Card surface |
| `--border-color` | `rgba(200,168,74,0.1)` | Gold-tinted hairline borders |

### Typography Hierarchy

```
Primary   #dce4ee  — headings, metric values, critical labels
Secondary #7a8fa8  — supporting labels, sub-headers
Muted     #3a4e62  — metadata, timestamps, auxiliary text
Dim       #1e2e3e  — footer notes, decorative elements
```

### Reusable Components

| Component | File | Description |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | Fixed 256px navigation with grouped items, gold active pill indicator, system status |
| `TopBar` | `components/TopBar.tsx` | Page header with live monospace clock, breadcrumb trail, search, and user avatar |
| `StatCard` | `components/StatCard.tsx` | KPI metric card with top-edge gold shimmer, gradient icon box, and trend indicator |
| `AlertFeed` | `components/AlertFeed.tsx` | Scrollable live alert list with muted severity colour coding |
| `Charts` | `components/Charts.tsx` | Recharts wrappers — `GlobalRiskChart`, `EntityBarChart`, `SentimentChart`, `ThroughputChart` |

---

## Project Structure

```
ontora/
├── app/
│   ├── globals.css              # Design system — tokens, animations, utility classes
│   ├── layout.tsx               # Root layout with Sidebar + font loading
│   ├── page.tsx                 # / — Strategic Overview
│   ├── intelligence/
│   │   └── page.tsx             # /intelligence — AI pipeline monitoring
│   ├── knowledge-graph/
│   │   └── page.tsx             # /knowledge-graph — Ontology explorer
│   ├── geospatial/
│   │   └── page.tsx             # /geospatial — Geospatial threat mapping
│   ├── predictions/
│   │   └── page.tsx             # /predictions — ML forecasting engine
│   ├── data-streams/
│   │   └── page.tsx             # /data-streams — Kafka pipeline metrics
│   ├── data-lake/
│   │   └── page.tsx             # /data-lake — Delta Lake operations
│   └── security/
│       └── page.tsx             # /security — Zero-trust governance
├── components/
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── TopBar.tsx               # Page header bar
│   ├── StatCard.tsx             # KPI metric card
│   ├── AlertFeed.tsx            # Live alert list
│   └── Charts.tsx               # Recharts chart suite
├── public/                      # Static assets
├── next.config.ts               # Next.js configuration
├── postcss.config.mjs           # Tailwind CSS v4 PostCSS plugin
└── tsconfig.json                # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18.x or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ontora

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The application hot-reloads on every file save via Turbopack HMR.

### Production Build

```bash
# Build optimised production bundle
npm run build

# Serve the production build
npm start
```

### Linting

```bash
npm run lint
```

---

## Page Reference

| Route | Module | Classification |
|---|---|---|
| `/` | Strategic Overview | TS/SCI |
| `/intelligence` | AI Intelligence Hub | TS/SCI |
| `/knowledge-graph` | Knowledge Graph Explorer | SECRET |
| `/geospatial` | Geospatial Intelligence | TS/SCI |
| `/predictions` | Predictions Engine | SECRET |
| `/data-streams` | Data Streams Monitor | CONFIDENTIAL |
| `/data-lake` | Data Lake Operations | CONFIDENTIAL |
| `/security` | Security & Governance | TS/SCI |

---

## Architecture Notes

- **App Router** — All pages use Next.js App Router. Interactive components declare `'use client'` at the file level.
- **Frontend only** — All data is static/mock. No backend, no API routes. Purpose-built for demonstration and hackathon presentation.
- **CSS strategy** — Tailwind CSS v4 utility classes handle layout and spacing; inline `style` props are used for sub-pixel precision colour, shadow, and gradient control where Tailwind is insufficient.
- **Chart system** — All Recharts components are centralised in `components/Charts.tsx` with a shared dark tooltip style (`rgba(8,16,30,0.97)` background, gold border) and a unified colour palette.
- **Font loading** — `next/font` loads Geist Sans and Geist Mono at build time, eliminating layout shift.
- **Build tooling** — Turbopack powers the dev server for near-instant HMR on large component trees.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/module-name`
3. Commit with conventional commits: `git commit -m 'feat: add new intelligence module'`
4. Push: `git push origin feature/module-name`
5. Open a Pull Request

---

<div align="center">

<br/>

**ONTORA** — Global Intelligence & Ontology Analysis Platform

*Built for the DMC Hackathon · March 2026*

<br/>

</div>
