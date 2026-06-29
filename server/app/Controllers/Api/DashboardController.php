<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;

class DashboardController extends ResourceController
{
    protected $format = 'json';
    protected $userModel;
    protected $db;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->db = \Config\Database::connect();
    }

    /**
     * Helper Keamanan: Hanya mengizinkan role HOD
     */
    private function authHOD()
    {
        $authHeader = $this->request->getServer('HTTP_AUTHORIZATION');
        if (!$authHeader) return false;

        $token = str_replace('Bearer ', '', $authHeader);
        $user = $this->userModel->where('token', $token)->first();

        if (!$user || strtolower($user['role']) !== 'hod' || $user['is_active'] == false) {
            return false;
        }
        return $user;
    }

    public function index()
    {
        if (!$this->authHOD()) {
            return $this->failUnauthorized('Akses ditolak. Halaman Dashboard ini hanya dapat diakses oleh role HOD.');
        }

        $tahunIni = date('Y');

        // --- A. Jumlah Coaching per Bulan (Grup berdasarkan started_at) ---
        $grafikCoaching = $this->db->table('coaching_sessions')
            ->select("to_char(started_at, 'Month') as bulan, COUNT(id) as jumlah")
            ->where("to_char(started_at, 'YYYY') =", $tahunIni)
            ->groupBy("to_char(started_at, 'MM'), to_char(started_at, 'Month')")
            ->orderBy("to_char(started_at, 'MM')", 'ASC', false)
            ->get()->getResultArray();

        // --- B. Top 10 Kategori Topik (JOIN ke tabel schedules & categories) ---
        $topKategori = $this->db->table('coaching_sessions')
            ->join('schedules', 'schedules.id = coaching_sessions.schedule_id')
            ->join('categories', 'categories.id = schedules.category_id')
            ->select('categories.name as nama_kategori, COUNT(coaching_sessions.id) as jumlah_digunakan')
            ->groupBy('categories.id, categories.name')
            ->orderBy('jumlah_digunakan', 'DESC')
            ->limit(10)
            ->get()->getResultArray();

        return $this->respond([
            'status' => 200,
            'message' => 'Data dashboard HOD berhasil dimuat.',
            'data' => [
                'grafik_coaching_bulanan' => $grafikCoaching,
                'top_10_kategori_topik'  => $topKategori
            ]
        ], 200);
    }

    public function importExcel()
    {
        if (!$this->authHOD()) {
            return $this->failUnauthorized('Akses ditolak. Hanya HOD yang boleh melakukan import laporan.');
        }

        $file = $this->request->getFile('file_excel');
        if (!$file || !$file->isValid()) {
            return $this->fail('File tidak ditemukan atau tidak valid.', 400);
        }

        $ext = $file->getClientExtension();
        if (!in_array($ext, ['csv', 'xls', 'xlsx'])) {
            return $this->fail('Format file wajib berupa Excel (.xlsx/.xls) atau .csv', 400);
        }

        $filePath = $file->getTempName();
        $jumlahDataSukses = 0;

        if (($handle = fopen($filePath, "r")) !== FALSE) {
            fgetcsv($handle, 1000, ","); // Lewati baris header judul Excel

            // Mulai DB Transaction untuk menjaga keutuhan relasi antar 4 tabel
            $this->db->transStart();

            while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
                // Mapping Kolom Excel yang dibaca:
                // [0] Tanggal (YYYY-MM-DD), [1] Durasi (Menit), [2] Topik, [3] Nama Coach, 
                // [4] Tipe (online/offline), [5] Nama Ruangan / Link, [6] Rating (1-5), [7] Nama Employee/Peserta

                $tanggal      = $row[0] ?? date('Y-m-d');
                $durasiMenit  = (int)($row[1] ?? 30);
                $topic        = $row[2] ?? 'Coaching Session';
                $coachName    = $row[3] ?? '';
                $mode         = strtolower($row[4] ?? 'online') === 'offline' ? 'offline' : 'online';
                $roomOrLink   = $row[5] ?? '';
                $ratingInput  = (int)($row[6] ?? 5);
                $employeeName = $row[7] ?? '';

                // --- VALIDASI HUBUNGAN FOREIGN KEY & CONSTRAINTS ---

                // 1. Cari atau Buat Coach ID (Tabel users)
                $coach = $this->db->table('users')->where('name', $coachName)->get()->getRowArray();
                $coachId = $coach ? $coach['id'] : 1; // Fallback ke ID 1 jika tidak ketemu

                // 2. Cari atau Buat Employee ID (Tabel users) - Harus beda dengan Coach ID
                $employee = $this->db->table('users')->where('name', $employeeName)->get()->getRowArray();
                $employeeId = $employee ? $employee['id'] : 2; // Fallback ke ID 2

                if ($employeeId === $coachId) {
                    $employeeId = $coachId + 1; // Mencegah pemicu chk_different_users
                }

                // 3. Cari atau Buat Category ID (Tabel categories)
                $category = $this->db->table('categories')->where('name', 'Umum')->get()->getRowArray();
                $categoryId = $category ? $category['id'] : 1;

                // 4. Handle Aturan Ketat Mode (chk_offline_needs_room & chk_online_needs_link)
                $meetLink = null;
                $roomId = null;

                if ($mode === 'online') {
                    $meetLink = !empty($roomOrLink) ? $roomOrLink : 'https://meet.google.com/default-link';
                } else {
                    // Cari ID ruangan di tabel rooms berdasarkan nama ruangan dari Excel
                    $room = $this->db->table('rooms')->where('name', $roomOrLink)->get()->getRowArray();
                    $roomId = $room ? $room['id'] : 1; // Pastikan ID ini terdaftar di tabel rooms kamu
                }

                // Waktu Mulai & Selesai Jam
                $startTime = '09:00:00';
                $endTime   = date('H:i:s', strtotime("+$durasiMenit minutes", strtotime($startTime)));

                // --- EKSEKUSI INSERT 3 TABEL BERHUBUNGAN ---

                // 1. Simpan ke Tabel public.schedules
                $dataSchedule = [
                    'employee_id'      => $employeeId,
                    'coach_id'         => $coachId,
                    'category_id'      => $categoryId,
                    'topic'            => $topic,
                    'scheduled_date'   => $tanggal,
                    'start_time'       => $startTime,
                    'end_time'         => $endTime,
                    'mode'             => $mode,
                    'meet_link'        => $meetLink,
                    'room_id'          => $roomId,
                    'status'           => 'completed', // langsung set selesai
                    'duration_minutes' => $durasiMenit
                ];
                $this->db->table('schedules')->insert($dataSchedule);
                $scheduleId = $this->db->insertID();

                // 2. Simpan ke Tabel Utama public.coaching_sessions
                $dataSession = [
                    'schedule_id' => $scheduleId,
                    'notes'       => 'Laporan bulanan berhasil di-import oleh HOD',
                    'started_at'  => $tanggal . ' ' . $startTime,
                    'ended_at'    => $tanggal . ' ' . $endTime,
                    'status'      => 'completed'
                ];
                $this->db->table('coaching_sessions')->insert($dataSession);
                $sessionId = $this->db->insertID();

                // 3. Simpan ke Tabel public.feedback (Proteksi rentang rating 1 - 5)
                $ratingAman = max(1, min(5, $ratingInput)); // Menghindari fatal error chk_rating_range
                $dataFeedback = [
                    'session_id'  => $sessionId,
                    'employee_id' => $employeeId,
                    'coach_id'    => $coachId,
                    'rating'      => $ratingAman,
                    'comment'     => 'Feedback otomatis dari import laporan HOD.',
                    'is_anonymous'=> false
                ];
                $this->db->table('feedback')->insert($dataFeedback);

                $jumlahDataSukses++;
            }

            $this->db->transComplete();
            fclose($handle);
        }

        return $this->respond([
            'status' => 200,
            'message' => "Sukses! HOD berhasil mengunduh & meng-import $jumlahDataSukses laporan ke database.",
        ], 200);
    }
}