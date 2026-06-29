<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAllTables extends Migration
{
    public function up()
    {
        // 1. USERS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT \'Karyawan\',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                token VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 2. CATEGORIES
        $this->db->query('
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 3. ROOMS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT DEFAULT NULL
            )
        ');

        // 4. SCHEDULES
        $this->db->query('
            CREATE TABLE IF NOT EXISTS schedules (
                id SERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                topic TEXT NOT NULL,
                scheduled_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                mode VARCHAR(10) NOT NULL DEFAULT \'online\',
                meet_link TEXT DEFAULT NULL,
                room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
                reminder_at TIMESTAMP DEFAULT NULL,
                status VARCHAR(20) NOT NULL DEFAULT \'pending\',
                duration_minutes INTEGER DEFAULT NULL,
                cancelled_reason TEXT DEFAULT NULL,
                deleted_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 5. COACHING SESSIONS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS coaching_sessions (
                id SERIAL PRIMARY KEY,
                schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
                notes TEXT DEFAULT NULL,
                started_at TIMESTAMP DEFAULT NULL,
                ended_at TIMESTAMP DEFAULT NULL,
                status VARCHAR(20) NOT NULL DEFAULT \'ongoing\'
            )
        ');

        // 6. FEEDBACK
        $this->db->query('
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
                employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                coach_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL DEFAULT 5,
                comment TEXT DEFAULT NULL,
                is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 7. FEEDBACK REPLIES
        $this->db->query('
            CREATE TABLE IF NOT EXISTS feedback_replies (
                id SERIAL PRIMARY KEY,
                feedback_id INTEGER NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
                replied_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reply TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 8. FOLLOWUPS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS followups (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 9. NOTIFICATIONS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) DEFAULT \'email\',
                subject VARCHAR(255) DEFAULT NULL,
                body TEXT DEFAULT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // 10. PASSWORD RESETS
        $this->db->query('
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                email VARCHAR(150) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');
    }

    public function down()
    {
        $tables = [
            'password_resets', 'notifications', 'followups',
            'feedback_replies', 'feedback', 'coaching_sessions',
            'schedules', 'rooms', 'categories', 'users'
        ];
        foreach ($tables as $table) {
            $this->db->query("DROP TABLE IF EXISTS {$table} CASCADE");
        }
    }
}
