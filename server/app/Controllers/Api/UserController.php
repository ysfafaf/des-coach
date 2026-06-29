<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;

class UserController extends ResourceController
{
    protected $format = 'json';
    protected $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    /**
     * Helper untuk mengambil data user berdasarkan Bearer Token
     */
    private function getUserByToken()
    {
        $authHeader = $this->request->getServer('HTTP_AUTHORIZATION');
        if (!$authHeader) {
            return false;
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $user = $this->userModel->where('token', $token)->first();

        // Pastikan user ada dan statusnya aktif
        if (!$user || $user['is_active'] == false) {
            return false;
        }

        return $user;
    }

    public function index()
    {
        $currentUser = $this->getUserByToken();

        // Validasi: Harus login, dan rolenya wajib 'Admin' ATAU 'HOD'
        if (!$currentUser || !in_array(strtolower($currentUser['role']), ['admin', 'hod'])) {
            return $this->failUnauthorized('Akses ditolak. Hanya Admin dan HOD yang dapat melihat data ini.');
        }

        // Ambil semua data user, sembunyikan password_hash demi keamanan
        $users = $this->userModel->select('id, name, email, role, is_active, created_at')->findAll();
        
        return $this->respond([
            'status' => 200,
            'message' => 'Data pengguna berhasil diambil.',
            'diakses_oleh_role' => $currentUser['role'],
            'data' => $users
        ], 200);
    }


    public function create()
    {
        $currentUser = $this->getUserByToken();
        if (!$currentUser || strtolower($currentUser['role']) !== 'admin') {
            return $this->failUnauthorized('Akses ditolak. Hanya Admin yang dapat menambah pengguna.');
        }

        $data = $this->request->getJSON(true);
        
        if (empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            return $this->fail('Data nama, email, password, dan role wajib diisi.', 400);
        }

        if ($this->userModel->where('email', $data['email'])->first()) {
            return $this->fail('Email sudah digunakan oleh akun lain.', 400);
        }

        $this->userModel->insert([
            'name'          => $data['name'] ?? 'User Baru',
            'email'         => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role'          => $data['role'], 
            'is_active'     => $data['is_active'] ?? true
        ]);

        return $this->respondCreated([
            'status' => 201,
            'message' => 'Akun pengguna baru berhasil dibuat!'
        ]);
    }

    public function update($id = null)
    {
        $currentUser = $this->getUserByToken();
        if (!$currentUser || strtolower($currentUser['role']) !== 'admin') {
            return $this->failUnauthorized('Akses ditolak. Hanya Admin yang dapat mengubah data.');
        }

        $user = $this->userModel->find($id);
        if (!$user) {
            return $this->failNotFound('Pengguna tidak ditemukan.');
        }

        $data = $this->request->getJSON(true);
        $updateData = [];
        if (!empty($data['name'])) $updateData['name'] = $data['name'];
        if (!empty($data['role'])) $updateData['role'] = $data['role'];
        if (isset($data['is_active'])) $updateData['is_active'] = $data['is_active'];
        
        if (!empty($data['password'])) {
            $updateData['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (empty($updateData)) {
            return $this->fail('Tidak ada data yang diubah.', 400);
        }

        $this->userModel->update($id, $updateData);

        return $this->respond([
            'status' => 200,
            'message' => "Data pengguna dengan ID $id berhasil diperbarui."
        ], 200);
    }

    public function delete($id = null)
    {
        $currentUser = $this->getUserByToken();
        if (!$currentUser || strtolower($currentUser['role']) !== 'admin') {
            return $this->failUnauthorized('Akses ditolak. Hanya Admin yang dapat menghapus pengguna.');
        }

        $user = $this->userModel->find($id);
        if (!$user) {
            return $this->failNotFound('Pengguna tidak ditemukan.');
        }

        $this->userModel->delete($id);

        return $this->respond([
            'status' => 200,
            'message' => "Akun pengguna dengan ID $id berhasil dihapus dari sistem."
        ], 200);
    }
}