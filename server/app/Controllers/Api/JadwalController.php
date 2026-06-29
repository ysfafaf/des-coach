<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

// Import seluruh model yang kita butuhkan
use App\Models\ScheduleModel;
use App\Models\UserModel;
use App\Models\RoomModel;

class JadwalController extends ResourceController
{
    use ResponseTrait;

    /**
     * 1. LIHAT JADWAL BULANAN (Semua Role)
     * URL: GET /api/jadwal?bulan=06&tahun=2026
     */
    public function index()
    {
        $bulan = $this->request->getGet('bulan') ?? date('m');
        $tahun = $this->request->getGet('tahun') ?? date('Y');

        $scheduleModel = new ScheduleModel();

        // Menggunakan method chaining langsung dari Model, kode tetap rapi!
        $jadwal = $scheduleModel->select('schedules.*, k.name as employee_name, c.name as coach_name, cat.name as category_name, r.name as room_name')
            ->join('users k', 'k.id = schedules.employee_id', 'left')
            ->join('users c', 'c.id = schedules.coach_id', 'left')
            ->join('categories cat', 'cat.id = schedules.category_id', 'left')
            ->join('rooms r', 'r.id = schedules.room_id', 'left')
            ->where("EXTRACT(MONTH FROM schedules.scheduled_date) =", $bulan)
            ->where("EXTRACT(YEAR FROM schedules.scheduled_date) =", $tahun)
            ->orderBy('schedules.scheduled_date', 'ASC')
            ->orderBy('schedules.start_time', 'ASC')
            ->findAll(); // Menggunakan fungsi bawaan model untuk mengambil banyak data

        return $this->respond([
            'status' => 200,
            'message' => 'Data jadwal bulanan berhasil diambil.',
            'data' => $jadwal
        ]);
    }

    /**
     * 2. TAMBAH JADWAL BARU (Semua Role kecuali Admin)
     * URL: POST /api/jadwal
     */
    public function create()
    {
        $data = $this->request->getJSON(true);
        
        if (!$data) {
            return $this->fail('Data yang dikirimkan kosong.');
        }

        $roleUser      = $data['role'] ?? ''; 
        $scheduledDate = $data['scheduled_date'] ?? '';
        $startTime     = $data['start_time'] ?? '';
        $endTime       = $data['end_time'] ?? '';
        $mode          = $data['mode'] ?? ''; 
        $meetLink      = $data['meet_link'] ?? null;
        $roomId        = $data['room_id'] ?? null;

        // Validasi: Admin dilarang membuat jadwal
        if (strtolower($roleUser) === 'admin') {
            return $this->failForbidden('Admin tidak diizinkan untuk membuat jadwal coaching.');
        }

        // Validasi Aturan Waktu
        $start = strtotime($scheduledDate . ' ' . $startTime);
        $end   = strtotime($scheduledDate . ' ' . $endTime);
        
        if ($end <= $start) {
            return $this->fail('Waktu selesai harus lebih besar daripada waktu mulai.');
        }

        // Batasi Maksimal 2 Jam
        $durasiJam = ($end - $start) / 3600;
        if ($durasiJam > 2) {
            return $this->fail('Gagal! Maksimal durasi satu sesi coaching adalah 2 jam.');
        }

        // Validasi Kondisional Mode
        if ($mode === 'online' && empty($meetLink)) {
            return $this->fail('Untuk sesi Online, Link Meeting wajib diisi.');
        }
        if ($mode === 'offline' && empty($roomId)) {
            return $this->fail('Untuk sesi Offline, pilihan Ruangan wajib ditentukan.');
        }

        // Siapkan data untuk disave melalui model
        $insertData = [
          'employee_id'    => $data['employee_id'] ?? null,
          'coach_id'       => $data['coach_id'] ?? null,
          'category_id'    => $data['category_id'] ?? null,
          'topic'          => $data['topic'] ?? '',
          'scheduled_date' => $scheduledDate,
          'start_time'     => $startTime,
          'end_time'       => $endTime,
          'mode'           => $mode,
          'meet_link'      => $mode === 'online' ? $meetLink : null,
          'room_id'        => $mode === 'offline' ? $roomId : null,
          'reminder_at'    => !empty($data['reminder_at']) ? $data['reminder_at'] : null,
          'status'         => 'pending'
          // Catatan: created_at dan updated_at dihapus dari sini karena diurus otomatis oleh ScheduleModel!
        ];

        $scheduleModel = new ScheduleModel();
        $scheduleModel->insert($insertData); // Simpan via Model

        // Otomatisasi kirim notifikasi email jika karyawan membuat janji
        if (strtolower($roleUser) === 'karyawan' && !empty($insertData['coach_id'])) {
            $this->kirimEmailNotifikasi($insertData);
        }

        return $this->respondCreated([
            'status' => 201,
            'message' => 'Jadwal coaching berhasil dibuat!'
        ]);
    }

    /**
     * 3. UPDATE JADWAL (CRUD - Edit)
     * URL: PUT /api/jadwal/(:num)
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true);
        if (!$id || !$data) return $this->fail('Data atau ID tidak valid.');

        $scheduleModel = new ScheduleModel();
        $existing = $scheduleModel->find($id); // Cari menggunakan fungsi bawaan model .find()
        
        if (!$existing) return $this->failNotFound('Jadwal tidak ditemukan.');

        $updateData = [
            'topic'          => $data['topic'] ?? $existing['topic'],
            'category_id'    => $data['category_id'] ?? $existing['category_id'],
            'scheduled_date' => $data['scheduled_date'] ?? $existing['scheduled_date'],
            'start_time'     => $data['start_time'] ?? $existing['start_time'],
            'end_time'       => $data['end_time'] ?? $existing['end_time'],
            'mode'           => $data['mode'] ?? $existing['mode'],
            'meet_link'      => ($data['mode'] ?? $existing['mode']) === 'online' ? ($data['meet_link'] ?? $existing['meet_link']) : null,
            'room_id'        => ($data['mode'] ?? $existing['mode']) === 'offline' ? ($data['room_id'] ?? $existing['room_id']) : null,
        ];

        // Update data via Model (Otomatis memperbarui kolom updated_at)
        $scheduleModel->update($id, $updateData);
        return $this->respond(['message' => 'Jadwal berhasil diperbarui.']);
    }

    /**
     * 4. HAPUS JADWAL (CRUD - Delete)
     * URL: DELETE /api/jadwal/1
     */
    public function delete($id = null)
    {
        if (!$id) return $this->fail('ID tidak valid.');
        
        $scheduleModel = new ScheduleModel();
        if (!$scheduleModel->find($id)) {
            return $this->failNotFound('Jadwal tidak ditemukan.');
        }

        $scheduleModel->delete($id); // Hapus via Model
        return $this->respond(['message' => 'Jadwal berhasil dihapus.']);
    }

    /**
     * 5. LOGIKA INTERNAL PENGIRIMAN EMAIL NOTIFIKASI KE COACH (HOD/SUPERVISI)
     */
    private function kirimEmailNotifikasi($data)
    {
        $userModel = new UserModel(); // Memakai User Model
        $roomModel = new RoomModel(); // Memakai Room Model

        $karyawan = $userModel->find($data['employee_id']);
        $coach    = $userModel->find($data['coach_id']);

        if (!$coach) return;

        $timestamp = strtotime($data['scheduled_date']);
        $hariDaftar = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $hari = $hariDaftar[date('w', $timestamp)];
        
        $tanggal = date('d', $timestamp);
        $bulan   = date('m', $timestamp);
        $tahun   = date('Y', $timestamp);

        $email = \Config\Services::email();
        $email->setTo($coach['email']);
        $email->setSubject("Notifikasi Sesi Coaching Baru - " . $karyawan['name']);

        if ($data['mode'] === 'online') {
            $pesan = "
                <h3>Halo {$coach['name']},</h3>
                <p>Karyawan Anda telah menjadwalkan sesi coaching baru secara <b>ONLINE</b>.</p>
                <hr>
                <b>Detail Sesi:</b><br>
                Nama Karyawan: {$karyawan['name']}<br>
                Topik Sesi: {$data['topic']}<br>
                Hari: {$hari}<br>
                Tanggal: {$tanggal}<br>
                Bulan: {$bulan}<br>
                Tahun: {$tahun}<br>
                Jam Sesi: {$data['start_time']} s/d {$data['end_time']}<br>
                Link Teams / Meeting: <a href='{$data['meet_link']}'>{$data['meet_link']}</a>
                <hr>
                <p>Silakan bergabung ke tautan di atas saat sesi dimulai.</p>
            ";
        } else {
            // Ambil data ruangan lewat RoomModel secara elegan
            $room = $roomModel->find($data['room_id']);
            $namaRuangan = $room['name'] ?? 'Ruangan tidak terdaftar';

            $pesan = "
                <h3>Halo {$coach['name']},</h3>
                <p>Karyawan Anda telah menjadwalkan sesi coaching baru secara <b>OFFLINE</b>.</p>
                <hr>
                <b>Detail Sesi:</b><br>
                Nama Karyawan: {$karyawan['name']}<br>
                Topik Sesi: {$data['topic']}<br>
                Hari: {$hari}<br>
                Tanggal: {$tanggal}<br>
                Bulan: {$bulan}<br>
                Tahun: {$tahun}<br>
                Jam Sesi: {$data['start_time']} s/d {$data['end_time']}<br>
                Lokasi Kantor: <b>{$namaRuangan}</b>
                <hr>
                <p>Silakan menghadiri ruangan tersebut tepat waktu.</p>
            ";
        }

        $email->setMessage($pesan);
        $email->send();
    }
}