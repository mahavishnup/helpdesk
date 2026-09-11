# Phase 2 — Service Layer, Transition Engine & Form Requests Implementation Plan

> **Status**: 🟢 **COMPLETED** (Verified via Form Requests, TicketService, Pint, PHPStan Level 7, and Pest)

## Overview

Implement the core business logic layer and HTTP request validation for the Support Ticket Management System. This encapsulates the state machine transition rules, real-time SLA metrics, activity audit logging, streamed CSV export, and input validation outside the HTTP controllers.

---

## Current State Analysis

- Phase 1 completed: `tickets` and `ticket_activities` tables migrated, `TicketStatus` and `TicketPriority` enums ready.
- `Ticket` model provides query scopes (`search`, `filterStatus`, `filterPriority`, `filterSla`) and accessors (`sla_status`, `can_be_edited`).
- Request classes directory `app/Http/Requests/Tickets/` needs to be created.

### Key Discoveries:
- `app/Enums/TicketStatus.php:L26` — `canTransitionTo()` enforces allowed state transitions.
- `app/Enums/TicketPriority.php:L28` — `requiresDueDate()` returns true for `Urgent` priority.
- `app/Models/Ticket.php:L142` — `getCanBeEditedAttribute()` returns false when status is `Closed`.

---

## Desired End State

After completing Phase 2:
- `app/Services/TicketService.php` is implemented:
  - `createTicket(array $data, User $creator): Ticket` — creates ticket and logs initial activity.
  - `updateTicket(Ticket $ticket, array $data, User $user): Ticket` — updates ticket, rejects edits if status is `Closed`.
  - `updateStatus(Ticket $ticket, TicketStatus $newStatus, User $user, ?string $comment = null): Ticket` — verifies transition with `canTransitionTo()`, throws `ValidationException` on illegal moves, logs activity.
  - `addInternalNote(Ticket $ticket, User $user, string $content): TicketActivity` — attaches private staff note.
  - `deleteTicket(Ticket $ticket, User $user): bool` — soft-deletes ticket.
  - `getDashboardMetrics(): array` — aggregates ticket counts (Total, Open, In Progress, Urgent, Resolved, Closed, Breached).
  - `exportCsv(Builder $query): StreamedResponse` — streams filtered tickets directly to CSV.
- Form Requests:
  - `StoreTicketRequest`: validates title, description, customer_name, customer_email, priority, conditionally requires `due_at` when `priority = 'urgent'`.
  - `UpdateTicketRequest`: validates fields, forbids updating closed tickets.
  - `UpdateTicketStatusRequest`: validates target status against `TicketStatus` enum and transition validity.
  - `StoreTicketNoteRequest`: validates staff note content.
- Static analysis & tests pass: `composer run types:check` and `composer run test`.

---

## What We're NOT Doing

- No React UI pages in this phase (built in Phases 4 & 5).
- No routing in this phase (registered in Phase 3).
- No external notification queues or email listeners.

---

## Implementation Approach

1. Form Requests (`StoreTicketRequest`, `UpdateTicketRequest`, `UpdateTicketStatusRequest`, `StoreTicketNoteRequest`)
2. Domain Service (`TicketService`)
3. Unit verification of service methods and business rules

---

## Changes Required:

### 1. Form Requests

#### A. StoreTicketRequest
**File**: `app/Http/Requests/Tickets/StoreTicketRequest.php`  
**Changes**: Validates incoming ticket data and conditionally enforces `due_at` when `priority === 'urgent'`.

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'description' => ['required', 'string'],
        'priority' => ['required', new Enum(TicketPriority::class)],
        'customer_name' => ['required', 'string', 'max:255'],
        'customer_email' => ['required', 'string', 'email', 'max:255'],
        'due_at' => [
            'nullable',
            'date',
            Rule::requiredIf(fn () => $this->input('priority') === TicketPriority::Urgent->value),
        ],
    ];
}
```

#### B. UpdateTicketRequest
**File**: `app/Http/Requests/Tickets/UpdateTicketRequest.php`  
**Changes**: Validates updates and authorizes only if ticket is not closed.

#### C. UpdateTicketStatusRequest
**File**: `app/Http/Requests/Tickets/UpdateTicketStatusRequest.php`  
**Changes**: Validates requested status and validates transition using `TicketStatus::canTransitionTo()`.

#### D. StoreTicketNoteRequest
**File**: `app/Http/Requests/Tickets/StoreTicketNoteRequest.php`  
**Changes**: Validates staff internal note text (`required`, `string`, `max:2000`).

---

### 2. Service Layer

**File**: `app/Services/TicketService.php`  
**Changes**: Encapsulates domain logic, transition validation, activity logging, dashboard metrics, and CSV streaming.

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TicketService
{
    public function createTicket(array $data, User $creator): Ticket;
    public function updateTicket(Ticket $ticket, array $data, User $user): Ticket;
    public function updateStatus(Ticket $ticket, TicketStatus $newStatus, User $user, ?string $comment = null): Ticket;
    public function addInternalNote(Ticket $ticket, User $user, string $content): TicketActivity;
    public function deleteTicket(Ticket $ticket, User $user): bool;
    public function getDashboardMetrics(): array;
    public function exportCsv(Builder $query): StreamedResponse;
}
```

---

## Success Criteria:

### Automated Verification:
- [x] Code formatting clean: `composer run lint:check`
- [x] Static analysis passes level 7: `composer run types:check`
- [x] Complete test suite passes: `composer run test`

### Manual Verification:
- [x] Verify `StoreTicketRequest` rejects urgent ticket when `due_at` is missing.
- [x] Verify `UpdateTicketStatusRequest` rejects invalid transitions (e.g. `open` -> `closed`).
- [x] Verify `TicketService::updateStatus` records an audit row in `ticket_activities`.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 3.

## Testing Strategy

### Unit Tests:
- `TicketService::createTicket()` correctly persists ticket record and writes initial audit activity.
- `TicketService::updateStatus()` throws `ValidationException` when attempting illegal transitions (e.g. `open` -> `closed`).
- `TicketService::updateTicket()` throws `ValidationException` when attempting to edit a `closed` ticket.
- `StoreTicketRequest` validation rules trigger 422 if `priority = 'urgent'` and `due_at` is omitted.
- `StoreTicketNoteRequest` enforces max length (2,000 characters) and required string.

### Integration Tests:
- Database transaction rollback in `TicketService::updateStatus()` if activity logging fails.
- Streamed CSV export writes proper RFC 4180 headers and rows.
- Metrics calculation accuracy (`getDashboardMetrics()`) matching real-time database counts.

### Manual Testing Steps:
1. Run `composer run types:check` to confirm PHPStan level 7 passes across all request and service classes.
2. Run `composer run lint:check` to confirm code style adherence.
3. Verify `TicketService` methods via `php artisan tinker`.

---

## Performance Considerations

- **Database Transactions**: All state transitions and creation events wrap ticket updates and activity logs within `DB::transaction()` to ensure atomicity without lock contention.
- **Memory-Efficient CSV Streaming**: `exportCsv()` leverages Symfony `StreamedResponse` and cursor-based processing instead of loading all tickets into PHP memory, supporting exports of tens of thousands of records without OOM.
- **Cached/Optimized Metric Aggregations**: `getDashboardMetrics()` uses conditional SQL aggregations (`COUNT(CASE WHEN ... THEN 1 END)`) in a single query rather than firing 7 separate count queries.

---

## References

- Implementation Agent: `.claude/agents/create-plan.md`
- Master Plan: `PROJECT_PLAN.md`
- Database Architecture: `DATABASE_ARCHITECTURE.md`
