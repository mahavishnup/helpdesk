import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SlaStatus } from '@/types/tickets';

interface TicketSlaBadgeProps {
    status: SlaStatus;
    className?: string;
}

export function TicketSlaBadge({ status, className }: TicketSlaBadgeProps) {
    if (status === 'none') {
        return (
            <span
                className={cn(
                    'text-muted-foreground inline-flex items-center text-xs',
                    className,
                )}
            >
                No SLA
            </span>
        );
    }

    if (status === 'breached') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 shadow-xs dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300',
                    className,
                )}
            >
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <AlertCircle className="h-3 w-3 shrink-0" />
                SLA Breached
            </span>
        );
    }

    if (status === 'due_soon') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300',
                    className,
                )}
            >
                <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                Due Soon (&lt;4h)
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300',
                className,
            )}
        >
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
            On Track
        </span>
    );
}
