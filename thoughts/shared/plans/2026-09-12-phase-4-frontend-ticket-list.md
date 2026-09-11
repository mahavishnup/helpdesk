# Phase 4 — Frontend Ticket List, Filter Bar & SLA Badges Implementation Plan

> **Status**: 🟢 **COMPLETED**

## Overview

Construct the primary user interface for managing support tickets (`tickets/index.tsx`). Build accessible, reusable UI components including colored status, priority, and SLA badges, a debounced server-side filter bar, pagination navigation, and a responsive table/card layout.

---

## Current State Analysis

- Phase 3 completed: `GET /tickets` endpoint renders `tickets/index` with paginated data and filters.
- UI component library available under `resources/js/components/ui/` (Radix primitives, Lucide icons, Sonner toast).
- Tailwind CSS v4 configured with dark/light mode tokens in `resources/css/app.css`.

### Key Discoveries:
- `resources/js/layouts/app-layout.tsx:L1` — Provides the authenticated shell with sidebar, breadcrumbs, and user dropdown.
- `resources/js/components/ui/badge.tsx:L1` — Base badge component with variant support.
- `package.json:L10` — Scripts include `npm run check`, `npm run types:check`, and `npm run build`.

---

## Desired End State

After completing Phase 4:
- TypeScript interfaces established in `resources/js/types/tickets.ts`:
  - `Ticket`, `TicketActivity`, `TicketStatus`, `TicketPriority`, `TicketFilters`, `PaginatedResponse<T>`.
- Reusable UI badge components created:
  - `TicketStatusBadge`: styled badge for `open` (blue), `in_progress` (amber), `resolved` (emerald), and `closed` (slate).
  - `TicketPriorityBadge`: priority badge with flame/alert icon and warning styling for `urgent`.
  - `TicketSlaBadge`: dynamic SLA health indicator (`On Track`, `Due Soon < 4h`, `SLA Breached`).
- `TicketFilterBar` component:
  - Search input with 300ms debounce.
  - Dropdown selects for status and priority.
  - SLA health filter (`breached`, `due_soon`, `on_track`).
  - Clear Filters button resetting query parameters.
  - "Export to CSV" button triggering direct stream download.
- `Pagination` component:
  - Accessible previous/next controls and numbered page links for Inertia paginators.
- `resources/js/pages/tickets/index.tsx`:
  - Desktop data table layout and mobile card layout.
  - Shows Ticket ID, Title, Customer, Priority, Status, SLA Indicator, Due Date, and Actions.
  - Empty states for zero tickets and zero search results.
  - Action buttons: View, Edit, and Delete (with confirmation dialog).
- TypeScript check and asset build pass: `npm run types:check && npm run build`.

---

## What We're NOT Doing

- No Ticket Create, Edit, or Detail pages in this phase (built in Phase 5).
- No direct status transition modal in this phase (status actions live on the Detail page in Phase 5).

---

## Implementation Approach

1. Define TypeScript contracts in `resources/js/types/tickets.ts`.
2. Build reusable badges and pagination component.
3. Build `TicketFilterBar` with debounced router visits (`router.get()`).
4. Assemble `resources/js/pages/tickets/index.tsx` wrapped in `AppLayout`.
5. Run TypeScript check and Vite build to verify bundle.

---

## Changes Required:

### 1. TypeScript Types

**File**: `resources/js/types/tickets.ts`  
**Changes**: Strict interfaces matching Eloquent model output and Wayfinder bindings.

```typescript
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SlaStatus = 'none' | 'on_track' | 'due_soon' | 'breached';

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    customer_name: string;
    customer_email: string;
    due_at: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    sla_status: SlaStatus;
    can_be_edited: boolean;
    created_by_user?: {
        id: number;
        name: string;
    };
}
```

---

### 2. Badge Components

**File**: `resources/js/components/tickets/ticket-status-badge.tsx`  
**File**: `resources/js/components/tickets/ticket-priority-badge.tsx`  
**File**: `resources/js/components/tickets/ticket-sla-badge.tsx`

---

### 3. Filter Bar & Pagination

**File**: `resources/js/components/tickets/ticket-filter-bar.tsx`  
**Changes**: Search input with debounce, status/priority/SLA select dropdowns, clear button, and CSV download trigger.

**File**: `resources/js/components/tickets/pagination.tsx`  
**Changes**: Accessible pagination links using Inertia `<Link>`.

---

### 4. Ticket List Page

**File**: `resources/js/pages/tickets/index.tsx`  
**Changes**: Full tickets index view with filter bar, responsive table, SLA badges, and empty states.

---

## Success Criteria:

### Automated Verification:
- [x] TypeScript typecheck passes: `npm run types:check`
- [x] Vite-plus code check passes: `npm run check`
- [x] Production build succeeds: `npm run build`
- [x] Full backend tests pass: `composer run test`

### Manual Verification:
- [ ] Navigate to `/tickets` in browser; verify table displays seeded tickets.
- [ ] Type a search query (e.g. "SAML"); verify URL updates with `?search=SAML` and filters results.
- [ ] Select Status filter `In Progress`; verify table updates without full page reload.
- [ ] Click "Export CSV"; verify browser downloads a `.csv` file with filtered rows.
- [ ] Toggle dark mode; verify table headers and badge contrast are crisp.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding to Phase 5.

## Testing Strategy

### Unit Tests:
- TypeScript compiler verification for props and state shape in `resources/js/types/tickets.ts`.
- Badge variant resolution for each status, priority, and SLA state.

### Integration Tests:
- Inertia visit preservation (`preserveState`, `preserveScroll`, `replace`) during filter changes.
- Debounced search input emits router request only after 300ms idle time.
- Direct file download triggers correctly when clicking Export CSV button.

### Manual Testing Steps:
1. Navigate to `/tickets` in browser; verify table displays seeded tickets.
2. Type a search query (e.g. "SAML"); verify URL updates with `?search=SAML` and filters results.
3. Select Status filter `In Progress`; verify table updates without full page reload.
4. Click "Export CSV"; verify browser downloads a `.csv` file with filtered rows.
5. Toggle dark mode; verify table headers and badge contrast are crisp.

---

## Performance Considerations

- **Debounced Input**: Search keystrokes are debounced by 300ms to avoid flooding the server with HTTP requests on every character typed.
- **Inertia Partial Reloads**: Filter updates use `only: ['tickets', 'filters']` to reload only required dataset props rather than full page trees.
- **Component Memoization & Clean Primitives**: Lightweight badge and pagination components minimize re-render churn during fast filter toggles.

---

## References

- Planning Agent: `.claude/agents/create-plan.md`
- Master Plan: `PROJECT_PLAN.md`
