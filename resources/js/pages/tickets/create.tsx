import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    LoaderCircle,
    Send,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { create, index, store } from '@/routes/tickets';
import type { PriorityOption, TicketPriority } from '@/types';

interface TicketsCreateProps {
    priorities: PriorityOption[];
}

export default function TicketsCreate({ priorities }: TicketsCreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        description: string;
        priority: TicketPriority;
        customer_name: string;
        customer_email: string;
        due_at: string;
    }>({
        title: '',
        description: '',
        priority: 'medium',
        customer_name: '',
        customer_email: '',
        due_at: '',
    });

    const isUrgent = data.priority === 'urgent';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <>
            <Head title="Create Support Ticket" />

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Back Link & Header */}
                <div className="space-y-3">
                    <Link
                        href={index.url()}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Tickets
                    </Link>

                    <Heading
                        title="Create Support Ticket"
                        description="Log a new customer inquiry or incident with SLA priority tracking."
                    />
                </div>

                {/* Form Card */}
                <form
                    onSubmit={submit}
                    className="bg-card space-y-6 rounded-xl border p-6 shadow-xs"
                >
                    {/* Ticket Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Ticket Title{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. SAML SSO Authentication loop on login"
                            required
                            autoFocus
                            className="h-10 text-sm"
                        />
                        <InputError message={errors.title} />
                    </div>

                    {/* Customer Information Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                htmlFor="customer_name"
                                className="text-sm font-medium"
                            >
                                Customer Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customer_name"
                                name="customer_name"
                                value={data.customer_name}
                                onChange={(e) =>
                                    setData('customer_name', e.target.value)
                                }
                                placeholder="e.g. Sarah Connor"
                                required
                                className="h-10 text-sm"
                            />
                            <InputError message={errors.customer_name} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="customer_email"
                                className="text-sm font-medium"
                            >
                                Customer Email{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customer_email"
                                name="customer_email"
                                type="email"
                                value={data.customer_email}
                                onChange={(e) =>
                                    setData('customer_email', e.target.value)
                                }
                                placeholder="e.g. sconnor@cyberdyne.corp"
                                required
                                className="h-10 text-sm"
                            />
                            <InputError message={errors.customer_email} />
                        </div>
                    </div>

                    {/* Priority & Due Date Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                htmlFor="priority"
                                className="text-sm font-medium"
                            >
                                Priority Level{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={data.priority}
                                onValueChange={(val: TicketPriority) =>
                                    setData('priority', val)
                                }
                            >
                                <SelectTrigger
                                    id="priority"
                                    className="h-10 text-sm"
                                >
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((p) => (
                                        <SelectItem
                                            key={p.value}
                                            value={p.value}
                                        >
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.priority} />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="due_at"
                                className="flex items-center gap-1.5 text-sm font-medium"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                SLA Target Due Date{' '}
                                {isUrgent && (
                                    <span className="text-destructive font-bold">
                                        * (Required for Urgent)
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="due_at"
                                name="due_at"
                                type="datetime-local"
                                value={data.due_at}
                                onChange={(e) =>
                                    setData('due_at', e.target.value)
                                }
                                required={isUrgent}
                                className={`h-10 text-sm ${
                                    isUrgent && !data.due_at
                                        ? 'border-amber-500 ring-1 ring-amber-500/30'
                                        : ''
                                }`}
                            />
                            <InputError message={errors.due_at} />
                        </div>
                    </div>

                    {/* Urgent SLA Banner */}
                    {isUrgent && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-semibold">
                                    Urgent Priority Policy Enforcement
                                </p>
                                <p className="mt-0.5">
                                    Urgent tickets mandate an explicit target
                                    due date for SLA compliance monitoring.
                                    Tickets approaching within 4 hours or past
                                    deadline will automatically trigger SLA
                                    breach warnings.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Problem Description */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="description"
                            className="text-sm font-medium"
                        >
                            Problem Description{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={6}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Provide comprehensive details, error messages, environment details, or steps to reproduce..."
                            required
                            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent p-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        />
                        <InputError message={errors.description} />
                    </div>

                    {/* Form Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-5">
                        <Link href={index.url()}>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-2 shadow-xs"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Create Ticket
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

TicketsCreate.layout = {
    breadcrumbs: [
        {
            title: 'Support Tickets',
            href: index.url(),
        },
        {
            title: 'Create Ticket',
            href: create.url(),
        },
    ],
};
