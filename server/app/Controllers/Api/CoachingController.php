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

        $sessionData = [
            'schedule_id' => $scheduleId,
            'notes'       => '',
            'started_at'  => date('Y-m-d H:i:s'),
            'ended_at'    => null,
            'status'      => 'ongoing'
        ];

        if ($this->sessionModel->insert($sessionData)) {
            $sessionId = $this->sessionModel->getInsertID();

            // Update status jadwal menjadi 'ongoing'
            $this->scheduleModel->update($scheduleId, ['status' => 'ongoing']);

            return $this->respondCreated([
                'status'     => 201,
                'message'    => 'Sesi coaching berhasil dimulai.',
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
        $scheduleId = $input['session_id'] ?? null; // Frontend actually sends schedule_id
        $notes     = $input['notes'] ?? '';
        $followups = $input['followups'] ?? []; // Berupa array string dari pilihan checkbox frontend
        $isFromCoach = $input['is_from_coach'] ?? true;

        if (!$scheduleId) {
            return $this->fail('Session ID tidak ditemukan.', 400);
        }

        // 1. Ambil data sesi untuk memastikan validitas waktu started_at berdasarkan schedule_id
        $session = $this->sessionModel->where('schedule_id', $scheduleId)->first();
        if (!$session) {
            return $this->failNotFound('Sesi coaching tidak ditemukan.');
        }
        
        $sessionId = $session['id'];

        // 2. Transaksi Database
        $db = \Config\Database::connect();
        $db->transStart();

        // Update coaching_sessions
        $this->sessionModel->update($sessionId, [
            'notes'    => $notes,
            'ended_at' => date('Y-m-d H:i:s'),
            'status'   => 'done'
        ]);

        // Simpan multiple follow-up items
        if (!empty($followups) && is_array($followups)) {
            foreach ($followups as $item) {
                if (!empty(trim($item))) {
                    $this->followupModel->insert([
                        'session_id'    => $sessionId,
                        'followup_item' => $item,
                    ]);
                }
            }
        }

        // Update status di schedules menjadi 'done'
        $this->scheduleModel->update($session['schedule_id'], [
            'status' => 'done'
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