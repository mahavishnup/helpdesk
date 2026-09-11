<?php

declare(strict_types=1);

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

test('tickets can transition through valid lifecycle states', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'status'     => TicketStatus::Open,
        'created_by' => $user->id,
    ]);

    // Open -> In Progress
    $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $team->slug, 'ticket' => $ticket]), ['status' => 'in_progress'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::InProgress);

    // In Progress -> Resolved
    $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $team->slug, 'ticket' => $ticket]), ['status' => 'resolved'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::Resolved);

    // Resolved -> Closed
    $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $team->slug, 'ticket' => $ticket]), ['status' => 'closed'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::Closed);
});

test('tickets in closed state cannot transition to any other status', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'status'     => TicketStatus::Closed,
        'created_by' => $user->id,
    ]);

    // Attempting to reopen a closed ticket must fail validation
    $response = $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $team->slug, 'ticket' => $ticket]), ['status' => 'open']);

    $response->assertSessionHasErrors(['status']);
    expect($ticket->fresh()->status)->toBe(TicketStatus::Closed);
});

test('tickets in closed state cannot be updated', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $ticket = Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'Original Closed Title',
        'status'     => TicketStatus::Closed,
        'priority'   => TicketPriority::Low,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->put(route('tickets.update', ['current_team' => $team->slug, 'ticket' => $ticket]), [
            'title'          => 'Attempted New Title',
            'description'    => 'Attempted New Description',
            'priority'       => TicketPriority::High->value,
            'customer_name'  => 'New Customer',
            'customer_email' => 'new@customer.com',
        ]);

    $response->assertForbidden();
    expect($ticket->fresh()->title)->toBe('Original Closed Title');
});

test('user from another team cannot transition status of foreign ticket', function () {
    $user = User::factory()->create();
    $foreignUser = User::factory()->create();
    $foreignTeam = $foreignUser->currentTeam;

    $foreignTicket = Ticket::factory()->create([
        'team_id'    => $foreignTeam->id,
        'status'     => TicketStatus::Open,
        'created_by' => $foreignUser->id,
    ]);

    $this->actingAs($user)
        ->post(route('tickets.status.update', ['current_team' => $user->currentTeam->slug, 'ticket' => $foreignTicket]), [
            'status' => 'in_progress',
        ])
        ->assertForbidden();

    expect($foreignTicket->fresh()->status)->toBe(TicketStatus::Open);
});

test('user from another team cannot update foreign ticket', function () {
    $user = User::factory()->create();
    $foreignUser = User::factory()->create();
    $foreignTeam = $foreignUser->currentTeam;

    $foreignTicket = Ticket::factory()->create([
        'team_id'     => $foreignTeam->id,
        'title'       => 'Foreign Safe Title',
        'description' => 'Original Description',
        'status'      => TicketStatus::Open,
        'priority'    => TicketPriority::Low,
        'created_by'  => $foreignUser->id,
    ]);

    $this->actingAs($user)
        ->put(route('tickets.update', ['current_team' => $user->currentTeam->slug, 'ticket' => $foreignTicket]), [
            'title'          => 'Hacked Title',
            'description'    => 'Hacked Description',
            'priority'       => TicketPriority::High->value,
            'customer_name'  => 'Foreign Attacker',
            'customer_email' => 'attacker@evil.corp',
        ])
        ->assertForbidden();

    expect($foreignTicket->fresh()->title)->toBe('Foreign Safe Title');
});
