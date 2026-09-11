import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Eye, Inbox, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/tickets/pagination';
import { TicketFilterBar } from '@/components/tickets/ticket-filter-bar';
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge';
import { TicketSlaBadge } from '@/components/tickets/ticket-sla-badge';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { create, destroy, edit, index, show } from '@/routes/tickets';
import type {
    PaginatedResponse,
    PriorityOption,
    StatusOption,
    Ticket,
    TicketFilters,
} from '@/types';

interface TicketsIndexProps {
    tickets: PaginatedResponse<Ticket>;
    filters: TicketFilters;
    statuses: StatusOption[];
    priorities: PriorityOption[];
}

export default function TicketsIndex({
    tickets,
    filters,
    statuses,
    priorities,
}: TicketsIndexProps) {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!ticketToDelete) {
            return;
        }

        setIsDeleting(true);
        router.delete(
            destroy.url({
                current_team: teamSlug,
                ticket: ticketToDelete.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsDeleting(false);
                    setTicketToDelete(null);
                },
            },
        );
    };

    const hasFilters = Boolean(
        filters.search || filters.status || filters.priority || filters.sla,
    );

    return (
        <>
            <Head title="Support Tickets" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Support Tickets"
                        description="Manage, monitor, and resolve customer support tickets with SLA tracking."
                    />

                    <div className="flex items-center gap-2">
                        <Link href={create.url(teamSlug)}>
                            <Button className="gap-2 shadow-xs">
                                <Plus className="h-4 w-4" />
                                Create Ticket
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Bar */}
                <TicketFilterBar
                    filters={filters}
                    statuses={statuses}
                    priorities={priorities}
                />

                {/* Tickets Table / List */}
                <div className="bg-card overflow-hidden rounded-xl border shadow-2xs">
                    {tickets.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
                                <Inbox className="h-6 w-6" />
                            </div>
                            <h3 className="text-foreground mt-4 text-base font-semibold">
                                No tickets found
                            </h3>
                            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                                {hasFilters
                                    ? 'No support tickets match your filter criteria. Try searching for a different keyword or reset filters.'
                                    : 'There are currently no tickets in the system. Create the first ticket to begin tracking issues.'}
                            </p>
                            {hasFilters ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.get(
                                            index.url(teamSlug),
                                            {},
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        )
                                    }
                                    className="mt-4 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            ) : (
                                <Link
                                    href={create.url(teamSlug)}
                                    className="mt-4"
                                >
                                    <Button
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Ticket
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Data Table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                                        <tr>
                                            <th className="px-4 py-3.5">ID</th>
                                            <th className="px-4 py-3.5">
                                                Title & Customer
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Priority
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status
                                            </th>
                                            <th className="px-4 py-3.5">
                                                SLA Health
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Due Date
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {tickets.data.map((ticket) => (
                                            <tr
                                                key={ticket.id}
                                                className="hover:bg-muted/40 transition-colors"
                                            >
                                                {/* ID */}
                                                <td className="text-muted-foreground px-4 py-3.5 font-mono text-xs font-semibold whitespace-nowrap">
                                                    #{ticket.id}
                                                </td>

                                                {/* Title & Customer */}
                                                <td className="max-w-md px-4 py-3.5">
                                                    <Link
                                                        href={show.url({
                                                            current_team:
                                                                teamSlug,
                                                            ticket: ticket.id,
                                                        })}
                                                        className="text-foreground font-medium hover:underline"
                                                    >
                                                        {ticket.title}
                                                    </Link>
                                                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                                                        <User className="h-3 w-3 shrink-0" />
                                                        <span>
                                                            {
                                                                ticket.customer_name
                                                            }
                                                        </span>
                                                        <span>&middot;</span>
                                                        <span>
                                                            {
                                                                ticket.customer_email
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Priority */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <TicketPriorityBadge
                                                        priority={
                                                            ticket.priority
                                                        }
                                                    />
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <TicketStatusBadge
                                                        status={ticket.status}
                                                    />
                                                </td>

                                                {/* SLA Status */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {ticket.sla_status ===
                                                    'none' ? (
                                                        <span className="text-muted-foreground/50 text-xs">
                                                            —
                                                        </span>
                                                    ) : (
                                                        <TicketSlaBadge
                                                            status={
                                                                ticket.sla_status
                                                            }
                                                        />
                                                    )}
                                                </td>

                                                {/* Due Date */}
                                                <td className="text-muted-foreground px-4 py-3.5 text-xs whitespace-nowrap">
                                                    {ticket.due_at ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 shrink-0" />
                                                            {new Date(
                                                                ticket.due_at,
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <TooltipProvider
                                                        delayDuration={150}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={show.url(
                                                                            {
                                                                                current_team:
                                                                                    teamSlug,
                                                                                ticket: ticket.id,
                                                                            },
                                                                        )}
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    View Details
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {ticket.can_be_edited && (
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={edit.url(
                                                                                {
                                                                                    current_team:
                                                                                        teamSlug,
                                                                                    ticket: ticket.id,
                                                                                },
                                                                            )}
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Edit
                                                                        Ticket
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}

                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            setTicketToDelete(
                                                                                ticket,
                                                                            )
                                                                        }
                                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Delete
                                                                    Ticket
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TooltipProvider>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Layout */}
                            <div className="divide-border divide-y md:hidden">
                                {tickets.data.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="space-y-3 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-muted-foreground font-mono text-xs font-semibold">
                                                #{ticket.id}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <TicketPriorityBadge
                                                    priority={ticket.priority}
                                                />
                                                <TicketStatusBadge
                                                    status={ticket.status}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Link
                                                href={show.url({
                                                    current_team: teamSlug,
                                                    ticket: ticket.id,
                                                })}
                                                className="text-foreground block font-medium hover:underline"
                                            >
                                                {ticket.title}
                                            </Link>
                                            <p className="text-muted-foreground mt-0.5 text-xs">
                                                {ticket.customer_name} (
                                                {ticket.customer_email})
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            {ticket.sla_status === 'none' ? (
                                                <span className="text-muted-foreground/50 text-xs">
                                                    —
                                                </span>
                                            ) : (
                                                <TicketSlaBadge
                                                    status={ticket.sla_status}
                                                />
                                            )}

                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={show.url({
                                                        current_team: teamSlug,
                                                        ticket: ticket.id,
                                                    })}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs"
                                                    >
                                                        <Eye className="mr-1 h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </Link>

                                                {ticket.can_be_edited && (
                                                    <Link
                                                        href={edit.url({
                                                            current_team:
                                                                teamSlug,
                                                            ticket: ticket.id,
                                                        })}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setTicketToDelete(
                                                            ticket,
                                                        )
                                                    }
                                                    className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination Controls */}
                {tickets.data.length > 0 && (
                    <Pagination
                        links={tickets.links}
                        from={tickets.from}
                        to={tickets.to}
                        total={tickets.total}
                    />
                )}
            </div>

            {/* Soft Delete Confirmation Modal */}
            <Dialog
                open={Boolean(ticketToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setTicketToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete support ticket{' '}
                            <strong>#{ticketToDelete?.id}</strong> (
                            {ticketToDelete?.title})? This will soft-delete the
                            ticket and preserve its audit history.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Ticket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

TicketsIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Support Tickets',
            href: props.currentTeam
                ? index.url(props.currentTeam.slug)
                : '/tickets',
        },
    ],
});
