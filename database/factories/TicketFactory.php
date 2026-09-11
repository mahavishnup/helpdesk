<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
final class TicketFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<Ticket>
     */
    protected $model = Ticket::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title'       => fake()->sentence(rand(4, 7)),
            'description' => fake()->paragraphs(rand(1, 3), true),
            'status'      => TicketStatus::Open,
            'priority'    => fake()->randomElement([
                TicketPriority::Low,
                TicketPriority::Medium,
                TicketPriority::High,
            ]),
            'customer_name'  => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'due_at'         => null,
            'created_by'     => User::factory(),
        ];
    }

    /**
     * Indicate that the ticket is open.
     */
    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Open,
        ]);
    }

    /**
     * Indicate that the ticket is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::InProgress,
        ]);
    }

    /**
     * Indicate that the ticket is resolved.
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Resolved,
        ]);
    }

    /**
     * Indicate that the ticket is closed.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Closed,
        ]);
    }

    /**
     * Indicate that the ticket has urgent priority (with mandatory due date).
     */
    public function urgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TicketPriority::Urgent,
            'due_at'   => now()->addDays(2),
        ]);
    }

    /**
     * Indicate that the ticket has breached its SLA.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TicketPriority::Urgent,
            'status'   => TicketStatus::InProgress,
            'due_at'   => now()->subHours(6),
        ]);
    }

    /**
     * Indicate that the ticket is approaching SLA breach within 4 hours.
     */
    public function dueSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TicketPriority::Urgent,
            'status'   => TicketStatus::Open,
            'due_at'   => now()->addHours(2),
        ]);
    }
}
