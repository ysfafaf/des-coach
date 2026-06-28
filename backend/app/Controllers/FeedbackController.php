<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\SessionReplyModel;

class FeedbackController extends BaseController
{
    public function index()
    {
        $db = \Config\Database::connect();
        
        // Menarik data feedback (rating dan komentar dari sesi coaching yang sudah selesai)
        $query = $db->query("
            SELECT 
                cs.id as \"sessionId\",
                cs.rating,
                cs.\"feedbackComment\",
                cs.\"isAnonymous\",
                cs.date,
                emp.name as \"employeeName\",
                coach.name as \"coachName\"
            FROM coaching_sessions cs
            JOIN app_users emp ON emp.id = cs.\"employeeId\"
            JOIN app_users coach ON coach.id = cs.\"coachId\"
            WHERE cs.status = 'Completed' AND cs.rating IS NOT NULL
            ORDER BY cs.date DESC
        ");

        $feedbacks = $query->getResultArray();

        // Menyembunyikan nama jika feedback diatur sebagai anonim
        foreach ($feedbacks as &$fb) {
            // PostgreSQL boolean di PHP bisa terbaca sebagai 't', 'f', true, atau false
            if ($fb['isAnonymous'] === 't' || $fb['isAnonymous'] === true) {
                $fb['employeeName'] = 'Anonymous';
            }
        }

        return $this->response->setJSON([
            'status' => true,
            'data'   => $feedbacks
        ]);
    }

    public function reply($sessionId)
    {
        $rules = [
            'authorId' => 'required',
            'content'  => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => false,
                'errors' => $this->validator->getErrors()
            ])->setStatusCode(400);
        }

        $json = $this->request->getJSON();
        
        $data = [
            'id'        => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)),
            'sessionId' => $sessionId,
            'authorId'  => $json->authorId ?? $this->request->getVar('authorId'),
            'content'   => $json->content ?? $this->request->getVar('content'),
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $replyModel = new SessionReplyModel();
        $replyModel->insert($data);

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Balasan berhasil dikirim.',
            'data'    => $data
        ]);
    }
}
