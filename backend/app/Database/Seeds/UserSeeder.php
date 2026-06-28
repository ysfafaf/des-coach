<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        $users = [
            [
                'id'       => 'admin-1234-5678-9012-345678901234',
                'name'     => 'Admin System',
                'email'    => 'admin@desnet.id',
                'phone'    => '081234567890',
                'gender'   => 'Laki-laki',
                'position' => 'Administrator',
                'role'     => 'Admin',
                'status'   => 'Active',
                'password' => password_hash('password123', PASSWORD_BCRYPT),
            ],
            [
                'id'       => 'hod-1234-5678-9012-345678901234',
                'name'     => 'Budi (HOD)',
                'email'    => 'hod@desnet.id',
                'phone'    => '081234567891',
                'gender'   => 'Laki-laki',
                'position' => 'Head of Department',
                'role'     => 'HOD',
                'status'   => 'Active',
                'password' => password_hash('password123', PASSWORD_BCRYPT),
            ],
            [
                'id'       => 'spv-1234-5678-9012-345678901234',
                'name'     => 'Siti (Supervisi)',
                'email'    => 'supervisi@desnet.id',
                'phone'    => '081234567892',
                'gender'   => 'Perempuan',
                'position' => 'Supervisor',
                'role'     => 'Supervisi',
                'status'   => 'Active',
                'password' => password_hash('password123', PASSWORD_BCRYPT),
            ],
            [
                'id'       => 'emp-1234-5678-9012-345678901234',
                'name'     => 'Andi (Karyawan)',
                'email'    => 'karyawan@desnet.id',
                'phone'    => '081234567893',
                'gender'   => 'Laki-laki',
                'position' => 'Staff IT',
                'role'     => 'Karyawan',
                'status'   => 'Active',
                'password' => password_hash('password123', PASSWORD_BCRYPT),
            ]
        ];

        // Using query builder directly to skip Model validation for seeding
        $this->db->table('app_users')->insertBatch($users);
    }
}
