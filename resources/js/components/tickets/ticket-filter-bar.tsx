import { router, usePage } from '@inertiajs/react';
import { Download, RotateCcw, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exportMethod, index } from '@/routes/tickets';
import type {
    PriorityOption,
    StatusOption,
    TicketFilters,
} from '@/types/tickets';

interface TicketFilterBarProps {
    filters: TicketFilters;
    statuses: StatusOption[];
    priorities: PriorityOption[];
}

export function TicketFilterBar({
    filters,
    statuses,
    priorities,
}: TicketFilterBarProps) {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const [search, setSearch] = useState<string>(filters.search ?? '');
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [priority, setPriority] = useState<string>(filters.priority ?? '');
    const [sla, setSla] = useState<string>(filters.sla ?? '');

    // Synchronize local states when props change (e.g. browser back/forward)
    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        setPriority(filters.priority ?? '');
        setSla(filters.sla ?? '');
    }, [filters.search, filters.status, filters.priority, filters.sla]);

    const applyFilters = useCallback(
        (updated: {
            search?: string;
            status?: string;
            priority?: string;
            sla?: string;
        }) => {
            const query: Record<string, string> = {};

            const finalSearch =
                updated.search !== undefined ? updated.search : search;
            const finalStatus =
                updated.status !== undefined ? updated.status : status;
            const finalPriority =
                updated.priority !== undefined ? updated.priority : priority;
            const finalSla = updated.sla !== undefined ? updated.sla : sla;

            if (finalSearch.trim() !== '') {
                query.search = finalSearch.trim();
            }
            if (finalStatus !== '') {
                query.status = finalStatus;
            }
            if (finalPriority !== '') {
                query.priority = finalPriority;
            }
            if (finalSla !== '') {
                query.sla = finalSla;
            }

            router.get(index.url(teamSlug), query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [search, status, priority, sla, teamSlug],
    );

    // Debounce text search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                applyFilters({ search });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, filters.search, applyFilters]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setSla('');
        router.get(
            index.url(teamSlug),
            {},
            { preserveState: true, replace: true },
        );
    };

    const hasActiveFilters = Boolean(
        search.trim() !== '' || status !== '' || priority !== '' || sla !== '',
    );

    const handleExportCsv = () => {
        const exportQuery: Record<string, string> = {};
        if (search.trim() !== '') {
            exportQuery.search = search.trim();
        }
        if (status !== '') {
            exportQuery.status = status;
        }
        if (priority !== '') {
            exportQuery.priority = priority;
        }
        if (sla !== '') {
            exportQuery.sla = sla;
        }

        window.location.href = exportMethod.url(teamSlug, {
            query: exportQuery,
        });
    };

    return (
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-2xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                {/* Search Input */}
                <div className="relative lg:col-span-4">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        placeholder="Search tickets by title, customer, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>

                {/* Status Dropdown */}
                <div className="lg:col-span-2">
                    <select
                        aria-label="Filter by ticket status"
                        value={status}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStatus(val);
                            applyFilters({ status: val });
                        }}
                        className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-2xs focus-visible:ring-[2px] focus-visible:outline-hidden"
                    >
                        <option value="">All Statuses</option>
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Priority Dropdown */}
                <div className="lg:col-span-2">
                    <select
                        aria-label="Filter by ticket priority"
                        value={priority}
                        onChange={(e) => {
                            const val = e.target.value;
                            setPriority(val);
                            applyFilters({ priority: val });
                        }}
                        className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-2xs focus-visible:ring-[2px] focus-visible:outline-hidden"
                    >
                        <option value="">All Priorities</option>
                        {priorities.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* SLA Filter Dropdown */}
                <div className="lg:col-span-2">
                    <select
                        aria-label="Filter by SLA health"
                        value={sla}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSla(val);
                            applyFilters({ sla: val });
                        }}
                        className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-2xs focus-visible:ring-[2px] focus-visible:outline-hidden"
                    >
                        <option value="">All SLA States</option>
                        <option value="breached">⚠️ SLA Breached</option>
                        <option value="due_soon">⏳ Due Soon (&lt;4h)</option>
                        <option value="on_track">✅ On Track</option>
                    </select>
                </div>

                {/* Actions: Export & Reset */}
                <div className="flex items-center gap-2 lg:col-span-2 lg:justify-end">
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="text-muted-foreground hover:text-foreground h-9 text-xs"
                            title="Reset all filters"
                        >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Reset
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        className="h-9 text-xs"
                        title="Export current view to CSV"
                    >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Export
                    </Button>
                </div>
            </div>
        </div>
    );
}
