<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\UserModel;
use Firebase\JWT\JWT;

class AuthController extends BaseController
{
    private $jwtSecret = 'DES_COACH_DESNET_UNDIP_SECRET_KEY_2026_SECURE_PRODUCTION_KEY!';

    public function login()
    {
        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required',
            // 'captcha'  => 'required' // Dapat diaktifkan saat frontend captcha dihubungkan
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $this->validator->getErrors()
            ])->setStatusCode(400);
        }

        // Mengambil JSON payload jika request menggunakan raw JSON
        $json = $this->request->getJSON();
        $email = $json->email ?? $this->request->getVar('email');
        $password = $json->password ?? $this->request->getVar('password');

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user || !password_verify($password, $user['password'])) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Email atau password salah.'
            ])->setStatusCode(401);
        }

        $payload = [
            'iss'  => 'localhost', // Issuer
            'aud'  => 'localhost', // Audience
            'iat'  => time(),      // Issued at
            'exp'  => time() + (60 * 60 * 24), // Berlaku 24 jam
            'data' => [
                'id'    => $user['id'],
                'email' => $user['email'],
                'role'  => $user['role'],
                'name'  => $user['name']
            ]
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Login berhasil',
            'token'   => $token,
            'user'    => [
                'id'       => $user['id'],
                'name'     => $user['name'],
                'email'    => $user['email'],
                'role'     => $user['role'],
                'position' => $user['position'],
            ]
        ]);
    }

    public function forgotPassword()
    {
        $rules = [
            'email' => 'required|valid_email'
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $this->validator->getErrors()
            ])->setStatusCode(400);
        }

        $json = $this->request->getJSON();
        $email = $json->email ?? $this->request->getVar('email');
        
        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            // Sesuai PDF: alert bahwa email yang dimasukan tidak terdaftar.
            return $this->response->setJSON([
                'status'  => false,
                'message' => 'Email yang dimasukan tidak terdaftar.'
            ])->setStatusCode(404);
        }

        // TODO: Implementasi pengiriman email ke pengguna
        // Untuk sekarang kita hanya mengembalikan respon sukses

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Link ganti password terkirim ke email.'
        ]);
    }
}
