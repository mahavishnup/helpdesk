<?php

declare(strict_types=1);

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;

test('ticket status transition logs status_changed activity with audit properties', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'status'     => TicketStatus::Open,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $team->slug, 'ticket' => $ticket]), ['status' => 'in_progress'])
        ->assertRedirect();

    $activity = TicketActivity::where('ticket_id', $ticket->id)
        ->where('type', 'status_changed')
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->user_id)->toBe($user->id)
        ->and($activity->properties)->toBeArray()
        ->and($activity->properties['from'])->toBe('open')
        ->and($activity->properties['to'])->toBe('in_progress');
});

test('support staff can post internal staff notes to a ticket', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->post(route('tickets.notes.store', ['current_team' => $team->slug, 'ticket' => $ticket]), [
            'note' => 'Diagnosed root cause: TLS 1.3 handshake negotiation dropped on edge proxy.',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $activity = TicketActivity::where('ticket_id', $ticket->id)
        ->where('type', 'internal_note')
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->user_id)->toBe($user->id)
        ->and($activity->content)->toBe('Diagnosed root cause: TLS 1.3 handshake negotiation dropped on edge proxy.');
});

test('internal staff note requires non-empty content', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('tickets.notes.store', ['current_team' => $team->slug, 'ticket' => $ticket]), [
            'note' => '',
        ])
        ->assertSessionHasErrors(['note']);
});

test('user cannot add internal note to ticket of another team', function () {
    $user = User::factory()->create();
    $foreignUser = User::factory()->create();
    $foreignTeam = $foreignUser->currentTeam;

    $foreignTicket = Ticket::factory()->create([
        'team_id'    => $foreignTeam->id,
        'created_by' => $foreignUser->id,
    ]);

    $this->actingAs($user)
        ->post(route('tickets.notes.store', ['current_team' => $user->currentTeam->slug, 'ticket' => $foreignTicket]), [
            'note' => 'Attempted breach note',
        ])
        ->assertForbidden();

    expect(TicketActivity::where('ticket_id', $foreignTicket->id)->count())->toBe(0);
});
