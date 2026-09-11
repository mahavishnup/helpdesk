<?php

declare(strict_types=1);

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to login when accessing ticket list', function () {
    $this->get(route('tickets.index'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view tickets with pagination', function () {
    $user = User::factory()->create();
    Ticket::factory()->count(25)->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->get(route('tickets.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('tickets/index')
                ->has('tickets.data', 15)
                ->where('tickets.total', 25)
                ->has('filters')
                ->has('statuses')
                ->has('priorities')
        );
});

test('tickets can be searched by title, description, and customer', function () {
    $user = User::factory()->create();

    Ticket::factory()->create([
        'title'         => 'Unique Alpha Search Term',
        'customer_name' => 'General Kenobi',
        'created_by'    => $user->id,
    ]);

    Ticket::factory()->create([
        'title'         => 'Standard Routine Maintenance',
        'customer_name' => 'Luke Skywalker',
        'created_by'    => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', ['search' => 'Alpha']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('tickets/index')
                ->has('tickets.data', 1)
                ->where('tickets.data.0.title', 'Unique Alpha Search Term')
        );

    $this->actingAs($user)
        ->get(route('tickets.index', ['search' => 'Kenobi']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tickets.data', 1)
                ->where('tickets.data.0.customer_name', 'General Kenobi')
        );
});

test('tickets can be filtered by status and priority', function () {
    $user = User::factory()->create();

    Ticket::factory()->create([
        'status'     => TicketStatus::InProgress,
        'priority'   => TicketPriority::Urgent,
        'due_at'     => now()->addHours(2),
        'created_by' => $user->id,
    ]);

    Ticket::factory()->create([
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Low,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', [
            'status'   => 'in_progress',
            'priority' => 'urgent',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tickets.data', 1)
                ->where('tickets.data.0.status', 'in_progress')
                ->where('tickets.data.0.priority', 'urgent')
        );
});

test('tickets can be filtered by SLA health status', function () {
    $user = User::factory()->create();

    // Breached ticket
    Ticket::factory()->create([
        'title'      => 'Breached Ticket',
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Urgent,
        'due_at'     => now()->subHours(5),
        'created_by' => $user->id,
    ]);

    // On track ticket
    Ticket::factory()->create([
        'title'      => 'On Track Ticket',
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Medium,
        'due_at'     => now()->addDays(3),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', ['sla' => 'breached']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tickets.data', 1)
                ->where('tickets.data.0.title', 'Breached Ticket')
        );
});

test('tickets can be exported to streamed CSV', function () {
    $user = User::factory()->create();

    Ticket::factory()->create([
        'title'          => 'CSV Exportable Ticket',
        'customer_name'  => 'Elena Fisher',
        'customer_email' => 'elena@naughtydog.com',
        'status'         => TicketStatus::Open,
        'priority'       => TicketPriority::High,
        'created_by'     => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('tickets.export', ['search' => 'Exportable']));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    expect($content)->toContain('Ticket ID', 'Title', 'Customer Name', 'CSV Exportable Ticket', 'elena@naughtydog.com');
});
