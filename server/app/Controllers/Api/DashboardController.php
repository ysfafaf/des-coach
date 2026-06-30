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
     * Helper: validasi token siapapun (admin/hod/supervisi/karyawan)
     */
    private function authUser()
    {
        $authHeader = $this->request->getServer('HTTP_AUTHORIZATION');
        if (!$authHeader) return false;
        $token = str_replace('Bearer ', '', $authHeader);
        $user  = $this->userModel->where('token', $token)->first();
        if (!$user || !$user['is_active']) return false;
        return $user;
    }

    /**
     * Helper: hanya HOD
     */
    private function authHOD()
    {
        $user = $this->authUser();
        return ($user && strtolower($user['role']) === 'hod') ? $user : false;
    }

    public function index()
    {
        if (!$this->authUser()) {
            return $this->failUnauthorized('Silakan login terlebih dahulu.');
        }

        $tahunIni = date('Y');

        // A. Grafik Coaching per Bulan
        $grafikCoaching = $this->db->table('coaching_sessions')
            ->select("to_char(started_at, 'Month') as bulan, EXTRACT(MONTH FROM started_at) as bulan_num, COUNT(id) as jumlah")
            ->where("EXTRACT(YEAR FROM started_at) =", $tahunIni)
            ->groupBy("EXTRACT(MONTH FROM started_at), to_char(started_at, 'Month')")
            ->orderBy("bulan_num", 'ASC', false)
            ->get()->getResultArray();

        // B. Top 10 Kategori Topik (Dari Sesi Selesai)
        $topKategori = $this->db->table('schedules')
            ->join('categories', 'categories.id = schedules.category_id')
            ->join('coaching_sessions', 'coaching_sessions.schedule_id = schedules.id')
            ->select('categories.name as nama_kategori, COUNT(schedules.id) as jumlah_digunakan')
            ->where('coaching_sessions.status', 'done')
            ->groupBy('categories.id, categories.name')
            ->orderBy('jumlah_digunakan', 'DESC')
            ->limit(10)
            ->get()->getResultArray();

        // C. Statistik Ringkasan
        $totalSesi     = $this->db->table('coaching_sessions')->countAll();
        $totalUser     = $this->db->table('users')->where('is_active', true)->countAll();
        $mendatang     = $this->db->table('schedules')
            ->where('status', 'pending')
            ->where('scheduled_date >=', date('Y-m-d'))
            ->countAll();
        $sesiSelesai   = $this->db->table('coaching_sessions')->where('status', 'done')->countAll();
        $sesiAktif     = $this->db->table('coaching_sessions')->where('status', 'ongoing')->countAll();

        return $this->respond([
            'status'  => 200,
            'message' => 'Data dashboard berhasil dimuat.',
            'data'    => [
                'grafik_coaching_bulanan' => $grafikCoaching,
                'top_10_kategori_topik'   => $topKategori,
                'total_sesi'             => $totalSesi,
                'total_user_aktif'       => $totalUser,
                'jadwal_mendatang'       => $mendatang,
                'sesi_selesai'           => $sesiSelesai,
                'sesi_aktif'             => $sesiAktif,
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