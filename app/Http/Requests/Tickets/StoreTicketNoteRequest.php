<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class StoreTicketNoteRequest extends FormRequest
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
            'content' => ['required_without:note', 'nullable', 'string', 'min:2', 'max:2000'],
            'note'    => ['required_without:content', 'nullable', 'string', 'min:2', 'max:2000'],
        ];
    }

    public function noteContent(): string
    {
        return (string) ($this->input('content') ?? $this->input('note'));
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'content' => 'internal note content',
        ];
    }
}
