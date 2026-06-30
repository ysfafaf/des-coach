<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;
use App\Models\PasswordResetModel;

class AuthController extends ResourceController
{
    public function login()
    {
        
        $data = $this->request->getJSON(true); 
        $email = $data['email'] ?? ''; 
        $password = $data['password'] ?? ''; 

        if (empty($email) || empty($password)) { 
            return $this->fail('Email dan password wajib diisi.', 400); 
        } 

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user) { 
            return $this->failUnauthorized('Email atau password Anda salah.'); 
        } 

        if ($user['is_active'] == false) { 
            return $this->failForbidden('Akun Anda sedang dinonaktifkan. Silakan hubungi Admin.'); 
        } 

        if (!password_verify($password, $user['password_hash'])) { 
            return $this->failUnauthorized('Email atau password Anda salah.'); 
        } 

        $token = bin2hex(random_bytes(32)); 
        
        $userModel->update($user['id'], ['token' => $token]); 

        return $this->respond([ 
            'status' => 200,
            'message' => 'Login Berhasil!',
            'access_token' => $token,
            'user' => [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'role'  => $user['role'] 
            ]
        ], 200); 
    } 

    public function logout()
    {
        $token = $this->request->getHeaderLine('Authorization'); 
        $token = str_replace('Bearer ', '', $token); 

        if (empty($token)) { 
            return $this->failUnauthorized('Token tidak ditemukan.'); 
        } 

        $userModel = new UserModel();
        $user = $userModel->where('token', $token)->first();

        if ($user) { 
            $userModel->update($user['id'], ['token' => null]); 
        } 

        return $this->respond([ 
            'status' => 200,
            'message' => 'Logout berhasil. Sesi Anda telah dihapus dari sistem.'
        ], 200); 
    } 

    public function forgetPassword()
    {
        $data = $this->request->getJSON(true); 
        $email = $data['email'] ?? ''; 

        if (empty($email)) { 
            return $this->fail('Email wajib diisi.', 400); 
        } 

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user) { 
            return $this->failNotFound('Email belum terdaftar di sistem kami.'); 
        } 

        $token = bin2hex(random_bytes(32)); 

        $resetModel = new PasswordResetModel(); 
        $resetModel->insert([ 
            'user_id'    => $user['id'],
            'token'      => $token,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour')), 
            'is_used'    => false
        ]); 

        $linkReset = "http://localhost:5173/?token=" . $token; 

        $emailService = \Config\Services::email();

        $emailService->setFrom('umamikebab123@gmail.com', 'Admin DES-Coach');
        $emailService->setTo($email);
        $emailService->setSubject('Reset Password Akun DES-Coach Anda');
        
        $messageBody = "
            <h3>Halo, {$user['name']}!</h3>
            <p>Kami menerima permintaan untuk melakukan reset password pada akun DES-Coach Anda.</p>
            <p>Silakan buat password baru Anda dengan mengeklik tautan/tombol di bawah ini (Link ini berlaku selama 1 jam):</p>
            <p style='margin: 20px 0;'>
                <a href='{$linkReset}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>
                    Buat Password Baru
                </a>
            </p>
            <p>Jika tombol di atas tidak berfungsi, Anda juga dapat menyalin tautan berikut ke browser Anda:</p>
            <p style='color: #007bff;'>{$linkReset}</p>
            <br>
            <p><i>Abaikan email ini jika Anda tidak merasa melakukan permintaan ini. Jangan sebarkan email ini kepada siapa pun demi keamanan akun Anda.</i></p>
        ";

        $emailService->setMessage($messageBody);

        if (!$emailService->send()) {
            return $this->fail('Gagal mengirimkan email reset password. Pastikan pengaturan file .env SMTP Anda sudah benar.', 500);
        }

        return $this->respond([ 
            'status' => 200,
            'message' => 'Link ganti password berhasil dikirim ke Gmail Anda. Silakan cek inbox.'
        ], 200); 
    } 

    public function resetPassword()
    {
        $data = $this->request->getJSON(true); 
        $token = $data['token'] ?? ''; 
        $passwordBaru = $data['password_baru'] ?? ''; 

        if (empty($token) || empty($passwordBaru)) { 
            return $this->fail('Token dan password baru wajib diisi.', 400); 
        } 

        $resetModel = new PasswordResetModel(); 
        $resetData = $resetModel->where('token', $token)->first(); 

        // 1. Cek apakah token ada di DB 
        if (!$resetData) { 
            return $this->failNotFound('Token reset password tidak valid.'); 
        } 

        // 2. Cek is_used (Aman untuk format PostgreSQL boolean) 
        if ($resetData['is_used'] === true || $resetData['is_used'] === 't' || $resetData['is_used'] === 1 || $resetData['is_used'] === 'true') { 
            return $this->fail('Token ini sudah hangus karena telah digunakan sebelumnya.', 400); 
        } 

        // 3. Cek Kedaluwarsa Waktu 
        $waktuSekarang = date('Y-m-d H:i:s'); 
        if ($resetData['expires_at'] < $waktuSekarang) { 
            return $this->fail('Token sudah kedaluwarsa. Silakan minta link baru.', 400); 
        } 

        // 4. Update password di tabel users jika lolos validasi 
        $userModel = new UserModel(); 
        $userModel->update($resetData['user_id'], [ 
            'password_hash' => password_hash($passwordBaru, PASSWORD_BCRYPT) 
        ]); 

        // 5. Tandai token ini agar sudah terpakai (is_used jadi true) 
        $resetModel->update($resetData['id'], [ 
            'is_used' => true 
        ]); 

        return $this->respond([ 
            'status' => 200,
            'message' => 'Password baru Anda berhasil disimpan. Silakan login kembali dengan password baru!'
        ], 200); 
    } 
}