# Kinetiq App (Frontend)

Frontend for Kinetiq built with Next.js.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Zustand (state management)
- Tailwind CSS + custom styling

## First-Time Setup (After Clone)

### 1) Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Running backend API (`kinetiq-api`)

### 2) Install dependencies

From the `kinetiq-app` folder:

```bash
npm install
```

### 3) Create environment file

Create a `.env.local` file in `kinetiq-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

If your API runs on a different host/port, update this value.

### 4) Run the frontend

```bash
npm run dev
```

Open: [http://localhost:3001](http://localhost:3001)

If port `3001` is busy, Next.js may choose another port automatically and print it in the terminal.

## Recommended Full Local Run (Frontend + API)

From the repo root (`Kinetiq`), first run:

```bash
npm run setup
```

Then use two terminals:

Terminal 1 (API):

```bash
cd kinetiq-api
npm install
npm run start:dev
```

Terminal 2 (App):

```bash
cd kinetiq-app
npm install
npm run dev
```

## Data Source Of Truth

Templates and seeded starter data are now API-driven from database records.

- `GET /api/v1/templates`
- `GET /api/v1/templates/:id`
- `GET /api/v1/templates/recommended`

Frontend template flows (`/templates`, `/mesocycles`, `/mesocycles/new`) should not use hardcoded catalogs.

## Remaining Static UI Candidates (Future Refactor)

These still contain presentation-only static placeholders and can be migrated later:

- dashboard insight mock cards and chart sample values
- onboarding option labels/descriptions
- notifications type label/description maps

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```
