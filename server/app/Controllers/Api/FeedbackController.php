<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\FeedbackModel;
use App\Models\FeedbackReplyModel;

class FeedbackController extends ResourceController
{
    protected $feedbackModel;
    protected $replyModel;

    public function __construct()
    {
        $this->feedbackModel = new FeedbackModel();
        $this->replyModel    = new FeedbackReplyModel();
    }

    /**
     * 1. GET LIST SUPERVISI / COACH BESERTA RATA-RATA RATINGNYA
     * GET /api/feedback/supervisi
     */
    public function getSupervisiList()
    {
        // Mengambil seluruh coach yang ada di tabel feedback, dihitung rata-rata rating (bintang) nya
        $listSupervisi = $this->feedbackModel->db->table('public.feedback f')
            ->select('f.coach_id, u.name as coach_name, u.email as coach_email, u.role as coach_role, ROUND(AVG(f.rating), 2) as average_rating, COUNT(f.id) as total_feedback')
            ->join('public.users u', 'u.id = f.coach_id')
            ->groupBy('f.coach_id, u.name, u.email, u.role')
            ->orderBy('average_rating', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => 200,
            'message' => 'Berhasil mengambil daftar rating rata-rata supervisi.',
            'data' => $listSupervisi
        ], 200);
    }

    /**
     * 2. GET LIST KOMENTAR DROPDOWN PER SUPERVISI (Logika Anonim & Menampilkan Balasan HOD)
     * GET /api/feedback/comments?coach_id=3
     */
    public function getCommentsByCoach()
    {
        $coachId = $this->request->getGet('coach_id');

        if (empty($coachId)) {
            return $this->fail('ID Coach/Supervisi wajib dilampirkan.', 400);
        }

        // Ambil data feedback berdasarkan coach_id
        $feedbacks = $this->feedbackModel->db->table('public.feedback f')
            ->select('f.id as feedback_id, f.session_id, f.rating, f.comment, f.is_anonymous, f.created_at, u.name as employee_name')
            ->join('public.users u', 'u.id = f.employee_id')
            ->where('f.coach_id', $coachId)
            ->orderBy('f.created_at', 'DESC')
            ->get()
            ->getResultArray();

        // Manipulasi array untuk mengecek status is_anonymous & memasukkan nested replies
        foreach ($feedbacks as &$f) {
            // JIKA is_anonymous bernilai true, samarkan nama karyawan menjadi 'Anonymous'
            if ($f['is_anonymous'] === true || $f['is_anonymous'] === 't' || $f['is_anonymous'] == 1) {
                $f['employee_name'] = 'Anonymous';
            }

            // Ambil semua balasan (replies) dari HOD/Supervisi untuk feedback id ini
            $f['replies'] = $this->replyModel->db->table('public.feedback_replies fr')
                ->select('fr.id as reply_id, fr.reply, fr.created_at, u.name as replier_name, u.role as replier_role')
                ->join('public.users u', 'u.id = fr.replied_by')
                ->where('fr.feedback_id', $f['feedback_id'])
                ->orderBy('fr.created_at', 'ASC')
                ->get()
                ->getResultArray();
        }

        return $this->respond([
            'status' => 200,
            'message' => 'Berhasil memuat komentar dan balasan.',
            'data' => $feedbacks
        ], 200);
    }

    /**
     * 3. POST BALASAN KOMENTAR DARI HOD
     * POST /api/feedback/reply
     */
    public function sendReply()
    {
        $input = $this->request->getJSON(true);

        $scheduleId = $input['feedback_id'] ?? null; // Frontend sends schedule_id here
        $repliedBy  = $input['replied_by'] ?? null;
        $replyText  = $input['reply'] ?? null;

        if (!$scheduleId || !$repliedBy || empty(trim($replyText))) {
            return $this->fail('feedback_id, replied_by, dan isi reply tidak boleh kosong.', 400);
        }

        // Cari feedback_id yang sebenarnya berdasarkan schedule_id
        $sessionModel = new \App\Models\CoachingSessionModel();
        $session = $sessionModel->where('schedule_id', $scheduleId)->first();
        
        if (!$session) {
            return $this->failNotFound('Sesi coaching tidak ditemukan.');
        }
        
        $feedback = $this->feedbackModel->where('session_id', $session['id'])->first();
        
        if (!$feedback) {
            return $this->failNotFound('Feedback belum diberikan oleh karyawan.');
        }
        
        $feedbackId = $feedback['id'];

        $replyData = [
            'feedback_id' => $feedbackId,
            'replied_by'  => $repliedBy,
            'reply'       => $replyText,
        ];

        if ($this->replyModel->insert($replyData)) {
            return $this->respondCreated([
                'status' => 201,
                'message' => 'Berhasil mengirimkan balasan komentar karyawan.'
            ]);
        }

        return $this->fail('Gagal menyimpan balasan komentar.', 500);
    }

    /**
     * 4. POST FEEDBACK DARI KARYAWAN SETELAH SESI
     * POST /api/feedback
     */
    public function submitFeedback()
    {
        $input = $this->request->getJSON(true);

        $scheduleId  = $input['session_id']   ?? null; // Frontend sends schedule_id here
        $employeeId  = $input['employee_id']  ?? null;
        $coachId     = $input['coach_id']     ?? null;
        $rating      = $input['rating']       ?? null;
        $comment     = $input['comment']      ?? '';
        $isAnonymous = $input['is_anonymous'] ?? false;

        if (!$scheduleId || !$employeeId || !$coachId || !$rating) {
            return $this->fail('session_id, employee_id, coach_id, dan rating wajib diisi.', 400);
        }

        $sessionModel = new \App\Models\CoachingSessionModel();
        $session = $sessionModel->where('schedule_id', $scheduleId)->first();
        if (!$session) {
            return $this->failNotFound('Sesi coaching tidak ditemukan.');
        }
        $sessionId = $session['id'];

        $ratingInt = (int) $rating;
        if ($ratingInt < 1 || $ratingInt > 5) {
            return $this->fail('Rating harus berada di antara 1 hingga 5.', 400);
        }

        // Cek apakah feedback untuk sesi ini dari karyawan yang sama sudah ada
        $existing = $this->feedbackModel
            ->where('session_id', $sessionId)
            ->where('employee_id', $employeeId)
            ->first();

        if ($existing) {
            return $this->fail('Anda sudah memberikan feedback untuk sesi ini.', 400);
        }

        $feedbackData = [
            'session_id'   => $sessionId,
            'employee_id'  => $employeeId,
            'coach_id'     => $coachId,
            'rating'       => $ratingInt,
            'comment'      => $comment,
            'is_anonymous' => (bool) $isAnonymous,
        ];

        if ($this->feedbackModel->insert($feedbackData)) {
            return $this->respondCreated([
                'status'  => 201,
                'message' => 'Feedback berhasil dikirimkan. Terima kasih!'
            ]);
        }

        return $this->fail('Gagal menyimpan feedback.', 500);
    }
}