# Vikendly

A curated marketplace for renting weekend houses and vacation homes in Serbia, Croatia, Bosnia and Montenegro.

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS** with custom theme
- **next-intl** for Serbian (Latin) and English translations
- **react-day-picker** for date selection

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/              # Next.js app directory with pages
├── components/       # Reusable React components
├── lib/              # Utility functions and configurations
├── data/             # Mock data (to be replaced with database)
├── types/            # TypeScript type definitions
├── locales/          # Translation files (sr, en)
└── public/           # Static assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Deployment

This project is configured for deployment on Vercel.

## License

ISC
