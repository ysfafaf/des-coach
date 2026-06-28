<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCoachingSessionsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'VARCHAR', 'constraint' => 36],
            'employeeId' => ['type' => 'VARCHAR', 'constraint' => 36],
            'coachId' => ['type' => 'VARCHAR', 'constraint' => 36],
            'topic' => ['type' => 'VARCHAR', 'constraint' => 255],
            'category' => ['type' => 'VARCHAR', 'constraint' => 100],
            'date' => ['type' => 'DATE'],
            'startTime' => ['type' => 'TIME'],
            'endTime' => ['type' => 'TIME'],
            'mode' => ['type' => 'VARCHAR', 'constraint' => 20],
            'meetingLink' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'roomName' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
            'reminderMinutes' => ['type' => 'INT', 'default' => 0],
            'isCompleted' => ['type' => 'BOOLEAN', 'default' => false],
            'status' => ['type' => 'VARCHAR', 'constraint' => 50, 'default' => 'Scheduled'],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'followUp' => ['type' => 'TEXT', 'null' => true], // stored as JSON
            'rating' => ['type' => 'INT', 'null' => true],
            'feedbackComment' => ['type' => 'TEXT', 'null' => true],
            'isAnonymous' => ['type' => 'BOOLEAN', 'default' => false],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('employeeId', 'app_users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('coachId', 'app_users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('coaching_sessions');
    }

    public function down()
    {
        $this->forge->dropTable('coaching_sessions');
    }
}
