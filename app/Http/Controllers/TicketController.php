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
     * Display a paginated listing of tickets with search and filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $priority = $request->string('priority')->trim()->value();
        $sla = $request->string('sla')->trim()->value();

        $tickets = Ticket::query()
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
     * Show the form for creating a new ticket.
     */
    public function create(): Response
    {
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
     * Store a newly created ticket in storage.
     */
    public function store(StoreTicketRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $ticket = $this->ticketService->createTicket(
            CreateTicketData::fromRequest($request),
            $user
        );

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    /**
     * Display the specified ticket with timeline and allowed transition actions.
     */
    public function show(Ticket $ticket): Response
    {
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
    public function edit(Ticket $ticket): Response
    {
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
    public function update(UpdateTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->ticketService->updateTicket(
            $ticket,
            UpdateTicketData::fromRequest($request),
            $user
        );

        return redirect()
            ->route('tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
    }

    /**
     * Update the status of a ticket following state machine transitions.
     */
    public function updateStatus(UpdateTicketStatusRequest $request, Ticket $ticket): RedirectResponse
    {
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
    public function addNote(StoreTicketNoteRequest $request, Ticket $ticket): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->ticketService->addInternalNote($ticket, $user, $request->noteContent());

        return back()->with('success', 'Internal note added to timeline.');
    }

    /**
     * Stream filtered tickets directly to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $priority = $request->string('priority')->trim()->value();
        $sla = $request->string('sla')->trim()->value();

        $query = Ticket::query()
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
    public function destroy(Request $request, Ticket $ticket): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->ticketService->deleteTicket($ticket, $user);

        return redirect()
            ->route('tickets.index')
            ->with('success', 'Ticket moved to trash.');
    }
}
