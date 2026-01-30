# Turno

A modern shift scheduling application for team management built with React and Tailwind CSS.

## Overview

Turno is a Single Page Application (SPA) designed to help manage work shifts for a team of 8 members. It automatically generates fair and balanced schedules while respecting a comprehensive set of scheduling rules and constraints.

## Features

- **Automatic Schedule Generation** - Generate yearly schedules with a single click
- **Multiple View Modes** - Week, Month, Quarter, and Year views
- **Smart Constraint System** - Enforces fairness rules for shift distribution
- **Manual Editing** - Modify individual shifts with violation warnings
- **Company Closures** - Mark holidays and closure days
- **PDF Export** - Download schedules as PDF documents
- **Statistics Dashboard** - Track shift distribution across team members
- **Responsive Design** - Works on desktop and mobile devices

## Scheduling Rules

### Special Shifts (8:00-17:00 and 12:00-21:00)
- Only one person per special shift type per day
- Maximum one early shift (8-17) and one late shift (12-21) per person per week
- Consecutive special shifts: Early shift (Tue-Thu) requires late shift the next day
- Monday late shift requires Friday early shift for the same person

### Weekend Shifts
- Weekend shifts are assigned in pairs (same 2 people work Saturday and Sunday)
- Weekend workers cannot work Thursday or Friday of the same week
- Weekend workers cannot have special shifts during the same week
- Fair rotation ensures everyone gets weekend duty before repeating

### General Rules
- No double assignments (one shift per person per day)
- Equal distribution of all shift types across team members

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Vitest** - Testing framework
- **jsPDF** - PDF generation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/turno.git
cd turno
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
VITE_ADMIN_USERNAME=your_username
VITE_ADMIN_PASSWORD_HASH=your_sha256_hash
```

Generate a password hash:
```bash
echo -n "your_password" | shasum -a 256 | cut -d' ' -f1
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser at `http://localhost:5173`

## Authentication

The app requires authentication to access. Credentials are configured via environment variables:

- `VITE_ADMIN_USERNAME` - The admin username
- `VITE_ADMIN_PASSWORD_HASH` - SHA-256 hash of the password

**Security Note:** This is a frontend-only authentication that protects against casual access. For production environments requiring higher security, consider using Vercel Password Protection (Pro plan) or a dedicated auth service like Auth0.

## Deployment on Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables in Project Settings:
   - `VITE_ADMIN_USERNAME`
   - `VITE_ADMIN_PASSWORD_HASH`
4. Deploy

Vercel will automatically detect Vite and configure the build settings.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.jsx       # App header with controls
│   ├── WeekView.jsx     # Weekly calendar view
│   ├── MonthView.jsx    # Monthly calendar view
│   ├── QuarterView.jsx  # Quarterly calendar view
│   ├── YearView.jsx     # Yearly calendar view
│   ├── TeamSidebar.jsx  # Team members panel
│   ├── DateNavigator.jsx # Date navigation controls
│   ├── StatsPanel.jsx   # Statistics modal
│   ├── RulesModal.jsx   # Scheduling rules modal
│   ├── ClosuresModal.jsx # Company closures modal
│   ├── EditDayModal.jsx # Day editing modal
│   └── ...
├── hooks/
│   └── useSchedule.js   # Schedule state management
├── utils/
│   ├── shiftGenerator.js      # Schedule generation algorithm
│   ├── constraintValidator.js # Constraint validation
│   ├── dateUtils.js           # Date utilities
│   ├── constants.js           # App constants
│   └── pdfExport.js           # PDF export functionality
├── App.jsx              # Main application component
└── main.jsx             # Application entry point
```

## Testing

The project includes comprehensive tests for the scheduling algorithm and constraint validation:

```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
