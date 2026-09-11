<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Team;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\User;
use Illuminate\Database\Seeder;

final class TicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $agent = User::first() ?? User::factory()->create([
            'name'  => 'Support Lead',
            'email' => 'test@example.com',
        ]);

        $team = $agent->currentTeam ?? $agent->personalTeam();
        if (! $team) {
            $team = Team::factory()->create([
                'name' => "Support Lead's Team",
            ]);
            $agent->teams()->attach($team, ['role' => 'owner']);
            $agent->switchTeam($team);
        }

        $sampleTickets = [
            [
                'title'          => 'SSO SAML authentication loop with Okta',
                'description'    => 'Enterprise customers from Acme Corp are unable to sign in via SAML. They are redirected back to the login screen after entering 2FA.',
                'status'         => TicketStatus::InProgress,
                'priority'       => TicketPriority::Urgent,
                'customer_name'  => 'Sarah Jenkins',
                'customer_email' => 'sarah.jenkins@acmeworks.com',
                'due_at'         => now()->subHours(2), // Breached SLA
                'notes'          => 'Investigated SAML assertion expiry. Requested updated metadata XML from client IT team.',
            ],
            [
                'title'          => 'Webhook notification deliveries timing out (HTTP 504)',
                'description'    => 'Outbound webhooks for ticket updates are failing with 504 Gateway Timeout on endpoint https://api.partner.io/v1/events.',
                'status'         => TicketStatus::Open,
                'priority'       => TicketPriority::Urgent,
                'customer_name'  => 'Marcus Vance',
                'customer_email' => 'm.vance@partner.io',
                'due_at'         => now()->addHours(3), // Due soon
                'notes'          => null,
            ],
            [
                'title'          => 'Invoice discrepancy for Enterprise annual renewal',
                'description'    => 'The invoice sent yesterday shows $12,000 instead of the contracted $10,500 negotiated with sales.',
                'status'         => TicketStatus::Open,
                'priority'       => TicketPriority::High,
                'customer_name'  => 'Elena Rostova',
                'customer_email' => 'elena@vanguardfinance.org',
                'due_at'         => now()->addDays(2),
                'notes'          => null,
            ],
            [
                'title'          => 'Password reset token expired too quickly',
                'description'    => 'Customer reported that the reset link expired within 5 minutes instead of the default 60 minutes.',
                'status'         => TicketStatus::Resolved,
                'priority'       => TicketPriority::Medium,
                'customer_name'  => 'David Kim',
                'customer_email' => 'david.kim@nexuscloud.dev',
                'due_at'         => null,
                'notes'          => 'Fixed cache key expiration in Fortify config. Customer verified successful reset.',
            ],
            [
                'title'          => 'Exporting audit logs to CSV times out on 50k+ records',
                'description'    => 'When exporting the compliance audit trail for Q3, the request triggers a 500 error after 60 seconds.',
                'status'         => TicketStatus::InProgress,
                'priority'       => TicketPriority::High,
                'customer_name'  => 'Amira Patel',
                'customer_email' => 'amira.patel@fintechglobal.com',
                'due_at'         => now()->addDays(1),
                'notes'          => 'Refactoring export to use streamed responses with cursor chunking.',
            ],
            [
                'title'          => 'Update billing contact email address',
                'description'    => 'Please update our primary billing email from accounts-old@helios.co to accounts@helios.co.',
                'status'         => TicketStatus::Closed,
                'priority'       => TicketPriority::Low,
                'customer_name'  => 'Julian Alvarez',
                'customer_email' => 'accounts@helios.co',
                'due_at'         => null,
                'notes'          => 'Updated in Stripe customer record and verified verification email receipt.',
            ],
            [
                'title'          => 'Feature request: Add Webhook event for ticket reassignment',
                'description'    => 'We would love to trigger a Slack notification via webhook whenever a ticket is assigned to a different tier.',
                'status'         => TicketStatus::Open,
                'priority'       => TicketPriority::Low,
                'customer_name'  => 'Claire Beauchamp',
                'customer_email' => 'claire@highlandmedia.co.uk',
                'due_at'         => null,
                'notes'          => null,
            ],
            [
                'title'          => 'API Rate Limit exceeded unexpectedly during scheduled sync',
                'description'    => 'Our nightly sync job hit the 429 Too Many Requests response at 02:00 UTC despite being well within 60 rpm.',
                'status'         => TicketStatus::InProgress,
                'priority'       => TicketPriority::Medium,
                'customer_name'  => 'Thomas Wright',
                'customer_email' => 'twright@synclabs.ai',
                'due_at'         => null,
                'notes'          => 'Checked Redis rate limiter key bucket. Found duplicate cron running concurrently.',
            ],
            [
                'title'          => 'Dark mode contrast issue on ticket table headers',
                'description'    => 'In dark mode, the column header text has low contrast against the zinc-900 background.',
                'status'         => TicketStatus::Resolved,
                'priority'       => TicketPriority::Low,
                'customer_name'  => 'Hannah Scott',
                'customer_email' => 'hannah@designcraft.studio',
                'due_at'         => null,
                'notes'          => 'Adjusted text color utility from text-muted to text-foreground/80.',
            ],
            [
                'title'          => 'Cannot add new team member with special characters in name',
                'description'    => 'Inviting user with name "François Müller" throws a regex validation exception.',
                'status'         => TicketStatus::Closed,
                'priority'       => TicketPriority::Medium,
                'customer_name'  => 'Jean-Luc Picard',
                'customer_email' => 'jeanluc@starfleet-enterprises.net',
                'due_at'         => null,
                'notes'          => 'Updated validation rule to allow Unicode letter characters (/p{L}).',
            ],
        ];

        foreach ($sampleTickets as $data) {
            $notes = $data['notes'];
            unset($data['notes']);

            $ticket = Ticket::create([
                ...$data,
                'team_id'    => $team->id,
                'created_by' => $agent->id,
            ]);

            // Create initial creation activity
            TicketActivity::create([
                'ticket_id'  => $ticket->id,
                'user_id'    => $agent->id,
                'type'       => 'created',
                'content'    => 'Ticket was created.',
                'created_at' => $ticket->created_at ?? now()->subDays(2),
            ]);

            // If status progressed beyond open, add transition activity
            if ($ticket->status !== TicketStatus::Open) {
                TicketActivity::create([
                    'ticket_id'  => $ticket->id,
                    'user_id'    => $agent->id,
                    'type'       => 'status_changed',
                    'content'    => "Status changed to {$ticket->status->label()}.",
                    'properties' => [
                        'from' => TicketStatus::Open->value,
                        'to'   => $ticket->status->value,
                    ],
                    'created_at' => now()->subHours(8),
                ]);
            }

            // If an internal note was provided, log it
            if ($notes) {
                TicketActivity::create([
                    'ticket_id'  => $ticket->id,
                    'user_id'    => $agent->id,
                    'type'       => 'internal_note',
                    'content'    => $notes,
                    'created_at' => now()->subHours(4),
                ]);
            }
        }
    }
}
