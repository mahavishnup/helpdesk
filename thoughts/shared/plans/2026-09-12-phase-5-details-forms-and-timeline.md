# Phase 5 — Ticket Details, Forms & Activity Timeline Implementation Plan

> **Status**: 🟢 **COMPLETED**

## Overview

Deliver the remaining user experience workflows: an accessible Ticket Creation form with dynamic urgent `due_at` requirements, an Edit form with closed-ticket protection, a Ticket Detail page featuring lifecycle transition action buttons and an audit/notes timeline, and an updated Dashboard featuring one-click filter KPI cards.

---

## Current State Analysis

- Phase 4 completed: Ticket list page, filter bar, badges, and pagination are operational.
- Endpoints `tickets.create`, `tickets.store`, `tickets.show`, `tickets.edit`, `tickets.update`, `tickets.status.update`, and `tickets.notes.store` are defined in `TicketController`.
- Sonner toast system is configured in `app.tsx` for flash feedback notifications.

### Key Discoveries:
- `resources/js/pages/dashboard.tsx:L1` — Current dashboard template displays placeholder grid cards.
- `resources/js/hooks/use-flash-toast.ts:L1` — Custom hook for rendering backend session flash messages via Sonner toast.
- `app/Enums/TicketStatus.php:L36` — `allowedTransitions()` returns valid next states for any given ticket status.

---

## Desired End State

After completing Phase 5:
- `Tickets/Create` (`resources/js/pages/tickets/create.tsx`):
  - Form fields: Title, Description, Priority, Customer Name, Customer Email, Due Date.
  - Selecting `Urgent` priority dynamically reveals and highlights the required `due_at` datetime picker with a warning indicator.
  - Submits via Inertia `useForm`. Redirects to ticket list with success toast.
- `Tickets/Edit` (`resources/js/pages/tickets/edit.tsx`):
  - Prefilled form allowing updates to title, description, customer details, priority, and due date.
  - If `ticket.status === 'closed'`, displays a prominent warning banner stating the ticket is closed and disables form inputs.
- `Tickets/Show` (`resources/js/pages/tickets/show.tsx`):
  - Header: Ticket title, ID, creator, creation timestamp, status badge, priority badge, and SLA badge.
  - Customer Card: Customer name, email (with `mailto:` action).
  - Status Action Bar: Displays buttons **only for valid next transitions** (e.g., if `open`, shows "Start Progress" and "Resolve"; if `closed`, shows "Ticket Closed - Terminal State").
  - Activity & Notes Timeline: Chronological stream displaying creation, status changes, and staff comments with author avatars.
  - Internal Staff Note Form: Allows agents to append internal notes directly without leaving the page.
- `Dashboard` (`resources/js/pages/dashboard.tsx`):
  - KPI Cards: Total Tickets, Open, In Progress, Urgent, Resolved, Closed, and SLA Breached.
  - Clicking any card deep-links directly to `/tickets?status=open` or `/tickets?sla=breached`.
- Build verification: `npm run types:check && npm run build` passes with zero errors.

---

## What We're NOT Doing

- No rich-text/WYSIWYG editor (clean markdown or standard textarea avoids asset bloat).
- No file upload dropzones (out of scope for 2–3h assessment).
- No external notification webhooks.

---

## Implementation Approach

1. Build `Tickets/Create` with conditional urgency logic.
2. Build `Tickets/Edit` with closed-state guards.
3. Build `Tickets/Show` with customer information, status transition buttons, and Activity timeline.
4. Update `Dashboard` with ticket KPI summary cards and deep-links.
5. Validate with TypeScript typecheck and production build.

---

## Changes Required:

### 1. Create Form

**File**: `resources/js/pages/tickets/create.tsx`  
**Changes**: Form with client-side reactive urgent priority indicator and server error display.

```typescript
const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    priority: 'medium',
    customer_name: '',
    customer_email: '',
    due_at: '',
});

const isUrgent = data.priority === 'urgent';
```

---

### 2. Edit Form

**File**: `resources/js/pages/tickets/edit.tsx`  
**Changes**: Prefilled form with read-only state when ticket is closed.

---

### 3. Show Page & Timeline

**File**: `resources/js/pages/tickets/show.tsx`  
**Changes**: Detailed view, customer card, transition buttons submitting to `tickets.status.update`, and activity timeline with inline note form submitting to `tickets.notes.store`.

---

### 4. Dashboard KPI Cards

**File**: `resources/js/pages/dashboard.tsx`  
**Changes**: Replace placeholder widgets with interactive Ticket KPI statistics deep-linking to filtered views.

---

## Success Criteria:

### Automated Verification:
- [x] TypeScript typecheck passes: `npm run types:check`
- [x] Vite-plus check passes: `npm run check`
- [x] Production build succeeds: `npm run build`
- [x] Full backend tests pass: `composer run test`

### Manual Verification:
- [ ] Create a new ticket with `Priority = Urgent`; confirm validation requires `due_at`.
- [ ] Create a ticket with valid data; confirm redirect to ticket list with Sonner toast notification.
- [ ] View the ticket details page; click "Start Progress"; confirm status updates and activity timeline logs the change.
- [ ] Add an internal note; confirm note appears in timeline with author and timestamp.
- [ ] Advance ticket to "Resolved" and then "Closed"; confirm closed ticket shows read-only banner and no further transitions are allowed.
- [ ] View Dashboard; verify KPI cards reflect accurate counts and clicking "SLA Breached" navigates to `/tickets?sla=breached`.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 6.

## Testing Strategy

### Unit Tests:
- TypeScript validation of form error states and field bindings in `create.tsx` and `edit.tsx`.
- Status action bar rendering logic: only allowed transitions according to `ticket.allowed_transitions` are rendered.

### Integration Tests:
- `Tickets/Create` form submit calls `tickets.store` and validates response handling.
- `Tickets/Edit` form submit calls `tickets.update` with proper redirect.
- Status transition button click submits to `tickets.status.update` and preserves timeline scroll.
- Internal note submission appends new activity record and clears input textarea.
- Dashboard KPI cards direct to respective filtered queries.

### Manual Testing Steps:
1. Create a new ticket with `Priority = Urgent`; confirm validation requires `due_at`.
2. Create a ticket with valid data; confirm redirect to ticket list with Sonner toast notification.
3. View the ticket details page; click "Start Progress"; confirm status updates and activity timeline logs the change.
4. Add an internal note; confirm note appears in timeline with author and timestamp.
5. Advance ticket to "Resolved" and then "Closed"; confirm closed ticket shows read-only banner and no further transitions are allowed.
6. View Dashboard; verify KPI cards reflect accurate counts and clicking "SLA Breached" navigates to `/tickets?sla=breached`.

---

## Performance Considerations

- **Scoped Timeline Re-renders**: Activity timeline items are rendered as isolated list nodes with key identifiers to prevent parent re-render loops when posting new notes.
- **Form State Isolation**: Form inputs are managed with Inertia's `useForm` hook, preventing unnecessary page re-renders on keystrokes.
- **Client-Side Validation Feedback**: Instant validation feedback for mandatory urgent due dates before round-tripping to the server.

---

## References

- Planning Agent: `.claude/agents/create-plan.md`
- Master Plan: `PROJECT_PLAN.md`
- System Architecture: `ARCHITECTURE.md`
