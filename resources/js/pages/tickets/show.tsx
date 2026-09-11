import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    Mail,
    MessageSquare,
    Pencil,
    Play,
    RotateCcw,
    Send,
    Trash2,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge';
import { TicketSlaBadge } from '@/components/tickets/ticket-sla-badge';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { destroy, edit, index, show } from '@/routes/tickets';
import { store as storeNote } from '@/routes/tickets/notes';
import { update as updateStatus } from '@/routes/tickets/status';
import type { Ticket, TicketStatus } from '@/types';

interface TicketsShowProps {
    ticket: Ticket;
}

export default function TicketsShow({ ticket }: TicketsShowProps) {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const [isTransitioning, setIsTransitioning] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const creatorName =
        typeof ticket.created_by === 'object' && ticket.created_by !== null
            ? ticket.created_by.name
            : (ticket.created_by_user?.name ?? null);

    const noteForm = useForm({
        note: '',
    });

    const handleStatusTransition = (nextStatus: TicketStatus) => {
        setIsTransitioning(nextStatus);
        router.post(
            updateStatus.url({
                current_team: teamSlug,
                ticket: ticket.id,
            }),
            { status: nextStatus },
            {
                preserveScroll: true,
                onFinish: () => setIsTransitioning(null),
            },
        );
    };

    const handleNoteSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        noteForm.post(
            storeNote.url({
                current_team: teamSlug,
                ticket: ticket.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => noteForm.reset(),
            },
        );
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(
            destroy.url({
                current_team: teamSlug,
                ticket: ticket.id,
            }),
            {
                onFinish: () => {
                    setIsDeleting(false);
                    setDeleteModalOpen(false);
                },
            },
        );
    };

    const getStatusActionButton = (status: TicketStatus) => {
        switch (status) {
            case 'in_progress':
                return {
                    label: 'Start Progress',
                    icon: Play,
                    variant: 'outline' as const,
                    className:
                        'border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
                };
            case 'resolved':
                return {
                    label: 'Mark as Resolved',
                    icon: CheckCircle2,
                    variant: 'outline' as const,
                    className:
                        'border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
                };
            case 'closed':
                return {
                    label: 'Close Ticket',
                    icon: Lock,
                    variant: 'outline' as const,
                    className:
                        'border-slate-400 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800',
                };
            case 'open':
                return {
                    label: 'Reopen Ticket',
                    icon: RotateCcw,
                    variant: 'outline' as const,
                    className:
                        'border-blue-500/40 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
                };
        }
    };

    return (
        <>
            <Head title={`#${ticket.id} - ${ticket.title}`} />

            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Back Link & Quick Actions Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href={index.url(teamSlug)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Tickets List
                    </Link>

                    <div className="flex items-center gap-2">
                        {ticket.can_be_edited && (
                            <Link
                                href={edit.url({
                                    current_team: teamSlug,
                                    ticket: ticket.id,
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 shadow-2xs"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit Ticket
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalOpen(true)}
                            className="text-destructive hover:bg-destructive/10 gap-1.5 shadow-2xs"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Primary Ticket Header Card */}
                <div className="bg-card rounded-xl border p-6 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground font-mono text-sm font-bold">
                                    #{ticket.id}
                                </span>
                                <TicketStatusBadge status={ticket.status} />
                                <TicketPriorityBadge
                                    priority={ticket.priority}
                                />
                                {ticket.sla_status !== 'none' && (
                                    <TicketSlaBadge
                                        status={ticket.sla_status}
                                    />
                                )}
                            </div>

                            <Heading
                                title={ticket.title}
                                description={`Created on ${
                                    ticket.created_at
                                        ? new Date(
                                              ticket.created_at,
                                          ).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'
                                }${creatorName ? ` by ${creatorName}` : ''}`}
                            />
                        </div>

                        {/* Due Date & SLA Card */}
                        <div className="bg-muted/40 flex flex-col gap-1.5 rounded-lg border p-3.5 md:min-w-60">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Target Due Date
                            </span>
                            {ticket.due_at ? (
                                <div className="space-y-0.5">
                                    <p className="text-foreground text-sm font-semibold">
                                        {new Date(
                                            ticket.due_at,
                                        ).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                        <Clock className="h-3 w-3" />
                                        SLA:{' '}
                                        <span className="font-medium capitalize">
                                            {ticket.sla_status.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-xs">
                                    No deadline set
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status Lifecycle Transition Action Bar */}
                    <div className="mt-6 border-t pt-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                    Lifecycle Actions
                                </h3>
                                <p className="text-muted-foreground text-xs">
                                    {ticket.status === 'closed'
                                        ? 'This ticket is permanently closed and archived.'
                                        : 'Select an allowed transition to advance ticket resolution.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {ticket.allowed_transitions &&
                                ticket.allowed_transitions.length > 0 ? (
                                    ticket.allowed_transitions.map(
                                        (next: TicketStatus) => {
                                            const action =
                                                getStatusActionButton(next);
                                            const Icon = action.icon;
                                            const loading =
                                                isTransitioning === next;

                                            return (
                                                <Button
                                                    key={next}
                                                    variant={action.variant}
                                                    size="sm"
                                                    disabled={Boolean(
                                                        isTransitioning,
                                                    )}
                                                    onClick={() =>
                                                        handleStatusTransition(
                                                            next,
                                                        )
                                                    }
                                                    className={`gap-1.5 text-xs shadow-2xs ${action.className}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {loading
                                                        ? 'Updating...'
                                                        : action.label}
                                                </Button>
                                            );
                                        },
                                    )
                                ) : (
                                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs italic">
                                        <Lock className="h-3.5 w-3.5" />
                                        Terminal State — No transitions
                                        permitted
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid: 2 Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Cols: Problem Description & Activity Timeline */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Problem Description Card */}
                        <div className="bg-card space-y-3 rounded-xl border p-6 shadow-xs">
                            <h2 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                Problem Description
                            </h2>
                            <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        </div>

                        {/* Internal Staff Notes Form */}
                        <div className="bg-card space-y-4 rounded-xl border p-6 shadow-xs">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="text-primary h-4 w-4" />
                                <h3 className="text-foreground text-sm font-semibold">
                                    Add Internal Staff Note
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase"
                                >
                                    Internal Only
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Notes are visible to authorized support agents
                                and automatically logged in the audit trail.
                            </p>

                            <form
                                onSubmit={handleNoteSubmit}
                                className="space-y-3"
                            >
                                <div>
                                    <textarea
                                        rows={3}
                                        value={noteForm.data.note}
                                        onChange={(e) =>
                                            noteForm.setData(
                                                'note',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Add diagnostic notes, customer follow-up actions, or resolution steps..."
                                        required
                                        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent p-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                    />
                                    <InputError
                                        message={noteForm.errors.note}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={
                                            noteForm.processing ||
                                            !noteForm.data.note.trim()
                                        }
                                        className="gap-1.5 shadow-2xs"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        {noteForm.processing
                                            ? 'Posting...'
                                            : 'Post Internal Note'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Activity & Audit Timeline */}
                        <div className="bg-card space-y-4 rounded-xl border p-6 shadow-xs">
                            <h3 className="text-foreground text-sm font-semibold">
                                Ticket Activity & Audit Trail
                            </h3>

                            <div className="border-muted relative ml-3 space-y-6 border-l-2 pt-2 pl-6">
                                {ticket.activities &&
                                ticket.activities.length > 0 ? (
                                    ticket.activities.map((activity) => {
                                        const isNote =
                                            activity.type === 'internal_note';
                                        const isStatusChange =
                                            activity.type === 'status_changed';

                                        return (
                                            <div
                                                key={activity.id}
                                                className="group relative"
                                            >
                                                {/* Timeline Node Dot */}
                                                <div
                                                    className={`bg-background absolute top-0.5 -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                                        isNote
                                                            ? 'border-primary text-primary'
                                                            : isStatusChange
                                                              ? 'border-amber-500 text-amber-500'
                                                              : 'border-muted-foreground text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="h-2 w-2 rounded-full bg-current" />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-foreground text-xs font-semibold">
                                                            {activity.user
                                                                ?.name ??
                                                                'System Automated'}
                                                        </span>
                                                        <span className="text-muted-foreground text-[11px]">
                                                            {activity.created_at
                                                                ? new Date(
                                                                      activity.created_at,
                                                                  ).toLocaleDateString(
                                                                      undefined,
                                                                      {
                                                                          month: 'short',
                                                                          day: 'numeric',
                                                                          hour: '2-digit',
                                                                          minute: '2-digit',
                                                                      },
                                                                  )
                                                                : '—'}
                                                        </span>
                                                        {isNote && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-primary border-primary/30 text-[10px] font-semibold uppercase"
                                                            >
                                                                Internal Note
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                                        {activity.description ??
                                                            activity.content}
                                                    </p>

                                                    {/* Internal Note Comment Box */}
                                                    {activity.comment && (
                                                        <div className="bg-muted/60 text-foreground mt-2 rounded-lg border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                                            {activity.comment}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-xs italic">
                                        No activity recorded yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer Card & Metadata */}
                    <div className="space-y-6">
                        {/* Customer Information Card */}
                        <div className="bg-card space-y-4 rounded-xl border p-6 shadow-xs">
                            <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                Customer Details
                            </h3>

                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {ticket.customer_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-0.5 overflow-hidden">
                                    <p className="text-foreground truncate text-sm font-semibold">
                                        {ticket.customer_name}
                                    </p>
                                    <a
                                        href={`mailto:${ticket.customer_email}`}
                                        className="text-muted-foreground hover:text-primary flex items-center gap-1 truncate text-xs transition-colors"
                                    >
                                        <Mail className="h-3 w-3 shrink-0" />
                                        {ticket.customer_email}
                                    </a>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <a
                                    href={`mailto:${ticket.customer_email}?subject=Regarding Ticket %23${ticket.id}: ${encodeURIComponent(ticket.title)}`}
                                    className="w-full"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1.5 text-xs"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        Contact Customer
                                    </Button>
                                </a>
                            </div>
                        </div>

                        {/* System Metadata Card */}
                        <div className="bg-card space-y-3 rounded-xl border p-6 shadow-xs">
                            <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                                Ticket Properties
                            </h3>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Created By:
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {creatorName ?? 'System'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Editable:
                                    </span>
                                    <span
                                        className={`font-medium ${
                                            ticket.can_be_edited
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {ticket.can_be_edited
                                            ? 'Yes'
                                            : 'No (Closed)'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Audit Records:
                                    </span>
                                    <span className="text-foreground font-mono font-medium">
                                        {ticket.activities?.length ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Soft Delete Confirmation Modal */}
                <Dialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Ticket Deletion
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete support ticket{' '}
                                <strong>#{ticket.id}</strong> ({ticket.title})?
                                This will soft-delete the ticket from the active
                                view.
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
            </div>
        </>
    );
}

TicketsShow.layout = (props: {
    ticket: Ticket;
    currentTeam?: { slug: string } | null;
}) => {
    const teamSlug = props.currentTeam?.slug;

    return {
        breadcrumbs: [
            {
                title: 'Support Tickets',
                href: teamSlug ? index.url(teamSlug) : '/tickets',
            },
            {
                title: `#${props.ticket.id}`,
                href: teamSlug
                    ? show.url({
                          current_team: teamSlug,
                          ticket: props.ticket.id,
                      })
                    : '#',
            },
        ],
    };
};
