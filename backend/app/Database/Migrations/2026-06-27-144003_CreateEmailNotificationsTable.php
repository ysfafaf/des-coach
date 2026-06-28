<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateEmailNotificationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'VARCHAR', 'constraint' => 36],
            'recipientEmail' => ['type' => 'VARCHAR', 'constraint' => 255],
            'subject' => ['type' => 'VARCHAR', 'constraint' => 255],
            'body' => ['type' => 'TEXT'],
            'read' => ['type' => 'BOOLEAN', 'default' => false],
            'timestamp' => ['type' => 'DATETIME'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('email_notifications');
    }

    public function down()
    {
        $this->forge->dropTable('email_notifications');
    }
}
