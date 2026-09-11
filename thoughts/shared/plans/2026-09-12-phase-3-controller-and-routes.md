# Phase 3 — HTTP Controllers, Routing & Dashboard Integration Implementation Plan

> **Status**: 🟢 **COMPLETED** (Verified via 10 routes registered, TicketController, DashboardController, Pint, PHPStan Level 7, Pest, and Wayfinder build)

## Overview

Connect the backend domain services and form requests to HTTP routing, Wayfinder typed route generation, and Inertia.js responses. Implement a thin, coordinator-style `TicketController`, register authenticated resource routes in `routes/web.php`, integrate real-time ticket KPI statistics into `DashboardController`, and add navigation to the sidebar.

---

## Current State Analysis

- Phase 2 completed: `TicketService` encapsulates all business logic, status transitions, SLA calculations, and CSV streaming.
- Form Requests (`StoreTicketRequest`, `UpdateTicketRequest`, `UpdateTicketStatusRequest`, `StoreTicketNoteRequest`) validate all inputs.
- Wayfinder is configured in `vite.config.ts:L50` to auto-generate typed TypeScript route definitions under `resources/js/routes/` and `resources/js/actions/`.
- `DashboardController.php` currently renders `dashboard.tsx` with static or empty metrics.

### Key Discoveries:
- `routes/web.php:L12` — Authenticated routes are grouped under `middleware(['auth', 'verified'])`.
- `app/Http/Controllers/DashboardController.php:L14` — Handles `GET /dashboard` and returns `Inertia::render('dashboard')`.
- `resources/js/components/app-sidebar.tsx:L32` — Defines `mainNavItems` array controlling the sidebar links.
- `composer.json:L64` — `ci:check` shortcut runs `npm run check`, `npm run types:check`, and `@test`.

---

## Desired End State

After completing Phase 3:
- `app/Http/Controllers/TicketController.php` is implemented:
  - `index(Request $request)`: queries paginated tickets with search & filters, returns Inertia `tickets/index`.
  - `create()`: returns Inertia `tickets/create` with enum lists.
  - `store(StoreTicketRequest $request)`: delegates to `ticketService->createTicket`, flashes success toast, redirects to `tickets.index`.
  - `show(Ticket $ticket)`: eager-loads `createdBy` and `activities.user`, passes allowed next statuses, returns Inertia `tickets/show`.
  - `edit(Ticket $ticket)`: checks `can_be_edited`, returns Inertia `tickets/edit`.
  - `update(UpdateTicketRequest $request, Ticket $ticket)`: delegates to `ticketService->updateTicket`, flashes success toast.
  - `updateStatus(UpdateTicketStatusRequest $request, Ticket $ticket)`: delegates to `ticketService->updateStatus`, flashes toast, redirects back.
  - `addNote(StoreTicketNoteRequest $request, Ticket $ticket)`: delegates to `ticketService->addInternalNote`, flashes toast, redirects back.
  - `export(Request $request)`: returns `ticketService->exportCsv($query)` as a streamed response.
  - `destroy(Ticket $ticket)`: delegates to `ticketService->deleteTicket`, flashes toast.
- `routes/web.php` registers all ticket endpoints with named routes.
- `DashboardController` passes live KPI metrics (`total`, `open`, `in_progress`, `urgent`, `resolved`, `closed`, `breached`) to Inertia.
- `app-sidebar.tsx` includes a "Support Tickets" nav item with a Lucide ticket icon.
- Automated tests pass: `composer run test`.

---

## What We're NOT Doing

- No React UI components or pages are built in this phase (built in Phases 4 & 5).
- No manual route helper files (Wayfinder automatically generates them from Laravel routes).
- No email notification listeners or webhooks.

---

## Implementation Approach

1. Create `TicketController` delegating strictly to `TicketService`.
2. Register routes in `routes/web.php`.
3. Update `DashboardController` to inject `TicketService` and pass metrics.
4. Update `app-sidebar.tsx` with the Tickets menu item.
5. Trigger Wayfinder build to verify TypeScript types generation.

---

## Changes Required:

### 1. HTTP Controller

**File**: `app/Http/Controllers/TicketController.php`  
**Changes**: Thin coordinator controller handling input and returning Inertia responses.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Requests\Tickets\StoreTicketNoteRequest;
use App\Http\Requests\Tickets\StoreTicketRequest;
use App\Http\Requests\Tickets\UpdateTicketRequest;
use App\Http\Requests\Tickets\UpdateTicketStatusRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'priority', 'sla']);
        $query = Ticket::query()
            ->search($filters['search'] ?? null)
            ->filterStatus($filters['status'] ?? null)
            ->filterPriority($filters['priority'] ?? null)
            ->filterSla($filters['sla'] ?? null)
            ->with('createdBy:id,name')
            ->latest('created_at');

        return Inertia::render('tickets/index', [
            'tickets' => $query->paginate(15)->withQueryString(),
            'filters' => $filters,
            'statuses' => TicketStatus::cases(),
            'priorities' => TicketPriority::cases(),
        ]);
    }

    public function store(StoreTicketRequest $request): RedirectResponse
    {
        $ticket = $this->ticketService->createTicket($request->validated(), $request->user());

        return redirect()->route('tickets.index')->with('success', "Ticket #{$ticket->id} created successfully.");
    }

    public function show(Ticket $ticket): Response
    {
        $ticket->load(['createdBy:id,name,email', 'activities.user:id,name']);

        return Inertia::render('tickets/show', [
            'ticket' => $ticket,
            'allowedTransitions' => $ticket->status->allowedTransitions(),
        ]);
    }

    public function updateStatus(UpdateTicketStatusRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->updateStatus(
            $ticket,
            TicketStatus::from($request->validated('status')),
            $request->user(),
            $request->validated('comment')
        );

        return back()->with('success', 'Ticket status updated successfully.');
    }

    public function addNote(StoreTicketNoteRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->addInternalNote($ticket, $request->user(), $request->validated('content'));

        return back()->with('success', 'Internal note added successfully.');
    }

    public function export(Request $request): StreamedResponse
    {
        $query = Ticket::query()
            ->search($request->input('search'))
            ->filterStatus($request->input('status'))
            ->filterPriority($request->input('priority'))
            ->filterSla($request->input('sla'));

        return $this->ticketService->exportCsv($query);
    }
}
```

---

### 2. Routes Registration

**File**: `routes/web.php`  
**Changes**: Register ticket routes under authenticated middleware group.

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('tickets/export', [TicketController::class, 'export'])->name('tickets.export');
    Route::post('tickets/{ticket}/status', [TicketController::class, 'updateStatus'])->name('tickets.status.update');
    Route::post('tickets/{ticket}/notes', [TicketController::class, 'addNote'])->name('tickets.notes.store');
    Route::resource('tickets', TicketController::class);
});
```

---

### 3. Dashboard Integration

**File**: `app/Http/Controllers/DashboardController.php`  
**Changes**: Inject `TicketService` and pass metrics to `dashboard` Inertia page.

---

### 4. Navigation Integration

**File**: `resources/js/components/app-sidebar.tsx`  
**Changes**: Add `{ title: 'Tickets', href: '/tickets', icon: TicketIcon }` to sidebar navigation.

---

## Success Criteria:

### Automated Verification:
- [x] Route list includes all ticket endpoints: `php artisan route:list --path=tickets`
- [x] Code formatting clean: `composer run lint:check`
- [x] Static analysis passes level 7: `composer run types:check`
- [x] Complete test suite passes: `composer run test`

### Manual Verification:
- [x] Verify `php artisan route:list --path=tickets` shows `tickets.index`, `tickets.store`, `tickets.show`, `tickets.update`, `tickets.destroy`, `tickets.status.update`, `tickets.notes.store`, and `tickets.export`.
- [x] Verify unauthenticated access to `/tickets` redirects to `/login`.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 4.

## Testing Strategy

### Unit Tests:
- `TicketController` action method parameter binding and dependency injection.
- Middleware authorization check ensuring unauthenticated requests are rejected or redirected.

### Integration Tests:
- `GET /tickets` returns Inertia response with `tickets` prop and active filter parameters.
- `POST /tickets` stores ticket via `TicketService` and redirects to index with flash message.
- `POST /tickets/{ticket}/status` executes valid transition and redirects back.
- `POST /tickets/{ticket}/notes` stores activity note and redirects back.
- `GET /tickets/export` streams CSV response with HTTP 200 and attachment headers.
- `GET /dashboard` delivers aggregated KPI statistics in Inertia props.

### Manual Testing Steps:
1. Run `php artisan route:list --path=tickets` to inspect the registered route table.
2. Visit `/tickets` in browser while logged out; verify redirect to `/login`.
3. Check generated Wayfinder routes in `resources/js/routes/` and `resources/js/actions/`.

---

## Performance Considerations

- **Eager Loading**: `TicketController::show` and `index` explicitly eager load relations (`createdBy`, `activities.user`) to eliminate N+1 queries.
- **Pagination Constraint**: Max per-page records clamped to 15 records per page to prevent heavy DOM rendering and slow payload transfers.
- **Thin Controller Architecture**: The controller performs zero heavy computation or direct raw queries, delegating entirely to `TicketService`.

---

## References

- Planning Agent: `.claude/agents/create-plan.md`
- Master Plan: `PROJECT_PLAN.md`
- System Architecture: `ARCHITECTURE.md`
