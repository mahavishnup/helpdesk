# Phase 1 — Database Architecture, Enums & Domain Models Implementation Plan

## Overview

Establish the complete relational data layer for the Support Ticket Management System. This includes backed enums with state machine transition rules, indexed migrations supporting high-concurrency filtering and soft deletes, Eloquent models with real-time SLA accessors, realistic factories, and comprehensive seeders.

---

## Current State Analysis

- Base Laravel 13.17 application running on PHP 8.4 with Fortify authentication and `users` table (`database/migrations/0001_01_01_000000_create_users_table.php:L14`).
- MySQL connection verified (`DB_CONNECTION=mysql`, database `helpdesk`).
- Baseline test suite passing (`composer run test`: 91 tests, 327 assertions).

### Key Discoveries:
- `app/Models/User.php:L39` — Uses PHP 8 attributes `#[Fillable([...])]` and `#[Hidden([...])]`.
- `pint.json:L51` — Enforces `declare_strict_types`, `final_class`, and `strict_comparison`.
- `composer.json:L45-L70` — Built-in scripts: `composer run lint`, `composer run types:check`, `composer run test`.

---

## Desired End State

After completing Phase 1:
- `tickets` table is migrated with composite index `(status, priority, created_at)` and `deleted_at` timestamp.
- `ticket_activities` table is migrated with cascade deletion from `tickets` and author tracking.
- `TicketStatus` backed enum enforces state transitions: `open` -> `in_progress` / `resolved`, `resolved` -> `closed`.
- `TicketPriority` backed enum flags `Urgent` priority for mandatory `due_at` rule.
- `Ticket` and `TicketActivity` models provide scopes (`search`, `filterStatus`, `filterPriority`, `filterSla`) and dynamic accessors (`sla_status`, `can_be_edited`).
- `TicketFactory` and `TicketSeeder` seed realistic tickets with historical activity logs.
- Automated static analysis and tests pass cleanly: `composer run test`.

---

## What We're NOT Doing

- No HTTP routes or controllers (`routes/web.php` and `TicketController` are built in Phase 3).
- No Form Requests or Service classes (`StoreTicketRequest` and `TicketService` are built in Phase 2).
- No React UI pages or components (built in Phases 4 and 5).
- No file attachment or WebSocket infrastructure.

---

## Implementation Approach

Follow standard Laravel domain modeling:
1. Backed Enums (`TicketStatus`, `TicketPriority`)
2. Migrations (`tickets`, `ticket_activities`)
3. Models (`Ticket`, `TicketActivity`)
4. Factory (`TicketFactory`) & Seeder (`TicketSeeder`)

---

## Changes Required:

### 1. Backed Enums

**File**: `app/Enums/TicketStatus.php`  
**Changes**: Backed enum (`open`, `in_progress`, `resolved`, `closed`) with `canTransitionTo()`, `allowedTransitions()`, `isClosed()`, and badge colors.

```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Open => [self::InProgress, self::Resolved],
            self::InProgress => [self::Open, self::Resolved],
            self::Resolved => [self::InProgress, self::Closed],
            self::Closed => [],
        };
    }
}
```

**File**: `app/Enums/TicketPriority.php`  
**Changes**: Backed enum (`low`, `medium`, `high`, `urgent`) with `requiresDueDate()` indicator.

---

### 2. Database Migrations

**File**: `database/migrations/2026_09_12_000001_create_tickets_table.php`  
**Changes**: Defines table schema with foreign keys, composite index, and soft deletes.

```php
Schema::create('tickets', function (Blueprint $table): void {
    $table->id();
    $table->string('title');
    $table->text('description');
    $table->string('status')->default('open')->index();
    $table->string('priority')->default('medium')->index();
    $table->string('customer_name');
    $table->string('customer_email');
    $table->timestamp('due_at')->nullable()->index();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
    $table->index(['status', 'priority', 'created_at']);
});
```

**File**: `database/migrations/2026_09_12_000002_create_ticket_activities_table.php`  
**Changes**: Defines audit log and staff comments table schema.

---

### 3. Eloquent Models

**File**: `app/Models/Ticket.php`  
**Changes**: Primary model with casts, query scopes, and SLA accessors (`sla_status`, `can_be_edited`).

**File**: `app/Models/TicketActivity.php`  
**Changes**: Activity tracking model with `belongsTo(Ticket::class)` and `belongsTo(User::class)`.

---

### 4. Factories & Seeders

**File**: `database/factories/TicketFactory.php`  
**Changes**: Factory with states for `open()`, `inProgress()`, `resolved()`, `closed()`, `urgent()`, `overdue()`, and `dueSoon()`.

**File**: `database/seeders/TicketSeeder.php`  
**Changes**: Seeds 10 realistic support tickets with 24 historical activity logs.

---

## Success Criteria:

### Automated Verification:
- [x] Database migration and seeding executes cleanly: `php artisan migrate:fresh --seed`
- [x] Code style satisfies team Pint rules: `composer run lint:check`
- [x] Static analysis passes level 7: `composer run types:check`
- [x] Complete test suite passes: `composer run test`

### Manual Verification:
- [x] Check MySQL database tables exist: `tickets` and `ticket_activities`.
- [x] Verify composite index `tickets_status_priority_created_at_index` created in MySQL.
- [x] Confirm seeded user `test@example.com` has 10 associated tickets and 24 activities.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 2.

---

## Testing Strategy

### Unit Tests:
- `TicketStatus::canTransitionTo()` and `allowedTransitions()` state transition logic.
- `TicketPriority::requiresDueDate()` return values for all priority cases.
- Model accessor `sla_status` across various `due_at` timestamps (overdue, due soon, on track, no due date).

### Integration Tests:
- Migration integrity and foreign key constraints on MySQL.
- Factory state generation (`open`, `inProgress`, `resolved`, `closed`, `urgent`, `overdue`, `dueSoon`).
- Activity cascading deletion when a parent ticket is deleted.

### Manual Testing Steps:
1. Run `php artisan migrate:fresh --seed` to confirm seamless schema generation and seeding.
2. Run `php artisan tinker --execute "Ticket::count()"` to verify 10 seeded tickets exist.
3. Query MySQL database to verify `tickets_status_priority_created_at_index` and `ticket_activities_ticket_id_foreign` indexes exist.

---

## Performance Considerations

- **Composite Index**: `(status, priority, created_at)` index accelerates the primary ticket dashboard queries and paginated list filtering by eliminating full table scans.
- **Dedicated Index on `due_at`**: Allows rapid SLA breach queries (`where('due_at', '<', now())`) without triggering filesorts.
- **Soft Deletes**: Soft deletes are indexed to maintain sub-millisecond queries when filtering active vs trashed records.

---

## References

- System Architecture: `ARCHITECTURE.md`
- Master Plan: `PROJECT_PLAN.md`
- Database Architecture: `DATABASE_ARCHITECTURE.md`
- Code Style Rules: `pint.json`
