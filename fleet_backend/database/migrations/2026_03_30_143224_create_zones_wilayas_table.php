<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('zones_wilayas', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->unsignedTinyInteger('code_wilaya')->unique();
            $table->longText('polygone');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones_wilayas');
    }
};
