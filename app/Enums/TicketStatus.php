<?php

declare(strict_types=1);

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';

    /**
     * Human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Open       => 'Open',
            self::InProgress => 'In Progress',
            self::Resolved   => 'Resolved',
            self::Closed     => 'Closed',
        };
    }

    /**
     * Check if a transition from current status to target status is permitted.
     */
    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * List of allowed target statuses according to business rules.
     *
     * Rules:
     * - open -> in_progress, resolved
     * - in_progress -> open, resolved
     * - resolved -> in_progress, closed
     * - closed -> none (terminal state)
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Open       => [self::InProgress, self::Resolved],
            self::InProgress => [self::Open, self::Resolved],
            self::Resolved   => [self::InProgress, self::Closed],
            self::Closed     => [],
        };
    }

    /**
     * Determine if this status is terminal.
     */
    public function isClosed(): bool
    {
        return $this === self::Closed;
    }

    /**
     * Badge color token for frontend styling.
     */
    public function color(): string
    {
        return match ($this) {
            self::Open       => 'blue',
            self::InProgress => 'amber',
            self::Resolved   => 'emerald',
            self::Closed     => 'slate',
        };
    }
}
