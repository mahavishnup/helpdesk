# Phase 6 — Automated Pest Feature Test Suite Implementation Plan

## Overview

Implement an extensive suite of automated feature tests using **Pest PHP 5.1** covering the full ticket lifecycle: creation rules, urgent priority mandatory due dates, search and filtering combinations, bounded pagination, state machine transitions, closed ticket immutability, activity timeline logging, and soft deletes.

---

## Current State Analysis

- Phase 5 completed: Frontend and backend are completely functional.
- Base starter kit tests pass: 91 tests (`composer run test`).
- Existing tests located in `tests/Feature/Auth/`, `tests/Feature/Settings/`, and `tests/Feature/Teams/`.

### Key Discoveries:
- `tests/Pest.php:L1` — Configures Pest with `uses(TestCase::class)->in('Feature')`.
- `database/factories/TicketFactory.php:L1` — Provides factories with states for `open()`, `inProgress()`, `resolved()`, `closed()`, `urgent()`, `overdue()`, and `dueSoon()`.
- `app/Enums/TicketStatus.php:L26` — Defines allowed and forbidden transition pairs.

---

## Desired End State

After completing Phase 6:
- 5 comprehensive Pest feature test classes created under `tests/Feature/Tickets/`:
  1. `TicketCreationTest.php`:
     - Authenticated user can create ticket.
     - Guests redirected to login.
     - New ticket defaults to status `open`.
     - Required field validation (title, description, customer_name, customer_email).
     - Customer email must be valid email format.
     - Urgent priority strictly requires `due_at`.
     - Non-urgent priority allows omitting `due_at`.
  2. `TicketListingTest.php`:
     - Authenticated user can view tickets.
     - Text search matches across title, description, customer name, and customer email.
     - Status and priority filters work independently and combined.
     - SLA filter (`breached`, `due_soon`, `on_track`) returns correct subsets.
     - Pagination respects requested boundaries.
     - Streamed CSV export returns valid headers and rows.
  3. `TicketStatusTransitionTest.php`:
     - Allowed transitions pass:
       - `open` -> `in_progress`
       - `open` -> `resolved`
       - `in_progress` -> `open`
       - `in_progress` -> `resolved`
       - `resolved` -> `in_progress`
       - `resolved` -> `closed`
     - Forbidden transitions fail with 422:
       - `open` -> `closed`
       - `in_progress` -> `closed`
     - Closed tickets cannot transition to any status (terminal state).
     - Closed tickets cannot be updated via edit endpoint.
  4. `TicketActivityTest.php`:
     - Creating a ticket logs initial activity in `ticket_activities`.
     - Updating status logs a `status_changed` activity with from/to properties.
     - Support staff can post internal notes.
  5. `TicketDeletionTest.php`:
     - Authenticated user can soft-delete ticket.
     - Soft-deleted tickets are excluded from standard index and search results.
- All tests pass: `composer run test` reports 100% success rate with high assertion density.

---

## What We're NOT Doing

- No UI end-to-end browser tests via Cypress or Playwright (Pest feature tests provide faster, deterministic validation for a 2–3h assessment).
- No testing of internal framework code (focus is strictly on application business rules and failure boundaries).

---

## Implementation Approach

1. Create `TicketCreationTest.php`.
2. Create `TicketListingTest.php`.
3. Create `TicketStatusTransitionTest.php`.
4. Create `TicketActivityTest.php`.
5. Create `TicketDeletionTest.php`.
6. Run `php artisan test --filter=Ticket` and `composer run test`.

---

## Changes Required:

### 1. Creation Tests

**File**: `tests/Feature/Tickets/TicketCreationTest.php`

```php
test('authenticated user can create a ticket', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('tickets.store'), [
        'title' => 'Server offline',
        'description' => 'Main production node down.',
        'priority' => TicketPriority::High->value,
        'customer_name' => 'Alice Smith',
        'customer_email' => 'alice@example.com',
    ]);

    $response->assertRedirect(route('tickets.index'));
    $this->assertDatabaseHas('tickets', [
        'title' => 'Server offline',
        'status' => TicketStatus::Open->value,
        'created_by' => $user->id,
    ]);
});

test('urgent ticket requires due_at date', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('tickets.store'), [
        'title' => 'Urgent database lock',
        'description' => 'Transactions stalled.',
        'priority' => TicketPriority::Urgent->value,
        'customer_name' => 'Bob Jones',
        'customer_email' => 'bob@example.com',
        'due_at' => null,
    ]);

    $response->assertSessionHasErrors('due_at');
});
```

---

### 2. Status Transition Tests

**File**: `tests/Feature/Tickets/TicketStatusTransitionTest.php`

```php
test('allowed status transitions succeed', function (TicketStatus $from, TicketStatus $to) {
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create([
        'status' => $from,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->post(route('tickets.status.update', $ticket), [
        'status' => $to->value,
    ]);

    $response->assertSessionHasNoErrors();
    expect($ticket->fresh()->status)->toBe($to);
})->with([
    [TicketStatus::Open, TicketStatus::InProgress],
    [TicketStatus::Open, TicketStatus::Resolved],
    [TicketStatus::InProgress, TicketStatus::Open],
    [TicketStatus::InProgress, TicketStatus::Resolved],
    [TicketStatus::Resolved, TicketStatus::InProgress],
    [TicketStatus::Resolved, TicketStatus::Closed],
]);

test('cannot reopen or modify closed ticket', function () {
    $user = User::factory()->create();
    $ticket = Ticket::factory()->closed()->create();

    $response = $this->actingAs($user)->post(route('tickets.status.update', $ticket), [
        'status' => TicketStatus::Open->value,
    ]);

    $response->assertSessionHasErrors('status');
});
```

---

### 3. Listing, Activity & Deletion Tests

**File**: `tests/Feature/Tickets/TicketListingTest.php`  
**File**: `tests/Feature/Tickets/TicketActivityTest.php`  
**File**: `tests/Feature/Tickets/TicketDeletionTest.php`

---

## Success Criteria:

### Automated Verification:
- [ ] Ticket feature test suite passes: `php artisan test --filter=Ticket`
- [ ] Full application test suite passes: `composer run test`
- [ ] Static analysis passes level 7: `composer run types:check`
- [ ] Code formatting passes: `composer run lint:check`

### Manual Verification:
- [ ] Confirm at least 15 comprehensive tests cover CRUD, validation, and edge cases.
- [ ] Verify test execution finishes in under 5 seconds.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 7.

## Testing Strategy

### Unit Tests:
- Factory state generation accuracy (`urgent()`, `dueSoon()`, `overdue()`, `closed()`).
- Data provider tests for all 6 valid state transitions and invalid state pairs.
- Null coalescing and fallback handling for anonymous or null ticket creator.

### Integration Tests:
- `TicketCreationTest`: full HTTP POST lifecycle, session error assertion, DB assertions.
- `TicketListingTest`: multi-parameter search & filter combinations, pagination page boundaries, CSV streaming response.
- `TicketStatusTransitionTest`: status progression, closed state terminal protection.
- `TicketActivityTest`: audit log generation on ticket events and staff comments.
- `TicketDeletionTest`: soft-deletes exclusion from standard queries.

### Manual Testing Steps:
1. Run `php artisan test --filter=Ticket` to execute the ticket test suite.
2. Run `composer run test` to verify zero regressions across the whole repository.
3. Review test output to ensure all assertions pass within seconds.

---

## Performance Considerations

- **Database Isolation via Transactions**: Uses `Illuminate\Foundation\Testing\RefreshDatabase` (or database transactions) so MySQL resets rapidly between tests without dropping and recreating tables.
- **Factory Performance**: Uses explicit factory states (`Ticket::factory()->urgent()->create()`) rather than manual attribute overrides to keep tests concise and performant.
- **Parallel Test Runner**: Designed to support `php artisan test --parallel` without state bleeding across test workers.

---

## References

- Planning Agent: `.claude/agents/create-plan.md`
- Master Plan: `PROJECT_PLAN.md`
- Testing Best Practices: `tests/Pest.php`
