<?php
require 'vendor/autoload.php';
$app = new \CodeIgniter\CodeIgniter(new \Config\Paths());
$app->initialize();
$db = \Config\Database::connect();
$users = $db->table('users')->get()->getResultArray();
echo "USERS:\n";
print_r($users);

// Delete all sessions to fulfill user request "Coba hapus semua sesi yang sudah ada"
echo "\nDELETING ALL SESSIONS...\n";
$db->table('feedback_replies')->truncate();
$db->table('feedback')->truncate();
$db->table('followups')->truncate();
$db->table('coaching_sessions')->truncate();
$db->table('schedules')->truncate();
echo "DONE DELETING.\n";
