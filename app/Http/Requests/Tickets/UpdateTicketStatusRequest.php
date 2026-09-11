<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateTicketStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status'  => ['required', 'string', Rule::enum(TicketStatus::class)],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Configure the validator instance with state machine transition checks.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $ticket = $this->route('ticket');

            if (! $ticket instanceof Ticket) {
                return;
            }

            $targetStatusString = $this->input('status');
            $targetStatus = is_string($targetStatusString) ? TicketStatus::tryFrom($targetStatusString) : null;

            if ($targetStatus === null) {
                return;
            }

            if (! $ticket->status->canTransitionTo($targetStatus)) {
                $validator->errors()->add(
                    'status',
                    "Cannot transition ticket from {$ticket->status->label()} to {$targetStatus->label()}."
                );
            }
        });
    }
}
