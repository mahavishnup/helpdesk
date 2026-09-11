import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Eye,
    LoaderCircle,
    Lock,
    Save,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { TicketPriorityBadge } from '@/components/tickets/ticket-priority-badge';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { edit, index, show, update } from '@/routes/tickets';
import type {
    PriorityOption,
    StatusOption,
    Ticket,
    TicketPriority,
} from '@/types';

interface TicketsEditProps {
    ticket: Ticket;
    priorities: PriorityOption[];
    statuses: StatusOption[];
}

export default function TicketsEdit({ ticket, priorities }: TicketsEditProps) {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const isClosed = !ticket.can_be_edited || ticket.status === 'closed';

    const { data, setData, put, processing, errors } = useForm<{
        title: string;
        description: string;
        priority: TicketPriority;
        customer_name: string;
        customer_email: string;
        due_at: string;
    }>({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        customer_name: ticket.customer_name,
        customer_email: ticket.customer_email,
        due_at: ticket.due_at
            ? new Date(ticket.due_at).toISOString().slice(0, 16)
            : '',
    });

    const isUrgent = data.priority === 'urgent';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isClosed) {
            return;
        }
        put(update.url({ current_team: teamSlug, ticket: ticket.id }));
    };

    return (
        <>
            <Head title={`Edit Ticket #${ticket.id}`} />

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Back Link & Header */}
                <div className="space-y-3">
                    <Link
                        href={show.url({
                            current_team: teamSlug,
                            ticket: ticket.id,
                        })}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Ticket #{ticket.id}
                    </Link>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Heading
                            title={`Edit Support Ticket #${ticket.id}`}
                            description="Modify customer contact details, severity priority, or issue description."
                        />

                        <div className="flex items-center gap-2">
                            <TicketPriorityBadge priority={ticket.priority} />
                            <TicketStatusBadge status={ticket.status} />
                        </div>
                    </div>
                </div>

                {/* Closed Ticket Notice */}
                {isClosed && (
                    <div className="bg-muted/60 flex items-start gap-3 rounded-xl border p-4">
                        <Lock className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-foreground text-sm font-semibold">
                                Ticket is Closed & Read-Only
                            </h4>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                This support ticket has been closed and
                                archived. Under compliance guidelines, closed
                                tickets cannot be modified. Return to the ticket
                                details view to inspect its full activity
                                history.
                            </p>
                            <div className="pt-2">
                                <Link
                                    href={show.url({
                                        current_team: teamSlug,
                                        ticket: ticket.id,
                                    })}
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-xs"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View Ticket Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <form
                    onSubmit={submit}
                    className="bg-card space-y-6 rounded-xl border p-6 shadow-xs"
                >
                    {/* Ticket Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Ticket Title{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                            disabled={isClosed}
                            className="h-10 text-sm"
                        />
                        <InputError message={errors.title} />
                    </div>

                    {/* Customer Info Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                htmlFor="customer_name"
                                className="text-sm font-medium"
                            >
                                Customer Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customer_name"
                                name="customer_name"
                                value={data.customer_name}
                                onChange={(e) =>
                                    setData('customer_name', e.target.value)
                                }
                                required
                                disabled={isClosed}
                                className="h-10 text-sm"
                            />
                            <InputError message={errors.customer_name} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="customer_email"
                                className="text-sm font-medium"
                            >
                                Customer Email{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customer_email"
                                name="customer_email"
                                type="email"
                                value={data.customer_email}
                                onChange={(e) =>
                                    setData('customer_email', e.target.value)
                                }
                                required
                                disabled={isClosed}
                                className="h-10 text-sm"
                            />
                            <InputError message={errors.customer_email} />
                        </div>
                    </div>

                    {/* Priority & Due Date Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                htmlFor="priority"
                                className="text-sm font-medium"
                            >
                                Priority Level{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={data.priority}
                                onValueChange={(val: TicketPriority) =>
                                    setData('priority', val)
                                }
                                disabled={isClosed}
                            >
                                <SelectTrigger
                                    id="priority"
                                    className="h-10 text-sm"
                                >
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((p) => (
                                        <SelectItem
                                            key={p.value}
                                            value={p.value}
                                        >
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.priority} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="due_at"
                                className="flex items-center gap-1.5 text-sm font-medium"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                Target Due Date{' '}
                                {isUrgent && (
                                    <span className="text-destructive font-bold">
                                        * (Required for Urgent)
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="due_at"
                                name="due_at"
                                type="datetime-local"
                                value={data.due_at}
                                onChange={(e) =>
                                    setData('due_at', e.target.value)
                                }
                                required={isUrgent}
                                disabled={isClosed}
                                className={`h-10 text-sm ${
                                    isUrgent && !data.due_at
                                        ? 'border-amber-500 ring-1 ring-amber-500/30'
                                        : ''
                                }`}
                            />
                            <InputError message={errors.due_at} />
                        </div>
                    </div>

                    {/* Urgent SLA Banner */}
                    {isUrgent && !isClosed && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-semibold">
                                    Urgent Priority Policy Enforcement
                                </p>
                                <p className="mt-0.5">
                                    Urgent tickets require a target resolution
                                    deadline to maintain SLA performance
                                    compliance.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="description"
                            className="text-sm font-medium"
                        >
                            Problem Description{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={6}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            required
                            disabled={isClosed}
                            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent p-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.description} />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-5">
                        <Link
                            href={show.url({
                                current_team: teamSlug,
                                ticket: ticket.id,
                            })}
                        >
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || isClosed}
                            className="gap-2 shadow-xs"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TicketsEdit.layout = (props: {
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
            {
                title: 'Edit',
                href: teamSlug
                    ? edit.url({
                          current_team: teamSlug,
                          ticket: props.ticket.id,
                      })
                    : '#',
            },
        ],
    };
};
