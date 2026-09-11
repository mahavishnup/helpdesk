# Support Ticket Management System

[![Tests](https://img.shields.io/badge/tests-91%20passed-brightgreen.svg)](tests/)
[![Laravel](https://img.shields.io/badge/Laravel-13.17-FF2D20.svg?logo=laravel)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4.svg?logo=php)](https://php.net)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-3.0-9553E9.svg)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)

A small, production-minded **Support Ticket Management System** built with **Laravel 13 (PHP 8.4)**, **Inertia.js v3**, **React 19**, and **TypeScript**.

Focused on maintainable software design, robust state transition enforcement, and production engineering practices.

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features & Business Rules](#-key-features--business-rules)
- [High-Impact Innovations](#-high-impact-innovations)
- [Technology Stack](#-technology-stack)
- [Requirements & Prerequisites](#-requirements--prerequisites)
- [Quick Setup & Installation](#-quick-setup--installation)
- [Running the Application](#-running-the-application)
- [Running Automated Tests](#-running-automated-tests)
- [Code Quality & Linting Shortcuts](#-code-quality--linting-shortcuts)
- [Architectural Decisions & Rationale](#-architectural-decisions--rationale)
- [Assumptions Made](#-assumptions-made)
- [Limitations & Future Improvements](#-limitations--future-improvements)
- [AI Tool Usage & Engineering Ownership](#-ai-tool-usage--engineering-ownership)
- [Submission Reference](#-submission-reference)

---

## 🏢 About the Project

This system allows support staff to track customer issues through their complete operational lifecycle. Designed with production sensibilities, it features server-side search and filtering, bounded pagination, strict state transition validation, real-time SLA breach detection, activity audit logging, and automated feature test coverage.

---

## ⚡ Key Features & Business Rules

### 1. Ticket Lifecycle State Machine
Tickets follow a strict transition workflow to prevent invalid operational states:
- **`Open`** $\rightarrow$ `In Progress`, `Resolved`
- **`In Progress`** $\rightarrow$ `Open`, `Resolved`
- **`Resolved`** $\rightarrow$ `In Progress`, `Closed`
- **`Closed`** $\rightarrow$ **Terminal State** (immutable; cannot be edited or reopened)

### 2. Priority & Mandatory Due Dates
- Supported priorities: `Low`, `Medium`, `High`, `Urgent`.
- **Urgent Priority Rule**: When `priority = urgent`, a `due_at` timestamp is **mandatory**. Non-urgent tickets may omit this field.

### 3. Server-Side Filtering & Search
- Full-text search across `title`, `description`, `customer_name`, and `customer_email`.
- Multi-dimensional filtering by `status`, `priority`, and `SLA health`.
- Bounded server-side pagination to protect database performance.

---

## 💡 High-Impact Innovations

1. **Automated SLA Health & Breach Engine**:
   - Leverages the required `due_at` date to calculate real-time SLA badges:
     - 🔴 **`SLA Breached`**: Deadline has passed (`due_at < NOW()`).
     - 🟡 **`Due Soon`**: Approaching breach within 4 hours (`due_at <= NOW() + 4h`).
     - 🟢 **`On Track`**: Healthy buffer (`due_at > NOW() + 4h`).
   - Includes quick-filter presets on the dashboard and ticket list.
2. **Activity Audit Trail & Internal Staff Notes**:
   - Immutable audit timeline logging lifecycle transitions and author details.
   - Dedicated private staff notes form on the ticket detail page for internal collaboration.
3. **Streamed CSV Export**:
   - Native Laravel `StreamedResponse` streaming SQL cursor rows directly to CSV, bypassing memory limits without third-party dependencies.

---

## 🛠 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend** | Laravel Framework | 13.17 | Routing, Eloquent ORM, Service Layer, Form Requests |
| **Runtime** | PHP | 8.4+ | Strict typing, Backed Enums, Property Promotion |
| **Auth** | Laravel Fortify | 1.37 | Headless authentication engine |
| **Routing Types** | Laravel Wayfinder | 0.1 | Auto-generated TypeScript route actions |
| **Frontend** | React | 19.2 | Client SPA views |
| **SPA Glue** | Inertia.js | 3.0 | Modern monolith bridge |
| **Language** | TypeScript | 5.7 | Static type safety |
| **Styling** | Tailwind CSS | 4.0 | Responsive utility styling, dark/light theme |
| **Primitives** | Radix UI / Lucide | Latest | Accessible UI components and icons |
| **Database** | MySQL | 8.0+ | Relational data persistence with indexes |
| **Testing** | Pest PHP | 5.1 | Expressive automated feature tests |
| **Formatting** | Laravel Pint | 1.27 | PSR-12 strict code formatting |

---

## ⚙️ Requirements & Prerequisites

- **PHP**: `>= 8.4` (with PDO MySQL, OpenSSL, Mbstring, BCMath, Tokenizer)
- **Composer**: `>= 2.x`
- **Node.js**: `>= 20.x` & **npm**: `>= 10.x`
- **MySQL**: `>= 8.0` (or Laravel Herd with MySQL enabled)

---

## 🚀 Quick Setup & Installation

### 1. Clone & Configure
```bash
git clone <repository-url>
cd helpdesk
cp .env.example .env
php artisan key:generate
```

### 2. Configure Database in `.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=root
DB_PASSWORD=password
```

### 3. One-Command Setup Shortcut
Use the project's built-in composer shortcut:
```bash
composer run setup
```
Or manually run:
```bash
composer install
npm install
php artisan migrate:fresh --seed
npm run build
```

*Default Seeded Login Credentials:*
- **Email**: `test@example.com`
- **Password**: `password`

---

## 🏃 Running the Application

In terminal 1 (Laravel backend):
```bash
composer run dev
# Or: php artisan serve
```

In terminal 2 (Vite HMR):
```bash
npm run dev
```

Visit the application at `http://127.0.0.1:8000` (or `http://helpdesk.test` via Laravel Herd).

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
# Run ticket management feature tests
php artisan test --filter=Ticket

# Run full project test suite using composer shortcut
composer run test
```

---

## 🎨 Code Quality & Linting Shortcuts

This repository provides built-in composer and npm shortcuts:

```bash
# Run code formatting (Laravel Pint)
composer run lint

# Check formatting without fixing
composer run lint:check

# Run PHPStan & TypeScript type checking
composer run types:check
npm run types:check

# Run full automated CI check
composer run ci:check
```

---

## 🏛 Architectural Decisions & Rationale

1. **Thin Controllers & Dedicated Service Layer**: Controllers coordinate HTTP requests and responses; all business logic (transition validation, activity logging, SLA calculations) is isolated in `TicketService`.
2. **PHP Backed Enums**: `TicketStatus` and `TicketPriority` enforce valid values at compile time, eliminating magic strings.
3. **Form Request Validation**: Validation rules (e.g. urgent `due_at` requirement, closed ticket immutability) live in dedicated Request classes.
4. **Composite Database Indexing**: An index on `(status, priority, created_at)` accelerates multi-filter paginated queries.
5. **Soft Deletes**: Tickets use `SoftDeletes` to preserve audit records while removing them from active operational views.

---

## 📌 Assumptions Made

- **Support Role**: The system is designed for authenticated internal support staff.
- **Closed Tickets are Final**: Closed tickets represent completed workflows and cannot be reopened.
- **Creator Auditing**: Each ticket tracks `created_by` linking to the authenticated user.
- **Search Scope**: Search uses database indexing rather than third-party search engines like Elasticsearch.

---

## 🔮 Limitations & Future Improvements

Given the expected 2–3 hour scope, the following are intentionally omitted but planned for future iterations:
- Granular Role-Based Access Control (RBAC) / Permissions (e.g. Agent vs Lead vs Admin).
- Real-time WebSockets (e.g. Laravel Reverb) for live ticket board updates.
- File and screenshot attachments (S3/MinIO storage).
- Outbound customer email notifications via queued jobs.

---

## 🤖 AI Tool Usage & Engineering Ownership

AI tools (Claude / Cursor) were utilized as an engineering assistant for scaffolding, exploring implementation strategies, and identifying edge cases. 

Every line of code, migration, test assertion, and architectural decision was **reviewed, refactored, tested against local MySQL, and validated** to ensure full engineering ownership and adherence to enterprise Laravel standards.

---

## 📄 Standards & Architecture

Built with enterprise Laravel conventions, strict static analysis (PHPStan Level 7), clean service-layer design, and automated Pest feature test coverage.
