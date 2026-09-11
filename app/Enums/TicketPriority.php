<?php

declare(strict_types=1);

namespace App\Enums;

enum TicketPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Urgent = 'urgent';

    /**
     * Human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::Low    => 'Low',
            self::Medium => 'Medium',
            self::High   => 'High',
            self::Urgent => 'Urgent',
        };
    }

    /**
     * Determine if this priority strictly requires a due date.
     */
    public function requiresDueDate(): bool
    {
        return $this === self::Urgent;
    }

    /**
     * Badge color token for frontend styling.
     */
    public function color(): string
    {
        return match ($this) {
            self::Low    => 'slate',
            self::Medium => 'sky',
            self::High   => 'amber',
            self::Urgent => 'rose',
        };
    }

    /**
     * Numerical weight for sorting priorities.
     */
    public function weight(): int
    {
        return match ($this) {
            self::Low    => 1,
            self::Medium => 2,
            self::High   => 3,
            self::Urgent => 4,
        };
    }
}
