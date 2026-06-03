# CLMS - Computer Lab Management System

A full-stack web application for managing computer labs, workstations, and reservations. Built for SE113 - Group 10.

## Tech Stack

| Layer    | Technologies                                                                 |
| -------- | ---------------------------------------------------------------------------- |
| Frontend | React 18, Vite, TailwindCSS, Zustand, React Router 6                         |
| Backend  | Node.js, Express, Prisma ORM, MySQL                                          |
| Auth     | JWT (access + refresh via httpOnly cookie), bcryptjs, OTP email verification |
| Docs     | Swagger UI (OpenAPI 3)                                                       |

## Installation Guide

### Prerequisites

- Node.js (LTS recommended)
- npm
- MySQL

### Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Update `.env` with your DB credentials, JWT secrets, and email settings. The backend initializes the database using `Backend/sql/schema.sql` and `Backend/sql/seed.sql` on startup and skips seeding if data already exists. Default API base URL: http://localhost:5000

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Default frontend URL: http://localhost:3000 (proxies `/api` to port 5000).

### Optional Tests

- Backend: `npm test`
- Frontend E2E: `npm run cypress:open` or `npm run cypress:run`

## Features

- Registration, login, email OTP verification, password reset
- Browse and reserve lab rooms or workstations by time slot
- Approval queue for staff/admin to accept or reject requests
- Incident reporting and ticket management
- User management (block/unblock accounts)
- Usage statistics and reports (admin)
- Role-based access: customer, lab_staff, system_admin

## Project Structure

```
├── Backend/
│   ├── .env.example
│   ├── openapi.yaml
│   ├── package.json
│   ├── __tests__/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── sql/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
├── Frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── cypress.config.json
│   ├── cypress/
│   │   ├── e2e/
│   │   └── support/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── layout/
│       │   └── ui/
│       ├── pages/
│       │   ├── auth/
│       │   ├── incidents/
│       │   ├── labrooms/
│       │   ├── reservations/
│       │   ├── workstations/
│       │   └── admin/
│       ├── services/
│       ├── store/
│       └── lib/
├── CLMS_TestCases_Detailed.md
└── README.md
```

## API Docs

Start the backend, then visit: http://localhost:5000/api/docs

## License

MIT
