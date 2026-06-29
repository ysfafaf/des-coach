<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class MainSeeder extends Seeder
{
    public function run()
    {
        $now = date('Y-m-d H:i:s');

        // ─── USERS ────────────────────────────────────────────────────────────
        $users = [
            [
                'name'          => 'Admin System',
                'email'         => 'admin@desnet.id',
                'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
                'role'          => 'Admin',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'name'          => 'Budi (HOD)',
                'email'         => 'hod@desnet.id',
                'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
                'role'          => 'HOD',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'name'          => 'Siti (Supervisi)',
                'email'         => 'supervisi@desnet.id',
                'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
                'role'          => 'Supervisi',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'name'          => 'Andi (Karyawan)',
                'email'         => 'karyawan@desnet.id',
                'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
                'role'          => 'Karyawan',
                'is_active'     => true,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
        ];

        // Insert users (skip if email already exists)
        foreach ($users as $user) {
            $exists = $this->db->table('users')->where('email', $user['email'])->countAllResults();
            if ($exists === 0) {
                $this->db->table('users')->insert($user);
            }
        }

        // ─── CATEGORIES ───────────────────────────────────────────────────────
        $categories = [
            'Kinerja Kerja (KPI)',
            'Pengembangan Karir',
            'Kesehatan Mental & Stres',
            'Komunikasi Tim',
            'Manajemen Waktu',
            'Resolusi Konflik',
            'Keseimbangan Hidup (Work-Life Balance)',
            'Kepemimpinan (Leadership)',
            'Motivasi & Burnout',
            'Adaptasi Budaya Kerja Baru',
        ];

        foreach ($categories as $cat) {
            $exists = $this->db->table('categories')->where('name', $cat)->countAllResults();
            if ($exists === 0) {
                $this->db->table('categories')->insert(['name' => $cat, 'created_at' => $now]);
            }
        }

        // ─── ROOMS ────────────────────────────────────────────────────────────
        $rooms = [
            ['name' => 'Ruangan Alpha', 'description' => 'Lantai 2 - Samping Lift'],
            ['name' => 'Ruangan Beta',  'description' => 'Lantai 2 - Dekat Pantry'],
            ['name' => 'Ruangan Gamma', 'description' => 'Lantai 3 - Ruang Utama'],
            ['name' => 'Ruangan Delta', 'description' => 'Lantai 3 - Dekat Balkon'],
            ['name' => 'Ruangan Epsilon', 'description' => 'Lantai 4 - Ruang Direksi'],
        ];

        foreach ($rooms as $room) {
            $exists = $this->db->table('rooms')->where('name', $room['name'])->countAllResults();
            if ($exists === 0) {
                $this->db->table('rooms')->insert($room);
            }
        }

        echo "✅ Seeder selesai: 4 users, 10 categories, 5 rooms.\n";
        echo "📧 Login dengan: admin@desnet.id / hod@desnet.id / supervisi@desnet.id / karyawan@desnet.id\n";
        echo "🔑 Password semua: password123\n";
    }
}
