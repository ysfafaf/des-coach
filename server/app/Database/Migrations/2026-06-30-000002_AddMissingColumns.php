<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMissingColumns extends Migration
{
    public function up()
    {
        // Tambah kolom phone, position, gender ke tabel users
        // Masing-masing pakai ADD COLUMN IF NOT EXISTS agar aman dijalankan ulang
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL");
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100) DEFAULT NULL");
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(15) DEFAULT 'Laki-laki'");

        // Perbaiki allowedFields di migration saja (model akan di-update manual)
        echo "Kolom phone, position, gender berhasil ditambahkan ke tabel users.\n";

        // Tambah kolom description ke tabel followups jika belum ada
        // (CoachingController menggunakan 'description' tapi FollowupModel pakai 'followup_item')
        $this->db->query("ALTER TABLE followups ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL");
        echo "Kolom description berhasil ditambahkan ke tabel followups.\n";

        // Tambahkan nilai enum 'done' ke session_status jika belum (sudah ada dari cek awal)
        // Tambahkan nilai enum 'completed' ke coaching_sessions.status agar konsisten
        // Note: di Supabase sudah ada 'done' dan 'ongoing', frontend kita map keduanya
    }

    public function down()
    {
        $this->db->query("ALTER TABLE users DROP COLUMN IF EXISTS phone");
        $this->db->query("ALTER TABLE users DROP COLUMN IF EXISTS position");
        $this->db->query("ALTER TABLE users DROP COLUMN IF EXISTS gender");
        $this->db->query("ALTER TABLE followups DROP COLUMN IF EXISTS description");
    }
}
