<?php

declare(strict_types=1);

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

test('guests are redirected to login when accessing ticket creation', function () {
    $this->get(route('tickets.create'))
        ->assertRedirect(route('login'));

    $this->post(route('tickets.store'), [])
        ->assertRedirect(route('login'));
});

test('authenticated user can view the ticket creation page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('tickets.create'))
        ->assertOk();
});

test('authenticated user can create a ticket with valid data', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('tickets.store'), [
        'title'          => 'Network connectivity timeout on API gateway',
        'description'    => 'Intermittent connection resets observed on production ingress controller.',
        'priority'       => TicketPriority::High->value,
        'customer_name'  => 'Sarah Connor',
        'customer_email' => 'sarah@cyberdyne.corp',
    ]);

    $ticket = Ticket::first();
    expect($ticket)->not->toBeNull()
        ->and($ticket->title)->toBe('Network connectivity timeout on API gateway')
        ->and($ticket->status)->toBe(TicketStatus::Open)
        ->and($ticket->priority)->toBe(TicketPriority::High)
        ->and($ticket->customer_name)->toBe('Sarah Connor')
        ->and($ticket->customer_email)->toBe('sarah@cyberdyne.corp')
        ->and($ticket->created_by)->toBe($user->id);

    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'user_id'   => $user->id,
        'type'      => 'created',
    ]);

    $response->assertRedirect(route('tickets.show', $ticket));
    $response->assertSessionHas('success');
});

test('ticket creation requires mandatory fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('tickets.store'), [])
        ->assertSessionHasErrors(['title', 'description', 'priority', 'customer_name', 'customer_email']);
});

test('customer email must be a valid email address', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('tickets.store'), [
        'title'          => 'Valid Title',
        'description'    => 'Valid Description',
        'priority'       => TicketPriority::Low->value,
        'customer_name'  => 'John Doe',
        'customer_email' => 'not-an-email',
    ])->assertSessionHasErrors(['customer_email']);
});

test('urgent priority strictly requires a target due date', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('tickets.store'), [
        'title'          => 'Urgent critical outage',
        'description'    => 'Database connection pool exhausted across all clusters.',
        'priority'       => TicketPriority::Urgent->value,
        'customer_name'  => 'John Connor',
        'customer_email' => 'john@resistance.org',
    ])->assertSessionHasErrors(['due_at']);
});

test('urgent priority succeeds when due date is provided', function () {
    $user = User::factory()->create();
    $dueAt = now()->addHours(6)->toDateTimeString();

    $this->actingAs($user)->post(route('tickets.store'), [
        'title'          => 'Urgent critical outage with SLA deadline',
        'description'    => 'Database connection pool exhausted across all clusters.',
        'priority'       => TicketPriority::Urgent->value,
        'customer_name'  => 'John Connor',
        'customer_email' => 'john@resistance.org',
        'due_at'         => $dueAt,
    ])->assertSessionHasNoErrors();

    $ticket = Ticket::first();
    expect($ticket)->not->toBeNull()
        ->and($ticket->priority)->toBe(TicketPriority::Urgent)
        ->and($ticket->due_at)->not->toBeNull();
});

test('non-urgent priorities allow omitting target due date', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('tickets.store'), [
        'title'          => 'Minor UI styling bug',
        'description'    => 'Button padding is slightly misaligned on mobile portrait.',
        'priority'       => TicketPriority::Low->value,
        'customer_name'  => 'Miles Dyson',
        'customer_email' => 'dyson@cyberdyne.corp',
    ])->assertSessionHasNoErrors();

    $ticket = Ticket::first();
    expect($ticket)->not->toBeNull()
        ->and($ticket->priority)->toBe(TicketPriority::Low)
        ->and($ticket->due_at)->toBeNull();
});
