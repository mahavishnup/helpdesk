<?php

declare(strict_types=1);

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

test('tickets can transition through valid lifecycle states', function () {
    $user = User::factory()->create();

    $ticket = Ticket::factory()->create([
        'status'     => TicketStatus::Open,
        'created_by' => $user->id,
    ]);

    // Open -> In Progress
    $this->actingAs($user)
        ->post(route('tickets.status.update', $ticket), ['status' => 'in_progress'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::InProgress);

    // In Progress -> Resolved
    $this->actingAs($user)
        ->post(route('tickets.status.update', $ticket), ['status' => 'resolved'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::Resolved);

    // Resolved -> Closed
    $this->actingAs($user)
        ->post(route('tickets.status.update', $ticket), ['status' => 'closed'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($ticket->fresh()->status)->toBe(TicketStatus::Closed);
});

test('tickets in closed state cannot transition to any other status', function () {
    $user = User::factory()->create();

    $ticket = Ticket::factory()->create([
        'status'     => TicketStatus::Closed,
        'created_by' => $user->id,
    ]);

    // Attempting to reopen a closed ticket must fail validation
    $response = $this->actingAs($user)
        ->post(route('tickets.status.update', $ticket), ['status' => 'open']);

    $response->assertSessionHasErrors(['status']);
    expect($ticket->fresh()->status)->toBe(TicketStatus::Closed);
});

test('tickets in closed state cannot be updated', function () {
    $user = User::factory()->create();

    $ticket = Ticket::factory()->create([
        'title'      => 'Original Closed Title',
        'status'     => TicketStatus::Closed,
        'priority'   => TicketPriority::Low,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->put(route('tickets.update', $ticket), [
            'title'          => 'Attempted New Title',
            'description'    => 'Attempted New Description',
            'priority'       => TicketPriority::High->value,
            'customer_name'  => 'New Customer',
            'customer_email' => 'new@customer.com',
        ]);

    $response->assertForbidden();
    expect($ticket->fresh()->title)->toBe('Original Closed Title');
});
