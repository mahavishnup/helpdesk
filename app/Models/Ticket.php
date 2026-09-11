<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Database\Factories\TicketFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $team_id
 * @property string $title
 * @property string $description
 * @property TicketStatus $status
 * @property TicketPriority $priority
 * @property string $customer_name
 * @property string $customer_email
 * @property Carbon|null $due_at
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Team $team
 * @property-read User|null $createdBy
 * @property-read string $sla_status
 * @property-read bool $can_be_edited
 */
#[Fillable([
    'team_id',
    'title',
    'description',
    'status',
    'priority',
    'customer_name',
    'customer_email',
    'due_at',
    'created_by',
])]
final class Ticket extends Model
{
    /** @use HasFactory<TicketFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'sla_status',
        'can_be_edited',
    ];

    /**
     * The tenant team that owns this ticket.
     *
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * The user who created the support ticket.
     *
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The audit history and internal notes timeline for this ticket.
     *
     * @return HasMany<TicketActivity, $this>
     */
    public function activities(): HasMany
    {
        return $this->hasMany(TicketActivity::class)->orderBy('created_at', 'desc');
    }

    /**
     * Scope query to a specific tenant team.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeForTeam(Builder $query, Team | int $team): Builder
    {
        $teamId = $team instanceof Team ? $team->id : $team;

        return $query->where('team_id', $teamId);
    }

    /**
     * Scope query to search across ticket title, description, and customer information.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhere('customer_name', 'like', "%{$term}%")
                ->orWhere('customer_email', 'like', "%{$term}%");
        });
    }

    /**
     * Scope query by ticket status.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        if (blank($status)) {
            return $query;
        }

        return $query->where('status', $status);
    }

    /**
     * Scope query by ticket priority.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeFilterPriority(Builder $query, ?string $priority): Builder
    {
        if (blank($priority)) {
            return $query;
        }

        return $query->where('priority', $priority);
    }

    /**
     * Scope query by SLA status (breached, due_soon, on_track).
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeFilterSla(Builder $query, ?string $sla): Builder
    {
        if (blank($sla)) {
            return $query;
        }

        $activeQuery = $query->whereNotNull('due_at')
            ->whereNotIn('status', [TicketStatus::Resolved->value, TicketStatus::Closed->value]);

        return match ($sla) {
            'breached' => $activeQuery->where('due_at', '<', now()),
            'due_soon' => $activeQuery->whereBetween('due_at', [now(), now()->addHours(4)]),
            'on_track' => $activeQuery->where('due_at', '>', now()->addHours(4)),
            default    => $query,
        };
    }

    /**
     * Compute the real-time SLA health status.
     */
    public function getSlaStatusAttribute(): string
    {
        if (! $this->due_at || $this->status === TicketStatus::Resolved || $this->status === TicketStatus::Closed) {
            return 'none';
        }

        if ($this->due_at->isPast()) {
            return 'breached';
        }

        if ($this->due_at->diffInHours(now()) <= 4) {
            return 'due_soon';
        }

        return 'on_track';
    }

    /**
     * Determine if ticket can be edited (closed tickets are immutable).
     */
    public function getCanBeEditedAttribute(): bool
    {
        return $this->status !== TicketStatus::Closed;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status'   => TicketStatus::class,
            'priority' => TicketPriority::class,
            'due_at'   => 'datetime',
        ];
    }
}
