<?php

declare(strict_types=1);

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to login when accessing ticket list', function () {
    $this->get('/acme/tickets')
        ->assertRedirect(route('login'));
});

test('root tickets route redirects authenticated user to their active tenant tickets', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)
        ->get(route('tickets.root'))
        ->assertRedirect(route('tickets.index', ['current_team' => $team->slug]));
});

test('authenticated user can view tickets with pagination', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    Ticket::factory()->count(25)->create([
        'team_id'    => $team->id,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', ['current_team' => $team->slug]))
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
    $team = $user->currentTeam;

    Ticket::factory()->create([
        'team_id'       => $team->id,
        'title'         => 'Unique Alpha Search Term',
        'customer_name' => 'General Kenobi',
        'created_by'    => $user->id,
    ]);

    Ticket::factory()->create([
        'team_id'       => $team->id,
        'title'         => 'Standard Routine Maintenance',
        'customer_name' => 'Luke Skywalker',
        'created_by'    => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', ['current_team' => $team->slug, 'search' => 'Alpha']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('tickets/index')
                ->has('tickets.data', 1)
                ->where('tickets.data.0.title', 'Unique Alpha Search Term')
        );

    $this->actingAs($user)
        ->get(route('tickets.index', ['current_team' => $team->slug, 'search' => 'Kenobi']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tickets.data', 1)
                ->where('tickets.data.0.customer_name', 'General Kenobi')
        );
});

test('tickets can be filtered by status and priority', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Ticket::factory()->create([
        'team_id'    => $team->id,
        'status'     => TicketStatus::InProgress,
        'priority'   => TicketPriority::Urgent,
        'due_at'     => now()->addHours(2),
        'created_by' => $user->id,
    ]);

    Ticket::factory()->create([
        'team_id'    => $team->id,
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Low,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', [
            'current_team' => $team->slug,
            'status'       => 'in_progress',
            'priority'     => 'urgent',
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
    $team = $user->currentTeam;

    // Breached ticket
    Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'Breached Ticket',
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Urgent,
        'due_at'     => now()->subHours(5),
        'created_by' => $user->id,
    ]);

    // On track ticket
    Ticket::factory()->create([
        'team_id'    => $team->id,
        'title'      => 'On Track Ticket',
        'status'     => TicketStatus::Open,
        'priority'   => TicketPriority::Medium,
        'due_at'     => now()->addDays(3),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('tickets.index', [
            'current_team' => $team->slug,
            'sla'          => 'breached',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('tickets.data', 1)
                ->where('tickets.data.0.title', 'Breached Ticket')
        );
});

test('tickets can be exported to streamed CSV', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Ticket::factory()->create([
        'team_id'        => $team->id,
        'title'          => 'CSV Exportable Ticket',
        'customer_name'  => 'Elena Fisher',
        'customer_email' => 'elena@naughtydog.com',
        'status'         => TicketStatus::Open,
        'priority'       => TicketPriority::High,
        'created_by'     => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('tickets.export', ['current_team' => $team->slug, 'search' => 'Exportable']));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    ob_start();
    $response->sendContent();
    $content = ob_get_clean();

    expect($content)->toContain('Ticket ID', 'Title', 'Customer Name', 'CSV Exportable Ticket', 'elena@naughtydog.com');
});

test('tickets belonging to other teams are completely isolated from listing', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Ticket::factory()->create([
        'team_id'    => $user->currentTeam->id,
        'title'      => 'Team Alpha Unique Ticket',
        'created_by' => $user->id,
    ]);

    Ticket::factory()->create([
        'team_id'    => $otherUser->currentTeam->id,
        'title'      => 'Team Beta Private Ticket',
        'created_by' => $otherUser->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('tickets.index', ['current_team' => $user->currentTeam->slug]));

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
            ->has('tickets.data', 1)
            ->where('tickets.data.0.title', 'Team Alpha Unique Ticket')
    );
});
