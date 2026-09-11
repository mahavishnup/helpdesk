import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/tickets';

interface TicketStatusBadgeProps {
    status: TicketStatus;
    className?: string;
}

const statusConfig: Record<
    TicketStatus,
    { label: string; dot: string; badge: string }
> = {
    open: {
        label: 'Open',
        dot: 'bg-sky-500',
        badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70',
    },
    in_progress: {
        label: 'In Progress',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70',
    },
    resolved: {
        label: 'Resolved',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70',
    },
    closed: {
        label: 'Closed',
        dot: 'bg-slate-400 dark:bg-zinc-500',
        badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
    },
};

export function TicketStatusBadge({
    status,
    className,
}: TicketStatusBadgeProps) {
    const config = statusConfig[status] ?? statusConfig.open;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide shadow-xs transition-colors',
                config.badge,
                className,
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
            {config.label}
        </span>
    );
}
