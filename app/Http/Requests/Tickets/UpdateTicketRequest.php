<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Enums\TicketPriority;
use App\Models\Ticket;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if ($this->user() === null) {
            return false;
        }

        $ticket = $this->route('ticket');

        if (! $ticket instanceof Ticket) {
            return false;
        }

        // Closed tickets cannot be edited (terminal state)
        return $ticket->can_be_edited;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'          => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string'],
            'priority'       => ['required', Rule::enum(TicketPriority::class)],
            'customer_name'  => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'string', 'email', 'max:255'],
            'due_at'         => [
                'nullable',
                'date',
                Rule::requiredIf(fn () => $this->input('priority') === TicketPriority::Urgent->value),
            ],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'customer_name'  => 'customer name',
            'customer_email' => 'customer email',
            'due_at'         => 'due date',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'due_at.required' => 'A due date is required when priority is set to Urgent.',
        ];
    }
}
