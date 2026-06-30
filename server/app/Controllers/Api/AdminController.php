<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;

class AdminController extends ResourceController
{
    protected $format = 'json';

    /**
     * POST /api/admin/reset-database
     * Hanya Admin — reset semua data sesi, feedback, followup, dan jadwal
     * Data user dan kategori/room TIDAK dihapus
     */
    public function resetDatabase()
    {
        $userModel  = new UserModel();
        $authHeader = $this->request->getServer('HTTP_AUTHORIZATION');

        if (!$authHeader) {
            return $this->failUnauthorized('Token tidak ditemukan.');
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $user  = $userModel->where('token', $token)->first();

        if (!$user || strtolower($user['role']) !== 'admin') {
            return $this->failForbidden('Akses ditolak. Hanya Admin yang dapat melakukan reset database.');
        }

        $db = \Config\Database::connect();

        try {
            // Hapus data dalam urutan yang aman (memperhatikan foreign key)
            $db->query('DELETE FROM feedback_replies');
            $db->query('DELETE FROM feedback');
            $db->query('DELETE FROM followups');
            $db->query('DELETE FROM coaching_sessions');
            $db->query('DELETE FROM schedules');

            return $this->respond([
                'status'  => 200,
                'message' => 'Database berhasil direset. Semua data sesi, jadwal, dan feedback telah dihapus.',
            ], 200);
        } catch (\Exception $e) {
            return $this->fail('Gagal mereset database: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/admin/categories
     * Ambil semua kategori (untuk dropdown booking)
     */
    public function getCategories()
    {
        $db = \Config\Database::connect();
        $categories = $db->table('categories')->select('id, name')->orderBy('name', 'ASC')->get()->getResultArray();

        return $this->respond([
            'status'  => 200,
            'message' => 'Data kategori berhasil diambil.',
            'data'    => $categories,
        ], 200);
    }

    /**
     * GET /api/admin/rooms
     * Ambil semua ruangan (untuk dropdown booking offline)
     */
    public function getRooms()
    {
        $db = \Config\Database::connect();
        $rooms = $db->table('rooms')->select('id, name, description')->orderBy('name', 'ASC')->get()->getResultArray();

        return $this->respond([
            'status'  => 200,
            'message' => 'Data ruangan berhasil diambil.',
            'data'    => $rooms,
        ], 200);
    }
}
