<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('open')->index();
            $table->string('priority')->default('medium')->index();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->timestamp('due_at')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Composite indexes for optimized tenant-scoped filtered queries
            $table->index(['team_id', 'status', 'priority', 'created_at']);
            $table->index(['team_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
