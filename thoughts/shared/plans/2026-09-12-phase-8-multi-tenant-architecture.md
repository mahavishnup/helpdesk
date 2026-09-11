# Phase 8 — Multi-Tenant Architecture (Shared Database) & Tenant Access Restrictions Implementation Plan

> **Status**: 🟢 **COMPLETED**

## Overview

Transition the Support Ticket Management System into a full **shared-database multi-tenant architecture** scoped by `Team` (`{current_team}` route prefix, `current_team_id`, and `EnsureTeamMembership` middleware). 

Enforce strict tenant data boundaries: tickets belong to a specific team, users can only access tickets within their active team, metrics are isolated per tenant, and cross-tenant tampering is forbidden with HTTP 403.

---

## Current State Analysis

- The application uses `Team` as the tenant model:
  - `routes/web.php`: `Route::prefix('{current_team}')->middleware(['auth', 'verified', EnsureTeamMembership::class])` scopes `dashboard`.
  - `EnsureTeamMembership`: Automatically validates that the authenticated user belongs to `{current_team}`, switches the user's active team, and aborts with 403 if unauthorized.
  - `User::switchTeam()`: Sets URL default `current_team => $team->slug`.
  - `TeamSwitcher` in UI: Allows users to switch organizations seamlessly.
- Tickets are currently global at `/tickets` without `team_id` or tenant access restrictions.

---

## Desired End State

1. **Database Schema**:
   - `tickets` table has `team_id` foreign key referencing `teams.id` with `cascadeOnDelete()`.
   - Composite index `(team_id, status, priority, created_at)` and `(team_id, created_at)`.
2. **Model & DTOs**:
   - `Ticket` model has `team(): BelongsTo<Team, $this>` and `scopeForTeam()`.
   - `Team` model has `tickets(): HasMany<Ticket, $this>`.
   - `CreateTicketData` contains `public int $teamId`.
3. **Service Layer**:
   - `TicketService` methods (`listTickets`, `createTicket`, `exportCsv`, `getDashboardMetrics`) are strictly scoped by tenant (`team_id`).
4. **Routing & Access Restrictions**:
   - Ticket routes are mounted inside `Route::prefix('{current_team}')` with `EnsureTeamMembership`.
   - `TicketController` enforces `$ticket->team_id === $team->id`, aborting with HTTP 403 on cross-tenant attempts.
   - Root `/tickets` redirects to `/{current_team}/tickets`.
5. **Frontend & Wayfinder**:
   - All ticket links, forms, and CSV export triggers provide `{current_team}`.
   - The team switcher switches tenant tickets seamlessly.
6. **Testing**:
   - All ticket feature tests pass with tenant routing.
   - Dedicated multi-tenant isolation tests verify that users cannot view, edit, or delete tickets belonging to other teams.

---

## Implementation Plan

### 1. Database & Domain Models
- Modify `database/migrations/2026_09_12_000001_create_tickets_table.php` to add `team_id`.
- Update `app/Models/Ticket.php`, `app/Models/Team.php`, and `app/Data/CreateTicketData.php`.

### 2. Service & Controller
- Update `app/Services/TicketService.php` with tenant scoping.
- Update `app/Http/Controllers/TicketController.php` and `DashboardController.php` with tenant resolution and 403 cross-tenant checks.

### 3. Routes & Frontend
- Update `routes/web.php` to prefix `{current_team}`.
- Update `app-sidebar.tsx`, ticket pages, and components with Wayfinder route helpers.
- Run `npm run build`.

### 4. Factories, Seeders & Tests
- Update `TicketFactory.php` and `TicketSeeder.php`.
- Refresh database: `php artisan migrate:fresh --seed`.
- Update feature tests in `tests/Feature/Tickets/` and add tenant isolation assertions.
- Run `composer run ci:check`.
