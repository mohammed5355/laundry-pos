# Laundry POS System - Project Instructions

## Project Overview
Web-based Laundry & Dry Cleaning Management System with full Arabic RTL (Right-to-Left) support.

## Tech Stack
- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: IndexedDB via Dexie.js (local-first storage)
- **Language**: Arabic with Cairo font

## Git Workflow - MANDATORY

### IMPORTANT: Always Commit and Push Changes

As you work on this project, you MUST:

1. **Commit regularly** after completing meaningful changes
2. **Push to GitHub** immediately after committing
3. **Use clean, descriptive commit messages**

#### Commit Message Format

Use conventional commit format:
```
<type>: <subject>

<body>
```

Types to use:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring without changing functionality
- `style` - Code style changes (formatting, etc.)
- `docs` - Documentation changes
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

#### Examples of Good Commit Messages

```
feat: add customer search functionality in orders page

- Add search input field by customer name
- Filter orders table in real-time
- Add loading state for search
```

```
fix: resolve duplicate order items bug

- Fix issue where same item could be added twice
- Add validation to prevent duplicate entries
- Update total calculation logic
```

```
refactor: extract database queries to separate service layer

- Move all db queries from components to lib/services
- Improve code organization and testability
- Add error handling wrapper
```

### When to Commit

Commit after:
- Completing a feature
- Fixing a bug
- Refactoring code
- Updating documentation
- Any meaningful change to functionality

### Workflow Checklist

1. Make changes to code
2. Stage files: `git add .`
3. Commit with clean message: `git commit -m "type: description"`
4. Push to GitHub: `git push`

## GitHub Repository

- **URL**: https://github.com/mohammed5355/laundry-pos
- **Branch**: `main`

## Development

```bash
# Install dependencies
bun install

# Run dev server on port 3001
bun run dev -- -p 3001

# Build for production
bun run build

# Start production server
bun run start
```

## Project Structure

```
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout with RTL
│   ├── page.tsx      # Main application
│   └── globals.css   # Global styles
├── lib/              # Utilities and database
│   └── db.ts         # Dexie.js database setup
├── types/            # TypeScript type definitions
│   └── index.ts      # App types
├── components/       # React components
└── public/           # Static assets
```

## Key Features

1. **Order Management (POS)**
   - Customer details input
   - Item selection with quantities
   - Automatic pricing
   - Pickup date selection

2. **Status Tracking**
   - Received → Processing → Ready → Delivered
   - Visual status indicators
   - Status filtering

3. **Settings**
   - Manage service prices
   - Backup/Restore (JSON export/import)

4. **Reports**
   - Daily revenue summary
   - Order statistics
   - Status distribution

5. **Printable Documents**
   - Customer receipts
   - Clothes tags

## Theme

- **Colors**: White, Sky Blue, Light Grey
- **Font**: Cairo (Arabic)
- **Direction**: RTL
