import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginatedLink } from '@/types/tickets';

interface PaginationProps {
    links: PaginatedLink[];
    from: number | null;
    to: number | null;
    total: number;
    className?: string;
}

export function Pagination({
    links,
    from,
    to,
    total,
    className,
}: PaginationProps) {
    if (links.length <= 3 && total <= 15) {
        return (
            <div
                className={cn(
                    'text-muted-foreground flex items-center justify-between px-2 py-4 text-xs',
                    className,
                )}
            >
                <span>
                    Showing {from ?? 0} to {to ?? 0} of {total} results
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row',
                className,
            )}
        >
            <div className="text-muted-foreground text-xs">
                Showing{' '}
                <span className="text-foreground font-medium">{from ?? 0}</span>{' '}
                to{' '}
                <span className="text-foreground font-medium">{to ?? 0}</span>{' '}
                of <span className="text-foreground font-medium">{total}</span>{' '}
                tickets
            </div>

            <nav
                className="flex items-center gap-1"
                aria-label="Pagination Navigation"
            >
                {links.map((link, idx) => {
                    const isPrev = idx === 0;
                    const isNext = idx === links.length - 1;

                    let labelContent = link.label;
                    if (isPrev) {
                        labelContent = 'Previous';
                    } else if (isNext) {
                        labelContent = 'Next';
                    }

                    // Clean raw HTML entities if Laravel paginator generates &laquo; or &raquo;
                    const cleanLabel = labelContent
                        .replace(/&laquo;/g, '')
                        .replace(/&raquo;/g, '')
                        .trim();

                    if (!link.url) {
                        return (
                            <span
                                key={idx}
                                className={cn(
                                    'text-muted-foreground/60 inline-flex h-8 cursor-not-allowed items-center justify-center rounded-md px-3 text-xs opacity-50',
                                    (isPrev || isNext) && 'gap-1',
                                )}
                            >
                                {isPrev && (
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                )}
                                {cleanLabel}
                                {isNext && (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                )}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={idx}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={cn(
                                'hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors',
                                link.active
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'border-input bg-background border',
                                (isPrev || isNext) && 'gap-1',
                            )}
                        >
                            {isPrev && <ChevronLeft className="h-3.5 w-3.5" />}
                            {cleanLabel}
                            {isNext && <ChevronRight className="h-3.5 w-3.5" />}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
