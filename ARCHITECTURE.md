# Support Ticket Management — System Architecture

> A production-minded **Laravel 13 + Inertia.js v3 + React 19 + TypeScript** application designed for robust customer support lifecycle management, SLA monitoring, and automated feature verification.

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend Framework** | Laravel | 13.17 | Core web application framework, routing, Eloquent ORM. |
| **Runtime** | PHP | 8.4+ | Modern typing, backed enums, property promotion. |
| **Authentication** | Laravel Fortify | 1.37 | Headless authentication engine (SPA login, session guard). |
| **Type Generation** | Laravel Wayfinder | 0.1 | Generates typed TypeScript functions for backend routes. |
| **Frontend Framework** | React | 19.2 | Client-side reactive user interface. |
| **SPA Bridge** | Inertia.js | 3.0 | Modern monolith architecture connecting Laravel & React. |
| **Styling** | Tailwind CSS | 4.0 | Utility-first, responsive dark/light mode styling. |
| **UI Components** | Radix UI / Lucide | Latest | Accessible unstyled primitives and consistent iconography. |
| **Database** | MySQL | 8.0+ | Relational data persistence with foreign keys and composite indexes. |
| **Test Runner** | Pest PHP | 5.1 | Expressive automated feature and unit testing framework. |
| **Code Formatter** | Laravel Pint | 1.27 | PSR-12 code style enforcement. |

---

## 2. Layered Architecture Overview

The application adheres to a clean, decoupled layered architecture:

```text
               ┌────────────────────────────────────────────────────────┐
               │              Inertia.js React Frontend                 │
               │  (Pages: Index, Create, Edit, Show; Radix Components)   │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTP Requests / Props
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                  Routes & Middleware                   │
               │          (web.php, auth, verified, CSRF)               │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                     Form Requests                      │
               │   (StoreTicketRequest, UpdateTicketStatusRequest)       │
               │   • Input validation, boundary checks, business guards  │
               └───────────────────────────┬────────────────────────────┘
                                           │ Validated Data
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 HTTP TicketController                  │
               │   • Thin coordinator: routes input, returns responses  │
               └───────────────────────────┬────────────────────────────┘
                                           │ Calls domain actions
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 Domain TicketService                   │
               │   • Business logic encapsulation                       │
               │   • Status transition state machine validation         │
               │   • Audit activity logging & internal staff notes      │
               │   • Dashboard KPI aggregation & Streamed CSV export    │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 Eloquent Model & Enums                 │
               │   • Ticket (Casts, Query Scopes, SLA Accessors)        │
               │   • TicketActivity (Audit events & notes)              │
               │   • TicketStatus & TicketPriority Backed Enums         │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                     MySQL Database                     │
               │   • Indexed tables, foreign keys, soft-deletes         │
               └────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```text
app/
├── Enums/
│   ├── TicketPriority.php          # Backed enum (Low, Medium, High, Urgent)
│   └── TicketStatus.php            # Backed enum & state transition engine
│
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php # Dashboard metrics endpoint
│   │   └── TicketController.php    # Resource controller (thin)
│   │
│   └── Requests/
│       └── Tickets/
│           ├── StoreTicketNoteRequest.php   # Internal staff note validation
│           ├── StoreTicketRequest.php       # Creation validation (urgent due_at rule)
│           ├── UpdateTicketRequest.php      # Edit validation & closed guard
│           └── UpdateTicketStatusRequest.php# State machine transition validation
│
├── Models/
│   ├── Ticket.php                  # Primary model (scopes, accessors, relations)
│   ├── TicketActivity.php          # Audit trail and staff notes
│   └── User.php                    # Authenticatable support staff member
│
└── Services/
    └── TicketService.php           # Core domain logic & business rules

resources/js/
├── components/
│   └── tickets/
│       ├── pagination.tsx                   # Accessible Inertia pagination
│       ├── ticket-filter-bar.tsx            # Debounced search & filter bar
│       ├── ticket-priority-badge.tsx        # Styled priority chip
│       ├── ticket-sla-badge.tsx             # Dynamic SLA indicator chip
│       └── ticket-status-badge.tsx          # Styled status chip
│
├── pages/
│   ├── dashboard.tsx                        # KPI dashboard with one-click deep links
│   └── tickets/
│       ├── index.tsx                        # Responsive ticket list table/cards
│       ├── create.tsx                       # Accessible ticket creation form
│       ├── edit.tsx                         # Ticket edit with closed guard
│       └── show.tsx                         # Ticket details & activity timeline
│
└── types/
    └── tickets.ts                           # TypeScript interfaces & types
```

---

## 4. Status Transition Engine

The system strictly enforces valid operational workflows:

```text
      ┌──────────┐
      │   Open   ├─────────────────┐
      └────┬─────┘                 │
           │                       │
           ▼                       ▼
   ┌───────────────┐       ┌───────────────┐
   │  In Progress  ├──────►│   Resolved    │
   └───────▲───────┘       └───────┬───────┘
           │                       │
           │                       ▼
           │               ┌───────────────┐
           └───────────────┤    Closed     │  ◄── Terminal State
                           └───────────────┘      (Cannot be modified or reopened)
```

- **Open** can transition to **In Progress** or **Resolved**.
- **In Progress** can transition back to **Open** or advance to **Resolved**.
- **Resolved** can return to **In Progress** or be finalized to **Closed**.
- **Closed** is a terminal state. Once closed, tickets cannot be transitioned or modified.

---

## 5. Automated SLA Health System

Urgent tickets strictly require a `due_at` date. The system computes real-time SLA metrics:
- **`Breached`**: `due_at < NOW()` (High danger badge, requires escalation).
- **`Due Soon`**: `due_at` is within 4 hours from now (Pulsing amber warning badge).
- **`On Track`**: `due_at > 4 hours` from now.
- **`None`**: Non-urgent or already resolved/closed.

---

## 6. Testing Architecture

Tests are built with **Pest PHP 5.1** and focus on business-critical behavior:
- **Unit / Domain Tests**: State machine transitions and enum validation.
- **Feature Tests**:
  - `TicketCreationTest`: Creation flow, default status, validation, urgent `due_at` rule.
  - `TicketListingTest`: Search, filter combinations, bounded pagination, CSV export.
  - `TicketStatusTransitionTest`: Valid transitions, invalid transition rejections, closed ticket protection.
  - `TicketActivityTest`: Audit logging and staff note creation.
  - `TicketDeletionTest`: Soft delete functionality.
