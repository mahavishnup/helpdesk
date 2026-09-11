import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Flame,
    Inbox,
    Lock,
    Play,
    Plus,
    Ticket as TicketIcon,
} from 'lucide-react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import {
    create as ticketsCreate,
    index as ticketsIndex,
} from '@/routes/tickets';
import type { DashboardInvitation } from '@/types';

interface TicketMetrics {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    urgent: number;
    breached: number;
    due_soon: number;
}

type Props = {
    pendingInvitations?: DashboardInvitation[];
    ticketMetrics?: TicketMetrics;
};

export default function Dashboard({
    pendingInvitations = [],
    ticketMetrics = {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        urgent: 0,
        breached: 0,
        due_soon: 0,
    },
}: Props) {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const [showInvitations, setShowInvitations] = useState(
        pendingInvitations.length > 0,
    );

    const kpiCards = [
        {
            title: 'Total Tickets',
            count: ticketMetrics.total,
            description: 'All recorded tickets',
            icon: TicketIcon,
            href: ticketsIndex.url(teamSlug),
            badgeColor: 'bg-muted text-foreground',
            trendColor: 'text-foreground',
        },
        {
            title: 'Open Inquiries',
            count: ticketMetrics.open,
            description: 'Awaiting triage & response',
            icon: Inbox,
            href: ticketsIndex.url(teamSlug, { query: { status: 'open' } }),
            badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
            trendColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            title: 'In Progress',
            count: ticketMetrics.in_progress,
            description: 'Actively being investigated',
            icon: Play,
            href: ticketsIndex.url(teamSlug, {
                query: { status: 'in_progress' },
            }),
            badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
            trendColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            title: 'Urgent Priority',
            count: ticketMetrics.urgent,
            description: 'High-severity issues',
            icon: Flame,
            href: ticketsIndex.url(teamSlug, { query: { priority: 'urgent' } }),
            badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-300',
            trendColor: 'text-red-600 dark:text-red-400',
        },
        {
            title: 'SLA Breached',
            count: ticketMetrics.breached,
            description: 'Past mandatory SLA deadline',
            icon: AlertCircle,
            href: ticketsIndex.url(teamSlug, { query: { sla: 'breached' } }),
            badgeColor:
                'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold',
            trendColor: 'text-rose-600 dark:text-rose-400',
            alert: ticketMetrics.breached > 0,
        },
        {
            title: 'SLA Due Soon',
            count: ticketMetrics.due_soon,
            description: 'Expiring in < 4 hours',
            icon: Clock,
            href: ticketsIndex.url(teamSlug, { query: { sla: 'due_soon' } }),
            badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
            trendColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            title: 'Resolved',
            count: ticketMetrics.resolved,
            description: 'Solutions delivered',
            icon: CheckCircle2,
            href: ticketsIndex.url(teamSlug, { query: { status: 'resolved' } }),
            badgeColor:
                'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            trendColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            title: 'Closed & Archived',
            count: ticketMetrics.closed,
            description: 'Terminal lifecycle state',
            icon: Lock,
            href: ticketsIndex.url(teamSlug, { query: { status: 'closed' } }),
            badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
            trendColor: 'text-slate-600 dark:text-slate-400',
        },
    ];

    return (
        <>
            <Head title="Support Operations Dashboard" />

            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Welcome & Quick Navigation */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                            Helpdesk Operations Dashboard
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            Real-time support operations, SLA monitoring, and
                            ticket lifecycle tracking.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={ticketsIndex.url(teamSlug)}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 shadow-2xs"
                            >
                                <TicketIcon className="h-4 w-4" />
                                View All Tickets
                            </Button>
                        </Link>
                        <Link href={ticketsCreate.url(teamSlug)}>
                            <Button size="sm" className="gap-1.5 shadow-xs">
                                <Plus className="h-4 w-4" />
                                Create Ticket
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((kpi) => {
                        const Icon = kpi.icon;

                        return (
                            <Link
                                key={kpi.title}
                                href={kpi.href}
                                className={`bg-card group hover:border-primary/50 relative flex flex-col justify-between rounded-xl border p-5 shadow-2xs transition-all hover:shadow-xs ${
                                    kpi.alert
                                        ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs font-medium">
                                        {kpi.title}
                                    </span>
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.badgeColor}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-foreground font-mono text-2xl font-bold tracking-tight">
                                            {kpi.count}
                                        </span>
                                        <ArrowUpRight className="text-muted-foreground/60 group-hover:text-primary h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {kpi.description}
                                    </p>
                                </div>

                                {kpi.alert && (
                                    <div className="mt-3 border-t border-rose-500/20 pt-2">
                                        <Badge
                                            variant="destructive"
                                            className="text-[10px] tracking-wider uppercase"
                                        >
                                            Requires Immediate Action
                                        </Badge>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Fast Action Quick Cards */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="bg-card space-y-3 rounded-xl border p-5 shadow-2xs">
                        <h3 className="text-foreground text-sm font-semibold">
                            SLA Enforcement & Compliance
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Urgent support tickets require an explicit
                            resolution due date. The SLA engine continuously
                            monitors resolution deadlines, flagging issues
                            approaching within 4 hours and highlighting
                            breaches.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <Link
                                href={ticketsIndex.url(teamSlug, {
                                    query: { sla: 'breached' },
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                >
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Filter Breached Tickets (
                                    {ticketMetrics.breached})
                                </Button>
                            </Link>
                            <Link
                                href={ticketsIndex.url(teamSlug, {
                                    query: { sla: 'due_soon' },
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Filter Due Soon ({ticketMetrics.due_soon})
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-card space-y-3 rounded-xl border p-5 shadow-2xs">
                        <h3 className="text-foreground text-sm font-semibold">
                            Workflow Lifecycle & Audit Trail
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Support tickets strictly follow the state transition
                            graph: Open &rarr; In Progress &rarr; Resolved
                            &rarr; Closed. Closed tickets are permanently
                            locked, and internal staff notes are securely
                            appended to the audit timeline.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <Link
                                href={ticketsIndex.url(teamSlug, {
                                    query: { status: 'open' },
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs"
                                >
                                    <Inbox className="h-3.5 w-3.5" />
                                    Triage Open Tickets ({ticketMetrics.open})
                                </Button>
                            </Link>
                            <Link href={ticketsCreate.url(teamSlug)}>
                                <Button size="sm" className="gap-1.5 text-xs">
                                    <Plus className="h-3.5 w-3.5" />
                                    New Ticket
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
