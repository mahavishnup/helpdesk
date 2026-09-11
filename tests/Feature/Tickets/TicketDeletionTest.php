<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\User;

test('guests cannot delete tickets', function () {
    $ticket = Ticket::factory()->create();

    $this->delete(route('tickets.destroy', $ticket))
        ->assertRedirect(route('login'));

    expect($ticket->fresh())->not->toBeNull();
});

test('authenticated user can soft delete a ticket', function () {
    $user = User::factory()->create();

    $ticket = Ticket::factory()->create([
        'title'      => 'Ticket to Soft Delete',
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->delete(route('tickets.destroy', $ticket));

    $response->assertRedirect(route('tickets.index'));
    $response->assertSessionHas('success');

    // Model is soft-deleted
    expect(Ticket::find($ticket->id))->toBeNull()
        ->and(Ticket::withTrashed()->find($ticket->id))->not->toBeNull()
        ->and(Ticket::withTrashed()->find($ticket->id)->deleted_at)->not->toBeNull();
});

test('soft-deleted tickets are excluded from listing results', function () {
    $user = User::factory()->create();

    $activeTicket = Ticket::factory()->create([
        'title'      => 'Active Ticket Presence',
        'created_by' => $user->id,
    ]);

    $deletedTicket = Ticket::factory()->create([
        'title'      => 'Soft Deleted Ticket Presence',
        'created_by' => $user->id,
    ]);
    $deletedTicket->delete();

    $response = $this->actingAs($user)->get(route('tickets.index'));

    $response->assertOk();
    $tickets = $response->viewData('page')['props']['tickets']['data'];

    $titles = array_column($tickets, 'title');
    expect($titles)->toContain('Active Ticket Presence')
        ->and($titles)->not->toContain('Soft Deleted Ticket Presence');
});
