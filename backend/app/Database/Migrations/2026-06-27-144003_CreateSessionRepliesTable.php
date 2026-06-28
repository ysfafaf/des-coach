<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSessionRepliesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'VARCHAR', 'constraint' => 36],
            'sessionId' => ['type' => 'VARCHAR', 'constraint' => 36],
            'authorId' => ['type' => 'VARCHAR', 'constraint' => 36],
            'content' => ['type' => 'TEXT'],
            'timestamp' => ['type' => 'DATETIME'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('sessionId', 'coaching_sessions', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('authorId', 'app_users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('session_replies');
    }

    public function down()
    {
        $this->forge->dropTable('session_replies');
    }
}
