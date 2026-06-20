<div align="center">

# 🎓 Gmitrzak English Academy — Frontend

### Angular 19 client for a production-grade EdTech SaaS platform

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-19-06B6D4)](https://primeng.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📖 What is this?

This is the client application for **Gmitrzak English Academy**, a role-isolated SaaS platform that runs a real, operating language school — replacing spreadsheets and manual tracking with dedicated **Student** and **Admin** experiences for curriculum management, lesson delivery, spaced-repetition vocabulary training, AI-assisted writing/pronunciation feedback, and gamified progress tracking.

It's not a tutorial CRUD UI. It's a 75-component, two-audience application built to support real day-to-day teaching workflows, talking to a [.NET 8 backend](https://github.com/albertgmi/Gmitrzak-English-Academy) over a REST API.

> Built and maintained solo, end-to-end — from UI architecture to deployment

## 🧱 Architecture

```
src/app/
├── auth/                 # Login, register, password reset, email verification
├── curriculum/           # Programs → Courses → Modules → Matrix (admin content authoring)
├── lesson/                # Live lesson tooling: attendance, grading, examination mode, homework checks
├── student-view/          # Student-facing experience: flashcards, vocabulary, pronunciation, assignments, stats
├── vocabulary/             # Global vocabulary bank management
├── stocksAndSets/          # Sentence stock & exercise set composition tools
├── admin-tools/            # Announcements, internal messaging
├── other/                  # Dashboard, ranking, theater (media), credits/shop
├── user/                   # Profile, user CRUD, registration
├── services/                # ~25 injectable services — one per domain, talking to the API
├── shared/
│   ├── guards/               # Route-level auth guard
│   └── interceptors/         # JWT attachment + global error handling
└── layout/                   # App shell (PrimeNG Sakai-based layout)
```

**Key architectural decisions:**

- **Standalone Components throughout** — the vast majority of the ~75 components are standalone, avoiding the NgModule sprawl that usually comes with an app this size.
- **Angular Signals for local state** — `signal()` / `computed()` drive reactive UI state (e.g. recording status, expanded panels, derived filtered lists) instead of manual subscription bookkeeping.
- **Functional HTTP interceptors** — a JWT interceptor attaches the bearer token to every request and redirects to `/login` on a 401; a separate error interceptor centralizes API error toasts via PrimeNG's `MessageService`, so individual components don't each implement their own error handling.
- **Domain-first folder structure** — code is organized by business domain (`curriculum`, `lesson`, `student-view`...) rather than by technical type, so a feature's components/services/models live together.
- **One route guard, consistently applied** — `AuthGuard` protects every authenticated route; role-specific UI (Admin vs. Student) is driven from the same decoded JWT via `jwt-decode`.

## ✨ Standout features

**🎙️ Native in-browser audio recording for pronunciation practice** — uses the raw `MediaRecorder` + `getUserMedia` Web APIs (no third-party recording library) to capture a student's voice as a `webm` blob and stream it straight to the backend's AI scoring endpoint, with signal-driven recording/loading state for instant UI feedback.

**🔊 Native Text-to-Speech** — flashcards, sentence drills, and pronunciation practice use the browser's built-in `SpeechSynthesisUtterance` API for instant audio playback of target words/sentences, with zero external TTS service cost.

**🎬 YouTube-integrated media player** — the "Theater" module embeds YouTube content directly into the learning flow via `@angular/youtube-player`, supporting Picture-in-Picture playback so students can keep working while video plays.

**📈 Rich data visualization** — student progress, grades, and activity stats are rendered with Chart.js across multiple dashboards (lesson stats, last-week summary, ranking).

**✍️ Rich-text essay editor** — Quill (via `ngx-quill`) powers the essay-writing module that feeds into the backend's AI grading pipeline.

**🎉 Gamified feedback loops** — `canvas-confetti` celebrates milestones (streaks, completed assignments) to reinforce the credits/ranking/shop gamification system the backend exposes.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 19 (Standalone Components, Signals) |
| **Language** | TypeScript 5.7 |
| **UI Library** | PrimeNG 19 + PrimeNG Themes |
| **Styling** | Tailwind CSS, SCSS |
| **State** | Angular Signals (local), RxJS (HTTP streams) |
| **Charts** | Chart.js |
| **Rich text** | Quill / ngx-quill |
| **Media** | `@angular/youtube-player`, native MediaRecorder, native SpeechSynthesis |
| **Auth** | JWT (`jwt-decode`), functional HTTP interceptors |
| **Effects** | canvas-confetti |
| **Tooling** | Angular CLI, ESLint, Karma/Jasmine |
| **Deployment** | Vercel |

## 📐 By the numbers

- **75** components across 2 role-isolated experiences (Student / Admin)
- **~25** dedicated, domain-scoped Angular services
- **~44k** lines of TypeScript/HTML/SCSS
- **3** browser-native media APIs integrated directly (MediaRecorder, SpeechSynthesis, YouTube Player)

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS) & npm
- The [backend API](https://github.com/albertgmi/Gmitrzak-English-Academy) running locally or accessible remotely

### Setup

```bash
git clone https://github.com/albertgmi/Gmitrzak-English-Academy-Frontend.git
cd Gmitrzak-English-Academy-Frontend
npm install
```

### Configuration

Point the app at your backend by editing the API URL in:

```
src/environments/environment.ts          # development
src/environments/environment.prod.ts     # production build
```

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000' // your backend URL
};
```

### Run locally

```bash
npm start
```

This runs `ng serve` with the configured proxy (`proxy.conf.json`), available at `http://localhost:4200`.

### Build for production

```bash
npm run build
```

Build artifacts are output to `dist/`.
