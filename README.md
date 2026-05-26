# MockMaster - Advanced Mock Test Engine

A production-ready, real-time online mock test platform built for exam preparation. Features a professional exam interface with timer, auto-save, analytics, and more.

## Features

- **Real-time Countdown Timer** - Accurate per-second countdown with auto-submit on timeout
- **Auto-Save Answers** - Every answer is saved to the server in real-time
- **Resume Unfinished Tests** - Continue where you left off, even after closing the browser
- **Question Palette** - Visual overview of all questions with status indicators
- **Mark for Review** - Flag questions to revisit before submitting
- **Previous/Next Navigation** - Quick sequential navigation between questions
- **Section-based Navigation** - Jump to any question via the palette
- **Auto Submit on Timeout** - Automatically submits when time expires
- **Fullscreen Exam Mode** - Immersive distraction-free exam experience
- **Tab Switch Detection** - Monitors and records tab/window switches
- **Randomized Questions** - Questions are shuffled for each attempt
- **Topic-wise Scoring** - Breakdown of performance by topic
- **Performance Analytics** - Charts, trends, and progress tracking
- **Weak Topic Analysis** - Identifies areas needing improvement
- **Detailed Answer Explanations** - Learn from mistakes with explanations
- **Retake Test** - Start fresh attempts anytime
- **Mobile Responsive** - Full exam experience on any device

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Icons | Lucide React |

## Project Structure

```
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand state management
│   │   ├── lib/            # API client & utilities
│   │   └── App.jsx         # Root component with routing
│   └── ...
├── server/                  # Express Backend
│   ├── src/
│   │   ├── models/         # Mongoose schemas
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error handling
│   │   ├── seeders/        # Database seed data
│   │   └── index.js        # Server entry point
│   └── ...
└── package.json            # Root workspace scripts
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
# Edit server/.env with your MongoDB URI

# 3. Seed the database with sample data
cd server && npm run seed

# 4. Start development servers (from root)
cd .. && npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Tests & Chapters
- `GET /api/tests/chapters` - List all chapters
- `GET /api/tests/chapters/:id` - Get chapter topics & tests
- `GET /api/tests/:id` - Get test details

### Test Attempts
- `POST /api/attempts/start/:testId` - Start/resume a test
- `PUT /api/attempts/:id/answer` - Save an answer (real-time)
- `PUT /api/attempts/:id/progress` - Update progress (timer, position)
- `POST /api/attempts/:id/submit` - Submit test
- `GET /api/attempts/:id/result` - Get detailed result
- `GET /api/attempts/incomplete` - Get incomplete attempts
- `GET /api/attempts/my-attempts` - Get all user attempts

### Analytics
- `GET /api/analytics/overall` - Overall performance summary
- `GET /api/analytics/topics` - Topic-wise analysis
- `GET /api/analytics/chapters` - Chapter-wise performance

## Architecture Decisions

- **Zustand** over Redux for simpler, faster state management with minimal boilerplate
- **Real-time auto-save** using fire-and-forget API calls that don't block the UI
- **Server-side randomization** ensures consistent question order per attempt
- **Mongoose indexes** on frequently queried fields for optimal database performance
- **Rate limiting** and Helmet for production security
