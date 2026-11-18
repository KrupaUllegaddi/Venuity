# 🏛️ Venuity - Campus Venue Management & Booking System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Venuity** is a modern, enterprise-grade campus venue reservation and scheduling platform designed for universities and academic institutions. It simplifies facility discovery, eliminates booking overlaps through database-level constraints, and provides a multi-tier approval workflow for faculty, department heads, and campus administration.

---

## ✨ Features

- 🏢 **Campus Facility Catalog**: Explore auditoriums, seminar halls, conference rooms, and exhibition galleries with capacity, audio/visual specifications, facility tags, and photo galleries.
- 📅 **Interactive Calendar & Availability**: Real-time calendar views powered by FullCalendar, allowing users to inspect booked slots, ongoing events, and available windows.
- 🛡️ **Conflict-Free Reservation Engine**: PostgreSQL exclusion constraints and lifecycle functions prevent accidental double-bookings and time overlaps at the database layer.
- 👥 **Role-Based Access Control (RBAC)**:
  - **Admin**: Full authority over venue provisioning, facility management, system settings, and institutional approvals.
  - **HOD (Head of Department)**: Departmental review, request verification, and endorsement.
  - **Faculty**: Request venues for academic lectures, workshops, guest lectures, and student events.
- ⚡ **Realtime Updates & Notifications**: Live in-app notifications and status updates via Supabase Realtime channels.
- 📱 **QR Code Integration**: On-demand QR code generation for quick venue check-in and details verification on mobile devices.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **UI Components**: Radix / Base UI primitives, [Sonner](https://sonner.emilkowal.ski/) notifications
- **Calendar**: [FullCalendar](https://fullcalendar.io/) (DayGrid, TimeGrid, Interaction)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime, Supabase Auth)
- **Validation**: [Zod](https://zod.dev/) & React Hook Form

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** (v20+ recommended)
- **npm** or **pnpm**
- **Supabase CLI** (optional, for local development) or a Supabase cloud project

### 2. Clone Repository

```bash
git clone https://github.com/KrupaUllegaddi/Venuity.git
cd Venuity
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Database Setup (Supabase)

If developing locally using the Supabase CLI:

```bash
# Start Supabase local instance
npx supabase start

# Apply database migrations
npx supabase migration up

# Seed initial departments, venues, and demo accounts
npx supabase db reset
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo & Test Credentials

The system comes pre-provisioned with role-based accounts for development and testing:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Rajanna R C | `rajanna.r.c@venuity.local` | `Venuity#Rajanna2026` |
| **Admin** | Placement Admin | `Placement@sjbit.edu.in` | `Venuity#Placement2026` |
| **HOD** | Dr. Krishna A N | `krishna.a.n@venuity.local` | `Venuity#Krishna2026` |
| **Faculty** | Dr. Naveena C | `naveena.c@venuity.local` | `Venuity#Naveena2026` |
| **Faculty** | Dr. Bindiya M K | `bindiya.m.k@venuity.local` | `Venuity#Bindiya2026` |
| **Faculty** | Dr. Ajay B N | `ajay.b.n@venuity.local` | `Venuity#Ajay2026` |

> *Note: All 45 pre-provisioned faculty accounts follow the password scheme `Venuity#<FirstName>2026`.*

---

## 📁 Project Structure

```text
Venuity/
├── public/                 # Static assets (images, venue photos, SVG icons)
├── scripts/                # E2E and adversarial security testing scripts
├── src/
│   ├── app/
│   │   ├── admin/          # Admin portal (venue management, requests, users, settings)
│   │   ├── calendar/       # Interactive campus calendar view
│   │   ├── dashboard/      # User booking dashboard and request management
│   │   ├── login/          # Authentication portal (Email & OAuth)
│   │   ├── venues/         # Public venue directory and detail pages
│   │   └── ...
│   ├── components/         # Shared UI components, navigation, modals, and bell notifications
│   └── lib/                # Supabase server/client utilities and helper functions
├── supabase/
│   ├── migrations/         # SQL schema definitions, triggers, and RLS policies
│   └── seed.sql            # Seed data for venues, facilities, and initial accounts
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
