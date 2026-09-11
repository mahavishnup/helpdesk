import { AlertOctagon, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TicketPriority } from '@/types/tickets';

interface TicketPriorityBadgeProps {
    priority: TicketPriority;
    className?: string;
    showIcon?: boolean;
}

const priorityConfig: Record<
    TicketPriority,
    { label: string; badge: string; icon: typeof ArrowDown }
> = {
    low: {
        label: 'Low',
        badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700',
        icon: ArrowDown,
    },
    medium: {
        label: 'Medium',
        badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
        icon: Minus,
    },
    high: {
        label: 'High',
        badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        icon: ArrowUp,
    },
    urgent: {
        label: 'Urgent',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70 font-semibold',
        icon: AlertOctagon,
    },
};

export function TicketPriorityBadge({
    priority,
    className,
    showIcon = true,
}: TicketPriorityBadgeProps) {
    const config = priorityConfig[priority] ?? priorityConfig.medium;
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium shadow-xs transition-colors',
                config.badge,
                className,
            )}
        >
            {showIcon && <Icon className="h-3 w-3 shrink-0" />}
            {config.label}
        </span>
    );
}
