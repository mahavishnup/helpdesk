<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Data\CreateTicketData;
use App\Data\UpdateTicketData;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Http\Requests\Tickets\StoreTicketNoteRequest;
use App\Http\Requests\Tickets\StoreTicketRequest;
use App\Http\Requests\Tickets\UpdateTicketRequest;
use App\Http\Requests\Tickets\UpdateTicketStatusRequest;
use App\Models\Team;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    /**
     * Display a paginated listing of tickets with search and filters for the active tenant.
     */
    public function index(Request $request, string $current_team): Response
    {
        $team = $this->currentTeam($request, $current_team);

        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $priority = $request->string('priority')->trim()->value();
        $sla = $request->string('sla')->trim()->value();

        $tickets = Ticket::query()
            ->forTeam($team)
            ->with(['createdBy'])
            ->search($search !== '' ? $search : null)
            ->filterStatus($status !== '' ? $status : null)
            ->filterPriority($priority !== '' ? $priority : null)
            ->filterSla($sla !== '' ? $sla : null)
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'filters' => [
                'search'   => $search !== '' ? $search : null,
                'status'   => $status !== '' ? $status : null,
                'priority' => $priority !== '' ? $priority : null,
                'sla'      => $sla !== '' ? $sla : null,
            ],
            'statuses' => array_map(fn (TicketStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
                'color' => $s->color(),
            ], TicketStatus::cases()),
            'priorities' => array_map(fn (TicketPriority $p) => [
                'value'       => $p->value,
                'label'       => $p->label(),
                'color'       => $p->color(),
                'requiresDue' => $p->requiresDueDate(),
            ], TicketPriority::cases()),
        ]);
    }

    /**
     * Show the form for creating a new ticket in the active tenant.
     */
    public function create(Request $request, string $current_team): Response
    {
        $this->currentTeam($request, $current_team);

        return Inertia::render('tickets/create', [
            'priorities' => array_map(fn (TicketPriority $p) => [
                'value'       => $p->value,
                'label'       => $p->label(),
                'color'       => $p->color(),
                'requiresDue' => $p->requiresDueDate(),
            ], TicketPriority::cases()),
        ]);
    }

    /**
     * Store a newly created ticket in storage for the active tenant.
     */
    public function store(StoreTicketRequest $request, string $current_team): RedirectResponse
    {
        $team = $this->currentTeam($request, $current_team);

        /** @var User $user */
        $user = $request->user();

        $ticket = $this->ticketService->createTicket(
            CreateTicketData::fromRequest($request, $team->id),
            $user
        );

        return redirect()
            ->route('tickets.show', ['current_team' => $team->slug, 'ticket' => $ticket->id])
            ->with('success', 'Ticket created successfully.');
    }

    /**
     * Display the specified ticket with timeline and allowed transition actions.
     */
    public function show(Request $request, string $current_team, Ticket $ticket): Response
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        $ticket->load([
            'createdBy',
            'activities' => fn ($query) => $query->with('user')->latest('created_at'),
        ]);

        $allowedTransitions = array_map(
            fn (TicketStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            $ticket->status->allowedTransitions()
        );

        return Inertia::render('tickets/show', [
            'ticket'             => $ticket,
            'allowedTransitions' => $allowedTransitions,
        ]);
    }

    /**
     * Show the form for editing the specified ticket.
     */
    public function edit(Request $request, string $current_team, Ticket $ticket): Response
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        return Inertia::render('tickets/edit', [
            'ticket'     => $ticket,
            'priorities' => array_map(fn (TicketPriority $p) => [
                'value'       => $p->value,
                'label'       => $p->label(),
                'color'       => $p->color(),
                'requiresDue' => $p->requiresDueDate(),
            ], TicketPriority::cases()),
        ]);
    }

    /**
     * Update the specified ticket in storage.
     */
    public function update(UpdateTicketRequest $request, string $current_team, Ticket $ticket): RedirectResponse
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        /** @var User $user */
        $user = $request->user();

        $this->ticketService->updateTicket(
            $ticket,
            UpdateTicketData::fromRequest($request),
            $user
        );

        return redirect()
            ->route('tickets.show', ['current_team' => $team->slug, 'ticket' => $ticket->id])
            ->with('success', 'Ticket updated successfully.');
    }

    /**
     * Update the status of a ticket following state machine transitions.
     */
    public function updateStatus(UpdateTicketStatusRequest $request, string $current_team, Ticket $ticket): RedirectResponse
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        /** @var User $user */
        $user = $request->user();

        $newStatus = TicketStatus::from((string) $request->validated('status'));
        $comment = $request->validated('comment');

        $this->ticketService->updateStatus(
            $ticket,
            $newStatus,
            $user,
            is_string($comment) && $comment !== '' ? $comment : null
        );

        return back()->with('success', "Ticket status changed to {$newStatus->label()}.");
    }

    /**
     * Append an internal staff note to the ticket.
     */
    public function addNote(StoreTicketNoteRequest $request, string $current_team, Ticket $ticket): RedirectResponse
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        /** @var User $user */
        $user = $request->user();

        $this->ticketService->addInternalNote($ticket, $user, $request->noteContent());

        return back()->with('success', 'Internal note added to timeline.');
    }

    /**
     * Stream filtered tickets directly to CSV for the active tenant.
     */
    public function export(Request $request, string $current_team): StreamedResponse
    {
        $team = $this->currentTeam($request, $current_team);

        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $priority = $request->string('priority')->trim()->value();
        $sla = $request->string('sla')->trim()->value();

        $query = Ticket::query()
            ->forTeam($team)
            ->search($search !== '' ? $search : null)
            ->filterStatus($status !== '' ? $status : null)
            ->filterPriority($priority !== '' ? $priority : null)
            ->filterSla($sla !== '' ? $sla : null)
            ->latest('id');

        return $this->ticketService->exportCsv($query);
    }

    /**
     * Remove the specified ticket from storage (soft delete).
     */
    public function destroy(Request $request, string $current_team, Ticket $ticket): RedirectResponse
    {
        $team = $this->currentTeam($request, $current_team);
        $this->ensureTicketBelongsToTeam($ticket, $team);

        /** @var User $user */
        $user = $request->user();

        $this->ticketService->deleteTicket($ticket, $user);

        return redirect()
            ->route('tickets.index', ['current_team' => $team->slug])
            ->with('success', 'Ticket moved to trash.');
    }

    /**
     * Resolve the active tenant team from the request route or user context.
     */
    private function currentTeam(Request $request, ?string $current_team = null): Team
    {
        $teamSlug = $current_team ?? $request->route('current_team');

        if ($teamSlug instanceof Team) {
            return $teamSlug;
        }

        if (is_string($teamSlug)) {
            $teamModel = Team::where('slug', $teamSlug)->first();
            if ($teamModel) {
                return $teamModel;
            }
        }

        $currentTeam = $request->user()?->currentTeam;
        if ($currentTeam instanceof Team) {
            return $currentTeam;
        }

        abort(403, 'Unauthorized tenant access.');
    }

    /**
     * Enforce tenant boundary: ticket must belong to the active team.
     */
    private function ensureTicketBelongsToTeam(Ticket $ticket, Team $team): void
    {
        abort_if($ticket->team_id !== $team->id, 403, 'This ticket does not belong to the active team.');
    }
}
