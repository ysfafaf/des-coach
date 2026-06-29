<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ScheduleModel;
use App\Models\CoachingSessionModel;
use App\Models\FollowupModel;

class CoachingController extends ResourceController
{
    protected $scheduleModel;
    protected $sessionModel;
    protected $followupModel;

    public function __construct()
    {
        $this->scheduleModel = new ScheduleModel();
        $this->sessionModel  = new CoachingSessionModel();
        $this->followupModel = new FollowupModel();
    }

    /**
     * 1. MENAMPILKAN DAFTAR KARYAWAN YANG AKAN COACHING DENGAN COACH INI
     * GET /api/coaching/antrean?coach_id=3
     */
    public function getAntrean()
    {
        // Di dunia nyata, coach_id diambil dari token login. 
        // Untuk testing, kita ambil dari query param / request parameter.
        $coachId = $this->request->getGet('coach_id');

        if (empty($coachId)) {
            return $this->fail('ID Coach wajib dikirimkan.', 400);
        }

        // Mengambil jadwal aktif yang BELUM memiliki sesi coaching selesai (ended_at null)
        // Kita gunakan LEFT JOIN sesuai struktur di reset.txt
        $daftarAntrean = $this->scheduleModel->db->table('public.schedules s')
            ->select('s.id as schedule_id, s.topic, s.scheduled_date, s.start_time, s.end_time, s.mode, s.meet_link, r.name as room_name, u.name as employee_name, u.email as employee_email, cs.id as active_session_id, cs.status as session_status')
            ->join('public.users u', 'u.id = s.employee_id')
            ->join('public.rooms r', 'r.id = s.room_id', 'left')
            ->join('public.coaching_sessions cs', 'cs.schedule_id = s.id', 'left')
            ->where('s.coach_id', $coachId)
            ->where('cs.ended_at', null) // Sesi belum berakhir atau belum dimulai
            ->orderBy('s.scheduled_date', 'ASC')
            ->orderBy('s.start_time', 'ASC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => 200,
            'message' => 'Berhasil mengambil list antrean coaching.',
            'data' => $daftarAntrean
        ], 200);
    }

    /**
     * 2. TOMBOL MULAI COACHING (Membuat Baris Baru di coaching_sessions)
     * POST /api/coaching/start
     */
    public function startCoaching()
    {
        $input = $this->request->getJSON(true);
        $scheduleId = $input['schedule_id'] ?? null;

        if (!$scheduleId) {
            return $this->fail('Schedule ID wajib diisi untuk memulai sesi.', 400);
        }

        // Cek apakah jadwal ini sudah pernah dimulai sebelumnya (karena 1-to-1 unique constraint)
        $existing = $this->sessionModel->where('schedule_id', $scheduleId)->first();
        if ($existing) {
            return $this->respond([
                'status' => 200,
                'message' => 'Sesi coaching sudah pernah dimulai sebelumnya.',
                'session_id' => $existing['id']
            ], 200);
        }

        // Data insert baru sesuai constraint database (started_at diisi waktu sekarang, ended_at null)
        $sessionData = [
            'schedule_id' => $scheduleId,
            'notes'       => '', // Default kosong, diisi saat proses ongoing / end
            'started_at'  => date('Y-m-d H:i:s'),
            'ended_at'    => null,
            'status'      => 'ongoing' // Menyesuaikan nilai default enum dari database kamu
        ];

        if ($this->sessionModel->insert($sessionData)) {
            $sessionId = $this->sessionModel->getInsertID();
            return $this->respondCreated([
                'status' => 210,
                'message' => 'Sesi coaching berhasil dimulai.',
                'session_id' => $sessionId
            ]);
        }

        return $this->fail('Gagal memulai sesi coaching.', 500);
    }

    /**
     * 3. TOMBOL END COACHING (Menyimpan Catatan, Follow-up, & Mengakhiri Sesi)
     * POST /api/coaching/end
     */
    public function endCoaching()
    {
        $input = $this->request->getJSON(true);
        $sessionId = $input['session_id'] ?? null;
        $notes     = $input['notes'] ?? '';
        $followups = $input['followups'] ?? []; // Berupa array string dari pilihan checkbox frontend
        $isFromCoach = $input['is_from_coach'] ?? true;

        if (!$sessionId) {
            return $this->fail('Session ID tidak ditemukan.', 400);
        }

        // 1. Ambil data sesi untuk memastikan validitas waktu started_at
        $session = $this->sessionModel->find($sessionId);
        if (!$session) {
            return $this->failNotFound('Sesi coaching tidak ditemukan.');
        }

        // 2. Transaksi Database agar aman saat input bercabang (Sesi & Follow-up)
        $db = \Config\Database::connect();
        $db->transStart();

        // Update Tabel coaching_sessions (Mengisi notes & mengeset ended_at > started_at)
        $this->sessionModel->update($sessionId, [
            'notes'    => $notes,
            'ended_at' => date('Y-m-d H:i:s'), // Lolos constraint chk_session_time
            'status'   => 'ongoing' // Sesuaikan jika ada status 'completed' di enum database kamu
        ]);

        // Simpan multiple follow-up items jika ada checklist yang terpilih
        if (!empty($followups) && is_array($followups)) {
            foreach ($followups as $item) {
                if (!empty($item)) {
                    $this->followupModel->insert([
                        'session_id'    => $sessionId,
                        'followup_item' => $item,
                        'is_from_coach' => $isFromCoach
                    ]);
                }
            }
        }

        // Otomatis ubah status di tabel schedules menjadi selesai/diarsipkan (jika diperlukan)
        // Agar rekor ini menghilang dari list antrean dan berpindah ke history page
        $this->scheduleModel->update($session['schedule_id'], [
            'status' => 'pending' // Kamu bisa mengubah status schedule di sini ke enum selesai jika ada, misal 'completed'
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('Terjadi kesalahan saat menyimpan data akhir coaching.', 500);
        }

        return $this->respond([
            'status' => 200,
            'message' => 'Sesi coaching telah sukses diselesaikan dan dipindahkan ke History!',
        ], 200);
    }
}