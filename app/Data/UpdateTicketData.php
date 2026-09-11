<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\TicketPriority;
use App\Http\Requests\Tickets\UpdateTicketRequest;
use Carbon\CarbonImmutable;

final readonly class UpdateTicketData
{
    public function __construct(
        public string $title,
        public string $description,
        public TicketPriority $priority,
        public string $customerName,
        public string $customerEmail,
        public bool $hasDueAt,
        public ?CarbonImmutable $dueAt = null,
    ) {}

    public static function fromRequest(UpdateTicketRequest $request): self
    {
        /** @var array{title: string, description: string, priority: string|TicketPriority, customer_name: string, customer_email: string, due_at?: string|null} $validated */
        $validated = $request->validated();

        return self::fromArray($validated);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $priority = $data['priority'] instanceof TicketPriority
            ? $data['priority']
            : TicketPriority::from((string) $data['priority']);

        $hasDueAt = array_key_exists('due_at', $data);
        $dueAt = null;
        if (! empty($data['due_at'])) {
            $dueAt = CarbonImmutable::parse((string) $data['due_at']);
        }

        return new self(
            title: (string) $data['title'],
            description: (string) $data['description'],
            priority: $priority,
            customerName: (string) $data['customer_name'],
            customerEmail: (string) $data['customer_email'],
            hasDueAt: $hasDueAt,
            dueAt: $dueAt,
        );
    }
}
