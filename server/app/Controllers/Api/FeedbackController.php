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

        $feedbackId = $input['feedback_id'] ?? null;
        $repliedBy  = $input['replied_by'] ?? null; // ID HOD yang membalas (Bisa didapat dari session/token nantinya)
        $replyText  = $input['reply'] ?? null;

        // Validasi input kosong
        if (!$feedbackId || !$repliedBy || empty(trim($replyText))) {
            return $this->fail('feedback_id, replied_by, dan isi reply tidak boleh kosong.', 400);
        }

        $replyData = [
            'feedback_id' => $feedbackId,
            'replied_by'  => $repliedBy,
            'reply'       => $replyText,
            'created_at'  => date('Y-m-d H:i:s')
        ];

        if ($this->replyModel->insert($replyData)) {
            return $this->respondCreated([
                'status' => 201,
                'message' => 'Berhasil mengirimkan balasan komentar karyawan.'
            ]);
        }

        return $this->fail('Gagal menyimpan balasan komentar.', 500);
    }
}