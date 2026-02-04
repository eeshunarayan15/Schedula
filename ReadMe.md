# Hospital Management System

A Next.js application with TypeScript, ESLint, and Tailwind CSS.

## Project Structure

```
my-app/
├── .next/                  # Next.js build output
├── app/                    # App Router directory
│   └── api/
│       └── hello/         # API route
├── node_modules/          # Dependencies
├── public/                # Static assets
├── .gitignore            # Git ignore rules
├── eslint.config.mjs     # ESLint configuration
├── next-env.d.ts         # Next.js TypeScript declarations
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── pnpm-lock.yaml        # pnpm lockfile
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── postcss.config.mjs    # PostCSS configuration
├── README.md             # This file
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm package manager

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Hello API

**Endpoint:** `http://localhost:3000/api/hello`

This is a test API route that returns a simple response.

**Method:** GET

**Example Request:**
```bash
curl http://localhost:3000/api/hello
```

**Example Response:**
```json
{
  "message": "Hello from Next.js API!"
}
```

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check code quality

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Linting:** ESLint
- **Package Manager:** pnpm

## Development

The project uses the Next.js App Router, which provides:

- File-based routing in the `app/` directory
- Server Components by default
- Built-in API routes support
- Optimized performance and SEO

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

