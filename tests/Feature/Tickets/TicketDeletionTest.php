<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\User;

test('guests cannot delete tickets', function () {
    $ticket = Ticket::factory()->create();

    $this->delete('/acme/tickets/' . $ticket->id)
        ->assertRedirect(route('login'));

    expect($ticket->fresh())->not->toBeNull();
});

test('authenticated user can soft delete a ticket', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'Ticket to Soft Delete',
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->delete(route('tickets.destroy', ['current_team' => $team->slug, 'ticket' => $ticket]));

    $response->assertRedirect(route('tickets.index', ['current_team' => $team->slug]));
    $response->assertSessionHas('success');

    // Model is soft-deleted
    expect(Ticket::find($ticket->id))->toBeNull()
        ->and(Ticket::withTrashed()->find($ticket->id))->not->toBeNull()
        ->and(Ticket::withTrashed()->find($ticket->id)->deleted_at)->not->toBeNull();
});

test('soft-deleted tickets are excluded from listing results', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $activeTicket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'Active Ticket Presence',
        'created_by' => $user->id,
    ]);

    $deletedTicket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'Soft Deleted Ticket Presence',
        'created_by' => $user->id,
    ]);
    $deletedTicket->delete();

    $response = $this->actingAs($user)->get(route('tickets.index', ['current_team' => $team->slug]));

    $response->assertOk();
    $tickets = $response->viewData('page')['props']['tickets']['data'];

    $titles = array_column($tickets, 'title');
    expect($titles)->toContain('Active Ticket Presence')
        ->and($titles)->not->toContain('Soft Deleted Ticket Presence');
});

test('user cannot delete ticket belonging to another team', function () {
    $user = User::factory()->create();
    $foreignUser = User::factory()->create();
    $foreignTeam = $foreignUser->currentTeam;

    $foreignTicket = Ticket::factory()->create([
        'team_id'    => $foreignTeam->id,
        'created_by' => $foreignUser->id,
    ]);

    $this->actingAs($user)
        ->delete(route('tickets.destroy', ['current_team' => $user->currentTeam->slug, 'ticket' => $foreignTicket]))
        ->assertForbidden();

    expect(Ticket::find($foreignTicket->id))->not->toBeNull();
});
