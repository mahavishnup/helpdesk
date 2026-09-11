<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TicketService
{
    /**
     * Create a new support ticket with initial audit activity.
     *
     * @param  array<string, mixed>  $data
     */
    public function createTicket(array $data, User $creator): Ticket
    {
        return DB::transaction(function () use ($data, $creator): Ticket {
            $priority = $data['priority'] instanceof TicketPriority
                ? $data['priority']
                : TicketPriority::from((string) $data['priority']);

            /** @var Ticket $ticket */
            $ticket = Ticket::create([
                'title'          => (string) $data['title'],
                'description'    => (string) $data['description'],
                'status'         => TicketStatus::Open, // New tickets always start as Open
                'priority'       => $priority,
                'customer_name'  => (string) $data['customer_name'],
                'customer_email' => (string) $data['customer_email'],
                'due_at'         => $data['due_at'] ?? null,
                'created_by'     => $creator->id,
            ]);

            // Log initial creation activity
            TicketActivity::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $creator->id,
                'type'      => 'created',
                'content'   => 'Ticket was created.',
            ]);

            return $ticket;
        });
    }

    /**
     * Update an existing ticket with validation check for terminal closed state.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function updateTicket(Ticket $ticket, array $data, User $user): Ticket
    {
        if (! $ticket->can_be_edited) {
            throw ValidationException::withMessages([
                'ticket' => 'Closed tickets cannot be edited as they are in a final terminal state.',
            ]);
        }

        return DB::transaction(function () use ($ticket, $data): Ticket {
            $priority = isset($data['priority'])
                ? ($data['priority'] instanceof TicketPriority ? $data['priority'] : TicketPriority::from((string) $data['priority']))
                : $ticket->priority;

            $ticket->update([
                'title'          => (string) ($data['title'] ?? $ticket->title),
                'description'    => (string) ($data['description'] ?? $ticket->description),
                'priority'       => $priority,
                'customer_name'  => (string) ($data['customer_name'] ?? $ticket->customer_name),
                'customer_email' => (string) ($data['customer_email'] ?? $ticket->customer_email),
                'due_at'         => array_key_exists('due_at', $data) ? $data['due_at'] : $ticket->due_at,
            ]);

            return $ticket->fresh() ?? $ticket;
        });
    }

    /**
     * Transition ticket status following the state machine rules and log audit event.
     *
     * @throws ValidationException
     */
    public function updateStatus(
        Ticket $ticket,
        TicketStatus $newStatus,
        User $user,
        ?string $comment = null
    ): Ticket {
        if (! $ticket->status->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition ticket from {$ticket->status->label()} to {$newStatus->label()}.",
            ]);
        }

        return DB::transaction(function () use ($ticket, $newStatus, $user, $comment): Ticket {
            $oldStatus = $ticket->status;

            $ticket->status = $newStatus;
            $ticket->save();

            $activityContent = "Status changed from {$oldStatus->label()} to {$newStatus->label()}.";
            if ($comment !== null && mb_trim($comment) !== '') {
                $activityContent .= ' Reason: ' . mb_trim($comment);
            }

            TicketActivity::create([
                'ticket_id'  => $ticket->id,
                'user_id'    => $user->id,
                'type'       => 'status_changed',
                'content'    => $activityContent,
                'properties' => [
                    'from' => $oldStatus->value,
                    'to'   => $newStatus->value,
                ],
            ]);

            return $ticket->fresh() ?? $ticket;
        });
    }

    /**
     * Append a private internal staff discussion note to a ticket.
     */
    public function addInternalNote(Ticket $ticket, User $user, string $content): TicketActivity
    {
        return TicketActivity::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'type'      => 'internal_note',
            'content'   => mb_trim($content),
        ]);
    }

    /**
     * Soft delete a ticket and record audit log.
     */
    public function deleteTicket(Ticket $ticket, User $user): bool
    {
        return DB::transaction(function () use ($ticket, $user): bool {
            TicketActivity::create([
                'ticket_id' => $ticket->id,
                'user_id'   => $user->id,
                'type'      => 'deleted',
                'content'   => 'Ticket was moved to trash (soft-deleted).',
            ]);

            return (bool) $ticket->delete();
        });
    }

    /**
     * Aggregate ticket statistics for Dashboard KPI widgets in a single optimized query.
     *
     * @return array<string, int>
     */
    public function getDashboardMetrics(): array
    {
        $now = now();
        $dueSoonThreshold = now()->addHours(4);

        /** @var object{total: int|string|null, open: int|string|null, in_progress: int|string|null, resolved: int|string|null, closed: int|string|null, urgent: int|string|null, breached: int|string|null, due_soon: int|string|null}|null $metrics */
        $metrics = Ticket::query()
            ->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
                COUNT(CASE WHEN priority = 'urgent' AND status != 'closed' THEN 1 END) as urgent,
                COUNT(CASE WHEN due_at IS NOT NULL AND due_at < ? AND status NOT IN ('resolved', 'closed') THEN 1 END) as breached,
                COUNT(CASE WHEN due_at IS NOT NULL AND due_at >= ? AND due_at <= ? AND status NOT IN ('resolved', 'closed') THEN 1 END) as due_soon
            ", [$now, $now, $dueSoonThreshold])
            ->first();

        return [
            'total'       => (int) ($metrics->total ?? 0),
            'open'        => (int) ($metrics->open ?? 0),
            'in_progress' => (int) ($metrics->in_progress ?? 0),
            'resolved'    => (int) ($metrics->resolved ?? 0),
            'closed'      => (int) ($metrics->closed ?? 0),
            'urgent'      => (int) ($metrics->urgent ?? 0),
            'breached'    => (int) ($metrics->breached ?? 0),
            'due_soon'    => (int) ($metrics->due_soon ?? 0),
        ];
    }

    /**
     * Stream filtered tickets directly to CSV to prevent memory exhaustion on large datasets.
     *
     * @param  Builder<Ticket>  $query
     */
    public function exportCsv(Builder $query): StreamedResponse
    {
        $filename = 'tickets-export-' . now()->format('Y-m-d-His') . '.csv';

        return new StreamedResponse(function () use ($query): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // Write RFC 4180 CSV Header
            fputcsv($handle, [
                'Ticket ID',
                'Title',
                'Customer Name',
                'Customer Email',
                'Status',
                'Priority',
                'SLA Status',
                'Due At',
                'Created By',
                'Created At',
            ]);

            // Cursor-based iteration streams rows without loading entire dataset into memory
            /** @var Ticket $ticket */
            foreach ($query->with('createdBy')->cursor() as $ticket) {
                fputcsv($handle, [
                    $ticket->id,
                    $ticket->title,
                    $ticket->customer_name,
                    $ticket->customer_email,
                    $ticket->status->label(),
                    $ticket->priority->label(),
                    str_replace('_', ' ', ucfirst($ticket->sla_status)),
                    $ticket->due_at?->toIso8601String() ?? 'N/A',
                    $ticket->createdBy instanceof User ? $ticket->createdBy->name : 'System',
                    $ticket->created_at?->toIso8601String() ?? '',
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ]);
    }
}
