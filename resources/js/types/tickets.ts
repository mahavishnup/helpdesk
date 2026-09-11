export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SlaStatus = 'none' | 'on_track' | 'due_soon' | 'breached';

export interface TicketActivity {
    id: number;
    ticket_id?: number;
    user_id?: number | null;
    type:
        | 'created'
        | 'status_changed'
        | 'internal_note'
        | 'updated'
        | 'deleted';
    content?: string;
    description?: string;
    comment?: string | null;
    properties?: {
        from?: string;
        to?: string;
        [key: string]: unknown;
    } | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email?: string;
    } | null;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    customer_name: string;
    customer_email: string;
    due_at: string | null;
    created_by?:
        | {
              id: number;
              name: string;
              email?: string;
          }
        | number
        | null;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
    sla_status: SlaStatus;
    can_be_edited: boolean;
    allowed_transitions?: TicketStatus[];
    created_by_user?: {
        id: number;
        name: string;
        email: string;
    } | null;
    activities?: TicketActivity[];
}

export interface TicketFilters {
    search: string | null;
    status: TicketStatus | '' | null;
    priority: TicketPriority | '' | null;
    sla: SlaStatus | '' | null;
}

export interface PriorityOption {
    value: TicketPriority;
    label: string;
    color: string;
    requiresDue?: boolean;
}

export interface StatusOption {
    value: TicketStatus;
    label: string;
    color: string;
}

export interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginatedLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
