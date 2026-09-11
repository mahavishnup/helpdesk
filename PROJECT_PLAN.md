# Master Project Plan — Support Ticket Management System

This document provides a comprehensive, phase-by-phase implementation blueprint for the **Support Ticket Management System** assessment.

The project is divided into **7 sequential phases** specifically structured for **manual developer review, local testing, and conventional git commits**.

---

## 1. System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │              Inertia.js React Frontend                 │
               │        (TypeScript, Tailwind v4, Radix UI)             │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTP / JSON Props
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │             Laravel Web Routing & Auth                 │
               │           (routes/web.php, Fortify Auth)               │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                     Form Requests                      │
               │   • StoreTicketRequest (urgent due_at validation)      │
               │   • UpdateTicketRequest (immutable closed guard)       │
               │   • UpdateTicketStatusRequest (transition machine)     │
               └───────────────────────────┬────────────────────────────┘
                                           │ Validated Data
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 HTTP TicketController                  │
               │             (Thin coordinator / Responses)             │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                 Domain TicketService                   │
               │   • Business rules & state transition validation       │
               │   • Audit activity logging & internal staff notes      │
               │   • Dashboard KPI aggregation & Streamed CSV export    │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │             Eloquent Models & Backed Enums             │
               │   • Ticket (Casts, Scopes, SLA Health Accessors)       │
               │   • TicketActivity (Audit history & staff notes)       │
               │   • TicketStatus & TicketPriority Backed Enums         │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                     MySQL Database                     │
               │   • Composite indexed tables, soft deletes             │
               └────────────────────────────────────────────────────────┘
```

---

## 2. High-Impact Innovations (Within Scope)

1. **Automated SLA Health & Breach Engine**:
   - Leverages the mandatory `due_at` rule on urgent tickets.
   - Computes real-time status: `On Track`, `Due Soon < 4h`, `SLA Breached`.
   - Adds single-click SLA filtering on the index view.
2. **Ticket Activity Audit Trail & Internal Staff Notes**:
   - Eliminates guesswork by logging every lifecycle transition (`status_changed`, `created`).
   - Allows support staff to collaborate with private `internal_note` comments.
3. **Streamed CSV Export**:
   - Streams filtered ticket queries directly to CSV using Laravel `StreamedResponse` (zero third-party dependencies, zero memory bloat).

---

## 3. Phase-by-Phase Roadmap

Each phase has a dedicated, complete implementation plan in `thoughts/shared/plans/`:

### Phase 0: Baseline Starter Kit 🟢 `[COMPLETED]`
- **Plan**: Starter kit baseline
- **Objective**: Establish clean Laravel 13 + React/TS starter kit baseline.
- **Git Commit**: (`Initial commit: Laravel 13 with React TypeScript Starter Kit`).
- **Status**: 91 passing tests (`composer run test`).

---

### Phase 1: Database Architecture, Enums & Domain Models 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-1-database-and-domain.md](thoughts/shared/plans/2026-09-12-phase-1-database-and-domain.md)
- **Objective**: Implement core data layer with typed backed enums, indexes, models, and realistic seeders.
- **Files**:
  - `app/Enums/TicketStatus.php`: Backed enum with state transition logic.
  - `app/Enums/TicketPriority.php`: Backed enum with `requiresDueDate()`.
  - `database/migrations/2026_09_12_000001_create_tickets_table.php`: Ticket schema with composite indexes and soft deletes.
  - `database/migrations/2026_09_12_000002_create_ticket_activities_table.php`: Audit trail schema.
  - `app/Models/Ticket.php`: Eloquent model with SLA accessors, scopes, and relations.
  - `app/Models/TicketActivity.php`: Activity tracking model.
  - `database/factories/TicketFactory.php`: Factory with status, priority, and SLA states.
  - `database/seeders/TicketSeeder.php`: Seeds 10 tickets and 24 activities.
- **Verification Commands**:
  ```bash
  php artisan migrate:fresh --seed
  composer run lint:check
  composer run test
  ```

---

### Phase 2: Service Layer & Business Logic 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-2-service-layer-and-validation.md](thoughts/shared/plans/2026-09-12-phase-2-service-layer-and-validation.md)
- **Objective**: Encapsulate all business rules, status machine logic, and validation outside controllers.
- **Files**:
  - `app/Services/TicketService.php`: Creation, status transition engine, internal note logging, soft deletion, and CSV export.
  - `app/Http/Requests/Tickets/StoreTicketRequest.php`: Validates input, conditionally enforces `due_at` on urgent tickets.
  - `app/Http/Requests/Tickets/UpdateTicketRequest.php`: Validates updates, prevents editing closed tickets.
  - `app/Http/Requests/Tickets/UpdateTicketStatusRequest.php`: Validates state transition validity.
  - `app/Http/Requests/Tickets/StoreTicketNoteRequest.php`: Validates staff internal note text.
- **Verification Commands**:
  ```bash
  composer run lint
  composer run types:check
  composer run test
  ```

---

### Phase 3: HTTP Controllers, Routing & Dashboard Integration 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-3-controller-and-routes.md](thoughts/shared/plans/2026-09-12-phase-3-controller-and-routes.md)
- **Objective**: Wire up thin controller, route definitions, and dashboard KPI aggregation.
- **Files**:
  - `app/Http/Controllers/TicketController.php`: Thin resource controller handling Inertia responses.
  - `routes/web.php`: Authenticated route resource + status & note endpoints.
  - Update `app/Http/Controllers/DashboardController.php` with ticket KPI counts.
  - Update `resources/js/components/app-sidebar.tsx` with Ticket navigation item.
- **Verification Commands**:
  ```bash
  php artisan route:list --path=tickets
  composer run lint:check
  composer run test
  ```

---

### Phase 4: Frontend Ticket List & Filtering UI 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-4-frontend-ticket-list.md](thoughts/shared/plans/2026-09-12-phase-4-frontend-ticket-list.md)
- **Objective**: Build responsive ticket table with debounced search, status/priority/SLA filters, and pagination.
- **Files**:
  - `resources/js/types/tickets.ts`: TypeScript contracts.
  - `resources/js/components/tickets/ticket-status-badge.tsx`: Status pill badge.
  - `resources/js/components/tickets/ticket-priority-badge.tsx`: Priority pill badge.
  - `resources/js/components/tickets/ticket-sla-badge.tsx`: SLA health chip.
  - `resources/js/components/tickets/ticket-filter-bar.tsx`: Debounced search, dropdowns, CSV export.
  - `resources/js/components/tickets/pagination.tsx`: Accessible pagination navigation.
  - `resources/js/pages/tickets/index.tsx`: Responsive ticket list view.
- **Verification Commands**:
  ```bash
  npm run types:check
  npm run build
  ```

---

### Phase 5: Ticket Details, Forms & Activity Timeline 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-5-details-forms-and-timeline.md](thoughts/shared/plans/2026-09-12-phase-5-details-forms-and-timeline.md)
- **Objective**: Implement ticket creation, editing with closed-ticket warning, detail view with timeline, and dashboard KPI cards.
- **Files**:
  - `resources/js/pages/tickets/create.tsx`: Accessible form with urgent `due_at` live indicator.
  - `resources/js/pages/tickets/edit.tsx`: Edit form with closed-state guard.
  - `resources/js/pages/tickets/show.tsx`: Detail view with transition buttons & activity timeline.
  - `resources/js/pages/dashboard.tsx`: KPI cards with single-click deep-link filtering.
- **Verification Commands**:
  ```bash
  npm run types:check
  npm run build
  ```

---

### Phase 6: Automated Pest Feature Test Suite 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-6-automated-test-suite.md](thoughts/shared/plans/2026-09-12-phase-6-automated-test-suite.md)
- **Objective**: Validate all business rules, edge cases, state transitions, and authorization via Pest.
- **Files**:
  - `tests/Feature/Tickets/TicketCreationTest.php`
  - `tests/Feature/Tickets/TicketListingTest.php`
  - `tests/Feature/Tickets/TicketStatusTransitionTest.php`
  - `tests/Feature/Tickets/TicketActivityTest.php`
  - `tests/Feature/Tickets/TicketDeletionTest.php`
- **Verification Commands**:
  ```bash
  php artisan test --filter=Ticket
  composer run test
  ```

---

### Phase 7: Final Code Quality, Production Build & Documentation 🟢 `[COMPLETED]`
- **Detailed Plan**: [2026-09-12-phase-7-polish-and-submission.md](thoughts/shared/plans/2026-09-12-phase-7-polish-and-submission.md)
- **Objective**: Complete documentation, format code, and verify production build.
- **Files**:
  - `README.md`: Complete system overview, architecture, and verification guide.
- **Verification Commands**:
  ```bash
  composer run ci:check
  npm run build
  ```
