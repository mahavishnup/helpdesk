<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\TicketPriority;
use App\Http\Requests\Tickets\StoreTicketRequest;
use Carbon\CarbonImmutable;

final readonly class CreateTicketData
{
    public function __construct(
        public int $teamId,
        public string $title,
        public string $description,
        public TicketPriority $priority,
        public string $customerName,
        public string $customerEmail,
        public ?CarbonImmutable $dueAt = null,
    ) {}

    public static function fromRequest(StoreTicketRequest $request, int $teamId): self
    {
        /** @var array{title: string, description: string, priority: string|TicketPriority, customer_name: string, customer_email: string, due_at?: string|null} $validated */
        $validated = $request->validated();

        return self::fromArray([...$validated, 'team_id' => $teamId]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $priority = $data['priority'] instanceof TicketPriority
            ? $data['priority']
            : TicketPriority::from((string) $data['priority']);

        $dueAt = null;
        if (! empty($data['due_at'])) {
            $dueAt = CarbonImmutable::parse((string) $data['due_at']);
        }

        return new self(
            teamId: (int) $data['team_id'],
            title: (string) $data['title'],
            description: (string) $data['description'],
            priority: $priority,
            customerName: (string) $data['customer_name'],
            customerEmail: (string) $data['customer_email'],
            dueAt: $dueAt,
        );
    }
}
